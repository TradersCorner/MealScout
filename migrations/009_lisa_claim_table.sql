-- LISA Phase 4A: Claim Persistence Table
-- Purpose: Write-only fact recording layer for deterministic resolution
-- NO scoring, NO automation, NO user-facing effects yet

CREATE TABLE IF NOT EXISTS lisa_claim (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What the claim is about
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,

  -- Who caused or emitted the claim (optional - some claims are system-level)
  actor_type TEXT,
  actor_id UUID,

  -- App context (enforces separation between TradeScout and MealScout)
  app TEXT NOT NULL CHECK (app IN ('tradescout', 'mealscout')),

  -- Semantic meaning (verb-based, plain English)
  claim_type TEXT NOT NULL,

  -- Raw data only - no computed values
  claim_value JSONB NOT NULL,

  -- Where the claim originated
  source TEXT NOT NULL,

  -- Confidence level (0.0 to 1.0, default 1.0 for direct observations)
  confidence REAL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),

  -- Immutable timestamp
  created_at TIMESTAMP DEFAULT now()
);

-- Index for querying claims by subject
CREATE INDEX IF NOT EXISTS idx_lisa_claim_subject ON lisa_claim(subject_type, subject_id);

-- Index for querying claims by actor
CREATE INDEX IF NOT EXISTS idx_lisa_claim_actor ON lisa_claim(actor_type, actor_id);

-- Index for querying claims by app context
CREATE INDEX IF NOT EXISTS idx_lisa_claim_app ON lisa_claim(app);

-- Index for querying claims by type
CREATE INDEX IF NOT EXISTS idx_lisa_claim_type ON lisa_claim(claim_type);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_lisa_claim_created_at ON lisa_claim(created_at DESC);

-- Composite index for common query patterns (app + subject)
CREATE INDEX IF NOT EXISTS idx_lisa_claim_app_subject ON lisa_claim(app, subject_type, subject_id);

COMMENT ON TABLE lisa_claim IS 'Phase 4A: Immutable fact layer for LISA. Claims are observations, not conclusions. Write-only until Phase 4B+.';
COMMENT ON COLUMN lisa_claim.subject_type IS 'Entity type the claim describes (user, video, restaurant, project, etc.)';
COMMENT ON COLUMN lisa_claim.subject_id IS 'UUID of the entity being described';
COMMENT ON COLUMN lisa_claim.actor_type IS 'Entity type that caused the claim (user, system, null for ambient facts)';
COMMENT ON COLUMN lisa_claim.actor_id IS 'UUID of the entity that caused the claim';
COMMENT ON COLUMN lisa_claim.app IS 'App context where claim originated (tradescout | mealscout)';
COMMENT ON COLUMN lisa_claim.claim_type IS 'Semantic claim identifier (verb-based, e.g., user_logged_in, video_recommendation_created)';
COMMENT ON COLUMN lisa_claim.claim_value IS 'Raw claim data as JSONB - no computed scores or rankings';
COMMENT ON COLUMN lisa_claim.source IS 'Claim origin (oauth, user, system, video, recommendation, etc.)';
COMMENT ON COLUMN lisa_claim.confidence IS 'Claim confidence level (0.0 = uncertain, 1.0 = direct observation). Default 1.0.';
COMMENT ON COLUMN lisa_claim.created_at IS 'Immutable timestamp when claim was recorded';
