import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import DealCard from "@/components/deal-card";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Deal {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  dealType: string;
  discountValue: string;
  minOrderAmount?: string;
  imageUrl?: string;
  isFeatured: boolean;
}

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationName, setLocationName] = useState("Getting location...");

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          // Reverse geocoding for display name
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(res => res.json())
            .then(data => {
              setLocationName(data.locality || data.city || "Your Location");
            })
            .catch(() => {
              setLocationName("Your Location");
            });
        },
        () => {
          setLocationName("Location unavailable");
        }
      );
    }
  }, []);

  const { data: featuredDeals, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
  });

  const { data: nearbyDeals, isLoading: nearbyLoading } = useQuery({
    queryKey: ["/api/deals/nearby", location?.lat, location?.lng],
    enabled: !!location,
  });

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Header with Location */}
      <header className="bg-white border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="fas fa-map-marker-alt text-primary text-lg"></i>
            <div>
              <p className="font-semibold text-sm text-foreground" data-testid="text-location-label">Your Location</p>
              <p className="text-xs text-muted-foreground" data-testid="text-location-name">{locationName}</p>
            </div>
          </div>
          <button 
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-profile"
          >
            <i className="fas fa-user text-muted-foreground"></i>
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-muted/50">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
          <Input 
            type="text" 
            placeholder="Search deals, restaurants..." 
            className="w-full pl-10 pr-4 py-3"
            data-testid="input-search"
          />
        </div>
        
        {/* Filter Chips */}
        <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-shrink-0 rounded-full text-xs"
            data-testid="button-filter-hot"
          >
            <i className="fas fa-fire mr-1"></i> Hot Deals
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0 rounded-full text-xs"
            data-testid="button-filter-quick"
          >
            <i className="fas fa-clock mr-1"></i> Quick Bites
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0 rounded-full text-xs"
            data-testid="button-filter-italian"
          >
            <i className="fas fa-pizza-slice mr-1"></i> Italian
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0 rounded-full text-xs"
            data-testid="button-filter-budget"
          >
            <i className="fas fa-dollar-sign mr-1"></i> Under $10
          </Button>
        </div>
      </div>

      {/* Featured Deals Section */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground" data-testid="text-featured-title">🔥 Hot Deals Nearby</h2>
          <button className="text-primary text-sm font-medium" data-testid="button-view-all">View All</button>
        </div>

        {featuredLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
                <div className="w-full h-32 bg-muted"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(featuredDeals) && featuredDeals.length > 0 ? (
              featuredDeals.map((deal: Deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-utensils text-muted-foreground text-3xl mb-4"></i>
                <p className="text-muted-foreground" data-testid="text-no-deals">No featured deals available right now</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Restaurant Categories */}
      <div className="px-4 py-4 bg-muted/30">
        <h2 className="text-lg font-semibold text-foreground mb-4" data-testid="text-categories-title">Browse by Category</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white border border-border flex items-center justify-center">
              <i className="fas fa-pizza-slice text-secondary"></i>
            </div>
            <p className="text-xs font-medium text-foreground" data-testid="text-category-pizza">Pizza</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white border border-border flex items-center justify-center">
              <i className="fas fa-hamburger text-primary"></i>
            </div>
            <p className="text-xs font-medium text-foreground" data-testid="text-category-burgers">Burgers</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white border border-border flex items-center justify-center">
              <i className="fas fa-fish text-accent"></i>
            </div>
            <p className="text-xs font-medium text-foreground" data-testid="text-category-asian">Asian</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white border border-border flex items-center justify-center">
              <i className="fas fa-pepper-hot text-destructive"></i>
            </div>
            <p className="text-xs font-medium text-foreground" data-testid="text-category-mexican">Mexican</p>
          </div>
        </div>
      </div>

      {/* For Workers Section */}
      <div className="px-4 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground" data-testid="text-workers-title">👷 Perfect for Workers</h2>
            <p className="text-sm text-muted-foreground" data-testid="text-workers-subtitle">Quick meals for busy professionals</p>
          </div>
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm">
            <div className="w-full h-full bg-accent flex items-center justify-center">
              <i className="fas fa-hard-hat text-white text-xl"></i>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-4 border border-border">
            <div className="flex items-center space-x-2 mb-2">
              <i className="fas fa-bolt text-secondary"></i>
              <span className="font-medium text-sm" data-testid="text-fast-pickup">Fast Pickup</span>
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-fast-pickup-desc">Ready in 10 min or less</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-border">
            <div className="flex items-center space-x-2 mb-2">
              <i className="fas fa-utensils text-primary"></i>
              <span className="font-medium text-sm" data-testid="text-hearty-meals">Hearty Meals</span>
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-hearty-meals-desc">Filling portions for workers</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}
