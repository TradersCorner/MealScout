# Stripe Payment Integration - Complete

## ✅ Implementation Summary

MealScout now has full Stripe payment integration for the Parking Pass (host location bookings).

### Business Model

- **Hosts set their price**: $0 - $5000 (their choice)
- **MealScout adds $10 fee**: Fixed platform coordination fee
- **Trucks see final price**: Host price + $10 (no hidden fees)

Example:
- Host sets price: $50
- Truck sees and pays: **$60** ($50 + $10)
- Host receives: $50 to their Stripe account
- MealScout receives: $10 platform fee

---

## Database Schema

### Migration: `016_add_stripe_payments.sql`

Added:
1. **hosts table** - Stripe Connect fields for payment receiving
2. **events table** - Pricing fields (hostPriceCents, requiresPayment)
3. **event_bookings table** - Payment tracking with locked pricing

Run migration:
```bash
# Apply to production database
psql $DATABASE_URL -f migrations/016_add_stripe_payments.sql
```

---

## API Endpoints

### Host Onboarding

**POST /api/hosts/stripe/onboard**
- Creates Stripe Connect Express account for host
- Returns onboarding URL
- Host completes Stripe identity verification

**GET /api/hosts/stripe/status**
- Check if host's Stripe account is ready
- Returns: chargesEnabled, payoutsEnabled, onboardingCompleted

### Event Booking

**POST /api/events/:eventId/book**
Request:
```json
{
  "truckId": "restaurant-id"
}
```

Response:
```json
{
  "bookingId": "booking-id",
  "clientSecret": "pi_xxx_secret_yyy",
  "totalCents": 6000,
  "breakdown": {
    "hostPrice": 5000,
    "platformFee": 1000
  }
}
```

### Webhooks

**POST /api/stripe/webhook**
Handles:
- `payment_intent.succeeded` → Confirms booking, updates event status
- `payment_intent.payment_failed` → Cancels booking

---

## Frontend Integration

### Parking Pass UI

Updated to show **only final price** (host + $10):
- Slot cards show total price prominently
- "Includes all fees" disclaimer
- No price breakdown visible to trucks

### Required: Stripe Elements

Add to your booking confirmation screen:
```tsx
import { Elements, PaymentElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY);

function BookingCheckout({ clientSecret, amount }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentElement />
      <button>Pay ${(amount / 100).toFixed(2)}</button>
    </Elements>
  );
}
```

---

## Environment Variables

### Backend (.env)
```bash
STRIPE_SECRET_KEY=sk_test_... # or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe dashboard
```

### Frontend (.env)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_...
```

---

## Host Dashboard Integration

Add Stripe Connect button:
```tsx
function HostDashboard() {
  const enablePayments = async () => {
    const res = await fetch("/api/hosts/stripe/onboard", { method: "POST" });
    const { onboardingUrl } = await res.json();
    window.location.href = onboardingUrl; // Redirect to Stripe
  };

  return (
    <div>
      {!host.stripeChargesEnabled && (
        <Button onClick={enablePayments}>
          Enable Payments to Accept Bookings
        </Button>
      )}
    </div>
  );
}
```

---

## Testing

### Test Mode
1. Use Stripe test keys (sk_test_..., pk_test_...)
2. Create test event with pricing
3. Book with test truck
4. Use test card: `4242 4242 4242 4242`
5. Verify booking confirmed via webhook

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

---

## Production Deployment

### Step 1: Apply Migration
```bash
psql $DATABASE_URL -f migrations/016_add_stripe_payments.sql
```

### Step 2: Configure Stripe
1. Go to Stripe Dashboard → Developers → API Keys
2. Copy live secret key → Set `STRIPE_SECRET_KEY`
3. Copy publishable key → Set `VITE_STRIPE_PUBLISHABLE_KEY`

### Step 3: Setup Webhook
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://mealscout.us/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.updated` (existing)
4. Copy signing secret → Set `STRIPE_WEBHOOK_SECRET`

### Step 4: Deploy Code
```bash
git add .
git commit -m "Add Stripe payment integration for parking pass"
git push origin main
```

### Step 5: Test End-to-End
1. Create host account
2. Complete Stripe Connect onboarding
3. Create event with pricing
4. Book as truck with real card
5. Verify payment received in Stripe Dashboard

---

## Revenue Tracking

### Platform Revenue
- Every confirmed booking = **$10 to MealScout**
- Tracked in `event_bookings.platform_fee_cents`
- Stripe Dashboard → Balance → Application Fees

### Host Payouts
- Hosts receive their set price directly
- Stripe handles payouts to host bank accounts
- Standard: 2-day transfer, or Instant Payouts (fees apply)

---

## Legal & Compliance

### Price Transparency
✅ Trucks see final price upfront (host + $10)  
✅ No hidden fees or surprises  
✅ Clear "includes all fees" messaging

### Terms of Service
Add to your ToS:
```
MealScout charges a fixed $10 platform coordination fee per booking.
Hosts independently set their location prices.
Total payment = Host price + $10 MealScout fee.
```

### Tax Reporting
- Stripe handles 1099-K reporting for hosts
- You report only your $10/booking revenue
- Consult tax professional for specific guidance

---

## Support

### Host Payment Issues
- Check Stripe Connect status: `/api/hosts/stripe/status`
- Verify identity verification completed
- Check for account restrictions in Stripe Dashboard

### Failed Payments
- Automatically marked as cancelled
- Truck notified via UI
- Can retry booking if event still available

### Refunds
Not yet implemented - add manual refund flow:
```tsx
// Future: Admin refund endpoint
POST /api/admin/bookings/:id/refund
{ "reason": "Host cancelled event" }
```

---

## Next Steps

1. ✅ Migration applied
2. ✅ Schema updated
3. ✅ API endpoints created
4. ✅ UI updated to show total price
5. ✅ Webhooks handle confirmation
6. 🔲 Add Stripe Elements to booking flow
7. 🔲 Host dashboard Stripe Connect button
8. 🔲 Test with Stripe test mode
9. 🔲 Configure production webhook
10. 🔲 Launch! 🚀
