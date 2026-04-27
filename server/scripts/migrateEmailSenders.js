import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
      CREATE TABLE IF NOT EXISTS email_senders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(255) NOT NULL,
        provider VARCHAR(50) DEFAULT 'smtp',
        host VARCHAR(255),
        port INTEGER,
        auth_user VARCHAR(255),
        auth_pass TEXT,
        secure BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('email_senders table created successfully.');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    process.exit();
  }
}

migrate();
