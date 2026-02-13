-- Supplier marketplace: suppliers list products; food trucks place pickup orders.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "business_name" varchar NOT NULL,
  "address" text,
  "city" varchar,
  "state" varchar,
  "latitude" decimal(10, 8),
  "longitude" decimal(11, 8),
  "contact_phone" varchar,
  "contact_email" varchar,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_suppliers_user"
  ON "suppliers" ("user_id");

CREATE INDEX IF NOT EXISTS "idx_suppliers_active"
  ON "suppliers" ("is_active");

CREATE TABLE IF NOT EXISTS "supplier_products" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplier_id" varchar NOT NULL REFERENCES "suppliers"("id") ON DELETE CASCADE,
  "name" varchar NOT NULL,
  "description" text,
  "price_cents" integer NOT NULL DEFAULT 0,
  "unit_label" varchar,
  "image_url" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supplier_products_supplier"
  ON "supplier_products" ("supplier_id");

CREATE INDEX IF NOT EXISTS "idx_supplier_products_active"
  ON "supplier_products" ("is_active");

CREATE TABLE IF NOT EXISTS "supplier_orders" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplier_id" varchar NOT NULL REFERENCES "suppliers"("id") ON DELETE CASCADE,
  "truck_restaurant_id" varchar NOT NULL REFERENCES "restaurants"("id") ON DELETE RESTRICT,
  "status" varchar NOT NULL DEFAULT 'submitted', -- 'submitted' | 'ready' | 'completed' | 'cancelled'
  "payment_method" varchar NOT NULL DEFAULT 'offsite', -- 'stripe' | 'offsite'
  "payment_status" varchar NOT NULL DEFAULT 'unpaid', -- 'unpaid' | 'paid' | 'offsite'
  "subtotal_cents" integer NOT NULL DEFAULT 0,
  "platform_fee_cents" integer NOT NULL DEFAULT 0,
  "stripe_fee_estimate_cents" integer NOT NULL DEFAULT 0,
  "total_cents" integer NOT NULL DEFAULT 0,
  "stripe_payment_intent_id" varchar,
  "pickup_note" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supplier_orders_supplier"
  ON "supplier_orders" ("supplier_id");

CREATE INDEX IF NOT EXISTS "idx_supplier_orders_truck"
  ON "supplier_orders" ("truck_restaurant_id");

CREATE INDEX IF NOT EXISTS "idx_supplier_orders_status"
  ON "supplier_orders" ("status");

CREATE TABLE IF NOT EXISTS "supplier_order_items" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" varchar NOT NULL REFERENCES "supplier_orders"("id") ON DELETE CASCADE,
  "product_id" varchar NOT NULL REFERENCES "supplier_products"("id") ON DELETE RESTRICT,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price_cents" integer NOT NULL DEFAULT 0,
  "line_total_cents" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supplier_order_items_order"
  ON "supplier_order_items" ("order_id");

