-- Track sitewide searches for trending/analytics (privacy-conscious, no raw IP storage).

CREATE TABLE IF NOT EXISTS search_query_events (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  source varchar NOT NULL DEFAULT 'unknown',
  user_id varchar REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_query_events_created_at
  ON search_query_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_query_events_query_created_at
  ON search_query_events(query, created_at DESC);

