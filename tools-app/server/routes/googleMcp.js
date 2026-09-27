import { Router } from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import { encryptText } from '../utils/crypto.js';
import {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  getGoogleUserEmail,
  getValidAccessToken,
  getSearchConsoleSites,
  querySearchConsole,
  inspectSearchConsoleUrl,
  getGa4Properties,
  queryGa4Traffic,
  queryGa4Realtime
} from '../utils/googleAuth.js';

const router = Router();

/**
 * Extracts and validates the MCP key from request headers or query params.
 */
function extractMcpKey(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1].trim();
  }
  const customHeader = req.headers['x-cerilas-key'];
  if (customHeader) {
    return String(customHeader).trim();
  }
  if (req.query.key) {
    return String(req.query.key).trim();
  }
  return null;
}

/**
 * Initiates the Google OAuth 2.0 authorization redirect.
 */
const handleAuth = (req, res) => {
  try {
    const returnTo = req.query.returnTo || '/#/tool/google-marketing-mcp';
    const authUrl = getGoogleAuthUrl(returnTo);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Google auth initiation error:', error);
    res.status(500).json({ error: error.message });
  }
};

router.get('/auth', handleAuth);
router.get('/google/auth', handleAuth);

/**
 * Handles the OAuth 2.0 redirect callback from Google.
 */
