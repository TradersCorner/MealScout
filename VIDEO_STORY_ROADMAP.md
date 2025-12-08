# 🎬 Video Story Feed Feature - Implementation Roadmap

## Executive Summary

**Complexity: MEDIUM-HIGH** (3-4 weeks for full feature)  
**Effort: 40-60 hours** of development  
**Storage: ~500GB-1TB** for 10k active users with 15-sec videos  
**Annual Cost: $50-200/mo** (CDN + storage)

This is absolutely doable! You have a solid foundation (awards system, user profiles, database). The main challenges are:
1. Video encoding/compression (CPU intensive)
2. Storage & CDN costs (biggest expense)
3. Video expiration/cleanup (database management)
4. Real-time feed performance

---

## 📊 Feature Breakdown & Effort Estimate

### Phase 1: Core Video Infrastructure (Week 1-2)
**Effort: 16-20 hours**

#### 1.1 Database Schema
```typescript
// New tables needed:
- video_stories (id, userId, restaurantId, title, duration, status, createdAt, expiresAt)
- video_files (id, storyId, originalUrl, encodedUrl, thumbnail, fileSize)
- story_likes (storyId, userId, createdAt) - for favorites
- story_comments (id, storyId, userId, text, createdAt)
- story_views (storyId, userId, viewedAt) - for analytics
```

**Difficulty: EASY** (2-3 hours)
- Just add new tables to Drizzle schema
- Add expires_at for automatic cleanup
- Add indexes for fast queries (userId, expiresAt, createdAt)

#### 1.2 Video Upload Endpoint
**Difficulty: MEDIUM** (4-6 hours)

```typescript
POST /api/stories/upload
- Accept video file (max 50MB for 15 sec video)
- Validate duration (10-15 seconds)
- Save to Cloudinary (or AWS S3)
- Queue for encoding
- Return immediate response with processing status
```

**Stack:**
- Cloudinary API (already using for images) - supports video uploads!
- OR: AWS S3 + Lambda for encoding
- FormData handling for large files
- Progress tracking

#### 1.3 Video Processing Queue
**Difficulty: MEDIUM-HARD** (6-8 hours)

```typescript
// Options (ordered by complexity):

Option A: Cloudinary Auto-Transform (EASIEST - 2 hours)
- Upload to Cloudinary
- Use transformations for compression
- Cost: $0-100/mo for 10k videos

Option B: AWS Lambda + S3 (MEDIUM - 6 hours)
- S3 upload triggers Lambda
- FFmpeg encoding (multiple quality levels)
- Output to CDN
- Cost: $50-150/mo

Option C: Self-hosted encoding (HARD - 10+ hours)
- ffmpeg.js or ffmpeg-wasm
- Server-side encoding
- Queue management (BullMQ/Redis)
- Cost: Server CPU usage
```

