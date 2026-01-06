# MealScout Routes Map (Canonical)

## Orchestrator
- server/routes.ts
  - Creates the Express app and HTTP server
  - Validates env, wires core middleware, Socket.IO, cron
  - Registers all route modules and inline endpoints
  - Contains no domain business logic for the refactored areas

## Auth & Session
- server/unifiedAuth.ts
  - Middleware: `setupUnifiedAuth`, `isAuthenticated`, `isRestaurantOwner`, `isRestaurantOwnerOrAdmin`, `isAdmin`, `verifyResourceOwnership`
  - All `/api/auth/*` endpoints are defined in server/routes.ts and use these guards
  - Auth model: session cookies (no public write without a session)

## Host & Open Calls
- server/routes/hostRoutes.ts
  - Paths:
    - `POST /api/hosts`
    - `GET /api/hosts/me`
    - `POST /api/hosts/events`
    - `GET /api/hosts/events`
    - `PATCH /api/hosts/events/:eventId`
    - `PATCH /api/hosts/interests/:interestId/status`
    - `GET /api/hosts/events/:eventId/interests`
  - Auth: `isAuthenticated` + host ownership checks via services/hostOwnership

- server/routes/openCallSeriesRoutes.ts
  - Paths (event series / Open Calls):
    - `POST /api/hosts/event-series`
    - `POST /api/hosts/event-series/:seriesId/publish`
    - `GET /api/hosts/event-series`
    - `GET /api/hosts/event-series/:seriesId/occurrences`
    - `POST /api/hosts/event-series/:seriesId/cancel`
  - Auth: `isAuthenticated` + host ownership checks (host must own the series)

## Truck Discovery & Interest
- server/routes/eventRoutes.ts
  - Paths:
    - `GET /api/events` (upcoming events for discovery)
    - `POST /api/events/:eventId/interests` (truck/restaurant expresses interest)
  - Auth:
    - `GET /api/events`: `isAuthenticated`
    - `POST /api/events/:eventId/interests`: `isRestaurantOwner` + ownership check on the restaurant

## Admin
- server/routes/adminManagementRoutes.ts
  - Paths:
    - `GET /api/auth/admin/verify`
    - `GET /api/admin/stats`
    - `POST /api/admin/subscriptions/sync`
    - `GET /api/admin/restaurants/pending`
    - `POST /api/admin/restaurants/:id/approve`
    - `DELETE /api/admin/restaurants/:id`
    - `GET /api/admin/users`
    - `PATCH /api/admin/users/:id/status`
    - `GET /api/admin/users/:userId/addresses`
    - `GET /api/admin/deals`
    - `GET /api/admin/deals/:dealId/stats`
    - `DELETE /api/admin/deals/:dealId`
    - `POST /api/admin/deals/:dealId/clone`
    - `PATCH /api/admin/deals/:dealId/status`
    - `PATCH /api/admin/deals/:dealId/extend`
    - `GET /api/admin/verifications`
    - `POST /api/admin/verifications/:id/approve`
    - `POST /api/admin/verifications/:id/reject`
    - `GET /api/admin/oauth/status`
  - Auth:
    - `GET /api/auth/admin/verify`: `isAuthenticated`, then `userType === 'admin'`
    - All `/api/admin/*`: `isAuthenticated` + `isAdmin`

- server/telemetryRoutes.ts
  - Mounted in server/routes.ts as: `app.use('/api/admin/telemetry', telemetryRoutes)`
  - Paths:
    - `GET /api/admin/telemetry/velocity`
    - `GET /api/admin/telemetry/fill-rates`
    - `GET /api/admin/telemetry/decision-time`
    - `GET /api/admin/telemetry/digest-coverage`
  - Auth: `isAdmin` (read-only)

- server/evidenceExportRoutes.ts
  - Mounted in server/routes.ts as: `app.use('/api/admin', evidenceExportRoutes)`
  - Paths:
    - `GET /api/admin/export-evidence/:videoId`
  - Auth: `isAdmin` (single-item, read-only evidence export)

