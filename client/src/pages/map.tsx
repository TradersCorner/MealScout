import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Navigation as NavigationIcon,
  List,
  X,
} from "lucide-react";
import DealCard from "@/components/deal-card";
import { SEOHead } from "@/components/seo-head";
import mealScoutIcon from "@assets/meal-scout-icon.png";
import { sendGeoPing, trackGeoAdEvent, trackGeoAdImpression } from "@/utils/geoAds";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
});

const svgToDataUrl = (svg: string) =>
  "data:image/svg+xml;base64," + btoa(svg);

// Custom user location icon (person silhouette, not a pin)
const userLocationIcon = L.divIcon({
  className: "map-user-marker",
  html: `
    <div class="map-user-marker__pulse"></div>
    <div class="map-user-marker__logo">
      <svg class="map-user-marker__person" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="11" r="5.2" fill="#0F172A" />
        <path d="M6 28c0-5.2 4.5-9.4 10-9.4s10 4.2 10 9.4" fill="#0F172A" />
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const parkingPassPinIcon = new L.Icon({
  iconUrl: mealScoutIcon,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -30],
});

// Component to handle map controls
function MapControls({
  onZoomIn,
  onZoomOut,
  onCenterUser,
  userLocation,
  zoomLevel,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenterUser: () => void;
  userLocation: { lat: number; lng: number } | null;
  zoomLevel: number;
}) {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
    onZoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
    onZoomOut();
  };

  const handleCenterUser = () => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], map.getZoom());
      onCenterUser();
    }
  };

  return (
    <div className="absolute top-5 right-5 flex flex-col space-y-2 z-[1000]">
      <Button
        variant="secondary"
        size="sm"
        className="w-9 h-9 p-0 rounded-full bg-white/90 border border-white/60 shadow-lg backdrop-blur"
        onClick={handleZoomIn}
        data-testid="button-zoom-in"
        title="Zoom in"
      >
        +
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="w-9 h-9 p-0 rounded-full bg-white/90 border border-white/60 shadow-lg backdrop-blur"
        onClick={handleZoomOut}
        data-testid="button-zoom-out"
        title="Zoom out"
      >
        −
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="w-9 h-9 p-0 rounded-full bg-white/90 border border-white/60 shadow-lg backdrop-blur"
        onClick={handleCenterUser}
        disabled={!userLocation}
        data-testid="button-center-location"
        title="Center on location"
      >
        <NavigationIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}

function MapViewportWatcher({
  onZoomChange,
  onBoundsChange,
}: {
  onZoomChange: (zoom: number) => void;
  onBoundsChange: (bounds: L.LatLngBounds) => void;
}) {
  const map = useMapEvents({
    zoomend: (event) => {
      onZoomChange(event.target.getZoom());
      onBoundsChange(event.target.getBounds());
    },
    moveend: (event) => {
      onBoundsChange(event.target.getBounds());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
    onBoundsChange(map.getBounds());
  }, [map, onZoomChange, onBoundsChange]);

  return null;
}

function MapCenterer({ center }: { center: GeoPoint | null }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center?.lat, center?.lng, map]);

  return null;
}

interface Restaurant {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  cuisineType: string;
  phone: string;
  isActive: boolean;
}

interface LiveTruck {
  id: string;
  name: string;
  currentLatitude?: string | number | null;
  currentLongitude?: string | number | null;
  distance?: number;
}

interface Deal {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  dealType: string;
  discountValue: string;
  minOrderAmount: string;
  imageUrl: string;
  isFeatured?: boolean;
  restaurant: Restaurant;
}

interface GeoAd {
  id: string;
  title: string;
  body?: string | null;
  mediaUrl?: string | null;
  targetUrl: string;
  ctaText?: string | null;
  pinLat?: number | null;
  pinLng?: number | null;
}

type HostLocation = {
  id: string;
  name: string;
  businessName?: string;
  address: string;
  city?: string | null;
  state?: string | null;
  locationType: string;
  expectedFootTraffic?: number;
  notes?: string | null;
  preferredDates?: string[];
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type EventLocation = {
  id: string;
  name: string;
  description?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  hostName?: string | null;
  hostAddress?: string | null;
  hostCity?: string | null;
  hostState?: string | null;
  hostLatitude?: number | string | null;
  hostLongitude?: number | string | null;
};

type ParkingPassLocation = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  host: HostLocation & { city?: string | null; state?: string | null };
  bookings?: Array<{
    truckId: string;
    truckName: string;
    slotType?: string | null;
    spotNumber?: number | null;
  }>;
};

type MapLocationsResponse = {
  hostLocations: HostLocation[];
  eventLocations: EventLocation[];
};

type GeoPoint = { lat: number; lng: number };
type GeocodeCacheEntry = { lat: number; lng: number; ts: number };
type GeocodeFailureEntry = { ts: number };

const toNumberOrNull = (value?: number | string | null) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildFullAddress = (
  address?: string | null,
  city?: string | null,
  state?: string | null,
) =>
  [address, city, state].filter(Boolean).join(", ");

const haversineKm = (a: GeoPoint, b: GeoPoint) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};

const hostPinIcon = new L.Icon({
  iconUrl: mealScoutIcon,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -30],
});

const hostPinActiveIcon = L.divIcon({
  className: "map-host-marker",
  html: `
    <div class="map-host-marker__logo">
      <img src="${mealScoutIcon}" alt="MealScout host" />
    </div>
    <div class="map-host-marker__dot" aria-hidden="true"></div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -30],
});

