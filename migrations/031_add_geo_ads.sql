CREATE TABLE IF NOT EXISTS geo_ads (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'draft',
  placements JSONB NOT NULL DEFAULT '[]'::jsonb,
  title VARCHAR NOT NULL,
  body TEXT,
  media_url TEXT,
  target_url TEXT NOT NULL,
  cta_text VARCHAR DEFAULT 'Learn more',
  pin_lat DECIMAL(10, 8),
  pin_lng DECIMAL(11, 8),
  geofence_lat DECIMAL(10, 8) NOT NULL,
  geofence_lng DECIMAL(11, 8) NOT NULL,
  geofence_radius_m INTEGER NOT NULL DEFAULT 1000,
  target_user_types JSONB,
  min_daily_foot_traffic INTEGER,
  max_daily_foot_traffic INTEGER,
  priority INTEGER DEFAULT 0,
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  created_by_user_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_ads_status ON geo_ads(status);
CREATE INDEX IF NOT EXISTS idx_geo_ads_schedule ON geo_ads(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_geo_ads_priority ON geo_ads(priority);
CREATE INDEX IF NOT EXISTS idx_geo_ads_geofence ON geo_ads(geofence_lat, geofence_lng);
CREATE INDEX IF NOT EXISTS idx_geo_ads_placements ON geo_ads USING GIN (placements);
CREATE INDEX IF NOT EXISTS idx_geo_ads_user_types ON geo_ads USING GIN (target_user_types);

CREATE TABLE IF NOT EXISTS geo_ad_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id VARCHAR NOT NULL REFERENCES geo_ads(id) ON DELETE CASCADE,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  visitor_id VARCHAR,
  event_type VARCHAR NOT NULL,
  placement VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_ad_events_ad ON geo_ad_events(ad_id);
CREATE INDEX IF NOT EXISTS idx_geo_ad_events_type ON geo_ad_events(event_type);
CREATE INDEX IF NOT EXISTS idx_geo_ad_events_created ON geo_ad_events(created_at);
CREATE INDEX IF NOT EXISTS idx_geo_ad_events_placement ON geo_ad_events(placement);

CREATE TABLE IF NOT EXISTS geo_location_pings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  visitor_id VARCHAR,
  user_type VARCHAR,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  source VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geo_location_pings_created ON geo_location_pings(created_at);
CREATE INDEX IF NOT EXISTS idx_geo_location_pings_coords ON geo_location_pings(lat, lng);
CREATE INDEX IF NOT EXISTS idx_geo_location_pings_visitor ON geo_location_pings(visitor_id);
