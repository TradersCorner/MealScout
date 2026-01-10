import 'dotenv/config';
import { pool } from '../server/db';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('[VERIFY] DATABASE_URL is not set.');
    process.exit(2);
  }
  if (!pool) {
    console.error('[VERIFY] DB pool not initialized.');
    process.exit(2);
  }

  console.log('🔎 Verifying video_stories transcript columns...');
  const cols = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'video_stories'
      AND column_name IN ('transcript','transcript_language','transcript_source')
    ORDER BY column_name;
  `);
  console.table(cols.rows);

  const idx = await pool.query(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'video_stories'
      AND indexname = 'idx_video_stories_transcript_search';
  `);
  console.log('Index exists:', idx.rowCount > 0);
}

main().catch((err) => {
  console.error('[VERIFY] Error:', err?.message || err);
  process.exit(1);
});
