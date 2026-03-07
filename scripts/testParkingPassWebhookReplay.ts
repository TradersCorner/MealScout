import "dotenv/config";
import Stripe from "stripe";
import { pool } from "../server/db";

type Candidate = {
  payment_intent_id: string;
  truck_id: string;
  event_id: string;
  slot_type: string | null;
  total_cents: number;
  host_price_cents: number;
  platform_fee_cents: number;
  event_date: Date;
};

function dateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

async function postWebhookEvent(params: {
  stripe: Stripe;
  webhookSecret: string;
  apiBase: string;
  eventType: string;
  object: Record<string, any>;
}) {
  const payload = JSON.stringify({
    id: `evt_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    object: "event",
    type: params.eventType,
    data: { object: params.object },
  });
  const signature = params.stripe.webhooks.generateTestHeaderString({
    payload,
    secret: params.webhookSecret,
  });

  const res = await fetch(`${params.apiBase}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature,
    },
    body: payload,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `[webhook-replay] webhook ${params.eventType} failed status=${res.status} body=${text}`,
    );
  }
}

async function run() {
  const apiBase = String(process.env.API_BASE || "").trim();
  const stripeSecret = String(process.env.STRIPE_SECRET_KEY || "").trim();
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();

  if (!apiBase || !stripeSecret || !webhookSecret) {
    console.log(
      "[webhook-replay] Skipping: require API_BASE, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET",
    );
    return;
  }

  const candidateRes = await pool.query(`
    select
      b.stripe_payment_intent_id as payment_intent_id,
      b.truck_id,
      b.event_id,
      b.slot_type,
      b.total_cents,
      b.host_price_cents,
      b.platform_fee_cents,
      e.date as event_date
    from event_bookings b
    join events e on e.id = b.event_id
    where b.status = 'confirmed'
      and b.stripe_payment_intent_id is not null
    order by coalesce(b.booking_confirmed_at, b.created_at) desc
    limit 1
  `);

  const candidate = (candidateRes.rows?.[0] || null) as Candidate | null;
  if (!candidate?.payment_intent_id) {
    console.log("[webhook-replay] Skipping: no confirmed Stripe booking intents found.");
    return;
  }

  const stripe = new Stripe(stripeSecret);
  const paymentIntentObject = {
    id: candidate.payment_intent_id,
    object: "payment_intent",
    amount: Number(candidate.total_cents || 0),
    metadata: {
      passId: String(candidate.event_id),
      truckId: String(candidate.truck_id),
      slotType: String(candidate.slot_type || "daily"),
      slotTypes: String(candidate.slot_type || "daily"),
      bookingDays: "1",
      bookingStartDate: dateKey(new Date(candidate.event_date)),
      hostPriceCents: String(candidate.host_price_cents || 0),
      platformFeeCents: String(candidate.platform_fee_cents || 0),
      totalCents: String(candidate.total_cents || 0),
    },
  };

  await postWebhookEvent({
    stripe,
    webhookSecret,
    apiBase,
    eventType: "payment_intent.succeeded",
    object: paymentIntentObject,
  });
  await postWebhookEvent({
    stripe,
    webhookSecret,
    apiBase,
    eventType: "payment_intent.succeeded",
    object: paymentIntentObject,
  });
  await postWebhookEvent({
    stripe,
    webhookSecret,
    apiBase,
    eventType: "payment_intent.payment_failed",
    object: paymentIntentObject,
  });
  await postWebhookEvent({
    stripe,
    webhookSecret,
    apiBase,
    eventType: "payment_intent.succeeded",
    object: paymentIntentObject,
  });

  const checks = await pool.query(
    `
    with rows as (
      select *
      from event_bookings
      where stripe_payment_intent_id = $1
    )
    select
      (select count(*)::int from rows) as total_rows,
      (select count(*)::int from (
        select event_id, count(*) c
        from rows
        group by event_id
        having count(*) > 1
      ) t) as duplicate_event_rows,
      (select count(*)::int from rows where status = 'confirmed') as confirmed_rows,
      (select count(*)::int from rows where status = 'cancelled' and refund_status = 'credit') as credit_cancel_rows
  `,
    [candidate.payment_intent_id],
  );

  const summary = checks.rows?.[0] || {};
  console.log("[webhook-replay] summary", summary);

  if (Number(summary.duplicate_event_rows || 0) > 0) {
    throw new Error("[webhook-replay] duplicate event rows detected");
  }
  if (
    Number(summary.confirmed_rows || 0) > 0 &&
    Number(summary.credit_cancel_rows || 0) > 0
  ) {
    throw new Error("[webhook-replay] mixed confirmed and credit-cancel rows for same intent");
  }

  console.log("[webhook-replay] PASS");
}

run()
  .catch((error: any) => {
    console.error(error?.stack || error?.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
