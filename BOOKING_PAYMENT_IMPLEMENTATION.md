# Event Booking & Payment System - Fixed $10 Platform Fee

## Business Model (Non-Negotiable)

**Host sets price**: $50 - $5,000 (their choice)  
**MealScout fee**: $10 (FIXED, never changes)  
**Truck pays**: Host price + $10

### Money Flow

- Host charges $300 → Truck pays $310
- Stripe Connect splits automatically:
  - $300 → Host's Stripe Connect account
  - $10 → MealScout platform account

## Database Schema Updates Needed

### 1. Add to `events` table

```sql
ALTER TABLE events
ADD COLUMN host_price_cents INTEGER, -- Host sets this, can be NULL for free events
ADD COLUMN requires_payment BOOLEAN DEFAULT false,
ADD COLUMN stripe_product_id VARCHAR(255), -- Stripe product for this event
ADD COLUMN stripe_price_id VARCHAR(255); -- Stripe price object
```

### 2. Create `event_bookings` table

```sql
CREATE TABLE event_bookings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  truck_id VARCHAR NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  host_id VARCHAR NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,

  -- Pricing (locked at booking time)
  host_price_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL DEFAULT 1000, -- Always $10
  total_cents INTEGER NOT NULL, -- host_price + platform_fee

  -- Payment
  status VARCHAR NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'cancelled' | 'refunded'
  stripe_payment_intent_id VARCHAR,
  stripe_payment_status VARCHAR, -- 'pending' | 'succeeded' | 'failed'
  paid_at TIMESTAMP,

  -- Stripe Connect
  stripe_application_fee_amount INTEGER DEFAULT 1000, -- Always $10
  stripe_transfer_destination VARCHAR, -- Host's Stripe Connect account ID

  -- Refunds
  refund_status VARCHAR, -- 'none' | 'partial' | 'full'
  refund_amount_cents INTEGER,
  refunded_at TIMESTAMP,
  refund_reason TEXT,

  -- Metadata
  booking_confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(event_id, truck_id)
);

CREATE INDEX idx_bookings_event ON event_bookings(event_id);
CREATE INDEX idx_bookings_truck ON event_bookings(truck_id);
CREATE INDEX idx_bookings_host ON event_bookings(host_id);
CREATE INDEX idx_bookings_status ON event_bookings(status);
CREATE INDEX idx_bookings_payment_intent ON event_bookings(stripe_payment_intent_id);
```

### 3. Update `hosts` table for Stripe Connect

```sql
ALTER TABLE hosts
ADD COLUMN stripe_connect_account_id VARCHAR(255), -- Stripe Connect account
ADD COLUMN stripe_connect_status VARCHAR(50), -- 'pending' | 'active' | 'restricted'
ADD COLUMN stripe_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN stripe_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT false;
```

## API Endpoints to Implement

### 1. Host Stripe Connect Onboarding

```typescript
POST /api/hosts/:hostId/stripe/onboard
// Creates Stripe Connect Express account
// Returns onboarding link
```

### 2. Create Event with Pricing

```typescript
POST /api/events
{
  hostId: string,
  name: string,
  date: string,
  startTime: string,
  endTime: string,
  hostPriceCents: number, // Host sets this
  requiresPayment: boolean
}
// If requiresPayment, creates Stripe Product + Price
```

### 3. Create Booking Payment Intent

```typescript
POST /api/events/:eventId/book
{
  truckId: string
}
// Returns:
{
  bookingId: string,
  clientSecret: string, // For Stripe Elements
  totalCents: number,
  breakdown: {
    hostPrice: number,
    platformFee: 1000
  }
}
```

### 4. Confirm Booking

```typescript
POST /api/bookings/:bookingId/confirm
// Called after Stripe payment succeeds
// Updates event.status = 'booked'
// Updates event.bookedRestaurantId
// Sends confirmation emails
```

### 5. Cancel Booking

```typescript
POST /api/bookings/:bookingId/cancel
{
  refundType: 'full' | 'host-only' | 'none',
  reason: string
}
```

## Stripe Connect Implementation

### Host Onboarding Flow

