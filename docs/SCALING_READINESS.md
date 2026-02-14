# Scaling Readiness (1k -> 100k users)

This checklist is the minimum baseline for stable growth under burst traffic.

## 1. SLOs (set targets before scaling)

- API latency: p95 < 300ms, p99 < 800ms
- API server error rate (5xx): < 0.5%
- Checkout success rate: > 99.5%
- Stripe webhook processing delay: < 60s p95

## 2. Runtime and Infra (Render)

- Enable horizontal scaling for web service (at least 2 instances in production).
- Ensure sticky sessions are configured or session storage is shared.
- Use a production Postgres tier sized for expected peak QPS.
- Add PgBouncer or equivalent connection pooling.
- Configure Redis for cross-instance rate limiting and queue workloads.
- Set health checks:
  - Liveness: `GET /health`
  - Readiness: `GET /health/ready`

## 3. Security and abuse controls

- Keep CSRF and CORS allowlist strict in production.
- Keep strict rate limits on auth and payment endpoints.
- Add WAF/bot controls in front of public endpoints if traffic grows materially.

## 4. Observability

- Enable Sentry in production (`SENTRY_DSN`).
- Collect app logs with request IDs (`X-Request-Id`).
- Poll `/health/metrics` with `X-Health-Token` and chart:
  - API p95/p99 latency
  - API 4xx/5xx rates
  - request volume
- Alert on SLO breach windows (5m + 30m).

## 5. Payments and webhook safety

- Keep all payment mutations idempotent.
- Ensure webhook retry/replay is safe (idempotent DB writes).
- Monitor Stripe webhook failure count and latency.

## 6. Load testing cadence

- Run load tests before each major release:
  - browse suppliers
  - create supplier orders
  - create pay-intent (ACH and card)
  - webhook success/failure processing
- Test at 5x expected peak RPS for at least 10 minutes.

## 7. Operational readiness

- On-call owner and escalation path defined.
- Incident runbook for:
  - database saturation
  - Stripe outage
  - webhook backlog
  - elevated 5xx rates

## 8. Release strategy

- Use feature flags for payment flow changes.
- Roll out via canary (small traffic slice first).
- Have a rollback procedure that is tested and documented.

