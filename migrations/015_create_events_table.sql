-- Migration: Create events table for MealScout
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id VARCHAR NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  series_id VARCHAR REFERENCES event_series(id) ON DELETE SET NULL,
  name VARCHAR,
  description TEXT,
  date TIMESTAMP NOT NULL,
  start_time VARCHAR NOT NULL,
  end_time VARCHAR NOT NULL,
  max_trucks INTEGER NOT NULL DEFAULT 1,
  status VARCHAR NOT NULL DEFAULT 'open',
  booked_restaurant_id VARCHAR REFERENCES restaurants(id) ON DELETE SET NULL,
  hard_cap_enabled BOOLEAN DEFAULT FALSE,
  host_price_cents INTEGER,
  requires_payment BOOLEAN DEFAULT FALSE,
  stripe_product_id VARCHAR,
  stripe_price_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_host ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_events_series ON events(series_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_booked_restaurant ON events(booked_restaurant_id);
CREATE INDEX IF NOT EXISTS idx_events_requires_payment ON events(requires_payment);
