# Event Open Calls (Phase 2 Scoping)

**Status:** Proposed / Draft
**Dependency:** Capacity Guard v2.2 (Locked)

## Goal
Extend the "Host Event" model to support larger, multi-day, or recurring "Open Calls" for organizers (e.g., Festivals, Weekly Markets, Corporate Parks).

## Core Requirements (Draft)

1.  **Multi-Day / Recurring Support**
    - Instead of single `date`, support `startDate`, `endDate`, or `recurringDays`.
    - Batch creation of child events or a single "Series" parent object.

2.  **Capacity Management (Inherited)**
    - Apply "Capacity Guard v2.2" logic to the series or individual days.
    - Global Cap vs. Per-Day Cap? (Likely Per-Day).

3.  **Application Flow**
    - Trucks apply to the "Series" or specific dates within it.
    - "Select all dates I can do" vs "Apply to Series".

4.  **Organizer Tools**
    - "Accept All for Series" vs "Pick and Choose".
    - Consolidated interest view.

## TradeScout Alignment
- **Intent-Gated**: Organizers actively request trucks. Trucks actively apply.
- **No Pay-to-Play**: Ranking based on fit/time, not payment.

## Technical Questions to Resolve
- Schema: strict `events` expansion vs new `event_series` table?
- UI: How to display 30 days of a month-long market without clutter?

## Proposed Data Model (Draft)

1) `event_series`
    - `id`, `hostId`, `name`, `description`, `timezone`
    - `startDate`, `endDate`
    - `recurrenceRule` (RFC5545 string) **or** `recurrencePattern` (e.g., weekly + daysOfWeek)
    - Defaults applied to generated events: `defaultStartTime`, `defaultEndTime`, `defaultMaxTrucks`, `defaultHardCapEnabled`
    - Status: `draft` | `published` | `closed`

2) `events` (reuse existing)
    - Add optional `seriesId` FK to `event_series`
    - Each occurrence is a regular `events` row (carries `hardCapEnabled`, `maxTrucks`, times). Capacity Guard v2.2 applies unchanged.

3) Generation + Overrides
    - On series publish, generate child `events` rows for each occurrence date.
    - Hosts can edit a single occurrence (overrides the generated defaults in `events`).
    - Deleting a series should soft-close remaining future occurrences, not hard-delete.

4) Interests (reuse existing)
    - Trucks express interest per occurrence (`event_interests` unchanged).
    - Optionally allow “apply to all occurrences I selected” by batching interest creation per chosen dates.

5) Telemetry (reuse + extend)
    - Add `seriesId` to telemetry properties where relevant (creation, interest submitted, acceptance, capacity blocked).

## API Surfaces (Draft)

- POST `/api/hosts/event-series` → create series (draft).
- POST `/api/hosts/event-series/:seriesId/publish` → generate occurrences (`events` rows) and open for interest.
- GET `/api/hosts/event-series` → list series with rollups (upcoming occurrences, fill stats).
- GET `/api/hosts/event-series/:seriesId/occurrences` → list child `events` with capacity + interests counts.
- PATCH `/api/hosts/events/:eventId` → per-occurrence overrides (times, capacity, hard cap flag).
- Interests + acceptance stay on existing endpoints (`/api/hosts/interests/:id/status`), one occurrence at a time.

## Guardrails (locked)

- Capacity Guard v2.2 continues to enforce per occurrence (`events` row).
- No marketplace behaviors: no paid placement, no booking guarantees.
- Recurrence generation must respect timezone stored on series; times are applied in that zone.
- Publication is explicit: nothing is discoverable until the series is published and occurrences are generated.

## Open Questions to Confirm

- Max recurrence span to allow? (e.g., 90 days, 180 days)
- Timezone handling: one timezone per series, or allow per-occurrence overrides?
- Should we support “apply to series” (single interest spanning all dates) or only per-occurrence interests? Recommendation: per-occurrence to keep Capacity Guard semantics intact.
- Do we need series-level cancellation (closes all future occurrences) distinct from per-occurrence cancellation?