- server/adminRoutes.ts
  - Mounted in server/routes.ts as: `app.use('/api/admin', adminRoutes)`
  - Paths (selected):
    - `/api/admin/audit-logs`
    - `/api/admin/support-tickets*`
    - `/api/admin/moderation-events*`
    - `/api/admin/health`
    - `/api/admin/grant-lifetime-access`
    - `/api/admin/lifetime-restaurants`
    - `/api/admin/revoke-lifetime-access/:restaurantId`
    - `/api/admin/reported-videos`
    - `/api/admin/review-report/:reportId`
  - Auth: `isAdmin`

## Other Mounted Route Modules
- server/incidentRoutes.ts
  - Mounted: `app.use('/api/incidents', incidentRoutes)`
  - Admin-only incident management APIs (guarded inside the router)

- server/affiliateRoutes.ts
  - Mounted: `app.use('/api/affiliate', affiliateRoutes)`

- server/payoutRoutes.ts
  - Mounted via default export function: payout preferences and payout-related APIs

- server/emptyCountyRoutes.ts
  - Mounted via default export function: empty-county experience routes (Phase 6)

- server/shareRoutes.ts
  - Mounted via default export function: share link routes (Phase 7)

- server/userRoutes.ts
  - Mounted: `app.use('/api/users', userRoutes)`

- server/redemptionRoutes.ts
  - Mounted: `app.use('/api/restaurants', redemptionRoutes)`

- server/storiesRoutes.ts
  - Mounted via default export function: story feed and story-related APIs

## Inline Endpoints (Still in server/routes.ts)
These are intentionally kept inline in the orchestrator for now:

- Bug reports:
  - `POST /api/bug-report`
- Deal feedback:
  - `POST /api/deals/:dealId/feedback`
  - `GET /api/deals/:dealId/feedback`
  - `GET /api/deals/:dealId/feedback/stats`
- Health / monitoring:
  - `HEAD /api`
  - `GET /api/health`
- Uploads:
  - `POST /api/upload/restaurant-logo`
  - `POST /api/upload/restaurant-cover`
  - `POST /api/upload/deal-image`
  - `POST /api/upload/user-profile`
  - `DELETE /api/upload/:imageId`
- Awards & ranking:
  - `GET /api/awards/*`
  - `GET /api/restaurants/:restaurantId/ranking-stats`

## Summary Table (Key Modules)

| Module                                   | Mount / Paths Prefix           | Auth                              | Notes                                |
|------------------------------------------|--------------------------------|-----------------------------------|--------------------------------------|
| server/routes.ts                         | (orchestrator)                 | n/a                               | Wires middleware and route modules   |
| server/routes/hostRoutes.ts              | /api/hosts*                    | isAuthenticated + host checks     | Host profiles and host events        |
| server/routes/openCallSeriesRoutes.ts    | /api/hosts/event-series*       | isAuthenticated + host checks     | Open Calls series lifecycle          |
| server/routes/eventRoutes.ts             | /api/events*                   | isAuthenticated / isRestaurantOwner | Discovery + truck interest          |
| server/routes/adminManagementRoutes.ts   | /api/auth/admin, /api/admin*   | isAuthenticated + isAdmin         | Classic admin management             |
| server/telemetryRoutes.ts                | /api/admin/telemetry*          | isAdmin                           | Read-only telemetry                  |
| server/evidenceExportRoutes.ts           | /api/admin/export-evidence*    | isAdmin                           | Evidence PDF export                  |
| server/adminRoutes.ts                    | /api/admin/*                   | isAdmin                           | Control center, moderation, lifetime |

## Adding a New Route Module (Required Process)

1. Create a new module under `server/routes/`  
  - Export `registerXRoutes(app: Express)`
  - Do not register routes at import time.

2. Move handlers verbatim  
  - Preserve paths, middleware, status codes, and response messages.  
  - Do not change behavior during extraction.

3. Wire the module in `server/routes.ts`  
  - Import `registerXRoutes`  
  - Call it in the appropriate section, keeping existing ordering.

4. Verify no duplicate registrations  
  - Search for the route prefix across the repo (e.g. `/api/hosts`, `/api/events`).

5. Run the full gate before commit:

  ```bash
  npm run check
  npm run build
  npm run build:server
  npm run test:flows:with-server
  ```

No new route module is considered complete unless all of these gates pass.
