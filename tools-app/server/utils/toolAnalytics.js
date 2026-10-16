import pool from '../db.js';
import { detectBot } from './botDetector.js';
import { getRequestContext } from './userActivity.js';

// Human = not a bot and not the team's own (admin) browsing.
export const HUMAN_SQL = `is_bot = false AND client_type IS DISTINCT FROM 'internal'`;
export const INTERNAL_SQL = `is_bot = false AND client_type = 'internal'`;
export const VIEW_SQL = `event_type = 'view'`;
export const BOT_HIT_SQL = `event_type IN ('view', 'crawler_visit')`;
export const DOWNLOAD_SQL = `(event_type LIKE 'download%' OR event_type = 'pdf_export')`;
export const COPY_SQL = `event_type LIKE 'copy%'`;
// ATS & PDF RAG only report completions server-side (as ai_scan); other tools send their own "use".
export const USE_SQL = `(event_type IN ('use', 'calculate', 'scan', 'analyze', 'verify', 'convert', 'session_complete', 'complete_session')
  OR (event_type = 'ai_scan' AND tool_slug IN ('ats-resume-checker', 'pdf-rag-cleaner')))`;

const SCRIPTED_VISITOR = { isBot: true, botName: 'Scripted Visitor (behavior)', category: 'automated_browser' };
const EVENT_TYPE_RE = /^[a-z0-9_:-]{1,50}$/i;
const VISITOR_ID_RE = /^[a-z0-9_-]{6,100}$/i;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,120}$/;
const MAX_METADATA_BYTES = 4000;

let schemaPromise = null;

