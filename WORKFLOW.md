# MealScout Workflow (Combined Guide)

This guide combines the automation plan, workflow standards, CI expectations, and maintenance priorities into a single source of truth.

## Local setup
1. Install dependencies:
   - `npm ci`
   - `npm --prefix client ci`
   - If your environment blocks optional packages, use `npm ci --omit=optional`.
2. Configure environment:
   - Copy `.env.example` to `.env` if available (or use your hosting provider’s secrets).
3. Run the app:
   - Client + dev server: `npm run dev`
   - API server only: `npm run dev:server`

## Build & run (production)
1. Build the client:
   - `npm run build:client`
2. Build the server:
   - `npm run build:server`
3. Start the server:
   - `npm run start`

## Validation & testing
Quick checks (fast, safe to run before a deploy):
- `npm run ci:quick` (server typecheck + server build)

Type checking:
- `npm run check`
- `npm run check:client` (requires client dependencies)

Full test suite (slower, includes stress tests):
- `npm run test:all`

End-to-end flows (Playwright):
- `npm run test:flows:e2e`

## Database utilities
- Push schema: `npm run db:push`
- Run SQL migration: `npm run migrate:sql`

## Monitoring & diagnostics
- Performance monitor: `npm run monitor`
- Incident tests: `npm run test:incidents`

## Deployment (high-level)
1. Run quick checks: `npm run ci:quick`
2. Build server: `npm run build:server`
3. Build client: `npm run build:client`
4. Deploy artifacts to your hosting provider.

## Automation notes
- CI should run `npm run ci:quick` on every PR.
- The full test suite can be scheduled nightly or on demand.

## Automation plan (phased)
Use this phased plan to automate safely while keeping accuracy high.

### Phase 1: Stabilize & document
- Keep this document updated as the workflow source of truth.
- Ensure `README.md` points to this guide.
- Run quick checks before merges: `npm run ci:quick`.

### Phase 2: Automated coding assistance
- Use the task template at `.github/ISSUE_TEMPLATE/automation_task.md` (goal, constraints, files, expected behavior).
- Require a summary and diff review for every automated change.

### Phase 3: Automated testing & bug catching
- Run the full test suite on a schedule (`npm run test:all`).
- Run readiness tests before launch using `RUN_TESTS_NOW.md`.

### Phase 4: Automated deploys & monitoring
- Deploy only after `npm run ci:quick` and builds pass.
- Configure error monitoring and uptime alerts.

### Phase 5: Bug-fix autopilot (human approval)
- Auto-triage issues, but require approval for code changes.
- Limit automatic fixes to low-risk UI/text or validation changes.

## Maintenance priorities (combine all versions)
1. **Run readiness tests**: follow `RUN_TESTS_NOW.md` end-to-end before release.
2. **Cleanup plan**: execute the phased cleanup in `CLEANUP_MAP.md`.
3. **Secrets hygiene**: scrub any real credentials and rotate if used (see `DEPLOY.md`).
4. **Onboarding clarity**: keep README quick start aligned with this guide.
