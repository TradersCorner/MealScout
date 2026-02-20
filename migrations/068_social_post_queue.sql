-- Social posting queue (used for scheduled/async posting integrations)

CREATE TABLE IF NOT EXISTS social_post_queue (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  platform varchar NOT NULL,
  target varchar,
  message text NOT NULL,
  link text,
  status varchar NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_post_queue_status
  ON social_post_queue(status);

CREATE INDEX IF NOT EXISTS idx_social_post_queue_platform
  ON social_post_queue(platform);

CREATE INDEX IF NOT EXISTS idx_social_post_queue_created
  ON social_post_queue(created_at);

