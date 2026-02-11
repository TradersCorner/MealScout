ALTER TABLE "truck_import_batches"
ADD COLUMN IF NOT EXISTS "purged_at" timestamp;

ALTER TABLE "truck_import_batches"
ADD COLUMN IF NOT EXISTS "purged_by" varchar REFERENCES "users"("id");

