import { Router } from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_analytics_events (
      id SERIAL PRIMARY KEY,
      visitor_id VARCHAR(100),
      session_id VARCHAR(100),
      event_type VARCHAR(40) NOT NULL,
      path TEXT,
      page_title TEXT,
      referrer TEXT,
      element_tag VARCHAR(80),
      element_text TEXT,
      element_href TEXT,
      duration_seconds INTEGER,
      country VARCHAR(8),
      user_agent TEXT,
      ip_hash VARCHAR(128),
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_site_analytics_created ON site_analytics_events(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_site_analytics_event_type ON site_analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_site_analytics_session ON site_analytics_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_site_analytics_path ON site_analytics_events(path);
  `);
};

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
};

const getCountry = (req) => {
  const country =
    req.headers['cf-ipcountry'] ||
    req.headers['x-vercel-ip-country'] ||
    req.headers['x-country-code'] ||
    req.headers['x-appengine-country'];

  return String(country || 'XX').slice(0, 8).toUpperCase();
};

const hashIp = (ip) => {
  if (!ip) return '';
  return crypto.createHash('sha256').update(`${ip}:${process.env.JWT_SECRET || 'cerilas'}`).digest('hex');
};

const clampText = (value, max = 500) => String(value || '').trim().slice(0, max);
const isAdminPath = (value) => String(value || '').startsWith('/admin');
const publicOnlySql = `AND COALESCE(path, '') NOT LIKE '/admin%'`;

router.post('/event', async (req, res) => {
  try {
    await ensureTable();

    const {
      visitor_id,
      session_id,
      event_type,
      path,
      page_title,
      referrer,
      element_tag,
      element_text,
      element_href,
      duration_seconds,
      metadata,
    } = req.body || {};

    const allowedEvents = new Set(['page_view', 'click', 'session_duration']);
    if (!allowedEvents.has(event_type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    if (isAdminPath(path)) {
      return res.status(204).end();
    }

    await pool.query(
      `INSERT INTO site_analytics_events (
        visitor_id, session_id, event_type, path, page_title, referrer,
        element_tag, element_text, element_href, duration_seconds,
        country, user_agent, ip_hash, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        clampText(visitor_id, 100),
        clampText(session_id, 100),
        event_type,
        clampText(path, 1000),
        clampText(page_title, 300),
        clampText(referrer, 1000),
        clampText(element_tag, 80),
        clampText(element_text, 300),
        clampText(element_href, 1000),
        Number.isFinite(Number(duration_seconds)) ? Math.max(0, Math.min(86400, Number(duration_seconds))) : null,
        getCountry(req),
        clampText(req.headers['user-agent'], 1000),
        hashIp(getClientIp(req)),
        metadata && typeof metadata === 'object' ? JSON.stringify(metadata) : '{}',
      ]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Analytics event error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    await ensureTable();

    const days = Math.max(1, Math.min(365, Number(req.query.days) || 30));
    const sinceSql = `NOW() - ($1::int * INTERVAL '1 day')`;
    const params = [days];

    const overview = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS page_views,
        COUNT(DISTINCT visitor_id)::int AS unique_visitors,
        COUNT(DISTINCT session_id)::int AS unique_sessions,
        COUNT(*) FILTER (WHERE event_type = 'click')::int AS clicks
      FROM site_analytics_events
      WHERE created_at >= ${sinceSql} ${publicOnlySql}
    `, params);

    const sessionDuration = await pool.query(`
      WITH sessions AS (
        SELECT
          session_id,
          EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))::int AS computed_duration,
          MAX(duration_seconds) FILTER (WHERE event_type = 'session_duration') AS reported_duration
        FROM site_analytics_events
        WHERE created_at >= ${sinceSql} ${publicOnlySql} AND session_id IS NOT NULL AND session_id <> ''
        GROUP BY session_id
      )
      SELECT COALESCE(ROUND(AVG(GREATEST(COALESCE(reported_duration, 0), COALESCE(computed_duration, 0))))::int, 0) AS avg_session_seconds
      FROM sessions
    `, params);

    const byPage = await pool.query(`
      SELECT path, COUNT(*)::int AS views, COUNT(DISTINCT session_id)::int AS sessions
      FROM site_analytics_events
      WHERE created_at >= ${sinceSql} ${publicOnlySql} AND event_type = 'page_view'
      GROUP BY path
      ORDER BY views DESC
      LIMIT 20
    `, params);

    const byCountry = await pool.query(`
      SELECT COALESCE(NULLIF(country, ''), 'XX') AS country, COUNT(*)::int AS views, COUNT(DISTINCT session_id)::int AS sessions
      FROM site_analytics_events
      WHERE created_at >= ${sinceSql} ${publicOnlySql} AND event_type = 'page_view'
      GROUP BY COALESCE(NULLIF(country, ''), 'XX')
      ORDER BY views DESC
      LIMIT 20
    `, params);

    const clicks = await pool.query(`
      SELECT
        path,
        COALESCE(NULLIF(element_text, ''), NULLIF(element_href, ''), element_tag, 'Bilinmeyen') AS label,
        element_href,
        COUNT(*)::int AS clicks
      FROM site_analytics_events
      WHERE created_at >= ${sinceSql} ${publicOnlySql} AND event_type = 'click'
      GROUP BY path, label, element_href
      ORDER BY clicks DESC
      LIMIT 20
    `, params);

    const daily = await pool.query(`
      SELECT
        TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date,
        COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS views,
        COUNT(DISTINCT session_id)::int AS sessions
      FROM site_analytics_events
      WHERE created_at >= ${sinceSql} ${publicOnlySql}
      GROUP BY created_at::date
      ORDER BY created_at::date ASC
    `, params);

    res.json({
      range_days: days,
      overview: {
        ...overview.rows[0],
        avg_session_seconds: sessionDuration.rows[0]?.avg_session_seconds || 0,
      },
      byPage: byPage.rows,
      byCountry: byCountry.rows,
      clicks: clicks.rows,
      daily: daily.rows,
    });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
