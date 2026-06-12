import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await pool.query("UPDATE mail_settings SET opp_digest_active = true, opp_digest_recipients = 'deniz@cerilas.com'");
  console.log("Updated.");
  process.exit();
}
run();
