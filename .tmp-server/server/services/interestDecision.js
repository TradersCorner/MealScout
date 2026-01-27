// Helpers for interest acceptance/decline decisions and capacity guard logic.
// Pure domain logic: no Express or storage imports.
export function computeAcceptedCount(interests) {
    return interests.filter(function (i) { return i.status === 'accepted'; }).length;
}
export function shouldBlockAcceptance(context) {
    var hardCapEnabled = context.hardCapEnabled, acceptedCount = context.acceptedCount, maxTrucks = context.maxTrucks;
    if (!hardCapEnabled)
        return false;
    return acceptedCount >= maxTrucks;
}
export function buildCapacityFullError() {
    // Message and code must match the route's current response exactly
    return {
        message: 'Event is full (Capacity Guard Enabled). Cannot accept more trucks.',
        code: 'CAPACITY_REACHED',
    };
}
export function computeFillRate(params) {
    var acceptedCount = params.acceptedCount, maxTrucks = params.maxTrucks;
    if (!maxTrucks)
        return 0;
    return acceptedCount / maxTrucks;
}
