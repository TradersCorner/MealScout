-- Add spot photo support for host locations and additional host addresses.
ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS spot_image_url TEXT;

ALTER TABLE user_addresses
  ADD COLUMN IF NOT EXISTS spot_image_url TEXT;

