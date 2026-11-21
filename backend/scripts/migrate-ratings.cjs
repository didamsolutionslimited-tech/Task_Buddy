/*
 * Creates reviews + tasker_tiers tables for the rating system.
 * Run:  node scripts/migrate-ratings.cjs
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id BIGSERIAL PRIMARY KEY,
      booking_id TEXT,
      reviewer_id TEXT NOT NULL,
      reviewee_id TEXT NOT NULL,
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS reviews_reviewee_idx ON reviews (reviewee_id);
  `);
  console.log('reviews table ready');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasker_tiers (
      user_id TEXT PRIMARY KEY,
      tier VARCHAR(20) NOT NULL DEFAULT 'Bronze',
      next_since TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('tasker_tiers table ready');
  await pool.end();
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
