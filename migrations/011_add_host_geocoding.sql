-- Add latitude/longitude to hosts table for map display
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_hosts_location ON hosts(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add admin-created flag to track manually onboarded hosts
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS admin_created BOOLEAN DEFAULT FALSE;
