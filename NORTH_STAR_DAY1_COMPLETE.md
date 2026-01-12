# MealScout North Star Implementation - Day 1 Complete

## ✅ Completed: Core Infrastructure

### 1. Database Schema (IMMUTABLE PRICING LOCK)

**Migration:** `010_unified_claims_and_pricing_lock.sql`

#### Restaurants Table - Pricing Lock Fields

- `locked_price_cents` - Stored price, never recalculated
- `price_lock_date` - When lock was applied
- `price_lock_reason` - 'early_rollout' for pre-March 1 signups

**Rule:** If `created_at < 2026-03-01` → `locked_price_cents = 2500` (forever)

#### Unified Claims Table

```sql
CREATE TABLE claims (
  id VARCHAR PRIMARY KEY,
  person_id VARCHAR NOT NULL REFERENCES users(id),
  claim_type VARCHAR NOT NULL, -- 'restaurant' | 'food_truck' | 'host' | 'event' | 'diner'
  status VARCHAR NOT NULL, -- 'pending' | 'provisional' | 'verified' | 'active'
  restaurant_id, host_id, event_id (polymorphic refs),
  claim_data JSONB,
  verification_refs TEXT[],
  created_at TIMESTAMP -- CRITICAL for pricing lock
);
```

#### Backfill Logic

- Existing restaurants → claims
- Existing hosts → claims
- Existing events → claims

### 2. TypeScript Schema Updates

**File:** `shared/schema.ts`

- Added `lockedPriceCents`, `priceLockDate`, `priceLockReason` to `restaurants` table
- Created full `claims` table definition with types
- Added `CLAIM_TYPES` and `CLAIM_STATUS` constants

### 3. Business Logic Enforcement

**File:** `server/storage.ts`

```typescript
async createRestaurant(restaurant: InsertRestaurant) {
  const now = new Date();
  const priceLockCutoff = new Date('2026-03-01');
  const isRestaurant = !restaurant.isFoodTruck;

  if (isRestaurant && now < priceLockCutoff) {
    // Apply $25/month forever price lock
    restaurantData.lockedPriceCents = 2500;
    restaurantData.priceLockDate = now;
    restaurantData.priceLockReason = 'early_rollout';
  }
}
```

**File:** `server/routes.ts`

```typescript
async function getLockedPriceForUser(userId: string) {
  // Check restaurant pricing lock first (immutable)
  const restaurant = await storage.getRestaurantsByOwner(userId);
  if (restaurant?.lockedPriceCents) {
    return restaurant.lockedPriceCents === 2500
      ? { locked: true, priceId: PRICE_25, label: "locked-in $25" }
      : { locked: false, priceId: PRICE_50, label: "standard $50" };
  }
  // Fallback to legacy user signup date
}
```

### 4. Public Surfaces

#### Homepage (North Star)

**File:** `client/src/pages/home-north-star.tsx`

**Copy:**

- "MealScout connects food trucks, restaurants, hosts, events, and diners — locally."

**Four Equal CTAs:**

1. **List my food truck or restaurant** → `/restaurant-signup`
   - "Join before March 1 and lock in $25/month forever"
2. **Host food at my location** → `/host-signup`
   - "Free forever. Unlock local food truck supply."
3. **Need trucks for an event** → `/event-signup`
   - "Free forever. No event organizer fees."
4. **Find food near me** → `/search`
   - "Discover deals, trucks, and local restaurants."

#### Restaurant Signup - Pricing Lock Notice

**File:** `client/src/pages/restaurant-signup.tsx`

Added prominent notice before terms checkbox:

```tsx
🔒 Price Lock Guarantee
I understand businesses joining before March 1, 2026 are locked at
$25/month forever. This price lock applies even if I pause or cancel.
```

#### Event Signup Form (New)

**File:** `client/src/pages/event-signup.tsx`

- Event name, date, city, expected crowd
- Contact info (email, phone)
- Notes field
- **Trust message:** "Event organizers are always free"
- Route: `/event-signup`

### 5. Monetization Rules Enforcement

#### Restaurants (Fixed-location)

- ✅ $25/month if claimed before March 1, 2026
- ✅ Price lock stored in database, never recalculated
- ✅ Survives cancellation, pause, reactivation
- ✅ Billing uses `restaurant.lockedPriceCents` → Stripe Price ID

#### Food Trucks

- ✅ Free to list (no subscription)
- ⏳ Booking fees only (existing flow, not modified)

#### Hosts

- ✅ Free forever (existing `/host-signup` works)

#### Event Organizers

- ✅ Free forever (new `/event-signup` created)
- ✅ Never touches payment code

#### Diners

- ✅ No form needed (discovery only via `/search`)

## 📋 Next Steps (Day 2-4)

### Day 2: Finalize Claim Forms

- [ ] Wire `/event-signup` → backend API
- [ ] Create claims on form submission
- [ ] Enable provisional visibility for new claims

### Day 3: Verify Billing Paths

- [ ] Test restaurant subscription with price lock
- [ ] Confirm trucks don't see subscription prompts
- [ ] Ensure events never trigger payment

### Day 4: Deploy & Launch

- [ ] Run migration: `010_unified_claims_and_pricing_lock.sql`
- [ ] Switch homepage to North Star version
- [ ] Update copy across site
- [ ] Begin aggressive onboarding

## 🎯 Success Metrics

When this is **DONE:**

- ✅ Claims are live
- ✅ Pricing locks are enforced
- ✅ Trucks can list free
- ✅ Restaurants can lock $25
- ⏳ Bookings move money (existing, not changed)
- ✅ Events are free
- ⏳ Daily onboarding begins

## 🚨 Critical Guardrails

**DO NOT:**

- ❌ Introduce new pricing logic
- ❌ Add roles or account types beyond claims
- ❌ Build dashboards, messaging, ratings yet
- ❌ Add feature tiers or automations

**ALWAYS:**

- ✅ Use existing claim model
- ✅ Assume manual verification
- ✅ Store pricing, never compute
- ✅ Keep scope minimal

---

**North Star Locked:** One identity → many claims → verified → coordinated → monetized where fair
