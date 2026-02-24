# Phase 3: Content & Feed Behavior Validation

## Objective
Validate that video recommendations, feed content visibility, and user behavior gates work correctly across guest, authenticated, and staff users.

## Critical Validations

### 1. Video Story Tagging & Recommendations
- [ ] Untagged videos do NOT count as recommendations
- [ ] Tagged videos (with restaurantId) DO count as recommendations
- [ ] Feed correctly marks `isRecommendation` flag
- [ ] Recommendation count accurate across API surfaces

### 2. User Role-Based Content Visibility
- [ ] **Guest Users**: Can see featured/public deals and restaurants
  - Can search deals and restaurants
  - Cannot access personal data or claims
  - Cannot see staff-only content (verified badges, internal stats)
  
- [ ] **Authenticated Users**: Can see personal content additions
  - Can see their own video stories in feed
  - Can see their claims and bookmarks
  - Can see recommendations they've made
  
- [ ] **Staff/Admin**: Can see all content + verification status
  - Can see unverified stories (flagged for review)
  - Can see reporting stats and user reports
  - Cannot see private user data (except for support)

### 3. Golden Fork & Awards System
- [ ] Golden Fork holders have correct recommendation count
- [ ] Award eligibility gates work (min recommendations required)
- [ ] Past award holders no longer show active awards
- [ ] Daily Golden Fork script correctly updates counts

### 4. Upload & Posting Limits
- [ ] Per-user daily limit: 10 videos max per 24h
- [ ] Per-restaurant daily limit: 20 recommendations max per 24h
- [ ] Rate limiting returns 429 with helpful message
- [ ] Limits reset correctly after 24h window

### 5. Feed Visibility Rules
- [ ] Stories with `status = ready` appear in feed (not `draft`)
- [ ] Admin-flagged stories hidden from public feed
- [ ] Tagged (recommendation) stories show different treatment
- [ ] Feed respects user's own ignore/hide preferences

### 6. Authorization Gates
- [ ] `/api/stories/feed` - Public (guest allowed)
- [ ] `/api/user/:userId/stories` - Self or staff only
- [ ] `/api/stories/:id/report` - Authenticated required
- [ ] `/api/awards/golden-fork/holders` - Public
- [ ] `/api/admin/stories/review` - Staff only

## Test Scenarios

### Scenario 1: Guest User Experience
```
1. Visit homepage (no auth token)
2. Browse /api/deals/featured (should work)
3. Browse /api/restaurants/nearby?lat=x&lng=y (should work)
4. Try to access /api/user/123/influence-stats (should fail 401)
Expected: Content visible, personal data blocked
```

### Scenario 2: New User First Video Upload
```
1. Log in as customer
2. Upload untagged story (no restaurant selected)
3. Upload tagged story (select restaurant)
4. Check /api/stories/feed
Expected: Both appear, only tagged one has isRecommendation=true
```

### Scenario 3: Golden Fork Eligibility
```
1. Find user with 0 recommendations
2. Upload 5 tagged stories (5 recommendations)
3. Check user influence stats
4. Run daily Golden Fork script
Expected: User appears in /api/awards/golden-fork/holders if count >= threshold
```

### Scenario 4: Upload Rate Limiting (NEW)
```
1. Rapidly upload 11 videos within 1 hour
Expected: Request 11 returns 429 with message about daily limit
```

### Scenario 5: Admin Content Moderation
```
1. Upload story with inappropriate content
2. Admin flags story for review (status=flagged)
3. Check /api/stories/feed (should NOT include flagged)
4. Check /api/admin/stories/review (SHOULD include flagged)
Expected: Content hidden from public, visible in admin panel
```

## Audit Status

| Component | Status | Notes |
|-----------|--------|-------|
| User Roles | ✅ | 29 active, 12 restaurant_owners, 13 hosts, roles assigned |
| Restaurants | ✅ | 1,025 preseeded, 12 owners, 6 verified |
| Hosts | ✅ | 18 active, 13 users, duplicates consolidated |
| Video Stories | 🔍 | Needs validation |
| Feed Visibility | 🔍 | Needs validation |
| Award System | 🔍 | Needs validation |
| Rate Limiting | 🔍 | Needs validation |

## Next Steps

1. Create audit script to validate story counts vs recommendation counts
2. Test feed endpoint with different auth states
3. Validate award system script execution
4. Verify rate limiting on rapid uploads
5. Document any issues found and create fixes
