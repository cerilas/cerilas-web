import pool from './db.js';
import {
  ensureToolAnalyticsSchema,
  HUMAN_SQL,
  VIEW_SQL,
  BOT_HIT_SQL,
  DOWNLOAD_SQL,
  COPY_SQL,
  USE_SQL
} from './utils/toolAnalytics.js';

// Rebuilds the cached counters on cerilas_tools from raw events, using the same
// human/bot definitions as the admin analytics.
async function syncGenuineStats() {
  try {
    console.log('--- Starting Genuine Stats Calibration ---');
    await ensureToolAnalyticsSchema();

    const result = await pool.query(`
      WITH agg AS (
        SELECT tool_slug,
          COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${VIEW_SQL})::int AS views,
          COUNT(DISTINCT visitor_id) FILTER (WHERE ${HUMAN_SQL})::int AS visitors,
          COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${DOWNLOAD_SQL})::int AS downloads,
          COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${COPY_SQL})::int AS copies,
          COUNT(*) FILTER (WHERE ${HUMAN_SQL} AND ${USE_SQL})::int AS uses,
          COUNT(*) FILTER (WHERE is_bot AND ${BOT_HIT_SQL})::int AS bot_views,
          COUNT(DISTINCT visitor_id) FILTER (WHERE is_bot)::int AS bot_visitors
        FROM tool_usage_events
        GROUP BY tool_slug
      )
      UPDATE cerilas_tools ct SET
        view_count = COALESCE(agg.views, 0),
        unique_visitors_count = COALESCE(agg.visitors, 0),
        download_count = COALESCE(agg.downloads, 0),
        copy_count = COALESCE(agg.copies, 0),
        use_count = COALESCE(agg.uses, 0),
        bot_view_count = COALESCE(agg.bot_views, 0),
        bot_unique_visitors_count = COALESCE(agg.bot_visitors, 0)
      FROM (SELECT slug FROM cerilas_tools) tools
      LEFT JOIN agg ON agg.tool_slug = tools.slug
      WHERE ct.slug = tools.slug
      RETURNING ct.slug, ct.view_count, ct.unique_visitors_count, ct.download_count, ct.copy_count, ct.use_count
    `);

    for (const row of result.rows) {
      console.log(`Synced ${row.slug}: views=${row.view_count}, visitors=${row.unique_visitors_count}, downloads=${row.download_count}, copies=${row.copy_count}, uses=${row.use_count}`);
    }

    console.log('--- Genuine Stats Calibration Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('Failed to sync genuine stats:', err);
    process.exit(1);
  }
}

syncGenuineStats();
