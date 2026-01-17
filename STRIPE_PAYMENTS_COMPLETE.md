# Stripe Payment Integration - Complete

## ✅ Implementation Summary

MealScout now has full Stripe payment integration for the Parking Pass (host location bookings).

### Business Model

- **Hosts set their price**: $0 - $5000 (their choice)
- **MealScout adds $10 fee**: Fixed platform coordination fee
- **Trucks see final price**: Host price + $10 (no hidden fees)

Fee model (direct charges):

- Stripe processing fees are deducted from the host’s Stripe account.
- MealScout still receives the full $10 application fee.

Example:

- Host sets price: $50
- Truck sees and pays: **$60** ($50 + $10)
- Stripe deducts its processing fee from the host’s account
- Host nets: ~$50 minus Stripe fees
- MealScout receives: $10 (application fee)

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

### ✅ Stripe Elements Implementation

**Component Created**: `client/src/components/booking-payment-modal.tsx`

A reusable booking payment modal that:

- Fetches `clientSecret` from `/api/events/:eventId/book`
- Displays pricing breakdown (host price + $10 platform fee)
- Integrates Stripe Payment Element for secure card input
- Handles payment confirmation and webhooks
- Shows loading states and error handling

**Usage in Truck Discovery** (`client/src/pages/truck-discovery.tsx`):

```tsx
import { BookingPaymentModal } from "@/components/booking-payment-modal";

// In component
const [bookingModalOpen, setBookingModalOpen] = useState(false);
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

const handleBookNow = (event: Event) => {
  setSelectedEvent(event);
  setBookingModalOpen(true);
};

// Render modal
<BookingPaymentModal
  open={bookingModalOpen}
  onOpenChange={setBookingModalOpen}
  eventId={selectedEvent.id}
  truckId={myRestaurantId}
  eventDetails={{
    name: event.host.businessName,
    date: format(new Date(event.date), "MMMM d, yyyy"),
    startTime: event.startTime,
    endTime: event.endTime,
    hostName: event.host.businessName,
    hostPrice: event.hostPriceCents,
  }}
  onSuccess={handleBookingSuccess}
/>;
```

Events with `requiresPayment: true` now show:

- Orange pricing badge with total cost
- "Book Now & Pay" button (instead of "Express Interest")
- Payment modal on click

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

### ✅ Stripe Connect Onboarding Implemented

**Location**: `client/src/pages/host-dashboard.tsx`

Added prominent alert banner at top of dashboard when payments not enabled:

```tsx
{
  !host.stripeChargesEnabled && (
    <Alert className="mb-6 border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900">
        Enable Payments to Accept Bookings
      </AlertTitle>
      <AlertDescription className="text-orange-800">
        <p className="mb-3">
          Set up payments to receive booking fees from trucks. You set your
          price ($0-$5,000), MealScout adds a fixed $10 coordination fee.
        </p>
        <Button
          onClick={handleEnablePayments}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Enable Payments with Stripe
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

**Flow**:

1. Host clicks "Enable Payments with Stripe"
2. Calls `POST /api/hosts/stripe/onboard`
3. Redirects to Stripe Connect Express onboarding
4. Returns to dashboard with `stripeChargesEnabled: true`
5. Alert disappears, host can now create paid events

---

## Testing

### Test Mode

1. Use Stripe test keys (sk*test*..., pk*test*...)
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
6. ✅ Add Stripe Elements to booking flow
7. ✅ Host dashboard Stripe Connect button
8. 🔲 Test with Stripe test mode
9. 🔲 Configure production webhook
10. 🔲 Launch! 🚀
