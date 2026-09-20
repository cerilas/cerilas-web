import pool from '../db.js';

export async function resetAllAnalytics() {
  console.log('[Analytics:Reset] Starting complete reset of tool statistics, unique visitors, and conversions...');

  // 1. Reset counters on cerilas_tools
  const toolsReset = await pool.query(`
    UPDATE cerilas_tools 
    SET 
      view_count = 0,
      unique_visitors_count = 0,
      download_count = 0,
      copy_count = 0,
      use_count = 0,
      last_used_at = NULL;
  `);
  console.log(`[Analytics:Reset] Reset counters for ${toolsReset.rowCount} tools in cerilas_tools to 0.`);

  // 2. Clear tool_unique_visitors table
  await pool.query('TRUNCATE TABLE tool_unique_visitors RESTART IDENTITY;');
  console.log('[Analytics:Reset] Truncated tool_unique_visitors table.');

  // 3. Clear tool_usage_events table
  await pool.query('TRUNCATE TABLE tool_usage_events RESTART IDENTITY;');
  console.log('[Analytics:Reset] Truncated tool_usage_events table.');

  // 4. Verify post-reset state
  const summaryRes = await pool.query(`
    SELECT 
      COALESCE(SUM(view_count), 0)::int as total_views,
      COALESCE(SUM(unique_visitors_count), 0)::int as total_unique_visitors,
      COALESCE(SUM(download_count), 0)::int as total_downloads,
      COALESCE(SUM(copy_count), 0)::int as total_copies,
      COALESCE(SUM(use_count), 0)::int as total_uses
    FROM cerilas_tools;
  `);
  const visitorsCount = await pool.query('SELECT count(*) FROM tool_unique_visitors;');
  const eventsCount = await pool.query('SELECT count(*) FROM tool_usage_events;');

  console.log('[Analytics:Reset] Verification Summary:');
  console.log('cerilas_tools totals:', summaryRes.rows[0]);
  console.log('tool_unique_visitors count:', visitorsCount.rows[0].count);
  console.log('tool_usage_events count:', eventsCount.rows[0].count);

  return {
    tools_reset: toolsReset.rowCount,
    cerilas_tools_totals: summaryRes.rows[0],
    tool_unique_visitors_count: parseInt(visitorsCount.rows[0].count, 10),
    tool_usage_events_count: parseInt(eventsCount.rows[0].count, 10)
  };
}

if (process.argv[1] && process.argv[1].endsWith('reset-analytics.js')) {
  resetAllAnalytics()
    .then((res) => {
      console.log('All analytics successfully reset to zero:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Reset failed:', err);
      process.exit(1);
    });
}
