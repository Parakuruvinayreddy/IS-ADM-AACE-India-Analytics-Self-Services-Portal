const pg = require('pg');
require('../../shared/pg_patch')(pg);
const { Client } = pg;
const fs = require('fs');
const path = require('path');

async function setup() {
  const connStr = process.env.DB_URL;
  if (!connStr) {
    console.error('ERROR: DB_URL environment variable is not set.');
    process.exit(1);
  }
  const useSSL = !connStr.includes('localhost') && !connStr.includes('127.0.0.1');
  const client = new Client({
    connectionString: connStr,
    ssl: useSSL ? { rejectUnauthorized: false } : false
  });
  await client.connect();
  console.log('Database ready');

  // Ensure is_adm_india schema exists and set as search path
  await client.query('CREATE SCHEMA IF NOT EXISTS is_adm_india;');
  await client.query('SET search_path TO is_adm_india;');

  // Read and execute the schema file
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema_postgres.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await client.query(schema);

  console.log('Database successfully initialized with all 7 tables.');
  await client.end();
}

setup().catch(err => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
