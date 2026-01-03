# MealScout Production Readiness & Stress Testing Guide

## Overview

This guide provides comprehensive stress testing and validation procedures to ensure MealScout can handle thousands of concurrent users during launch.

## Quick Start

### Run All Tests (Recommended)
```bash
npm run test:all
```

This runs TypeScript validation, user flow tests, and stress tests sequentially.

### Run Individual Tests

#### 1. User Flow Tests (7 realistic journeys)
Tests complete user workflows to identify functional issues:
```bash
npm run test:flows
```

**What it tests:**
- New user discovery journey (homepage → search → details → awards)
- Deal seeker journey (multiple searches → filtering → trending)
- Food truck tracker journey (nearby trucks → details → schedule → reviews)
- Restaurant owner journey (create → update → add deals → analytics)
- Award tracking journey (view holders → check eligibility → profiles)
- LLM integration (Action API endpoints with token auth)
- Analytics & reporting (system stats → user stats → trending)

**Expected output:**
- 7 flows × 5+ steps each = 35+ API calls
- Success rate should be ≥95% for production readiness
- Individual step response times displayed

---

#### 2. Stress Test (High Load Simulation)
Tests system stability under concurrent load:
```bash
npm run stress-test
```

**What it tests:**
- 10 concurrent users (default, configurable)
- 20 requests per test per user (200 total per endpoint)
- Gradual ramp-up over 5 seconds (smoother load)
- 8 endpoint categories:
  1. **Health Checks** - Server availability
  2. **User Authentication** - Login endpoints
  3. **Deal Search** - Query performance with various searches
  4. **Restaurant Discovery** - Geographic queries
  5. **Restaurant Details** - Single item fetches
  6. **Awards System** - Golden Fork & Plate endpoints
  7. **Action API** - LLM integration endpoints
  8. **Overall Performance Metrics**

**Configuration environment variables:**
```bash
BASE_URL=http://localhost:5000 npm run stress-test
```

**Expected output:**
- ~1600+ total requests across all tests
- Response time statistics (avg, min, max)
- Success rate per endpoint
- Error tracking and aggregation

---

## Production Checklist

Before deploying to thousands of users, verify:

### ✅ Prerequisites
- [ ] Database is properly configured and scaled
- [ ] Environment variables set (.env file complete)
- [ ] Redis cache configured (if using)
- [ ] Cloudinary credentials working
- [ ] Brevo email service active
- [ ] CDN/Static asset serving optimized

### ✅ Code Quality
- [ ] Run `npm run check` → 0 TypeScript errors
- [ ] No console.error or console.warn in production code
- [ ] All API error handlers tested
- [ ] CORS properly configured for production domain

### ✅ Performance Baseline
- [ ] User flows complete with ≥95% success rate
- [ ] Average response time <500ms for all endpoints
- [ ] Deal search returns within 200ms
- [ ] Restaurant queries handle 40.7128/-74.0060 (NYC stress test)
- [ ] Awards endpoints respond within 300ms

### ✅ Load Testing
- [ ] Stress test passes with 10 concurrent users
- [ ] Scale to 50+ users for 1K expected launch users
- [ ] Check server CPU/memory usage stays under 80%
- [ ] Database connection pool has enough connections

### ✅ Security
- [ ] Rate limiting active: 100 req/min for LLM API
- [ ] CORS headers correct
- [ ] Helmet.js security headers enabled
- [ ] JWT/token validation working
- [ ] SQL injection prevented (Drizzle ORM with parameterized queries)

### ✅ Monitoring & Logging
- [ ] Error logging configured
- [ ] Request logging enabled (correlation IDs)
- [ ] Performance metrics collected
- [ ] Alerting set up for >5% error rate

---

## Load Testing Levels

### Level 1: Baseline (Single Machine)
```bash
# Default configuration
npm run stress-test
# Tests: 10 users, 20 requests each = 200 total per endpoint
```

**Expected for thousands of users:**
- Average response time: <300ms
- Success rate: >99%
- Server CPU: <40%
- Database queries: <100ms

### Level 2: Moderate Load (100 Concurrent Users)
Create a custom test script:
```bash
BASE_URL=http://your-server:5000 \
  node scripts/stressTest.ts \
  --users 100 \
  --requests 20 \
  --ramp-up 10000
```

**Expected for thousands of users:**
- Average response time: <500ms
- Success rate: >95%
- Server CPU: <60%
- Database response: <200ms

### Level 3: High Load (1000 Concurrent Users)
Requires load testing infrastructure:
```bash
# Use Apache JMeter, k6, or Artillery
k6 run scripts/k6LoadTest.ts --vus 1000 --duration 5m
```

---

## Monitoring During Stress Tests

### Open a second terminal to monitor:

#### System Resources (Windows PowerShell)
```powershell
# Real-time CPU and memory
Get-Counter -Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1

# Node.js process memory
Get-Process | Where-Object {$_.Name -like "node*"} | Format-Table Name, WorkingSet
```

#### Database Query Performance
```bash
# Monitor database connection pool
npm run dev:server  # With logging enabled
```

#### Response Time Tracking
The stress test automatically reports:
- Min/max/avg response times per endpoint
- 95th percentile (p95) response time
- Error rates by endpoint

---

## Scaling Recommendations

### For 1,000 Concurrent Users

