ALTER TABLE "user_payout_preferences" ADD COLUMN IF NOT EXISTS "method_details" jsonb;

ALTER TABLE "affiliate_withdrawals" ADD COLUMN IF NOT EXISTS "credit_ledger_id" varchar;
ALTER TABLE "affiliate_withdrawals" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;
ALTER TABLE "affiliate_withdrawals" ADD COLUMN IF NOT EXISTS "approved_by" varchar;
ALTER TABLE "affiliate_withdrawals" ADD COLUMN IF NOT EXISTS "paid_at" timestamp;
ALTER TABLE "affiliate_withdrawals" ADD COLUMN IF NOT EXISTS "rejected_at" timestamp;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'affiliate_withdrawals_credit_ledger_id_fkey'
  ) THEN
    ALTER TABLE "affiliate_withdrawals"
      ADD CONSTRAINT "affiliate_withdrawals_credit_ledger_id_fkey"
      FOREIGN KEY ("credit_ledger_id") REFERENCES "credit_ledger"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'affiliate_withdrawals_approved_by_fkey'
  ) THEN
    ALTER TABLE "affiliate_withdrawals"
      ADD CONSTRAINT "affiliate_withdrawals_approved_by_fkey"
      FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END$$;
