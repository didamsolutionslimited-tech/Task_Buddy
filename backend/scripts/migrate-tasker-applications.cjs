/*
 * Creates the tasker_applications table storing "Become a Tasker"
 * submissions from the marketing website.
 * Run:  node scripts/migrate-tasker-applications.cjs
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasker_applications (
      id BIGSERIAL PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      trade VARCHAR(80) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'applied',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('tasker_applications table ready');
  await pool.end();
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
