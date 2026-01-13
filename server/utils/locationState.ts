import type {
  Restaurant,
  LocationState,
  FoodTruckLocation,
} from "@shared/schema";

/**
 * Compute live location state for a restaurant/truck.
 * Server-side only; exposes minimal state to client.
 *
 * Rules (dot-only radar):
 * - GREEN: confirmed here now (check-in, host confirm, strong network+dwell)
 * - AMBER: likely here (historical pattern, single weak signal)
 * - HIDDEN: no signals ≥14 days OR privacy toggle on
 *
 * Privacy toggle short-circuits all signals.
 */

interface LocationSignals {
  customerCheckIn?: Date | null;
  hostConfirm?: Date | null;
  networkPresence?: Date | null;
  networkDwell?: boolean;
  historicalPattern?: boolean;
  lastLocationUpdate?: Date | null;
  privacyEnabled?: boolean;
}

const IDLE_THRESHOLD_DAYS = 14;
const GREEN_WINDOW_HOURS = 24;
const AMBER_WINDOW_HOURS = 48;

export function computeLocationState(
  restaurant: Restaurant,
  signals: LocationSignals
): { location_state: LocationState; last_confirmed_at: Date | null } {
  // Privacy override: always hidden
  if (
    signals.privacyEnabled ||
    !restaurant.isFoodTruck ||
    !restaurant.mobileOnline
  ) {
    return { location_state: "hidden", last_confirmed_at: null };
  }

  const now = new Date();

  // Check for idle: no signals for ≥14 days
  const allSignals = [
    signals.customerCheckIn,
    signals.hostConfirm,
    signals.networkPresence,
    signals.lastLocationUpdate,
  ].filter(Boolean) as Date[];

  if (allSignals.length === 0) {
    return { location_state: "hidden", last_confirmed_at: null };
  }

  const mostRecent = new Date(Math.max(...allSignals.map((d) => d.getTime())));
  const hoursSinceRecent =
    (now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60);
  const daysSinceRecent = hoursSinceRecent / 24;

  if (daysSinceRecent >= IDLE_THRESHOLD_DAYS) {
    return { location_state: "hidden", last_confirmed_at: null };
  }

  // GREEN: strong signals within 24 hours
  const greenSignals = [
    signals.customerCheckIn,
    signals.hostConfirm,
    signals.networkPresence && signals.networkDwell
      ? signals.networkPresence
      : null,
  ].filter(Boolean) as Date[];

  if (greenSignals.length > 0) {
    const greenRecent = new Date(
      Math.max(...greenSignals.map((d) => d.getTime()))
    );
    const greenHours =
      (now.getTime() - greenRecent.getTime()) / (1000 * 60 * 60);

    if (greenHours < GREEN_WINDOW_HOURS) {
      return { location_state: "green", last_confirmed_at: greenRecent };
    }
  }

  // AMBER: weak signals or historical pattern
  if (
    signals.historicalPattern ||
    (signals.networkPresence && hoursSinceRecent < AMBER_WINDOW_HOURS)
  ) {
    return { location_state: "amber", last_confirmed_at: mostRecent };
  }

  // Default: hidden
  return { location_state: "hidden", last_confirmed_at: null };
}
