// Event series (open calls) helpers.
// Pure domain logic: no Express or storage imports.
var MAX_SERIES_SPAN_DAYS = 180;
var MS_PER_DAY = 1000 * 60 * 60 * 24;
export function assertMaxSpan180Days(startDate, endDate) {
    var diffMs = endDate.getTime() - startDate.getTime();
    var daysDiff = Math.floor(diffMs / MS_PER_DAY);
    if (daysDiff > MAX_SERIES_SPAN_DAYS) {
        // Message must match existing route behavior exactly
        throw new Error('Event series cannot span more than 180 days');
    }
}
var DAY_MAP = {
    'SU': 0,
    'MO': 1,
    'TU': 2,
    'WE': 3,
    'TH': 4,
    'FR': 5,
    'SA': 6,
};
export function parseWeeklyRecurrence(recurrenceRule) {
    if (!recurrenceRule || !recurrenceRule.startsWith('WEEKLY:')) {
        return null;
    }
    var daysStr = recurrenceRule.split(':')[1];
    var selectedDays = daysStr
        .split(',')
        .map(function (d) { return DAY_MAP[d]; })
        .filter(function (d) { return d !== undefined; });
    return selectedDays.length > 0 ? selectedDays : null;
}
export function generateOccurrences(config) {
    var startDate = config.startDate, endDate = config.endDate, recurrenceRule = config.recurrenceRule, defaults = config.defaults;
    var occurrences = [];
    var selectedDays = parseWeeklyRecurrence(recurrenceRule !== null && recurrenceRule !== void 0 ? recurrenceRule : null);
    if (selectedDays) {
        var currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            if (selectedDays.includes(currentDate.getDay())) {
                occurrences.push({
                    hostId: defaults.hostId,
                    seriesId: defaults.seriesId,
                    name: defaults.name,
                    description: defaults.description,
                    date: new Date(currentDate),
                    startTime: defaults.startTime,
                    endTime: defaults.endTime,
                    maxTrucks: defaults.maxTrucks,
                    hardCapEnabled: defaults.hardCapEnabled,
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    else {
        // No recurrence: single occurrence on startDate
        occurrences.push({
            hostId: defaults.hostId,
            seriesId: defaults.seriesId,
            name: defaults.name,
            description: defaults.description,
            date: new Date(startDate),
            startTime: defaults.startTime,
            endTime: defaults.endTime,
            maxTrucks: defaults.maxTrucks,
            hardCapEnabled: defaults.hardCapEnabled,
        });
    }
    return occurrences;
}
export function filterFutureOccurrences(occurrences, now) {
    var today = new Date(now);
    today.setHours(0, 0, 0, 0);
    return occurrences.filter(function (occ) { return new Date(occ.date) >= today; });
}
