-- Add invite/contact fields to imported truck listings so we can create invited accounts
-- and send “finish setup” reminder emails without allowing hostile claims.

ALTER TABLE truck_import_listings
  ADD COLUMN IF NOT EXISTS email VARCHAR;

ALTER TABLE truck_import_listings
  ADD COLUMN IF NOT EXISTS invited_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE truck_import_listings
  ADD COLUMN IF NOT EXISTS last_invite_sent_at TIMESTAMP;

ALTER TABLE verification_requests
  ADD COLUMN IF NOT EXISTS license_number VARCHAR;

