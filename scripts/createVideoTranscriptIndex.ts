import 'dotenv/config';
import { pool } from '../server/db';

async function main() {
  if (!process.env.DATABASE_URL || !pool) {
    console.error('[CREATE INDEX] Missing DATABASE_URL or pool.');
    process.exit(2);
  }
  console.log('🧱 Creating GIN index for video_stories.transcript...');
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_video_stories_transcript_search ON public.video_stories USING gin(to_tsvector('english', COALESCE(transcript, '')));"
  );
  console.log('✅ Index ensured.');
}

main().catch((err) => {
  console.error('[CREATE INDEX] Error:', err?.message || err);
  process.exit(1);
});
