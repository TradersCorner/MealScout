-- Add subscriptionSignupDate column to users table
-- This tracks when a user first signed up for a subscription to lock in their pricing
-- Users who sign up before 2026-03-01 get $25/month for life
-- Users who sign up after pay $50/month

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_signup_date TIMESTAMP;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_signup_date ON users(subscription_signup_date);

-- Add comment to explain the column
COMMENT ON COLUMN users.subscription_signup_date IS 'Date when user first subscribed - used to lock in promotional pricing ($25/mo before 2026-03-01, $50/mo after)';
