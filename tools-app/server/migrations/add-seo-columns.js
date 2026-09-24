import pool from '../db.js';
import { generateOpportunitySeo } from '../utils/seoGenerator.js';

export async function migrateSeoColumns() {
  console.log('[Migration:SEO] Adding SEO columns to funding_opportunities...');
  
  await pool.query('ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS slug VARCHAR(255);');
  await pool.query('ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);');
  await pool.query('ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS meta_description TEXT;');
  await pool.query('ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS meta_keywords TEXT;');
  await pool.query('ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS schema_json JSONB;');

  console.log('[Migration:SEO] Checking rows needing SEO backfill...');
  const res = await pool.query(`
    SELECT id, source_key, external_id, title, short_description, funding_amount, funding_raw_amount,
           eligible_applicants, deadline_date, domains, technologies, call_type, slug
    FROM funding_opportunities
    WHERE slug IS NULL
    ORDER BY id ASC;
  `);

  console.log(`[Migration:SEO] Found ${res.rows.length} opportunities. Processing SEO generation...`);
  
  const usedSlugs = new Set();
  let updatedCount = 0;

  for (const row of res.rows) {
    const seo = generateOpportunitySeo(row);
    let finalSlug = seo.slug;
    let counter = 1;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${seo.slug}-${counter}`;
      counter++;
    }
    usedSlugs.add(finalSlug);

    await pool.query(
      'UPDATE funding_opportunities SET slug = $1, seo_title = $2, meta_description = $3, meta_keywords = $4, schema_json = $5 WHERE id = $6',
      [
        finalSlug,
        seo.seo_title,
        seo.meta_description,
        seo.meta_keywords,
        JSON.stringify(seo.schema_json),
        row.id
      ]
    );
    updatedCount++;
  }

  console.log(`[Migration:SEO] Successfully backfilled SEO for ${updatedCount} opportunities.`);
  
  // Create unique index on slug
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS uq_funding_opportunities_slug ON funding_opportunities(slug);');
  console.log('[Migration:SEO] Unique index on slug ensured.');

  return updatedCount;
}

if (process.argv[1] && process.argv[1].endsWith('add-seo-columns.js')) {
  migrateSeoColumns()
    .then((count) => {
      console.log(`Migration finished. ${count} records processed.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed with error:', err);
      process.exit(1);
    });
}
