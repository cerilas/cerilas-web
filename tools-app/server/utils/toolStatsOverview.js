import pool from '../db.js';
import {
  ensureToolAnalyticsSchema,
  HUMAN_SQL,
  INTERNAL_SQL,
  VIEW_SQL,
  BOT_HIT_SQL,
  DOWNLOAD_SQL,
  COPY_SQL,
  USE_SQL
} from './toolAnalytics.js';

const RANGE_DAYS = {
  '3days': 3,
  '7days': 7,
  '30days': 30,
  '90days': 90,
  '180days': 180,
  '365days': 365
};

const RANGE_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  '3days': 'Last 3 Days',
  '7days': 'Last 7 Days',
  '30days': 'Last 30 Days',
  '90days': 'Last 3 Months',
  '180days': 'Last 6 Months',
  '365days': 'Last 1 Year'
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TASK_SQL = `${DOWNLOAD_SQL} OR ${COPY_SQL} OR ${USE_SQL}`;

function resolveRange({ range = 'all', startDate, endDate }) {
  if (range === 'today') {
    return { range, label: RANGE_LABELS.today, where: `created_at >= CURRENT_DATE`, params: [] };
  }
  if (range === 'yesterday') {
    return {
      range,
      label: RANGE_LABELS.yesterday,
      where: `created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE`,
      params: []
    };
  }
  if (RANGE_DAYS[range]) {
    return { range, label: RANGE_LABELS[range], where: `created_at >= NOW() - INTERVAL '${RANGE_DAYS[range]} days'`, params: [] };
  }
  if (range === 'custom' && ISO_DATE.test(startDate || '') && ISO_DATE.test(endDate || '')) {
    return {
      range,
      label: `Custom Range (${startDate} - ${endDate})`,
      where: `created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')`,
      params: [startDate, endDate]
    };
  }
  return { range: 'all', label: 'All Time', where: 'TRUE', params: [] };
}

const pct = (part, whole) => (whole > 0 ? Number(((part / whole) * 100).toFixed(1)) : 0);

/**
 * Builds the tools telemetry overview from raw events so every range (including All Time)
 * uses the same definitions: a "unique visitor" is a distinct human visitor id across the site.
 */
