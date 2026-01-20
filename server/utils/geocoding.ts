type ReverseGeocodeResult = {
  city?: string;
  state?: string;
};

const cache = new Map<string, ReverseGeocodeResult>();

const roundCoord = (value: number, digits = 3) => {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
};

const getCacheKey = (lat: number, lng: number) =>
  `${roundCoord(lat)}:${roundCoord(lng)}`;

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
