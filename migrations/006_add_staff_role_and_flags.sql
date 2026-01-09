-- Add staff role support and account management flags
-- Part 1: Add mustResetPassword and isDisabled columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_reset_password boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_disabled boolean DEFAULT false;

-- Part 2: Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_must_reset_password ON users(must_reset_password) WHERE must_reset_password = true;
CREATE INDEX IF NOT EXISTS idx_users_is_disabled ON users(is_disabled) WHERE is_disabled = true;

-- Note: If user_type is a Postgres ENUM, you'll need to add 'staff' value manually via:
-- ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'staff';
-- However, since this schema uses VARCHAR, no enum migration is needed.
-- The application layer enforces 'customer' | 'restaurant_owner' | 'staff' | 'admin'
