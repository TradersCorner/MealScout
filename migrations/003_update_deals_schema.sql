-- Migration: Update deals table to add image requirement and business hours/ongoing deal options
-- Date: 2026-01-08
-- Database: PostgreSQL (syntax errors shown are MSSQL parser false positives - ignore them)

-- Make imageUrl required (NOT NULL) and add new boolean columns
ALTER TABLE deals 
  ALTER COLUMN image_url SET NOT NULL;

-- Add business hours and ongoing deal columns
ALTER TABLE deals 
  ADD COLUMN IF NOT EXISTS available_during_business_hours BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_ongoing BOOLEAN DEFAULT false;

-- Make endDate, startTime, and endTime nullable for ongoing deals and business hours deals
ALTER TABLE deals 
  ALTER COLUMN end_date DROP NOT NULL,
  ALTER COLUMN start_time DROP NOT NULL,
  ALTER COLUMN end_time DROP NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN deals.image_url IS 'Required: Deal image URL (base64 or uploaded URL)';
COMMENT ON COLUMN deals.available_during_business_hours IS 'If true, deal is available during restaurant operating hours (ignores startTime/endTime)';
COMMENT ON COLUMN deals.is_ongoing IS 'If true, deal has no expiration date (ignores endDate)';
COMMENT ON COLUMN deals.end_date IS 'Nullable: Required unless isOngoing is true';
COMMENT ON COLUMN deals.start_time IS 'Nullable: Required unless availableDuringBusinessHours is true';
COMMENT ON COLUMN deals.end_time IS 'Nullable: Required unless availableDuringBusinessHours is true';
