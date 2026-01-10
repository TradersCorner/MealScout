-- Add transcript fields to video_stories table for SEO/LLMO optimization
-- Phase 3A: Transcript Infrastructure

ALTER TABLE public.video_stories
	ADD COLUMN IF NOT EXISTS transcript TEXT,
	ADD COLUMN IF NOT EXISTS transcript_language VARCHAR(10) DEFAULT 'en',
	ADD COLUMN IF NOT EXISTS transcript_source VARCHAR(20);

COMMENT ON COLUMN public.video_stories.transcript IS 'Full text transcript of video content for SEO and LLM indexing';
COMMENT ON COLUMN public.video_stories.transcript_language IS 'ISO 639-1 language code (e.g., en, es, fr)';
COMMENT ON COLUMN public.video_stories.transcript_source IS 'Source of transcript: auto (AI-generated), manual (user-entered), edited (AI + human review)';

-- Index for full-text search on transcripts
CREATE INDEX IF NOT EXISTS idx_video_stories_transcript_search
	ON public.video_stories USING gin (
		to_tsvector('english', COALESCE(transcript, ''))
	);
