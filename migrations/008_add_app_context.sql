-- Add app_context column for shared Facebook auth across Scout platforms
-- Phase: Shared Auth Infrastructure (TradeScout integration)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS app_context VARCHAR(50) DEFAULT 'mealscout';

COMMENT ON COLUMN public.users.app_context IS 'Platform context for shared auth: mealscout | tradescout | both';

-- Index for app-specific queries
CREATE INDEX IF NOT EXISTS idx_users_app_context
  ON public.users(app_context);
