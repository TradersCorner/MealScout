ALTER TABLE event_bookings
  ADD COLUMN IF NOT EXISTS spot_number integer;

CREATE INDEX IF NOT EXISTS idx_event_bookings_spot_number ON event_bookings(spot_number);
