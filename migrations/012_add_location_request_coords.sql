-- Add latitude/longitude to location_requests for host spots
ALTER TABLE location_requests
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Index to speed up geospatial lookups for host spots
CREATE INDEX IF NOT EXISTS idx_location_requests_location
  ON location_requests(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
