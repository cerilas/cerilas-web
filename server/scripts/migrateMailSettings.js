import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mail_settings (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES email_senders(id) ON DELETE SET NULL,
        newsletter_active BOOLEAN DEFAULT false,
        newsletter_recipients TEXT,
        contact_active BOOLEAN DEFAULT false,
        contact_recipients TEXT,
        job_active BOOLEAN DEFAULT false,
        job_recipients TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert default settings if not exist
    const checkResult = await pool.query('SELECT COUNT(*) FROM mail_settings');
    if (parseInt(checkResult.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO mail_settings (newsletter_active, contact_active, job_active) 
        VALUES (false, false, false)
      `);
    }

    console.log('mail_settings table created/verified successfully.');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    process.exit();
  }
}

migrate();
