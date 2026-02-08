type ReverseGeocodeResult = {
  city?: string;
  state?: string;
};

type ForwardGeocodeResult = {
  lat: number;
  lng: number;
};

const cache = new Map<string, ReverseGeocodeResult>();
type ForwardCacheEntry = { value: ForwardGeocodeResult | null; ts: number };
const forwardCache = new Map<string, ForwardCacheEntry>();
const FORWARD_FAILURE_TTL_MS = 10 * 60 * 1000;

const roundCoord = (value: number, digits = 3) => {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
};

const getCacheKey = (lat: number, lng: number) =>
  `${roundCoord(lat)}:${roundCoord(lng)}`;

const normalizeAddressKey = (address: string) =>
  address.trim().toLowerCase();

const extractCityState = (data: any): ReverseGeocodeResult => {
  const address = data?.address || {};
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.county;
  const state = address.state || address.region;
  return { city, state };
};

async function reverseWithNominatim(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "MealScout/1.0 (location lookup)",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return extractCityState(data);
}

async function reverseWithGoogle(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const result = data?.results?.[0];
  if (!result) return null;
  const components = result.address_components || [];
  const city =
    components.find((c: any) => c.types?.includes("locality"))?.long_name ||
    components.find((c: any) => c.types?.includes("administrative_area_level_2"))
      ?.long_name;
  const state = components.find((c: any) =>
    c.types?.includes("administrative_area_level_1"),
  )?.short_name;
  return { city, state };
}

async function forwardWithNominatim(
  address: string,
): Promise<ForwardGeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(
    address,
  )}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "MealScout/1.0 (geocoding)",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const first = Array.isArray(data) ? data[0] : null;
  if (!first?.lat || !first?.lon) return null;
  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function forwardWithGoogle(
  address: string,
): Promise<ForwardGeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address,
  )}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const result = data?.results?.[0];
  const location = result?.geometry?.location;
  if (!location) return null;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const key = getCacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached) return cached;

  const nominatimResult = await reverseWithNominatim(lat, lng);
  if (nominatimResult?.city || nominatimResult?.state) {
    cache.set(key, nominatimResult);
    return nominatimResult;
  }

  const googleResult = await reverseWithGoogle(lat, lng);
  if (googleResult?.city || googleResult?.state) {
    cache.set(key, googleResult);
    return googleResult;
  }

  const fallback: ReverseGeocodeResult = {};
  cache.set(key, fallback);
  return fallback;
}

export async function forwardGeocode(
  address: string,
): Promise<ForwardGeocodeResult | null> {
  const key = normalizeAddressKey(address);
  if (!key) return null;
  const entry = forwardCache.get(key);
  if (entry) {
    if (entry.value) return entry.value;
    if (Date.now() - entry.ts < FORWARD_FAILURE_TTL_MS) return null;
    forwardCache.delete(key);
  }

  const googleResult = await forwardWithGoogle(address);
  if (googleResult) {
    forwardCache.set(key, { value: googleResult, ts: Date.now() });
    return googleResult;
  }

  const nominatimResult = await forwardWithNominatim(address);
  if (nominatimResult) {
    forwardCache.set(key, { value: nominatimResult, ts: Date.now() });
    return nominatimResult;
  }

  forwardCache.set(key, { value: null, ts: Date.now() });
  return null;
}
