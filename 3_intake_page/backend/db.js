const pg = require('pg');
require('../../shared/pg_patch')(pg);
const { Pool } = pg;

if (!process.env.DB_URL) {
  throw new Error('DB_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString: process.env.DB_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('[INFO] PostgreSQL connected.');
});

pool.on('error', (err) => {
  console.error('[ERROR] PostgreSQL pool error:', err.message);
});

module.exports = pool;