```typescript
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 1. Create Connect Express account
const account = await stripe.accounts.create({
  type: "express",
  country: "US",
  email: host.email,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  business_type: "individual",
  metadata: {
    hostId: host.id,
    businessName: host.businessName,
  },
});

// 2. Create onboarding link
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `https://mealscout.us/host-dashboard?setup=refresh`,
  return_url: `https://mealscout.us/host-dashboard?setup=complete`,
  type: "account_onboarding",
});

// Save account.id to host.stripe_connect_account_id
```

### Payment Intent Creation (The Critical Part)

```typescript
router.post("/api/events/:eventId/book", async (req, res) => {
  const { eventId } = req.params;
  const { truckId } = req.body;
  const userId = req.user.id;

  // 1. Get event and validate
  const event = await storage.getEvent(eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (event.status !== "open")
    return res.status(400).json({ error: "Event not available" });

  // 2. Get host and verify Stripe Connect setup
  const host = await storage.getHost(event.hostId);
  if (!host.stripe_connect_account_id || !host.stripe_charges_enabled) {
    return res.status(400).json({ error: "Host payment setup incomplete" });
  }

  // 3. Calculate pricing (FIXED FORMULA)
  const hostPriceCents = event.host_price_cents || 0;
  const platformFeeCents = 1000; // ALWAYS $10
  const totalCents = hostPriceCents + platformFeeCents;

  // 4. Create booking record
  const booking = await storage.createEventBooking({
    eventId,
    truckId,
    hostId: event.hostId,
    host_price_cents: hostPriceCents,
    platform_fee_cents: platformFeeCents,
    total_cents: totalCents,
    status: "pending",
    stripe_transfer_destination: host.stripe_connect_account_id,
  });

  // 5. Create Stripe PaymentIntent with Connect
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "usd",
    application_fee_amount: platformFeeCents, // ← THE MAGIC $10
    transfer_data: {
      destination: host.stripe_connect_account_id,
    },
    metadata: {
      bookingId: booking.id,
      eventId: event.id,
      hostId: host.id,
      truckId: truckId,
      hostPrice: hostPriceCents,
      platformFee: platformFeeCents,
    },
  });

  // 6. Save payment intent ID
  await storage.updateBooking(booking.id, {
    stripe_payment_intent_id: paymentIntent.id,
  });

  res.json({
    bookingId: booking.id,
    clientSecret: paymentIntent.client_secret,
    totalCents,
    breakdown: {
      hostPrice: hostPriceCents,
      platformFee: platformFeeCents,
    },
  });
});
```

### Webhook Handler (Critical for Confirmation)

```typescript
app.post("/api/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.bookingId;

    // Update booking
    await storage.updateBooking(bookingId, {
      status: "confirmed",
      stripe_payment_status: "succeeded",
      paid_at: new Date(),
      booking_confirmed_at: new Date(),
    });

    // Update event
    const booking = await storage.getBooking(bookingId);
    await storage.updateEvent(booking.eventId, {
      status: "booked",
      bookedRestaurantId: booking.truckId,
    });

    // Send confirmations
    // await sendBookingConfirmationEmail(booking);
  }

  res.json({ received: true });
});
```

## Frontend Flow

### 1. Event Listing (Truck View)

```tsx
<EventCard>
  <h3>{event.name}</h3>
  <p>
    {event.date} - {event.startTime}
  </p>
  {event.requiresPayment && (
    <div className="pricing">
      <span>Host Price: ${(event.host_price_cents / 100).toFixed(2)}</span>
      <span>Platform Fee: $10.00</span>
      <span className="font-bold">
        Total: ${((event.host_price_cents + 1000) / 100).toFixed(2)}
      </span>
    </div>
  )}
  <Button onClick={() => bookEvent(event.id)}>Book This Slot</Button>
