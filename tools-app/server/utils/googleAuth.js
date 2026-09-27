import pool from '../db.js';
import { encryptText, decryptText } from './crypto.js';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly'
];

/**
 * Builds the Google OAuth 2.0 authorization URL.
 */
export function getGoogleAuthUrl(state = '') {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI) are not configured.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline', // Mandatory to receive refresh_token
    prompt: 'consent',     // Ensures refresh_token is returned on every login
    include_granted_scopes: 'true',
    state: state || 'cerilas_mcp'
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchanges the authorization code received from Google for tokens.
 */
export async function exchangeCodeForTokens(code) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  const bodyParams = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyParams.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Retrieves the authenticated user's email address from Google.
 */
export async function getGoogleUserEmail(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google user info: ${response.statusText}`);
  }

  const data = await response.json();
  return data.email;
}

/**
 * Retrieves a fresh, valid Google access token using the user's encrypted refresh token.
 */
export async function getValidAccessToken(mcpKey) {
  const res = await pool.query(
    'SELECT id, user_email, refresh_token_encrypted, access_token_cached, token_expires_at, selected_gsc_site, selected_ga4_property FROM mcp_user_connections WHERE mcp_key = $1',
    [mcpKey]
  );

  if (res.rows.length === 0) {
    throw new Error('Invalid or revoked Cerilas MCP key.');
  }

  const row = res.rows[0];
  const now = Date.now();

  // If cached access token is still valid for at least 2 minutes, return it
  if (row.access_token_cached && row.token_expires_at && Number(row.token_expires_at) > now + 120000) {
    return {
      accessToken: row.access_token_cached,
      userEmail: row.user_email,
      selectedGscSite: row.selected_gsc_site,
      selectedGa4Property: row.selected_ga4_property
    };
  }

  // Otherwise, refresh token with Google
  const refreshToken = decryptText(row.refresh_token_encrypted);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const refreshParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const refreshResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: refreshParams.toString()
  });

  if (!refreshResponse.ok) {
    const errText = await refreshResponse.text();
    throw new Error(`Google token refresh failed: ${errText}`);
  }

  const tokenData = await refreshResponse.json();
  const newAccessToken = tokenData.access_token;
  const newExpiresAt = now + (tokenData.expires_in || 3600) * 1000;

  // Cache in DB
  await pool.query(
    'UPDATE mcp_user_connections SET access_token_cached = $1, token_expires_at = $2, updated_at = NOW() WHERE mcp_key = $3',
    [newAccessToken, newExpiresAt, mcpKey]
  );

  return {
    accessToken: newAccessToken,
    userEmail: row.user_email,
    selectedGscSite: row.selected_gsc_site,
    selectedGa4Property: row.selected_ga4_property
  };
}

/**
 * Fetches user's verified Search Console sites.
 */
export async function getSearchConsoleSites(accessToken) {
  const url = 'https://www.googleapis.com/webmasters/v3/sites';
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Search Console sites fetch failed: ${errorText}`);
  }

  const data = await response.json();
  return data.siteEntry || [];
}

/**
 * Queries Google Search Console search performance analytics.
 */
export async function querySearchConsole(accessToken, siteUrl, options = {}) {
  const targetSite = siteUrl.startsWith('sc-domain:') ? siteUrl : siteUrl;
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(targetSite)}/searchAnalytics/query`;

  const startDate = options.startDate || getPastDateIso(28);
  const endDate = options.endDate || getPastDateIso(1);
  const dimensions = options.dimensions || ['query'];
  const rowLimit = Math.min(Number(options.rowLimit) || 50, 500);

  const requestBody = {
    startDate,
    endDate,
    dimensions,
    rowLimit,
    type: 'web'
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Search Console query failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    siteUrl,
    startDate,
    endDate,
    rows: (data.rows || []).map((row) => ({
      keys: row.keys,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: ((row.ctr || 0) * 100).toFixed(2) + '%',
      position: (row.position || 0).toFixed(1)
    }))
  };
}

/**
 * Inspects a specific URL in Google Search Console.
 */
export async function inspectSearchConsoleUrl(accessToken, siteUrl, inspectionUrl) {
  const endpoint = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inspectionUrl,
      siteUrl
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`URL Inspection failed: ${errText}`);
  }

  return await response.json();
}

/**
 * Fetches Google Analytics 4 accounts and properties.
 */
export async function getGa4Properties(accessToken) {
  const url = 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries';
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const properties = [];
  for (const acc of data.accountSummaries || []) {
    for (const prop of acc.propertySummaries || []) {
      properties.push({
        propertyId: prop.property.replace('properties/', ''),
        displayName: prop.displayName,
        accountName: acc.displayName
      });
    }
  }
  return properties;
}

/**
 * Runs a report against Google Analytics 4 (GA4).
 */
export async function queryGa4Traffic(accessToken, propertyId, options = {}) {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  const startDate = options.startDate || '30daysAgo';
  const endDate = options.endDate || 'yesterday';

  const requestBody = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' }
    ],
    limit: 20
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GA4 report query failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rows = (data.rows || []).map((row) => ({
    channel: row.dimensionValues?.[0]?.value || 'Unknown',
    sessions: Number(row.metricValues?.[0]?.value || 0),
    activeUsers: Number(row.metricValues?.[1]?.value || 0),
    bounceRate: (Number(row.metricValues?.[2]?.value || 0) * 100).toFixed(1) + '%',
    avgDurationSeconds: Math.round(Number(row.metricValues?.[3]?.value || 0))
  }));

  return { propertyId, startDate, endDate, rows };
}

/**
 * Runs real-time visitor query on GA4.
 */
export async function queryGa4Realtime(accessToken, propertyId) {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`;

  const requestBody = {
    dimensions: [{ name: 'unifiedScreenName' }],
    metrics: [{ name: 'activeUsers' }]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GA4 realtime query failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const totalActive = (data.rows || []).reduce((acc, r) => acc + Number(r.metricValues?.[0]?.value || 0), 0);

  return {
    propertyId,
    totalActiveUsers: totalActive,
    activePages: (data.rows || []).slice(0, 10).map((r) => ({
      page: r.dimensionValues?.[0]?.value,
      activeUsers: Number(r.metricValues?.[0]?.value || 0)
    }))
  };
}

function getPastDateIso(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}
