/**
 * Location utilities for testing and forced location override
 */
/**
 * Get forced location for testing purposes
 * Checks environment variable VITE_FORCE_LOCATION (format: "lat,lng|name")
 * Falls back to localStorage 'mockLocation' containing JSON { lat, lng, name }
 */
export function getForcedLocation() {
    // Check environment variable first
    var envLocation = import.meta.env.VITE_FORCE_LOCATION;
    if (envLocation) {
        try {
            var _a = envLocation.split('|'), coords = _a[0], name_1 = _a[1];
            var _b = coords.split(',').map(Number), lat = _b[0], lng = _b[1];
            if (!isNaN(lat) && !isNaN(lng) && name_1) {
                return { lat: lat, lng: lng, name: name_1 };
            }
        }
        catch (error) {
            console.warn('Invalid VITE_FORCE_LOCATION format:', envLocation);
        }
    }
    // Check localStorage as fallback
    try {
        var stored = localStorage.getItem('mockLocation');
        if (stored) {
            var parsed = JSON.parse(stored);
            if (parsed.lat && parsed.lng && parsed.name) {
                return {
                    lat: Number(parsed.lat),
                    lng: Number(parsed.lng),
                    name: String(parsed.name)
                };
            }
        }
    }
    catch (error) {
        console.warn('Invalid mockLocation in localStorage:', error);
    }
    return null;
}
/**
 * Set forced location in localStorage for testing
 */
export function setForcedLocation(location) {
    localStorage.setItem('mockLocation', JSON.stringify(location));
}
/**
 * Clear forced location from localStorage
 */
export function clearForcedLocation() {
    localStorage.removeItem('mockLocation');
}
