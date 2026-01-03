# 🎯 Community-Driven Recommendations & Monetization - Feature Build

## Overview

Transform MealScout into a **community-first platform** where:
1. **Community recommendations drive discovery** (3-day expiring stories)
2. **Restaurants pay to amplify** (deal feed + video posting)
3. **Explore enables travel discovery** (deals/recommendations outside home area)
4. **Featured videos create competition** (3 slots per restaurant, fair cycling)

---

## 🎬 Part 1: Video Story Expiration & Featured Videos

### 1.1 Update Video Stories Schema

Add to `shared/schema.ts`:

```typescript
// Update videoStories table
{
  // ... existing fields ...
  expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '3 days'`), // Changed from 7 to 3
  isFeatured: boolean("is_featured").default(false), // Restaurant featured video
  featuredStartedAt: timestamp("featured_started_at"), // When featured slot started
  featuredEndedAt: timestamp("featured_ended_at"), // When featured slot ended
  impressionCount: integer("impression_count").default(0), // Times shown in feed
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }).default(0), // Like ratio
}

// New table: featured_video_slots
export const featuredVideoSlots = pgTable(
  "featured_video_slots",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
    slotNumber: integer("slot_number").notNull(), // 1, 2, or 3
    currentStoryId: varchar("current_story_id").references(() => videoStories.id),
    
    // Cycling schedule
    startedAt: timestamp("started_at").defaultNow(),
    endsAt: timestamp("ends_at").default(sql`NOW() + INTERVAL '24 hours'`), // Change every 24h
    
    // Stats for fair rotation
    totalImpressions: integer("total_impressions").default(0),
    totalEngagements: integer("total_engagements").default(0),
    
    // Payment tracking
    isPremium: boolean("is_premium").default(false), // Upgraded slot
    premiumUntil: timestamp("premium_until"), // Premium expiry
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_featured_slots_restaurant").on(table.restaurantId),
    index("IDX_featured_slots_active").on(table.endsAt),
  ],
);

// New table: restaurant_subscription
export const restaurantSubscriptions = pgTable(
  "restaurant_subscriptions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
    
    // Subscription tier
    tier: varchar("tier").notNull(), // 'free' | 'basic' | 'premium' | 'enterprise'
    status: varchar("status").notNull().default("active"), // 'active' | 'canceled' | 'expired'
    
    // Features
    maxDealSlots: integer("max_deal_slots").default(0), // Free: 0, Basic: 5, Premium: 20
    maxVideoSlots: integer("max_video_slots").default(1), // Free: 0, Basic: 1, Premium: 3
    canPostVideos: boolean("can_post_videos").default(false), // Free: false, Paid: true
    canPostDeals: boolean("can_post_deals").default(false), // Free: false, Paid: true
    canBeSearched: boolean("can_be_searched").default(true), // Always true
    
    // Billing
    billingCycle: varchar("billing_cycle"), // 'monthly' | 'yearly'
    monthlyPrice: decimal("monthly_price", { precision: 8, scale: 2 }),
    billingStartDate: timestamp("billing_start_date"),
    billingNextDueDate: timestamp("billing_next_due_date"),
    stripeSubscriptionId: varchar("stripe_subscription_id"),
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_subscriptions_restaurant").on(table.restaurantId),
    index("IDX_subscriptions_tier").on(table.tier),
  ],
);
```

### 1.2 Update Feed Algorithm

**Goal:** Cycle featured videos fairly, show community recommendations

```typescript
// New feed endpoint: /api/stories/feed (updated)
GET /api/stories/feed?location=lat,lon&page=0

Algorithm:
1. Get user's location (lat/lon)
2. Find nearby restaurants (10 mile radius)
3. For each restaurant:
   a. If has featured slot expiring soon → rotate to next best video
   b. Add featured video to feed
4. Fill remaining feed with community videos (non-featured):
   a. Order by: recency, engagement rate, location proximity
   b. Show newest first (3-day expiration encourages fresh uploads)
5. Shuffle order for fairness
6. Return paginated results

