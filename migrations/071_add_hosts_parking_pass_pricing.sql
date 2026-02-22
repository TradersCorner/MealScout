-- Parking Pass pricing defaults live on the host (simple model: address + price => bookable).
-- Series/event rows remain as an implementation detail for per-day overrides and blackout dates.

ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS parking_pass_breakfast_price_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS parking_pass_lunch_price_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS parking_pass_dinner_price_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS parking_pass_daily_price_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS parking_pass_weekly_price_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS parking_pass_monthly_price_cents INTEGER NOT NULL DEFAULT 0;

ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS parking_pass_start_time VARCHAR;
ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS parking_pass_end_time VARCHAR;
ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS parking_pass_days_of_week jsonb NOT NULL DEFAULT '[]'::jsonb;

