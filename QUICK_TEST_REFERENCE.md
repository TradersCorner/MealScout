# 🚀 MealScout Production Stress Testing - QUICK REFERENCE

## Run Everything (45 min)
```bash
npm run test:all
```

---

## Individual Commands

| Command | Duration | Purpose |
|---------|----------|---------|
| `npm run check` | 2 min | TypeScript validation |
| `npm run test:flows` | 10 min | 7 user journey tests |
| `npm run stress-test` | 15 min | High load simulation |
| `npm run monitor` | Continuous | Real-time dashboard |

---

## What Gets Tested

### ✅ 7 Complete User Flows
1. **New User Discovery** - Homepage → Search → Details → Awards
2. **Deal Seeker** - Multiple searches → Filter → Trending
3. **Food Truck Tracker** - Find nearby → Details → Schedule → Reviews
4. **Restaurant Owner** - Create → Update → Add deals → Analytics
5. **Award Tracking** - View holders → Check eligibility → Profiles
6. **LLM Integration** - Action API endpoints with token auth
7. **Analytics** - System stats → User stats → Trending

### ✅ 8 Endpoint Categories
- Health checks
- User authentication
- Deal search
- Restaurant discovery
- Restaurant details
- Awards system
- Action API (LLM)
- Performance metrics

### ✅ Load Simulation
- **Default:** 10 concurrent users
- **Configurable:** 50, 100, 500, 1000+ users
- **Ramp-up:** Gradual load increase (5 seconds)
- **Requests:** 1600+ total per full test

---

## Expected Results

### ✅ All Must Pass Before Launch

| Metric | Target | Your Result |
|--------|--------|-------------|
| TypeScript Errors | 0 | ___ |
| User Flow Success Rate | ≥95% | ___ % |
| Stress Test Success Rate | ≥95% | ___ % |
| Average Response Time | <300ms | ___ ms |
| Error Rate | <1% | ___ % |

**If all ✅ green → READY TO LAUNCH**

---

## Testing Sequence

### Phase 1: Setup (5 min)
```bash
npm install
npm run dev:server  # Terminal 1 - Leave running
```

### Phase 2: Code Quality (2 min)
```bash
npm run check  # Terminal 2
```

### Phase 3: User Flows (10 min)
```bash
npm run test:flows  # Terminal 3
```

### Phase 4: Stress Test (15 min)
```bash
npm run stress-test  # Terminal 4
```

### Phase 5: Monitor (Optional)
```bash
npm run monitor  # Terminal 5 - Concurrent with stress test
```

### Phase 6: Deploy (When all pass ✓)
```bash
git push origin main
```

---

## Real-Time Monitoring Dashboard

While testing, run in separate terminal:
```bash
npm run monitor
```

Shows every 10 seconds:
- Request count & success rate
- Response times (avg, p95, p99)
- Per-endpoint metrics
- Health check status
- System readiness

---

## Critical Success Criteria

### Must All Be True for Launch

```
✅ npm run check → Exit code 0, 0 errors
✅ npm run test:flows → Success rate ≥95%
✅ npm run stress-test → Success rate ≥95%
✅ No p95 response time >1000ms
✅ No memory leaks (stable memory usage)
✅ <1% error rate across tests
✅ All user flows complete without timeouts
```

---

## Pre-Launch Checklist

- [ ] Run `npm run test:all` - all pass
- [ ] Run `npm run monitor` - system status excellent
- [ ] Manual browser testing - no errors
- [ ] Database verified - no orphaned records
- [ ] Error logs reviewed - no critical issues
- [ ] Commit results - `git push origin main`

---

## Troubleshooting Quick Fixes

### Tests Failing?
```bash
# Check server is running
curl http://localhost:5000

# Check database connection
npx drizzle-kit push

# Check logs in Terminal 1
# Fix issue, re-run test
```

### High Response Times?
```bash
# Run monitor to see details
npm run monitor

# Reduce concurrent users
# Edit: scripts/stressTest.ts → concurrentUsers: 5

# Re-run stress test
npm run stress-test
```

### Memory Issues?
```bash
# Check process memory
Get-Process | Where-Object {$_.Name -eq "node"}

# Restart server (Terminal 1)
# Reduce test scale
npm run stress-test
```

---

## Scaling for 1000+ Users

### Database
- [ ] Connection pool: 5-10 min
- [ ] Read replicas for analytics
- [ ] Cache award data
- [ ] Index locations

