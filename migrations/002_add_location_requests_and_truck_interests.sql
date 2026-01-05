-- Add location hosting requests and truck interest tracking

CREATE TABLE IF NOT EXISTS location_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR NOT NULL,
  address TEXT NOT NULL,
  location_type VARCHAR NOT NULL,
  preferred_dates JSONB NOT NULL,
  expected_foot_traffic INTEGER NOT NULL,
  notes TEXT,
  status VARCHAR NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_requests_user ON location_requests (posted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_location_requests_status ON location_requests (status);
CREATE INDEX IF NOT EXISTS idx_location_requests_created ON location_requests (created_at);

CREATE TABLE IF NOT EXISTS truck_interests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  location_request_id VARCHAR NOT NULL REFERENCES location_requests(id) ON DELETE CASCADE,
  restaurant_id VARCHAR NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_truck_interests_request ON truck_interests (location_request_id);
CREATE INDEX IF NOT EXISTS idx_truck_interests_restaurant ON truck_interests (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_truck_interests_created ON truck_interests (created_at);
