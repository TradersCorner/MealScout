-- Host earnings ledger: immutable entries from paid parking pass bookings.
CREATE TABLE IF NOT EXISTS host_earnings_ledger (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id varchar NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  booking_id varchar REFERENCES event_bookings(id) ON DELETE SET NULL,
  stripe_payment_intent_id varchar,
  entry_type varchar NOT NULL,
  source_type varchar NOT NULL DEFAULT 'parking_pass_booking',
  amount_cents integer NOT NULL,
  description text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_host_earnings_host
  ON host_earnings_ledger(host_id);
CREATE INDEX IF NOT EXISTS idx_host_earnings_booking
  ON host_earnings_ledger(booking_id);
CREATE INDEX IF NOT EXISTS idx_host_earnings_intent
  ON host_earnings_ledger(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_host_earnings_created
  ON host_earnings_ledger(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_host_earnings_booking_entry
  ON host_earnings_ledger(booking_id, entry_type)
  WHERE booking_id IS NOT NULL;

-- Host payout requests: cash-out workflow records.
CREATE TABLE IF NOT EXISTS host_payout_requests (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id varchar NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  status varchar NOT NULL DEFAULT 'pending',
  notes text,
  reviewed_by_user_id varchar REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamp,
  paid_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_host_payout_requests_host
  ON host_payout_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_host_payout_requests_user
  ON host_payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_host_payout_requests_status
  ON host_payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_host_payout_requests_created
  ON host_payout_requests(created_at);
