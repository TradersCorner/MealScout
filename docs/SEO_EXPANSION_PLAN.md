# SEO Expansion Plan (Locked)

Goals
- Harden technical SEO and expand crawlable pages without penalties.
- Make MealScout discoverable for cuisine types, food trucks, events, and local business growth.
- Keep content consistent and user-useful, not hidden/doorway pages.

Phase 0 — Audit + Fixes (same day)
- Fix canonical/domain mismatches (`mealscout.us` vs `.com`).
- Remove accidental `noindex` where not intended.
- Verify `robots.txt` and `sitemap.xml` are correct and indexable.
- Add structured data: Organization, Website, WebPage, Breadcrumbs.
- Add OpenGraph/Twitter tags site-wide.

Phase 1 — Core Landing System (1–2 days)
- Shared landing layout + config (already started).
- Role landings: trucks, restaurants, bars, hosts, events, diners.
- Add hub pages:
  - `/cuisines`
  - `/cities`
  - `/food-trucks`
  - `/events`
  - `/growth`
- Each hub links to all child pages for crawlability.

Phase 2 — Cuisine + City Expansion (1–2 days)
- Cuisine pages: `/cuisine/:slug`
- City pages: `/city/:slug`
- City + cuisine: `/city/:citySlug/:cuisineSlug`
- Schema: FoodEstablishment, LocalBusiness, Place, FAQ.
- Use DB data when available; fallback to curated copy.

Phase 3 — Food Truck + Event SEO (2–3 days)
- Truck listing pages:
  - `/trucks`
  - `/trucks/:city`
  - `/truck/:slug` (if data exists)
- Event listing pages:
  - `/events`
  - `/events/:city`
  - `/event/:slug`
- Add Event schema + availability metadata.

Phase 4 — Content Authority (ongoing)
- Publish real content pages tied to the platform:
  - “How hosts make revenue”
  - “Food truck booking guide”
  - “Local discovery playbook”
- Add internal links from every relevant page.

Phase 5 — Index Monitoring + Iteration (ongoing)
- Search Console verification and monitoring.
- Fix any blocked or duplicate URLs quickly.
- Expand long-tail pages based on top queries.

Notes
- Avoid hidden/cloaked pages. Keep every page user-useful and crawlable.
- Consistency lives in shared components/config for easy edits.