export function ensureToolAnalyticsSchema() {
  if (!schemaPromise) {
    schemaPromise = pool.query(`
      ALTER TABLE tool_usage_events ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE tool_usage_events ADD COLUMN IF NOT EXISTS bot_name VARCHAR(120);
      ALTER TABLE tool_usage_events ADD COLUMN IF NOT EXISTS client_type VARCHAR(40);
      ALTER TABLE tool_usage_events ADD COLUMN IF NOT EXISTS user_agent TEXT;
      ALTER TABLE tool_usage_events ADD COLUMN IF NOT EXISTS country VARCHAR(2);
      ALTER TABLE tool_usage_events ADD COLUMN IF NOT EXISTS device_type VARCHAR(16);
      ALTER TABLE tool_unique_visitors ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE tool_unique_visitors ADD COLUMN IF NOT EXISTS bot_name VARCHAR(120);
      ALTER TABLE tool_unique_visitors ADD COLUMN IF NOT EXISTS client_type VARCHAR(40);
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS bot_view_count INTEGER DEFAULT 0;
      ALTER TABLE cerilas_tools ADD COLUMN IF NOT EXISTS bot_unique_visitors_count INTEGER DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_tool_events_created_at ON tool_usage_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_tool_events_visitor_created ON tool_usage_events(visitor_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tool_events_bot_created ON tool_usage_events(is_bot, created_at);
    `).catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

export function sanitizeEventInput({ eventType, visitorId, metadata }) {
  const cleanType = typeof eventType === 'string' && EVENT_TYPE_RE.test(eventType) ? eventType : null;
  const cleanVisitor = typeof visitorId === 'string' && VISITOR_ID_RE.test(visitorId) ? visitorId : null;
  let cleanMeta = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};
  if (JSON.stringify(cleanMeta).length > MAX_METADATA_BYTES) {
    cleanMeta = { truncated: true, isWebDriver: cleanMeta.isWebDriver === true };
  }
  return { eventType: cleanType, visitorId: cleanVisitor, metadata: cleanMeta };
}

/**
 * Behavioral automation check for traffic that looks like a normal browser:
 * scripted visitors fire views at machine-regular intervals or at inhuman rates.
 */
export function looksScripted(timestamps) {
  const times = timestamps.map((t) => new Date(t).getTime()).filter(Number.isFinite).sort((a, b) => a - b);
  if (times.length >= 7) {
    const recent = times.slice(-7);
    const gaps = recent.slice(1).map((t, i) => t - recent[i]);
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const sd = Math.sqrt(gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length);
    if (mean > 0 && mean < 60_000 && sd / mean < 0.12) return true;
  }
  const oneMinuteAgo = (times[times.length - 1] || 0) - 60_000;
  return times.filter((t) => t >= oneMinuteAgo).length > 20;
}

async function classifyEvent(req, { eventType, visitorId, metadata }) {
  const botInfo = detectBot(req, metadata);
  if (botInfo.isBot) return botInfo;

  if (visitorId) {
    const recent = await pool.query(
      `SELECT created_at, is_bot, client_type FROM tool_usage_events
       WHERE visitor_id = $1 AND created_at > NOW() - INTERVAL '30 minutes'
       ORDER BY created_at DESC LIMIT 25`,
      [visitorId]
    );
    if (recent.rows.some((r) => r.is_bot && r.client_type === SCRIPTED_VISITOR.category)) {
      return SCRIPTED_VISITOR;
    }
    if (eventType === 'view') {
      const viewTimes = recent.rows.map((r) => r.created_at);
      viewTimes.push(new Date());
      if (looksScripted(viewTimes)) return SCRIPTED_VISITOR;
    }
  }

  if (metadata?.internal === true) {
    return { isBot: false, botName: null, category: 'internal' };
  }
  return botInfo;
}

async function insertEvent(req, { slug, eventType, visitorId, metadata }, classification) {
  const ctx = getRequestContext(req);
  await pool.query(
    `INSERT INTO tool_usage_events
       (tool_slug, event_type, visitor_id, metadata, is_bot, bot_name, client_type, user_agent, country, device_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      slug, eventType, visitorId, JSON.stringify(metadata),
      classification.isBot, classification.botName, classification.category,
      ctx.userAgent || null, ctx.country, classification.isBot ? 'bot' : ctx.deviceType
    ]
  );
}

/**
 * Records a browser-reported tool event and updates the cached counters on cerilas_tools.
 * Counters only ever move for real human traffic; bots get their own counters.
 */
export async function recordToolEvent(req, slug, input) {
  await ensureToolAnalyticsSchema();
  const event = sanitizeEventInput(input);
  if (!event.eventType) {
    const err = new Error('Invalid eventType');
    err.status = 400;
    throw err;
  }
  if (!SLUG_RE.test(slug) || slug === 'null' || slug === 'undefined') {
    const err = new Error('Invalid tool slug');
    err.status = 400;
    throw err;
  }

  const classification = await classifyEvent(req, event);
  await insertEvent(req, { slug, ...event }, classification);

  const { eventType, visitorId } = event;
  if (classification.isBot) {
    if (eventType === 'view') {
      await pool.query('UPDATE cerilas_tools SET bot_view_count = COALESCE(bot_view_count, 0) + 1 WHERE slug = $1', [slug]);
      if (visitorId) {
        const uniqueBot = await pool.query(
          `INSERT INTO tool_unique_visitors (tool_slug, visitor_id, is_bot, bot_name, client_type)
           VALUES ($1, $2, true, $3, $4)
           ON CONFLICT (tool_slug, visitor_id)
           DO UPDATE SET last_visited_at = NOW(), view_count = tool_unique_visitors.view_count + 1
           RETURNING (xmax = 0) AS is_new_visitor`,
          [slug, visitorId, classification.botName, classification.category]
        );
        if (uniqueBot.rows[0]?.is_new_visitor) {
          await pool.query('UPDATE cerilas_tools SET bot_unique_visitors_count = COALESCE(bot_unique_visitors_count, 0) + 1 WHERE slug = $1', [slug]);
        }
      }
    }
  } else if (classification.category !== 'internal') {
    if (eventType === 'view') {
      await pool.query('UPDATE cerilas_tools SET view_count = COALESCE(view_count, 0) + 1 WHERE slug = $1', [slug]);
      if (visitorId) {
        const unique = await pool.query(
          `INSERT INTO tool_unique_visitors (tool_slug, visitor_id, is_bot, client_type)
           VALUES ($1, $2, false, 'human')
           ON CONFLICT (tool_slug, visitor_id)
           DO UPDATE SET last_visited_at = NOW(), view_count = tool_unique_visitors.view_count + 1
           RETURNING (xmax = 0) AS is_new_visitor`,
          [slug, visitorId]
        );
        if (unique.rows[0]?.is_new_visitor) {
          await pool.query('UPDATE cerilas_tools SET unique_visitors_count = COALESCE(unique_visitors_count, 0) + 1 WHERE slug = $1', [slug]);
        }
      }
    } else {
      const column = eventCounterColumn(slug, eventType);
      if (column) {
        await pool.query(
          `UPDATE cerilas_tools SET ${column} = COALESCE(${column}, 0) + 1, last_used_at = NOW() WHERE slug = $1`,
          [slug]
        );
      }
    }
  }

  return classification;
}

function eventCounterColumn(slug, eventType) {
  if (eventType.startsWith('download') || eventType === 'pdf_export') return 'download_count';
  if (eventType.startsWith('copy')) return 'copy_count';
  if (['use', 'calculate', 'scan', 'analyze', 'verify', 'convert', 'session_complete', 'complete_session'].includes(eventType)) return 'use_count';
  if (eventType === 'ai_scan' && ['ats-resume-checker', 'pdf-rag-cleaner'].includes(slug)) return 'use_count';
  return null;
}

/**
 * Records an event emitted by the server itself (e.g. AI scans used for rate limiting),
 * applying the same bot classification as browser events.
 */
export async function recordServerToolEvent(req, slug, eventType, visitorId, metadata = {}) {
  try {
    await ensureToolAnalyticsSchema();
    const event = sanitizeEventInput({ eventType, visitorId, metadata });
    const classification = detectBot(req, {});
    await insertEvent(req, { slug, ...event }, classification);
    const column = !classification.isBot && eventCounterColumn(slug, event.eventType);
    if (column) {
      await pool.query(
        `UPDATE cerilas_tools SET ${column} = COALESCE(${column}, 0) + 1, last_used_at = NOW() WHERE slug = $1`,
        [slug]
      );
    }
  } catch (err) {
    console.warn(`[ToolAnalytics] ${slug} ${eventType} not recorded:`, err.message);
  }
}
