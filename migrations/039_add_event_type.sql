ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "event_type" varchar NOT NULL DEFAULT 'event';

-- Backfill parking pass events
UPDATE "events"
SET "event_type" = 'parking_pass'
WHERE "event_type" = 'event'
  AND (
    "name" ILIKE 'Parking Pass - %'
    OR "breakfast_price_cents" IS NOT NULL
    OR "lunch_price_cents" IS NOT NULL
    OR "dinner_price_cents" IS NOT NULL
    OR "daily_price_cents" IS NOT NULL
    OR "weekly_price_cents" IS NOT NULL
    OR "monthly_price_cents" IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS "idx_events_type" ON "events" ("event_type");
