CREATE TABLE IF NOT EXISTS parking_pass_blackout_dates (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id varchar NOT NULL REFERENCES event_series(id) ON DELETE CASCADE,
  date timestamp NOT NULL,
  created_at timestamp DEFAULT now(),
  UNIQUE(series_id, date)
);

CREATE INDEX IF NOT EXISTS idx_pass_blackout_series
  ON parking_pass_blackout_dates(series_id);
CREATE INDEX IF NOT EXISTS idx_pass_blackout_date
  ON parking_pass_blackout_dates(date);
