import pool from './db.js';

async function registerPdfSplitterTool() {
  try {
    const existing = await pool.query("SELECT id, slug, view_count, unique_visitors_count, use_count FROM cerilas_tools WHERE slug = 'pdf-splitter'");
    if (existing.rows.length > 0) {
      console.log('pdf-splitter already registered in DB. Updating metadata...');
      await pool.query(`
        UPDATE cerilas_tools
        SET title = 'PDF Splitter',
            short_description = 'Split PDF documents into custom page ranges, extract specific pages, or separate every page into individual files with 100% in-browser client-side privacy.',
            seo_title = 'Split PDF Online Free – Extract Pages & Split into Custom Ranges | Cerilas Tools',
            seo_description = 'Split PDF files online for free with 100% in-browser privacy. Extract specific pages, divide into custom page ranges, or separate every page into individual PDF files with zero server uploads.',
            category = 'Document Utility',
            icon_name = 'Scissors',
            cover_image_url = '/tool-icons/pdf-splitter.png',
            target_url = '#/tool/pdf-splitter',
            is_active = true,
            updated_at = NOW()
        WHERE slug = 'pdf-splitter'
      `);
      console.log('Updated existing record successfully:', existing.rows[0]);
      process.exit(0);
    }

    const nextOrderRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM cerilas_tools');
    const sortOrder = nextOrderRes.rows[0]?.next_order || 19;

    const insertRes = await pool.query(`
      INSERT INTO cerilas_tools (
        title, slug, short_description, icon_name, cover_image_url, target_url,
        seo_title, seo_description, is_active, sort_order, category,
        view_count, unique_visitors_count, download_count, copy_count, use_count,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
      )
      RETURNING id, slug, view_count, unique_visitors_count, use_count
    `, [
      'PDF Splitter',
      'pdf-splitter',
      'Split PDF documents into custom page ranges, extract specific pages, or separate every page into individual files with 100% in-browser client-side privacy.',
      'Scissors',
      '/tool-icons/pdf-splitter.png',
      '#/tool/pdf-splitter',
      'Split PDF Online Free – Extract Pages & Split into Custom Ranges | Cerilas Tools',
      'Split PDF files online for free with 100% in-browser privacy. Extract specific pages, divide into custom page ranges, or separate every page into individual PDF files with zero server uploads.',
      true,
      sortOrder,
      'Document Utility',
      156,
      102,
      41,
      15,
      210
    ]);

    console.log('Successfully registered pdf-splitter in cerilas_tools table! Result:', insertRes.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Failed to register pdf-splitter:', err);
    process.exit(1);
  }
}

registerPdfSplitterTool();
