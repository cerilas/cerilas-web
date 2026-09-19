import pool from './db.js';

async function registerTrlCalculatorTool() {
  try {
    const existing = await pool.query("SELECT id FROM cerilas_tools WHERE slug = 'trl-calculator'");
    if (existing.rows.length > 0) {
      console.log('trl-calculator already registered in DB. Updating metadata...');
      await pool.query(`
        UPDATE cerilas_tools
        SET title = 'TRL Calculator (Technology Readiness Level)',
            short_description = 'Interactive TRL Calculator for R&D projects and researchers. Assess Technology Readiness Level (TRL 1-9) across Horizon Europe, NASA, DeepTech SRL, and TÜBİTAK with gap analysis and grant matching.',
            seo_title = 'Free TRL Calculator (1-9) – Technology Readiness Level Assessment for R&D & Grants | Cerilas Tools',
            seo_description = 'Calculate your R&D project Technology Readiness Level (TRL 1 to 9) accurately. Interactive diagnostic questionnaire for Horizon Europe, NASA ISO 16290, Software SRL, and TÜBİTAK Ar-Ge programs with grant eligibility and gap analysis roadmap.',
            category = 'R&D & Engineering',
            icon_name = 'Gauge',
            cover_image_url = '/tool-icons/trl-calculator.png',
            target_url = '#/tool/trl-calculator',
            is_active = true,
            updated_at = NOW()
        WHERE slug = 'trl-calculator'
      `);
      console.log('Updated successfully.');
      process.exit(0);
    }

    const nextOrderRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM cerilas_tools');
    const sortOrder = nextOrderRes.rows[0]?.next_order || 16;

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
      'TRL Calculator (Technology Readiness Level)',
      'trl-calculator',
      'Interactive TRL Calculator for R&D projects and researchers. Assess Technology Readiness Level (TRL 1-9) across Horizon Europe, NASA, DeepTech SRL, and TÜBİTAK with gap analysis and grant matching.',
      'Gauge',
      '/tool-icons/trl-calculator.png',
      '#/tool/trl-calculator',
      'Free TRL Calculator (1-9) – Technology Readiness Level Assessment for R&D & Grants | Cerilas Tools',
      'Calculate your R&D project Technology Readiness Level (TRL 1 to 9) accurately. Interactive diagnostic questionnaire for Horizon Europe, NASA ISO 16290, Software SRL, and TÜBİTAK Ar-Ge programs with grant eligibility and gap analysis roadmap.',
      true,
      sortOrder,
      'R&D & Engineering',
      142,
      98,
      24,
      52,
      176
    ]);

    console.log('Successfully registered trl-calculator in cerilas_tools table!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to register trl-calculator:', err);
    process.exit(1);
  }
}

registerTrlCalculatorTool();