Response includes:
- Story data
- isSponsored: true/false (featured = sponsored)
- restaurantInfo
- creator info (for community vids)
```

### 1.3 Featured Video Cycling Logic

**Runs every 24 hours (cron job):**

```typescript
POST /api/cron/cycle-featured-videos

For each restaurant:
1. Get current featured slot videos
2. Calculate engagement score (likes / views)
3. Get top 3 eligible videos from last 3 days
4. Select best one for each slot (fair rotation)
5. Update featuredVideoSlots.currentStoryId
6. Set next rotation time (24 hours)
7. Log impressions/engagement for analytics

Selection criteria:
- Must be ≤ 3 days old
- Higher engagement score = priority
- Exclude videos already shown in this slot recently
- Prefer new videos (encourage fresh uploads)
```

---

## 🗺️ Part 2: Explore Page (Travel Discovery)

### 2.1 New Endpoints

```
GET /api/explore
  - Query: city, state, lat, lon, radius, cuisine, sort
  - Returns: restaurants with deals + featured videos nearby
  - Location-based discovery for travelers

GET /api/explore/nearby
  - Query: lat, lon, radius=25miles
  - Returns: deals + community videos in radius
  - "What's happening nearby right now"

GET /api/explore/trending
  - Query: state, cuisine
  - Returns: trending deals + videos by region
  - "What's hot in [state]"

GET /api/explore/restaurants
  - Query: search, city, state, cuisine
  - Returns: searchable restaurant list (free accounts visible)
  - All restaurants searchable (no paywall for discovery)
```

### 2.2 Explore Page UI

```typescript
// client/src/pages/explore.tsx
Components:
1. LocationSearch - "Where are you traveling?"
2. CuisineFilter - Filter by type
3. RadiusSlider - 5 miles to 100 miles
4. ResultsGrid - Mix of:
   - Featured restaurant videos (sponsored)
   - Community recommendations (top rated)
   - Active deals
   - Restaurant cards (searchable)
5. TrendingSection - "What's hot nearby"
6. MapView - Show deals/restaurants on map
```

### 2.3 Database Queries

```sql
-- Find deals within radius
SELECT d.*, r.name, r.latitude, r.longitude,
  SQRT(POW(69.1 * (r.latitude - ?) , 2) + POW(69.1 * (? - r.longitude) * COS(r.latitude / 57.3), 2)) AS distance
FROM deals d
JOIN restaurants r ON d.restaurant_id = r.id
WHERE d.is_active = true
AND SQRT(...) <= ?
ORDER BY distance ASC, d.created_at DESC;

-- Find community videos nearby
SELECT vs.*, u.first_name, u.profile_image_url,
  SQRT(...) AS distance
FROM video_stories vs
JOIN users u ON vs.user_id = u.id
WHERE vs.status = 'ready'
AND vs.expires_at > NOW()
AND vs.is_featured = false
AND restaurant_id IS NOT NULL
AND SQRT(...) <= ?
ORDER BY vs.like_count DESC;
```

---

## 💰 Part 3: Restaurant Monetization

### 3.1 Subscription Tiers

| Feature | Free | Basic ($29/mo) | Premium ($99/mo) |
|---------|------|---|---|
| Search Visibility | ✅ | ✅ | ✅ |
| Post Videos | ❌ | 1/day | 3/day |
| Post Deals | ❌ | 5 max | 20 max |
| Featured Slots | 0 | 1 | 3 |
| Premium Badges | ❌ | ✅ | ✅✅ |
| Analytics | ❌ | Basic | Advanced |
| Support | Self-serve | Email | Priority |

### 3.2 Subscription Schema Updates

```typescript
// When restaurant tries to post video/deal:
function canPostContent(restaurant) {
  const sub = await getSubscription(restaurant.id);
  
  if (sub.tier === 'free') {
    // Can't post
    return { allowed: false, reason: 'Upgrade to post', tier: 'basic' };
  }
  
  if (sub.tier === 'basic' && countVideosThisMonth > 20) {
    return { allowed: false, reason: 'Monthly limit reached' };
  }
  
  return { allowed: true };
}
```

### 3.3 Stripe Integration

```typescript
POST /api/restaurant/subscribe
Body: { restaurantId, tier: 'basic' | 'premium' }
Returns: Stripe checkout session URL

