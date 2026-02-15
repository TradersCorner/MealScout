-- Supplier marketplace: composite indexes for high-traffic filter+sort patterns.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

CREATE INDEX IF NOT EXISTS "idx_supplier_orders_supplier_created_at"
  ON "supplier_orders" ("supplier_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_supplier_orders_truck_created_at"
  ON "supplier_orders" ("truck_restaurant_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_supplier_requests_supplier_created_at"
  ON "supplier_requests" ("supplier_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_supplier_requests_buyer_created_at"
  ON "supplier_requests" ("buyer_restaurant_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_supplier_products_supplier_active_updated_at"
  ON "supplier_products" ("supplier_id", "is_active", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_suppliers_active_state_updated_at"
  ON "suppliers" ("is_active", "state", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_supply_shopping_lists_owner_updated_at"
  ON "supply_shopping_lists" ("owner_user_id", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_supply_shopping_list_items_list_updated_at"
  ON "supply_shopping_list_items" ("list_id", "updated_at" DESC);

