import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authPool } from '../db.js';
import { isTokenRevoked } from '../utils/sessionRevocation.js';
import { ensureUserActivitySchema } from '../utils/userActivity.js';
import { fetchRevenueCatSubscriber } from './auth.js';
import { sendPasswordResetEmail } from './passwordReset.js';
import { buildStatsOverview } from '../utils/toolStatsOverview.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cerilas_admin_jwt_secret_2026';

export const requireAdmin = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  let decoded;
  try {
    decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  try {
    const result = await authPool.query(
      'SELECT id, email, first_name, last_name, is_admin, suspended_at, password_changed_at FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = result.rows[0];
    if (!user || isTokenRevoked(decoded, user.password_changed_at) || user.suspended_at) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    if (user.is_admin !== true) {
      return res.status(403).json({ error: 'This account does not have admin access.', code: 'NOT_ADMIN' });
    }
    req.admin = { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name };
    next();
  } catch (err) {
    console.error('[Admin] Auth check failed:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

router.use(async (req, res, next) => {
  await ensureUserActivitySchema();
  next();
});
router.use(requireAdmin);

router.get('/session', (req, res) => {
  res.json({ success: true, user: req.admin });
});

router.get('/analytics/overview', async (req, res) => {
  try {
    const data = await buildStatsOverview(req.query, { detailed: true });
    res.json({ status: 'success', data });
  } catch (err) {
    console.error('[Admin] Analytics overview failed:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch analytics' });
  }
});

// --- RevenueCat (Paddle store) subscription summary ---------------------------------------

const RC_CACHE_TTL_MS = 10 * 60 * 1000;
const rcCache = new Map();

function summarizeSubscriber(subscriber) {
  if (!subscriber) return { status: 'none', subscriptions: [] };
  const now = Date.now();
  const subs = Object.entries(subscriber.subscriptions || {}).map(([productId, s]) => {
    const expiresAt = s.expires_date ? new Date(s.expires_date).getTime() : null;
    const isActive = !s.refunded_at && (expiresAt === null || expiresAt > now);
    let status = 'expired';
    if (s.refunded_at) status = 'refunded';
    else if (isActive && s.billing_issues_detected_at) status = 'billing_issue';
    else if (isActive && s.unsubscribe_detected_at) status = 'canceled';
    else if (isActive && s.period_type === 'trial') status = 'trialing';
    else if (isActive) status = 'active';
    else if (s.grace_period_expires_date && new Date(s.grace_period_expires_date).getTime() > now) status = 'grace_period';
    return {
      product_id: productId,
      display_name: s.display_name || productId,
      store: s.store || null,
      is_sandbox: Boolean(s.is_sandbox),
      period_type: s.period_type || null,
      price: s.price && typeof s.price.amount === 'number' ? { amount: s.price.amount, currency: s.price.currency || 'USD' } : null,
      status,
      is_active: isActive,
      purchased_at: s.purchase_date || null,
      original_purchased_at: s.original_purchase_date || null,
      expires_at: s.expires_date || null,
      unsubscribe_detected_at: s.unsubscribe_detected_at || null,
      billing_issues_detected_at: s.billing_issues_detected_at || null,
      refunded_at: s.refunded_at || null,
      management_url: s.management_url || null
    };
  }).sort((a, b) => new Date(b.purchased_at || 0) - new Date(a.purchased_at || 0));

  const current = subs.find(s => s.is_active) || subs[0] || null;
  const willRenew = current && current.is_active && !current.unsubscribe_detected_at && current.status !== 'refunded';
  const entitlements = Object.entries(subscriber.entitlements || {})
    .filter(([, e]) => !e.expires_date || new Date(e.expires_date).getTime() > now)
    .map(([id]) => id);

  return {
    status: current ? current.status : 'none',
    current,
    last_payment_at: current?.purchased_at || null,
    last_payment_amount: current?.price || null,
    next_payment_at: willRenew ? current.expires_at : null,
    access_ends_at: current?.is_active && !willRenew ? current.expires_at : null,
    active_entitlements: entitlements,
    management_url: subscriber.management_url || current?.management_url || null,
    customer_since: subscriber.first_seen || null,
    subscriptions: subs
  };
}

async function getSubscriptionSummary(userId, { force = false } = {}) {
  const cached = rcCache.get(userId);
  if (!force && cached && Date.now() - cached.at < RC_CACHE_TTL_MS) return cached.data;
  const subscriber = await fetchRevenueCatSubscriber(userId);
  const data = { ...summarizeSubscriber(subscriber), fetched_at: new Date().toISOString(), source: subscriber ? 'revenuecat' : 'unavailable' };
  rcCache.set(userId, { at: Date.now(), data });
  return data;
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

// --- Users list & stats --------------------------------------------------------------------

const LIST_SORTS = {
  created: 'u.created_at',
  last_seen: 'u.last_seen_at',
  last_login: 'u.last_login_at',
  email: 'LOWER(u.email)',
  page_views: 'page_views_30d'
};

const USER_BASE_COLUMNS = `
  u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.phone, u.phone_verified, u.plan,
  u.subscription_status, u.cancel_at_period_end, u.plan_expires_at, u.created_at,
  u.last_login_at, u.last_seen_at, u.suspended_at, u.is_admin,
  (u.google_id IS NOT NULL) AS has_google, (u.password_hash IS NOT NULL) AS has_password,
  u.billing_country`;

function needsBillingLookup(row) {
  return (row.plan && row.plan !== 'free') || row.plan_expires_at || row.cancel_at_period_end
    || ['canceling', 'expired', 'past_due'].includes(row.subscription_status);
}

function formatListRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: [row.first_name, row.last_name].filter(Boolean).join(' ') || null,
    avatar_url: row.avatar_url || null,
    plan: row.plan || 'free',
    subscription_status: row.subscription_status || null,
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
    plan_expires_at: row.plan_expires_at,
    created_at: row.created_at,
    last_login_at: row.last_login_at,
    last_seen_at: row.last_seen_at,
    suspended: Boolean(row.suspended_at),
    is_admin: Boolean(row.is_admin),
    auth_methods: [row.has_password && 'password', row.has_google && 'google'].filter(Boolean),
    country: row.last_country || null,
    device_type: row.last_device || null,
    os: row.last_os || null,
    browser: row.last_browser || null,
    page_views_30d: Number(row.page_views_30d || 0),
    time_spent_30d_ms: Number(row.time_spent_30d_ms || 0),
    billing_lookup: Boolean(needsBillingLookup(row))
  };
}

router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(5, parseInt(req.query.pageSize, 10) || 25));
    const sortKey = LIST_SORTS[req.query.sort] ? req.query.sort : 'created';
    const direction = req.query.dir === 'asc' ? 'ASC' : 'DESC';

    const where = [];
    const params = [];
    const search = String(req.query.search || '').trim();
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(`(LOWER(u.email) LIKE $${params.length} OR LOWER(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) LIKE $${params.length})`);
    }
    switch (req.query.plan) {
      case 'free': where.push(`COALESCE(u.plan, 'free') = 'free'`); break;
      case 'pro': where.push(`u.plan = 'pro'`); break;
      case 'unlimited': where.push(`u.plan = 'unlimited'`); break;
      case 'paid': where.push(`u.plan IN ('pro', 'unlimited')`); break;
      default: break;
    }
    switch (req.query.status) {
      case 'active_24h': where.push(`u.last_seen_at > NOW() - INTERVAL '24 hours'`); break;
      case 'active_7d': where.push(`u.last_seen_at > NOW() - INTERVAL '7 days'`); break;
      case 'inactive_30d': where.push(`(u.last_seen_at IS NULL OR u.last_seen_at < NOW() - INTERVAL '30 days')`); break;
      case 'canceling': where.push(`u.cancel_at_period_end = TRUE`); break;
      case 'suspended': where.push(`u.suspended_at IS NOT NULL`); break;
      case 'admins': where.push(`u.is_admin = TRUE`); break;
      case 'new_7d': where.push(`u.created_at > NOW() - INTERVAL '7 days'`); break;
      default: break;
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRes = await authPool.query(`SELECT COUNT(*)::int AS total FROM users u ${whereSql}`, params);

    params.push(pageSize, (page - 1) * pageSize);
    const rowsRes = await authPool.query(
      `SELECT ${USER_BASE_COLUMNS},
              le.country AS last_country, le.device_type AS last_device, le.os AS last_os, le.browser AS last_browser,
              COALESCE(pv.views, 0) AS page_views_30d, COALESCE(pv.duration, 0) AS time_spent_30d_ms
       FROM users u
       LEFT JOIN LATERAL (
         SELECT country, device_type, os, browser FROM user_login_events
         WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
       ) le ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS views, SUM(duration_ms) AS duration FROM user_page_views
         WHERE user_id = u.id AND created_at > NOW() - INTERVAL '30 days'
       ) pv ON TRUE
       ${whereSql}
       ORDER BY ${LIST_SORTS[sortKey]} ${direction} NULLS LAST, u.id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      users: rowsRes.rows.map(formatListRow),
      total: countRes.rows[0].total,
      page,
      pageSize
    });
  } catch (err) {
    console.error('[Admin] List users error:', err);
    res.status(500).json({ error: 'Users could not be loaded.' });
  }
});

router.get('/users/stats', async (req, res) => {
  try {
    const [totals, countries, devices, signups, topPages] = await Promise.all([
      authPool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS new_7d,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS new_30d,
          COUNT(*) FILTER (WHERE last_seen_at > NOW() - INTERVAL '24 hours')::int AS active_24h,
          COUNT(*) FILTER (WHERE last_seen_at > NOW() - INTERVAL '7 days')::int AS active_7d,
          COUNT(*) FILTER (WHERE last_seen_at > NOW() - INTERVAL '30 days')::int AS active_30d,
          COUNT(*) FILTER (WHERE plan = 'pro')::int AS pro,
          COUNT(*) FILTER (WHERE plan = 'unlimited')::int AS unlimited,
          COUNT(*) FILTER (WHERE cancel_at_period_end = TRUE)::int AS canceling,
          COUNT(*) FILTER (WHERE suspended_at IS NOT NULL)::int AS suspended,
          COUNT(*) FILTER (WHERE google_id IS NOT NULL)::int AS google_users
        FROM users`),
      authPool.query(`
        SELECT COALESCE(country, '??') AS country, COUNT(*)::int AS users FROM (
          SELECT DISTINCT ON (user_id) user_id, country FROM user_login_events ORDER BY user_id, created_at DESC
        ) latest GROUP BY 1 ORDER BY 2 DESC LIMIT 8`),
      authPool.query(`
        SELECT COALESCE(device_type, 'unknown') AS device_type, COUNT(*)::int AS users FROM (
          SELECT DISTINCT ON (user_id) user_id, device_type FROM user_login_events ORDER BY user_id, created_at DESC
        ) latest GROUP BY 1 ORDER BY 2 DESC`),
      authPool.query(`
        SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
               (SELECT COUNT(*)::int FROM users WHERE created_at::date = d::date) AS signups,
               (SELECT COUNT(DISTINCT user_id)::int FROM user_page_views WHERE created_at::date = d::date) AS active_users
        FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') d
        ORDER BY d`),
      authPool.query(`
        SELECT path, COUNT(*)::int AS views, COUNT(DISTINCT user_id)::int AS users, COALESCE(SUM(duration_ms), 0)::bigint AS duration_ms
        FROM user_page_views WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY path ORDER BY views DESC LIMIT 10`)
    ]);
    res.json({
      success: true,
      totals: totals.rows[0],
      countries: countries.rows,
      devices: devices.rows,
      daily: signups.rows,
      top_pages: topPages.rows.map(r => ({ ...r, duration_ms: Number(r.duration_ms) }))
    });
  } catch (err) {
    console.error('[Admin] User stats error:', err);
    res.status(500).json({ error: 'Stats could not be loaded.' });
  }
});

