import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation as NavigationIcon, List, Filter, X, Star } from "lucide-react";
import DealCard from "@/components/deal-card";

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
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number}>({ lat: 29.4194, lng: -90.6047 });
  const [showList, setShowList] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isLocating, setIsLocating] = useState(false);

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
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Fetch nearby deals
  const { data: dealsData = [], isLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
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

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Map View</h1>
            <p className="text-sm text-muted-foreground">
              {isLocating ? "Finding your location..." : "Deals near you"}
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleCenterOnUser}
              disabled={!userLocation}
              data-testid="button-center-location"
            >
              <NavigationIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Location Status */}
        {userLocation && (
          <div className="text-xs text-muted-foreground mb-4">
            📍 Located: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </div>
        )}
      </header>

      {/* Map Container */}
      <div className="relative flex-1">
        {/* Placeholder Map - In production, this would be Google Maps or Mapbox */}
        <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden">
          {/* Map Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="gray" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          {/* User Location Marker */}
          {userLocation && (
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ 
                left: '50%', 
                top: '50%'
              }}
            >
              <div className="relative">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                <div className="absolute -inset-2 border-2 border-blue-400 rounded-full opacity-50 animate-ping" />
              </div>
            </div>
          )}

          {/* Restaurant/Deal Markers */}
          {deals.map((deal: Deal, index: number) => {
            if (!deal.restaurant) return null;
            
            // Calculate relative position (mock positioning)
            const offsetX = (index % 3 - 1) * 80;
            const offsetY = (Math.floor(index / 3) % 3 - 1) * 60;
            
            return (
              <div
                key={deal.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                style={{
                  left: `calc(50% + ${offsetX}px)`,
                  top: `calc(50% + ${offsetY}px)`
                }}
                onClick={() => handleDealClick(deal)}
                data-testid={`marker-deal-${deal.id}`}
              >
                {/* Deal Marker */}
                <div className="relative">
                  <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors">
                    <span className="text-white text-xs font-bold">%</span>
                  </div>
                  
                  {/* Hover Card */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-white rounded-lg shadow-lg p-3 min-w-48 border">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {deal.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {deal.restaurant.name}
                      </div>
                      <div className="text-xs text-primary font-semibold">
                        {deal.discountValue}% off
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
            <Button
              variant="secondary"
              size="sm"
              className="w-8 h-8 p-0 bg-white border"
              onClick={() => {/* Zoom in logic */}}
              data-testid="button-zoom-in"
            >
              +
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-8 h-8 p-0 bg-white border"
              onClick={() => {/* Zoom out logic */}}
              data-testid="button-zoom-out"
            >
              −
            </Button>
          </div>
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
                    <DealCard deal={{...deal, isFeatured: deal.isFeatured || false}} />
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