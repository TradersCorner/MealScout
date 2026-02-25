# Forgotten Features / Logic Audit (2026-02-24)

## Confirmed Gaps (real code-level misses)

1. **Featured video cron endpoint exists but is not registered**
   - Implemented in: `server/featuredVideoCron.ts` (`registerFeaturedVideoCronJobs`, `POST /api/cron/cycle-featured-videos`)
   - Not wired in route bootstrap: `server/routes.ts` (cron routes are registered, but featured video cron is never imported/registered)
   - Impact: featured video cycling logic can never run in production.

2. **Incident SMS notifications are declared but intentionally unimplemented**
   - `server/incidentManager.ts` logs warning: Twilio/SMS path requested but no SMS sent.
   - Impact: SEV1 incidents do not send SMS even when SMS config is enabled.

3. **Legacy/deferred auth module still present but inactive**
   - `server/facebookAuth.ts` file exists.
   - Runtime auth moved to `server/unifiedAuth.ts`; no active imports of `facebookAuth.ts` found.
   - Impact: potential confusion/drift (not a runtime bug unless someone expects it active).

## Confirmed Implemented (docs are stale)

1. **Weekly digest trigger is implemented**
   - Scheduled in `server/routes.ts` (weekly cron call to `DigestService.getInstance().sendWeeklyDigests()`)
   - Service exists in `server/digestService.ts`
   - Telemetry coverage endpoint exists in `server/telemetryRoutes.ts` (`/api/admin/telemetry/digest-coverage`)
   - Conclusion: docs claiming weekly digest trigger is unimplemented are outdated.

## Likely Missing Trigger Logic (not found in current scan)

From phase audit docs, these trigger classes did not show clear server-side trigger handlers in current quick scan:

- Nearby deals notification trigger
- Host capacity warning trigger
- Coordinator update trigger
- Parking pass reminder trigger (notification-specific, distinct from existing reminder campaign endpoints)

## Recommended Minimal Next Actions

1. Wire featured video cron registration in `server/routes.ts`.
2. Update stale docs that still mark weekly digest trigger as unimplemented.
3. Decide one of:
   - Implement Twilio SMS incident path, or
   - Explicitly disable/remove SMS config knobs to avoid false expectation.
