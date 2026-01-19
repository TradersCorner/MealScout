CREATE TABLE IF NOT EXISTS "phone_verification_tokens" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone" varchar NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "request_ip" varchar,
  "user_agent" varchar,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_phone_verification_phone" ON "phone_verification_tokens" ("phone", "created_at");
CREATE INDEX IF NOT EXISTS "idx_phone_verification_expires" ON "phone_verification_tokens" ("expires_at");
