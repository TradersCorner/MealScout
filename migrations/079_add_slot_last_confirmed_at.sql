-- Add last_confirmed_at for public schedule freshness gating ("new + true")

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS last_confirmed_at timestamp;

ALTER TABLE truck_manual_schedules
  ADD COLUMN IF NOT EXISTS last_confirmed_at timestamp;

-- Backfill existing rows.
UPDATE events
SET last_confirmed_at = COALESCE(last_confirmed_at, updated_at, created_at, NOW())
WHERE last_confirmed_at IS NULL;

UPDATE truck_manual_schedules
SET last_confirmed_at = COALESCE(last_confirmed_at, updated_at, created_at, NOW())
WHERE last_confirmed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_last_confirmed ON events(last_confirmed_at);
CREATE INDEX IF NOT EXISTS idx_truck_manual_schedules_last_confirmed ON truck_manual_schedules(last_confirmed_at);

