# Deferred Features

These modules are intentionally retained but not active. Do not remove without
updating `CLEANUP_MAP.md`.

- Affiliate system (`server/affiliateService.ts`, `server/affiliateRoutes.ts`, `shared/affiliateCopy.ts`)
  - Planned for TradeScout attribution/payout workflows.
- Empty county services (`server/emptyCountyService.ts`, `server/emptyCountyPhase6Service.ts`)
  - Kept for future content bootstrapping experiments.
- Facebook/Replit auth stubs (`server/facebookAuth.ts`, `server/replitAuth.ts`)
  - Disabled integrations; kept for potential partner requests.
- Featured video cron (`server/featuredVideoCron.ts`)
  - Deferred until video stories relaunch.
