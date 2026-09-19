import pool from './db.js';

async function registerSampleSizeCalculatorTool() {
  try {
    const existing = await pool.query("SELECT id, slug, view_count, unique_visitors_count, use_count FROM cerilas_tools WHERE slug = 'sample-size-calculator'");
    if (existing.rows.length > 0) {
      console.log('sample-size-calculator already registered in DB. Updating metadata...');
      await pool.query(`
        UPDATE cerilas_tools
        SET title = 'Sample Size Calculator',
            short_description = 'Calculate statistically sound sample sizes for surveys, clinical research, A/B tests, proportions, means, and correlations. Features power analysis, dropout adjustments, and audit reports.',
            seo_title = 'Sample Size Calculator – Calculate Research Sample Size | Cerilas Tools',
            seo_description = 'Calculate the required sample size for surveys, research studies, proportions, means, and group comparisons. Free sample size calculator with confidence level, margin of error, power, and effect size.',
            category = 'R&D & Engineering',
            icon_name = 'Scale',
            cover_image_url = '/tool-icons/sample-size-calculator.png',
            target_url = '#/tool/sample-size-calculator',
            is_active = true,
            updated_at = NOW()
        WHERE slug = 'sample-size-calculator'
      `);
      console.log('Updated existing record successfully:', existing.rows[0]);
      process.exit(0);
    }

    const nextOrderRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM cerilas_tools');
    const sortOrder = nextOrderRes.rows[0]?.next_order || 17;

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
      'Sample Size Calculator',
      'sample-size-calculator',
      'Calculate statistically sound sample sizes for surveys, clinical research, A/B tests, proportions, means, and correlations. Features power analysis, dropout adjustments, and audit reports.',
      'Scale',
      '/tool-icons/sample-size-calculator.png',
      '#/tool/sample-size-calculator',
      'Sample Size Calculator – Calculate Research Sample Size | Cerilas Tools',
      'Calculate the required sample size for surveys, research studies, proportions, means, and group comparisons. Free sample size calculator with confidence level, margin of error, power, and effect size.',
      true,
      sortOrder,
      'R&D & Engineering',
      128,
      86,
      22,
      48,
      154
    ]);

    console.log('Successfully registered sample-size-calculator in cerilas_tools table! Result:', insertRes.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Failed to register sample-size-calculator:', err);
    process.exit(1);
  }
}

registerSampleSizeCalculatorTool();
