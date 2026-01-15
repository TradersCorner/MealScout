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
  const [geocodingQueue, setGeocodingQueue] = useState<string[]>([]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setMapCenter(location);
          setIsLocating(false);
        },
        (error) => {
          console.log("Location error:", error);
          setLocationError("Unable to get your location");
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

    if (queue.length) {
      setGeocodingQueue(queue);
      (async () => {
        const newHostCoords: Record<string, GeoPoint> = {};
        const newEventCoords: Record<string, GeoPoint> = {};

        for (const key of queue) {
          const address = addressByKey[key];
          if (!address) continue;
          const point = await geocodeAddress(address).catch(() => null);
          if (!point) continue;
          if (key.startsWith("host:")) {
            newHostCoords[key.replace("host:", "")] = point;
          } else if (key.startsWith("event:")) {
            newEventCoords[key.replace("event:", "")] = point;
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
        setGeocodingQueue([]);
      })();
    }
  }, [mapLocations, hostCoords, eventCoords]);

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
  const hostPins = mapLocations?.hostLocations?.length || 0;
  const eventPins = mapLocations?.eventLocations?.length || 0;

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
                : hasLocation && hasDeals
                ? "Food trucks and hosts near you"
                : hasLocation && !hasDeals && (hostPins > 0 || eventPins > 0)
                ? "Hosts and events near you"
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
            {deals.length > 0 &&
              ` • ${deals.length} truck${deals.length === 1 ? "" : "s"} nearby`}
          </div>
        )}
      </header>

      {/* Map Container */}
      <div className="relative flex-1">
        <div className="h-96 relative">
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
                    <div className="text-center">
                      <div className="font-semibold text-sm">You are here</div>
                      <div className="text-xs text-muted-foreground">
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
                      <div className="min-w-48">
                        <div className="font-semibold text-sm mb-1">
                          {deal.title}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {deal.restaurant.name}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-primary font-bold text-sm">
                            {deal.discountValue}% OFF
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Min: ${deal.minOrderAmount}
                          </span>
                        </div>
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
                      <div className="min-w-52 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <div className="font-semibold text-sm">
                            {host.name}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {host.address}
                        </div>
                        {host.locationType && (
                          <div className="text-[11px] uppercase tracking-wide text-blue-700 font-semibold">
                            {host.locationType}
                          </div>
                        )}
                        {host.expectedFootTraffic && (
                          <div className="text-xs text-muted-foreground">
                            Expected foot traffic: {host.expectedFootTraffic}
                          </div>
                        )}
                        {host.preferredDates?.length ? (
                          <div className="text-xs text-muted-foreground flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {host.preferredDates.slice(0, 3).join(", ")}
                            </span>
                          </div>
                        ) : null}
                        <Button
                          size="sm"
                          className="w-full mt-2"
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
                      <div className="min-w-52 space-y-1">
                        <div className="font-semibold text-sm">
                          {event.name}
                        </div>
                        {event.hostName && (
                          <div className="text-xs text-muted-foreground">
                            Host: {event.hostName}
                          </div>
                        )}
                        {event.hostAddress && (
                          <div className="text-xs text-muted-foreground">
                            {event.hostAddress}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()} •{" "}
                          {event.startTime} - {event.endTime}
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-2"
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
