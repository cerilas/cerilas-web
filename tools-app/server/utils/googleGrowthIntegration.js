import { authPool } from '../db.js';
import { encryptText, decryptText } from './crypto.js';
import {
  exchangeCodeForTokens,
  getGoogleUserEmail,
  getSearchConsoleSites,
  querySearchConsole,
  getGa4Properties,
  queryGa4Traffic
} from './googleAuth.js';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

const GROWTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly'
];

/**
 * Builds the Google OAuth URL specifically for Growth SaaS with required Search Console & GA4 scopes.
 */
export function getGrowthGoogleAuthUrl(workspaceId, userId) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Google OAuth kimlik bilgileri (.env GOOGLE_CLIENT_ID / GOOGLE_REDIRECT_URI) yapılandırılmamış.');
  }

  const state = `growth_${workspaceId}_${userId}_${Date.now()}`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GROWTH_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Retrieves a fresh, valid access token for a given workspace integration.
 * Automatically refreshes using refresh_token if expired.
 */
export async function getValidGrowthAccessToken(connection) {
  const now = Date.now();

  // If token is cached and valid for at least 2 more minutes, decrypt and return
  if (connection.encrypted_access_token && connection.expires_at && Number(connection.expires_at) > now + 120000) {
    try {
      return decryptText(connection.encrypted_access_token);
    } catch (e) {
      console.warn('[Growth Google Auth] Access token decrypt failed, attempting refresh:', e.message);
    }
  }

  if (!connection.encrypted_refresh_token) {
    throw new Error('Google oturum yenileme anahtarı (refresh token) bulunamadı. Lütfen Google hesabınızı tekrar bağlayın.');
  }

  const refreshToken = decryptText(connection.encrypted_refresh_token);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const refreshParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: refreshParams.toString()
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google token yenileme hatası (${response.status}): ${errText}`);
  }

  const tokenData = await response.json();
  const newAccessToken = tokenData.access_token;
  const newExpiresAt = now + (tokenData.expires_in || 3600) * 1000;

  // Update in database
  const encNewAccess = encryptText(newAccessToken);
  await authPool.query(
    `UPDATE integration_connections 
     SET encrypted_access_token = $1, expires_at = $2, updated_at = NOW() 
     WHERE id = $3`,
    [encNewAccess, newExpiresAt, connection.id]
  );

  return newAccessToken;
}

/**
 * Handles the Google OAuth callback for Growth SaaS.
 * Saves credentials, auto-matches properties, and triggers initial sync.
 */
export async function handleGrowthOAuthCallback({ code, state }) {
  const parts = (state || '').split('_');
  const workspaceId = parseInt(parts[1], 10);
  const userId = parts[2] ? parseInt(parts[2], 10) : null;

  if (!workspaceId || isNaN(workspaceId)) {
    throw new Error('Geçersiz veya eksik çalışma alanı kimliği.');
  }

  // 1. Fetch workspace & organization
  const wsRes = await authPool.query(
    'SELECT * FROM workspaces WHERE id = $1',
    [workspaceId]
  );
  if (wsRes.rows.length === 0) {
    throw new Error(`Çalışma alanı (ID: ${workspaceId}) bulunamadı.`);
  }
  const workspace = wsRes.rows[0];
  const orgId = workspace.organization_id;

  // 2. Exchange authorization code for tokens
  const tokenData = await exchangeCodeForTokens(code);
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token || null;
  const expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;

  const encAccessToken = encryptText(accessToken);
  const encRefreshToken = refreshToken ? encryptText(refreshToken) : null;

  // 3. Fetch Google User Email
  const googleEmail = await getGoogleUserEmail(accessToken);

  // 4. Fetch Search Console sites
  let gscSites = [];
  try {
    gscSites = await getSearchConsoleSites(accessToken);
  } catch (err) {
    console.warn('[Growth OAuth] Search Console sites fetch warning:', err.message);
  }

  // 5. Fetch GA4 Properties
  let ga4Properties = [];
  try {
    ga4Properties = await getGa4Properties(accessToken);
  } catch (err) {
    console.warn('[Growth OAuth] GA4 properties fetch warning:', err.message);
  }

  // Auto-match Search Console site with workspace domain
  const rawDomain = (workspace.primary_domain || '').toLowerCase().replace(/^www\./, '').trim();
  let matchedGscSite = null;

  if (rawDomain && gscSites.length > 0) {
    // Check sc-domain:domain or https?://(www.)?domain
    matchedGscSite = gscSites.find(s => {
      const sUrl = (s.siteUrl || '').toLowerCase();
      return (
        sUrl === `sc-domain:${rawDomain}` ||
        sUrl.includes(`://${rawDomain}/`) ||
        sUrl.includes(`://www.${rawDomain}/`) ||
        sUrl.includes(rawDomain)
      );
    }) || gscSites[0];
  } else if (gscSites.length > 0) {
    matchedGscSite = gscSites[0];
  }

  // Auto-match GA4 property (by name similarity or first)
  let matchedGa4Property = null;
  if (rawDomain && ga4Properties.length > 0) {
    matchedGa4Property = ga4Properties.find(p => {
      const pName = (p.displayName || '').toLowerCase();
      return pName.includes(rawDomain) || (workspace.name && pName.includes(workspace.name.toLowerCase()));
    }) || ga4Properties[0];
  } else if (ga4Properties.length > 0) {
    matchedGa4Property = ga4Properties[0];
  }

  // 6. Upsert GSC integration connection
  const gscMetadata = {
    email: googleEmail,
    availableSites: gscSites.map(s => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel
    })),
    connectedAt: new Date().toISOString()
  };

  const existingGsc = await authPool.query(
    `SELECT id, encrypted_refresh_token FROM integration_connections 
     WHERE workspace_id = $1 AND provider = 'google' AND integration_type = 'search_console'`,
    [workspaceId]
  );

  const finalGscRefresh = encRefreshToken || (existingGsc.rows[0]?.encrypted_refresh_token) || null;

  if (existingGsc.rows.length > 0) {
    await authPool.query(
      `UPDATE integration_connections SET
        status = 'active',
        external_account_id = $1,
        external_property_id = $2,
        external_property_name = $3,
        scopes = $4,
        encrypted_access_token = $5,
        encrypted_refresh_token = COALESCE($6, encrypted_refresh_token),
        expires_at = $7,
        connected_by_user_id = $8,
        metadata = $9,
        last_sync_status = 'connected',
        updated_at = NOW()
       WHERE id = $10`,
      [
        googleEmail,
        matchedGscSite?.siteUrl || null,
        matchedGscSite?.siteUrl || null,
        JSON.stringify(GROWTH_SCOPES),
        encAccessToken,
        finalGscRefresh,
        expiresAt,
        userId,
        JSON.stringify(gscMetadata),
        existingGsc.rows[0].id
      ]
    );
  } else {
    await authPool.query(
      `INSERT INTO integration_connections (
        workspace_id, organization_id, provider, integration_type,
        status, external_account_id, external_property_id, external_property_name,
        scopes, encrypted_access_token, encrypted_refresh_token, expires_at,
        connected_by_user_id, metadata, last_sync_status, created_at, updated_at
      ) VALUES ($1, $2, 'google', 'search_console', 'active', $3, $4, $5, $6, $7, $8, $9, $10, $11, 'connected', NOW(), NOW())`,
      [
        workspaceId,
        orgId,
        googleEmail,
        matchedGscSite?.siteUrl || null,
        matchedGscSite?.siteUrl || null,
        JSON.stringify(GROWTH_SCOPES),
        encAccessToken,
        finalGscRefresh,
        expiresAt,
        userId,
        JSON.stringify(gscMetadata)
      ]
    );
  }

  // 7. Upsert GA4 integration connection
  const ga4Metadata = {
    email: googleEmail,
    availableProperties: ga4Properties,
    connectedAt: new Date().toISOString()
  };

  const existingGa4 = await authPool.query(
    `SELECT id, encrypted_refresh_token FROM integration_connections 
     WHERE workspace_id = $1 AND provider = 'google' AND integration_type = 'analytics'`,
    [workspaceId]
  );

  const finalGa4Refresh = encRefreshToken || (existingGa4.rows[0]?.encrypted_refresh_token) || null;

  if (existingGa4.rows.length > 0) {
    await authPool.query(
      `UPDATE integration_connections SET
        status = 'active',
        external_account_id = $1,
        external_property_id = $2,
        external_property_name = $3,
        scopes = $4,
        encrypted_access_token = $5,
        encrypted_refresh_token = COALESCE($6, encrypted_refresh_token),
        expires_at = $7,
        connected_by_user_id = $8,
        metadata = $9,
        last_sync_status = 'connected',
        updated_at = NOW()
       WHERE id = $10`,
      [
        googleEmail,
        matchedGa4Property?.propertyId || null,
        matchedGa4Property?.displayName || null,
        JSON.stringify(GROWTH_SCOPES),
        encAccessToken,
        finalGa4Refresh,
        expiresAt,
        userId,
        JSON.stringify(ga4Metadata),
        existingGa4.rows[0].id
      ]
    );
  } else {
    await authPool.query(
      `INSERT INTO integration_connections (
        workspace_id, organization_id, provider, integration_type,
        status, external_account_id, external_property_id, external_property_name,
        scopes, encrypted_access_token, encrypted_refresh_token, expires_at,
        connected_by_user_id, metadata, last_sync_status, created_at, updated_at
      ) VALUES ($1, $2, 'google', 'analytics', 'active', $3, $4, $5, $6, $7, $8, $9, $10, $11, 'connected', NOW(), NOW())`,
      [
        workspaceId,
        orgId,
        googleEmail,
        matchedGa4Property?.propertyId || null,
        matchedGa4Property?.displayName || null,
        JSON.stringify(GROWTH_SCOPES),
        encAccessToken,
        finalGa4Refresh,
        expiresAt,
        userId,
        JSON.stringify(ga4Metadata)
      ]
    );
  }

  // 8. Trigger immediate background Search Console sync if property matched
  if (matchedGscSite?.siteUrl) {
    syncGrowthSearchConsole(workspaceId, accessToken, matchedGscSite.siteUrl).catch(err => {
      console.error('[Growth Initial GSC Sync Error]:', err.message);
    });
  }

  return {
    workspaceId,
    workspaceName: workspace.name,
    email: googleEmail,
    gscSite: matchedGscSite?.siteUrl || null,
    gscSitesCount: gscSites.length,
    ga4Property: matchedGa4Property?.displayName || null,
    ga4PropertiesCount: ga4Properties.length
  };
}

