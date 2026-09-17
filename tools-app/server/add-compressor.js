import pool from './db.js';

async function addCompressorTool() {
  try {
    console.log('Registering Image Compressor in PostgreSQL database...');

    const check = await pool.query("SELECT id FROM cerilas_tools WHERE slug = 'image-compressor'");
    if (check.rows.length === 0) {
      await pool.query(`
        INSERT INTO cerilas_tools (
          title, 
          slug, 
          short_description, 
          icon_name, 
          target_url, 
          seo_title, 
          seo_description, 
          category,
          sort_order,
          is_active,
          view_count,
          use_count
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
      `, [
        'Image Compressor',
        'image-compressor',
        'Lossless & high-efficiency in-browser image compression with zero server uploads. Supports JPG, PNG, WebP, AVIF, and SVG with instant batch export.',
        'Minimize2',
        '#/tool/image-compressor',
        'Free Image Compressor Without Quality Loss (No Upload Limit) | Cerilas Tools',
        '100% free client-side image compressor. Compress JPG, PNG, WebP, AVIF, and SVG without quality loss or server storage. Batch compress and download as ZIP.',
        'Optimizer',
        2,
        true,
        0,
        0
      ]);
      console.log('Image Compressor inserted successfully into PostgreSQL!');
    } else {
      console.log('Image Compressor already exists in PostgreSQL database.');
    }
  } catch (err) {
    console.error('Error adding Image Compressor:', err);
  } finally {
    process.exit(0);
  }
}

addCompressorTool();
