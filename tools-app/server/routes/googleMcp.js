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

    // Check if flow was initiated by ChatGPT OAuth
    if (state && String(state).startsWith('cerilas_oauth_')) {
      const stateId = String(state).replace('cerilas_oauth_', '');
      const stateQuery = await pool.query(
        'SELECT * FROM mcp_oauth_states WHERE state_id = $1 AND expires_at > NOW()',
        [stateId]
      );

      if (stateQuery.rows.length > 0) {
        const oauthState = stateQuery.rows[0];
        const authCode = `cr_code_${crypto.randomBytes(24).toString('hex')}`;
        const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
          `INSERT INTO mcp_oauth_codes 
           (code, mcp_key, client_id, redirect_uri, code_challenge, code_challenge_method, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            authCode,
            mcpKey,
            oauthState.client_id,
            oauthState.redirect_uri,
            oauthState.code_challenge,
            oauthState.code_challenge_method,
            codeExpiresAt
          ]
        );

        await pool.query('DELETE FROM mcp_oauth_states WHERE state_id = $1', [stateId]);

        const targetUrl = new URL(oauthState.redirect_uri);
        targetUrl.searchParams.set('code', authCode);
        if (oauthState.chatgpt_state) {
          targetUrl.searchParams.set('state', oauthState.chatgpt_state);
        }
        return res.redirect(targetUrl.toString());
      }
    }

    // Default: Redirect to frontend with key and email
    res.redirect(`${redirectBase}?status=connected&key=${mcpKey}&email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error('Google OAuth callback processing error:', err);
    res.redirect(`${redirectBase}?status=error&message=${encodeURIComponent(err.message)}`);
  }
};

router.get('/callback', handleCallback);
router.get('/google/callback', handleCallback);
router.get('/google/auth/callback', handleCallback);
router.get('/auth/callback', handleCallback);

/**
 * OAuth 2.0 Authorization Server Discovery (RFC 8414 & OpenID Connect).
 */
export const handleOAuthDiscovery = (req, res) => {
  const host = req.get('host') || 'tools.cerilas.com';
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const origin = `${proto}://${host}`;

  res.json({
    issuer: origin,
    authorization_endpoint: `${origin}/api/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    userinfo_endpoint: `${origin}/api/oauth/userinfo`,
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256', 'plain'],
    scopes_supported: ['marketing', 'offline_access', 'openid', 'email', 'profile']
  });
};

/**
 * OAuth 2.0 Authorize Endpoint.
 * ChatGPT redirects user here to begin authentication.
 */
export const handleOAuthAuthorize = async (req, res) => {
  try {
    const {
      response_type,
      client_id,
      redirect_uri,
      state: chatgpt_state,
      code_challenge,
      code_challenge_method,
      scope
    } = req.query;

    if (!redirect_uri) {
      return res.status(400).send('Missing redirect_uri in OAuth authorize request');
    }

    const stateId = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await pool.query(
      `INSERT INTO mcp_oauth_states 
       (state_id, client_id, redirect_uri, chatgpt_state, code_challenge, code_challenge_method, scope, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        stateId,
        client_id || 'chatgpt',
        redirect_uri,
        chatgpt_state || '',
        code_challenge || null,
        code_challenge_method || null,
        scope || 'marketing',
        expiresAt
      ]
    );

    // Redirect user to Google OAuth with our stateId
    const googleAuthUrl = getGoogleAuthUrl(`cerilas_oauth_${stateId}`);
    return res.redirect(googleAuthUrl);
  } catch (err) {
    console.error('OAuth authorization endpoint error:', err);
    return res.status(500).send('OAuth authorization initialization error: ' + err.message);
  }
};

/**
 * OAuth 2.0 Token Endpoint.
 * ChatGPT backend calls this to exchange authorization code for access token.
 */
export const handleOAuthToken = async (req, res) => {
  try {
    const body = req.body || {};
    const query = req.query || {};
    const grantType = body.grant_type || query.grant_type;
    const code = body.code || query.code;
    const codeVerifier = body.code_verifier || query.code_verifier;
    const refreshToken = body.refresh_token || query.refresh_token;

    if (grantType === 'refresh_token') {
      if (!refreshToken) {
        return res.status(400).json({ error: 'invalid_request', error_description: 'Missing refresh_token' });
      }

      const user = await pool.query(
        'SELECT mcp_key FROM mcp_user_connections WHERE mcp_key = $1',
        [refreshToken]
      );

      if (user.rows.length === 0) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid refresh_token' });
      }

      return res.json({
        access_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 31536000,
        refresh_token: refreshToken,
        scope: 'marketing'
      });
    }

    if (grantType === 'authorization_code') {
      if (!code) {
        return res.status(400).json({ error: 'invalid_request', error_description: 'Missing authorization code' });
      }

      const codeQuery = await pool.query(
        'SELECT * FROM mcp_oauth_codes WHERE code = $1',
        [code]
      );

      if (codeQuery.rows.length === 0) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code not found or expired' });
      }

      const authCode = codeQuery.rows[0];

      if (authCode.used) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code has already been used' });
      }

      if (new Date(authCode.expires_at) < new Date()) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code has expired' });
      }

      // Validate PKCE if challenge exists
      if (authCode.code_challenge) {
        if (!codeVerifier) {
          return res.status(400).json({ error: 'invalid_grant', error_description: 'Missing code_verifier for PKCE validation' });
        }
        let calculated;
        if (authCode.code_challenge_method === 'S256') {
          calculated = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
        } else {
          calculated = codeVerifier;
        }

        if (calculated !== authCode.code_challenge) {
          return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid PKCE code_verifier' });
        }
      }

      // Mark code as used
      await pool.query('UPDATE mcp_oauth_codes SET used = TRUE WHERE code = $1', [code]);

      return res.json({
        access_token: authCode.mcp_key,
        token_type: 'Bearer',
        expires_in: 31536000,
        refresh_token: authCode.mcp_key,
        scope: 'marketing'
      });
    }

    return res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'Supported grant_type: authorization_code, refresh_token'
    });
  } catch (err) {
    console.error('OAuth token endpoint error:', err);
    return res.status(500).json({ error: 'server_error', error_description: err.message });
  }
};

