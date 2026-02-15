-- Supplier marketplace: speed up ILIKE '%term%' search paths with pg_trgm GIN indexes.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "idx_supplier_products_name_trgm"
  ON "supplier_products" USING gin ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_supplier_products_sku_trgm"
  ON "supplier_products" USING gin ("sku" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_suppliers_business_name_trgm"
  ON "suppliers" USING gin ("business_name" gin_trgm_ops);

