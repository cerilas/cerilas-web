import pool from '../db.js';

export async function initScrapersDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS funding_opportunities (
        id SERIAL PRIMARY KEY,
        source_key VARCHAR(64) NOT NULL,
        external_id VARCHAR(128) NOT NULL,
        title VARCHAR(512) NOT NULL,
        short_description TEXT,
        long_description TEXT,
        cover_image TEXT,
        eligible_applicants JSONB DEFAULT '[]'::jsonb,
        deadline_date TIMESTAMPTZ,
        deadline_raw VARCHAR(128),
        opening_date TIMESTAMPTZ,
        funding_amount VARCHAR(128),
        funding_raw_amount NUMERIC(15,2) DEFAULT 0,
        domains JSONB DEFAULT '[]'::jsonb,
        technologies JSONB DEFAULT '[]'::jsonb,
        links JSONB DEFAULT '{}'::jsonb,
        call_type VARCHAR(64) DEFAULT 'Proposals',
        permalink TEXT,
        content_hash VARCHAR(64) NOT NULL,
        status VARCHAR(32) DEFAULT 'open',
        raw_data JSONB DEFAULT '{}'::jsonb,
        first_scraped_at TIMESTAMPTZ DEFAULT NOW(),
        last_scraped_at TIMESTAMPTZ DEFAULT NOW(),
        last_changed_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_source_external UNIQUE (source_key, external_id)
      );

      CREATE INDEX IF NOT EXISTS idx_funding_source_key ON funding_opportunities (source_key);
      CREATE INDEX IF NOT EXISTS idx_funding_deadline ON funding_opportunities (deadline_date);
      CREATE INDEX IF NOT EXISTS idx_funding_status ON funding_opportunities (status);
      CREATE INDEX IF NOT EXISTS idx_funding_content_hash ON funding_opportunities (content_hash);

      CREATE TABLE IF NOT EXISTS scraper_runs (
        id SERIAL PRIMARY KEY,
        source_key VARCHAR(64) NOT NULL,
        triggered_by VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        items_found INT DEFAULT 0,
        items_inserted INT DEFAULT 0,
        items_updated INT DEFAULT 0,
        items_unchanged INT DEFAULT 0,
        duration_ms INT DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_scraper_runs_source ON scraper_runs (source_key);
      CREATE INDEX IF NOT EXISTS idx_scraper_runs_created ON scraper_runs (created_at DESC);
    `);
    console.log('[DB] Funding Scraper tables checked/initialized.');
  } catch (err) {
    console.error('[DB] Error initializing Funding Scraper tables:', err.message);
  } finally {
    client.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('init-scrapers-db.js')) {
  initScrapersDb().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
