// Billing columns for payments: service fee breakdown (VAT, urgency, payout).
// Usage: node scripts/migrate-billing-columns.cjs [DATABASE_URL]
// Falls back to DATABASE_URL env (local .env via dotenv not loaded here).

const { Pool } = require('pg');

const url = process.argv[2] || process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/taskbuddy';

const pool = new Pool({ connectionString: url });

(async () => {
  try {
    await pool.query(`
      ALTER TABLE payments
        ADD COLUMN IF NOT EXISTS vat NUMERIC,
        ADD COLUMN IF NOT EXISTS urgency_fee NUMERIC,
        ADD COLUMN IF NOT EXISTS tasker_payout NUMERIC
    `);
    console.log('payments table: added vat, urgency_fee, tasker_payout (if missing)');
    await pool.end();
  } catch (err) {
    console.error('migration failed:', err.message);
    process.exit(1);
  }
})();
