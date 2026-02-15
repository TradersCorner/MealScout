-- Supplier marketplace: support fast global order timeline scans (admin + backoffice).
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

CREATE INDEX IF NOT EXISTS "idx_supplier_orders_created_at"
  ON "supplier_orders" ("created_at" DESC);

