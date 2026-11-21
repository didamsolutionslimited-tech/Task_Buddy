/*
 * Adds price-negotiation columns to chat_messages.
 * Run:  node scripts/migrate-chat-offers.cjs
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS offer_amount NUMERIC NULL`);
  await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS offer_status TEXT NULL CHECK (offer_status IN ('proposed','accepted','declined') OR offer_status IS NULL)`);
  await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS msg_kind TEXT NULL DEFAULT 'text'`);
  console.log('chat_messages: offer columns ready');
  await pool.end();
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
