import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation as NavigationIcon, List, Filter, X, Star } from "lucide-react";
import DealCard from "@/components/deal-card";
import { SEOHead } from "@/components/seo-head";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

// Custom user location icon
const userLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
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
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="white" stroke-width="3"/>
      <text x="16" y="20" text-anchor="middle" fill="white" font-size="14" font-weight="bold">%</text>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Component to handle map controls
function MapControls({ onZoomIn, onZoomOut, onCenterUser, userLocation, zoomLevel }: {
  onZoomIn: () => void;
  onZoomOut: () => void; 
  onCenterUser: () => void;
  userLocation: {lat: number, lng: number} | null;
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

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number}>({ lat: 30.5365, lng: -90.5347 });
  const [showList, setShowList] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(16);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
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
          const response = await fetch(`/api/deals/nearby/${userLocation.lat}/${userLocation.lng}`);
          if (!response.ok) throw new Error('Failed to fetch nearby deals');
          return response.json();
        }
      : undefined,
    enabled: !!userLocation,
  });

  const deals: Deal[] = Array.isArray(dealsData) ? dealsData as Deal[] : [];

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
        lng: deal.restaurant.longitude
      });
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 1));
  };

  const hasLocation = !!userLocation;
  const hasDeals = deals.length > 0;

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
                ? "Food trucks near you"
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
            📍 Located: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            {deals.length > 0 && ` • ${deals.length} truck${deals.length === 1 ? "" : "s"} nearby`}
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
              style={{ height: '100%', width: '100%' }}
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
                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
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
                    position={[deal.restaurant.latitude, deal.restaurant.longitude]}
                    icon={dealMarkerIcon}
                    eventHandlers={{
                      click: () => handleDealClick(deal)
                    }}
                  >
                    <Popup>
                      <div className="min-w-48">
                        <div className="font-semibold text-sm mb-1">{deal.title}</div>
                        <div className="text-xs text-muted-foreground mb-2">{deal.restaurant.name}</div>
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
              <h2 className="text-xl font-bold text-foreground">Nearby Deals</h2>
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
                  <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-md">
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
                <h3 className="text-lg font-semibold text-foreground mb-2">No deals nearby</h3>
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