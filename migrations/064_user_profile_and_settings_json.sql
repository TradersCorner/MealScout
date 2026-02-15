-- Public profile mini-site customization + persistent user settings.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

ALTER TABLE IF EXISTS "users"
  ADD COLUMN IF NOT EXISTS "public_profile_settings" jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "account_settings" jsonb NOT NULL DEFAULT '{}'::jsonb;