// Billing summaries for a page of users (only those with a paid footprint hit RevenueCat)
router.get('/users/billing', async (req, res) => {
  try {
    const ids = String(req.query.ids || '').split(',').map(v => parseInt(v, 10)).filter(Number.isInteger).slice(0, 100);
    if (ids.length === 0) return res.json({ success: true, billing: {} });
    const rows = await authPool.query(
      'SELECT id, plan, plan_expires_at, cancel_at_period_end, subscription_status FROM users WHERE id = ANY($1::int[])',
      [ids]
    );
    const targets = rows.rows.filter(needsBillingLookup).map(r => r.id);
    const summaries = await mapWithConcurrency(targets, 4, id => getSubscriptionSummary(id, { force: req.query.refresh === '1' }));
    const billing = {};
    targets.forEach((id, i) => {
      const s = summaries[i];
      billing[id] = {
        status: s.status,
        product: s.current?.display_name || null,
        store: s.current?.store || null,
        is_sandbox: Boolean(s.current?.is_sandbox),
        last_payment_at: s.last_payment_at,
        last_payment_amount: s.last_payment_amount,
        next_payment_at: s.next_payment_at,
        access_ends_at: s.access_ends_at,
        source: s.source
      };
    });
    res.json({ success: true, billing });
  } catch (err) {
    console.error('[Admin] Billing summary error:', err);
    res.status(500).json({ error: 'Billing data could not be loaded.' });
  }
});

