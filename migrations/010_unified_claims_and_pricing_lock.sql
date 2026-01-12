-- Unified Claims System + Pricing Lock (North Star Implementation)
-- Phase 1: Add pricing lock fields to existing tables
-- Phase 2: Create unified claims table for all entity types

-- ============================================================================
-- PHASE 1: PRICING LOCK FOR RESTAURANTS (IMMUTABLE RULE)
-- ============================================================================
-- Rule: If claim created before March 1, 2026 → locked at $25/month forever
-- Price lock survives cancellation, pauses, everything

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS locked_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS price_lock_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS price_lock_reason VARCHAR(50);

-- Backfill existing restaurants created before March 1, 2026
UPDATE restaurants
SET
  locked_price_cents = 2500,
  price_lock_date = created_at,
  price_lock_reason = 'early_rollout'
WHERE
  created_at < '2026-03-01'
  AND locked_price_cents IS NULL
  AND is_food_truck = false; -- Only restaurants, not trucks

-- ============================================================================
-- PHASE 2: UNIFIED CLAIMS TABLE
-- ============================================================================
-- All actions create claims. One identity → many claims → verified → coordinated
-- Claim types: restaurant, food_truck, host, event, diner

CREATE TABLE IF NOT EXISTS claims (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is making the claim (identity)
  person_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- What kind of claim
  claim_type VARCHAR NOT NULL CHECK (claim_type IN ('restaurant', 'food_truck', 'host', 'event', 'diner')),

  -- Verification lifecycle
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'provisional', 'verified', 'active')),

  -- Link to actual entity (polymorphic reference)
  restaurant_id VARCHAR REFERENCES restaurants(id) ON DELETE SET NULL,
  host_id VARCHAR REFERENCES hosts(id) ON DELETE SET NULL,
  event_id VARCHAR REFERENCES events(id) ON DELETE SET NULL,

  -- Claim data (flexible structure for different claim types)
  claim_data JSONB NOT NULL DEFAULT '{}',

  -- Verification tracking
  verification_refs TEXT[], -- Documents, social proof, etc.
  verified_by VARCHAR REFERENCES users(id),
  verified_at TIMESTAMP,

  -- Notes and metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps (CRITICAL for pricing lock logic)
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Indexes for claims table
CREATE INDEX IF NOT EXISTS idx_claims_person ON claims(person_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_type ON claims(claim_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_restaurant ON claims(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_claims_host ON claims(host_id);
CREATE INDEX IF NOT EXISTS idx_claims_event ON claims(event_id);
CREATE INDEX IF NOT EXISTS idx_claims_created_before_march ON claims(created_at) WHERE created_at < '2026-03-01';

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_claims_person_type_status ON claims(person_id, claim_type, status);

COMMENT ON TABLE claims IS 'Unified claims table: One identity → many claims → verified → coordinated → monetized';
COMMENT ON COLUMN claims.claim_type IS 'Type: restaurant | food_truck | host | event | diner';
COMMENT ON COLUMN claims.status IS 'Lifecycle: pending → provisional → verified → active';
COMMENT ON COLUMN claims.created_at IS 'CRITICAL: Used for pricing lock calculation (before March 1 = $25/month)';
COMMENT ON COLUMN claims.verification_refs IS 'Array of verification references (docs, social URLs, etc.)';

-- ============================================================================
-- PHASE 3: BACKFILL EXISTING ENTITIES AS CLAIMS
-- ============================================================================

-- Backfill restaurants as claims
INSERT INTO claims (person_id, claim_type, status, restaurant_id, created_at, updated_at)
SELECT
  owner_id,
  CASE WHEN is_food_truck THEN 'food_truck' ELSE 'restaurant' END,
  CASE
    WHEN is_verified THEN 'verified'
    WHEN is_active THEN 'provisional'
    ELSE 'pending'
  END,
  id,
  created_at,
  updated_at
FROM restaurants
WHERE NOT EXISTS (
  SELECT 1 FROM claims WHERE claims.restaurant_id = restaurants.id
);

-- Backfill hosts as claims
INSERT INTO claims (person_id, claim_type, status, host_id, created_at, updated_at)
SELECT
  user_id,
  'host',
  CASE
    WHEN is_verified THEN 'verified'
    ELSE 'provisional'
  END,
  id,
  created_at,
  updated_at
FROM hosts
WHERE NOT EXISTS (
  SELECT 1 FROM claims WHERE claims.host_id = hosts.id
);

-- Backfill events as claims (event organizers)
INSERT INTO claims (person_id, claim_type, status, event_id, created_at, updated_at)
SELECT
  h.user_id,
  'event',
  'provisional', -- Events are always free, provisional status is sufficient
  e.id,
  e.created_at,
  e.updated_at
FROM events e
JOIN hosts h ON e.host_id = h.id
WHERE NOT EXISTS (
  SELECT 1 FROM claims WHERE claims.event_id = e.id
);

-- ============================================================================
-- PHASE 4: PRICING ENFORCEMENT VIEWS
-- ============================================================================

-- View: Active restaurant subscriptions with pricing
CREATE OR REPLACE VIEW v_restaurant_pricing AS
SELECT
  r.id AS restaurant_id,
  r.name,
  r.owner_id,
  u.email,
  u.stripe_subscription_id,
  r.locked_price_cents,
  r.price_lock_date,
  r.price_lock_reason,
  CASE
    -- Price lock applies if set
    WHEN r.locked_price_cents IS NOT NULL THEN r.locked_price_cents
    -- Default pricing for post-March claims
    WHEN r.created_at >= '2026-03-01' THEN 5000 -- $50/month configurable
    -- Fallback for edge cases
    ELSE 2500
  END AS effective_price_cents,
  r.created_at,
  r.is_active
FROM restaurants r
JOIN users u ON r.owner_id = u.id
WHERE r.is_food_truck = false; -- Restaurants only, not trucks

COMMENT ON VIEW v_restaurant_pricing IS 'Enforces pricing lock: $25/month if claimed before March 1, 2026';

-- View: Claims eligibility summary
CREATE OR REPLACE VIEW v_claims_summary AS
SELECT
  c.person_id,
  u.email,
  u.first_name,
  u.last_name,
  COUNT(*) FILTER (WHERE c.claim_type = 'restaurant') AS restaurant_claims,
  COUNT(*) FILTER (WHERE c.claim_type = 'food_truck') AS food_truck_claims,
  COUNT(*) FILTER (WHERE c.claim_type = 'host') AS host_claims,
  COUNT(*) FILTER (WHERE c.claim_type = 'event') AS event_claims,
  COUNT(*) FILTER (WHERE c.status = 'verified') AS verified_claims,
  COUNT(*) FILTER (WHERE c.created_at < '2026-03-01') AS early_rollout_claims,
  MIN(c.created_at) AS first_claim_at,
  MAX(c.created_at) AS latest_claim_at
FROM claims c
JOIN users u ON c.person_id = u.id
GROUP BY c.person_id, u.email, u.first_name, u.last_name;

COMMENT ON VIEW v_claims_summary IS 'Summary of all claims by person for admin dashboard';
