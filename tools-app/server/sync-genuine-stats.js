import pool from './db.js';

async function syncGenuineStats() {
  try {
    console.log('--- Starting Genuine Stats Calibration ---');

    // 1. Fetch all tools
    const toolsRes = await pool.query('SELECT id, slug, title FROM cerilas_tools');
    const tools = toolsRes.rows;

    for (const tool of tools) {
      const slug = tool.slug;

      // Count genuine events
      const viewsRes = await pool.query(
        "SELECT COUNT(*)::int as count FROM tool_usage_events WHERE tool_slug = $1 AND event_type = 'view'",
        [slug]
      );
      const views = viewsRes.rows[0].count;

      const visitorsRes = await pool.query(
        "SELECT COUNT(*)::int as count FROM tool_unique_visitors WHERE tool_slug = $1",
        [slug]
      );
      const visitors = visitorsRes.rows[0].count;

      const downloadsRes = await pool.query(
        "SELECT COUNT(*)::int as count FROM tool_usage_events WHERE tool_slug = $1 AND (event_type LIKE 'download%' OR event_type = 'pdf_export')",
        [slug]
      );
      const downloads = downloadsRes.rows[0].count;

      const copiesRes = await pool.query(
        "SELECT COUNT(*)::int as count FROM tool_usage_events WHERE tool_slug = $1 AND event_type LIKE 'copy%'",
        [slug]
      );
      const copies = copiesRes.rows[0].count;

      const usesRes = await pool.query(
        "SELECT COUNT(*)::int as count FROM tool_usage_events WHERE tool_slug = $1 AND event_type NOT IN ('view')",
        [slug]
      );
      const uses = usesRes.rows[0].count;

      // Update cerilas_tools with 100% genuine numbers
      await pool.query(`
        UPDATE cerilas_tools
        SET view_count = $1,
            unique_visitors_count = $2,
            download_count = $3,
            copy_count = $4,
            use_count = $5,
            updated_at = NOW()
        WHERE slug = $6
      `, [views, visitors, downloads, copies, uses, slug]);

      console.log(`Synced ${slug}: views=${views}, visitors=${visitors}, downloads=${downloads}, copies=${copies}, uses=${uses}`);
    }

    console.log('--- Genuine Stats Calibration Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('Failed to sync genuine stats:', err);
    process.exit(1);
  }
}

syncGenuineStats();
