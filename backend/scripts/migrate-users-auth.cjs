/*
 * Users table gets password auth + google verification columns.
 * Run:  node scripts/migrate-users-auth.cjs
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NULL`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`);
  await pool.query(`ALTER TABLE tasker_applications ADD COLUMN IF NOT EXISTS user_id TEXT NULL`);
  console.log('users auth columns ready');
  await pool.end();
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