**Database:**
- Scale to 5-10 concurrent connections minimum
- Use read replicas for analytics queries
- Consider caching frequently accessed data (awards, trending deals)

**Server:**
- Run 2-4 instances behind load balancer
- Enable connection pooling (PgBouncer)
- Implement caching layer (Redis)

**Performance:**
- Cache restaurant data (updates hourly)
- Cache award holders/winners (updates daily)
- Implement request debouncing on client

**Monitoring:**
- Set up error rate alerts (>1%)
- Monitor database connection pool saturation
- Track p95 response times (should stay <1s)

---

## Common Issues & Solutions

### Issue: Deal Search Returns >1s
**Solution:**
- Add database index on `deals.createdAt`
- Implement full-text search instead of LIKE
- Cache search results with 5-minute TTL

### Issue: Restaurant Discovery Timeouts
**Solution:**
- Use PostGIS for geographic queries (not calculated in app)
- Add index on location coordinates
- Cache nearby results by area

### Issue: High Database Connection Usage
**Solution:**
- Use connection pooling (PgBouncer)
- Implement query result caching
- Use read replicas for analytics

### Issue: Awards Endpoint Slow
**Solution:**
- Cache award holders/winners (update on schedule)
- Use database materialized views
- Implement incremental calculation

---

## Test Scenarios Covered

### 1. New User Registration Flow
```
Homepage → Search → Restaurant Details → Awards → Interaction
Expected: 5-step flow completes in <5s
```

### 2. Deal Claiming Journey
```
Search Multiple Deals → Filter → View Details → Claim → Track
Expected: Seamless, <2s per action
```

### 3. Food Truck Real-time Tracking
```
Find Nearby → Get Details → View Schedule → Check Reviews
Expected: Real-time updates, <500ms response
```

### 4. Restaurant Owner Workflow
```
Create Restaurant → Add Deals → View Analytics → Update Info
Expected: All operations complete, rate-limited to prevent abuse
```

### 5. Awards Discovery
```
View Golden Fork → View Golden Plate → Check Eligibility → Profile
Expected: <300ms per request, cached results
```

### 6. LLM Integration (TradeScout)
```
FIND_DEALS → FIND_RESTAURANTS → GET_FOOD_TRUCKS → GET_CREDITS
Expected: Token auth works, rate limiting enforced (100 req/min)
```

---

## Post-Launch Monitoring

### 1. Error Rate Alerts
- Alert if error rate > 1%
- Track 404s, 500s, timeouts separately
- Log all 5xx errors with full context

### 2. Performance Metrics
- Track p50/p95/p99 response times
- Monitor database query duration
- Alert if p95 > 1s for any endpoint

### 3. User Experience
- Track deal search completion rate
- Monitor favorite/deal save success
- Track award notification delivery

### 4. Capacity Planning
- Monitor database connection pool saturation
- Track server CPU/memory trends
- Plan scaling needs 2-4 weeks ahead

---

## Running Tests Before Each Deployment

```bash
# 1. Verify code quality
npm run check

# 2. Run user flow tests (5-10 minutes)
npm run test:flows

# 3. Run stress test (5-10 minutes)
npm run stress-test

# 4. Manual smoke test
# Visit: http://localhost:5000
# - Search for "pizza"
# - Click on a restaurant
# - View awards

# 5. If all pass, proceed with deployment
git commit -m "Pre-deployment verification complete"
git push
```

---

## Expected Results for Production Readiness

| Metric | Target | Pass/Fail |
|--------|--------|-----------|
| TypeScript Errors | 0 | ✅ Must Pass |
| User Flow Success Rate | ≥95% | ✅ Must Pass |
| Stress Test Success Rate | ≥95% | ✅ Must Pass |
| Average Response Time | <300ms | ✅ Must Pass |
| Deal Search Response | <200ms | ✅ Must Pass |
| Restaurant Discovery | <300ms | ✅ Must Pass |
| Awards Endpoints | <300ms | ✅ Must Pass |
| Max Response Time | <2s | ⚠️ Should Pass |
| Error Rate | <1% | ✅ Must Pass |

If all "Must Pass" metrics are green → **READY FOR LAUNCH**

---

## Additional Resources

- **API Documentation**: `API_ACTIONS.md` - TradeScout LLM integration
- **Feature Verification**: `FEATURE_VERIFICATION.md` - All features verified intact
- **Environment Setup**: `.env.example` - All required variables
- **Deployment Guide**: `DEPLOYMENT.md` - Production deployment steps

---

## Support & Debugging

### Enable Detailed Logging
```bash
DEBUG=mealscout:* npm run stress-test
```

### Run Individual Endpoint Test
```bash
curl -X GET http://localhost:5000/api/deals/search?q=pizza&limit=10
curl -X GET http://localhost:5000/api/restaurants/nearby/40.7128/-74.0060
curl -X GET http://localhost:5000/api/awards/golden-fork/holders
```

### Monitor Network Requests
```bash
# In browser DevTools → Network tab
# During stress test to see actual request patterns
```

---

**Last Updated**: December 2025
**Version**: 1.0
**Status**: Ready for Production Launch

For urgent issues during launch, enable verbose logging and check:
1. Database connectivity
2. Environment variable configuration
3. API rate limiting status
4. Error logs for specific failures
