-- Event ownership: coordinators own events/series; hosts remain venue/location records.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

ALTER TABLE IF EXISTS "event_series"
  ADD COLUMN IF NOT EXISTS "coordinator_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE IF EXISTS "events"
  ADD COLUMN IF NOT EXISTS "coordinator_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_event_series_coordinator_user"
  ON "event_series" ("coordinator_user_id");

CREATE INDEX IF NOT EXISTS "idx_events_coordinator_user"
  ON "events" ("coordinator_user_id");

-- Backfill ownership from the existing host -> user link for legacy rows.
UPDATE "event_series" es
SET "coordinator_user_id" = h."user_id"
FROM "hosts" h
WHERE es."host_id" = h."id"
  AND es."coordinator_user_id" IS NULL;

UPDATE "events" e
SET "coordinator_user_id" = h."user_id"
FROM "hosts" h
WHERE e."host_id" = h."id"
  AND e."coordinator_user_id" IS NULL;
