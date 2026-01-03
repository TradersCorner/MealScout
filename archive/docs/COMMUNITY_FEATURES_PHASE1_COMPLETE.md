# Community Features - Phase 1 Implementation Complete

## Date: December 8, 2024

## Overview

Phase 1 of the Community-Driven Features has been successfully implemented. This update transforms MealScout into a community-first platform with monetization built in, where restaurants can amplify community-created content through featured slots.

---

## ✅ Completed Features

### 1. Updated Video Expiration (3 Days)

**Changed:** Video stories now expire after **3 days** (down from 7 days)

**Purpose:** Encourages constant uploads and keeps content fresh. Creates urgency for viewers to check the feed daily.

**Files Modified:**
- `shared/schema.ts` - Updated `videoStories.expiresAt` default

**Database Schema:**
```typescript
expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '3 days'`)
```

---

### 2. Featured Video Slots System

**Overview:** Restaurants can feature up to 3 videos simultaneously (Premium tier) or 1 video (Basic tier). Videos are fairly cycled every 24 hours based on engagement scores.

**New Database Tables:**

#### `featured_video_slots`
- `restaurantId` - Restaurant that owns the slot
- `slotNumber` - 1, 2, or 3 (max 3 slots per restaurant)
- `currentVideoId` - Currently featured video
- `cycleStartDate` - When current video was featured
- `cycleEndDate` - When to rotate to next video (24hr cycles)
- `previousVideoIds` - Last 5 featured videos (for variety)
- `engagementScore` - Calculated score for cycling algorithm
- `impressions` - Times shown in feed
- `clicks` - User interactions

**Files Created:**
- `server/featuredVideoCron.ts` (280+ lines)

**Key Features:**
- Fair rotation every 24 hours
- Engagement scoring: `(likes / impressions) * 100`
- Prevents re-featuring same video within 3 cycles (3 days)
- Automatically fills slots with highest-scoring videos
- Tracks impressions and clicks for analytics

---

### 3. Restaurant Subscriptions & Monetization

**Overview:** Three-tier subscription system for restaurants. All tiers can search and be searched for free, but only paid tiers can post deals and use featured slots.

#### `restaurant_subscriptions` Table

**Subscription Tiers:**

1. **Free Tier (Default)**
   - ✅ Can post video stories
   - ✅ Searchable on platform
   - ❌ Cannot post deals
   - ❌ No featured slots
   - ❌ No analytics
   - ❌ No deal scheduling

2. **Basic Tier ($29/mo)**
   - ✅ Can post video stories
   - ✅ Can post deals
   - ✅ **1 featured video slot**
   - ✅ Basic analytics (views, likes, impressions)
   - ❌ No deal scheduling
   - ❌ No priority rotation

3. **Premium Tier ($99/mo)**
   - ✅ Can post video stories
   - ✅ Can post deals
   - ✅ **3 featured video slots**
   - ✅ Advanced analytics (full dashboard)
   - ✅ Deal scheduling
   - ✅ Priority rotation algorithm

**Database Schema:**
```typescript
{
  restaurantId: string,
  tier: 'free' | 'basic' | 'premium',
  status: 'active' | 'canceled' | 'past_due',
  // Features
  canPostVideos: boolean (default: true),
  canPostDeals: boolean (default: false),
  canUseFeaturedSlots: boolean (default: false),
  maxFeaturedSlots: integer (0, 1, or 3),
  hasAnalytics: boolean (default: false),
  hasDealScheduling: boolean (default: false),
  // Billing (Stripe integration)
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  currentPeriodStart: timestamp,
  currentPeriodEnd: timestamp,
}
```

---

### 4. Updated Video Stories Schema

**New Fields Added:**
- `impressionCount` - Times shown in feed (tracked automatically)
- `engagementScore` - Calculated: `(likes / impressions) * 100`
- `isFeatured` - Currently in a featured slot
- `featuredSlotNumber` - Which slot (1-3)
- `featuredStartedAt` - When featured began
- `featuredEndedAt` - When featured cycle ends

**Files Modified:**
- `shared/schema.ts` - Added 7 new fields to `videoStories` table

---

### 5. Permission Checks for Video Uploads

**Implementation:** Before uploading a restaurant video, the system now checks:
1. Does the restaurant have a subscription?
2. If not, create a **free tier subscription** automatically
3. If yes, verify `canPostVideos` permission
4. Reject upload if permission is false

**Files Modified:**
- `server/storiesRoutes.ts` - Added subscription check to `/api/stories/upload`

**Code:**
```typescript
// Check if this is a restaurant video and verify subscription
if (bodyData.restaurantId) {
  const subscription = await db
    .select()
    .from(restaurantSubscriptions)
    .where(eq(restaurantSubscriptions.restaurantId, bodyData.restaurantId))
    .limit(1);

  if (subscription.length === 0) {
    // No subscription - create free tier by default
    await db.insert(restaurantSubscriptions).values({
      restaurantId: bodyData.restaurantId,
      tier: 'free',
      status: 'active',
      canPostVideos: true, // Everyone can post videos for free
      canPostDeals: false,
      canUseFeaturedSlots: false,
      maxFeaturedSlots: 0,
    });
  } else if (!subscription[0].canPostVideos) {
    return res.status(403).json({ 
      message: 'Restaurant subscription does not allow video posts. Please upgrade.' 
    });
  }
}
```

---

### 6. Updated Feed Algorithm

**New Feed Composition:**
- **20% Featured Videos** (sponsored, from restaurants with Basic/Premium)
- **80% Community Videos** (recent uploads, all users)

**Impression Tracking:**
- Every time a video is shown in the feed, `impressionCount` increments
- Used to calculate engagement score: `(likes / impressions) * 100`
- Powers fair cycling algorithm

**Files Modified:**
- `server/storiesRoutes.ts` - Updated `/api/stories/feed` endpoint

**Code:**
```typescript
// Get featured videos (sponsored content)
const featuredStories = await db
  .select()
  .from(videoStories)
  .where(
    and(
      eq(videoStories.isFeatured, true),
      eq(videoStories.status, 'ready'),
      gte(videoStories.expiresAt, sql`NOW()`)
    )
  )
  .orderBy(desc(videoStories.featuredStartedAt))
  .limit(2); // Show 2 featured videos per page

