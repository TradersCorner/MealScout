-- Drip sends for report leads (not users).
CREATE TABLE IF NOT EXISTS report_lead_sequence_sends (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id varchar NOT NULL REFERENCES pensacola_report_leads(id) ON DELETE CASCADE,
  sequence varchar NOT NULL,
  step integer NOT NULL,
  sent_at timestamp DEFAULT now(),
  metadata jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_report_lead_sequence_sends_lead_sequence_step
  ON report_lead_sequence_sends(lead_id, sequence, step);

CREATE INDEX IF NOT EXISTS idx_report_lead_sequence_sends_sequence_step
  ON report_lead_sequence_sends(sequence, step, sent_at);

