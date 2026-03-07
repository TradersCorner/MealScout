import "dotenv/config";
import { pool } from "../server/db";

type Row = Record<string, any>;

async function run() {
  const pendingHours = Math.max(1, Number(process.env.AUDIT_PENDING_HOURS || 2));

  const [
    totalsRes,
    pendingRes,
    confirmedMismatchRes,
    succeededNoConfirmedRes,
    mixedTerminalRes,
    duplicateEventIntentRes,
  ] =
    await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
          COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
          COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
        FROM event_bookings
        WHERE stripe_payment_intent_id IS NOT NULL
      `),
      pool.query(
        `
        SELECT
          COUNT(*)::int AS stale_pending
        FROM event_bookings
        WHERE status = 'pending'
          AND stripe_payment_intent_id IS NOT NULL
          AND created_at < (now() - ($1::int * interval '1 hour'))
      `,
        [pendingHours],
      ),
      pool.query(`
        SELECT COUNT(*)::int AS confirmed_without_success
        FROM event_bookings
        WHERE status = 'confirmed'
          AND stripe_payment_intent_id IS NOT NULL
          AND COALESCE(stripe_payment_status, '') NOT IN ('succeeded', 'bypassed')
      `),
      pool.query(`
        WITH by_intent AS (
          SELECT
            stripe_payment_intent_id AS intent_id,
            BOOL_OR(status = 'confirmed') AS has_confirmed,
            BOOL_OR(status = 'cancelled' AND refund_status = 'credit') AS has_credit_cancel,
            BOOL_OR(COALESCE(stripe_payment_status, '') = 'succeeded') AS has_succeeded
          FROM event_bookings
          WHERE stripe_payment_intent_id IS NOT NULL
          GROUP BY stripe_payment_intent_id
        )
        SELECT COUNT(*)::int AS succeeded_without_terminal
        FROM by_intent
        WHERE has_succeeded = true
          AND has_confirmed = false
          AND has_credit_cancel = false
      `),
      pool.query(`
        WITH by_intent AS (
          SELECT
            stripe_payment_intent_id AS intent_id,
            BOOL_OR(status = 'confirmed') AS has_confirmed,
            BOOL_OR(status = 'cancelled' AND refund_status = 'credit') AS has_credit_cancel
          FROM event_bookings
          WHERE stripe_payment_intent_id IS NOT NULL
          GROUP BY stripe_payment_intent_id
        )
        SELECT COUNT(*)::int AS mixed_terminal_intents
        FROM by_intent
        WHERE has_confirmed = true
          AND has_credit_cancel = true
      `),
      pool.query(`
        SELECT COUNT(*)::int AS duplicate_event_intent_rows
        FROM (
          SELECT event_id, stripe_payment_intent_id, COUNT(*) AS c
          FROM event_bookings
          WHERE stripe_payment_intent_id IS NOT NULL
          GROUP BY event_id, stripe_payment_intent_id
          HAVING COUNT(*) > 1
        ) t
      `),
    ]);

  const totals = (totalsRes.rows?.[0] || {}) as Row;
  const stalePending = Number(pendingRes.rows?.[0]?.stale_pending || 0);
  const confirmedWithoutSuccess = Number(
    confirmedMismatchRes.rows?.[0]?.confirmed_without_success || 0,
  );
  const succeededWithoutTerminal = Number(
    succeededNoConfirmedRes.rows?.[0]?.succeeded_without_terminal || 0,
  );
  const mixedTerminalIntents = Number(
    mixedTerminalRes.rows?.[0]?.mixed_terminal_intents || 0,
  );
  const duplicateEventIntentRows = Number(
    duplicateEventIntentRes.rows?.[0]?.duplicate_event_intent_rows || 0,
  );

  console.log("[webhook-audit] booking totals", totals);
  console.log("[webhook-audit] stale_pending", stalePending);
  console.log("[webhook-audit] confirmed_without_success", confirmedWithoutSuccess);
  console.log("[webhook-audit] succeeded_without_terminal", succeededWithoutTerminal);
  console.log("[webhook-audit] mixed_terminal_intents", mixedTerminalIntents);
  console.log("[webhook-audit] duplicate_event_intent_rows", duplicateEventIntentRows);

  const strict = String(process.env.AUDIT_STRICT || "").toLowerCase() === "true";
  const hasIssue =
    stalePending > 0 ||
    confirmedWithoutSuccess > 0 ||
    succeededWithoutTerminal > 0 ||
    mixedTerminalIntents > 0 ||
    duplicateEventIntentRows > 0;

  if (hasIssue) {
    const detail = {
      stalePending,
      confirmedWithoutSuccess,
      succeededWithoutTerminal,
      mixedTerminalIntents,
      duplicateEventIntentRows,
    };
    if (strict) {
      throw new Error(`[webhook-audit] FAIL ${JSON.stringify(detail)}`);
    }
    console.warn(`[webhook-audit] WARN ${JSON.stringify(detail)}`);
  } else {
    console.log("[webhook-audit] PASS");
  }
}

run()
  .catch((error: any) => {
    console.error(error?.stack || error?.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
