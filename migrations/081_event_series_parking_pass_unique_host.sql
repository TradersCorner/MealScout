CREATE UNIQUE INDEX IF NOT EXISTS "uq_event_series_host_parking_pass"
  ON "event_series" ("host_id")
  WHERE "series_type" = 'parking_pass';
