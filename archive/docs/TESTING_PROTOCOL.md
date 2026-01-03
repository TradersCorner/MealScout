# MealScout Comprehensive Test Execution Guide

## Before Launch: Complete Testing Protocol

This document provides a step-by-step guide to thoroughly test MealScout before launching to thousands of users.

---

## Phase 1: Pre-Test Setup (5 minutes)

### 1.1 Environment Configuration
```powershell
# Open PowerShell in MealScout root directory
cd C:\Users\FlavorGood\Documents\AAATraderCorner\TradeScout\MealScout\MealScout

# Verify .env file exists and has all required variables
if (Test-Path .env) { Write-Host "✓ .env file found" } else { Write-Host "✗ Missing .env file" }

# Check Node.js version
node --version  # Should be v18+
npm --version   # Should be v9+

# Install dependencies if needed
npm install
```

### 1.2 Start the Application
```powershell
# Terminal 1: Start the server
npm run dev:server

# Wait for output: "Server running on http://localhost:5000"
# Verify database connection works (check logs for "Database connected")

# Terminal 2: Start the client (optional, for manual testing)
cd client
npm run dev
# Client will run on http://localhost:5173
```

---

## Phase 2: Code Quality Check (2 minutes)

### 2.1 TypeScript Validation
```powershell
# In root directory
npm run check

# Expected output:
# ✓ No compilation errors
# Exit code: 0
```

**If errors appear:**
- Fix TypeScript errors before continuing
- All errors must be resolved for production

---

## Phase 3: User Flow Testing (10 minutes)

### 3.1 Run User Flow Tests
```powershell
# Terminal 3: Run user flow tests
npm run test:flows

# This tests 7 realistic user journeys:
# 1. New User Discovery
# 2. Deal Seeker
# 3. Food Truck Tracker
# 4. Restaurant Owner
# 5. Award Tracking
# 6. LLM Integration (Action API)
# 7. Analytics & Reporting
```

**Expected Output:**
```
→ Flow 1: New User Discovery Journey
  ✓ New User Discovery: 6/6 passed (145ms avg)

→ Flow 2: Deal Seeker Journey
  ✓ Deal Seeker Journey: 8/8 passed (120ms avg)

... (5 more flows) ...

USER FLOW TEST SUMMARY
=================
Total Flows: 7
Total Steps: 50+
Successful Steps: 48+
Success Rate: 96% ✓

✓ User flows are stable! Ready for production launch.
```

**Success Criteria:**
- ✅ All 7 flows complete
- ✅ Success rate ≥95%
- ✅ Average response time <300ms per step
- ✅ No connection timeouts

**If tests fail:**
- Note which flow failed
- Check server logs for errors
- Verify database connectivity
- Fix issue and re-run

---

## Phase 4: Stress Testing (15 minutes)

### 4.1 Run Stress Tests
```powershell
# Terminal 4: Run comprehensive stress test
npm run stress-test

# This simulates:
# - 10 concurrent users (configurable)
# - 20 requests per user per endpoint
# - 8 endpoint categories tested
# - Gradual ramp-up to avoid overwhelming system
```

**Expected Output:**
```
Starting stress test with 10 concurrent users...
Base URL: http://localhost:5000
Requests per test: 20

Testing User Authentication...
✓ Auth tests: 200 passed, 0 failed, avg 145ms

Testing Deal Search...
✓ Deal search: 200 passed, 0 failed, avg 120ms

... (6 more endpoints) ...

STRESS TEST SUMMARY
==================

User Authentication:
  ✓ Passed: 200
  ✗ Failed: 0
  Success Rate: 100.0%
  Response Times: avg 145ms, min 89ms, max 280ms

... (7 more endpoints) ...

Overall:
  Total Requests: 1600+
  Success Rate: 99%+
  Average Response Time: 145ms
====================================

✓ All tests passed! System ready for deployment.
```

**Success Criteria:**
- ✅ Success rate ≥95% for all endpoints
- ✅ Average response time <300ms
- ✅ No memory leaks (check memory usage stays stable)
- ✅ Database connection pool holds up

**If tests fail:**
- Check specific endpoint failures
- Review server error logs
- Verify database performance
- Check for memory issues
- Fix and re-run stress test

---

## Phase 5: Performance Monitoring (Optional, Continuous)

### 5.1 Start Real-Time Monitoring
While stress tests run in one terminal, monitor performance in another:

