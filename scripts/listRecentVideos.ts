import 'dotenv/config';
import { pool } from '../server/db';

async function main() {
  if (!process.env.DATABASE_URL || !pool) {
    console.error('[LIST VIDEOS] Missing DATABASE_URL or pool.');
    process.exit(2);
  }
  const res = await pool.query(
    `SELECT id, title, created_at
     FROM public.video_stories
     ORDER BY created_at DESC
     LIMIT 10;`
  );
  console.table(res.rows);
}

main().catch((err) => {
  console.error('[LIST VIDEOS] Error:', err?.message || err);
  process.exit(1);
});