**RECOMMENDATION:** Start with Cloudinary (you're already using it!)

#### 1.4 Video Delivery/Streaming
**Difficulty: EASY** (2-3 hours)

```typescript
// Return optimized URLs for different devices
GET /api/stories/:id
- Mobile (360p, 2Mbps)
- Tablet (720p, 4Mbps)
- Desktop (1080p, 8Mbps)
- Thumbnail for feed
```

---

### Phase 2: Feed & Display (Week 2-3)
**Effort: 16-20 hours**

#### 2.1 Feed Algorithm
**Difficulty: HARD** (8-10 hours)

```typescript
GET /api/stories/feed
- Show stories from:
  1. Users you follow (50%)
  2. Stories from favorite restaurants (30%)
  3. Trending stories (20%)
- Order by: recency, engagement, expiration
- Pagination/infinite scroll
- Cache with Redis (feed changes every 5 min)
```

**Considerations:**
- Hot feed (top videos) vs chronological
- Location-based stories
- Search stories (hashtags, cuisine, restaurant)
- Filter by reviewer level

#### 2.2 Story Playback Component
**Difficulty: MEDIUM** (6-8 hours)

```typescript
Features:
- Auto-play on scroll
- Pause on exit
- Like/comment buttons
- Share functionality
- Sound toggle
- Full-screen option
- Progressive loading (show thumbnail first)
```

**Library:** `react-player` or `video.js`

#### 2.3 Analytics Tracking
**Difficulty: EASY** (2-3 hours)

```typescript
Track:
- View count (record on 3+ seconds watched)
- Like count
- Comment count
- Share count
- Watch time distribution
- Engagement rate
```

---

### Phase 3: Expiration & Storage Management (Week 3)
**Effort: 8-12 hours**

#### 3.1 Video Expiration System
**Difficulty: MEDIUM** (4-6 hours)

```typescript
// Two options:

Option A: TTL-based (EASIEST)
- Set expires_at = createdAt + 7 days
- Cron job runs daily
- Soft delete (mark as expired)
- Hard delete after 30 days retention
- Cost: Minimal

Option B: Manual deletion
- User can delete anytime
- Videos auto-expire after 7-30 days
- Instant CDN cache invalidation needed
```

**Implementation:**
```typescript
// Run every day at 2 AM
npm run cron:cleanup-expired-stories

- Find stories where expiresAt < NOW
- Delete from Cloudinary
- Delete from database
- Clear Redis cache
- Log cleanup stats
```

#### 3.2 Storage Optimization
**Difficulty: MEDIUM** (4-6 hours)

```typescript
Strategies:
1. Adaptive bitrate encoding (360p default)
2. Aggressive compression (H.264 codec)
3. Keep high-quality version for 24 hours
4. Degrade after 48 hours
5. Delete after 7 days

Space calculation:
- 15 sec @ 1Mbps = ~2MB per video
- 50 active stories/day = 100MB/day
- 7 day expiry = 700MB storage
- 100 concurrent users = 7GB
- 10k users (~50 stories/day) = 50GB
```

---

### Phase 4: Reviewer Levels & Awards (Week 3-4)
**Effort: 12-16 hours**

#### 4.1 Reviewer Level System
**Difficulty: MEDIUM** (8-10 hours)

```typescript
Levels based on story engagement:

Level 1: Food Taster (0-99 favorites)
Level 2: Food Explorer (100-499)
Level 3: Food Enthusiast (500-999)
Level 4: Food Connoisseur (1000-2499)
Level 5: Food Critic (2500-4999)
Level 6: Master Critic (5000+)

GOLDEN FORK LEVELS (for excellence):
🍴 Bronze Fork (500 favorites on single story)
🍴🍴 Silver Fork (1000 favorites)
🍴🍴🍴 Gold Fork (3000 favorites)
🍴🍴🍴🍴 Platinum Fork (10000 favorites)

GOLDEN PLATE (Restaurant):
Same as existing, but also unlocked through story videos
```

**Implementation:**
```typescript
// Calculate on-demand or cache
function getUserReviewerLevel(userId) {
  const totalFavorites = await db
    .select({ count: count() })
    .from(story_likes)
    .where(eq(story_likes.userId, userId))
    .then(r => r[0].count);
  
  return calculateLevel(totalFavorites);
}

// Trigger award on story milestone
ON story_like_count_reaches(500, 1000, 3000, 10000)
  - Create award record
  - Send notification
  - Update user profile
  - Award badge display
```

#### 4.2 Achievement Badges
**Difficulty: EASY** (2-3 hours)

```typescript
New badges to display:
- "First Story" - Posted first video
- "Story Trend" - Story hit 500 likes
- "Critic In The Making" - 100 video favorites
- "Master Storyteller" - 10+ stories with 100+ likes each
- "Most Shared Story" - Story reached 1000 shares

Display locations:
- User profile
- Story details page
- Feed (small badge on creator avatar)
- Leaderboards
```

#### 4.3 Leaderboards
**Difficulty: MEDIUM** (4-6 hours)

```typescript
New leaderboard pages:
GET /api/leaderboards/top-reviewers
GET /api/leaderboards/trending-stories
GET /api/leaderboards/most-loved-restaurants

Timeframes: This Week, This Month, All Time

Cache with Redis for performance
```

---

### Phase 5: Advanced Features (Optional - Week 4+)
**Effort: 20+ hours**

#### 5.1 Duets & Reactions
```typescript
- Record reaction video to existing story
- Split-screen playback
- Reply videos
- Difficulty: HARD (8-10 hours)
```

#### 5.2 Story Collections
```typescript
- Create themed story series
- Show best-of compilations
- "Best of [Restaurant]" auto-collections
- Difficulty: MEDIUM (4-6 hours)
```

#### 5.3 Live Stories
```typescript
- 24-hour live streams
- Real-time chat
- Requires WebSocket scaling
- Difficulty: HARD (12-16 hours)
```

#### 5.4 Story Analytics Dashboard
```typescript
- View story performance over time
- Audience demographics
- Engagement rate trends
- Compare to other creators
- Difficulty: MEDIUM (6-8 hours)
```

---

## 💾 Storage & Cost Analysis

### Hosting Options

#### Option 1: Cloudinary (RECOMMENDED - EASIEST)
```
Pros:
- Already using for images
- Automatic video optimization
- CDN included
- Easy API
- Handles expiration

Cons:
- Pay per video transformation
- ~$0.05-0.15 per video

Cost: $100-200/mo for 10k active users

Implementation Time: 2-4 hours
```

#### Option 2: AWS S3 + CloudFront
```
Pros:
- Cheaper for storage
- More control
- Scales infinitely

Cons:
- Need Lambda for encoding
- Complex setup
- Management overhead

Cost: $50-100/mo for storage + $50-100/mo for CDN

Implementation Time: 6-10 hours
```

#### Option 3: Self-Hosted (Bunny CDN)
```
Pros:
- Cheaper CDN
- Video encoding control
- Good balance

Cons:
- Manage encoding servers
- Video quality control harder

Cost: $30-80/mo

Implementation Time: 8-12 hours
```

**RECOMMENDATION:** Start with Cloudinary, migrate to AWS later if needed

---

## 📱 Client-Side Implementation

### Components Needed

```typescript
// New React components:
1. VideoUploadModal (drag-drop, preview, 15 sec countdown)
2. VideoFeed (infinite scroll, auto-play)
3. VideoPlayer (custom controls, analytics)
4. VideoCard (in feed, with likes/comments)
5. StoryDetails (full screen, comments, share)
6. ReviewerProfile (badges, leaderboard position)
7. LeaderboardPage (trending, top creators)
8. StoriesByRestaurant (restaurant's story collection)

// Integration points:
- User profile page (show story stats)
- Restaurant detail (show story ads)
- Feed (mixed with deals)
- Search (filter by stories)
```

**Effort: 16-20 hours**

---

## 🗄️ Database Schema Details

```sql
-- Video Stories
CREATE TABLE video_stories (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL REFERENCES users(id),
  restaurantId UUID REFERENCES restaurants(id), -- nullable for personal reviews
  title TEXT NOT NULL,
  description TEXT,
  
  -- Video metadata
  duration INTEGER NOT NULL, -- seconds (10-15)
  videoUrl TEXT NOT NULL, -- Cloudinary URL
  thumbnailUrl TEXT,
  
  -- Status tracking
  status ENUM ('processing', 'ready', 'failed', 'expired') DEFAULT 'processing',
  
  -- Engagement
  viewCount INTEGER DEFAULT 0,
  likeCount INTEGER DEFAULT 0,
  commentCount INTEGER DEFAULT 0,
  shareCount INTEGER DEFAULT 0,
  
  -- Tags & search
  hashtags TEXT[], -- ['#pizza', '#foodie']
  cuisine TEXT, -- inherited from restaurant
  
  -- Expiration
  createdAt TIMESTAMP DEFAULT NOW(),
  expiresAt TIMESTAMP DEFAULT (NOW() + INTERVAL 7 DAYS),
  deletedAt TIMESTAMP, -- soft delete
  
  -- Moderation
  isApproved BOOLEAN DEFAULT true,
  flagCount INTEGER DEFAULT 0,
  
  INDEX (userId, createdAt),
  INDEX (restaurantId, createdAt),
  INDEX (expiresAt),
  INDEX (status)
);

-- Story Likes (favorites)
CREATE TABLE story_likes (
  id UUID PRIMARY KEY,
  storyId UUID NOT NULL REFERENCES video_stories(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(storyId, userId), -- one like per user per story
  INDEX (userId, createdAt),
  INDEX (storyId, createdAt)
);

-- Story Comments
CREATE TABLE story_comments (
  id UUID PRIMARY KEY,
  storyId UUID NOT NULL REFERENCES video_stories(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES users(id),
  parentCommentId UUID REFERENCES story_comments(id), -- for replies
  
  text TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  
  -- Moderation
  isApproved BOOLEAN DEFAULT true,
  
  INDEX (storyId, createdAt),
  INDEX (userId, createdAt)
);

-- Story Views (for analytics)
CREATE TABLE story_views (
  id UUID PRIMARY KEY,
  storyId UUID NOT NULL REFERENCES video_stories(id) ON DELETE CASCADE,
  userId UUID REFERENCES users(id), -- nullable for anonymous
  viewedAt TIMESTAMP DEFAULT NOW(),
  watchDuration INTEGER, -- seconds watched
  
  INDEX (storyId, viewedAt),
  INDEX (userId, viewedAt)
);

-- Reviewer Levels (denormalized for performance)
CREATE TABLE user_reviewer_levels (
  userId UUID PRIMARY KEY REFERENCES users(id),
  level INTEGER DEFAULT 1, -- 1-6
  totalFavorites INTEGER DEFAULT 0,
  totalStories INTEGER DEFAULT 0,
  topStoryFavorites INTEGER DEFAULT 0,
  
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Story Awards (for golden forks, etc.)
CREATE TABLE story_awards (
  id UUID PRIMARY KEY,
  storyId UUID NOT NULL REFERENCES video_stories(id),
  awardType ENUM ('bronze_fork', 'silver_fork', 'gold_fork', 'platinum_fork') NOT NULL,
  awardedAt TIMESTAMP DEFAULT NOW(),
  
  INDEX (storyId),
  INDEX (awardedAt)
);
```

---

## 🚀 Implementation Timeline

### Week 1: Core Infrastructure
- Day 1-2: Database schema + migrations
- Day 3-4: Cloudinary video upload integration
- Day 5: Video delivery endpoints

### Week 2: Feed & Display
- Day 1-2: Feed algorithm
- Day 3-4: React video components
- Day 5: Analytics tracking

### Week 3: Storage & Awards
- Day 1-2: Expiration system
- Day 3-4: Reviewer levels
- Day 5: Leaderboards + testing

### Week 4: Polish & Deploy
- Day 1-2: Bug fixes
- Day 3: Performance optimization
- Day 4: Security review
- Day 5: Production deployment

---

## 🔒 Security Considerations

```typescript
// Content Moderation
- Flag inappropriate content
- Automated review of videos (optional AI service)
- Remove after 10 flags
- Permanent bans for repeat violators

// Privacy
- Anonymize viewer data
- Option to hide view count
- Private stories (friends-only)

// Performance
- Rate limit uploads (5 per day per user)
- Size limits (50MB)
- Duration validation (10-15 sec)
- Storage quota per user (500MB)
```

---

## 🎯 Recommended Approach

### Phase 1A: MVP (Week 1-2, 20 hours)
- ✅ Video upload to Cloudinary
- ✅ Basic feed display
- ✅ Like/comment system
- ✅ View tracking
- ✅ 7-day expiration
- **Launch:** Beta with select users

### Phase 1B: Polish (Week 2-3, 15 hours)
- ✅ Reviewer levels
- ✅ Awards system
- ✅ Better feed algorithm
- ✅ Leaderboards
- **Launch:** Public release

### Phase 2: Growth (Week 4+, 20+ hours)
- ✅ Analytics dashboard
- ✅ Advanced features (duets, collections)
- ✅ Live stories
- ✅ Story recommendations

---

## 📋 Quick Start Checklist

- [ ] Sign up for Cloudinary video API (or use current account)
- [ ] Create Drizzle migrations for new tables
- [ ] Build upload endpoint (POST /api/stories/upload)
- [ ] Create video feed component
- [ ] Add like/comment system
- [ ] Implement expiration cron job
- [ ] Build reviewer level calculation
- [ ] Add leaderboard endpoints
- [ ] Create achievement badges
- [ ] Deploy and test

---

## 🤔 FAQ

**Q: How do I handle video encoding quality?**
A: Let Cloudinary handle it. Upload once, it creates multiple quality versions automatically.

**Q: Won't storage costs explode?**
A: With 7-day expiration, you cap storage. 50 stories/day × 2MB = 700MB max.

**Q: How do I prevent abuse?**
A: Rate limiting (5 uploads/day), size limits, content moderation, flag system.

**Q: Can I make this real-time?**
A: Yes! Use WebSocket for comments. Update like count with polling/WebSocket.

**Q: What about failed uploads?**
A: Queue system with retry. Show user upload status progress bar.

**Q: How do I test video uploads locally?**
A: Use Cloudinary sandbox environment with test videos.

---

## 📊 Success Metrics

Track these after launch:

```
- Video upload rate (% of users creating stories)
- Average views per story
- Like-to-view ratio (engagement)
- Comment rate
- Share rate
- Retention (users who watch 1+ story per week)
- Creator retention (users who upload regularly)
- Storage usage (GB/day)
- CDN costs (actual vs. estimated)
```

---

## Next Steps

1. **Decide:** Start with Cloudinary MVP or build full AWS solution?
2. **Design:** Sketch UI for upload modal and feed
3. **Database:** Create schema and run migrations
4. **API:** Build upload endpoint first
5. **Frontend:** Create video components
6. **Test:** Test with friends before public launch

Want me to start building this? I'd recommend:
1. Start with the Cloudinary MVP (2 weeks)
2. Get real user feedback
3. Then expand to advanced features

Ready to proceed?

---

**Difficulty Level: MEDIUM (6/10)**  
**Time Estimate: 3-4 weeks part-time**  
**Skills Needed: Video APIs, CDN, React, Database design**

You've got this! 🚀
