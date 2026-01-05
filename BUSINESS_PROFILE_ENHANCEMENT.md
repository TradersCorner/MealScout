# Business Profile Enhancement - Complete

## Overview
Enhanced the business signup flow to capture complete profile information needed for:
- Customer-facing deal cards and search results
- LLM crawlability (especially Scout)
- Social media integration (video stories)
- Trust signals and discovery

## What Was Added

### Database Schema (`shared/schema.ts`)
Added fields to `restaurants` table:
- `description` (text) - About the business
- `websiteUrl` (varchar) - Business website
- `instagramUrl` (varchar) - Instagram profile
- `facebookPageUrl` (varchar) - Facebook business page
- `amenities` (jsonb) - Structured amenities data

### Signup Form (`client/src/pages/restaurant-signup.tsx`)
New "Business Profile" section added AFTER basic details:

**Text Fields:**
- Description (optional, 500 char max)
- Website URL (optional)
- Instagram URL (optional)
- Facebook Page URL (optional)

**Amenities (checkboxes):**
- Parking Available
- Free Wi-Fi
- Outdoor Seating

**Special Note:**
- Blue info box explains that food trucks and bars can set operating hours later
- All profile fields are optional to accommodate unpredictable schedules

### Validation (`shared/schema.ts`)
Extended `insertRestaurantSchema` with:
- URL validation for social/web fields
- Empty string allowed (converts to null)
- Amenities as optional JSONB object
- Description limited to 500 characters

### Server Handling (`server/routes.ts`)
Existing `/api/restaurants/signup` route automatically handles new fields via `insertRestaurantSchema` validation.

New data structure sent to server:
```typescript
restaurantData: {
  // ... existing fields ...
  description: string | undefined,
  websiteUrl: string | undefined,
  instagramUrl: string | undefined,
  facebookPageUrl: string | undefined,
  amenities: {
    parking: boolean,
    wifi: boolean,
    outdoor_seating: boolean
  }
}
```

## Migration
Run this SQL migration on production:
```sql
migrations/001_add_restaurant_profile_fields.sql
```

## User Flow
1. User clicks "CREATE ACCOUNT" on `/customer-signup?role=business`
2. Creates user account (email, password, name, phone)
3. Redirected to `/restaurant-signup`
4. Fills basic info (name, address, type, cuisine)
5. **NEW:** Fills business profile section (description, social, amenities)
6. Submits → complete profile created

## Benefits
- **For Customers:** Richer profiles help decision-making
- **For LLMs:** Structured data + descriptions enable better crawling
- **For Scout AI:** Can reference social links, amenities, hours flexibility
- **For Businesses:** One-time setup, everything populated from day one
- **For Food Trucks/Bars:** Flexibility acknowledged (hours can be set later)

## Next Steps
1. Run migration: `migrations/001_add_restaurant_profile_fields.sql`
2. Test signup flow end-to-end
3. Update deal cards to display new profile data where relevant
4. Add profile editing in restaurant dashboard
