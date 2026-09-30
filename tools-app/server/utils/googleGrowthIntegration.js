import { authPool } from '../db.js';
import { encryptText, decryptText } from './crypto.js';
import {
  exchangeCodeForTokens,
  getGoogleUserEmail,
  getSearchConsoleSites,
  querySearchConsole,
  inspectSearchConsoleUrl,
  getGa4Properties,
  queryGa4Traffic,
  queryGa4Realtime
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

const COUNTRY_MAP = {
  tur: { name: 'Türkiye', flag: '🇹🇷' },
  usa: { name: 'Amerika Birleşik Devletleri', flag: '🇺🇸' },
  deu: { name: 'Almanya', flag: '🇩🇪' },
  gbr: { name: 'Birleşik Krallık', flag: '🇬🇧' },
  fra: { name: 'Fransa', flag: '🇫🇷' },
  nld: { name: 'Hollanda', flag: '🇳🇱' },
  aze: { name: 'Azerbaycan', flag: '🇦🇿' },
  ita: { name: 'İtalya', flag: '🇮🇹' },
  esp: { name: 'İspanya', flag: '🇪🇸' },
  rus: { name: 'Rusya', flag: '🇷🇺' },
  can: { name: 'Kanada', flag: '🇨🇦' },
  aus: { name: 'Avustralya', flag: '🇦🇺' },
  ind: { name: 'Hindistan', flag: '🇮🇳' },
  bra: { name: 'Brezilya', flag: '🇧🇷' },
  bel: { name: 'Belçika', flag: '🇧🇪' },
  che: { name: 'İsviçre', flag: '🇨🇭' },
  aut: { name: 'Avusturya', flag: '🇦🇹' },
  swe: { name: 'İsveç', flag: '🇸🇪' },
  nor: { name: 'Norveç', flag: '🇳🇴' },
  dnk: { name: 'Danimarka', flag: '🇩🇰' },
  pol: { name: 'Polonya', flag: '🇵🇱' },
  ukr: { name: 'Ukrayna', flag: '🇺🇦' },
  grc: { name: 'Yunanistan', flag: '🇬🇷' },
  sau: { name: 'Suudi Arabistan', flag: '🇸🇦' },
  are: { name: 'Birleşik Arap Emirlikleri', flag: '🇦🇪' },
  qat: { name: 'Katar', flag: '🇶🇦' },
  irn: { name: 'İran', flag: '🇮🇷' },
  irq: { name: 'Irak', flag: '🇮🇶' },
  kaz: { name: 'Kazakistan', flag: '🇰🇿' },
  uzb: { name: 'Özbekistan', flag: '🇺🇿' },
  chn: { name: 'Çin', flag: '🇨🇳' },
  jpn: { name: 'Japonya', flag: '🇯🇵' },
  kor: { name: 'Güney Kore', flag: '🇰🇷' }
};

const DEVICE_MAP = {
  DESKTOP: 'Masaüstü',
  MOBILE: 'Mobil',
  TABLET: 'Tablet'
};

/**
 * Synchronizes real Search Console data for a given workspace.
 */
export async function syncGrowthSearchConsole(workspaceId, explicitAccessToken = null, explicitSiteUrl = null, options = {}) {
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

  // 3. Resolve Date Ranges
  const dateRange = options.dateRange || '28d';
  let startDate = options.startDate;
  let endDate = options.endDate;

  const formatDate = (d) => d.toISOString().split('T')[0];

  if (!startDate || !endDate) {
    const dEnd = new Date();
    dEnd.setDate(dEnd.getDate() - 1);
    endDate = formatDate(dEnd);

    const dStart = new Date();
    if (dateRange === '1d') {
      dStart.setDate(dStart.getDate() - 1);
    } else if (dateRange === '3d') {
      dStart.setDate(dStart.getDate() - 3);
    } else if (dateRange === '7d' || dateRange === '1w') {
      dStart.setDate(dStart.getDate() - 7);
    } else if (dateRange === '28d' || dateRange === '1m') {
      dStart.setDate(dStart.getDate() - 28);
    } else if (dateRange === '3m' || dateRange === '90d') {
      dStart.setDate(dStart.getDate() - 90);
    } else if (dateRange === '6m' || dateRange === '180d') {
      dStart.setDate(dStart.getDate() - 180);
    } else if (dateRange === 'all' || dateRange === '16m') {
      // Google Search Console maximum historical retention is 16 months (~480 days)
      dStart.setDate(dStart.getDate() - 485);
    } else {
      dStart.setDate(dStart.getDate() - 28);
    }
    startDate = formatDate(dStart);
  }

  const queryOptions = { startDate, endDate };
  const trendLimit = dateRange === 'all' ? 520 : dateRange === '6m' ? 220 : dateRange === '3m' ? 120 : 60;

  // 4. Parallel GSC Queries (Queries, Pages, Trend, Devices, Countries, Cannibalization, Images)
  const [
    queryRes,
    pageRes,
    trendRes,
    deviceRes,
    countryRes,
    cannibalRes,
    imageRes
  ] = await Promise.allSettled([
    querySearchConsole(accessToken, siteUrl, { ...queryOptions, dimensions: ['query'], rowLimit: 300 }),
    querySearchConsole(accessToken, siteUrl, { ...queryOptions, dimensions: ['page'], rowLimit: 100 }),
    querySearchConsole(accessToken, siteUrl, { ...queryOptions, dimensions: ['date'], rowLimit: trendLimit }),
    querySearchConsole(accessToken, siteUrl, { ...queryOptions, dimensions: ['device'] }),
    querySearchConsole(accessToken, siteUrl, { ...queryOptions, dimensions: ['country'], rowLimit: 30 }),
    querySearchConsole(accessToken, siteUrl, { ...queryOptions, dimensions: ['query', 'page'], rowLimit: 500 }),
    querySearchConsole(accessToken, siteUrl, { ...queryOptions, type: 'image', rowLimit: 10 })
  ]);

  if (queryRes.status !== 'fulfilled') {
    console.error(`[GSC Query Failed for ${siteUrl}]:`, queryRes.reason?.message);
    await authPool.query(
      `UPDATE integration_connections SET last_sync_status = 'error', last_error = $1, updated_at = NOW() WHERE id = $2`,
      [queryRes.reason?.message || 'GSC Query failed', connection.id]
    );
    throw queryRes.reason;
  }

  const queryData = queryRes.value || { rows: [] };
  const pageData = pageRes.status === 'fulfilled' ? pageRes.value : { rows: [] };
  const trendData = trendRes.status === 'fulfilled' ? trendRes.value : { rows: [] };
  const deviceData = deviceRes.status === 'fulfilled' ? deviceRes.value : { rows: [] };
  const countryData = countryRes.status === 'fulfilled' ? countryRes.value : { rows: [] };
  const cannibalData = cannibalRes.status === 'fulfilled' ? cannibalRes.value : { rows: [] };
  const imageData = imageRes.status === 'fulfilled' ? imageRes.value : { rows: [] };

  const rows = queryData.rows || [];
  const pageRows = pageData.rows || [];

  const totalClicks = rows.reduce((acc, r) => acc + (Number(r.clicks) || 0), 0);
  const totalImpressions = rows.reduce((acc, r) => acc + (Number(r.impressions) || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const weightedPositionSum = rows.reduce((acc, r) => acc + (Number(r.position) || 0) * (Number(r.impressions) || 0), 0);
  const avgPosition = totalImpressions > 0 ? (weightedPositionSum / totalImpressions).toFixed(1) : '0.0';

  // Process striking distance queries (positions 4 to 15, minimum 30 impressions for statistical validity)
  const topQueries = rows.map(r => {
    const pos = Number(r.position) || 0;
    const imp = Number(r.impressions) || 0;
    const clk = Number(r.clicks) || 0;
    const ctrVal = Number(r.ctr) || 0;

    // Dayanak: Google organik SERP benchmarkında ilk 3 sıranın ortalama TO'su %14'tür (Advanced Web Ranking).
    // 4.0 - 15.0 arası sıralamada olup en az 30 gösterim alan kelimeler gerçek vuruş mesafesindedir.
    const isStriking = pos >= 4.0 && pos <= 15.0 && imp >= 30;
    let potential = null;
    let potentialHint = null;

    if (isStriking) {
      const benchmarkTop3Clicks = Math.round(imp * 0.14);
      const gain = Math.max(0, benchmarkTop3Clicks - clk);
      if (gain >= 3) {
        potential = `+${gain} tık`;
        if (ctrVal < 0.02 && pos <= 10.0) {
          potentialHint = 'Düşük TO: Başlık (title) & snippet optimize et';
        } else if (pos > 10.0) {
          potentialHint = '2. Sayfa: İçerik güncellemesiyle 1. sayfaya taşı';
        } else {
          potentialHint = 'İlk 3 fırsatı: İç link ver & içeriği zenginleştir';
        }
      }
    }

    return {
      query: r.keys?.[0] || '',
      clicks: clk,
      impressions: imp,
      ctr: r.ctr ? `${(Number(r.ctr) * 100).toFixed(1)}%` : '0%',
      position: Number(pos).toFixed(1),
      isStriking,
      potential,
      potentialHint
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

  // Process daily trend
  const dailyTrend = (trendData.rows || [])
    .map(r => ({
      date: r.keys?.[0] || '',
      clicks: Number(r.clicks) || 0,
      impressions: Number(r.impressions) || 0,
      ctr: r.ctr || '0%',
      position: Number(r.position || 0).toFixed(1)
    }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  // Process devices breakdown
  const totalDeviceClicks = (deviceData.rows || []).reduce((acc, r) => acc + (Number(r.clicks) || 0), 0);
  const devices = (deviceData.rows || []).map(r => {
    const rawKey = (r.keys?.[0] || '').toUpperCase();
    const clx = Number(r.clicks) || 0;
    const imp = Number(r.impressions) || 0;
    const share = totalDeviceClicks > 0 ? Math.round((clx / totalDeviceClicks) * 100) : 0;
    return {
      device: rawKey,
      label: DEVICE_MAP[rawKey] || rawKey,
      clicks: clx,
      impressions: imp,
      ctr: r.ctr || '0%',
      position: Number(r.position || 0).toFixed(1),
      share
    };
  }).sort((a, b) => b.clicks - a.clicks);

  // Process countries breakdown
  const totalCountryClicks = (countryData.rows || []).reduce((acc, r) => acc + (Number(r.clicks) || 0), 0);
  const countries = (countryData.rows || []).map(r => {
    const code = (r.keys?.[0] || '').toLowerCase();
    const info = COUNTRY_MAP[code] || { name: code.toUpperCase(), flag: '🌐' };
    const clx = Number(r.clicks) || 0;
    const imp = Number(r.impressions) || 0;
    const share = totalCountryClicks > 0 ? Math.round((clx / totalCountryClicks) * 100) : 0;
    return {
      code,
      name: info.name,
      flag: info.flag,
      clicks: clx,
      impressions: imp,
      ctr: r.ctr || '0%',
      position: Number(r.position || 0).toFixed(1),
      share
    };
  }).sort((a, b) => b.clicks - a.clicks);

  // Process Keyword Cannibalization
  const queryPagesMap = {};
  for (const r of (cannibalData.rows || [])) {
    const q = r.keys?.[0];
    const p = r.keys?.[1];
    if (!q || !p) continue;
    if (!queryPagesMap[q]) queryPagesMap[q] = [];
    queryPagesMap[q].push({
      url: p,
      clicks: Number(r.clicks) || 0,
      impressions: Number(r.impressions) || 0,
      ctr: r.ctr || '0%',
      position: Number(r.position || 0).toFixed(1)
    });
  }

  const cannibalization = [];
  for (const [query, pList] of Object.entries(queryPagesMap)) {
    if (pList.length >= 2) {
      const totalImp = pList.reduce((a, b) => a + b.impressions, 0);
      const totalClx = pList.reduce((a, b) => a + b.clicks, 0);
      if (totalImp >= 10) {
        pList.sort((a, b) => b.impressions - a.impressions);
        const topShare = Math.round((pList[0].impressions / totalImp) * 100);
        const severity = topShare < 70 ? 'Yüksek' : 'Orta';
        cannibalization.push({
          query,
          totalImpressions: totalImp,
          totalClicks: totalClx,
          pageCount: pList.length,
          pages: pList.slice(0, 4),
          severity,
          topShare
        });
      }
    }
  }
  cannibalization.sort((a, b) => b.totalImpressions - a.totalImpressions);

  // Process Brand vs Non-Brand Split
  const wsRes = await authPool.query(`SELECT name FROM workspaces WHERE id = $1`, [workspaceId]);
  const wsName = wsRes.rows[0]?.name || '';
  const brandKeywords = [];
  if (wsName) {
    wsName.toLowerCase().split(/\s+/).forEach(w => {
      if (w.length >= 3) brandKeywords.push(w);
    });
  }
  try {
    const rawHost = siteUrl.replace(/^https?:\/\//, '').replace(/^sc-domain:/, '').split('/')[0];
    const hostPart = rawHost.split('.')[0];
    if (hostPart && hostPart.length >= 3 && !['www', 'app', 'dev', 'api'].includes(hostPart)) {
      brandKeywords.push(hostPart.toLowerCase());
    }
  } catch (e) {}

  let brandClicks = 0;
  let brandImpressions = 0;
  let nonBrandClicks = 0;
  let nonBrandImpressions = 0;
  let brandCount = 0;
  let nonBrandCount = 0;

  for (const q of topQueries) {
    const lower = q.query.toLowerCase();
    const isBrand = brandKeywords.some(b => lower.includes(b));
    if (isBrand) {
      brandClicks += q.clicks;
      brandImpressions += q.impressions;
      brandCount++;
    } else {
      nonBrandClicks += q.clicks;
      nonBrandImpressions += q.impressions;
      nonBrandCount++;
    }
  }

  const brandSplit = {
    brandClicks,
    brandImpressions,
    nonBrandClicks,
    nonBrandImpressions,
    brandCtr: brandImpressions > 0 ? ((brandClicks / brandImpressions) * 100).toFixed(2) + '%' : '0.00%',
    nonBrandCtr: nonBrandImpressions > 0 ? ((nonBrandClicks / nonBrandImpressions) * 100).toFixed(2) + '%' : '0.00%',
    brandClicksShare: totalClicks > 0 ? Math.round((brandClicks / totalClicks) * 100) : 0,
    brandCount,
    nonBrandCount
  };

  // Process Search Types (Web vs Image)
  const imgRows = imageData.rows || [];
  const imageClicks = imgRows.reduce((a, b) => a + (Number(b.clicks) || 0), 0);
  const imageImpressions = imgRows.reduce((a, b) => a + (Number(b.impressions) || 0), 0);

  const searchTypes = {
    web: { clicks: totalClicks, impressions: totalImpressions, ctr: avgCtr + '%' },
    image: { clicks: imageClicks, impressions: imageImpressions, ctr: imageImpressions > 0 ? ((imageClicks / imageImpressions) * 100).toFixed(2) + '%' : '0.00%' }
  };

  // Process URL Inspection for Primary Website URL
  let urlInspection = null;
  try {
    let inspectTarget = siteUrl;
    if (inspectTarget.startsWith('sc-domain:')) {
      inspectTarget = 'https://' + inspectTarget.replace('sc-domain:', '');
    }
    const inspectRes = await inspectSearchConsoleUrl(accessToken, siteUrl, inspectTarget);
    if (inspectRes?.inspectionResult?.indexStatusResult) {
      const idx = inspectRes.inspectionResult.indexStatusResult;
      urlInspection = {
        verdict: idx.verdict || 'PASS',
        coverageState: idx.coverageState || 'Dizine Eklendi',
        lastCrawlTime: idx.lastCrawlTime || null,
        crawledAs: idx.crawledAs || 'GOOGLEBOT_SMARTPHONE',
        googleCanonical: idx.googleCanonical || inspectTarget,
        userCanonical: idx.userCanonical || inspectTarget,
        robotsTxtState: idx.robotsTxtState || 'ALLOWED',
        indexingState: idx.indexingState || 'INDEXING_ALLOWED',
        pageFetchState: idx.pageFetchState || 'SUCCESSFUL'
      };
    }
  } catch (inspectErr) {
    console.warn(`[GSC URL Inspection skipped for ${siteUrl}]:`, inspectErr.message);
  }

  // Upsert into growth_search_performance
  await authPool.query(
    `INSERT INTO growth_search_performance (
      workspace_id, site_url, date_range, start_date, end_date,
      total_clicks, total_impressions, average_ctr, average_position,
      top_queries, striking_queries, top_pages,
      daily_trend, devices, countries, cannibalization, search_types, brand_split, url_inspection,
      synced_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
    ON CONFLICT (workspace_id, site_url, date_range)
    DO UPDATE SET
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      total_clicks = EXCLUDED.total_clicks,
      total_impressions = EXCLUDED.total_impressions,
      average_ctr = EXCLUDED.average_ctr,
      average_position = EXCLUDED.average_position,
      top_queries = EXCLUDED.top_queries,
      striking_queries = EXCLUDED.striking_queries,
      top_pages = EXCLUDED.top_pages,
      daily_trend = EXCLUDED.daily_trend,
      devices = EXCLUDED.devices,
      countries = EXCLUDED.countries,
      cannibalization = EXCLUDED.cannibalization,
      search_types = EXCLUDED.search_types,
      brand_split = EXCLUDED.brand_split,
      url_inspection = EXCLUDED.url_inspection,
      synced_at = NOW()`,
    [
      workspaceId,
      siteUrl,
      dateRange,
      startDate,
      endDate,
      totalClicks,
      totalImpressions,
      parseFloat(avgCtr),
      parseFloat(avgPosition),
      JSON.stringify(topQueries),
      JSON.stringify(strikingQueries),
      JSON.stringify(topPages),
      JSON.stringify(dailyTrend),
      JSON.stringify(devices),
      JSON.stringify(countries),
      JSON.stringify(cannibalization),
      JSON.stringify(searchTypes),
      JSON.stringify(brandSplit),
      JSON.stringify(urlInspection)
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
    dateRange,
    startDate,
    endDate,
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

  await authPool.query(
    `DELETE FROM growth_analytics_performance WHERE workspace_id = $1`,
    [workspaceId]
  );

  return { success: true };
}

/**
 * Synchronizes comprehensive Google Analytics 4 (GA4) data for a given workspace.
 */
export async function syncGrowthAnalytics(workspaceId, explicitAccessToken = null, explicitPropertyId = null, options = {}) {
  // 1. Fetch connection record
  const connRes = await authPool.query(
    `SELECT * FROM integration_connections 
     WHERE workspace_id = $1 AND provider = 'google' AND integration_type = 'analytics'`,
    [workspaceId]
  );

  if (connRes.rows.length === 0) {
    throw new Error('Bu çalışma alanı için Google Analytics 4 entegrasyonu bulunamadı.');
  }

  const connection = connRes.rows[0];
  const propertyId = explicitPropertyId || connection.external_property_id;

  if (!propertyId) {
    throw new Error('Lütfen önce Google Analytics 4 için bir mülk (Property ID) seçin.');
  }

  const cleanPropId = String(propertyId).replace('properties/', '').trim();

  // 2. Obtain valid access token
  const accessToken = explicitAccessToken || await getValidGrowthAccessToken(connection);

  // 3. Resolve Date Ranges
  const dateRange = options.dateRange || '28d';
  let startDate = options.startDate;
  let endDate = options.endDate;

  const formatDate = (d) => d.toISOString().split('T')[0];

  if (!startDate || !endDate) {
    const dEnd = new Date();
    dEnd.setDate(dEnd.getDate() - 1);
    endDate = formatDate(dEnd);

    const dStart = new Date();
    if (dateRange === '1d') {
      dStart.setDate(dStart.getDate() - 1);
    } else if (dateRange === '3d') {
      dStart.setDate(dStart.getDate() - 3);
    } else if (dateRange === '7d' || dateRange === '1w') {
      dStart.setDate(dStart.getDate() - 7);
    } else if (dateRange === '28d' || dateRange === '1m') {
      dStart.setDate(dStart.getDate() - 28);
    } else if (dateRange === '3m' || dateRange === '90d') {
      dStart.setDate(dStart.getDate() - 90);
    } else if (dateRange === '6m' || dateRange === '180d') {
      dStart.setDate(dStart.getDate() - 180);
    } else if (dateRange === 'all' || dateRange === '16m') {
      dStart.setDate(dStart.getDate() - 365);
    } else {
      dStart.setDate(dStart.getDate() - 28);
    }
    startDate = formatDate(dStart);
  }

  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runReport`;
  const realtimeEndpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runRealtimeReport`;

  const runGa4Query = async (body) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GA4 API error (${res.status}): ${err}`);
    }
    return res.json();
  };

  // 4. Parallel GA4 Queries
  const [
    totalsRes,
    trendRes,
    channelsRes,
    pagesRes,
    devicesRes,
    techRes,
    countriesRes,
    citiesRes,
    countrySourcesRes,
    eventsRes,
    realtimeRes
  ] = await Promise.allSettled([
    // Totals
    runGa4Query({
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'engagementRate' },
        { name: 'eventCount' }
      ]
    }),
    // Trend
    runGa4Query({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' }
      ],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
    }),
    // Channels
    runGa4Query({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
    }),
    // Top Pages
    runGa4Query({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 50
    }),
    // Devices
    runGa4Query({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }]
    }),
    // Tech (Browser & OS)
    runGa4Query({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'browser' }, { name: 'operatingSystem' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15
    }),
    // Countries
    runGa4Query({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 100
    }),
    // Cities
    runGa4Query({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'city' }, { name: 'country' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 150
    }),
    // Country + Channel/Source breakdown
    runGa4Query({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }, { name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 200
    }),
    // Events
    runGa4Query({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 25
    }),
    // Realtime
    fetch(realtimeEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dimensions: [{ name: 'unifiedScreenName' }],
        metrics: [{ name: 'activeUsers' }]
      })
    }).then(async r => (r.ok ? r.json() : { rows: [] })).catch(() => ({ rows: [] }))
  ]);

  if (totalsRes.status !== 'fulfilled') {
    console.error('[GA4 Query Totals Error]:', totalsRes.reason);
    throw totalsRes.reason;
  }

  const totalsRaw = totalsRes.value?.rows?.[0]?.metricValues || [];
  const activeUsers = Number(totalsRaw[0]?.value || 0);
  const totalUsers = Number(totalsRaw[1]?.value || 0);
  const newUsers = Number(totalsRaw[2]?.value || 0);
  const sessions = Number(totalsRaw[3]?.value || 0);
  const screenPageViews = Number(totalsRaw[4]?.value || 0);
  const avgDuration = Number(totalsRaw[5]?.value || 0);
  const bounceRate = Number(totalsRaw[6]?.value || 0);
  const engagementRate = Number(totalsRaw[7]?.value || 0);
  const eventCount = Number(totalsRaw[8]?.value || 0);

  // Parse Trend
  const trendRows = trendRes.status === 'fulfilled' ? (trendRes.value.rows || []) : [];
  const dailyTrend = trendRows.map(r => {
    const rawDate = r.dimensionValues?.[0]?.value || '';
    const formatted = rawDate.length === 8 
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : rawDate;
    return {
      date: formatted,
      sessions: Number(r.metricValues?.[0]?.value || 0),
      activeUsers: Number(r.metricValues?.[1]?.value || 0),
      screenPageViews: Number(r.metricValues?.[2]?.value || 0),
      bounceRate: ((Number(r.metricValues?.[3]?.value || 0)) * 100).toFixed(1) + '%'
    };
  });

  // Parse Channels
  const channelRows = channelsRes.status === 'fulfilled' ? (channelsRes.value.rows || []) : [];
  const trafficChannels = channelRows.map(r => ({
    channel: r.dimensionValues?.[0]?.value || 'Other',
    sessions: Number(r.metricValues?.[0]?.value || 0),
    activeUsers: Number(r.metricValues?.[1]?.value || 0),
    bounceRate: ((Number(r.metricValues?.[2]?.value || 0)) * 100).toFixed(1) + '%',
    avgDurationSeconds: Math.round(Number(r.metricValues?.[3]?.value || 0))
  }));

  // Parse Top Pages
  const pageRows = pagesRes.status === 'fulfilled' ? (pagesRes.value.rows || []) : [];
  const topPages = pageRows.map(r => ({
    pagePath: r.dimensionValues?.[0]?.value || '/',
    pageTitle: r.dimensionValues?.[1]?.value || '',
    views: Number(r.metricValues?.[0]?.value || 0),
    activeUsers: Number(r.metricValues?.[1]?.value || 0),
    avgDurationSeconds: Math.round(Number(r.metricValues?.[2]?.value || 0)),
    bounceRate: ((Number(r.metricValues?.[3]?.value || 0)) * 100).toFixed(1) + '%'
  }));

  // Parse Devices
  const devRows = devicesRes.status === 'fulfilled' ? (devicesRes.value.rows || []) : [];
  const devices = devRows.map(r => ({
    category: (r.dimensionValues?.[0]?.value || 'desktop').toLowerCase(),
    sessions: Number(r.metricValues?.[0]?.value || 0),
    activeUsers: Number(r.metricValues?.[1]?.value || 0)
  }));

  // Parse Tech (Browsers & OS)
  const techRows = techRes.status === 'fulfilled' ? (techRes.value.rows || []) : [];
  const browsers = techRows.map(r => ({
    browser: r.dimensionValues?.[0]?.value || 'Unknown',
    os: r.dimensionValues?.[1]?.value || 'Unknown',
    sessions: Number(r.metricValues?.[0]?.value || 0),
    activeUsers: Number(r.metricValues?.[1]?.value || 0)
  }));

  // Parse Countries & Cities & Country Sources
  const countryRows = countriesRes.status === 'fulfilled' ? (countriesRes.value.rows || []) : [];
  const cityRows = citiesRes.status === 'fulfilled' ? (citiesRes.value.rows || []) : [];
  const countrySourceRows = countrySourcesRes.status === 'fulfilled' ? (countrySourcesRes.value.rows || []) : [];

  const countries = countryRows.map(r => ({
    country: r.dimensionValues?.[0]?.value || 'Unknown',
    sessions: Number(r.metricValues?.[0]?.value || 0),
    activeUsers: Number(r.metricValues?.[1]?.value || 0)
  }));
  const cities = cityRows.map(r => ({
    city: r.dimensionValues?.[0]?.value || 'Unknown',
    country: r.dimensionValues?.[1]?.value || '',
    sessions: Number(r.metricValues?.[0]?.value || 0),
    activeUsers: Number(r.metricValues?.[1]?.value || 0)
  }));

  const countrySources = {};
  countrySourceRows.forEach(r => {
    const cName = r.dimensionValues?.[0]?.value || 'Unknown';
    const channel = r.dimensionValues?.[1]?.value || 'Direct';
    const sess = Number(r.metricValues?.[0]?.value || 0);
    const users = Number(r.metricValues?.[1]?.value || 0);
    if (!countrySources[cName]) countrySources[cName] = [];
    countrySources[cName].push({ channel, sessions: sess, activeUsers: users });
  });

  // Parse Events
  const eventRows = eventsRes.status === 'fulfilled' ? (eventsRes.value.rows || []) : [];
  const events = eventRows.map(r => ({
    eventName: r.dimensionValues?.[0]?.value || '',
    eventCount: Number(r.metricValues?.[0]?.value || 0),
    totalUsers: Number(r.metricValues?.[1]?.value || 0)
  }));

  // Parse Realtime
  const rtData = realtimeRes.status === 'fulfilled' ? realtimeRes.value : { rows: [] };
  const rtTotalUsers = (rtData.rows || []).reduce((acc, r) => acc + Number(r.metricValues?.[0]?.value || 0), 0);
  const rtActivePages = (rtData.rows || []).map(r => ({
    screenName: r.dimensionValues?.[0]?.value || '/',
    activeUsers: Number(r.metricValues?.[0]?.value || 0)
  }));

  const realtime = {
    activeUsers: rtTotalUsers,
    activePages: rtActivePages,
    updatedAt: new Date().toISOString()
  };

  // Upsert into growth_analytics_performance
  await authPool.query(
    `INSERT INTO growth_analytics_performance (
      workspace_id, property_id, date_range, start_date, end_date,
      total_users, active_users, new_users, sessions, screen_page_views,
      average_session_duration, bounce_rate, engagement_rate, event_count,
      traffic_channels, top_pages, daily_trend, devices, browsers,
      countries, events, realtime, synced_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14,
      $15, $16, $17, $18, $19,
      $20, $21, $22, NOW()
    )
    ON CONFLICT (workspace_id, property_id, date_range)
    DO UPDATE SET
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      total_users = EXCLUDED.total_users,
      active_users = EXCLUDED.active_users,
      new_users = EXCLUDED.new_users,
      sessions = EXCLUDED.sessions,
      screen_page_views = EXCLUDED.screen_page_views,
      average_session_duration = EXCLUDED.average_session_duration,
      bounce_rate = EXCLUDED.bounce_rate,
      engagement_rate = EXCLUDED.engagement_rate,
      event_count = EXCLUDED.event_count,
      traffic_channels = EXCLUDED.traffic_channels,
      top_pages = EXCLUDED.top_pages,
      daily_trend = EXCLUDED.daily_trend,
      devices = EXCLUDED.devices,
      browsers = EXCLUDED.browsers,
      countries = EXCLUDED.countries,
      events = EXCLUDED.events,
      realtime = EXCLUDED.realtime,
      synced_at = NOW()`,
    [
      workspaceId,
      cleanPropId,
      dateRange,
      startDate,
      endDate,
      totalUsers,
      activeUsers,
      newUsers,
      sessions,
      screenPageViews,
      avgDuration,
      bounceRate * 100,
      engagementRate * 100,
      eventCount,
      JSON.stringify(trafficChannels),
      JSON.stringify(topPages),
      JSON.stringify(dailyTrend),
      JSON.stringify(devices),
      JSON.stringify(browsers),
      JSON.stringify({ countries, cities, countrySources }),
      JSON.stringify(events),
      JSON.stringify(realtime)
    ]
  );

  // Update connection sync status
  await authPool.query(
    `UPDATE integration_connections 
     SET last_sync_at = NOW(), last_sync_status = 'success', last_error = NULL, updated_at = NOW()
     WHERE id = $1`,
    [connection.id]
  );

  return {
    propertyId: cleanPropId,
    propertyName: connection.external_property_name || cleanPropId,
    dateRange,
    startDate,
    endDate,
    syncedAt: new Date().toISOString(),
    totals: {
      totalUsers,
      activeUsers,
      newUsers,
      sessions,
      screenPageViews,
      averageSessionDuration: avgDuration,
      bounceRate: (bounceRate * 100).toFixed(1) + '%',
      engagementRate: (engagementRate * 100).toFixed(1) + '%',
      eventCount
    },
    trafficChannels,
    topPages,
    dailyTrend,
    devices,
    browsers,
    demographics: { countries, cities, countrySources },
    events,
    realtime
  };
}

/**
 * Fetches fresh realtime data for Google Analytics 4.
 */
export async function getGrowthAnalyticsRealtime(workspaceId) {
  const connRes = await authPool.query(
    `SELECT * FROM integration_connections 
     WHERE workspace_id = $1 AND provider = 'google' AND integration_type = 'analytics'`,
    [workspaceId]
  );

  if (connRes.rows.length === 0 || connRes.rows[0].status !== 'active') {
    return { activeUsers: 0, activePages: [] };
  }

  const connection = connRes.rows[0];
  const propertyId = connection.external_property_id;
  if (!propertyId) return { activeUsers: 0, activePages: [] };

  const cleanPropId = String(propertyId).replace('properties/', '').trim();
  const accessToken = await getValidGrowthAccessToken(connection);
  const realtimeEndpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runRealtimeReport`;

  const res = await fetch(realtimeEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [{ name: 'activeUsers' }]
    })
  });

  if (!res.ok) {
    return { activeUsers: 0, activePages: [] };
  }

  const data = await res.json();
  const totalActive = (data.rows || []).reduce((acc, r) => acc + Number(r.metricValues?.[0]?.value || 0), 0);
  const activePages = (data.rows || []).map(r => ({
    screenName: r.dimensionValues?.[0]?.value || '/',
    activeUsers: Number(r.metricValues?.[0]?.value || 0)
  }));

  return {
    propertyId: cleanPropId,
    activeUsers: totalActive,
    activePages,
    updatedAt: new Date().toISOString()
  };
}
