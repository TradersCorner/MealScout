# Production-Ready Features Implementation

## 1. Image Upload System ✅ Schema Ready

### Database Schema Added:
- `restaurants.logoUrl` - Restaurant logo
- `restaurants.coverImageUrl` - Restaurant cover photo
- `deals.imageUrl` - Deal images (already exists)
- `users.profileImageUrl` - User profile photos (already exists)
- `imageUploads` table - Track all uploads with metadata

### Implementation Required:

#### Install Dependencies:
```bash
npm install cloudinary multer @types/multer
```

#### Environment Variables (add to Render):
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

#### API Endpoints to Create:
- `POST /api/upload/restaurant-logo` - Upload restaurant logo
- `POST /api/upload/restaurant-cover` - Upload restaurant cover image
- `POST /api/upload/deal-image` - Upload deal image
- `POST /api/upload/user-profile` - Upload user profile picture
- `DELETE /api/upload/:imageId` - Delete uploaded image

#### Frontend Components to Create:
- `ImageUploader.tsx` - Reusable image upload component with preview
- Update `restaurant-owner-dashboard.tsx` to allow logo/cover uploads
- Update `deal-creation.tsx` to allow deal image uploads
- Update `profile.tsx` to allow profile picture uploads

---

## 2. Golden Fork Award System ✅ Schema Ready

### Database Schema Added:
- `users.hasGoldenFork` - Boolean flag
- `users.goldenForkEarnedAt` - Timestamp when awarded
- `users.reviewCount` - Total reviews written
- `users.recommendationCount` - Total recommendations made
- `users.influenceScore` - Calculated score
- `awardHistory` table - Track all Golden Fork awards

### Criteria for Golden Fork Award:
- **10+ restaurant reviews** submitted
- **5+ restaurant recommendations** submitted
- **Active engagement** (favorites, deal usage)
- **Influence score** ≥ 100 points

### Influence Score Calculation:
```
influenceScore = (reviewCount * 10) + (recommendationCount * 15) + (favoritesCount * 5)
```

### Implementation Required:

#### API Endpoints:
- `GET /api/awards/golden-fork/eligible` - Check if user is eligible
- `POST /api/awards/golden-fork/claim` - Claim Golden Fork award
- `GET /api/awards/golden-fork/holders` - List all Golden Fork users
- `GET /api/user/:userId/influence-stats` - Get user's influence statistics

#### Background Jobs (Cron):
Create `scripts/awardGoldenForks.ts`:
- Run daily
- Calculate influence scores for all users
- Auto-award Golden Fork to eligible users
- Send email notification when awarded

#### Frontend Changes:
- Badge display on user profiles
- Golden Fork icon next to usernames in reviews/recommendations
- Show Golden Fork users' content first in listings
- Add "Path to Golden Fork" progress indicator in user dashboard

#### Sorting Logic Updates:
- `GET /api/deals/nearby` - Prioritize deals from restaurants recommended by Golden Fork users
- `GET /api/restaurants` - Show restaurants favorited by Golden Fork users first
- `GET /api/reviews/:restaurantId` - Show Golden Fork reviews first

---

## 3. Golden Plate Award System ✅ Schema Ready

### Database Schema Added:
- `restaurants.hasGoldenPlate` - Boolean flag
- `restaurants.goldenPlateEarnedAt` - Latest award timestamp
- `restaurants.goldenPlateCount` - Total times awarded (permanent record)
- `restaurants.rankingScore` - Calculated ranking score
- `awardHistory` table - Track all Golden Plate awards with period and geographic area

### Award Cycle:
- **Every 90 days** (quarterly)
- **Geographic-based**: Awards given per county/city
- **Top performers only**: Top 10% or minimum score threshold
- **Permanent badge**: Once earned, keeps Golden Plate forever (count increments)

### Ranking Score Calculation:
```
rankingScore = 
  (recommendationCount * 50) + 
  (favoritesCount * 30) + 
  (avgRating * 20) + 
  (totalDealClaims * 10) + 
  (totalDealViews * 1)
```

### Implementation Required:

#### API Endpoints:
- `GET /api/awards/golden-plate/winners` - List all Golden Plate restaurants
- `GET /api/awards/golden-plate/winners/:area` - Winners by geographic area
- `GET /api/awards/golden-plate/leaderboard/:area` - Current cycle rankings
- `GET /api/restaurants/:id/ranking-stats` - Get restaurant's ranking statistics

#### Background Jobs (Cron):
Create `scripts/awardGoldenPlates.ts`:
- Run every 90 days (quarterly)
- Calculate ranking scores for all restaurants in each geographic area
- Award Golden Plate to top performers
- Increment `goldenPlateCount` for winners
- Record award in `awardHistory` table
- Send email notifications to restaurant owners

#### Frontend Pages:
Create `client/src/pages/golden-plate-winners.tsx`:
- Showcase page listing all Golden Plate restaurants
- Filter by geographic area
- Sort by most awards (goldenPlateCount)
- Display award dates and achievements

#### Sorting Logic Updates:
- `GET /api/deals/nearby` - Show Golden Plate restaurant deals first
- `GET /api/deals/featured` - Prioritize Golden Plate restaurants
- `GET /api/restaurants` - Golden Plate restaurants always appear first in their area
- `GET /api/restaurants/search` - Golden Plate filter and sorting
- Home page featured section - Show Golden Plate winners

#### Restaurant Dashboard:
- Display Golden Plate badge prominently
- Show current ranking score and position
- Show progress toward next Golden Plate cycle
- Display Golden Plate count history

---

## 4. Additional Production Requirements

### Security:
- ✅ Rate limiting on image uploads (prevent spam)
- ✅ File size limits (max 5MB per image)
- ✅ File type validation (only jpg, png, webp)
- ✅ Image optimization/compression before storage
- ✅ Malware scanning for uploaded files (via Cloudinary)

### Performance:
- ✅ CDN for image delivery (Cloudinary provides this)
- ✅ Lazy loading for images
- ✅ Thumbnail generation for faster loading
- ✅ Database indexes on award/ranking fields (already added)

### Monitoring:
- Track image upload success/failure rates
- Monitor award distribution fairness
- Alert on suspicious ranking score changes
- Track Golden Fork/Golden Plate engagement metrics

### Email Notifications:
- Welcome email when Golden Fork awarded
- Quarterly Golden Plate award announcements
- Progress updates ("You're 2 reviews away from Golden Fork!")

---

## Implementation Priority

### Phase 1: Image Uploads (Essential for MVP)
1. Install Cloudinary SDK
2. Create upload API endpoints
3. Create ImageUploader component
4. Update restaurant dashboard for logo/cover uploads
5. Update deal creation for image uploads
6. Deploy with Cloudinary credentials

### Phase 2: Golden Fork Awards (High Engagement Feature)
1. Create award calculation script
2. Build API endpoints
3. Add badge UI components
4. Update sorting logic to prioritize Golden Fork content
5. Add progress indicators in user dashboard
6. Set up daily cron job

### Phase 3: Golden Plate Awards (Premium Feature)
1. Create quarterly award calculation script
2. Build leaderboard APIs
3. Create Golden Plate winners showcase page
4. Update sorting logic to prioritize Golden Plate restaurants
5. Add ranking stats to restaurant dashboard
6. Set up 90-day cron job
7. Create email notification system

---

## Next Steps

Run these commands to commit the schema changes:
```bash
npm run db:push
git add shared/schema.ts
git commit -m "Add Golden Fork, Golden Plate, and image upload schemas"
git push origin main
```

Then choose which phase to implement first!
