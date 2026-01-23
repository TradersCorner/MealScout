import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Navigation as NavigationIcon,
  List,
  Filter,
  X,
  Star,
  Calendar,
  Building2,
} from "lucide-react";
import DealCard from "@/components/deal-card";
import { SEOHead } from "@/components/seo-head";
import ShareButton from "@/components/share-button";

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

// Custom user location icon
const userLocationIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="3"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom deal marker icon
const dealMarkerIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="white" stroke-width="3"/>
      <text x="16" y="20" text-anchor="middle" fill="white" font-size="14" font-weight="bold">%</text>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
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
    <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
      <Button
        variant="secondary"
        size="sm"
        className="w-8 h-8 p-0 bg-white border shadow-sm"
        onClick={handleZoomIn}
        data-testid="button-zoom-in"
        title="Zoom in"
      >
        +
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="w-8 h-8 p-0 bg-white border shadow-sm"
        onClick={handleZoomOut}
        data-testid="button-zoom-out"
        title="Zoom out"
      >
        −
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="w-8 h-8 p-0 bg-white border shadow-sm"
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

type HostLocation = {
  id: string;
  name: string;
  address: string;
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
};

type ParkingPassLocation = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  host: HostLocation & { city?: string | null; state?: string | null };
};

type MapLocationsResponse = {
  hostLocations: HostLocation[];
  eventLocations: EventLocation[];
};

type GeoPoint = { lat: number; lng: number };

const hostIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12" fill="#2563EB" stroke="white" stroke-width="3"/>
        <path d="M14 7l5 4v8h-3v-4h-4v4H9v-8l5-4z" fill="white"/>
      </svg>
    `),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -24],
});

const eventIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="24" height="20" rx="4" fill="#7C3AED" stroke="white" stroke-width="3"/>
        <path d="M9 3v4M21 3v4" stroke="white" stroke-width="3" stroke-linecap="round"/>
        <path d="M7 12h16" stroke="white" stroke-width="3"/>
      </svg>
    `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -26],
});

const parkingPassIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="13" fill="#F97316" stroke="white" stroke-width="3"/>
        <path d="M12 8h5a4 4 0 0 1 0 8h-5v6h-3V8h3zm0 3v3h4a1.5 1.5 0 0 0 0-3h-4z" fill="white"/>
      </svg>
    `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -24],
});

const liveTruckIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="13" fill="#10B981" stroke="white" stroke-width="3"/>
        <path d="M8 17h9l2-4h2.5c.8 0 1.5.7 1.5 1.5V17h-2.5a2 2 0 1 1-4 0H12a2 2 0 1 1-4 0H6v-6h2v6z" fill="white"/>
      </svg>
    `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -24],
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
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hostCoords, setHostCoords] = useState<Record<string, GeoPoint>>({});
  const [eventCoords, setEventCoords] = useState<Record<string, GeoPoint>>({});
  const [parkingCoords, setParkingCoords] = useState<Record<string, GeoPoint>>(
    {},
  );
  const [geocodingQueue, setGeocodingQueue] = useState<string[]>([]);

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

  // Build a geocoding work list for any host/event without coordinates yet
  useEffect(() => {
    const queue: string[] = [];
    const addressByKey: Record<string, string> = {};

    mapLocations?.hostLocations.forEach((host) => {
      if (!hostCoords[host.id]) {
        queue.push(`host:${host.id}`);
        addressByKey[`host:${host.id}`] = host.address;
      }
    });

    mapLocations?.eventLocations.forEach((event) => {
      if (!eventCoords[event.id] && event.hostAddress) {
        queue.push(`event:${event.id}`);
        addressByKey[`event:${event.id}`] = event.hostAddress;
      }
    });

    parkingPassLocations.forEach((event) => {
      if (!parkingCoords[event.id] && event.host?.address) {
        queue.push(`parking:${event.id}`);
        addressByKey[`parking:${event.id}`] = event.host.address;
      }
    });

    if (queue.length) {
      setGeocodingQueue(queue);
      (async () => {
        const newHostCoords: Record<string, GeoPoint> = {};
        const newEventCoords: Record<string, GeoPoint> = {};
        const newParkingCoords: Record<string, GeoPoint> = {};

        for (const key of queue) {
          const address = addressByKey[key];
          if (!address) continue;
          const point = await geocodeAddress(address).catch(() => null);
          if (!point) continue;
          if (key.startsWith("host:")) {
            newHostCoords[key.replace("host:", "")] = point;
          } else if (key.startsWith("event:")) {
            newEventCoords[key.replace("event:", "")] = point;
          } else if (key.startsWith("parking:")) {
            newParkingCoords[key.replace("parking:", "")] = point;
          }
          // small delay to avoid hammering the free geocoder
          await new Promise((r) => setTimeout(r, 150));
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
        setGeocodingQueue([]);
      })();
    }
  }, [mapLocations, parkingPassLocations, hostCoords, eventCoords, parkingCoords]);

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
  const hasDeals = deals.length > 0;
  const liveTruckPins = liveTrucks.length;
  const hostPins = mapLocations?.hostLocations?.length || 0;
  const eventPins = mapLocations?.eventLocations?.length || 0;
  const parkingPins = parkingPassLocations.length;

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      <SEOHead
        title="Map View - MealScout | Find Deals Near You"
        description="Explore food deals on an interactive map. See nearby restaurants, view deal locations, and discover dining discounts in your area. Find the perfect meal deal near you!"
        keywords="map view, nearby deals, restaurant map, food deals location, nearby restaurants, local deals map"
        canonicalUrl="https://mealscout.us/map"
      />
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Map View</h1>
            <p className="text-sm text-muted-foreground">
              {isLocating
                ? "Finding nearby food trucks..."
                : hasLocation && liveTruckPins > 0
                ? "Food trucks and parking spots near you"
                : hasLocation && hasDeals
                ? "Deals near you"
                : hasLocation &&
                  !hasDeals &&
                  (hostPins > 0 ||
                    eventPins > 0 ||
                    liveTruckPins > 0 ||
                    parkingPins > 0)
                ? "Hosts and parking spots near you"
                : hasLocation && !hasDeals
                ? "No food trucks nearby right now"
                : "Set your location to see trucks nearby"}
            </p>
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
              style={{ height: "100%", width: "100%" }}
              className="rounded-lg overflow-hidden"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={userLocationIcon}
                >
                  <Popup>
                    <div className="text-center rounded-xl bg-blue-600 text-white px-3 py-2 shadow-lg">
                      <div className="font-semibold text-sm">You are here</div>
                      <div className="text-xs text-blue-100">
                        {userLocation.lat.toFixed(4)},{" "}
                        {userLocation.lng.toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Deal Markers */}
              {deals.map((deal: Deal) => {
                if (!deal.restaurant) return null;
                return (
                  <Marker
                    key={deal.id}
                    position={[
                      deal.restaurant.latitude,
                      deal.restaurant.longitude,
                    ]}
                    icon={dealMarkerIcon}
                    eventHandlers={{
                      click: () => handleDealClick(deal),
                    }}
                  >
                    <Popup>
                      <div className="min-w-48 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white p-3 shadow-lg space-y-1">
                        <div className="font-semibold text-sm">
                          {deal.title}
                        </div>
                        <div className="text-xs text-red-100">
                          {deal.restaurant.name}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-bold text-sm">
                            {deal.discountValue}% OFF
                          </span>
                          <span className="text-xs text-orange-100">
                            Min order: ${deal.minOrderAmount}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Live Truck Markers */}
              {liveTrucks.map((truck) => {
                const lat = truck.currentLatitude
                  ? Number(truck.currentLatitude)
                  : null;
                const lng = truck.currentLongitude
                  ? Number(truck.currentLongitude)
                  : null;
                if (!lat || !lng) return null;
                return (
                  <Marker
                    key={`live-${truck.id}`}
                    position={[lat, lng]}
                    icon={liveTruckIcon}
                  >
                    <Popup>
                      <div className="min-w-48 rounded-xl bg-emerald-600 text-white p-3 shadow-lg space-y-1">
                        <div className="font-semibold text-sm">
                          {truck.name}
                        </div>
                        <div className="text-xs text-emerald-100">
                          Live now
                        </div>
                        {typeof truck.distance === "number" && (
                          <div className="text-xs text-emerald-100">
                            {truck.distance.toFixed(1)} km away
                          </div>
                        )}
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-white text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            window.location.href = `/restaurant/${truck.id}`;
                          }}
                        >
                          View truck
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Host Location Markers (open requests) */}
              {mapLocations?.hostLocations.map((host) => {
                const coords = hostCoords[host.id];
                if (!coords) return null;
                return (
                  <Marker
                    key={`host-${host.id}`}
                    position={[coords.lat, coords.lng]}
                    icon={hostIcon}
                  >
                    <Popup>
                      <div className="min-w-52 space-y-1 rounded-xl bg-blue-600 text-white p-3 shadow-lg">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-blue-100" />
                          <div className="font-semibold text-sm">
                            {host.name}
                          </div>
                        </div>
                        <div className="text-xs text-blue-100">
                          {host.address}
                        </div>
                        {host.locationType && (
                          <div className="text-[11px] uppercase tracking-wide text-blue-200 font-semibold">
                            {host.locationType}
                          </div>
                        )}
                        <div className="pt-2">
                          <ShareButton
                            url={`/map?host=${host.id}`}
                            title={`Host location: ${host.name}`}
                            description={host.address}
                            size="sm"
                            variant="outline"
                            className="w-full justify-center text-blue-700"
                          />
                        </div>
                        {host.expectedFootTraffic && (
                          <div className="text-xs text-blue-100">
                            Expected foot traffic: {host.expectedFootTraffic}
                          </div>
                        )}
                        {host.preferredDates?.length ? (
                          <div className="text-xs text-blue-100 flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {host.preferredDates.slice(0, 3).join(", ")}
                            </span>
                          </div>
                        ) : null}
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-white text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            // Send truck owners to dashboard to book/express interest
                            window.location.href = `/restaurant-owner-dashboard?locationRequestId=${host.id}`;
                          }}
                        >
                          Request to book
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Event Markers */}
              {mapLocations?.eventLocations.map((event) => {
                const coords = eventCoords[event.id];
                if (!coords) return null;
                return (
                  <Marker
                    key={`event-${event.id}`}
                    position={[coords.lat, coords.lng]}
                    icon={eventIcon}
                  >
                    <Popup>
                      <div className="min-w-52 space-y-1 rounded-xl bg-purple-600 text-white p-3 shadow-lg">
                        <div className="font-semibold text-sm">
                          {event.name}
                        </div>
                        {event.hostName && (
                          <div className="text-xs text-purple-100">
                            Host: {event.hostName}
                          </div>
                        )}
                        {event.hostAddress && (
                          <div className="text-xs text-purple-100">
                            {event.hostAddress}
                          </div>
                        )}
                        <div className="text-xs text-purple-100">
                          {new Date(event.date).toLocaleDateString()} •{" "}
                          {event.startTime} - {event.endTime}
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-white text-purple-700 hover:bg-purple-50"
                          onClick={() => {
                            window.location.href = `/restaurant-owner-dashboard?eventId=${event.id}`;
                          }}
                        >
                          View & book slot
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Parking Pass Markers */}
              {parkingPassLocations.map((event) => {
                const coords =
                  parkingCoords[event.id] ||
                  (event.host?.latitude && event.host?.longitude
                    ? {
                        lat: Number(event.host.latitude),
                        lng: Number(event.host.longitude),
                      }
                    : null);
                if (!coords) return null;
                return (
                  <Marker
                    key={`parking-${event.id}`}
                    position={[coords.lat, coords.lng]}
                    icon={parkingPassIcon}
                  >
                    <Popup>
                      <div className="min-w-52 space-y-1 rounded-xl bg-orange-600 text-white p-3 shadow-lg">
                        <div className="font-semibold text-sm">
                          Parking Pass
                        </div>
                        <div className="text-xs text-orange-100">
                          {event.host?.businessName}
                        </div>
                        <div className="text-xs text-orange-100">
                          {event.host?.address}
                        </div>
                        <div className="text-xs text-orange-100">
                          {new Date(event.date).toLocaleDateString()} -{" "}
                          {event.startTime === "00:00" &&
                          event.endTime === "23:59"
                            ? "Any time"
                            : `${event.startTime} - ${event.endTime}`}
                        </div>
                        <ShareButton
                          url={`/parking-pass?date=${encodeURIComponent(
                            new Date(event.date).toISOString().split("T")[0],
                          )}&pass=${event.id}`}
                          title={`Parking Pass at ${event.host?.businessName || "Host"}`}
                          description={event.host?.address || "Parking pass location"}
                          size="sm"
                          variant="outline"
                          className="w-full justify-center text-orange-700"
                        />
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-white text-orange-700 hover:bg-orange-50"
                          onClick={() => {
                            const day = new Date(event.date)
                              .toISOString()
                              .split("T")[0];
                            window.location.href = `/parking-pass?date=${day}`;
                          }}
                        >
                          View spots
                        </Button>
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
