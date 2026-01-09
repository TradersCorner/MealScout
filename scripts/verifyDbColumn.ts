import 'dotenv/config';
import { pool } from '../server/db';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('[DB VERIFY] DATABASE_URL is not set. Cannot verify against Neon.');
    process.exit(2);
  }
  if (!pool) {
    console.error('[DB VERIFY] Database pool not initialized.');
    process.exit(2);
  }

  console.log('[DB VERIFY] Checking users.subscription_signup_date column existence...');
  const colRes = await pool.query(
    `SELECT 1 FROM information_schema.columns 
     WHERE table_schema = 'public' 
       AND table_name = 'users' 
       AND column_name = 'subscription_signup_date'`
  );
  const exists = colRes.rowCount > 0;
  console.log(`[DB VERIFY] Column exists: ${exists}`);

  if (!exists) {
    process.exit(1);
  }

  console.log('[DB VERIFY] Counting rows with non-null subscription_signup_date...');
  const countRes = await pool.query(
    `SELECT 
       COUNT(*)::int AS total,
       COUNT(subscription_signup_date)::int AS with_signup_date
     FROM public.users`
  );
  const { total, with_signup_date } = countRes.rows[0] as { total: number; with_signup_date: number };
  console.log(`[DB VERIFY] Users total: ${total}, with signup date set: ${with_signup_date}`);
}

main().catch((err) => {
  console.error('[DB VERIFY] Error:', err?.message || err);
  process.exit(1);
});
