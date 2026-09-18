import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const defaultDbUrl = 'postgresql://postgres:cSpqOwKMGJskMBmMHzBnessWBSCzKBmS@altaria.proxy.rlwy.net:28137/railway';
const connectionString = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) 
  ? process.env.DATABASE_URL 
  : defaultDbUrl;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

export default pool;

