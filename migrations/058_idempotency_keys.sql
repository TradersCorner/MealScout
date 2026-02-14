-- Shared idempotency records for mutation endpoints.
-- This file intentionally avoids DO blocks because scripts/runSqlMigration.ts splits statements on semicolons.

CREATE TABLE IF NOT EXISTS "idempotency_keys" (
  "id" bigserial PRIMARY KEY,
  "scope" varchar NOT NULL,
  "identity_key" varchar NOT NULL,
  "idem_key" varchar NOT NULL,
  "request_hash" varchar NOT NULL,
  "state" varchar NOT NULL DEFAULT 'processing',
  "status_code" integer,
  "response_body" jsonb,
  "locked_until" timestamp NOT NULL DEFAULT now(),
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_idempotency_keys_scope_identity_idem"
  ON "idempotency_keys" ("scope", "identity_key", "idem_key");

CREATE INDEX IF NOT EXISTS "idx_idempotency_keys_expires_at"
  ON "idempotency_keys" ("expires_at");

