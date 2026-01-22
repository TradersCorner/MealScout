ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS spot_count integer DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hosts_spot_count ON hosts(spot_count);
