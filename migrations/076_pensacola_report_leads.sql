-- Pensacola report lead magnet tables.

CREATE TABLE IF NOT EXISTS pensacola_report_leads (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar NOT NULL,
  first_name varchar,
  source varchar NOT NULL DEFAULT 'pensacola_report',
  ip varchar,
  user_agent text,
  created_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pensacola_report_leads_email
  ON pensacola_report_leads(lower(email));

CREATE INDEX IF NOT EXISTS idx_pensacola_report_leads_created
  ON pensacola_report_leads(created_at);

-- Download tokens for the PDF (hashed token storage).
CREATE TABLE IF NOT EXISTS report_download_tokens (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id varchar NOT NULL REFERENCES pensacola_report_leads(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamp NOT NULL,
  used_at timestamp,
  created_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_report_download_tokens_hash
  ON report_download_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_report_download_tokens_lead
  ON report_download_tokens(lead_id, created_at);

CREATE INDEX IF NOT EXISTS idx_report_download_tokens_expires
  ON report_download_tokens(expires_at);

