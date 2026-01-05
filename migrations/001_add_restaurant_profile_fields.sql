-- Add business profile fields to restaurants table
-- These fields enable complete customer-facing profiles and LLM crawlability

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS website_url VARCHAR,
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR,
ADD COLUMN IF NOT EXISTS facebook_page_url VARCHAR,
ADD COLUMN IF NOT EXISTS amenities JSONB;

-- Add helpful comment for amenities field
COMMENT ON COLUMN restaurants.amenities IS 'JSON object with keys: parking, wifi, outdoor_seating (all boolean)';