/**
 * Synchronizes real Search Console data for a given workspace.
 */
export async function syncGrowthSearchConsole(workspaceId, explicitAccessToken = null, explicitSiteUrl = null) {
  // 1. Fetch connection record
  const connRes = await authPool.query(
    `SELECT * FROM integration_connections 
     WHERE workspace_id = $1 AND provider = 'google' AND integration_type = 'search_console'`,
    [workspaceId]
  );

  if (connRes.rows.length === 0) {
    throw new Error('Bu çalışma alanı için Google Search Console entegrasyonu bulunamadı.');
  }

  const connection = connRes.rows[0];
  const siteUrl = explicitSiteUrl || connection.external_property_id;

  if (!siteUrl) {
    throw new Error('Lütfen önce Search Console için bir mülk (siteUrl) seçin.');
  }

  // 2. Obtain valid access token
  const accessToken = explicitAccessToken || await getValidGrowthAccessToken(connection);

  // 3. Query Google Search Console queries (last 28 days)
  let queryData;
  let pageData;

  try {
    queryData = await querySearchConsole(accessToken, siteUrl, {
      dimensions: ['query'],
      rowLimit: 100
    });
  } catch (err) {
    console.error(`[GSC Query Failed for ${siteUrl}]:`, err.message);
    await authPool.query(
      `UPDATE integration_connections SET last_sync_status = 'error', last_error = $1, updated_at = NOW() WHERE id = $2`,
      [err.message, connection.id]
    );
    throw err;
  }

  try {
    pageData = await querySearchConsole(accessToken, siteUrl, {
      dimensions: ['page'],
      rowLimit: 50
    });
  } catch (err) {
    console.warn(`[GSC Pages Query Warning for ${siteUrl}]:`, err.message);
    pageData = { rows: [] };
  }

  const rows = queryData.rows || [];
  const pageRows = pageData.rows || [];

  const totalClicks = rows.reduce((acc, r) => acc + (Number(r.clicks) || 0), 0);
  const totalImpressions = rows.reduce((acc, r) => acc + (Number(r.impressions) || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const weightedPositionSum = rows.reduce((acc, r) => acc + (Number(r.position) || 0) * (Number(r.impressions) || 0), 0);
  const avgPosition = totalImpressions > 0 ? (weightedPositionSum / totalImpressions).toFixed(1) : '0.0';

  // Process striking distance queries (positions 4 to 15)
  const topQueries = rows.map(r => {
    const pos = Number(r.position) || 0;
    const isStriking = pos >= 4.0 && pos <= 15.0;
    let potential = null;
    if (isStriking) {
      const extra = Math.round((Number(r.impressions) || 0) * 0.12);
      potential = `+${Math.max(extra, 30)} tık/ay`;
    }
    return {
      query: r.keys?.[0] || '',
      clicks: Number(r.clicks) || 0,
      impressions: Number(r.impressions) || 0,
      ctr: r.ctr || '0%',
      position: Number(pos).toFixed(1),
      isStriking,
      potential
    };
  });

  const strikingQueries = topQueries.filter(q => q.isStriking).sort((a, b) => b.impressions - a.impressions);

  // Process top pages
  const topPages = pageRows.map(p => ({
    url: p.keys?.[0] || '',
    clicks: Number(p.clicks) || 0,
    impressions: Number(p.impressions) || 0,
    ctr: p.ctr || '0%',
    topQuery: ''
  }));

  // Upsert into growth_search_performance
  await authPool.query(
    `INSERT INTO growth_search_performance (
      workspace_id, site_url, date_range,
      total_clicks, total_impressions, average_ctr, average_position,
      top_queries, striking_queries, top_pages, synced_at
    ) VALUES ($1, $2, '28d', $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (workspace_id, site_url, date_range)
    DO UPDATE SET
      total_clicks = EXCLUDED.total_clicks,
      total_impressions = EXCLUDED.total_impressions,
      average_ctr = EXCLUDED.average_ctr,
      average_position = EXCLUDED.average_position,
      top_queries = EXCLUDED.top_queries,
      striking_queries = EXCLUDED.striking_queries,
      top_pages = EXCLUDED.top_pages,
      synced_at = NOW()`,
    [
      workspaceId,
      siteUrl,
      totalClicks,
      totalImpressions,
      parseFloat(avgCtr),
      parseFloat(avgPosition),
      JSON.stringify(topQueries),
      JSON.stringify(strikingQueries),
      JSON.stringify(topPages)
    ]
  );

  // Update connection status
  await authPool.query(
    `UPDATE integration_connections SET
      last_sync_at = NOW(),
      last_sync_status = 'success',
      last_error = NULL,
      updated_at = NOW()
     WHERE id = $1`,
    [connection.id]
  );

  return {
    success: true,
    siteUrl,
    totalClicks,
    totalImpressions,
    averageCtr: `${avgCtr}%`,
    averagePosition: avgPosition,
    queriesCount: topQueries.length,
    strikingCount: strikingQueries.length,
    pagesCount: topPages.length,
    syncedAt: new Date().toISOString()
  };
}

/**
 * Retrieves the integration overview for a workspace (Search Console & GA4).
 */
export async function getGrowthIntegrationsOverview(workspaceId) {
  const res = await authPool.query(
    `SELECT id, provider, integration_type, status, external_account_id,
            external_property_id, external_property_name, scopes,
            last_sync_at, last_sync_status, last_error, metadata, created_at, updated_at
     FROM integration_connections
     WHERE workspace_id = $1`,
    [workspaceId]
  );

  const gsc = res.rows.find(r => r.provider === 'google' && r.integration_type === 'search_console') || null;
  const ga4 = res.rows.find(r => r.provider === 'google' && r.integration_type === 'analytics') || null;

  return {
    gsc: gsc ? {
      connected: gsc.status === 'active',
      email: gsc.external_account_id,
      selectedSite: gsc.external_property_id,
      availableSites: gsc.metadata?.availableSites || [],
      lastSyncAt: gsc.last_sync_at,
      lastSyncStatus: gsc.last_sync_status,
      lastError: gsc.last_error
    } : { connected: false },
    ga4: ga4 ? {
      connected: ga4.status === 'active',
      email: ga4.external_account_id,
      selectedPropertyId: ga4.external_property_id,
      selectedPropertyName: ga4.external_property_name,
      availableProperties: ga4.metadata?.availableProperties || [],
      lastSyncAt: ga4.last_sync_at,
      lastSyncStatus: ga4.last_sync_status,
      lastError: ga4.last_error
    } : { connected: false }
  };
}

/**
 * Disconnects Google integrations for a workspace.
 */
export async function disconnectGrowthGoogle(workspaceId) {
  await authPool.query(
    `DELETE FROM integration_connections 
     WHERE workspace_id = $1 AND provider = 'google'`,
    [workspaceId]
  );

  await authPool.query(
    `DELETE FROM growth_search_performance WHERE workspace_id = $1`,
    [workspaceId]
  );

  return { success: true };
}
