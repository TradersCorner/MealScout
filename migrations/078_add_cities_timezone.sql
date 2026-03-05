-- Add timezone to cities for accurate time-intent discovery (IANA tz string, e.g. "America/Chicago")
ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS timezone varchar;

-- Best-effort backfill for early rollout (Pensacola + Central-time focus).
UPDATE cities
SET timezone = COALESCE(timezone, 'America/Chicago')
WHERE timezone IS NULL;

CREATE INDEX IF NOT EXISTS idx_cities_timezone ON cities(timezone);

