-- Supply Scout: stores + items + prices + shopping lists + preferences + barcode mappings.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

CREATE TABLE IF NOT EXISTS "supply_stores" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" varchar NOT NULL DEFAULT 'retailer', -- 'retailer' | 'wholesaler' | 'distributor' | 'supplier'
  "name" varchar NOT NULL,
  "website_url" text,
  "phone" varchar,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supply_stores_active"
  ON "supply_stores" ("is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_supply_stores_name"
  ON "supply_stores" ("name");

CREATE TABLE IF NOT EXISTS "supply_store_locations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" varchar NOT NULL REFERENCES "supply_stores"("id") ON DELETE CASCADE,
  "address" text,
  "city" varchar,
  "state" varchar,
  "postal_code" varchar,
  "latitude" decimal(10, 8),
  "longitude" decimal(11, 8),
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supply_store_locations_store"
  ON "supply_store_locations" ("store_id");

CREATE INDEX IF NOT EXISTS "idx_supply_store_locations_state"
  ON "supply_store_locations" ("state");

CREATE TABLE IF NOT EXISTS "supply_items" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "item_key" varchar NOT NULL,
  "canonical_name" varchar NOT NULL,
  "category" varchar,
  "default_unit" varchar, -- e.g. 'each', 'lb', 'case'
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_supply_items_key"
  ON "supply_items" ("item_key");

CREATE INDEX IF NOT EXISTS "idx_supply_items_canonical"
  ON "supply_items" ("canonical_name");

CREATE TABLE IF NOT EXISTS "supply_item_aliases" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "item_id" varchar NOT NULL REFERENCES "supply_items"("id") ON DELETE CASCADE,
  "alias_key" varchar NOT NULL,
  "alias" varchar NOT NULL,
  "source" varchar NOT NULL DEFAULT 'manual', -- 'manual' | 'supplier' | 'barcode'
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supply_item_aliases_item"
  ON "supply_item_aliases" ("item_id");

CREATE INDEX IF NOT EXISTS "idx_supply_item_aliases_alias_key"
  ON "supply_item_aliases" ("alias_key");

CREATE TABLE IF NOT EXISTS "supply_prices" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" varchar NOT NULL REFERENCES "supply_stores"("id") ON DELETE CASCADE,
  "store_location_id" varchar REFERENCES "supply_store_locations"("id") ON DELETE SET NULL,
  "item_id" varchar NOT NULL REFERENCES "supply_items"("id") ON DELETE CASCADE,
  "sku" varchar,
  "unit_label" varchar, -- e.g. 'each', 'lb', '12-pack'
  "unit_price_cents" integer NOT NULL,
  "currency" varchar NOT NULL DEFAULT 'usd',
  "observed_at" timestamp NOT NULL DEFAULT now(),
  "source" varchar NOT NULL DEFAULT 'manual', -- 'manual' | 'import' | 'supplier'
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supply_prices_store"
  ON "supply_prices" ("store_id");

CREATE INDEX IF NOT EXISTS "idx_supply_prices_item"
  ON "supply_prices" ("item_id");

CREATE INDEX IF NOT EXISTS "idx_supply_prices_observed"
  ON "supply_prices" ("observed_at");

CREATE TABLE IF NOT EXISTS "supply_shopping_lists" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "buyer_restaurant_id" varchar REFERENCES "restaurants"("id") ON DELETE SET NULL,
  "name" varchar NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supply_shopping_lists_owner"
  ON "supply_shopping_lists" ("owner_user_id");

CREATE INDEX IF NOT EXISTS "idx_supply_shopping_lists_buyer"
  ON "supply_shopping_lists" ("buyer_restaurant_id");

CREATE TABLE IF NOT EXISTS "supply_shopping_list_items" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "list_id" varchar NOT NULL REFERENCES "supply_shopping_lists"("id") ON DELETE CASCADE,
  "item_id" varchar REFERENCES "supply_items"("id") ON DELETE SET NULL,
  "raw_name" varchar NOT NULL,
  "quantity" decimal(10, 2) NOT NULL DEFAULT 1,
  "unit" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supply_shopping_list_items_list"
  ON "supply_shopping_list_items" ("list_id");

CREATE INDEX IF NOT EXISTS "idx_supply_shopping_list_items_item"
  ON "supply_shopping_list_items" ("item_id");

CREATE TABLE IF NOT EXISTS "supply_scout_preferences" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "hub_label" varchar,
  "hub_latitude" decimal(10, 8),
  "hub_longitude" decimal(11, 8),
  "max_radius_miles" integer NOT NULL DEFAULT 25,
  "cost_per_stop_cents" integer NOT NULL DEFAULT 800,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_supply_scout_preferences_user"
  ON "supply_scout_preferences" ("user_id");

CREATE TABLE IF NOT EXISTS "supply_barcode_mappings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "barcode" varchar NOT NULL,
  "item_id" varchar REFERENCES "supply_items"("id") ON DELETE SET NULL,
  "alias" varchar,
  "created_by_user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_supply_barcode_mappings_barcode"
  ON "supply_barcode_mappings" ("barcode");