const foodPinIcon = new L.Icon({
  iconUrl: svgToDataUrl(`
    <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1C10.373 1 5 6.373 5 13c0 9.5 12 27 12 27s12-17.5 12-27C29 6.373 23.627 1 17 1z" fill="#EF4444" stroke="#991B1B" stroke-width="1.5"/>
      <circle cx="17" cy="13" r="7" fill="#FEF2F2"/>
    </svg>
  `),
  iconSize: [34, 42],
  iconAnchor: [17, 40],
  popupAnchor: [0, -34],
});

const truckPinIcon = new L.Icon({
  iconUrl: svgToDataUrl(`
    <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1C10.373 1 5 6.373 5 13c0 9.5 12 27 12 27s12-17.5 12-27C29 6.373 23.627 1 17 1z" fill="#2563EB" stroke="#1D4ED8" stroke-width="1.5"/>
      <circle cx="17" cy="13" r="7" fill="#DBEAFE"/>
      <text x="17" y="17" text-anchor="middle" font-size="9" font-weight="700" fill="#1D4ED8">T</text>
    </svg>
  `),
  iconSize: [34, 42],
  iconAnchor: [17, 40],
  popupAnchor: [0, -34],
});

const eventPinIcon = new L.Icon({
  iconUrl: svgToDataUrl(`
    <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1C10.373 1 5 6.373 5 13c0 9.5 12 27 12 27s12-17.5 12-27C29 6.373 23.627 1 17 1z" fill="#8B5CF6" stroke="#312E81" stroke-width="1.5"/>
      <circle cx="17" cy="13" r="7" fill="#F5F3FF"/>
      <text x="17" y="17" text-anchor="middle" font-size="9" font-weight="700" fill="#312E81">E</text>
    </svg>
  `),
  iconSize: [34, 42],
  iconAnchor: [17, 40],
  popupAnchor: [0, -34],
});

const geoAdPinIcon = new L.Icon({
  iconUrl: svgToDataUrl(`
    <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 1C10.373 1 5 6.373 5 13c0 9.5 12 27 12 27s12-17.5 12-27C29 6.373 23.627 1 17 1z" fill="#14B8A6" stroke="#0F766E" stroke-width="1.5"/>
      <circle cx="17" cy="13" r="7" fill="#ECFEFF"/>
      <text x="17" y="17" text-anchor="middle" font-size="8" font-weight="700" fill="#0F766E">AD</text>
    </svg>
  `),
  iconSize: [34, 42],
  iconAnchor: [17, 40],
  popupAnchor: [0, -34],
});


