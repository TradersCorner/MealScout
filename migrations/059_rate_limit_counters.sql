-- Shared counters for distributed rate limiting across instances.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

CREATE TABLE IF NOT EXISTS "rate_limit_counters" (
  "scope" varchar NOT NULL,
  "identity_key" varchar NOT NULL,
  "window_start" bigint NOT NULL,
  "count" integer NOT NULL DEFAULT 0,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("scope", "identity_key", "window_start")
);

CREATE INDEX IF NOT EXISTS "idx_rate_limit_counters_updated_at"
  ON "rate_limit_counters" ("updated_at");

