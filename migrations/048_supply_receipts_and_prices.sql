-- Supply marketplace: receipt uploads + observed prices (including offsite suppliers/merchants).
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

CREATE TABLE IF NOT EXISTS "supply_receipts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "uploaded_by_user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "buyer_restaurant_id" varchar REFERENCES "restaurants"("id") ON DELETE SET NULL,
  "supplier_id" varchar REFERENCES "suppliers"("id") ON DELETE SET NULL,
  "merchant_name" varchar,
  "merchant_address" text,
  "merchant_city" varchar,
  "merchant_state" varchar,
  "purchased_at" timestamp,
  "total_cents" integer,
  "currency" varchar NOT NULL DEFAULT 'usd',
  "cloudinary_public_id" varchar,
  "receipt_image_url" text NOT NULL,
  "status" varchar NOT NULL DEFAULT 'uploaded', -- 'uploaded' | 'needs_review' | 'processed'
  "raw_text" text, -- OCR raw text (optional)
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supply_receipts_uploaded_by"
  ON "supply_receipts" ("uploaded_by_user_id");

CREATE INDEX IF NOT EXISTS "idx_supply_receipts_buyer"
  ON "supply_receipts" ("buyer_restaurant_id");

CREATE INDEX IF NOT EXISTS "idx_supply_receipts_supplier"
  ON "supply_receipts" ("supplier_id");

CREATE INDEX IF NOT EXISTS "idx_supply_receipts_purchased_at"
  ON "supply_receipts" ("purchased_at");

CREATE TABLE IF NOT EXISTS "supply_receipt_items" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "receipt_id" varchar NOT NULL REFERENCES "supply_receipts"("id") ON DELETE CASCADE,
  "item_key" varchar NOT NULL,
  "item_name" varchar NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price_cents" integer,
  "line_total_cents" integer,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supply_receipt_items_receipt"
  ON "supply_receipt_items" ("receipt_id");

CREATE INDEX IF NOT EXISTS "idx_supply_receipt_items_item_key"
  ON "supply_receipt_items" ("item_key");

CREATE INDEX IF NOT EXISTS "idx_supply_receipt_items_unit_price"
  ON "supply_receipt_items" ("unit_price_cents");
