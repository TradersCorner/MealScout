-- Supplier marketplace: allow suppliers to control which products are delivery-eligible.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

ALTER TABLE IF EXISTS "supplier_products"
  ADD COLUMN IF NOT EXISTS "delivery_eligible" boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "idx_supplier_products_delivery_eligible"
  ON "supplier_products" ("delivery_eligible");

