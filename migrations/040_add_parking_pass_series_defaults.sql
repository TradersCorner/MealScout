-- Adds Airbnb-style listing defaults for Parking Pass.
-- No destructive changes; existing event rows remain valid overrides.

ALTER TABLE event_series
  ADD COLUMN IF NOT EXISTS series_type varchar NOT NULL DEFAULT 'event',
  ADD COLUMN IF NOT EXISTS parking_pass_days_of_week jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS default_breakfast_price_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_lunch_price_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_dinner_price_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_daily_price_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_weekly_price_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_monthly_price_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_host_price_cents integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_event_series_type
  ON event_series(series_type);

