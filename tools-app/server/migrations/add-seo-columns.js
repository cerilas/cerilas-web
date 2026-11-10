import pool from '../db.js';
import {
  generateOpportunitySeo,
  cleanGrantLongDescriptionHtml
} from '../utils/seoGenerator.js';

export async function migrateSeoColumns() {
  console.log('[Migration:SEO] Ensuring SEO columns and clean grant content on funding_opportunities...');

  await pool.query('ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS slug VARCHAR(255);');
  await pool.query('ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);');
  await pool.query('ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS meta_description TEXT;');
  await pool.query('ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS meta_keywords TEXT;');
  await pool.query('ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS schema_json JSONB;');

  // 1. Mark expired calls as 'closed' so sitemaps and open directories only expose active calls
  const expiredRes = await pool.query(`
    UPDATE funding_opportunities
    SET status = 'closed', last_changed_at = NOW()
    WHERE status = 'open'
      AND deadline_date IS NOT NULL
      AND deadline_date < NOW()
  `);
  if (expiredRes.rowCount > 0) {
    console.log(`[Migration:SEO] Marked ${expiredRes.rowCount} past-deadline grants as status = 'closed'.`);
  }

  // 2. Preload all existing slugs so we never collide
  const allSlugsRes = await pool.query('SELECT id, slug FROM funding_opportunities WHERE slug IS NOT NULL');
  const usedSlugs = new Set(allSlugsRes.rows.map((r) => r.slug));

  // 3. Find rows needing SEO generation, boilerplate stripping, or Call-ID disambiguation
  const res = await pool.query(`
    SELECT id, source_key, external_id, title, short_description, long_description,
           funding_amount, funding_raw_amount, eligible_applicants, deadline_date,
           domains, technologies, call_type, slug, seo_title
    FROM funding_opportunities
    WHERE slug IS NULL
       OR seo_title IS NULL
       OR seo_title NOT LIKE '%#%'
       OR long_description LIKE '%Support & Documentation Guidance%'
       OR long_description LIKE '%Conditions & Eligibility Criteria%'
    ORDER BY id ASC;
  `);

  console.log(`[Migration:SEO] Found ${res.rows.length} opportunities needing SEO/content cleanup...`);

  let updatedCount = 0;

  for (const row of res.rows) {
    const cleanedLongDesc = cleanGrantLongDescriptionHtml(row.long_description);
    const rowWithCleanedDesc = {
      ...row,
      long_description: cleanedLongDesc
    };

    const seo = generateOpportunitySeo(rowWithCleanedDesc);

    // Preserve existing canonical slug if already assigned so indexed URLs never break
    let finalSlug = row.slug;
    if (!finalSlug) {
      finalSlug = seo.slug;
      let counter = 1;
      while (usedSlugs.has(finalSlug)) {
        finalSlug = `${seo.slug}-${counter}`;
        counter++;
      }
      usedSlugs.add(finalSlug);
    }

    // Ensure schema_json url matches finalSlug
    if (seo.schema_json) {
      seo.schema_json.url = `https://tools.cerilas.com/tool/eu-funding-opportunities/${finalSlug}`;
    }

    await pool.query(
      `UPDATE funding_opportunities
       SET slug = $1,
           seo_title = $2,
           meta_description = $3,
           meta_keywords = $4,
           schema_json = $5,
           short_description = $6,
           long_description = $7
       WHERE id = $8`,
      [
        finalSlug,
        seo.seo_title,
        seo.meta_description,
        seo.meta_keywords,
        JSON.stringify(seo.schema_json),
        seo.short_description,
        cleanedLongDesc,
        row.id
      ]
    );
    updatedCount++;
  }

  console.log(`[Migration:SEO] Successfully cleaned and updated SEO for ${updatedCount} opportunities.`);

  // Ensure unique index on slug
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
