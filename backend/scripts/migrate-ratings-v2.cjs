/*
 * The original reviews table used uuid identity columns; the app also needs
 * email/alias identities (chat users). Convert reviewee/reviewer/booking to TEXT.
 * Run:  node scripts/migrate-ratings-v2.cjs
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  // drop FKs first (identity columns now may be text emails, not only users.id uuids)
  await pool.query(`ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey`);
  await pool.query(`ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewee_id_fkey`);
  await pool.query(`ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_fkey`);
  await pool.query(`ALTER TABLE reviews ALTER COLUMN reviewer_id DROP NOT NULL`);
  await pool.query(`ALTER TABLE reviews ALTER COLUMN reviewee_id DROP NOT NULL`);
  await pool.query(`ALTER TABLE reviews ALTER COLUMN reviewer_id TYPE text USING reviewer_id::text`);
  await pool.query(`ALTER TABLE reviews ALTER COLUMN reviewee_id TYPE text USING reviewee_id::text`);
  await pool.query(`ALTER TABLE reviews ALTER COLUMN booking_id TYPE text USING booking_id::text`);
  await pool.query(`ALTER TABLE reviews ALTER COLUMN rating SET NOT NULL`);
  await pool.query(`ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_check`);
  await pool.query(`ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5)`);
  await pool.query(`ALTER TABLE reviews ALTER COLUMN created_at SET NOT NULL`);
  await pool.query(`CREATE INDEX IF NOT EXISTS reviews_reviewee_idx ON reviews (reviewee_id)`);
  console.log('reviews table migrated to flexible identity columns');
  await pool.end();
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