export const handleOAuthUserinfo = async (req, res) => {
  const mcpKey = extractMcpKey(req);
  if (!mcpKey) {
    return res.status(401).json({ error: 'Unauthorized: Missing MCP key' });
  }

  try {
    const user = await pool.query(
      'SELECT user_email FROM mcp_user_connections WHERE mcp_key = $1',
      [mcpKey]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      sub: mcpKey,
      email: user.rows[0].user_email,
      email_verified: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/oauth/authorize', handleOAuthAuthorize);
router.post('/oauth/token', handleOAuthToken);
router.get('/oauth/token', handleOAuthToken);
router.get('/oauth/userinfo', handleOAuthUserinfo);
router.get('/.well-known/oauth-authorization-server', handleOAuthDiscovery);
router.get('/.well-known/openid-configuration', handleOAuthDiscovery);

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
    let ga4Error = null;

    try {
      gscSites = await getSearchConsoleSites(accessToken);
    } catch (e) {
      console.warn('GSC fetch error:', e.message);
    }

    try {
      ga4Properties = await getGa4Properties(accessToken);
    } catch (e) {
      console.warn('GA4 fetch error:', e.message);
      ga4Error = e.message;
    }

    res.json({
      connected: true,
      email: userEmail,
      selectedGscSite: selectedGscSite || (gscSites[0]?.siteUrl || null),
      selectedGa4Property: selectedGa4Property || (ga4Properties[0]?.propertyId || null),
      gscSites: gscSites.map((s) => s.siteUrl),
      ga4Properties,
      ga4Error
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

/**
 * List all accessible Google Search Console sites.
 */
router.get('/gsc/sites', async (req, res) => {
  const mcpKey = extractMcpKey(req);
  if (!mcpKey) return res.status(401).json({ error: 'Unauthorized: Valid MCP Key required' });

  try {
    const { accessToken } = await getValidAccessToken(mcpKey);
    const sites = await getSearchConsoleSites(accessToken);
    res.json({ status: 'success', data: sites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * List all accessible Google Analytics 4 accounts and properties.
 */
router.get('/ga4/properties', async (req, res) => {
  const mcpKey = extractMcpKey(req);
  if (!mcpKey) return res.status(401).json({ error: 'Unauthorized: Valid MCP Key required' });

  try {
    const { accessToken } = await getValidAccessToken(mcpKey);
    const properties = await getGa4Properties(accessToken);
    res.json({ status: 'success', data: properties });
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
              name: 'gsc_list_sites',
              description: 'List all verified Google Search Console websites and domains accessible with this authenticated Google account.',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            },
            {
              name: 'ga4_list_properties',
              description: 'List all Google Analytics 4 accounts and properties accessible with this authenticated Google account, including their property IDs, names, and account names.',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            },
            {
              name: 'gsc_get_search_analytics',
              description: 'Fetch organic search queries, clicks, impressions, CTR, and average position from Google Search Console.',
              inputSchema: {
                type: 'object',
                properties: {
                  siteUrl: { type: 'string', description: 'Optional Search Console site URL (e.g. sc-domain:example.com or https://example.com). Defaults to your selected primary site if omitted.' },
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
                  url: { type: 'string', description: 'The absolute URL to inspect' },
                  siteUrl: { type: 'string', description: 'Optional Search Console site URL. Defaults to your selected primary site if omitted.' }
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
                  propertyId: { type: 'string', description: 'Optional GA4 Property ID (numeric ID). Defaults to your selected primary property if omitted.' },
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
                properties: {
                  propertyId: { type: 'string', description: 'Optional GA4 Property ID. Defaults to your selected primary property if omitted.' }
                }
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

      if (toolName === 'gsc_list_sites') {
        const sites = await getSearchConsoleSites(accessToken);
        textOutput = JSON.stringify(sites, null, 2);
      } else if (toolName === 'ga4_list_properties') {
        const props = await getGa4Properties(accessToken);
        textOutput = JSON.stringify(props, null, 2);
      } else if (toolName === 'gsc_get_search_analytics') {
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
