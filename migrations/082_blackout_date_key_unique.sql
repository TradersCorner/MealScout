WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY series_id, ("date"::date)
           ORDER BY created_at ASC NULLS LAST, id ASC
         ) AS rn
  FROM parking_pass_blackout_dates
)
DELETE FROM parking_pass_blackout_dates
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

UPDATE parking_pass_blackout_dates
SET "date" = ("date"::date)::timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_pass_blackout_series_date_key"
  ON "parking_pass_blackout_dates" ("series_id", (("date")::date));
