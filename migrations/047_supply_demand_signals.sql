-- Supply marketplace: demand signals + supplier notifications for in-demand items not yet listed.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

CREATE TABLE IF NOT EXISTS "supply_demands" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "buyer_restaurant_id" varchar REFERENCES "restaurants"("id") ON DELETE SET NULL,
  "item_key" varchar NOT NULL,
  "item_name" varchar NOT NULL,
  "quantity" integer,
  "buyer_city" varchar,
  "buyer_state" varchar,
  "buyer_latitude" decimal(10, 8),
  "buyer_longitude" decimal(11, 8),
  "source" varchar NOT NULL DEFAULT 'manual', -- 'manual' | 'request' | 'import'
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supply_demands_item_key"
  ON "supply_demands" ("item_key");

CREATE INDEX IF NOT EXISTS "idx_supply_demands_buyer"
  ON "supply_demands" ("buyer_restaurant_id");

CREATE INDEX IF NOT EXISTS "idx_supply_demands_created_at"
  ON "supply_demands" ("created_at");

CREATE TABLE IF NOT EXISTS "supply_demand_notifications" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplier_id" varchar NOT NULL REFERENCES "suppliers"("id") ON DELETE CASCADE,
  "item_key" varchar NOT NULL,
  "last_notified_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_supply_demand_notifications_supplier_item"
  ON "supply_demand_notifications" ("supplier_id", "item_key");

CREATE INDEX IF NOT EXISTS "idx_supply_demand_notifications_last_notified"
  ON "supply_demand_notifications" ("last_notified_at");
