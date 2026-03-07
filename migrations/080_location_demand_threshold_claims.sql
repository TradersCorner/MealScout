ALTER TABLE "location_requests"
  ADD COLUMN IF NOT EXISTS "min_interested_trucks" integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "demand_status" varchar NOT NULL DEFAULT 'collecting',
  ADD COLUMN IF NOT EXISTS "threshold_reached_at" timestamp;

CREATE INDEX IF NOT EXISTS "idx_location_requests_demand_status"
  ON "location_requests" ("demand_status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_truck_interests_request_restaurant'
  ) THEN
    ALTER TABLE "truck_interests"
      ADD CONSTRAINT "uq_truck_interests_request_restaurant"
      UNIQUE ("location_request_id", "restaurant_id");
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "host_location_claims" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "location_request_id" varchar NOT NULL REFERENCES "location_requests"("id") ON DELETE cascade,
  "claimed_by_user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "host_id" varchar,
  "status" varchar NOT NULL DEFAULT 'pending',
  "message" text,
  "created_at" timestamp DEFAULT now(),
  "resolved_at" timestamp
);

CREATE INDEX IF NOT EXISTS "idx_host_location_claims_request"
  ON "host_location_claims" ("location_request_id");

CREATE INDEX IF NOT EXISTS "idx_host_location_claims_user"
  ON "host_location_claims" ("claimed_by_user_id");

CREATE INDEX IF NOT EXISTS "idx_host_location_claims_status"
  ON "host_location_claims" ("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_host_location_claims_active_request_user'
  ) THEN
    ALTER TABLE "host_location_claims"
      ADD CONSTRAINT "uq_host_location_claims_active_request_user"
      UNIQUE ("location_request_id", "claimed_by_user_id");
  END IF;
END $$;
