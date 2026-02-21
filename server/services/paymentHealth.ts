import { sql } from "drizzle-orm";
import { db } from "../db";

export type PaymentHealthSnapshot = {
  generatedAt: string;
  holdTtlMinutes: number;
  counts: {
    pendingTotal: number;
    pendingExpired: number;
    pendingWithoutIntent: number | null;
    confirmedLast24h: number;
    cancelledLast24h: number;
    failedLast24h: number | null;
    confirmedMissingPaidAt: number | null;
    confirmedWithoutIntent: number | null;
  };
  rates: {
    pendingExpiredRatePct: number;
  };
};

function parseHoldTtlMinutes() {
  const raw = Number(process.env.PARKING_PASS_HOLD_TTL_MINUTES ?? 7);
  if (!Number.isFinite(raw)) return 7;
  return Math.max(1, Math.min(raw, 60));
}

function asCount(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isMissingColumnError(error: any) {
  return String(error?.code || "") === "42703";
}

async function runCount(
  query: ReturnType<typeof sql>,
  nullable = false,
): Promise<number | null> {
  try {
    const result: any = await db.execute(query);
    const row = Array.isArray(result?.rows)
      ? result.rows[0]
      : Array.isArray(result)
        ? result[0]
        : null;
    return asCount(row?.count);
  } catch (error: any) {
    if (nullable && isMissingColumnError(error)) return null;
    throw error;
  }
}

export async function getPaymentHealthSnapshot(): Promise<PaymentHealthSnapshot> {
  const holdTtlMinutes = parseHoldTtlMinutes();

  const [
    pendingTotal,
    pendingExpired,
    pendingWithoutIntent,
    confirmedLast24h,
    cancelledLast24h,
    failedLast24h,
    confirmedMissingPaidAt,
    confirmedWithoutIntent,
  ] = await Promise.all([
    runCount(sql`
      select count(*)::int as count
      from event_bookings
      where status = 'pending'
    `),
    runCount(sql`
      select count(*)::int as count
      from event_bookings
      where status = 'pending'
        and created_at < (now() - (${holdTtlMinutes} * interval '1 minute'))
    `),
    runCount(
      sql`
        select count(*)::int as count
        from event_bookings
        where status = 'pending'
          and coalesce(nullif(trim(stripe_payment_intent_id), ''), '') = ''
      `,
      true,
    ),
    runCount(sql`
      select count(*)::int as count
      from event_bookings
      where status = 'confirmed'
        and coalesce(booking_confirmed_at, updated_at, created_at) >=
          (now() - (24 * interval '1 hour'))
    `),
    runCount(sql`
      select count(*)::int as count
      from event_bookings
      where status = 'cancelled'
        and coalesce(cancelled_at, updated_at, created_at) >=
          (now() - (24 * interval '1 hour'))
    `),
    runCount(
      sql`
        select count(*)::int as count
        from event_bookings
        where stripe_payment_status = 'failed'
          and coalesce(updated_at, created_at) >=
            (now() - (24 * interval '1 hour'))
      `,
      true,
    ),
    runCount(
      sql`
        select count(*)::int as count
        from event_bookings
        where status = 'confirmed'
          and paid_at is null
      `,
      true,
    ),
    runCount(
      sql`
        select count(*)::int as count
        from event_bookings
        where status = 'confirmed'
          and coalesce(nullif(trim(stripe_payment_intent_id), ''), '') = ''
      `,
      true,
    ),
  ]);

  const pendingTotalCount = Number(pendingTotal ?? 0);
  const pendingExpiredCount = Number(pendingExpired ?? 0);
  const confirmedLast24hCount = Number(confirmedLast24h ?? 0);
  const cancelledLast24hCount = Number(cancelledLast24h ?? 0);

  const expiredRate =
    pendingTotalCount > 0
      ? Number(((pendingExpiredCount / pendingTotalCount) * 100).toFixed(2))
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    holdTtlMinutes,
    counts: {
      pendingTotal: pendingTotalCount,
      pendingExpired: pendingExpiredCount,
      pendingWithoutIntent,
      confirmedLast24h: confirmedLast24hCount,
      cancelledLast24h: cancelledLast24hCount,
      failedLast24h,
      confirmedMissingPaidAt,
      confirmedWithoutIntent,
    },
    rates: {
      pendingExpiredRatePct: expiredRate,
    },
  };
}