</EventCard>
```

### 2. Payment Modal

```tsx
const BookEventModal = ({ eventId, onSuccess }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [booking, setBooking] = useState(null);

  const initiateBooking = async () => {
    const res = await apiRequest("POST", `/api/events/${eventId}/book`, {
      truckId: currentTruck.id,
    });
    setClientSecret(res.clientSecret);
    setBooking(res);
  };

  return (
    <Dialog>
      <h2>Confirm Booking</h2>
      {booking && (
        <>
          <div className="breakdown">
            <p>
              Host Location Fee: $
              {(booking.breakdown.hostPrice / 100).toFixed(2)}
            </p>
            <p>MealScout Platform Fee: $10.00</p>
            <hr />
            <p className="total">
              Total: ${(booking.totalCents / 100).toFixed(2)}
            </p>
          </div>

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                onSuccess={() => {
                  toast.success("Booking confirmed!");
                  onSuccess();
                }}
              />
            </Elements>
          )}
        </>
      )}
    </Dialog>
  );
};
```

## Terms of Service Language (Required)

Add to your ToS:

```
## Booking & Payment Terms

### Host Pricing
Hosts independently set prices for their event slots. MealScout does not control,
suggest, or mandate host pricing.

### Platform Coordination Fee
MealScout charges a fixed $10 platform coordination fee per booking. This fee does
not vary based on the host's price and is charged separately as a service fee for
facilitating the connection between hosts and food trucks.

### Payment Processing
- Total payment = Host's price + $10 MealScout fee
- All payments processed via Stripe
- Host receives their full asking price
- MealScout receives only the $10 coordination fee

### Refund Policy
Cancellations and refunds are handled according to the host's individual cancellation
policy. The platform coordination fee may be retained by MealScout to cover
administrative costs.
```

## Testing Checklist

- [ ] Stripe Connect Test Mode configured
- [ ] Host onboards successfully
- [ ] Event created with $300 host price
- [ ] Booking initiated: shows $310 total ($300 + $10)
- [ ] Payment succeeds
- [ ] Stripe dashboard shows:
  - [ ] $310 charged from customer
  - [ ] $300 transferred to host Connect account
  - [ ] $10 application fee in MealScout account
- [ ] Event status updates to 'booked'
- [ ] Confirmation emails sent
- [ ] Test refund (full vs host-only)

## Edge Cases Handled

### Free Events

```typescript
if (!event.host_price_cents || event.host_price_cents === 0) {
  // No payment required, instant booking
  await storage.createEventBooking({
    eventId,
    truckId,
    hostId: event.hostId,
    host_price_cents: 0,
    platform_fee_cents: 0, // Free events = no MealScout fee either
    total_cents: 0,
    status: "confirmed",
  });
}
```

### Host Changes Price Mid-Booking

- Price is locked when PaymentIntent is created
- Stored in `event_bookings.host_price_cents`
- Even if event.host_price_cents changes, booking uses locked value

### Refunds

```typescript
// Option 1: Refund everything (rare)
await stripe.refunds.create({
  payment_intent: booking.stripe_payment_intent_id,
  reverse_transfer: true, // Also reverses the host transfer
  refund_application_fee: true, // Also refunds MealScout's $10
});

// Option 2: Refund host only (common for cancellations)
await stripe.refunds.create({
  payment_intent: booking.stripe_payment_intent_id,
  amount: booking.host_price_cents,
  reverse_transfer: true,
  refund_application_fee: false, // Keep MealScout's $10
});
```

## Migration Plan

1. **Phase 1**: Add database columns (non-breaking)
2. **Phase 2**: Implement Stripe Connect onboarding for hosts
3. **Phase 3**: Add payment to event creation (optional)
4. **Phase 4**: Build booking flow
5. **Phase 5**: Test end-to-end in Stripe test mode
6. **Phase 6**: Gradual rollout (start with opt-in)

## Revenue Projections

If you get 100 bookings/month:

- 100 bookings × $10 = **$1,000 MRR** from coordination fees
- Plus restaurant subscriptions ($25-50/mo)
- Zero complexity scaling (fee never changes)

## Legal Protection Summary

✅ **Not price-fixing**: Hosts set their own prices  
✅ **Not an employer**: You're a platform, not hiring trucks  
✅ **Not an agency**: Transparent fixed fee, not commission  
✅ **Tax simple**: You only report your $10/booking, not host revenue  
✅ **Stripe handles compliance**: 1099-K reporting, state sales tax, etc.

---

**This is the cleanest possible payment architecture.**  
No percentage math. No disputes. No edge cases.  
Just a simple $10 per booking, forever.
