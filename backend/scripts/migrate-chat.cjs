/*
 * Creates the chat_messages table for real-time messaging
 * between clients and taskers.
 * Run:  node scripts/migrate-chat.cjs
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGSERIAL PRIMARY KEY,
      conversation_key TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      sender_name TEXT,
      recipient_email TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx ON chat_messages (conversation_key, id);
  `);
  console.log('chat_messages table ready');
  await pool.end();
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
