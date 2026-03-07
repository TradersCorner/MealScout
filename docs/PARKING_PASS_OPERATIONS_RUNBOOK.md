# Parking Pass Operations Runbook

## 1) Pre-deploy checks

Run locally or in CI:

- `npm run -s check`
- `npm run -s test:parking-pass-datekeys`
- `npm run -s audit:parking-pass-webhooks`
- `npm run -s audit:demand-funnel`
- `npm run -s check:parking-pass-readiness`

Optional staging checks (requires env/cookies):

- `npm run -s test:parking-pass-concurrency`
- `npm run -s test:parking-pass-webhook-replay`

## 2) DB migrations

Apply in order:

- `080_location_demand_threshold_claims.sql`
- `081_event_series_parking_pass_unique_host.sql`
- `082_blackout_date_key_unique.sql`
- `083_event_bookings_event_intent_unique.sql`

## 3) Post-deploy validation

- `GET /api/parking-pass` returns 200 and non-error payload.
- `GET /api/parking-pass/host-ids` returns 200 and host list.
- `GET /api/parking-pass/host-status?date=YYYY-MM-DD` returns 200.
- One test booking lifecycle completes: create -> pending -> confirm/cancel.

## 4) Ongoing health monitoring

Server-side scheduled marketplace health audit runs by default.

Environment knobs:

- `MARKETPLACE_HEALTH_AUDIT_ENABLED=true|false`
- `MARKETPLACE_HEALTH_AUDIT_INTERVAL_MINUTES=60`

Manual audits:

- `npm run -s audit:parking-pass-webhooks`
- `npm run -s audit:demand-funnel`

## 5) Failure triage

If bookings fail:

1. Check Stripe config and webhook delivery.
2. Run `audit:parking-pass-webhooks` for stale pending / inconsistent terminal states.
3. Verify rate limiting and idempotency responses from booking route.
4. Validate host listing quality flags and payment readiness.

If marketplace feels empty:

1. Run `audit:demand-funnel`.
2. Check `threshold_met` requests stuck >72h.
3. Prompt hosts to publish slots where threshold is met.
