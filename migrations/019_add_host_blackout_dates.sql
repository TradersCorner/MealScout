CREATE TABLE IF NOT EXISTS "host_blackout_dates" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "host_id" varchar NOT NULL REFERENCES "hosts"("id") ON DELETE CASCADE,
  "date" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_host_blackout_host" ON "host_blackout_dates" ("host_id");
CREATE INDEX IF NOT EXISTS "idx_host_blackout_date" ON "host_blackout_dates" ("date");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_host_blackout_date" ON "host_blackout_dates" ("host_id", "date");
