UPDATE users
SET affiliate_percent = 25
WHERE user_type = 'staff'
  AND (affiliate_percent IS NULL OR affiliate_percent <> 25);

UPDATE users
SET affiliate_percent = 0
WHERE user_type IN ('admin', 'super_admin')
  AND (affiliate_percent IS NULL OR affiliate_percent <> 0);
