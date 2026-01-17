-- Add account setup tokens table for email-based user onboarding
CREATE TABLE IF NOT EXISTS account_setup_tokens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_by_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  request_ip VARCHAR,
  user_agent VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for account setup tokens
CREATE INDEX IF NOT EXISTS IDX_account_setup_tokens_user ON account_setup_tokens(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS IDX_account_setup_tokens_token ON account_setup_tokens(token_hash);
CREATE INDEX IF NOT EXISTS IDX_account_setup_tokens_expires ON account_setup_tokens(expires_at);
CREATE INDEX IF NOT EXISTS IDX_account_setup_tokens_used ON account_setup_tokens(used_at);
