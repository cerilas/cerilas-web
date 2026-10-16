import { authPool } from '../db.js';

let schemaReady = null;

export function ensureUserActivitySchema() {
  if (!schemaReady) {
    schemaReady = authPool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

      CREATE TABLE IF NOT EXISTS user_login_events (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        method VARCHAR(20) NOT NULL,
        ip VARCHAR(64),
        country VARCHAR(8),
        city VARCHAR(120),
        device_type VARCHAR(20),
        os VARCHAR(60),
        browser VARCHAR(60),
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_user_login_events_user ON user_login_events(user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS user_page_views (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(64),
        path VARCHAR(500) NOT NULL,
        title VARCHAR(300),
        referrer VARCHAR(500),
        country VARCHAR(8),
        device_type VARCHAR(20),
        os VARCHAR(60),
        browser VARCHAR(60),
        duration_ms INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_user_page_views_user ON user_page_views(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_page_views_path ON user_page_views(path);
    `).catch((err) => {
      schemaReady = null;
      console.error('[UserActivity] Schema init failed:', err.message);
    });
  }
  return schemaReady;
}

const OS_RULES = [
  [/windows nt/i, 'Windows'],
  [/iphone|ipod/i, 'iOS'],
  [/ipad/i, 'iPadOS'],
  [/android/i, 'Android'],
  [/cros/i, 'ChromeOS'],
  [/mac os x|macintosh/i, 'macOS'],
  [/linux/i, 'Linux']
];

const BROWSER_RULES = [
  [/edg(e|a|ios)?\/(\d+)/i, 'Edge'],
  [/opr\/(\d+)|opera/i, 'Opera'],
  [/samsungbrowser\/(\d+)/i, 'Samsung Internet'],
  [/yabrowser\/(\d+)/i, 'Yandex'],
  [/firefox\/(\d+)|fxios\/(\d+)/i, 'Firefox'],
  [/crios\/(\d+)/i, 'Chrome'],
  [/chrome\/(\d+)/i, 'Chrome'],
  [/version\/(\d+).*safari/i, 'Safari'],
  [/safari/i, 'Safari']
];

export function parseUserAgent(ua = '') {
  const source = String(ua || '');
  const os = OS_RULES.find(([re]) => re.test(source))?.[1] || 'Other';

  let browser = 'Other';
  for (const [re, name] of BROWSER_RULES) {
    const m = source.match(re);
    if (m) {
      const version = m.slice(1).find(v => v && /^\d+$/.test(v));
      browser = version ? `${name} ${version}` : name;
      break;
    }
  }

  let deviceType = 'desktop';
  if (/bot|crawl|spider|slurp|headless/i.test(source)) deviceType = 'bot';
  else if (/ipad|tablet|(android(?!.*mobile))/i.test(source)) deviceType = 'tablet';
  else if (/mobi|iphone|ipod|android/i.test(source)) deviceType = 'mobile';

  return { deviceType, os, browser };
}

// Cloudflare sits in front of production and adds visitor geo headers.
export function getRequestContext(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = String(req.headers['cf-connecting-ip'] || forwarded || req.socket?.remoteAddress || '').slice(0, 64) || null;
  const rawCountry = String(req.headers['cf-ipcountry'] || '').toUpperCase();
  const country = /^[A-Z]{2}$/.test(rawCountry) && rawCountry !== 'XX' ? rawCountry : null;
  const city = req.headers['cf-ipcity'] ? decodeHeader(req.headers['cf-ipcity']).slice(0, 120) : null;
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);
  return { ip, country, city, userAgent, ...parseUserAgent(userAgent) };
}

function decodeHeader(value) {
  try {
    return decodeURIComponent(String(value));
  } catch {
    return String(value);
  }
}

export async function recordLoginEvent(req, userId, method) {
  if (!userId) return;
  try {
    await ensureUserActivitySchema();
    const ctx = getRequestContext(req);
    await authPool.query(
      `INSERT INTO user_login_events (user_id, method, ip, country, city, device_type, os, browser, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, method, ctx.ip, ctx.country, ctx.city, ctx.deviceType, ctx.os, ctx.browser, ctx.userAgent]
    );
    await authPool.query(
      'UPDATE users SET last_login_at = NOW(), last_seen_at = NOW() WHERE id = $1',
      [userId]
    );
  } catch (err) {
    console.warn('[UserActivity] Login event not recorded:', err.message);
  }
}
