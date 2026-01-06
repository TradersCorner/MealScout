# MealScout 1000-User Readiness - RUN NOW

Execute these tests in order. Total time: **30 minutes**.

## Prerequisites (5 min)

```bash
cd MealScout
npm install socket.io-client  # For WebSocket test
```

## Test 1: API Load Test (10 min)

Tests 500+ concurrent requests across critical endpoints.

```bash
npx tsx scripts/quickLoadTest.ts
```

**Pass criteria:**
- ✅ All endpoints avg response < 500ms
- ✅ 0% error rate
- ✅ No server crashes

**If fails:** Check Render logs, increase instance size, or optimize slow queries.

---

## Test 2: Race Condition Test (5 min)

Validates deal claim limits under concurrent load.

**Setup:**
1. Create a test deal with `maxUses: 10` in your restaurant dashboard
2. Run test:

```bash
npx tsx scripts/raceConditionTest.ts
```

**Pass criteria:**
- ✅ Exactly 10 claims succeed (not 11+)
- ✅ Remaining attempts get "limit reached"

**If fails:** Add database transaction locking to deal claim logic.

---

## Test 3: WebSocket Stress (10 min)

Connects 1000 Socket.IO clients simultaneously.

```bash
npx tsx scripts/websocketStressTest.ts
```

**Pass criteria:**
- ✅ 95%+ successful connections
- ✅ Avg connect time < 2000ms
- ✅ No server memory issues

**If fails:** Increase Render instance RAM or optimize WebSocket logic.

---

## Test 4: Manual User Flow (5 min)

Test critical paths end-to-end:

1. **Customer Flow:**
   - [ ] Sign up new account → works
   - [ ] Search deals by location → shows results
   - [ ] Claim a deal → success confirmation
   - [ ] View "My Orders" → claimed deal appears

2. **Restaurant Owner Flow:**
   - [ ] Sign up as restaurant owner → works
   - [ ] Create new deal → saves successfully
   - [ ] View restaurant stats → loads data
   - [ ] Mark claim as used → updates correctly

3. **Host Flow:**
   - [ ] Sign up as host → works
   - [ ] Create event series → generates occurrences
   - [ ] View truck interests → displays submissions

**If any fail:** Check console errors, fix bugs, re-test.

---

## Production Checklist (5 min)

Verify these in Render dashboard:

### Environment Variables
- [ ] `DATABASE_URL` set (Neon connection string)
- [ ] `SESSION_SECRET` set (random 32+ chars)
- [ ] `CLIENT_ORIGIN` = `https://mealscout.us`
- [ ] `ALLOWED_ORIGINS` includes live domain
- [ ] `BETA_MODE` = `false` (or unset)
- [ ] `BREVO_API_KEY` set (for emails)
- [ ] Stripe keys are **live mode** (if using payments)

### Database
- [ ] Run `npx drizzle-kit push` to apply migrations
- [ ] Remove test/seed data from production DB
- [ ] Verify indexes exist (check Neon dashboard)

### Monitoring
- [ ] Render metrics dashboard accessible
- [ ] Error tracking enabled (Sentry recommended)
- [ ] Uptime monitor configured (UptimeRobot free tier)

---

## PASS/FAIL Decision

**GO LIVE** if all of these are true:
- ✅ Test 1: All endpoints < 500ms, 0% errors
- ✅ Test 2: Deal limits enforced correctly
- ✅ Test 3: 1000 WebSocket connections succeed
- ✅ Test 4: All manual flows work
- ✅ Production checklist complete

**DO NOT LAUNCH** if:
- ❌ Any test shows >5% error rate
- ❌ Race conditions detected (Test 2 fails)
- ❌ WebSocket connection rate <90%
- ❌ Critical user flow broken

---

## Quick Fixes for Common Issues

### High Response Times
```sql
-- Add missing indexes (run in Neon SQL editor)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_restaurant ON deals(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deal_views_deal ON deal_views(deal_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deal_claims_user ON deal_claims(user_id);
```

### WebSocket Connection Failures
Check `server/websocket.ts` CORS settings match your domain.

### Deal Claim Race Condition
Wrap claim logic in database transaction with row-level lock.

---

## Next Steps After Launch

1. Monitor Render logs for first hour
2. Set up alerts for error rate >5%
3. Watch Neon database connection pool usage
4. Have rollback plan ready (revert to previous commit)

**Total testing time: 30 minutes**
**Launch readiness: IMMEDIATE**
