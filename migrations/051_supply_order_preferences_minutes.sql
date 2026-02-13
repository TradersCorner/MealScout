-- Supply ordering: use minutes + cost-per-minute for stop friction (instead of only fixed cents).
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

ALTER TABLE IF EXISTS "supply_order_preferences"
  ADD COLUMN IF NOT EXISTS "stop_minutes" integer NOT NULL DEFAULT 10;

ALTER TABLE IF EXISTS "supply_order_preferences"
  ADD COLUMN IF NOT EXISTS "cost_per_minute_cents" integer NOT NULL DEFAULT 0;

