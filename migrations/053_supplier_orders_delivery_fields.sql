-- Supplier marketplace: store delivery fee/fulfillment on supplier_orders.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

ALTER TABLE IF EXISTS "supplier_orders"
  ADD COLUMN IF NOT EXISTS "requested_fulfillment" varchar NOT NULL DEFAULT 'pickup'; -- 'pickup' | 'delivery'

ALTER TABLE IF EXISTS "supplier_orders"
  ADD COLUMN IF NOT EXISTS "delivery_fee_cents" integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "idx_supplier_orders_fulfillment"
  ON "supplier_orders" ("requested_fulfillment");
