CREATE TABLE IF NOT EXISTS "truck_manual_schedules" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "truck_id" varchar NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "date" timestamp NOT NULL,
  "start_time" varchar NOT NULL,
  "end_time" varchar NOT NULL,
  "location_name" varchar,
  "address" varchar NOT NULL,
  "city" varchar,
  "state" varchar,
  "notes" text,
  "is_public" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_truck_manual_schedule_truck"
  ON "truck_manual_schedules" ("truck_id", "date");
