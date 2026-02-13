-- Supplier marketplace: Stripe Connect fields for supplier payouts.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

ALTER TABLE IF EXISTS "suppliers"
  ADD COLUMN IF NOT EXISTS "stripe_connect_account_id" varchar,
  ADD COLUMN IF NOT EXISTS "stripe_connect_status" varchar DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "stripe_onboarding_completed" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "stripe_charges_enabled" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "stripe_payouts_enabled" boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS "idx_suppliers_stripe_account"
  ON "suppliers" ("stripe_connect_account_id");