const handleCallback = async (req, res) => {
  const { code, error, state } = req.query;

  const redirectBase = '/#/tool/google-marketing-mcp';

  if (error) {
    console.warn('Google OAuth denied or returned error:', error);
    return res.redirect(`${redirectBase}?status=error&message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${redirectBase}?status=error&message=No+authorization+code+received`);
  }

  try {
    // 1. Exchange code for access & refresh tokens
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      console.warn('Google did not return a refresh_token. User may need to revoke prior consent.');
    }

    // 2. Fetch user's email
    const email = await getGoogleUserEmail(tokens.access_token);

    // 3. Encrypt refresh token
    const encryptedRefresh = tokens.refresh_token ? encryptText(tokens.refresh_token) : null;
    const expiresAt = Date.now() + (tokens.expires_in || 3600) * 1000;

    // 4. Fetch available sites & properties to auto-select defaults
    let defaultGscSite = null;
    let defaultGa4Prop = null;
    try {
      const sites = await getSearchConsoleSites(tokens.access_token);
      if (sites.length > 0) defaultGscSite = sites[0].siteUrl;

      const props = await getGa4Properties(tokens.access_token);
      if (props.length > 0) defaultGa4Prop = props[0].propertyId;
    } catch (e) {
      console.warn('Could not auto-fetch properties during OAuth:', e.message);
    }

    // 5. Check if user already exists
    const existing = await pool.query(
      'SELECT id, mcp_key, refresh_token_encrypted FROM mcp_user_connections WHERE user_email = $1',
      [email]
    );

    let mcpKey;
    if (existing.rows.length > 0) {
      mcpKey = existing.rows[0].mcp_key;
      // Update with new tokens
      const newEncrypted = encryptedRefresh || existing.rows[0].refresh_token_encrypted;
      await pool.query(
        `UPDATE mcp_user_connections 
         SET refresh_token_encrypted = $1, access_token_cached = $2, token_expires_at = $3, 
             selected_gsc_site = COALESCE(selected_gsc_site, $4), 
             selected_ga4_property = COALESCE(selected_ga4_property, $5),
             updated_at = NOW() 
         WHERE id = $6`,
        [newEncrypted, tokens.access_token, expiresAt, defaultGscSite, defaultGa4Prop, existing.rows[0].id]
      );
    } else {
      // Generate new MCP key
      mcpKey = `cr_mcp_live_${crypto.randomBytes(14).toString('hex')}`;
      await pool.query(
        `INSERT INTO mcp_user_connections 
         (user_email, mcp_key, refresh_token_encrypted, access_token_cached, token_expires_at, selected_gsc_site, selected_ga4_property)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [email, mcpKey, encryptedRefresh || '', tokens.access_token, expiresAt, defaultGscSite, defaultGa4Prop]
      );
    }

    // Redirect to frontend with key and email
    res.redirect(`${redirectBase}?status=connected&key=${mcpKey}&email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error('Google OAuth callback processing error:', err);
    res.redirect(`${redirectBase}?status=error&message=${encodeURIComponent(err.message)}`);
  }
};

router.get('/callback', handleCallback);
router.get('/google/callback', handleCallback);

/**
 * Checks the connection status and lists available Google properties.
 */
router.get('/status', async (req, res) => {
  const mcpKey = extractMcpKey(req);
  if (!mcpKey) {
    return res.status(401).json({ connected: false, error: 'No MCP key provided' });
  }

  try {
    const { accessToken, userEmail, selectedGscSite, selectedGa4Property } = await getValidAccessToken(mcpKey);

    // Fetch verified sites and GA4 properties
    let gscSites = [];
    let ga4Properties = [];

    try {
      gscSites = await getSearchConsoleSites(accessToken);
    } catch (e) {
      console.warn('GSC fetch error:', e.message);
    }

    try {
      ga4Properties = await getGa4Properties(accessToken);
    } catch (e) {
      console.warn('GA4 fetch error:', e.message);
    }

    res.json({
      connected: true,
      email: userEmail,
      selectedGscSite: selectedGscSite || (gscSites[0]?.siteUrl || null),
      selectedGa4Property: selectedGa4Property || (ga4Properties[0]?.propertyId || null),
      gscSites: gscSites.map((s) => s.siteUrl),
      ga4Properties
    });
  } catch (err) {
    res.status(401).json({ connected: false, error: err.message });
  }
});

/**
 * Updates selected Google properties for an MCP key.
 */
router.post('/select-property', async (req, res) => {
  const mcpKey = extractMcpKey(req);
  if (!mcpKey) {
    return res.status(401).json({ error: 'Unauthorized: Missing MCP key' });
  }

  const { selectedGscSite, selectedGa4Property } = req.body;

  try {
    await pool.query(
      `UPDATE mcp_user_connections 
       SET selected_gsc_site = COALESCE($1, selected_gsc_site),
           selected_ga4_property = COALESCE($2, selected_ga4_property),
           updated_at = NOW()
       WHERE mcp_key = $3`,
      [selectedGscSite, selectedGa4Property, mcpKey]
    );

    res.json({ success: true, selectedGscSite, selectedGa4Property });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Revokes and deletes the MCP connection.
 */
router.post('/revoke', async (req, res) => {
  const mcpKey = extractMcpKey(req);
  if (!mcpKey) {
    return res.status(400).json({ error: 'Missing MCP key' });
  }

  try {
    await pool.query('DELETE FROM mcp_user_connections WHERE mcp_key = $1', [mcpKey]);
    res.json({ success: true, message: 'Google connection revoked and key deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   REST API Endpoints (For ChatGPT Custom Actions & HTTP Clients)
   ========================================================================== */

/**
 * Search Console Search Analytics Query.
 */
router.get('/gsc/search-analytics', async (req, res) => {
  const mcpKey = extractMcpKey(req);
  if (!mcpKey) return res.status(401).json({ error: 'Unauthorized: Valid MCP Key required' });

  try {
    const { accessToken, selectedGscSite } = await getValidAccessToken(mcpKey);
    const siteUrl = req.query.siteUrl || selectedGscSite;

    if (!siteUrl) {
      return res.status(400).json({ error: 'No Google Search Console site configured or provided.' });
    }

    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      rowLimit: req.query.rowLimit,
      dimensions: req.query.dimensions ? String(req.query.dimensions).split(',') : ['query']
    };

    const results = await querySearchConsole(accessToken, siteUrl, options);
    res.json({ status: 'success', data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Search Console URL Inspection.
 */
router.get('/gsc/inspect-url', async (req, res) => {
  const mcpKey = extractMcpKey(req);
  if (!mcpKey) return res.status(401).json({ error: 'Unauthorized: Valid MCP Key required' });

  const inspectionUrl = req.query.url;
  if (!inspectionUrl) return res.status(400).json({ error: 'Query parameter "url" is required.' });

  try {
    const { accessToken, selectedGscSite } = await getValidAccessToken(mcpKey);
    const siteUrl = req.query.siteUrl || selectedGscSite;

    const inspection = await inspectSearchConsoleUrl(accessToken, siteUrl, inspectionUrl);
    res.json({ status: 'success', data: inspection });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Google Analytics 4 Traffic Overview Report.
 */
router.get('/ga4/traffic', async (req, res) => {
  const mcpKey = extractMcpKey(req);
  if (!mcpKey) return res.status(401).json({ error: 'Unauthorized: Valid MCP Key required' });

  try {
    const { accessToken, selectedGa4Property } = await getValidAccessToken(mcpKey);
    const propertyId = req.query.propertyId || selectedGa4Property;

    if (!propertyId) {
      return res.status(400).json({ error: 'No Google Analytics 4 Property ID configured or provided.' });
    }

    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const report = await queryGa4Traffic(accessToken, propertyId, options);
    res.json({ status: 'success', data: report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Google Analytics 4 Real-time Visitors.
 */
router.get('/ga4/realtime', async (req, res) => {
  const mcpKey = extractMcpKey(req);
  if (!mcpKey) return res.status(401).json({ error: 'Unauthorized: Valid MCP Key required' });

  try {
    const { accessToken, selectedGa4Property } = await getValidAccessToken(mcpKey);
    const propertyId = req.query.propertyId || selectedGa4Property;

    if (!propertyId) {
      return res.status(400).json({ error: 'No Google Analytics 4 Property ID configured or provided.' });
    }

    const realtime = await queryGa4Realtime(accessToken, propertyId);
    res.json({ status: 'success', data: realtime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   Model Context Protocol (MCP) Server-Sent Events (SSE) Stream
   (For Claude Desktop, Cursor, Windsurf, Antigravity)
   ========================================================================== */

router.get('/sse', async (req, res) => {
  const mcpKey = extractMcpKey(req);
  if (!mcpKey) {
    return res.status(401).send('Unauthorized: Valid MCP Key required as ?key=... parameter');
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial MCP endpoint declaration event
  const sessionId = crypto.randomUUID();
  res.write(`event: endpoint\ndata: /api/mcp/messages?sessionId=${sessionId}&key=${mcpKey}\n\n`);

  const keepAliveInterval = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
  });
});

/**
 * Handles incoming JSON-RPC 2.0 messages from MCP clients.
 */
router.post('/messages', async (req, res) => {
  const mcpKey = extractMcpKey(req);
  const message = req.body;

  if (!mcpKey || !message) {
    return res.status(400).json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: null });
  }

  try {
    const { id, method, params } = message;

    // 1. Initialize MCP Protocol
    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'cerilas-google-marketing-mcp',
            version: '1.0.0'
          },
          capabilities: {
            tools: {}
          }
        }
      });
    }

    // 2. Tools List Declaration
    if (method === 'tools/list') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'gsc_get_search_analytics',
              description: 'Fetch organic search queries, clicks, impressions, CTR, and average position from Google Search Console.',
              inputSchema: {
                type: 'object',
                properties: {
                  startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format (defaults to 28 days ago)' },
                  endDate: { type: 'string', description: 'End date in YYYY-MM-DD format (defaults to yesterday)' },
                  rowLimit: { type: 'number', description: 'Number of rows to return (max 100)' },
                  dimensions: { type: 'array', items: { type: 'string' }, description: 'Dimensions: query, page, country, device' }
                }
              }
            },
            {
              name: 'gsc_inspect_url',
              description: 'Inspect live Google index coverage, canonical URL, and mobile usability for a given page URL.',
              inputSchema: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: 'The absolute URL to inspect' }
                },
                required: ['url']
              }
            },
            {
              name: 'ga4_get_traffic_acquisition',
              description: 'Get Google Analytics 4 traffic channels, session volume, active users, bounce rate, and average session duration.',
              inputSchema: {
                type: 'object',
                properties: {
                  startDate: { type: 'string', description: 'Start date (e.g. 30daysAgo, 7daysAgo, or YYYY-MM-DD)' },
                  endDate: { type: 'string', description: 'End date (e.g. yesterday, today, or YYYY-MM-DD)' }
                }
              }
            },
            {
              name: 'ga4_get_realtime_users',
              description: 'Get real-time active user counts and currently viewed pages right now in Google Analytics 4.',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        }
      });
    }

    // 3. Tool Execution
    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      const { accessToken, selectedGscSite, selectedGa4Property } = await getValidAccessToken(mcpKey);

      let textOutput = '';

      if (toolName === 'gsc_get_search_analytics') {
        const siteUrl = toolArgs.siteUrl || selectedGscSite;
        if (!siteUrl) throw new Error('No Search Console site configured');
        const resData = await querySearchConsole(accessToken, siteUrl, toolArgs);
        textOutput = JSON.stringify(resData, null, 2);
      } else if (toolName === 'gsc_inspect_url') {
        const siteUrl = toolArgs.siteUrl || selectedGscSite;
        const resData = await inspectSearchConsoleUrl(accessToken, siteUrl, toolArgs.url);
        textOutput = JSON.stringify(resData, null, 2);
      } else if (toolName === 'ga4_get_traffic_acquisition') {
        const propId = toolArgs.propertyId || selectedGa4Property;
        if (!propId) throw new Error('No GA4 property configured');
        const resData = await queryGa4Traffic(accessToken, propId, toolArgs);
        textOutput = JSON.stringify(resData, null, 2);
      } else if (toolName === 'ga4_get_realtime_users') {
        const propId = toolArgs.propertyId || selectedGa4Property;
        if (!propId) throw new Error('No GA4 property configured');
        const resData = await queryGa4Realtime(accessToken, propId);
        textOutput = JSON.stringify(resData, null, 2);
      } else {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: textOutput
            }
          ]
        }
      });
    }

    res.json({ jsonrpc: '2.0', id, result: {} });
  } catch (err) {
    console.error('MCP message execution error:', err);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: { code: -32000, message: err.message }
    });
  }
});

export default router;