// --- User detail ---------------------------------------------------------------------------

async function loadUser(id) {
  const r = await authPool.query(
    `SELECT ${USER_BASE_COLUMNS}, u.password_changed_at, u.billing_type, u.billing_name, u.billing_city
     FROM users u WHERE u.id = $1`,
    [id]
  );
  return r.rows[0] || null;
}

router.get('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user.' });
    const user = await loadUser(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const [logins, pageStats, recentViews, devices, countries, daily, totals] = await Promise.all([
      authPool.query(
        `SELECT id, method, ip, country, city, device_type, os, browser, created_at
         FROM user_login_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [id]),
      authPool.query(
        `SELECT path, COUNT(*)::int AS views, COALESCE(SUM(duration_ms), 0)::bigint AS duration_ms,
                MAX(created_at) AS last_viewed_at, MIN(created_at) AS first_viewed_at
         FROM user_page_views WHERE user_id = $1 GROUP BY path ORDER BY views DESC, last_viewed_at DESC LIMIT 100`, [id]),
      authPool.query(
        `SELECT id, path, title, referrer, country, device_type, os, browser, duration_ms, session_id, created_at
         FROM user_page_views WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`, [id]),
      authPool.query(
        `SELECT device_type, os, browser, COUNT(*)::int AS logins, MAX(created_at) AS last_used_at
         FROM user_login_events WHERE user_id = $1 GROUP BY 1, 2, 3 ORDER BY last_used_at DESC LIMIT 20`, [id]),
      authPool.query(
        `SELECT country, COUNT(*)::int AS events, MAX(created_at) AS last_seen_at FROM (
           SELECT country, created_at FROM user_login_events WHERE user_id = $1
           UNION ALL SELECT country, created_at FROM user_page_views WHERE user_id = $1
         ) x WHERE country IS NOT NULL GROUP BY country ORDER BY events DESC`, [id]),
      authPool.query(
        `SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
                COUNT(pv.id)::int AS views, COALESCE(SUM(pv.duration_ms), 0)::bigint AS duration_ms
         FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') d
         LEFT JOIN user_page_views pv ON pv.user_id = $1 AND pv.created_at::date = d::date
         GROUP BY d ORDER BY d`, [id]),
      authPool.query(
        `SELECT COUNT(*)::int AS views, COALESCE(SUM(duration_ms), 0)::bigint AS duration_ms,
                COUNT(DISTINCT session_id)::int AS sessions, COUNT(DISTINCT path)::int AS unique_pages
         FROM user_page_views WHERE user_id = $1`, [id])
    ]);

    const toNum = rows => rows.map(r => ({ ...r, duration_ms: Number(r.duration_ms || 0) }));
    res.json({
      success: true,
      user: {
        ...formatListRow({ ...user, last_country: logins.rows[0]?.country, last_device: logins.rows[0]?.device_type, last_os: logins.rows[0]?.os, last_browser: logins.rows[0]?.browser }),
        phone: user.phone || null,
        phone_verified: Boolean(user.phone_verified),
        password_changed_at: user.password_changed_at,
        billing_type: user.billing_type || null,
        billing_name: user.billing_name || null,
        billing_city: user.billing_city || null,
        billing_country: user.billing_country || null
      },
      totals: { ...totals.rows[0], duration_ms: Number(totals.rows[0].duration_ms || 0), logins: logins.rowCount },
      logins: logins.rows,
      page_stats: toNum(pageStats.rows),
      recent_views: recentViews.rows,
      devices: devices.rows,
      countries: countries.rows,
      daily: toNum(daily.rows)
    });
  } catch (err) {
    console.error('[Admin] User detail error:', err);
    res.status(500).json({ error: 'User could not be loaded.' });
  }
});

router.get('/users/:id/subscription', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user.' });
    const summary = await getSubscriptionSummary(id, { force: req.query.refresh === '1' });
    res.json({ success: true, subscription: summary });
  } catch (err) {
    console.error('[Admin] Subscription fetch error:', err);
    res.status(500).json({ error: 'Subscription could not be loaded.' });
  }
});

// --- Management actions --------------------------------------------------------------------

router.post('/users/:id/revoke-sessions', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const r = await authPool.query('UPDATE users SET password_changed_at = NOW() WHERE id = $1 RETURNING id', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, message: 'All sessions were signed out.' });
  } catch (err) {
    console.error('[Admin] Revoke sessions error:', err);
    res.status(500).json({ error: 'Sessions could not be revoked.' });
  }
});

router.post('/users/:id/suspend', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const suspend = req.body?.suspended !== false;
    if (id === req.admin.id) return res.status(400).json({ error: 'You cannot suspend your own account.' });
    const target = await loadUser(id);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (suspend && target.is_admin) return res.status(400).json({ error: 'Admin accounts cannot be suspended here.' });
    await authPool.query('UPDATE users SET suspended_at = $1 WHERE id = $2', [suspend ? new Date() : null, id]);
    res.json({ success: true, suspended: suspend });
  } catch (err) {
    console.error('[Admin] Suspend error:', err);
    res.status(500).json({ error: 'Account status could not be updated.' });
  }
});

router.post('/users/:id/password-reset', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const target = await loadUser(id);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    await sendPasswordResetEmail(req, target.email, req.body?.language || 'en');
    res.json({ success: true, message: 'Password reset email sent (subject to per-user rate limits).' });
  } catch (err) {
    console.error('[Admin] Password reset email error:', err);
    res.status(500).json({ error: 'Reset email could not be sent.' });
  }
});

export default router;
