import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await pool.query(`
      ALTER TABLE mail_settings
      ADD COLUMN IF NOT EXISTS opp_digest_active BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS opp_digest_recipients TEXT;
    `);
    console.log('Columns added to mail_settings successfully.');
  } catch (err) {
    console.error('Error adding columns:', err);
  } finally {
    process.exit();
  }
}

run();
