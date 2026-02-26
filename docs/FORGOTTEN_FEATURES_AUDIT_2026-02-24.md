# Forgotten Features / Logic Audit (2026-02-24)

## Confirmed Gaps (real code-level misses)

1. **Featured video cron endpoint exists but is not registered** ✅ Fixed
   - Implemented in: `server/featuredVideoCron.ts` (`registerFeaturedVideoCronJobs`, `POST /api/cron/cycle-featured-videos`)
   - Not wired in route bootstrap: `server/routes.ts` (cron routes are registered, but featured video cron is never imported/registered)
   - Impact: featured video cycling logic can never run in production.
   - Resolution: Registered in `server/routes.ts` (commit `35ac5fd`).

2. **Incident SMS notifications are declared but intentionally unimplemented** ✅ Fixed
   - `server/incidentManager.ts` now sends SMS for critical incidents via existing Brevo `smsService`.
   - `scripts/validateConfig.ts` now validates SMS readiness using `BREVO_API_KEY` (aligned with runtime service).
   - Impact resolved: SEV1 incidents can now send SMS when `INCIDENT_SMS_RECIPIENTS` and Brevo config are present.

3. **Legacy/deferred auth module still present but inactive** ✅ Decision locked
   - `server/facebookAuth.ts` file exists.
   - Runtime auth moved to `server/unifiedAuth.ts`; no active imports of `facebookAuth.ts` found.
   - Impact: potential confusion/drift (not a runtime bug unless someone expects it active).
   - Resolution: kept current Facebook auth intact in `unifiedAuth`, and annotated `facebookAuth.ts` as legacy reference-only.

## Confirmed Implemented (docs are stale)

1. **Weekly digest trigger is implemented**
   - Scheduled in `server/routes.ts` (weekly cron call to `DigestService.getInstance().sendWeeklyDigests()`)
   - Service exists in `server/digestService.ts`
   - Telemetry coverage endpoint exists in `server/telemetryRoutes.ts` (`/api/admin/telemetry/digest-coverage`)
   - Conclusion: docs claiming weekly digest trigger is unimplemented are outdated.

## Likely Missing Trigger Logic (not found in current scan)

From phase audit docs, these trigger classes did not show clear server-side trigger handlers in current quick scan:

- Nearby deals notification trigger ✅ Minimal implementation added (deal creation sends nearby email alerts to opted-in users based on default-address radius)
- Host capacity warning trigger ✅ Minimal implementation added (booking confirmation now emails host when occupancy crosses warning/full thresholds)
- Coordinator update trigger ✅ Minimal implementation added (series cancellation now emails coordinator when email/topic prefs allow)
- Parking pass reminder trigger (notification-specific, distinct from existing reminder campaign endpoints) ✅ Minimal implementation added (email reminders now respect user notifications channel opt-in)

## Recommended Minimal Next Actions

1. Add/confirm `INCIDENT_SMS_RECIPIENTS` in production env so critical incident SMS fanout is active.
2. Run one end-to-end SEV1 incident test in staging and verify email + Slack + SMS delivery.

## Incident Test Verification (2026-02-25)

- Ran `npm run test:incidents` in local workspace.
- Result: expected fail-fast due to missing required incident env (`BREVO_API_KEY`, `INCIDENT_EMAIL_RECIPIENTS`).
- Additional optional channels also not configured locally (`SLACK_WEBHOOK_URL`, `INCIDENT_SMS_RECIPIENTS`), so full tri-channel validation is currently blocked in local.
- Next execution target: staging/prod-like env with the following set:
   - `BREVO_API_KEY`
   - `INCIDENT_EMAIL_RECIPIENTS`
   - `INCIDENT_SMS_RECIPIENTS`
   - `SLACK_WEBHOOK_URL`
   - `INCIDENT_SIGNATURE_SECRET`

## Config Validator Snapshot (2026-02-25)

- Ran `npm run validate:config` in local workspace.
- Critical baseline is present (DB + session secret), but incident signing is still on default secret.
- Notification channels are all unconfigured locally (email/slack/sms), matching the incident test fail-fast output.
- Local run is suitable for baseline app testing, but not for full SOC-lite notification verification until incident env is populated.

## Data Retention Safeguard Added

- `storage.deleteUser` now always performs soft-delete/anonymization (disable account + scrub PII) and no longer hard-deletes from `users`.
- This prevents accidental loss of non-deleted user records while still honoring deletion requests.

## Pricing Role Access Verification (2026-02-25)

- Admin pricing edit APIs already accept both admin and staff roles (`isStaffOrAdmin`) for:
  - `PATCH /api/admin/parking-pass/:id`
  - `PATCH /api/admin/hosts/:id`
- Staff dashboard host location manager edit gate has been aligned to permit `staff` and `super_admin` alongside `admin`.
- Result: manual pricing/location edits are now available to both admin and staff in dashboard workflows.

## Static Role Smoke Check (2026-02-25)

- Verified `HostLocationManager` in staff UI is wired with editable mode via `canEditHostLocations` for `staff`/`admin`/`super_admin`.
- Verified admin pricing update endpoints remain staff-accessible and are not short-circuited by `denyStaffEdits`:
   - `PATCH /api/admin/parking-pass/:id`
   - `PATCH /api/admin/hosts/:id`
- Verified host-route role helper still recognizes `staff`/`admin`/`super_admin` in role checks used by host management flows.
- Remaining validation gap is runtime-only (staging execution with full incident notification env).
