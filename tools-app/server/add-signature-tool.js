import pool from './db.js';

async function registerSignatureTool() {
  try {
    const existing = await pool.query("SELECT id FROM cerilas_tools WHERE slug = 'email-signature-generator'");
    if (existing.rows.length > 0) {
      console.log('email-signature-generator tool already registered in DB.');
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
      'Email Signature Generator',
      'email-signature-generator',
      'Design professional, HTML-compliant email signatures with custom company logo, job title, social icons, CTA buttons, and custom contact fields. 1-click install for Gmail, Apple Mail, and Outlook.',
      'Mail',
      '/covers/email-signature-generator.png',
      '#/tool/email-signature-generator',
      'Free Email Signature Generator (2026) | Gmail, Outlook & Apple Mail Ready | Cerilas Tools',
      'Create a professional HTML email signature in seconds for free. Upload company logos, add job titles, social profiles, custom fields, and disclaimer text. 100% private in-browser tool.',
      true,
      sortOrder,
      'Productivity',
      0,
      0,
      0,
      0,
      0
    ]);

    console.log('Successfully registered email-signature-generator in cerilas_tools table!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to register email-signature-generator:', err);
    process.exit(1);
  }
}

registerSignatureTool();
