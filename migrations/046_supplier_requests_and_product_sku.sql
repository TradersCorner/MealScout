-- Supplier marketplace: request/accept flow + product SKU support.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

ALTER TABLE IF EXISTS "supplier_products"
  ADD COLUMN IF NOT EXISTS "sku" varchar;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_supplier_products_sku"
  ON "supplier_products" ("supplier_id", "sku")
  WHERE "sku" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "supplier_requests" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplier_id" varchar NOT NULL REFERENCES "suppliers"("id") ON DELETE CASCADE,
  "buyer_restaurant_id" varchar NOT NULL REFERENCES "restaurants"("id") ON DELETE RESTRICT,
  "status" varchar NOT NULL DEFAULT 'submitted', -- 'submitted' | 'accepted' | 'declined' | 'cancelled'
  "requested_fulfillment" varchar NOT NULL DEFAULT 'pickup', -- 'pickup' (delivery later)
  "payment_preference" varchar NOT NULL DEFAULT 'offsite', -- 'offsite' | 'in_person'
  "note" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "accepted_at" timestamp,
  "accepted_by" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "declined_at" timestamp,
  "declined_by" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "decline_reason" text,
  "order_id" varchar REFERENCES "supplier_orders"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_supplier_requests_supplier"
  ON "supplier_requests" ("supplier_id");

CREATE INDEX IF NOT EXISTS "idx_supplier_requests_buyer"
  ON "supplier_requests" ("buyer_restaurant_id");

CREATE INDEX IF NOT EXISTS "idx_supplier_requests_status"
  ON "supplier_requests" ("status");

CREATE TABLE IF NOT EXISTS "supplier_request_items" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_id" varchar NOT NULL REFERENCES "supplier_requests"("id") ON DELETE CASCADE,
  "product_id" varchar REFERENCES "supplier_products"("id") ON DELETE SET NULL,
  "item_name" varchar,
  "quantity" integer NOT NULL DEFAULT 1,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supplier_request_items_request"
  ON "supplier_request_items" ("request_id");

