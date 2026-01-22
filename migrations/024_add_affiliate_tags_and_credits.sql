ALTER TABLE users
  ADD COLUMN IF NOT EXISTS affiliate_tag varchar;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS affiliate_percent integer DEFAULT 5;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS affiliate_closer_user_id varchar REFERENCES users(id);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS affiliate_booker_user_id varchar REFERENCES users(id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_affiliate_tag ON users(affiliate_tag);
CREATE INDEX IF NOT EXISTS idx_users_affiliate_tag ON users(affiliate_tag);

ALTER TABLE affiliate_commission_ledger
  ADD COLUMN IF NOT EXISTS commission_percent integer;

ALTER TABLE affiliate_commission_ledger
  ADD COLUMN IF NOT EXISTS source_amount_cents integer;

CREATE TABLE IF NOT EXISTS affiliate_share_events (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type varchar NOT NULL,
  resource_id varchar,
  destination_url text NOT NULL,
  share_method varchar,
  metadata jsonb,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_share_user ON affiliate_share_events(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_share_created ON affiliate_share_events(created_at);
