# MealScout Master Plan

## Purpose
Single source of truth for roadmap, operations, deployment, testing, deferred features, and unfinished ideas.

## North Star
- Keep the platform production-stable and fast on mobile.
- Make discovery, map, parking pass, events, and account flows consistent.
- Enforce trust, verification, and role-based actions.
- Grow monetization without pay-to-play ranking.

## Current Reality (as of now)
- Core app is live with auth, map, parking pass, events, deals, admin, Stripe support.
- Several implementation docs marked "complete" exist, but execution and UX parity remain uneven.
- Deferred modules still exist in codebase and need explicit keep/remove decisions.

## Execution Plan

### Phase 1: Production Reliability (Now)
1. Lock production env correctness.
- Validate required env vars in production (`DATABASE_URL`, `SESSION_SECRET`, `CLIENT_ORIGIN`, `PUBLIC_BASE_URL`, auth and payments keys as used).
- Confirm cookie/session behavior across domains and subdomains.
- Confirm proxy + secure cookie behavior in production logs.

2. Stabilize startup and request latency.
- Keep initial route load lightweight.
- Ensure auth/user bootstrap does not block first paint.
- Track and resolve repeated 5xx or gateway failures first.

3. Deployment controls.
- Keep one canonical frontend deployment path.
- Keep one canonical API origin for frontend.
- Maintain rollback procedure for each release.

### Phase 2: UX Consistency + Access Rules (Now)
1. Match UI system across all pages.
- Apply current style tokens/components to login/signup/create account and any remaining legacy pages.
- Fix blurry/low-contrast nav and button text rendering.

2. Enforce role visibility rules.
- Hide `Parking Pass` nav for logged-out users.
- Show event posting on Events surface for event coordinators.
- Remove or de-emphasize Host page if redundant with Events and Parking Pass workflows.

3. Schedule and map UX cleanup.
- Improve parking schedule readability and day-state clarity.
- Ensure user map logic matches parking pass map logic (grouping, pin selection, dedupe).

### Phase 3: Data Accuracy + Trust (Now)
1. Map and geocode integrity.
- Ensure all host addresses (including secondary addresses) are considered.
- Geocode queue/retry with backoff and cache.
- Ensure verified/active locations render as pins when coordinates exist or can be derived.

2. Admin stats integrity.
- Resolve count mismatches (users/restaurants/role totals).
- Prevent double-counting in member summaries.
- Display complete role/member counts in admin dashboard.

3. Content and feed behavior.
- Ensure video/feed behavior is correct for guest vs auth users.
- Keep clear error states with actionable retry.

### Phase 4: Monetization + Payments (Near Term)
1. Stripe hardening.
- Confirm host onboarding status lifecycle and UI states.
- Confirm booking payment flow end-to-end for paid and free slots.
- Confirm locked pricing logic and plan messaging are consistent.

2. Billing and settlement confidence.
- Verify payment status transitions (`pending`, `confirmed`, `refunded`, etc.).
- Reconcile pending/queued/paid summaries and admin visibility.

### Phase 5: Events and Open Calls (Near Term)
1. Complete Event Open Calls productization.
- Finalize `event_series` model decisions.
- Publish/occurrence generation and per-occurrence overrides.
- Keep capacity guard semantics per occurrence.

2. Series operations.
- Ensure full cancellation and truck notification behavior remain reliable.
- Add operator metrics for series fill rate, acceptance throughput, cancellation impact.

### Phase 6: Growth Surfaces (Near-Mid Term)
1. Video activation before semantics expansion.
- Run activation checks (upload reliability, engagement, content quality).
- Defer recommendation semantics until volume/quality supports it.

2. SEO and location growth.
- Execute SEO expansion tasks from current canonical strategy.
- Improve empty-market bootstrap flows where useful.

3. Notifications rollout.
- Phase 1 triggers: nearby deals, truck updates, events, digest.
- Phase 2 triggers: parking pass reminders, host capacity warnings, coordinator updates.
- Respect opt-in, quiet hours, dedupe windows.

### Phase 7: Mobile App Track (Mid Term)
1. Wrapper strategy.
- Use Capacitor fast-track unless full migration is justified.

2. Mobile readiness.
- Validate auth/session behavior, deep links, geolocation permissions, push support.

3. Store readiness.
- Complete listing assets, privacy forms, testflight/internal testing, submission.

## Deferred Feature Registry (Explicit)
Keep but inactive unless approved for activation:
- Affiliate attribution/payout stack (`server/affiliateService.ts`, `server/affiliateRoutes.ts`, `shared/affiliateCopy.ts`)
- Empty-county content bootstrapping services (`server/emptyCountyService.ts`, `server/emptyCountyPhase6Service.ts`)
- Facebook/Replit auth stubs (`server/facebookAuth.ts`, `server/replitAuth.ts`)
- Featured video cron (`server/featuredVideoCron.ts`)

## Acceptance Gates
- Release gate: no auth/session regressions, no map pin regressions, no payment regressions.
- Data gate: admin counts match canonical queries.
- UX gate: no legacy style pages on core flows.
- Ops gate: rollback confirmed before release.

## Operating Cadence
- Daily: production errors, auth health, map/geocode failures, payment failures.
- Weekly: conversion funnel, upload volume, booking throughput, role growth.
- Monthly: pricing outcomes, deferred-feature decisions, roadmap reprioritization.

## Immediate Next Actions
- [In Progress] Audit remaining legacy-styled pages and patch to current design system.
- [In Progress] Verify parking pass visibility and event posting role rules in production.
- [Pending] Run map pin parity audit: host address count vs rendered pin count.
- [Pending] Reconcile admin counts against DB queries and lock definitions.
- [Pending] Run full booking and Stripe onboarding smoke test in production mode.

## Execution Log
- Event coordinator routing updated so `/events` remains the primary coordinator surface for posting.
- Navigation rendering hardened for sharper mobile labels (reduced all-property transitions and enforced crisp text rendering rules).
- `restaurant-signup` high-visibility header/card styles moved to current tokenized theme system.
