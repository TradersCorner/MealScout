import "dotenv/config";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sumHost = `(parking_pass_breakfast_price_cents + parking_pass_lunch_price_cents + parking_pass_dinner_price_cents + parking_pass_daily_price_cents + parking_pass_weekly_price_cents + parking_pass_monthly_price_cents)`;
const sumSeries = `(coalesce(default_breakfast_price_cents,0)+coalesce(default_lunch_price_cents,0)+coalesce(default_dinner_price_cents,0)+coalesce(default_daily_price_cents,0)+coalesce(default_weekly_price_cents,0)+coalesce(default_monthly_price_cents,0))`;
const sumEvent = `(coalesce(breakfast_price_cents,0)+coalesce(lunch_price_cents,0)+coalesce(dinner_price_cents,0)+coalesce(daily_price_cents,0)+coalesce(weekly_price_cents,0)+coalesce(monthly_price_cents,0))`;

const main = async () => {
  const counts = await pool.query(
    `
    with host_prices as (
      select id, ${sumHost} as host_total
      from hosts
    ),
    series_prices as (
      select host_id, ${sumSeries} as series_total
      from event_series
      where series_type='parking_pass'
    ),
    event_prices as (
      select host_id, max(${sumEvent}) as max_event_total
      from events
      where event_type='parking_pass'
      group by host_id
    )
    select
      (select count(*)::int from hosts) as hosts,
      (select count(*)::int from host_prices where host_total > 0) as hosts_priced,
      (select count(*)::int
         from hosts
        where ${sumHost} > 0 and coalesce(trim(address),'') <> ''
      ) as hosts_priced_with_address,
      (select count(*)::int
         from hosts
        where ${sumHost} > 0 and (address is null or trim(address) = '')
      ) as hosts_priced_missing_address,
      (select count(*)::int from series_prices) as series_total,
      (select count(*)::int from series_prices where series_total > 0) as series_priced,
      (select count(*)::int from event_prices) as events_total,
      (select count(*)::int from event_prices where max_event_total > 0) as events_priced,
      (select count(*)::int
         from host_prices h
         join series_prices s on s.host_id = h.id
        where h.host_total = 0 and s.series_total > 0
      ) as series_priced_but_host_zero,
      (select count(*)::int
         from host_prices h
         join event_prices e on e.host_id = h.id
        where h.host_total = 0 and e.max_event_total > 0
      ) as events_priced_but_host_zero
    `,
  );

  console.log("Parking pass pricing summary:", counts.rows[0]);

  const mismatches = await pool.query(
    `
    with host_prices as (
      select id, business_name, address, ${sumHost} as host_total
      from hosts
    ),
    series_prices as (
      select host_id, ${sumSeries} as series_total
      from event_series
      where series_type='parking_pass'
    ),
    event_prices as (
      select host_id, max(${sumEvent}) as max_event_total
      from events
      where event_type='parking_pass'
      group by host_id
    )
    select
      h.id,
      h.business_name,
      left(coalesce(h.address,''), 60) as address,
      h.host_total,
      coalesce(s.series_total, 0) as series_total,
      coalesce(e.max_event_total, 0) as max_event_total
    from host_prices h
    left join series_prices s on s.host_id = h.id
    left join event_prices e on e.host_id = h.id
    where h.host_total = 0
      and (coalesce(s.series_total, 0) > 0 or coalesce(e.max_event_total, 0) > 0)
    order by coalesce(s.series_total, 0) desc, coalesce(e.max_event_total, 0) desc
    limit 50
    `,
  );

  if (mismatches.rows.length) {
    console.log("Hosts priced elsewhere but host defaults are zero:");
    for (const row of mismatches.rows) {
      console.log(
        `- ${row.id} | ${row.business_name || "(no name)"} | host=${row.host_total} series=${row.series_total} event=${row.max_event_total} | ${row.address}`,
      );
    }
  } else {
    console.log("No mismatches: no host with zero host pricing has series/event pricing.");
  }

  const unpriced = await pool.query(
    `
    select
      id,
      business_name,
      left(coalesce(address,''), 60) as address
    from hosts
    where ${sumHost} = 0
    order by updated_at desc nulls last, created_at desc nulls last
    limit 50
    `,
  );
  console.log(`Unpriced hosts (host parking_pass_* all zero): ${unpriced.rows.length}`);
  for (const row of unpriced.rows) {
    console.log(`- ${row.id} | ${row.business_name || "(no name)"} | ${row.address}`);
  }
};

main()
  .catch((e) => {
    console.error("checkParkingPassPricing failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await pool.end();
    } catch {
      // ignore
    }
  });
