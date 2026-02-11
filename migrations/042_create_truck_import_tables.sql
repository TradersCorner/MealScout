-- Create truck import tables if missing (safe to run multiple times).

CREATE TABLE IF NOT EXISTS "truck_import_batches" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "source" varchar,
  "file_name" varchar,
  "uploaded_by" varchar REFERENCES "users"("id"),
  "total_rows" integer DEFAULT 0,
  "imported_rows" integer DEFAULT 0,
  "skipped_rows" integer DEFAULT 0,
  "purged_at" timestamp,
  "purged_by" varchar REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_truck_import_batches_created"
  ON "truck_import_batches" ("created_at");

CREATE TABLE IF NOT EXISTS "truck_import_listings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" varchar REFERENCES "truck_import_batches"("id"),
  "source" varchar,
  "external_id" varchar,
  "email" varchar,
  "name" varchar NOT NULL,
  "address" text NOT NULL,
  "city" varchar,
  "state" varchar,
  "phone" varchar,
  "cuisine_type" varchar,
  "website_url" varchar,
  "instagram_url" varchar,
  "facebook_page_url" varchar,
  "latitude" decimal(10, 8),
  "longitude" decimal(11, 8),
  "confidence_score" integer DEFAULT 0,
  "status" varchar NOT NULL DEFAULT 'unclaimed',
  "invited_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "last_invite_sent_at" timestamp,
  "raw_data" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

ALTER TABLE IF EXISTS "truck_import_listings"
  ADD COLUMN IF NOT EXISTS "batch_id" varchar;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'truck_import_batches') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'truck_import_listings_batch_id_fkey'
    ) THEN
      ALTER TABLE "truck_import_listings"
        ADD CONSTRAINT "truck_import_listings_batch_id_fkey"
        FOREIGN KEY ("batch_id") REFERENCES "truck_import_batches"("id")
        ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_truck_import_external"
  ON "truck_import_listings" ("external_id");

CREATE INDEX IF NOT EXISTS "idx_truck_import_status"
  ON "truck_import_listings" ("status");

CREATE INDEX IF NOT EXISTS "idx_truck_import_state"
  ON "truck_import_listings" ("state");

CREATE INDEX IF NOT EXISTS "idx_truck_import_batch"
  ON "truck_import_listings" ("batch_id");