```powershell
# Terminal 5: Real-time performance dashboard
npm run monitor

# Updates every 10 seconds showing:
# - Overall request count
# - Success rate
# - Response times (avg, p95, p99)
# - Per-endpoint metrics
# - Health check status
```

**What to Watch:**
- Success rate stays above 95%
- p95 response time stays under 500ms
- No endpoints consistently slow (>1000ms)
- Memory usage doesn't grow unbounded

---

## Phase 6: Manual Smoke Testing (10 minutes)

### 6.1 Test Core Features Manually
Open browser and test each user journey:

**Journey 1: New User (5 minutes)**
1. Go to `http://localhost:5173` (client)
2. ✓ Homepage loads without errors
3. ✓ Search for "pizza" → results appear
4. ✓ Click restaurant → details load
5. ✓ View awards (Golden Fork/Plate)
6. ✓ Check deal information

**Journey 2: Food Trucks (2 minutes)**
1. Search for food trucks nearby (40.7128, -74.0060 = NYC)
2. ✓ Food truck results appear
3. ✓ Click truck → details + schedule show
4. ✓ Real-time location updates (if WebSocket enabled)

**Journey 3: Restaurant Owner (2 minutes)**
1. Navigate to restaurant owner dashboard
2. ✓ Create deal form works
3. ✓ View analytics dashboard
4. ✓ Update restaurant info

**Journey 4: Awards (1 minute)**
1. Navigate to awards page
2. ✓ Golden Fork holders load
3. ✓ Golden Plate winners load
4. ✓ View eligibility criteria

---

## Phase 7: Load Testing at Scale (20 minutes)

### 7.1 Simulate Higher Load (Optional)

For deployment to thousands of users, test with higher concurrency:

```powershell
# Edit scripts/stressTest.ts, change:
# Line 265: concurrentUsers: 10  →  concurrentUsers: 50

npm run stress-test

# Expected: Same success rates with 50 users
```

**For 1000+ users, use professional load testing:**
```bash
# Using k6 (requires installation)
k6 run tests/k6LoadTest.ts --vus 1000 --duration 5m
```

---

## Phase 8: Database Verification (5 minutes)

### 8.1 Check Database State
```powershell
# Verify test data was created without corruption
# Run these queries in your database client:

# Count tables and records
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'

# Check for orphaned records
SELECT COUNT(*) FROM deals WHERE restaurant_id NOT IN (SELECT id FROM restaurants)

# Verify indexes are in place
SELECT indexname FROM pg_indexes WHERE schemaname = 'public'

# Check connection pool is healthy
SHOW max_connections
```

---

## Phase 9: Error Log Analysis (5 minutes)

### 9.1 Review Server Logs

Check for any errors during testing:

```powershell
# Look for patterns in error logs:
# - 4xx errors (client issues) - should be minimal
# - 5xx errors (server errors) - should be 0
# - Connection timeouts - should be 0
# - Database errors - should be 0

# Check server terminal for:
Write-Host "Look for these patterns:"
Write-Host "✗ Error:"
Write-Host "✗ Failed:"
Write-Host "✗ Timeout:"
Write-Host "✗ Connection:"
```

If critical errors found:
- Fix the issue
- Re-run tests
- Commit fix to GitHub
- Re-verify with tests

---

## Phase 10: Pre-Deployment Checklist (5 minutes)

### 10.1 Final Verification

Run this checklist before deploying:

```powershell
# 1. TypeScript compilation
npm run check
# Expected: Exit code 0, 0 errors

# 2. User flows
npm run test:flows
# Expected: 7/7 flows, 95%+ success rate

# 3. Stress test
npm run stress-test
# Expected: 1600+ requests, 95%+ success rate

# 4. Manual smoke test (browser)
# Expected: All features work without errors

# 5. Check for console errors
# Open browser DevTools → Console
# Expected: No red errors

# 6. Database verification
# Expected: No orphaned records, indexes present

# 7. Commit test results
git add -A
git commit -m "Pre-deployment testing complete - system ready for launch"
git push origin main
```

**If any step fails:**
- Do NOT deploy
- Fix the issue
- Re-run that phase
- Verify fix resolves issue
- Update commit

---

## Running Tests in Sequence (Recommended)

### Complete Testing Flow (45 minutes total)

