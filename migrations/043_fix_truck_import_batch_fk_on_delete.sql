-- Ensure truck_import_listings.batch_id uses ON DELETE SET NULL.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts
-- splits statements on semicolons.

ALTER TABLE IF EXISTS "truck_import_listings"
  DROP CONSTRAINT IF EXISTS "truck_import_listings_batch_id_fkey";

ALTER TABLE IF EXISTS "truck_import_listings"
  ADD CONSTRAINT "truck_import_listings_batch_id_fkey"
  FOREIGN KEY ("batch_id")
  REFERENCES "truck_import_batches"("id")
  ON DELETE SET NULL;
