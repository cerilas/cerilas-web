import pool from './server/db.js';

async function test() {
  try {
    const res = await pool.query('SELECT * FROM pomodoro_sessions');
    console.log("Table exists, rows:", res.rows.length);
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
}
test();
