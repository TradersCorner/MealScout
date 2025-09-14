/**
 * Location utilities for testing and forced location override
 */

export interface ForcedLocation {
  lat: number;
  lng: number;
  name: string;
}

/**
 * Get forced location for testing purposes
 * Checks environment variable VITE_FORCE_LOCATION (format: "lat,lng|name")
 * Falls back to localStorage 'mockLocation' containing JSON { lat, lng, name }
 */
export function getForcedLocation(): ForcedLocation | null {
  // Check environment variable first
  const envLocation = import.meta.env.VITE_FORCE_LOCATION;
  if (envLocation) {
    try {
      const [coords, name] = envLocation.split('|');
      const [lat, lng] = coords.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng) && name) {
        return { lat, lng, name };
      }
    } catch (error) {
      console.warn('Invalid VITE_FORCE_LOCATION format:', envLocation);
    }
  }

  // Check localStorage as fallback
  try {
    const stored = localStorage.getItem('mockLocation');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.lat && parsed.lng && parsed.name) {
        return {
          lat: Number(parsed.lat),
          lng: Number(parsed.lng),
          name: String(parsed.name)
        };
      }
    }
  } catch (error) {
    console.warn('Invalid mockLocation in localStorage:', error);
  }

  return null;
}

/**
 * Set forced location in localStorage for testing
 */
export function setForcedLocation(location: ForcedLocation): void {
  localStorage.setItem('mockLocation', JSON.stringify(location));
}

/**
 * Clear forced location from localStorage
 */
export function clearForcedLocation(): void {
  localStorage.removeItem('mockLocation');
}