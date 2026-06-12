import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const s = await pool.query('SELECT * FROM email_senders');
  console.log(s.rows);
  const ms = await pool.query('SELECT * FROM mail_settings');
  console.log(ms.rows);
  process.exit();
}
run();