### Server
- [ ] 2-4 instances behind load balancer
- [ ] Connection pooling (PgBouncer)
- [ ] Redis caching layer
- [ ] CDN for assets

### Monitoring
- [ ] Error rate alerts (>1%)
- [ ] Response time alerts (p95 >1s)
- [ ] Memory alerts (>2GB)
- [ ] Connection pool alerts

---

## Success Indicators During Tests

### ✅ Good Signs
```
✓ Deal search: 200 passed, 0 failed, avg 120ms
✓ Restaurant discovery: 200 passed, 0 failed, avg 150ms
✓ Awards system: 200 passed, 0 failed, avg 180ms
✓ Success Rate: 99%+
✓ Average Response Time: <200ms
```

### ❌ Bad Signs
```
✗ Deal search: 150 passed, 50 failed
✗ Response times: 2000ms+
✗ Memory usage growing unbounded
✗ Database connection errors
```

---

## Files to Know

### Documentation
- `LAUNCH_READINESS.md` - This guide
- `STRESS_TESTING.md` - Detailed testing procedures
- `TESTING_PROTOCOL.md` - Step-by-step execution

### Scripts
- `scripts/stressTest.ts` - Main stress test engine
- `scripts/userFlows.ts` - User journey tests
- `scripts/monitorPerformance.ts` - Performance dashboard

### npm Commands
```json
{
  "stress-test": "Load test with concurrent users",
  "test:flows": "Test 7 complete user journeys",
  "test:all": "Full validation suite",
  "monitor": "Real-time performance dashboard"
}
```

---

## Launch Timeline

### 1 Week Before
```bash
npm run test:all  # Daily
npm run monitor &  # Keep running
```

### 48 Hours Before
```bash
npm run check        # 2 min
npm run test:flows   # 10 min
npm run stress-test  # 15 min
# Manual browser smoke test
```

### Launch Day
```bash
npm run test:flows   # Quick check
# All green? Deploy!
git push origin main
```

### After Launch
```bash
npm run monitor  # 24/7 for first 24 hours
# Watch for: error rate <1%, response time <500ms
```

---

## Key Metrics You're Measuring

| Metric | Why It Matters | Target |
|--------|----------------|--------|
| Success Rate | System reliability | ≥95% |
| Avg Response Time | User experience | <300ms |
| p95 Response Time | Slow users experience | <500ms |
| Error Rate | System stability | <1% |
| Throughput | Capacity for users | >100 req/s |
| Memory Usage | Resource efficiency | Stable, no growth |

---

## Sample Output - Healthy System

```
USER FLOW TEST SUMMARY
Total Flows: 7
Total Steps: 50+
Success Rate: 96% ✓

STRESS TEST SUMMARY
Total Requests: 1600+
Success Rate: 99%+
Average Response Time: 145ms
p95 Response Time: 320ms

PERFORMANCE MONITOR
Requests/Second: 9.95
System Status: EXCELLENT ✓

→ ALL SYSTEMS GREEN - READY FOR LAUNCH ✅
```

---

## Sample Output - Problem System

```
Deal search: 150 passed, 50 failed ❌
Average Response Time: 2000ms ❌
Memory Usage: Growing unbounded ❌
Database errors in logs ❌

→ FIX ISSUES BEFORE LAUNCH ⛔
```

---

## Emergency Contacts

### If Tests Fail
1. Review TESTING_PROTOCOL.md troubleshooting section
2. Check server logs (Terminal 1)
3. Verify .env configuration
4. Test database connectivity manually
5. Review recent code changes

### If Performance Degrades
1. Run `npm run monitor` to see real-time metrics
2. Check database connection pool status
3. Verify no memory leaks in logs
4. Reduce test scale to identify bottleneck
5. Fix issue and re-test

---

## You're Ready When... ✅

- [ ] TypeScript compilation passes
- [ ] 7 user flows all complete
- [ ] Stress test shows ≥95% success rate
- [ ] Average response time <300ms
- [ ] No critical errors in logs
- [ ] Manual testing works without errors
- [ ] Database performs well
- [ ] Memory usage is stable

## Then... 🚀

```bash
git push origin main
# Deploy with confidence to thousands of users!
```

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Status:** ✅ Ready for Testing  

**Next Step:** Run `npm run test:all` to begin!
