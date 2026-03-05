-- Email sequence sends: idempotent tracking for drip campaigns.
CREATE TABLE IF NOT EXISTS email_sequence_sends (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sequence varchar NOT NULL,
  step integer NOT NULL,
  sent_at timestamp DEFAULT now(),
  metadata jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_email_sequence_sends_user_sequence_step
  ON email_sequence_sends(user_id, sequence, step);

CREATE INDEX IF NOT EXISTS idx_email_sequence_sends_sequence_step
  ON email_sequence_sends(sequence, step, sent_at);

CREATE INDEX IF NOT EXISTS idx_email_sequence_sends_user
  ON email_sequence_sends(user_id, sent_at);

