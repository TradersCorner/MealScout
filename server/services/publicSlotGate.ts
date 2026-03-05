export type SlotSource = "parking_pass_booking" | "manual";

export type PublicSlot = {
  source: SlotSource;
  status: "confirmed" | "tentative" | "cancelled";
  startsAtUtc: Date;
  endsAtUtc: Date;
  lastConfirmedAtUtc: Date;
};

function minutes(ms: number) {
  return ms * 60 * 1000;
}

function hours(ms: number) {
  return ms * 60 * 60 * 1000;
}

export function isSlotPublic(params: {
  slot: PublicSlot;
  now?: Date;
  lookaheadHours?: number;
  graceMinutes?: number;
  ttlHours?: number;
}): boolean {
  const now = params.now ? new Date(params.now) : new Date();
  const lookaheadHours = Number.isFinite(params.lookaheadHours)
    ? Math.max(0, Math.floor(params.lookaheadHours as number))
    : 24 * 7;
  const graceMinutes = Number.isFinite(params.graceMinutes)
    ? Math.max(0, Math.floor(params.graceMinutes as number))
    : 30;
  const ttlHours = Number.isFinite(params.ttlHours)
    ? Math.max(1, Math.floor(params.ttlHours as number))
    : 72;

  const slot = params.slot;
  if (slot.status !== "confirmed") return false;
  if (!slot.startsAtUtc || !slot.endsAtUtc || !slot.lastConfirmedAtUtc) return false;

  const startsAt = new Date(slot.startsAtUtc);
  const endsAt = new Date(slot.endsAtUtc);
  const lastConfirmedAt = new Date(slot.lastConfirmedAtUtc);
  if (![startsAt, endsAt, lastConfirmedAt].every((d) => Number.isFinite(d.getTime()))) {
    return false;
  }

  const nowMs = now.getTime();
  const startsAtMs = startsAt.getTime();
  const endsAtMs = endsAt.getTime();
  const lastConfirmedMs = lastConfirmedAt.getTime();

  // Optional lookahead: keep pages "now/tonight/weekend" from showing far-future slots.
  if (startsAtMs > nowMs + hours(lookaheadHours)) return false;

  // Grace window: allow a recently-ended slot to linger briefly to avoid flicker.
  if (endsAtMs < nowMs - minutes(graceMinutes)) return false;

  // Freshness TTL: if not confirmed recently, hide it (prevents "yesterday" pages).
  if (lastConfirmedMs < nowMs - hours(ttlHours)) return false;

  return true;
}

