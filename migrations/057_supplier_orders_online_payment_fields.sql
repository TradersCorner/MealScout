-- Supplier marketplace: store Stripe charge split amounts + buyer discounts for online payments.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

ALTER TABLE IF EXISTS "supplier_orders"
  ADD COLUMN IF NOT EXISTS "stripe_charge_amount_cents" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "stripe_application_fee_cents" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "stripe_transfer_amount_cents" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "buyer_discount_cents" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "buyer_payment_method" varchar;

