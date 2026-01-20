CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "request_ip" varchar,
  "user_agent" varchar,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_email_verification_user"
  ON "email_verification_tokens" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_email_verification_token"
  ON "email_verification_tokens" ("token_hash");
CREATE INDEX IF NOT EXISTS "idx_email_verification_expires"
  ON "email_verification_tokens" ("expires_at");
CREATE INDEX IF NOT EXISTS "idx_email_verification_used"
  ON "email_verification_tokens" ("used_at");