```powershell
# 1. Setup (5 min)
npm install
npm run dev:server  # Terminal 1 - Keep running

# 2. Code quality (2 min)
npm run check       # Terminal 2

# 3. User flows (10 min)
npm run test:flows  # Terminal 3

# 4. Stress test (15 min)
npm run stress-test # Terminal 4

# 5. Monitor (optional, concurrent with stress test)
npm run monitor     # Terminal 5

# 6. Manual testing (10 min)
# Browser: http://localhost:5173

# 7. Analysis (3 min)
# Review logs and results

# 8. Deploy
git push origin main
```

---

## Troubleshooting Common Test Issues

### Issue: User Flow Tests Fail

**Symptom:** "Deal search returned 404"

**Fix:**
```powershell
# 1. Verify server is running
curl http://localhost:5000/

# 2. Check database has deals
# Query: SELECT COUNT(*) FROM deals

# 3. Manually test endpoint
curl "http://localhost:5000/api/deals/search?q=pizza&limit=10"

# 4. Check server logs for errors
# Terminal 1 should show request logs
```

### Issue: Stress Test Shows Timeouts

**Symptom:** "Request timeout after 30s"

**Fix:**
```powershell
# 1. Check server is responsive
curl http://localhost:5000/

# 2. Check system resources
Get-Process | Where-Object {$_.Name -eq "node"} | Format-List WorkingSet

# 3. Reduce concurrent users
# Edit stressTest.ts: concurrentUsers: 10 → concurrentUsers: 5

# 4. Increase timeout
# Edit stressTest.ts: timeout: 30000 → timeout: 60000

# 5. Re-run tests
npm run stress-test
```

### Issue: Database Connection Errors

**Symptom:** "Cannot connect to database"

**Fix:**
```powershell
# 1. Verify .env has DATABASE_URL
type .env | Select-String DATABASE_URL

# 2. Test database connection
npx drizzle-kit push

# 3. Check database is running (if local)
# For cloud databases, verify network access

# 4. Restart server
# Ctrl+C in Terminal 1, then npm run dev:server
```

### Issue: High Memory Usage

**Symptom:** "Node process using >1GB memory"

**Fix:**
```powershell
# 1. Check for memory leaks in logs
# Look for repeated "allocating" messages

# 2. Reduce test scale
# Edit stressTest.ts: concurrentUsers: 10 → concurrentUsers: 5

# 3. Check for unclosed connections
# Review database connection pool status

# 4. Clear old logs
# rm -r logs (if exists)

# 5. Restart everything
```

---

## Post-Test Deployment

### Deploy to Production
```powershell
# 1. All tests passed ✓
# 2. Code committed to GitHub ✓
# 3. No breaking changes ✓

# Then deploy:
git push origin main

# Production will:
# - Build: npm run build
# - Start: npm run start
# - Monitor: npm run monitor
```

---

## Monitoring in Production

### 24-Hour Post-Launch

```powershell
# Terminal: Continuous monitoring
npm run monitor

# Watch for:
# ✓ Success rate stays >95%
# ✓ Response times stay <500ms
# ✓ Error rate stays <1%
# ✓ No memory growth over time
```

### Alert Thresholds

- 🔴 Error rate >5% → Immediate investigation
- 🟡 Response time >2s → Check database performance
- 🟡 Memory >2GB → Restart process
- 🔴 Success rate <90% → Take offline and debug

---

## Success Criteria Summary

| Category | Metric | Target | Result |
|----------|--------|--------|--------|
| **Code Quality** | TypeScript Errors | 0 | __ / 0 |
| **User Flows** | Success Rate | ≥95% | __ % |
| **Stress Test** | Success Rate | ≥95% | __ % |
| **Response Times** | Average | <300ms | __ ms |
| **Database** | Orphaned Records | 0 | __ |
| **Manual Testing** | All Features | Working | ✓/✗ |
| **Performance** | Memory Stable | Yes | ✓/✗ |
| **Errors** | Critical Errors | 0 | __ |

**All metrics must be in Target to proceed with launch.**

---

## Timeline for Thousands of Users

| Phase | Duration | Concurrent Users | Success Rate Target |
|-------|----------|------------------|-------------------|
| Phase 1: Baseline | 5 min | 1 | 100% |
| Phase 2: Small Load | 5 min | 10 | 95%+ |
| Phase 3: Moderate Load | 10 min | 50 | 95%+ |
| Phase 4: Production Load | 15 min | 100+ | 95%+ |
| Phase 5: Surge | 10 min | 200+ | 90%+ (acceptable degradation) |

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Status:** Ready for Testing

Good luck with your launch! 🚀