export async function buildStatsOverview(query = {}, { detailed = false } = {}) {
  await ensureToolAnalyticsSchema();
  const { range, label, where, params } = resolveRange(query);
  const q = (sql) => pool.query(sql, params).then((r) => r.rows);
  const inRange = (alias = '') => where.replace(/\bcreated_at\b/g, `${alias}created_at`);

  const [toolsRows, totalsRows, visitorMixRows, eventTypes, botBreakdown, botCategories, daily] = await Promise.all([
    q(`
      WITH agg AS (
        SELECT
          tool_slug,
          COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${VIEW_SQL})::int AS view_count,
          COUNT(DISTINCT visitor_id) FILTER (WHERE ${HUMAN_SQL})::int AS unique_visitors_count,
          COUNT(*) FILTER (WHERE is_bot AND ${BOT_HIT_SQL})::int AS bot_view_count,
          COUNT(DISTINCT bot_name) FILTER (WHERE is_bot)::int AS bot_unique_visitors_count,
          COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${DOWNLOAD_SQL})::int AS download_count,
          COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${COPY_SQL})::int AS copy_count,
          COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${USE_SQL})::int AS use_count,
          COUNT(DISTINCT visitor_id) FILTER (WHERE ${HUMAN_SQL} AND (${TASK_SQL}))::int AS converted_visitors,
          COUNT(DISTINCT visitor_id) FILTER (WHERE ${HUMAN_SQL} AND ${DOWNLOAD_SQL})::int AS downloading_visitors,
          MAX(created_at) FILTER (WHERE ${HUMAN_SQL}) AS last_used_at
        FROM tool_usage_events
        WHERE ${inRange()}
        GROUP BY tool_slug
      )
      SELECT
        ct.id, ct.title, COALESCE(ct.slug, agg.tool_slug) AS slug, ct.category, COALESCE(ct.is_active, true) AS is_active,
        ct.sort_order, ct.created_at,
        COALESCE(agg.view_count, 0) AS view_count,
        COALESCE(agg.unique_visitors_count, 0) AS unique_visitors_count,
        COALESCE(agg.bot_view_count, 0) AS bot_view_count,
        COALESCE(agg.bot_unique_visitors_count, 0) AS bot_unique_visitors_count,
        COALESCE(agg.download_count, 0) AS download_count,
        COALESCE(agg.copy_count, 0) AS copy_count,
        COALESCE(agg.use_count, 0) AS use_count,
        COALESCE(agg.converted_visitors, 0) AS converted_visitors,
        COALESCE(agg.downloading_visitors, 0) AS downloading_visitors,
        agg.last_used_at
      FROM cerilas_tools ct
      FULL OUTER JOIN agg ON agg.tool_slug = ct.slug
      WHERE ct.slug IS NOT NULL OR agg.tool_slug NOT IN ('null', 'undefined')
      ORDER BY ct.sort_order ASC NULLS LAST, agg.view_count DESC NULLS LAST
    `),
    q(`
      SELECT
        COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${VIEW_SQL})::int AS total_views,
        COUNT(DISTINCT visitor_id) FILTER (WHERE ${HUMAN_SQL})::int AS total_unique_visitors,
        COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND visitor_id IS NULL)::int AS anonymous_human_events,
        COUNT(*) FILTER (WHERE ${HUMAN_SQL})::int AS total_human_events,
        COUNT(*) FILTER (WHERE is_bot AND ${BOT_HIT_SQL})::int AS total_bot_views,
        COUNT(*) FILTER (WHERE is_bot)::int AS total_bot_events,
        COUNT(DISTINCT bot_name) FILTER (WHERE is_bot)::int AS total_unique_bots,
        COUNT(*) FILTER (WHERE ${INTERNAL_SQL})::int AS internal_events,
        COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${DOWNLOAD_SQL})::int AS total_downloads,
        COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${COPY_SQL})::int AS total_copies,
        COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${USE_SQL})::int AS total_uses,
        COUNT(DISTINCT visitor_id) FILTER (WHERE ${HUMAN_SQL} AND (${TASK_SQL}))::int AS converted_visitors,
        COUNT(DISTINCT visitor_id) FILTER (WHERE ${HUMAN_SQL} AND ${DOWNLOAD_SQL})::int AS downloading_visitors,
        (SELECT COUNT(*)::int FROM cerilas_tools) AS total_tools,
        (SELECT COUNT(*)::int FROM cerilas_tools WHERE is_active = true) AS active_tools
      FROM tool_usage_events
      WHERE ${inRange()}
    `),
    q(`
      WITH first_seen AS (
        SELECT visitor_id, MIN(created_at) AS created_at
        FROM tool_usage_events
        WHERE ${HUMAN_SQL} AND visitor_id IS NOT NULL
        GROUP BY visitor_id
      ),
      active AS (
        SELECT visitor_id, COUNT(*) FILTER (WHERE ${VIEW_SQL}) AS views, COUNT(DISTINCT tool_slug) AS tools
        FROM tool_usage_events
        WHERE ${HUMAN_SQL} AND visitor_id IS NOT NULL AND ${inRange()}
        GROUP BY visitor_id
      )
      SELECT
        COUNT(*) FILTER (WHERE ${inRange('f.')})::int AS new_visitors,
        COUNT(*) FILTER (WHERE NOT (${inRange('f.')}))::int AS returning_visitors,
        COALESCE(ROUND(AVG(a.views)::numeric, 1), 0)::float AS avg_views_per_visitor,
        COALESCE(ROUND(AVG(a.tools)::numeric, 1), 0)::float AS avg_tools_per_visitor
      FROM active a
      JOIN first_seen f ON f.visitor_id = a.visitor_id
    `),
    q(`
      SELECT event_type, COUNT(*)::int AS count
      FROM tool_usage_events
      WHERE ${HUMAN_SQL} AND ${inRange()}
      GROUP BY event_type
      ORDER BY count DESC
    `),
    q(`
      SELECT COALESCE(bot_name, 'Generic Crawler') AS bot_name, MAX(client_type) AS category, COUNT(*)::int AS count,
             MAX(created_at) AS last_seen_at
      FROM tool_usage_events
      WHERE is_bot AND ${inRange()}
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 15
    `),
    q(`
      SELECT COALESCE(client_type, 'generic_bot') AS category, COUNT(*)::int AS count
      FROM tool_usage_events
      WHERE is_bot AND ${inRange()}
      GROUP BY 1
      ORDER BY count DESC
    `),
    q(`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
        COUNT(DISTINCT visitor_id) FILTER (WHERE ${HUMAN_SQL})::int AS humans,
        COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${VIEW_SQL})::int AS views,
        COUNT(*) FILTER (WHERE is_bot)::int AS bots
      FROM tool_usage_events
      WHERE ${range === 'all' ? `created_at >= NOW() - INTERVAL '30 days'` : inRange()}
      GROUP BY 1
      ORDER BY 1
    `)
  ]);

  const [live] = await pool.query(`
    SELECT
      COUNT(DISTINCT visitor_id) FILTER (WHERE ${HUMAN_SQL})::int AS live_visitors,
      COUNT(DISTINCT bot_name) FILTER (WHERE is_bot)::int AS live_bots
    FROM tool_usage_events
    WHERE created_at >= NOW() - INTERVAL '30 minutes'
  `).then((r) => r.rows);

  const totals = totalsRows[0] || {};
  const mix = visitorMixRows[0] || {};
  const tasks = (totals.total_downloads || 0) + (totals.total_copies || 0) + (totals.total_uses || 0);
  const visitors = totals.total_unique_visitors || 0;
  const summary = {
    ...totals,
    ...mix,
    total_tasks_completed: tasks,
    overall_download_cvr: pct(totals.downloading_visitors || 0, visitors),
    overall_total_cvr: pct(totals.converted_visitors || 0, visitors),
    live_visitors: live?.live_visitors || 0,
    live_bots: live?.live_bots || 0
  };

  const tools = toolsRows.map((t) => ({
    ...t,
    download_cvr: pct(t.downloading_visitors, t.unique_visitors_count),
    total_cvr: pct(t.converted_visitors, t.unique_visitors_count)
  }));

  const humanHits = totals.total_views || 0;
  const botHits = totals.total_bot_views || 0;
  const humanTrafficRatio = humanHits + botHits > 0 ? Math.round((humanHits / (humanHits + botHits)) * 100) : 100;

  const data = {
    timeFilter: { range, label, startDate: query.startDate || null, endDate: query.endDate || null },
    summary,
    tools,
    eventTypes,
    daily,
    recentEvents: [],
    botAnalytics: {
      totalBotViews: botHits,
      totalBotEvents: totals.total_bot_events || 0,
      totalUniqueBots: totals.total_unique_bots || 0,
      liveBots30m: summary.live_bots,
      humanTrafficRatio,
      botTrafficRatio: 100 - humanTrafficRatio,
      botBreakdown,
      botCategories,
      recentBotEvents: []
    }
  };

  if (!detailed) return data;

  const [recentEvents, recentBotEvents, countries, devices, topVisitors] = await Promise.all([
    q(`
      SELECT e.id, e.tool_slug, t.title AS tool_title, e.event_type, e.visitor_id, e.country, e.device_type, e.created_at
      FROM tool_usage_events e
      LEFT JOIN cerilas_tools t ON t.slug = e.tool_slug
      WHERE ${HUMAN_SQL.replace(/\b(is_bot|client_type)\b/g, 'e.$1')} AND ${inRange('e.')}
      ORDER BY e.created_at DESC
      LIMIT 25
    `),
    q(`
      SELECT e.id, e.tool_slug, t.title AS tool_title, e.event_type, e.bot_name, e.client_type, e.country,
             LEFT(COALESCE(e.user_agent, e.metadata->>'ua'), 200) AS user_agent, e.created_at
      FROM tool_usage_events e
      LEFT JOIN cerilas_tools t ON t.slug = e.tool_slug
      WHERE e.is_bot AND ${inRange('e.')}
      ORDER BY e.created_at DESC
      LIMIT 25
    `),
    q(`
      SELECT country, COUNT(DISTINCT visitor_id)::int AS visitors
      FROM tool_usage_events
      WHERE ${HUMAN_SQL} AND country IS NOT NULL AND ${inRange()}
      GROUP BY country
      ORDER BY visitors DESC
      LIMIT 10
    `),
    q(`
      SELECT device_type, COUNT(DISTINCT visitor_id)::int AS visitors
      FROM tool_usage_events
      WHERE ${HUMAN_SQL} AND device_type IS NOT NULL AND ${inRange()}
      GROUP BY device_type
      ORDER BY visitors DESC
    `),
    q(`
      SELECT visitor_id, COUNT(*) FILTER (WHERE ${VIEW_SQL})::int AS views, COUNT(*)::int AS events,
             COUNT(DISTINCT tool_slug)::int AS tools, MAX(country) AS country, MAX(device_type) AS device_type,
             MIN(created_at) AS first_seen_at, MAX(created_at) AS last_seen_at
      FROM tool_usage_events
      WHERE ${HUMAN_SQL} AND visitor_id IS NOT NULL AND ${inRange()}
      GROUP BY visitor_id
      ORDER BY events DESC
      LIMIT 10
    `)
  ]);

  data.recentEvents = recentEvents;
  data.botAnalytics.recentBotEvents = recentBotEvents;
  data.countries = countries;
  data.devices = devices;
  data.topVisitors = topVisitors;
  return data;
}
