-- Allow supply ordering without requiring a restaurant/truck profile.
-- Keep restaurant-based buyers supported for existing workflows.

ALTER TABLE IF EXISTS "supplier_requests"
  ADD COLUMN IF NOT EXISTS "buyer_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE IF EXISTS "supplier_requests"
  ALTER COLUMN "buyer_restaurant_id" DROP NOT NULL;

-- Best-effort backfill so existing requests remain attributable to the restaurant owner.
UPDATE "supplier_requests" sr
SET "buyer_user_id" = r."owner_id"
FROM "restaurants" r
WHERE sr."buyer_user_id" IS NULL
  AND sr."buyer_restaurant_id" IS NOT NULL
  AND r."id" = sr."buyer_restaurant_id";

CREATE INDEX IF NOT EXISTS "idx_supplier_requests_buyer_user"
  ON "supplier_requests" ("buyer_user_id");

CREATE INDEX IF NOT EXISTS "idx_supplier_requests_buyer_user_created_at"
  ON "supplier_requests" ("buyer_user_id", "created_at" DESC);

