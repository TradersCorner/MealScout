# Incomplete Features Inventory

**Status:** These files exist in the codebase but are NOT currently integrated into the active application.

---

## Phase R1-R7: Affiliate & Credit Redemption System

### Overview
A 7-phase system for affiliate tracking, credit management, and restaurant credit redemption. Fully implemented at the code level but not connected to the UI/router.

---

### Phase R1: Restaurant Credit Redemption

**Purpose:** Restaurants accept MealScout credits from users as payment.

**Files:**
- `server/redemptionRoutes.ts` - API endpoints for credit acceptance
- `server/redemptionService.ts` - Business logic for redemption
- `client/src/components/RestaurantCreditRedemptionForm.tsx` - UI form

**Routes (Not Active):**
- `POST /api/restaurants/:id/accept-credits` - Submit credit redemption
- `GET /api/restaurants/:id/redemptions` - View redemption history
- `GET /api/restaurants/:id/credit-summary` - Pending/settled summary
- `POST /api/redemptions/:id/dispute` - Flag for dispute (7-day window)

**Database Tables:**
- `restaurantCreditRedemptions` - Immutable redemption records
- `creditLedger` - User credit balance (SUM-based, not stored directly)

**Status:** Form exists, routes work, but not linked from restaurant dashboard.

---

### Phase 2-3: Referral & Commission Tracking

**Purpose:** Track affiliate referrals and calculate commissions.

**Files:**
- `server/referralService.ts` - Click tracking, signup attribution
- `server/affiliateService.ts` - Affiliate link generation
- `server/affiliateRoutes.ts` - API for affiliate dashboard

**Routes (Not Active):**
- `POST /api/affiliate/generate-link` - Create trackable link
- `GET /api/affiliate/click/:code` - Track click (redirects)
- `GET /api/affiliate/stats` - Dashboard stats
- `GET /api/affiliate/commissions` - Commission history
- `POST /api/affiliate/withdraw` - Cash out earnings

**Database Tables:**
- `referrals` - Referral records (clicked → signed_up → activated)
- `affiliateLinks` - Generated affiliate links
- `affiliateClicks` - Click tracking
- `affiliateCommissions` - Commission records
- `affiliateCommissionLedger` - Immutable commission entries
- `affiliateWallet` - User wallet balances

**Commission Logic:**
- 10% of restaurant subscription fees
- Recurring monthly
- First-click attribution

**Status:** Complete backend, no UI integration.

---

### Phase 4: Credit System

**Purpose:** Convert commissions to spendable credits (balance = SUM of ledger, never stored directly).

**Files:**
- `server/creditService.ts` - Credit balance calculation, redemption

**Key Functions:**
- `getUserCreditBalance(userId)` - SUM(creditLedger.amount WHERE userId = x)
- `addCredit(userId, amount, source)` - Add credit entry
- `redeemCredits(creditIds, redeemedFor)` - Mark as redeemed
- `createCreditFromCommission(affiliateUserId, commissionId, amount)` - Phase 3 → Phase 4 bridge

**Database Tables:**
- `creditLedger` - All credit transactions (immutable)

**Status:** Backend complete, integrated with Phase 3 commissions.

---

### Phase 5: Payout Preferences

**Purpose:** User chooses cash payout vs store credit.

**Files:**
- `server/payoutService.ts` - Payout method management
- `server/payoutRoutes.ts` - API for payout settings

**Routes (Not Active):**
- `GET /api/payout/preferences` - Get user's payout method
- `POST /api/payout/preferences` - Set cash vs credit
- `GET /api/payout/balance` - Available balance

**Database Tables:**
- `userPayoutPreferences` - Cash/credit preference + Stripe Connected ID

**Status:** Backend complete, no UI.

---

### Phase 6: Empty County Experience

**Purpose:** When a county has no restaurants, show "Be an early backer" messaging + community submission form.

**Files:**
- `server/emptyCountyService.ts` - Check if county is empty, content fallback
- `server/emptyCountyPhase6Service.ts` - **POSSIBLE DUPLICATE** (needs investigation)
- `server/emptyCountyRoutes.ts` - API endpoints
- `client/src/pages/EmptyCountyExperience.tsx` - UI component

**Routes (Not Active):**
- `GET /api/counties/:state/:county/empty-experience` - Get messaging
- `GET /api/counties/:state/:county/fallback` - Nearby content
- `POST /api/affiliate/submit-restaurant` - Community submission

**Database Tables:**
- `restaurantSubmissions` - Community-submitted restaurants

**UI Flow:**
1. Acknowledgement ("No partners yet")
2. Reframe ("You're early, earn money")
3. Community submission form
4. Fallback content (state/national deals)

**Status:** Complete backend + UI component, but not integrated into home.tsx location detection flow.

---

### Phase 7: Share Anything = Affiliate Link

**Purpose:** Every shared link auto-appends `?ref=<userId>` for affiliate tracking.

**Files:**
- `server/shareMiddleware.ts` - Global middleware to inject referral params
- `server/shareService.ts` - Share templates (email, SMS, social)
- `server/shareRoutes.ts` - API for share link generation

**Routes (Not Active):**
- `POST /api/share/generate` - Generate shareable link with ref param
- `GET /api/share/info` - Share channel templates

**Templates:**
- Email subject/body
- SMS copy
- Facebook/Twitter/WhatsApp copy
- QR code generation (placeholder)

**Status:** Backend complete, middleware not applied globally.

---

## Copy & Content

**Files:**
- `shared/affiliateCopy.ts` - Marketing copy for all affiliate touchpoints
  - Empty county messaging
  - Share dialog copy
  - Dashboard tiles
  - Withdrawal UI
  - Commission info
  - Onboarding flow
  - Error messages

**Status:** Complete, ready to use when features are activated.

---

## Integration Status

### Currently Connected:
- None of the above routes are active in `App.tsx`
- Restaurant dashboard has `RestaurantCreditRedemptionForm` import but not rendered
- `/affiliate/earnings` route exists but page is empty/untested

### To Activate:
1. **Phase R1:** Add "MealScout Credits" tab to restaurant-owner-dashboard
2. **Phase 6:** Integrate EmptyCountyExperience into home.tsx location detection
3. **Phase 7:** Apply shareMiddleware globally to Express app
4. **Phase 2-5:** Create affiliate dashboard UI (/affiliate/earnings)
5. Test all routes end-to-end

---

## Database Schema Status

All tables exist in `shared/schema.ts`:
- ✅ `referrals`
- ✅ `referralClicks`
- ✅ `affiliateLinks`
- ✅ `affiliateClicks`
- ✅ `affiliateCommissions`
- ✅ `affiliateCommissionLedger`
- ✅ `affiliateWallet`
- ✅ `affiliateWithdrawals`
- ✅ `creditLedger`
- ✅ `restaurantCreditRedemptions`
- ✅ `userPayoutPreferences`
- ✅ `restaurantSubmissions`

**Migration Status:** Unknown - needs `npx drizzle-kit push` to sync with database.

---

## Recommendations

1. **If using these features:** Run migrations, connect routes, test end-to-end
2. **If NOT using:** Keep files for future, document as inactive
3. **If removing:** Delete all files + remove imports from App.tsx

**Current Decision:** Keep files, mark as incomplete. User can decide later whether to activate or remove.

---

**Last Updated:** 2025-01-20 (Checkpoint v1)
