/*
 * Extends tasker_applications for multi-service selection,
 * professional/general categorization and optional document uploads.
 * Run:  node scripts/migrate-apply-v2.cjs
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  await pool.query(`ALTER TABLE tasker_applications ADD COLUMN IF NOT EXISTS services TEXT NULL`);
  await pool.query(`ALTER TABLE tasker_applications ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'general'`);
  await pool.query(`ALTER TABLE tasker_applications ADD COLUMN IF NOT EXISTS documents TEXT NULL`);
  console.log('tasker_applications: v2 columns ready');

  // uploads directory
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('uploads/ directory created');
  }
  await pool.end();
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
