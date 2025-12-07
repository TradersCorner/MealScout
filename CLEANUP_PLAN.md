# Checkpoint Cleanup Plan

## Files to Remove

### Category 1: Test Runners & Guides (Not Used in Core App)
These are development/testing scripts that are not part of the runtime application:

**Root Level:**
- `PHASE_R1_IMPLEMENTATION.md` - Implementation docs (already applied to code)
- `PHASE_R1_MANUAL_CHECKLIST.md` - Testing checklist
- `PHASE_R1_READY_TO_TEST.md` - Testing prep doc
- `PHASE_R1_SETUP.ps1` - Setup script (one-time use)
- `PHASE_R1_SUMMARY.md` - Phase summary doc
- `PHASE_R1_TESTING_INDEX.md` - Testing index
- `PHASE_R1_TESTING_MASTER.md` - Testing master doc
- `PHASE_R1_TESTING_START.md` - Testing start guide
- `PHASE_R1_TEST_FRAMEWORK.ts` - Test framework (not integrated)
- `PHASE_R1_TEST_REPORT_TEMPLATE.md` - Report template
- `PHASE_R1_TEST_RUNNER.ps1` - PowerShell test runner
- `PHASE_R1_TEST_RUNNER.sh` - Bash test runner
- `PHASE_R1_TEST_SCENARIO.md` - Test scenario doc
- `RUN_TESTS.ps1` - Test execution script
- `SIMPLE_TEST_GUIDE.md` - Manual test guide
- `START_SERVER.ps1` - Redundant start script (use npm scripts instead)
- `start.bat` - Redundant batch file (use npm scripts)
- `start-dev.bat` - Redundant batch file (use npm scripts)

**Rationale:** These are testing/documentation artifacts from Phase R1 development. User confirmed app works correctly. These files add clutter and potential confusion. The actual Phase R1 functionality (credit redemption) is implemented in the codebase.

---

### Category 2: Affiliate/Credit System Files (Incomplete Features)

**Decision:** KEEP but MARK AS INCOMPLETE

These files implement Phase R1-R7 of an affiliate/credit redemption system. The user hasn't requested this functionality yet, but the files were part of git changes. Rather than delete working code, we'll document their status.

**Files to Document (Not Remove):**

**Server:**
- `server/affiliateRoutes.ts` - Affiliate link tracking API
- `server/affiliateService.ts` - Affiliate link generation
- `server/creditService.ts` - User credit balance management
- `server/emptyCountyPhase6Service.ts` - Empty county experience (duplicate?)
- `server/emptyCountyRoutes.ts` - Empty county API
- `server/emptyCountyService.ts` - Empty county logic (possible duplicate)
- `server/payoutRoutes.ts` - Payout preferences API
- `server/payoutService.ts` - Cash vs credit payout logic
- `server/redemptionRoutes.ts` - Credit redemption at restaurants (Phase R1)
- `server/redemptionService.ts` - Credit redemption logic
- `server/referralService.ts` - Referral tracking
- `server/shareMiddleware.ts` - Share link affiliate param appending
- `server/shareRoutes.ts` - Share link generation API
- `server/shareService.ts` - Share templates

**Client:**
- `client/src/components/RestaurantCreditRedemptionForm.tsx` - Form for restaurants to accept credits
- `client/src/pages/AffiliateEarnings.tsx` - Affiliate dashboard
- `client/src/pages/EmptyCountyExperience.tsx` - Empty county UI

**Shared:**
- `shared/affiliateCopy.ts` - Marketing copy for affiliate system

**Status:** These files implement a complete 7-phase affiliate/credit system. They are NOT connected to any routes in the current working app. They exist in git history but are not causing conflicts.

**Action:** Create a `FEATURES_INCOMPLETE.md` document to list these.

---

### Category 3: Conflicting/Duplicate Files

**Check for:**
- Multiple `emptyCountyService.ts` files (Phase6 vs regular)
- Duplicate startup scripts
- Unused import statements in App.tsx

---

## Cleanup Steps

1. Remove test/documentation files (Category 1)
2. Document incomplete features (Category 2)
3. Verify no import errors after cleanup
4. Test startup scripts
5. Validate routing still works

---

## Keep These Files (Working & Needed)

- `package.json` - Dependencies
- `vite.config.ts` - Vite proxy config (port 5001)
- `tsconfig.json` - TypeScript config
- `tailwind.config.ts` - Tailwind config
- `client/src/App.tsx` - Router
- `client/src/pages/home.tsx` - Main page (with CTA + Community Builder)
- `client/src/pages/landing.tsx` - Re-exports home
- `server/index.ts` - Express server entry
- `server/db.ts` - Database connection
- `.env` - Environment variables
- All route handlers currently in use (restaurants, deals, users, auth, etc.)

---

## Post-Cleanup Validation

1. Start backend: `npm run dev:server` (port 5001)
2. Start frontend: `npm run dev` (Vite auto-picks port)
3. Visit http://localhost:<vite-port>
4. Verify:
   - Home page loads
   - CTA shows when no vendors
   - Community Builder at bottom
   - No console errors

---

**Next:** Execute cleanup, then mark todo #2 complete and move to verification step.
