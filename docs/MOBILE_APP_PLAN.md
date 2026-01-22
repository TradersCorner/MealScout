# MealScout Mobile App Plan (Fast Track)

Phase 1 — Decide fastest wrapper (1 day)
- Use Capacitor (recommended for Vite/React) or Expo (only if migrating).
- Goal: native shells reusing current web app.

Phase 2 — Mobile prep (2–4 days)
- Audit mobile blockers: auth cookies, deep links, geolocation permissions, push notifications.
- Add app icons, splash, and mobile-safe nav.
- Ensure API base URL is prod and HTTPS.

Phase 3 — Build native shells (1–2 days)
- Create iOS + Android projects.
- Set permissions (location, camera/photo if used).
- Add status bar safe area + keyboard behavior fixes.

Phase 4 — Store requirements (2–5 days)
- Apple Developer + Google Play accounts (if not done).
- App Store listing: screenshots, privacy policy, terms, support URL.
- App Privacy + Google Data Safety forms.

Phase 5 — Test + submit (3–7 days)
- Test core flows: signup/login, booking, host listing, payments.
- iOS TestFlight + Android internal testing.
- Submit to stores.

Next actions (if approved)
1) Add Capacitor to the repo and generate native shells.
2) Generate icons/splash assets.
3) Prepare store checklist + copy.