// Get community stories (recent uploads)
const communityStories = await db
  .select()
  .from(videoStories)
  .where(...)
  .orderBy(desc(videoStories.createdAt))
  .limit(limit - featuredStories.length)
  .offset(offset);

// Track impressions for all shown stories
await Promise.all(
  allStories.map((story) =>
    db
      .update(videoStories)
      .set({
        impressionCount: sql`${videoStories.impressionCount} + 1`,
      })
      .where(eq(videoStories.id, story.id))
  )
);
```

---

### 7. Fair Video Cycling Cron Job

**Purpose:** Automatically rotate featured videos every 24 hours based on engagement scores.

**New Endpoint:**
```
POST /api/cron/cycle-featured-videos
Header: x-cron-secret (for security)
```

**Algorithm:**
1. Find all restaurants with active subscriptions (Basic/Premium)
2. For each restaurant, get all eligible videos (not expired, not recently featured)
3. Calculate engagement score: `(likes / impressions) * 100`
4. Rank videos by score (highest first)
5. Fill featured slots with top-scoring videos
6. Track last 5 featured videos to prevent repetition
7. Rotate every 24 hours

**Variety Protection:**
- Videos can't be re-featured within 3 cycles (3 days)
- Ensures fresh content rotates through slots
- Prevents "sticky" high-scoring videos from dominating

**Files Created:**
- `server/featuredVideoCron.ts` (280+ lines)

**Functions:**
- `scoreVideosByEngagement(restaurantId)` - Calculate scores for all eligible videos
- `cycleFeaturedVideos()` - Main rotation logic
- `cleanupOldFeaturedSlots()` - Remove 90-day-old slot records
- `registerFeaturedVideoCronJobs(app)` - Register cron endpoint

---

## Database Schema Summary

### New Tables (2)

1. **featured_video_slots** - Manages 3 slots per restaurant
2. **restaurant_subscriptions** - Tracks tiers, billing, permissions

### Updated Tables (1)

1. **video_stories** - Added 7 new fields:
   - `impressionCount`
   - `engagementScore`
   - `isFeatured`
   - `featuredSlotNumber`
   - `featuredStartedAt`
   - `featuredEndedAt`
   - `expiresAt` (changed to 3 days)

---

## API Endpoints

### Existing Endpoints (Modified)

**POST /api/stories/upload**
- ✅ Added subscription check
- ✅ Auto-creates free tier if no subscription
- ✅ Validates `canPostVideos` permission

**GET /api/stories/feed**
- ✅ Updated to include featured videos (20%)
- ✅ Tracks impressions for all shown videos
- ✅ Calculates engagement scores

### New Endpoints

**POST /api/cron/cycle-featured-videos**
- Rotates featured videos every 24 hours
- Requires `x-cron-secret` header
- Returns: `{ success: true, message: "Featured videos cycled" }`

---

## Business Model

### Revenue Streams

1. **Basic Tier Subscriptions** - $29/mo
   - 1 featured slot per restaurant
   - Estimated: 1,000 restaurants × $29 = **$29,000/mo**

2. **Premium Tier Subscriptions** - $99/mo
   - 3 featured slots per restaurant
   - Advanced analytics, deal scheduling
   - Estimated: 500 restaurants × $99 = **$49,500/mo**

**Total Potential MRR: $78,500/mo**

### Community-First Strategy

**Free for Community:**
- ✅ Anyone can post video stories (15 sec, free)
- ✅ All restaurants searchable (no paywall)
- ✅ Users build reviewer levels, earn awards
- ✅ Creates endless user-generated content

**Paid for Restaurants:**
- ❌ Can't post deals without subscription
- ❌ Can't use featured slots without subscription
- ✅ Pay to amplify community-created content
- ✅ Benefit from free viral marketing

**Result:** Restaurants **need** to pay to reach the audience that communities create.

---

## TypeScript Compilation

**Status:** ✅ **0 Errors**

**Command:** `npm run check`

**Output:** Clean compilation, all types validated.

---

## Next Steps (Phase 2)

### 1. Explore Page for Travel Discovery

**Purpose:** Users can discover deals and videos outside their home area for travel planning.

**Endpoints to Create:**
- `GET /api/explore/nearby` - Geolocation query (radius-based)
- `GET /api/explore/trending` - Trending by state/region
- `GET /api/explore/restaurants` - Searchable restaurant directory

**UI Components:**
- Explore page with map view
- Filter by cuisine, distance, rating
- "Save for later" bookmarking

### 2. Stripe Integration for Payments

**Implementation:**
- Stripe Checkout for Basic/Premium subscriptions
- Webhook handler for subscription events
- Billing dashboard for restaurants
- Auto-downgrade on payment failure

**Endpoints:**
- `POST /api/subscriptions/create-checkout` - Start subscription
- `POST /api/webhooks/stripe` - Handle Stripe events
- `GET /api/subscriptions/:restaurantId` - Current subscription info

### 3. Restaurant Search (No Paywall)

**Purpose:** All restaurants searchable by name, cuisine, location. Free to search, paid to post.

**Implementation:**
- Full-text search on restaurant names, cuisines, cities
- Autocomplete suggestions
- Distance-based sorting
- Profile pages with all info visible (deals, videos, reviews)

### 4. Analytics Dashboard

**Purpose:** Basic/Premium tiers get analytics on impressions, engagement, top videos.

**Metrics to Track:**
- Total impressions (by video, by day)
- Engagement rate (likes / impressions)
- Click-through rate (clicks / impressions)
- Top-performing videos (by engagement score)
- Revenue attribution (deals clicked from videos)

---

## Files Modified Summary

### Schema Changes
- ✅ `shared/schema.ts` - Added 2 tables, updated videoStories, added types/schemas

### Server Changes
- ✅ `server/storiesRoutes.ts` - Updated upload & feed endpoints
- ✅ `server/featuredVideoCron.ts` - **NEW FILE** (280+ lines)

### Documentation
- ✅ `COMMUNITY_FEATURES_PHASE1_COMPLETE.md` - **NEW FILE** (this file)

---

## Git Commit

**Next Step:** Commit all changes with this message:

```bash
git add .
git commit -m "Phase 1: Community features - 3-day expiration, featured slots, subscriptions

- Update video expiration from 7 → 3 days
- Add featured_video_slots table (3 slots per restaurant)
- Add restaurant_subscriptions table (Free/Basic/Premium tiers)
- Add fair video cycling cron job (daily rotation based on engagement)
- Update feed algorithm to include 20% featured videos
- Add impression tracking for all videos
- Add permission checks for video uploads
- Business model: Community creates content, restaurants pay to amplify
- TypeScript: 0 errors, all types validated"

git push origin main
```

---

## Summary

Phase 1 successfully implements the foundation for a community-driven marketplace:

✅ **3-day video expiration** - Keeps content fresh  
✅ **Featured slots (1-3 per restaurant)** - Restaurants pay to amplify  
✅ **Fair cycling algorithm** - Based on engagement scores  
✅ **Subscription tiers** - Free/Basic/Premium with clear features  
✅ **Impression tracking** - Powers fair rotation  
✅ **Permission checks** - Enforces monetization  
✅ **Updated feed algorithm** - 20% featured, 80% community  

**Business Impact:** Transforms MealScout from "deal finder" to "community recommendation marketplace where restaurants pay to reach engaged audiences created by users."

**Next:** Phase 2 - Explore page, Stripe integration, analytics dashboard.
