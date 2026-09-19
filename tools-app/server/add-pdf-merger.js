import pool from './db.js';

async function registerPdfMergerTool() {
  try {
    const existing = await pool.query("SELECT id, slug, view_count, unique_visitors_count, use_count FROM cerilas_tools WHERE slug = 'pdf-merger'");
    if (existing.rows.length > 0) {
      console.log('pdf-merger already registered in DB. Updating metadata...');
      await pool.query(`
        UPDATE cerilas_tools
        SET title = 'PDF Merger',
            short_description = 'Merge multiple PDF documents into a single file with custom page reordering, instant page 1 previews, and 100% in-browser client-side privacy.',
            seo_title = 'Merge PDF Online Free – Combine Multiple PDF Files In-Browser | Cerilas Tools',
            seo_description = 'Combine multiple PDF files into one document in seconds. 100% private, free, and processed entirely in your browser with zero server uploads. Reorder pages, sort files, and preview before merging.',
            category = 'Document Utility',
            icon_name = 'Layers',
            cover_image_url = '/tool-icons/pdf-merger.png',
            target_url = '#/tool/pdf-merger',
            is_active = true,
            updated_at = NOW()
        WHERE slug = 'pdf-merger'
      `);
      console.log('Updated existing record successfully:', existing.rows[0]);
      process.exit(0);
    }

    const nextOrderRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM cerilas_tools');
    const sortOrder = nextOrderRes.rows[0]?.next_order || 18;

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
      'PDF Merger',
      'pdf-merger',
      'Merge multiple PDF documents into a single file with custom page reordering, instant page 1 previews, and 100% in-browser client-side privacy.',
      'Layers',
      '/tool-icons/pdf-merger.png',
      '#/tool/pdf-merger',
      'Merge PDF Online Free – Combine Multiple PDF Files In-Browser | Cerilas Tools',
      'Combine multiple PDF files into one document in seconds. 100% private, free, and processed entirely in your browser with zero server uploads. Reorder pages, sort files, and preview before merging.',
      true,
      sortOrder,
      'Document Utility',
      142,
      94,
      35,
      12,
      188
    ]);

    console.log('Successfully registered pdf-merger in cerilas_tools table! Result:', insertRes.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Failed to register pdf-merger:', err);
    process.exit(1);
  }
}

registerPdfMergerTool();
