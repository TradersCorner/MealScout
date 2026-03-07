import "dotenv/config";
import { pool } from "../server/db";

async function run() {
  const [funnelRes, stuckRes] = await Promise.all([
    pool.query(`
      with base as (
        select id, demand_status, status, created_at, threshold_reached_at
        from location_requests
      ),
      i as (
        select location_request_id, count(*)::int as interests
        from truck_interests
        group by location_request_id
      ),
      c as (
        select location_request_id, count(*)::int as claims
        from host_location_claims
        group by location_request_id
      )
      select
        count(*)::int as total_requests,
        count(*) filter (where coalesce(i.interests, 0) > 0)::int as requests_with_interest,
        count(*) filter (where demand_status = 'threshold_met')::int as threshold_met,
        count(*) filter (where demand_status = 'claimed')::int as claimed,
        count(*) filter (where demand_status = 'fulfilled' or status = 'fulfilled')::int as fulfilled,
        avg(coalesce(i.interests, 0))::numeric(10,2) as avg_interests,
        count(*) filter (where coalesce(c.claims, 0) > 0)::int as claimed_rows
      from base
      left join i on i.location_request_id = base.id
      left join c on c.location_request_id = base.id
    `),
    pool.query(`
      select
        count(*) filter (
          where demand_status = 'threshold_met'
            and status = 'open'
            and coalesce(threshold_reached_at, created_at) < now() - interval '72 hours'
        )::int as stuck_threshold,
        count(*) filter (
          where demand_status = 'collecting'
            and status = 'open'
            and created_at < now() - interval '14 days'
        )::int as stale_collecting
      from location_requests
    `),
  ]);

  const funnel = funnelRes.rows?.[0] || {};
  const stuck = stuckRes.rows?.[0] || {};

  console.log("[demand-funnel]", funnel);
  console.log("[demand-funnel] stuck", stuck);

  const strict = String(process.env.AUDIT_STRICT || "").toLowerCase() === "true";
  const hasIssue = Number(stuck.stuck_threshold || 0) > 0 || Number(stuck.stale_collecting || 0) > 0;
  if (hasIssue && strict) {
    throw new Error(`[demand-funnel] FAIL ${JSON.stringify(stuck)}`);
  }
  if (hasIssue) {
    console.warn(`[demand-funnel] WARN ${JSON.stringify(stuck)}`);
  } else {
    console.log("[demand-funnel] PASS");
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
