# 🎬 Video Tab – Phase 1 Activation Checklist

This checklist is for the first 5–7 days after enabling the Video tab as a first‑class surface.

Goal: Observe real behavior before wiring recommendation semantics or Golden Fork awards.

---

## Daily (5–10 minutes)

### 1. Surface Health
- Open `/video` on mobile and desktop:
  - Page loads, no obvious layout regressions.
  - Stories list renders; no blank or broken shell.
- As a **guest**:
  - Tab is visible in bottom nav.
  - Feed is watchable (videos play, no auth wall).
  - Upload actions route to `/login` only (no failing API calls).

### 2. Upload Pipeline
- As an **authenticated user**:
  - Upload one short test video through `VideoUploadModal`.
  - Confirm duration/size validation works and the flow completes.
  - New story appears at/near the top of the feed.
- Check monitoring/logs:
  - `/api/stories/upload` 4xx/5xx spikes.
  - Any Cloudinary/media storage errors around upload time.

### 3. Content Mix (Sample)
- From the ~20 newest user videos in the feed:
  - Count how many clearly reference or tag a specific restaurant.
  - Count how many are general "stories" with no clear restaurant.
  - Note any spammy/off‑topic or obviously low‑quality uploads.

### 4. Engagement Snapshot
- Using existing analytics/telemetry (no new instrumentation):
  - Unique users who opened `/video` in the last 24h.
  - Rough scroll behavior: do users stay long enough to see 2–3+ items?
  - Number of uploads in the last 24h and last 7d.
- From the feed itself (spot‑check a few items):
  - Are view counts increasing day‑over‑day?
  - Are likes appearing at all, or effectively zero?

### 5. Reliability & UX Friction
- Check for visible error states on the Video page:
  - Feed‑level error messages.
  - Upload failure banners from the modal.
- Scan support/feedback channels for:
  - Confusion about logging in to upload.
  - Complaints about videos not playing or disappearing.
- Note your own friction while using the tab:
  - Is the "why" for Video clear enough?
  - Does the Upload button feel discoverable but not pushy?

---

## After 5–7 Days – Phase 2 Readiness Check

Use these signals to decide whether to proceed to recommendation semantics / Golden Fork wiring.

### Ready for Phase 2 if:
- Uploads are happening consistently (steady trickle, not zero).
- A meaningful share of uploads are already restaurant‑tagged without being forced.
- Feed and upload errors are rare and non‑blocking.

### Defer Semantics / Focus on Activation if:
- Uploads are rare or near‑zero:
  - Priority: strengthen reasons to upload and clarify value.
- Most uploads are generic, not restaurant‑specific:
  - Priority: better copy/guardrails in the modal and Video page before awards.
- Users open `/video` but immediately bounce:
  - Priority: review hero copy, first‑screen content quality, and load time.

---

## How This Feeds Phase 2

- **If uploads skew restaurant‑tagged** → Recommendation semantics and Golden Fork scoring will feel natural and aligned with observed behavior.
- **If uploads skew general** → Phase 2 must lean harder on copy, optional nudges, and in‑product framing so "recommendations" are clearly differentiated.
- **If uploads are low volume** → Semantics don’t matter yet; focus on activation, education, and stability first.
