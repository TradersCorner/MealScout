-- Supplier marketplace: delivery portal fields (supplier delivery settings + delivery details on requests).
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

ALTER TABLE IF EXISTS "suppliers"
  ADD COLUMN IF NOT EXISTS "offers_delivery" boolean NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS "suppliers"
  ADD COLUMN IF NOT EXISTS "delivery_radius_miles" integer;

ALTER TABLE IF EXISTS "suppliers"
  ADD COLUMN IF NOT EXISTS "delivery_fee_cents" integer NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS "suppliers"
  ADD COLUMN IF NOT EXISTS "delivery_min_order_cents" integer NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS "suppliers"
  ADD COLUMN IF NOT EXISTS "delivery_notes" text;

ALTER TABLE IF EXISTS "supplier_requests"
  ADD COLUMN IF NOT EXISTS "delivery_address" text;

ALTER TABLE IF EXISTS "supplier_requests"
  ADD COLUMN IF NOT EXISTS "delivery_city" varchar;

ALTER TABLE IF EXISTS "supplier_requests"
  ADD COLUMN IF NOT EXISTS "delivery_state" varchar;

ALTER TABLE IF EXISTS "supplier_requests"
  ADD COLUMN IF NOT EXISTS "delivery_postal_code" varchar;

ALTER TABLE IF EXISTS "supplier_requests"
  ADD COLUMN IF NOT EXISTS "delivery_instructions" text;

ALTER TABLE IF EXISTS "supplier_requests"
  ADD COLUMN IF NOT EXISTS "delivery_fee_cents" integer NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS "supplier_requests"
  ADD COLUMN IF NOT EXISTS "delivery_status" varchar NOT NULL DEFAULT 'pending'; -- 'pending' | 'accepted' | 'out_for_delivery' | 'delivered' | 'cancelled'

ALTER TABLE IF EXISTS "supplier_requests"
  ADD COLUMN IF NOT EXISTS "delivery_scheduled_for" timestamp;

CREATE INDEX IF NOT EXISTS "idx_supplier_requests_fulfillment"
  ON "supplier_requests" ("requested_fulfillment");

CREATE INDEX IF NOT EXISTS "idx_supplier_requests_delivery_status"
  ON "supplier_requests" ("delivery_status");
