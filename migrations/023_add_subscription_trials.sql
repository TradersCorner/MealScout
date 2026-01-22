ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trial_started_at timestamp;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamp;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false;
