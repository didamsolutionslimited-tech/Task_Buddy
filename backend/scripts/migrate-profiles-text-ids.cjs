/*
 * tasker_profiles.user_id: uuid FK -> text (aligns with chat/email identities).
 * Run:  node scripts/migrate-profiles-text-ids.cjs
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const { rows } = await pool.query(
    `SELECT conname FROM pg_constraint WHERE conrelid = 'tasker_profiles'::regclass AND contype = 'f'`
  );
  for (const r of rows) {
    await pool.query(`ALTER TABLE tasker_profiles DROP CONSTRAINT IF EXISTS ${r.conname}`);
    console.log('dropped FK', r.conname);
  }
  await pool.query(`ALTER TABLE tasker_profiles ALTER COLUMN user_id TYPE text USING user_id::text`);
  console.log('tasker_profiles.user_id is now text');
  await pool.end();
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
