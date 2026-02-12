-- Add restaurants.claimed_from_import_id used to link seeded restaurants to truck_import_listings.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

ALTER TABLE IF EXISTS "restaurants"
  ADD COLUMN IF NOT EXISTS "claimed_from_import_id" varchar;

CREATE INDEX IF NOT EXISTS "idx_restaurants_claimed_from_import"
  ON "restaurants" ("claimed_from_import_id");

