-- Supplier marketplace: online payment settings (pay through MealScout).
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

ALTER TABLE IF EXISTS "suppliers"
  ADD COLUMN IF NOT EXISTS "online_payments_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "online_payments_allow_ach" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "online_payments_allow_card" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "online_payments_min_order_cents" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "online_payments_notes" text;

