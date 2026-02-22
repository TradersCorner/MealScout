-- Lock affiliate percent at the time a user is attributed to an affiliate.
-- This prevents changing an affiliate's current percent from retroactively changing
-- what they earn from already-attributed users.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS affiliate_closer_percent integer;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS affiliate_booker_percent integer;

-- Best-effort backfill: snapshot the affiliate's current percent for existing attributions.
UPDATE users u
SET affiliate_closer_percent = a.affiliate_percent
FROM users a
WHERE u.affiliate_closer_user_id = a.id
  AND u.affiliate_closer_user_id IS NOT NULL
  AND u.affiliate_closer_percent IS NULL;

UPDATE users u
SET affiliate_booker_percent = a.affiliate_percent
FROM users a
WHERE u.affiliate_booker_user_id = a.id
  AND u.affiliate_booker_user_id IS NOT NULL
  AND u.affiliate_booker_percent IS NULL;

