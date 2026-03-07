WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY event_id, stripe_payment_intent_id
      ORDER BY
        CASE status
          WHEN 'confirmed' THEN 0
          WHEN 'pending' THEN 1
          ELSE 2
        END,
        created_at ASC NULLS LAST,
        id ASC
    ) AS rn
  FROM event_bookings
  WHERE stripe_payment_intent_id IS NOT NULL
)
DELETE FROM event_bookings
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_event_bookings_event_intent"
  ON "event_bookings" ("event_id", "stripe_payment_intent_id")
  WHERE "stripe_payment_intent_id" IS NOT NULL;
