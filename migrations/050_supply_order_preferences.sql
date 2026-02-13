-- Supply ordering: per-user preferences for best-deal planning.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

CREATE TABLE IF NOT EXISTS "supply_order_preferences" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "max_stops" integer NOT NULL DEFAULT 2,
  "max_radius_miles" integer NOT NULL DEFAULT 20,
  "cost_per_stop_cents" integer NOT NULL DEFAULT 0,
  "ping_suppliers" boolean NOT NULL DEFAULT true,
  "allow_substitutions" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_supply_order_preferences_user"
  ON "supply_order_preferences" ("user_id");
