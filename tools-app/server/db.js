import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const defaultDbUrl = 'postgresql://postgres:cSpqOwKMGJskMBmMHzBnessWBSCzKBmS@altaria.proxy.rlwy.net:28137/railway';

const isInvalidHost = (url) => {
  if (!url || typeof url !== 'string') return true;
  try {
    const u = new URL(url);
    return !u.host || u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch (e) {
    return true;
  }
};

const connectionString = (process.env.DATABASE_URL && !isInvalidHost(process.env.DATABASE_URL)) 
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

