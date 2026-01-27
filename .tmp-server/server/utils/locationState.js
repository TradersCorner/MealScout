var IDLE_THRESHOLD_DAYS = 14;
var GREEN_WINDOW_HOURS = 24;
var AMBER_WINDOW_HOURS = 48;
export function computeLocationState(restaurant, signals) {
    // Privacy override: always hidden
    if (signals.privacyEnabled ||
        !restaurant.isFoodTruck ||
        !restaurant.mobileOnline) {
        return { location_state: "hidden", last_confirmed_at: null };
    }
    var now = new Date();
    // Check for idle: no signals for ≥14 days
    var allSignals = [
        signals.customerCheckIn,
        signals.hostConfirm,
        signals.networkPresence,
        signals.lastLocationUpdate,
    ].filter(Boolean);
    if (allSignals.length === 0) {
        return { location_state: "hidden", last_confirmed_at: null };
    }
    var mostRecent = new Date(Math.max.apply(Math, allSignals.map(function (d) { return d.getTime(); })));
    var hoursSinceRecent = (now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60);
    var daysSinceRecent = hoursSinceRecent / 24;
    if (daysSinceRecent >= IDLE_THRESHOLD_DAYS) {
        return { location_state: "hidden", last_confirmed_at: null };
    }
    // GREEN: strong signals within 24 hours
    var greenSignals = [
        signals.customerCheckIn,
        signals.hostConfirm,
        signals.networkPresence && signals.networkDwell
            ? signals.networkPresence
            : null,
    ].filter(Boolean);
    if (greenSignals.length > 0) {
        var greenRecent = new Date(Math.max.apply(Math, greenSignals.map(function (d) { return d.getTime(); })));
        var greenHours = (now.getTime() - greenRecent.getTime()) / (1000 * 60 * 60);
        if (greenHours < GREEN_WINDOW_HOURS) {
            return { location_state: "green", last_confirmed_at: greenRecent };
        }
    }
    // AMBER: weak signals or historical pattern
    if (signals.historicalPattern ||
        (signals.networkPresence && hoursSinceRecent < AMBER_WINDOW_HOURS)) {
        return { location_state: "amber", last_confirmed_at: mostRecent };
    }
    // Default: hidden
    return { location_state: "hidden", last_confirmed_at: null };
}
