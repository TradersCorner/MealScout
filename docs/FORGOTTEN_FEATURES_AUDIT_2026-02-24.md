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

## Incident Checklist Command Validation (2026-02-26)

- Added one-command runner: `npm run checklist:incidents`.
- Local execution result (expected in current env):
   - `validate:config` => PASS
   - `test:incidents` => FAIL (missing `BREVO_API_KEY` / `INCIDENT_EMAIL_RECIPIENTS` and other notification env)
- Outcome: checklist command behavior is validated and ready for staging handoff execution.

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

## RBAC Script Hardening (2026-02-26)

- Updated `scripts/testStaffRBAC.ts` to use environment-based cookies/base URL instead of requiring source edits.
- Added npm entrypoint: `npm run test:staff-rbac`.
- Added copy-ready env template: `docs/RBAC_TEST_ENV.example`.
- Required env for runtime RBAC validation:
   - `RBAC_COOKIE_CUSTOMER`
   - `RBAC_COOKIE_STAFF`
   - `RBAC_COOKIE_ADMIN`
   - `RBAC_BASE_URL` (optional; defaults to `http://localhost:5200`)
- Local execution now fails fast with explicit setup instructions when cookies are not provided.

## Unified Security Gate (2026-02-26)

- Added combined runner: `npm run checklist:security`.
- It executes, in order:
   - `npm run checklist:incidents`
   - `npm run test:staff-rbac`
- Purpose: one-command staging gate for notification channels + RBAC verification before sign-off.
- Render/server mode: set `CHECKLIST_SKIP_RBAC=true` to run incident validation only when RBAC session cookies are not available in that environment.
- Readiness summary refined so `RBAC_BASE_URL` is treated as optional (default applies) and no longer counted as a required missing env.
- Local command validation completed:
   - Incident checklist => FAIL (missing incident env)
   - RBAC check => FAIL (missing RBAC cookies/env)
   - Combined gate exits non-zero as designed until staging secrets/sessions are supplied.

## Staging Tri-Channel Validation Runbook (Ready)

1. **Set required incident env in staging**
   - Copy baseline keys from `docs/INCIDENT_STAGING_ENV.example` and inject real values via staging secret manager.
   - `BREVO_API_KEY`
   - `INCIDENT_EMAIL_RECIPIENTS`
   - `INCIDENT_SMS_RECIPIENTS`
   - `SLACK_WEBHOOK_URL`
   - `INCIDENT_SIGNATURE_SECRET`

2. **Run config and incident harness in staging shell**
   - Optional full gate: `npm run checklist:security`
   - `npm run checklist:incidents` (recommended: runs both checks and prints pass/fail summary)
   - `npm run validate:config`
   - `npm run test:incidents`

3. **Expected pass criteria**
   - `validate:config` shows email/slack/sms configured and no default incident secret warning.
   - `test:incidents` completes without fail-fast errors.
   - Critical incident test emits notifications on all three channels:
     - Email received by `INCIDENT_EMAIL_RECIPIENTS`
     - Slack message appears on incident webhook channel
     - SMS received by `INCIDENT_SMS_RECIPIENTS`

4. **Evidence to capture for closure**
   - Command output snippets for both scripts
   - One timestamped sample per channel (email/slack/sms)
   - Incident ID from test output tied to channel artifacts
