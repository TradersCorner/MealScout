ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "breakfast_price_cents" integer,
  ADD COLUMN IF NOT EXISTS "lunch_price_cents" integer,
  ADD COLUMN IF NOT EXISTS "dinner_price_cents" integer,
  ADD COLUMN IF NOT EXISTS "daily_price_cents" integer,
  ADD COLUMN IF NOT EXISTS "weekly_price_cents" integer;

ALTER TABLE "event_bookings"
  ADD COLUMN IF NOT EXISTS "slot_type" varchar;
