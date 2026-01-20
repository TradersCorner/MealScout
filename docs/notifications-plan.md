# Notifications Plan (Post-Launch)

## Goals
- Route location-aware updates to users without spamming or extra cost.
- Prefer free push where possible; use email/SMS for essential alerts only.
- Respect opt-in, quiet hours, and role-specific relevance.

## Channels
1) Push (Web Push)
2) Email (Brevo)
3) SMS (Brevo)

## Triggers (Phase 1)
- Deal nearby (adaptive 2-5 miles)
- Truck location update for followers
- New events within 10 miles
- Weekly local digest (top rated, new joins)

## Triggers (Phase 2)
- Parking pass reminders (upcoming slot)
- Host capacity warnings
- Event coordinator booking status changes

## Priority Rules
- Push first for non-essential updates.
- Email/SMS for essential updates (booking confirmations, cancellations, payment receipts).

## Data Needed
- User notification preferences (channels, categories, quiet hours)
- Follows: user -> truck
- Location opt-in + last known location (coarse precision)
- Local density score for adaptive radius

## Proposed Endpoints
- POST /api/notifications/preferences
- POST /api/notifications/subscribe-push
- POST /api/notifications/unsubscribe-push
- POST /api/notifications/test

## Delivery Logic
- Determine category -> choose channel (push/email/SMS).
- Deduplicate within time window (e.g., 30 minutes).
- Store delivery status for audit + retries.

## Push Setup Notes
- Requires VAPID keys + service worker.
- Store user subscriptions in DB.
- Only send after explicit opt-in.

