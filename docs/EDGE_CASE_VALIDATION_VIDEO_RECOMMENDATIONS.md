# Edge-Case Validation: Video Recommendations

Run this after any change to videoStories, awards, or reviewer logic.

## Purpose

Validate that video-based recommendation semantics are enforced consistently across:
- Database truth
- API surfaces
- UI signals

Recommendation is defined as:

> A ready video story with a non-null restaurantId.

That rule must hold for reviewer levels, Golden Fork logic, and feed/UI behavior.

---

## 1. Legacy & New Stories

### 1.1 Untagged video (no restaurantId)

**Setup**
- Upload a video via the Video tab without selecting or passing a restaurantId.

**Expected DB behavior**
- `video_stories.restaurant_id` is `NULL` for that story.
- `video_stories.status` is `ready`.
- `getUserRecommendationCount(userId)` does **not** include this story.

**Expected API behavior**
- `/api/stories/feed` returns this story with:
  - `isRecommendation === false` (or absent, but treated as false in the client).

**Expected UI behavior**
- In the Video feed, this story:
  - Appears as a normal story.
  - Does **not** show the "Recommendation" badge.

---

### 1.2 Tagged video (with restaurantId)

**Setup**
- Upload a video via the Video tab where a restaurantId is provided.

**Expected DB behavior**
- `video_stories.restaurant_id` is that restaurant's id.
- `video_stories.status` is `ready`.
- `getUserRecommendationCount(userId)` increases by 1.

**Expected API behavior**
- `/api/stories/feed` returns this story with:
  - `isRecommendation === true`.

**Expected UI behavior**
- In the Video feed, this story:
  - Shows the "Recommendation" badge.

---

## 2. Reviewer Levels & Golden Fork

Use a user who has a mix of tagged and untagged videos.

### 2.1 Reviewer level totals

**Expected DB behavior**
- `user_reviewer_levels.totalStories`:
  - Increases only when a **tagged** (restaurantId != null) story is uploaded.
  - Does **not** change when an untagged story is uploaded.

### 2.2 Golden Fork stats alignment

**Expected API behavior**
- `/api/user/:userId/influence-stats` returns:
  - `recommendationCount` equal to `getUserRecommendationCount(userId)`.
- `/api/awards/golden-fork/holders` returns, for each holder:
  - `recommendationCount` equal to `getUserRecommendationCount(holder.id)`.

**Expected DB behavior**
- After running the daily Golden Fork script, for sampled users:
  - `users.recommendationCount` matches `getUserRecommendationCount(user.id)`.

---

## 3. Upload Limits (Anti-Spam)

### 3.1 Per-user daily cap

**Setup**
- From a single user account, upload 10+ videos (any mix of tagged/untagged) within a 24-hour window.

**Expected API behavior**
- Once the user has 10 stories in the last 24 hours:
  - Further upload attempts return HTTP 429 with message:
    - `"Upload limit reached: max 10 videos per day. Please wait ~6 hours before uploading again."`

### 3.2 Per-restaurant daily cap

**Setup**
- For a single restaurantId, upload 3+ tagged videos within a 24-hour window.

**Expected API behavior**
- Once the restaurant has 3 stories in the last 24 hours:
  - Further uploads tagged to that restaurantId return HTTP 429 with message:
    - `"Restaurant daily limit reached: max 3 videos per day. Please wait ~6 hours before uploading again."`

**Notes**
- Per-user cap cares about `video_stories.user_id` and `created_at`.
- Per-restaurant cap cares about `video_stories.restaurant_id` and `created_at`.
- Neither cap depends on recommendation semantics beyond the existing upload rules.

---

## 4. Status Gate (Ready vs Non-Ready)

**Setup**
- Identify a tagged video (restaurantId != null) and manually change its `status` away from `ready` (e.g., `failed` or `expired`).

**Expected DB behavior**
- The story still exists but with `status != 'ready'`.

**Expected logical behavior**
- `getUserRecommendationCount(userId)` for that user **excludes** this story.

**Expected API behavior**
- `/api/user/:userId/influence-stats` uses a `recommendationCount` that does **not** count this non-ready story.
- `/api/awards/golden-fork/holders` (for that user if they are a holder) does **not** include this story in its recommendationCount.

---

## 5. Upload UX Hint (Optional Visual Check)

**Untagged flow**
- Open the Video upload modal without a bound restaurant context.
- Expected:
  - A hint line appears near the restaurant selector area:
    - "Tag a restaurant so this counts as a recommendation."
  - Form submission is not blocked by the hint.

**Tagged flow**
- Open the Video upload modal in a context that sets `restaurantId` (if available) or otherwise ensures a restaurant is chosen.
- Expected:
  - The hint is hidden once a restaurant is associated.

---

## When to Re-Run This Checklist

Re-run this checklist after any change to **all** of the following areas:
- `videoStories` schema or related queries
- Reviewer level logic (e.g., `user_reviewer_levels` updates, cron jobs)
- Golden Fork award logic (influence score, eligibility, scripts)
- Story feed serialization or `isRecommendation` behavior

If all expectations above hold in an environment (local, staging, or production), Phase 2 video recommendation semantics can be considered validated for that environment.
