# Production Rollout Checklist

Use this checklist for each production release.

## 1. Pre-deploy (local)

1. Ensure branch is clean:
   - `git status --short --branch`
2. Run checks:
   - `npm run check`
   - `npm run test:supplier-payments`
3. Ensure migrations are committed and ordered.

## 2. Deploy to Render

1. Deploy latest `main`.
2. Ensure env vars are set:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `STRIPE_SECRET_KEY`
   - `VITE_STRIPE_PUBLIC_KEY`
   - `HEALTH_METRICS_TOKEN`
   - `SENTRY_DSN`
3. Ensure bypass flags are disabled in production:
   - `MEALSCOUT_BYPASS_STRIPE=false`
   - `MEALSCOUT_TEST_MODE=false`

## 3. Run DB migrations in production

Run each once:

1. `npm run -s migrate:sql 058_idempotency_keys.sql`
2. `npm run -s migrate:sql 059_rate_limit_counters.sql`

## 4. Health + readiness verification

1. Liveness:
   - `GET /health`
2. Readiness:
   - `GET /health/ready`
3. Metrics:
   - `GET /health/metrics` with header `X-Health-Token: <HEALTH_METRICS_TOKEN>`

## 5. Payment flow smoke test

1. Create unpaid supplier order with `paymentMethod="stripe"`.
2. Call pay-intent endpoint with `Idempotency-Key`.
3. Retry same request with same key:
   - Expect cached/replayed response.
4. Retry with same key + different payload:
   - Expect 409 mismatch error.
5. Verify webhook marks order as paid after successful Stripe confirmation.

## 6. Rate limit verification

1. Burst pay-intent requests for one user.
2. Confirm `429` appears after threshold and `Retry-After` header is present.
3. Confirm behavior is consistent across app instances.

## 7. Load test

Run:

- `npm run load:supplier-payments`

Recommended target:

- at least 5x expected peak request rate for 10+ minutes.

## 8. Observability and alerting

Alert on:

- API p95 latency > 300ms sustained
- API 5xx > 0.5% sustained
- readiness check failures
- webhook processing lag spikes

