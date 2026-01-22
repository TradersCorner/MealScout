# MealScout Features Cheatsheet (Sales)

Quick positioning
- MealScout is the booking and discovery layer for food trucks and hosts.
- Trucks book parking pass slots. Hosts list parking passes (one per address).
- MealScout is not a marketplace, employer, or operator.

Food trucks 
- Free to join. Parking pass booking is always available.
- Premium $25/mo unlocks full access; 30-day trial after account creation.
- Public profile that acts like a website (menu, photos, socials, contact).
- Live GPS button for instant map presence (premium).
- Editable schedule with booking calendar view (premium).
- Discover/search parking pass spots and book.
- Notifications for booking updates and schedule changes.
- Minimal effort to get results: list once, set availability, get booked.

Hosts 
- Create a host profile per address.
- Create one parking pass per address.
- Set number of spots and slot pricing.
- Stripe Connect required to receive bookings.

Parking pass model
- Parking Pass (host side) = an address listing.
- Spots = number of physical parking spaces at that address.
- Slots = time blocks (breakfast, lunch, dinner, daily, weekly).
- Blackout dates are per parking pass (not per host).
- Trucks book slots with payment; first come, first served.

Events
- Only event coordinators create/manage events.
- All users can view upcoming events.
- Only food trucks can contact coordinators to get booked.
- Events are separate from parking pass.

Restaurants and bars (premium)
- Public profile that acts like a website (menu, photos, specials).
- Deal creation and promotions.
- Analytics and audience insights.
- Schedule and operating hours management.

Diner features
- Discover nearby food trucks and restaurants.
- Map view and local search.
- Save favorites and follow updates.
- Recommendations feed and video feed.
- Golden Fork: award for top local contributors to recommendations.
- Golden Plate: award for top trucks and restaurants in an area.

Affiliate system
- Every user is an affiliate (admin/super admin excluded).
- Dedicated affiliate tag (editable) used in shared links.
- All shared links automatically carry affiliate credit.
- Credits are platform credits first; manual cashouts only.

Bookings and payments
- No pay = no booking. Booking is created after payment success.
- $10 platform fee is added to what the truck pays.
- Processing fees are deducted from the host payout.
- If double-booked, earliest payer keeps the spot; later payer gets credit for that slot.

Compliance and liability
- Hosts and trucks handle licenses, permits, insurance, taxes.
- MealScout has zero liability for on-site operations.