// Webhook: stripe.customer.subscription.updated
- Update restaurantSubscriptions tier, dates, limits
- Send confirmation email
- Update capabilities immediately

GET /api/restaurant/subscription
Returns: Current tier, renewal date, usage stats
```

---

## 📊 Part 4: Fair Video Cycling & Impression Tracking

### 4.1 Impression Tracking

Every time featured video shown in feed:

```typescript
POST /api/stories/:storyId/impression
Body: { 
  restaurantId, 
  slotNumber, 
  duration: 'shown' | 'played' | 'shared'
}

Actions:
1. Increment videoStories.impressionCount
2. Increment featuredVideoSlots.totalImpressions
3. Log in impressions analytics table
4. Update engagement_score = likes / impressions
5. Check if rotation needed early (if poor performance)
```

### 4.2 Fair Cycling Algorithm

```typescript
// Run daily at 2 AM
async function cycleFeaturedVideos(restaurantId) {
  // Get all eligible videos from last 3 days
  const eligible = await db
    .select()
    .from(videoStories)
    .where(
      and(
        eq(videoStories.restaurantId, restaurantId),
        eq(videoStories.status, 'ready'),
        gte(videoStories.createdAt, sql`NOW() - INTERVAL '3 days'`),
        isFalse(videoStories.isFeatured) // Not currently featured
      )
    );

  // Score each video
  const scored = eligible.map(v => ({
    id: v.id,
    score: (v.likeCount / Math.max(v.impressionCount, 1)) * 100,
    recency: daysSinceCreated(v.createdAt),
    beenFeaturedRecently: v.featuredStartedAt > NOW() - 7 DAYS,
  }));

  // For each slot, select fairly
  for (let slot = 1; slot <= 3; slot++) {
    const currentVideo = await getCurrentFeaturedVideo(restaurantId, slot);
    
    // Calculate rotation priority
    let nextVideo = scored.reduce((best, candidate) => {
      if (candidate.beenFeaturedRecently) return best; // Fair rotation
      if (candidate.score > best.score) return candidate;
      if (candidate.recency > best.recency) return candidate; // Newer = priority
      return best;
    });

    if (nextVideo) {
      await updateFeaturedSlot(restaurantId, slot, nextVideo.id);
    }
  }
}
```

### 4.3 Emergency De-Rotation

If video performs poorly (< 10% engagement):

```typescript
// After 24 hours, if engagement is bad:
if (impressionCount > 100 && engagementRate < 0.10) {
  // Rotate out immediately instead of waiting 24h
  await cycleFeaturedVideos(restaurantId);
  console.log(`De-rotated poor performer: ${storyId}`);
}
```

---

## 🔄 Part 5: Community-First Feed Algorithm

### 5.1 Feed Ranking

```
Final Feed (after featured videos):

30% - Community videos (newest 3 days)
20% - Trending videos (high engagement)
20% - Nearby restaurants (by distance)
20% - User's favorite restaurants
10% - Discovery (random restaurants)

Scoring formula:
score = (
  0.4 * (likeCount / impressionCount) +  // Engagement
  0.3 * (1 / hoursSinceCreated) +         // Recency
  0.2 * (1 / distanceInMiles) +           // Proximity
  0.1 * favoriteBoost                     // User preference
)
```

### 5.2 Feed Anti-Spam

```typescript
// Prevent same restaurant flooding feed
const feedVideos = await db
  .select()
  .from(videoStories)
  // ... where conditions
  .orderBy(sql`ROW_NUMBER() OVER (PARTITION BY ${videoStories.restaurantId} ORDER BY ${videoStories.likeCount} DESC)`)
  .where(sql`ROW_NUMBER() <= 2`); // Max 2 per restaurant in one feed page

