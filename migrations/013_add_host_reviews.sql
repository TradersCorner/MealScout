-- Migration 013: Add Host Location Reviews
-- Food truck owners can review host locations to prevent bad experiences

CREATE TABLE IF NOT EXISTS host_reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id VARCHAR NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  truck_id VARCHAR NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Ratings
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Specific feedback categories
  traffic_rating INTEGER CHECK (traffic_rating >= 1 AND traffic_rating <= 5),
  amenities_rating INTEGER CHECK (amenities_rating >= 1 AND amenities_rating <= 5),
  host_communication_rating INTEGER CHECK (host_communication_rating >= 1 AND host_communication_rating <= 5),
  would_return_again BOOLEAN DEFAULT TRUE,

  -- Admin moderation
  is_approved BOOLEAN DEFAULT TRUE,
  flagged_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure one review per truck per host location
  UNIQUE(host_id, truck_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_host_reviews_host ON host_reviews(host_id);
CREATE INDEX IF NOT EXISTS idx_host_reviews_truck ON host_reviews(truck_id);
CREATE INDEX IF NOT EXISTS idx_host_reviews_user ON host_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_host_reviews_rating ON host_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_host_reviews_approved ON host_reviews(is_approved);

-- Add average rating and review count to hosts table for quick display
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2);
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update host average rating
CREATE OR REPLACE FUNCTION update_host_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hosts
  SET
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM host_reviews
      WHERE host_id = COALESCE(NEW.host_id, OLD.host_id)
        AND is_approved = TRUE
    ),
    review_count = (
      SELECT COUNT(*)
      FROM host_reviews
      WHERE host_id = COALESCE(NEW.host_id, OLD.host_id)
        AND is_approved = TRUE
    )
  WHERE id = COALESCE(NEW.host_id, OLD.host_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update host ratings
DROP TRIGGER IF EXISTS trigger_update_host_rating ON host_reviews;
CREATE TRIGGER trigger_update_host_rating
  AFTER INSERT OR UPDATE OR DELETE ON host_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_host_rating();