async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  if (!address) return null;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}&limit=1`,
    {
      headers: { "Accept-Language": "en", "User-Agent": "MealScout/1.0" },
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// Fallback: approximate location via IP for environments like in-app browsers
async function ipGeolocationFallback(): Promise<{
  lat: number;
  lng: number;
  city?: string;
} | null> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.latitude || !data.longitude) return null;
    return {
      lat: parseFloat(data.latitude),
      lng: parseFloat(data.longitude),
      city: data.city || data.region,
    };
  } catch {
    return null;
  }
}

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    // Neutral default center (approximate center of continental US)
    lat: 39.8283,
    lng: -98.5795,
  });
  const [showList, setShowList] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(16);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hostCoords, setHostCoords] = useState<Record<string, GeoPoint>>({});
  const [eventCoords, setEventCoords] = useState<Record<string, GeoPoint>>({});
  const [parkingCoords, setParkingCoords] = useState<Record<string, GeoPoint>>(
    {},
  );
  const geocodeInFlight = useRef(false);
  const [geocodeCache, setGeocodeCache] = useState<
    Record<string, GeocodeCacheEntry>
  >({});
  const [geocodeFailures, setGeocodeFailures] = useState<
    Record<string, GeocodeFailureEntry>
  >({});

  useEffect(() => {
    try {
      const cached = localStorage.getItem("mealscout_geocode_cache");
      if (cached) {
        setGeocodeCache(JSON.parse(cached));
      }
    } catch {
      // ignore localStorage issues
    }
    try {
      const failed = localStorage.getItem("mealscout_geocode_failures");
      if (failed) {
        setGeocodeFailures(JSON.parse(failed));
      }
    } catch {
      // ignore localStorage issues
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "mealscout_geocode_cache",
        JSON.stringify(geocodeCache),
      );
    } catch {
      // ignore localStorage issues
    }
  }, [geocodeCache]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "mealscout_geocode_failures",
        JSON.stringify(geocodeFailures),
      );
    } catch {
      // ignore localStorage issues
    }
  }, [geocodeFailures]);

  // Get user location
  useEffect(() => {
    // Start from last known location if the user has previously shared it
    try {
      const stored = localStorage.getItem("mealscout_last_location");
      if (stored) {
        const parsed = JSON.parse(stored) as {
          lat?: number;
          lng?: number;
        } | null;
        if (parsed?.lat && parsed?.lng) {
          const approx = { lat: parsed.lat, lng: parsed.lng };
          setUserLocation(approx);
          setMapCenter(approx);
        }
      }
    } catch {
      // ignore localStorage issues
    }

    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setMapCenter(location);
          try {
            localStorage.setItem(
              "mealscout_last_location",
              JSON.stringify(location),
            );
          } catch {
            // ignore localStorage issues
          }
          setIsLocating(false);
          setLocationError(null);
        },
        async (error) => {
          console.log("Location error:", error);
          // Try a softer message and approximate IP-based fallback
          setLocationError(
            "Couldn't get precise GPS, showing an approximate area instead."
          );
          const ipLocation = await ipGeolocationFallback();
          if (ipLocation) {
            const approx = { lat: ipLocation.lat, lng: ipLocation.lng };
            setUserLocation(approx);
            setMapCenter(approx);
            try {
              localStorage.setItem(
                "mealscout_last_location",
                JSON.stringify(approx),
              );
            } catch {
              // ignore localStorage issues
            }
          }
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Fetch nearby deals based on user location
  const { data: dealsData = [], isLoading } = useQuery({
    queryKey: userLocation
      ? ["/api/deals/nearby", userLocation.lat, userLocation.lng]
      : ["/api/deals/featured"],
    queryFn: userLocation
      ? async () => {
          const response = await fetch(
            `/api/deals/nearby/${userLocation.lat}/${userLocation.lng}`
          );
          if (!response.ok) throw new Error("Failed to fetch nearby deals");
          return response.json();
        }
      : undefined,
    enabled: !!userLocation,
  });

  const deals: Deal[] = Array.isArray(dealsData) ? (dealsData as Deal[]) : [];

  const { data: liveTrucksData = [] } = useQuery<LiveTruck[]>({
    queryKey: userLocation
      ? ["/api/trucks/live", userLocation.lat, userLocation.lng]
      : ["live-trucks", "none"],
    queryFn: userLocation
      ? async () => {
          const response = await fetch(
            `/api/trucks/live?lat=${userLocation.lat}&lng=${userLocation.lng}&radiusKm=5`
          );
          if (!response.ok) throw new Error("Failed to fetch live trucks");
          return response.json();
        }
      : undefined,
    enabled: !!userLocation,
    staleTime: 30 * 1000,
  });

  const liveTrucks = Array.isArray(liveTrucksData) ? liveTrucksData : [];

  const adLocation = userLocation || mapCenter;
  const { data: geoAds = [] } = useQuery<GeoAd[]>({
    queryKey: ["/api/geo-ads", "map", adLocation?.lat, adLocation?.lng],
    enabled: !!adLocation,
    queryFn: async () => {
      if (!adLocation) return [];
      const res = await fetch(
        `/api/geo-ads?placement=map&lat=${adLocation.lat}&lng=${adLocation.lng}&limit=10`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    if (!adLocation) return;
    sendGeoPing({ lat: adLocation.lat, lng: adLocation.lng, source: "map" });
  }, [adLocation?.lat, adLocation?.lng]);

  useEffect(() => {
    if (!geoAds.length) return;
    geoAds.forEach((ad) =>
      trackGeoAdImpression({ adId: ad.id, placement: "map" })
    );
  }, [geoAds]);

  const truckCoords = useMemo(() => {
    return liveTrucks
      .map((truck) => {
        const lat = toNumberOrNull(truck.currentLatitude);
        const lng = toNumberOrNull(truck.currentLongitude);
        if (lat === null || lng === null) return null;
        return { id: truck.id, lat, lng };
      })
      .filter(Boolean) as Array<{ id: string; lat: number; lng: number }>;
  }, [liveTrucks]);

  const visibleDeals = useMemo(() => {
    if (!mapBounds) return deals;
    return deals.filter((deal) => {
      const lat = toNumberOrNull(deal.restaurant?.latitude);
      const lng = toNumberOrNull(deal.restaurant?.longitude);
      if (lat === null || lng === null) return false;
      return mapBounds.contains([lat, lng]);
    });
  }, [deals, mapBounds]);

  const visibleGeoAds = useMemo(() => {
    if (!mapBounds) return geoAds;
    return geoAds.filter((ad) => {
      const lat = ad.pinLat ?? null;
      const lng = ad.pinLng ?? null;
      if (lat === null || lng === null) return false;
      return mapBounds.contains([lat, lng]);
    });
  }, [geoAds, mapBounds]);

  const visibleLiveTrucks = useMemo(() => {
    if (!mapBounds) return liveTrucks;
    return liveTrucks.filter((truck) => {
      const lat = toNumberOrNull(truck.currentLatitude);
      const lng = toNumberOrNull(truck.currentLongitude);
      if (lat === null || lng === null) return false;
      return mapBounds.contains([lat, lng]);
    });
  }, [liveTrucks, mapBounds]);

  const hostedRadiusKm = 0.12;

  const liveTruckById = useMemo(() => {
    return new Map(liveTrucks.map((truck) => [truck.id, truck]));
  }, [liveTrucks]);

  const findNearbyTruck = (coords: GeoPoint, radiusKm = hostedRadiusKm) => {
    let nearest: { truck: LiveTruck; distance: number } | null = null;
    for (const truck of truckCoords) {
      const distance = haversineKm(coords, { lat: truck.lat, lng: truck.lng });
      if (distance > radiusKm) continue;
      const truckData = liveTruckById.get(truck.id);
      if (!truckData) continue;
      if (!nearest || distance < nearest.distance) {
        nearest = { truck: truckData, distance };
      }
    }
    return nearest;
  };

  const resolveHostCoords = (host: HostLocation) => {
    const lat = toNumberOrNull(host.latitude);
    const lng = toNumberOrNull(host.longitude);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
    return hostCoords[host.id] ?? null;
  };

  const resolveEventCoords = (event: EventLocation) => {
    const lat = toNumberOrNull(event.hostLatitude);
    const lng = toNumberOrNull(event.hostLongitude);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
    return eventCoords[event.id] ?? null;
  };

  const resolveParkingCoords = (event: ParkingPassLocation) => {
    const lat = toNumberOrNull(event.host?.latitude);
    const lng = toNumberOrNull(event.host?.longitude);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
    return parkingCoords[event.id] ?? null;
  };

  const formatDistance = (coords: GeoPoint) => {
    if (!userLocation) return null;
    const distanceKm = haversineKm(userLocation, coords);
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  };

  const formatSlotType = (slot?: string | null) => {
    if (!slot) return null;
    return slot.charAt(0).toUpperCase() + slot.slice(1);
  };

  const handleGeoAdClick = (ad: GeoAd) => {
    trackGeoAdEvent({ adId: ad.id, eventType: "click", placement: "map" });
    window.open(ad.targetUrl, "_blank", "noopener,noreferrer");
  };

  // Fetch host + event locations for map
  const { data: mapLocations } = useQuery<MapLocationsResponse>({
    queryKey: ["/api/map/locations"],
    queryFn: async () => {
      const res = await fetch("/api/map/locations");
      if (!res.ok) throw new Error("Failed to load map locations");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: parkingPassLocations = [] } = useQuery<ParkingPassLocation[]>({
    queryKey: ["/api/parking-pass"],
    queryFn: async () => {
      const res = await fetch("/api/parking-pass");
      if (!res.ok) throw new Error("Failed to load parking pass listings");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const uniqueParkingPassLocations = useMemo(() => {
    const byHost = new Map<string, ParkingPassLocation>();
    const sorted = [...parkingPassLocations].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    sorted.forEach((event) => {
      const key = event.host?.id || event.host?.address || event.id;
      if (!byHost.has(key)) {
        byHost.set(key, event);
      }
    });
    return Array.from(byHost.values());
  }, [parkingPassLocations]);

  const visibleHostLocations = useMemo(() => {
    if (!mapBounds || !mapLocations?.hostLocations?.length) return [];
    return mapLocations.hostLocations.filter((host) => {
      const coords = resolveHostCoords(host);
      if (!coords) return false;
      return mapBounds.contains([coords.lat, coords.lng]);
    });
  }, [mapLocations, hostCoords, mapBounds]);

  const visibleEventLocations = useMemo(() => {
    if (!mapBounds || !mapLocations?.eventLocations?.length) return [];
    return mapLocations.eventLocations.filter((event) => {
      const coords = resolveEventCoords(event);
      if (!coords) return false;
      return mapBounds.contains([coords.lat, coords.lng]);
    });
  }, [mapLocations, eventCoords, mapBounds]);

  const visibleParkingLocations = useMemo(() => {
    if (!mapBounds || !uniqueParkingPassLocations.length) return [];
    return uniqueParkingPassLocations.filter((event) => {
      const coords = resolveParkingCoords(event);
      if (!coords) return false;
      return mapBounds.contains([coords.lat, coords.lng]);
    });
  }, [uniqueParkingPassLocations, parkingCoords, mapBounds]);

  const hostedTruckIds = useMemo(() => {
    const ids = new Set<string>();
    visibleHostLocations.forEach((host) => {
      const coords = resolveHostCoords(host);
      if (!coords) return;
      const nearby = findNearbyTruck(coords);
      if (nearby) ids.add(nearby.truck.id);
    });
    visibleParkingLocations.forEach((event) => {
      const coords = resolveParkingCoords(event);
      if (!coords) return;
      const nearby = findNearbyTruck(coords);
      if (nearby) ids.add(nearby.truck.id);
    });
    visibleEventLocations.forEach((event) => {
      const coords = resolveEventCoords(event);
      if (!coords) return;
      const nearby = findNearbyTruck(coords);
      if (nearby) ids.add(nearby.truck.id);
    });
    return ids;
  }, [
    visibleHostLocations,
    visibleParkingLocations,
    visibleEventLocations,
    resolveHostCoords,
    resolveParkingCoords,
    resolveEventCoords,
    findNearbyTruck,
  ]);

  const visibleUnhostedTrucks = useMemo(() => {
    return visibleLiveTrucks.filter((truck) => !hostedTruckIds.has(truck.id));
  }, [visibleLiveTrucks, hostedTruckIds]);

  useEffect(() => {
    if (
      !mapLocations?.hostLocations?.length &&
      !mapLocations?.eventLocations?.length
    ) {
      return;
    }

    const nextHosts: Record<string, GeoPoint> = {};
    mapLocations?.hostLocations.forEach((host) => {
      const lat = toNumberOrNull(host.latitude);
      const lng = toNumberOrNull(host.longitude);
      if (lat !== null && lng !== null) {
        nextHosts[host.id] = { lat, lng };
      }
    });

    const nextEvents: Record<string, GeoPoint> = {};
    mapLocations?.eventLocations.forEach((event) => {
      const lat = toNumberOrNull(event.hostLatitude);
      const lng = toNumberOrNull(event.hostLongitude);
      if (lat !== null && lng !== null) {
        nextEvents[event.id] = { lat, lng };
      }
    });

    if (Object.keys(nextHosts).length) {
      setHostCoords((prev) => ({ ...prev, ...nextHosts }));
    }
    if (Object.keys(nextEvents).length) {
      setEventCoords((prev) => ({ ...prev, ...nextEvents }));
    }
  }, [mapLocations]);

  useEffect(() => {
    if (!uniqueParkingPassLocations.length) return;
    const nextParking: Record<string, GeoPoint> = {};
    uniqueParkingPassLocations.forEach((event) => {
      const lat = toNumberOrNull(event.host?.latitude);
      const lng = toNumberOrNull(event.host?.longitude);
      if (lat !== null && lng !== null) {
        nextParking[event.id] = { lat, lng };
      }
    });
    if (Object.keys(nextParking).length) {
      setParkingCoords((prev) => ({ ...prev, ...nextParking }));
    }
  }, [uniqueParkingPassLocations]);

  // Build a geocoding work list for any host/event without coordinates yet
  useEffect(() => {
    if (!mapBounds || zoomLevel < 12) {
      return;
    }
    if (geocodeInFlight.current) {
      return;
    }
    const queue: string[] = [];
    const addressByKey: Record<string, string> = {};
    const now = Date.now();
    const failureCooldownMs = 6 * 60 * 60 * 1000;
    const maxQueue = zoomLevel >= 16 ? 25 : 10;

    mapLocations?.hostLocations.forEach((host) => {
      const lat = toNumberOrNull(host.latitude);
      const lng = toNumberOrNull(host.longitude);
      if (lat !== null && lng !== null) {
        return;
      }
      if (!hostCoords[host.id]) {
        queue.push(`host:${host.id}`);
        addressByKey[`host:${host.id}`] = buildFullAddress(
          host.address,
          host.city,
          host.state,
        );
      }
    });

    mapLocations?.eventLocations.forEach((event) => {
      const lat = toNumberOrNull(event.hostLatitude);
      const lng = toNumberOrNull(event.hostLongitude);
      if (lat !== null && lng !== null) {
        return;
      }
      if (!eventCoords[event.id] && event.hostAddress) {
        queue.push(`event:${event.id}`);
        addressByKey[`event:${event.id}`] = buildFullAddress(
          event.hostAddress,
          event.hostCity,
          event.hostState,
        );
      }
    });

    uniqueParkingPassLocations.forEach((event) => {
      const lat = toNumberOrNull(event.host?.latitude);
      const lng = toNumberOrNull(event.host?.longitude);
      if (lat !== null && lng !== null) {
        return;
      }
      if (!parkingCoords[event.id] && event.host?.address) {
        queue.push(`parking:${event.id}`);
        addressByKey[`parking:${event.id}`] = buildFullAddress(
          event.host.address,
          event.host.city,
          event.host.state,
        );
      }
    });

    if (queue.length) {
      const limitedQueue = queue.slice(0, maxQueue);
      geocodeInFlight.current = true;
      (async () => {
        try {
          const newHostCoords: Record<string, GeoPoint> = {};
          const newEventCoords: Record<string, GeoPoint> = {};
          const newParkingCoords: Record<string, GeoPoint> = {};
          const newFailures: Record<string, GeocodeFailureEntry> = {};

          for (const key of limitedQueue) {
            const address = addressByKey[key];
            if (!address) continue;
            const cached = geocodeCache[address];
            if (cached) {
              const point = { lat: cached.lat, lng: cached.lng };
              if (key.startsWith("host:")) {
                newHostCoords[key.replace("host:", "")] = point;
              } else if (key.startsWith("event:")) {
                newEventCoords[key.replace("event:", "")] = point;
              } else if (key.startsWith("parking:")) {
                newParkingCoords[key.replace("parking:", "")] = point;
              }
              continue;
            }

            const failed = geocodeFailures[address];
            if (failed && now - failed.ts < failureCooldownMs) {
              continue;
            }

            const point = await geocodeAddress(address).catch(() => null);
            if (!point) {
              newFailures[address] = { ts: Date.now() };
              continue;
            }
            if (key.startsWith("host:")) {
              newHostCoords[key.replace("host:", "")] = point;
            } else if (key.startsWith("event:")) {
              newEventCoords[key.replace("event:", "")] = point;
            } else if (key.startsWith("parking:")) {
              newParkingCoords[key.replace("parking:", "")] = point;
            }
            setGeocodeCache((prev) => ({
              ...prev,
              [address]: { lat: point.lat, lng: point.lng, ts: Date.now() },
            }));
            // small delay to avoid hammering the free geocoder
            await new Promise((r) => setTimeout(r, 300));
          }

          if (Object.keys(newHostCoords).length) {
            setHostCoords((prev) => ({ ...prev, ...newHostCoords }));
          }
          if (Object.keys(newEventCoords).length) {
            setEventCoords((prev) => ({ ...prev, ...newEventCoords }));
          }
          if (Object.keys(newParkingCoords).length) {
            setParkingCoords((prev) => ({ ...prev, ...newParkingCoords }));
          }
          if (Object.keys(newFailures).length) {
            setGeocodeFailures((prev) => ({ ...prev, ...newFailures }));
          }
        } finally {
          geocodeInFlight.current = false;
        }
      })();
    }
  }, [
    mapLocations,
    uniqueParkingPassLocations,
    hostCoords,
    eventCoords,
    parkingCoords,
    geocodeCache,
    geocodeFailures,
    mapBounds,
    zoomLevel,
  ]);

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
    }
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    if (deal.restaurant) {
      setMapCenter({
        lat: deal.restaurant.latitude,
        lng: deal.restaurant.longitude,
      });
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, 1));
  };

  const hasLocation = !!userLocation;
  const liveTruckPins = visibleLiveTrucks.length;
  const hostPins = visibleHostLocations.length;
  const eventPins = visibleEventLocations.length;
  const parkingPins = visibleParkingLocations.length;
  const activityPins = liveTruckPins + hostPins + eventPins + parkingPins;
  const headerSubtitle = isLocating
    ? "Locating live trucks and host spots..."
    : hasLocation && activityPins > 0
    ? "Live trucks and host locations nearby"
    : hasLocation
    ? "No live trucks or hosts nearby right now"
    : "Set your location to see live trucks and hosts.";

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      <SEOHead
        title="Map View - MealScout | Find Deals Near You"
        description="Explore food deals on an interactive map. See nearby restaurants, view deal locations, and discover dining discounts in your area. Find the perfect meal deal near you!"
        keywords="map view, nearby deals, restaurant map, food deals location, nearby restaurants, local deals map"
        canonicalUrl="https://mealscout.us/map"
      />
      {/* Header */}
      <header className="px-6 py-5 bg-white/90 backdrop-blur border-b border-border relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
              <img
                src={mealScoutIcon}
                alt="MealScout"
                className="w-7 h-7"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                MealScout Map
              </h1>
              <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowList(!showList)}
              data-testid="button-toggle-list"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Location Status */}
        {locationError && (
          <div className="text-xs text-red-600 mb-4 bg-red-50 border border-red-200 rounded p-2">
            ⚠️ {locationError}
          </div>
        )}
        {userLocation && (
          <div className="text-xs text-muted-foreground mb-4">
            📍 Located: {userLocation.lat.toFixed(4)},{" "}
            {userLocation.lng.toFixed(4)}
            {liveTruckPins > 0 &&
              ` • ${liveTruckPins} truck${
                liveTruckPins === 1 ? "" : "s"
              } nearby`}
          </div>
        )}
      </header>

      {/* Map Container */}
      <div className="relative flex-1">
        <div className="relative h-[60vh] min-h-[320px]">
          {mapCenter && (
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={zoomLevel}
              preferCanvas
              style={{ height: "100%", width: "100%" }}
              className="rounded-lg overflow-hidden"
            >
              <MapCenterer center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />

              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={userLocationIcon}
                >
                  <Popup>
                    <div className="text-center rounded-xl bg-slate-900 text-white px-3 py-2 shadow-lg">
                      <div className="text-xs uppercase tracking-wide text-slate-300">
                        MealScout
                      </div>
                      <div className="font-semibold text-sm">You are here</div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Geo Ad Markers */}
              {visibleGeoAds.map((ad: GeoAd) => (
                <Marker
                  key={ad.id}
                  position={[ad.pinLat ?? mapCenter.lat, ad.pinLng ?? mapCenter.lng]}
                  icon={geoAdPinIcon}
                >
                  <Popup>
                    <div className="min-w-52 rounded-xl bg-white text-slate-900 p-3 shadow-lg space-y-1">
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">
                        Sponsored
                      </div>
                      <div className="font-semibold text-sm">{ad.title}</div>
                      {ad.body && (
                        <div className="text-xs text-slate-500">{ad.body}</div>
                      )}
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleGeoAdClick(ad)}
                      >
                        {ad.ctaText || "Learn more"}
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Deal Markers */}
              {visibleDeals.map((deal: Deal) => {
                if (!deal.restaurant) return null;
                return (
                  <Marker
                    key={deal.id}
                    position={[
                      deal.restaurant.latitude,
                      deal.restaurant.longitude,
                    ]}
                    icon={foodPinIcon}
                    eventHandlers={{
                      click: () => handleDealClick(deal),
                    }}
                  >
                    <Popup>
                      <div className="min-w-52 rounded-xl bg-white text-slate-900 p-3 shadow-lg space-y-1">
                        <div className="font-semibold text-sm">
                          {deal.restaurant.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Deal available
                        </div>
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="font-semibold text-amber-600">
                            {deal.discountValue}% OFF
                          </span>
                          <span className="text-slate-500">
                            Min ${deal.minOrderAmount}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleDealClick(deal)}
                        >
                          View deal
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Live Truck Markers */}
              {visibleUnhostedTrucks.map((truck) => {
                const lat = toNumberOrNull(truck.currentLatitude);
                const lng = toNumberOrNull(truck.currentLongitude);
                if (!lat || !lng) return null;
                const distanceLabel = formatDistance({ lat, lng });
                return (
                  <Marker
                    key={`live-${truck.id}`}
                    position={[lat, lng]}
                    icon={truckPinIcon}
                  >
                    <Popup>
                      <div className="min-w-52 rounded-xl bg-white text-slate-900 p-3 shadow-lg space-y-1">
                        <div className="font-semibold text-sm">
                          {truck.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Food Truck • Live now
                        </div>
                        {distanceLabel && (
                          <div className="text-xs text-slate-500">
                            {distanceLabel} away
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              window.location.href = `/restaurant/${truck.id}`;
                            }}
                          >
                            View menu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              window.open(
                                `https://maps.google.com/?q=${lat},${lng}`,
                                "_blank",
                              );
                            }}
                          >
                            Directions
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Host Location Markers (open requests) */}
              {visibleHostLocations.map((host) => {
                const coords = resolveHostCoords(host);
                if (!coords) return null;
                const hostedTruck = findNearbyTruck(coords);
                const title = hostedTruck ? hostedTruck.truck.name : host.name;
                const subtitle = hostedTruck
                  ? `At ${host.name}`
                  : "Hosts food trucks";
                const distanceLabel = formatDistance(coords);
                return (
                  <Marker
                    key={`host-${host.id}`}
                    position={[coords.lat, coords.lng]}
                    icon={hostedTruck ? hostPinActiveIcon : hostPinIcon}
                  >
                    <Popup>
                      <div className="min-w-56 space-y-1 rounded-xl bg-white text-slate-900 p-3 shadow-lg">
                        <div className="font-semibold text-sm">{title}</div>
                        <div className="text-xs text-slate-500">{subtitle}</div>
                        <div className="text-xs text-slate-500">
                          {host.address}
                        </div>
                        {distanceLabel && (
                          <div className="text-xs text-slate-500">
                            {distanceLabel} away
                          </div>
                        )}
                        {hostedTruck ? (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                window.location.href = `/restaurant/${hostedTruck.truck.id}`;
                              }}
                            >
                              View menu
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                window.open(
                                  `https://maps.google.com/?q=${coords.lat},${coords.lng}`,
                                  "_blank",
                                );
                              }}
                            >
                              Directions
                            </Button>
                          </div>
                        ) : (
                          <div className="pt-2">
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                window.open(
                                  `https://maps.google.com/?q=${coords.lat},${coords.lng}`,
                                  "_blank",
                                );
                              }}
                            >
                              Directions
                            </Button>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Event Markers */}
              {visibleEventLocations.map((event) => {
                const coords = resolveEventCoords(event);
                if (!coords) return null;
                const title = event.name;
                const subtitle = event.hostName
                  ? `Event at ${event.hostName}`
                  : "Event location";
                const distanceLabel = formatDistance(coords);
                return (
                  <Marker
                    key={`event-${event.id}`}
                    position={[coords.lat, coords.lng]}
                    icon={eventPinIcon}
                  >
                    <Popup>
                      <div className="min-w-56 space-y-1 rounded-xl bg-white text-slate-900 p-3 shadow-lg">
                        <div className="font-semibold text-sm">{title}</div>
                        <div className="text-xs text-slate-500">{subtitle}</div>
                        {event.hostAddress && (
                          <div className="text-xs text-slate-500">
                            {event.hostAddress}
                          </div>
                        )}
                        <div className="text-xs text-slate-500">
                          {new Date(event.date).toLocaleDateString()} •{" "}
                          {event.startTime} - {event.endTime}
                        </div>
                        {distanceLabel && (
                          <div className="text-xs text-slate-500">
                            {distanceLabel} away
                          </div>
                        )}
                        <div className="pt-2">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              window.open(
                                `https://maps.google.com/?q=${coords.lat},${coords.lng}`,
                                "_blank",
                              );
                            }}
                          >
                            Directions
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Parking Pass Markers */}
              {visibleParkingLocations.map((event) => {
                const coords = resolveParkingCoords(event);
                if (!coords) return null;
                const hostedTruck = findNearbyTruck(coords);
                const hostName = event.host?.businessName || "Host location";
                const title = hostedTruck ? hostedTruck.truck.name : hostName;
                const subtitle = hostedTruck ? `At ${hostName}` : "Hosts food trucks";
                const distanceLabel = formatDistance(coords);
                const bookings = Array.isArray(event.bookings)
                  ? event.bookings
                  : [];
                const bookingPreview = bookings.slice(0, 3);
                return (
                  <Marker
                    key={`parking-${event.id}`}
                    position={[coords.lat, coords.lng]}
                    icon={parkingPassPinIcon}
                  >
                    <Popup>
                      <div className="min-w-56 space-y-1 rounded-xl bg-white text-slate-900 p-3 shadow-lg">
                        <div className="font-semibold text-sm">{title}</div>
                        <div className="text-xs text-slate-500">{subtitle}</div>
                        {event.host?.address && (
                          <div className="text-xs text-slate-500">
                            {event.host.address}
                          </div>
                        )}
                        <div className="text-xs text-slate-500">
                          {new Date(event.date).toLocaleDateString()} •{" "}
                          {event.startTime === "00:00" &&
                          event.endTime === "23:59"
                            ? "Any time"
                            : `${event.startTime} - ${event.endTime}`}
                        </div>
                        {distanceLabel && (
                          <div className="text-xs text-slate-500">
                            {distanceLabel} away
                          </div>
                        )}
                        {bookings.length > 0 ? (
                          <div className="pt-1 text-xs text-slate-500">
                            <div className="font-semibold text-slate-700">
                              Scheduled trucks
                            </div>
                            <div className="space-y-1 mt-1">
                              {bookingPreview.map((booking) => {
                                const slotLabel = formatSlotType(
                                  booking.slotType,
                                );
                                const spotLabel = booking.spotNumber
                                  ? `Spot ${booking.spotNumber}`
                                  : null;
                                return (
                                  <div
                                    key={`${booking.truckId}-${booking.slotType || "slot"}`}
                                  >
                                    {booking.truckName}
                                    {slotLabel ? ` · ${slotLabel}` : ""}
                                    {spotLabel ? ` · ${spotLabel}` : ""}
                                  </div>
                                );
                              })}
                              {bookings.length > 3 && (
                                <div className="text-[11px] text-slate-400">
                                  +{bookings.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 pt-1">
                            No bookings yet
                          </div>
                        )}
                        {hostedTruck ? (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                window.location.href = `/restaurant/${hostedTruck.truck.id}`;
                              }}
                            >
                              View menu
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                window.open(
                                  `https://maps.google.com/?q=${coords.lat},${coords.lng}`,
                                  "_blank",
                                );
                              }}
                            >
                              Directions
                            </Button>
                          </div>
                        ) : (
                          <div className="pt-2">
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                window.open(
                                  `https://maps.google.com/?q=${coords.lat},${coords.lng}`,
                                  "_blank",
                                );
                              }}
                            >
                              Directions
                            </Button>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Map Controls */}
              <MapControls
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onCenterUser={handleCenterOnUser}
                userLocation={userLocation}
                zoomLevel={zoomLevel}
              />
              <MapViewportWatcher
                onZoomChange={setZoomLevel}
                onBoundsChange={setMapBounds}
              />
            </MapContainer>
          )}

          {/* Empty map overlay messaging */}
          {!isLoading && !isLocating && deals.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-background/90 rounded-xl px-4 py-3 text-center shadow-sm max-w-xs">
                <p className="text-sm font-medium text-foreground mb-1">
                  {hasLocation
                    ? "No trucks nearby right now"
                    : "Set your location to see trucks nearby"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hasLocation
                    ? "Try moving the map or check back later."
                    : "Use your location or move the map to explore different areas."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Selected Deal Info Card */}
        {selectedDeal && (
          <Card className="absolute bottom-4 left-4 right-4 z-20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-sm">
                    {selectedDeal.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedDeal.restaurant?.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDeal(null)}
                  className="p-1 h-6 w-6"
                  data-testid="button-close-selected-deal"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-primary font-bold text-sm">
                    {selectedDeal.discountValue}% OFF
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Min: ${selectedDeal.minOrderAmount}
                  </span>
                </div>
                <Button size="sm" data-testid="button-view-deal">
                  View Deal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* List View Overlay */}
      {showList && (
        <div className="absolute inset-0 bg-white z-40 overflow-y-auto">
          <header className="px-6 py-6 bg-white border-b border-border sticky top-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                Nearby Deals
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowList(false)}
                data-testid="button-close-list"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </header>

          <div className="px-6 py-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-md"
                  >
                    <div className="w-full h-48 bg-muted"></div>
                    <div className="p-6 space-y-3">
                      <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                      <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : deals.length > 0 ? (
              <div className="space-y-4">
                {deals.map((deal: Deal) => (
                  <div key={deal.id} onClick={() => handleDealClick(deal)}>
                    <DealCard deal={deal} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No deals nearby
                </h3>
                <p className="text-muted-foreground">
                  Try expanding your search area or check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
}