// Diversify: show different creators
const creatorDiversity = new Set();
const diverseFeed = [];
for (const video of allVideos) {
  if (!creatorDiversity.has(video.userId)) {
    diverseFeed.push(video);
    creatorDiversity.add(video.userId);
  }
}
```

---

## 📈 Part 6: Implementation Plan

### Phase 1: Video Expiration & Featured Slots (Week 1)
- [ ] Update database schema (expiration, featured, slots)
- [ ] Implement featured video cycling (cron job)
- [ ] Update feed algorithm to show featured + community
- [ ] Implement impression tracking
- [ ] Test fair rotation

### Phase 2: Explore Page (Week 2)
- [ ] Create explore endpoints (nearby, trending, search)
- [ ] Build Explore UI component
- [ ] Add location picker
- [ ] Add filters (cuisine, radius, price)
- [ ] Test geolocation queries

### Phase 3: Restaurant Monetization (Week 3)
- [ ] Add subscription schema
- [ ] Build subscription management page
- [ ] Integrate Stripe
- [ ] Add permission checks to post endpoints
- [ ] Build admin dashboard for subscriptions

### Phase 4: Polish & Testing (Week 4)
- [ ] Performance optimization (cache nearby queries)
- [ ] Mobile responsiveness
- [ ] Payment flow testing
- [ ] Analytics dashboard
- [ ] Launch marketing

---

## 🎯 Key Metrics to Track

```typescript
// Restaurant Analytics
- Videos posted vs. shown (visibility)
- Engagement rate by featured slot
- Deal redemptions
- Subscription ROI
- Churn rate

// Community Analytics
- Video expiration rate (how many don't get views)
- Creator retention (% uploading 2+ videos)
- Engagement by age of video (decay curve)
- Explore page usage (% of users using)
- Deal discovery conversion (% of explores → claims)

// Business Analytics
- Subscription conversion rate
- Lifetime value by tier
- Upgrade rate (free → basic → premium)
- Churn reasons
```

---

## 💡 Pro Tips

### 1. Incentivize Creators
- Show engagement rate on creator profile
- "This creator has X% engagement" = social proof
- Weekly/monthly creator leaderboards
- Creator badges (Verified Community Recommender)

### 2. Incentivize Restaurants to Upgrade
- Show "upgrade to post deals" button prominently
- Free account gets "Searchable Restaurant" badge
- Basic gets video posting (1/day)
- Premium gets more slots, featured promotions
- Show ROI calculator: "Restaurants using featured get 3x engagement"

### 3. Fight Cold Start
- Pre-populate with team videos for beta restaurants
- Featured slots auto-fill with best community videos first 30 days
- Offer free 30-day trial of Basic tier

### 4. Geographic Expansion
- Explore page shows "Featured in [City]" badge
- Encourages restaurants to upload even in quiet areas
- "Be the first to recommend restaurants in [town]" gamification

---

## 🔐 Permissions & Access Control

```typescript
// Who can see what:

CAN_POST_VIDEO:
  - Community: Always (free)
  - Restaurant: Only if canPostVideos = true (paid tier)

CAN_POST_DEAL:
  - Community: Never
  - Restaurant: Only if canPostDeals = true (paid tier)

CAN_POST_FEATURED_SLOT:
  - Automatic if restaurant has available slots
  - Premium restaurants: up to 3
  - Basic: up to 1
  - Free: 0

CAN_SEARCH_RESTAURANT:
  - Always visible (free marketing for restaurants)
  - But only paid restaurants can post content

CAN_VIEW_EXPLORE:
  - Always (anonymous users can see)
  - Location-based filtering
```

---

## 📝 Summary

This builds a **sustainable, community-first marketplace** where:

✅ **Community drives discovery** - 3-day expiring stories = fresh content always
✅ **Restaurants amplify reach** - Featured slots showcase best content
✅ **Fair competition** - Automatic daily rotation prevents pay-to-win
✅ **Users find deals anywhere** - Explore page = travel companion
✅ **Restaurants monetize naturally** - Pay for what they want (visibility + features)
✅ **Search is free** - Lowers barrier to entry, encourages sign-ups

**Business model:** Restaurants pay $29-99/mo to post content + reach. Works because every post generates engagement → more reasons to subscribe.

Ready to build? I can start with Phase 1 (video expiration + featured slots) right now. 🚀
