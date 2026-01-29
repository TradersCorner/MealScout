ALTER TABLE "restaurants"
  ADD COLUMN IF NOT EXISTS "x_url" varchar,
  ADD COLUMN IF NOT EXISTS "social_autopost_settings" jsonb;
