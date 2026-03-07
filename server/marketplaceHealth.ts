import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMarketplaceHealthAudit() {
  try {
    const [demandCountsRes, stuckThresholdRes, staleCollectingRes, stalePendingRes] =
      await Promise.all([
        db.execute(sql`
          select
            count(*)::int as total,
            count(*) filter (where demand_status = 'collecting')::int as collecting,
            count(*) filter (where demand_status = 'threshold_met')::int as threshold_met,
            count(*) filter (where demand_status = 'claimed')::int as claimed,
            count(*) filter (where demand_status = 'fulfilled')::int as fulfilled
          from location_requests
        `),
        db.execute(sql`
          select count(*)::int as count
          from location_requests
          where demand_status = 'threshold_met'
            and status = 'open'
            and coalesce(threshold_reached_at, created_at) < now() - interval '72 hours'
        `),
        db.execute(sql`
          select count(*)::int as count
          from location_requests
          where demand_status = 'collecting'
            and status = 'open'
            and created_at < now() - interval '14 days'
        `),
        db.execute(sql`
          select count(*)::int as count
          from event_bookings
          where status = 'pending'
            and stripe_payment_intent_id is not null
            and created_at < now() - interval '2 hours'
        `),
      ]);

    const demandCounts = demandCountsRes.rows?.[0] || {};
    const stuckThreshold = Number(stuckThresholdRes.rows?.[0]?.count || 0);
    const staleCollecting = Number(staleCollectingRes.rows?.[0]?.count || 0);
    const stalePending = Number(stalePendingRes.rows?.[0]?.count || 0);

    const ok = stuckThreshold === 0 && staleCollecting === 0 && stalePending === 0;

    return {
      ok,
      demandCounts,
      stuckThreshold,
      staleCollecting,
      stalePending,
      checkedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message || String(error),
      checkedAt: new Date().toISOString(),
    };
  }
}
