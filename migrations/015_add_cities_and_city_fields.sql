-- 015_add_cities_and_city_fields.sql
-- Create cities registry and add city/state columns to restaurants and hosts

BEGIN;

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  state VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add city/state to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city VARCHAR;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS state VARCHAR;
CREATE INDEX IF NOT EXISTS idx_restaurants_city_state ON restaurants(city, state);

-- Add city/state to hosts
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS city VARCHAR;
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS state VARCHAR;
CREATE INDEX IF NOT EXISTS idx_hosts_city_state ON hosts(city, state);

COMMIT;
