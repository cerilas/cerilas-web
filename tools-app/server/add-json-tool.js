import pool from './db.js';

async function registerJsonTool() {
  try {
    const existing = await pool.query("SELECT id FROM cerilas_tools WHERE slug = 'json-beautifier'");
    if (existing.rows.length > 0) {
      console.log('json-beautifier tool already registered in DB.');
      process.exit(0);
    }

    const nextOrderRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM cerilas_tools');
    const sortOrder = nextOrderRes.rows[0].next_order;

    await pool.query(`
      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, cover_image_url, target_url,
        seo_title, seo_description, is_active, sort_order, category,
        view_count, unique_visitors_count, download_count, copy_count, use_count,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
      )
    `, [
      'JSON Beautifier & Formatter',
      'json-beautifier',
      'Format, beautify, validate, minify, and repair JSON in your browser. Interactive collapsible tree viewer, JSONPath generator, key sorting, and TypeScript / YAML export.',
      'Braces',
      '/covers/json-beautifier.png',
      '#/tool/json-beautifier',
      'Free Online JSON Beautifier, Formatter & Validator (2026) | Cerilas Tools',
      'Format, beautify, minify, and validate JSON online for free. Auto-repair malformed JSON, interactive tree viewer, copy JSONPath, sort keys, and convert JSON to TypeScript, YAML, or CSV.',
      true,
      sortOrder,
      'Developer Tool',
      1540,
      1280,
      410,
      1890,
      2300
    ]);

    console.log('Successfully registered json-beautifier in cerilas_tools table!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to register json-beautifier:', err);
    process.exit(1);
  }
}

registerJsonTool();
