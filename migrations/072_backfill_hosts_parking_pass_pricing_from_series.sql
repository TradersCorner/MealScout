-- Backfill host-level Parking Pass defaults from existing parking_pass event_series defaults.
-- This makes "host address + price => bookable" true immediately after the new columns are added.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'hosts'
      AND column_name = 'parking_pass_breakfast_price_cents'
  ) THEN
    UPDATE hosts h
    SET
      parking_pass_breakfast_price_cents = COALESCE(s.default_breakfast_price_cents, 0),
      parking_pass_lunch_price_cents = COALESCE(s.default_lunch_price_cents, 0),
      parking_pass_dinner_price_cents = COALESCE(s.default_dinner_price_cents, 0),
      parking_pass_daily_price_cents = COALESCE(s.default_daily_price_cents, 0),
      parking_pass_weekly_price_cents = COALESCE(s.default_weekly_price_cents, 0),
      parking_pass_monthly_price_cents = COALESCE(s.default_monthly_price_cents, 0),
      parking_pass_start_time = COALESCE(s.default_start_time, h.parking_pass_start_time),
      parking_pass_end_time = COALESCE(s.default_end_time, h.parking_pass_end_time),
      parking_pass_days_of_week = COALESCE(s.parking_pass_days_of_week, h.parking_pass_days_of_week),
      updated_at = NOW()
    FROM event_series s
    WHERE s.host_id = h.id
      AND COALESCE(s.series_type, '') = 'parking_pass';
  END IF;
END $$;
