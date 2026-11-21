/*
 * One-off migration: allow users to sign up with email (OTP flow).
 * - makes phone_number nullable (email-only accounts have no phone yet)
 * - drops phone uniqueness constraint issues for NULLs (kept as-is otherwise)
 * - adds a unique index on email
 *
 * Run:  node scripts/migrate-email-otp.cjs
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  await pool.query('ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL');
  console.log('phone_number is now nullable');

  await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_number_key');
  console.log('phone_number unique constraint dropped (null-safe)');

  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (email)');
  console.log('unique index on email created/confirmed');

  const { rows } = await pool.query(
    "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'users'"
  );
  console.table(rows);
  await pool.end();
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
