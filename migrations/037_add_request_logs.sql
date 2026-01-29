CREATE TABLE IF NOT EXISTS "request_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "method" varchar NOT NULL,
  "path" text NOT NULL,
  "status_code" integer NOT NULL,
  "duration_ms" integer NOT NULL,
  "user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "ip" varchar,
  "user_agent" text,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_request_logs_created" ON "request_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_request_logs_user" ON "request_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_request_logs_path" ON "request_logs" ("path");

CREATE TABLE IF NOT EXISTS "admin_daily_reports" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_date" timestamp NOT NULL,
  "report_type" varchar NOT NULL,
  "summary" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_admin_daily_reports_date" ON "admin_daily_reports" ("report_date");
CREATE INDEX IF NOT EXISTS "idx_admin_daily_reports_type" ON "admin_daily_reports" ("report_type");
