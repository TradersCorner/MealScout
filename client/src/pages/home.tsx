import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import DealCard from "@/components/deal-card";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, User, Search, Flame, Clock, Pizza, DollarSign, Utensils, Fish, Zap, HardHat } from "lucide-react";

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
    <div className="max-w-md mx-auto bg-background min-h-screen relative overflow-hidden">
      {/* Header with Location */}
      <header className="glass-effect border-b border-border/50 px-6 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 food-gradient-primary rounded-xl flex items-center justify-center shadow-md">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground" data-testid="text-location-label">Your Location</p>
              <p className="text-sm text-muted-foreground" data-testid="text-location-name">{locationName}</p>
            </div>
          </div>
          <button 
            className="p-3 rounded-xl bg-muted/60 hover:bg-muted/80 transition-all duration-200 shadow-md hover:shadow-lg"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-profile"
          >
            <User className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 py-6 bg-gradient-to-r from-muted/30 to-muted/50">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            type="text" 
            placeholder="Search deals, restaurants..." 
            className="w-full pl-12 pr-4 py-4 text-base border-2 focus:border-primary rounded-xl bg-white/80 backdrop-blur-sm shadow-md focus:shadow-lg transition-all duration-200"
            data-testid="input-search"
          />
        </div>
        
        {/* Filter Chips */}
        <div className="flex space-x-3 mt-4 overflow-x-auto pb-2">
          <Button 
            className="flex-shrink-0 rounded-full px-4 py-2 font-semibold food-gradient-primary border-0 shadow-md button-hover-effect"
            size="sm" 
            data-testid="button-filter-hot"
          >
            <Flame className="w-4 h-4 mr-2" /> Hot Deals
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0 rounded-full px-4 py-2 bg-white/80 backdrop-blur-sm border-2 hover:bg-white shadow-md hover:shadow-lg transition-all duration-200"
            data-testid="button-filter-quick"
          >
            <Clock className="w-4 h-4 mr-2" /> Quick Bites
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0 rounded-full px-4 py-2 bg-white/80 backdrop-blur-sm border-2 hover:bg-white shadow-md hover:shadow-lg transition-all duration-200"
            data-testid="button-filter-italian"
          >
            <Pizza className="w-4 h-4 mr-2" /> Italian
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0 rounded-full px-4 py-2 bg-white/80 backdrop-blur-sm border-2 hover:bg-white shadow-md hover:shadow-lg transition-all duration-200"
            data-testid="button-filter-budget"
          >
            <DollarSign className="w-4 h-4 mr-2" /> Under $10
          </Button>
        </div>
      </div>

      {/* Featured Deals Section */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-featured-title">
            <span className="w-8 h-8 food-gradient-primary rounded-lg flex items-center justify-center mr-3 shadow-md">
              <Flame className="w-4 h-4 text-white" />
            </span>
            Hot Deals Nearby
          </h2>
          <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all">View All</button>
        </div>

        {featuredLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="gradient-card border-0 rounded-2xl overflow-hidden animate-pulse shadow-md">
                <div className="w-full h-36 bg-muted"></div>
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded-lg w-1/2"></div>
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
              <div className="text-center py-12">
                <div className="w-20 h-20 food-gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Utensils className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">No Deals Yet</h3>
                <p className="text-muted-foreground" data-testid="text-no-deals">Check back soon for amazing deals!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Restaurant Categories */}
      <div className="px-6 py-6 bg-gradient-to-r from-muted/20 to-muted/40">
        <h2 className="text-xl font-bold text-foreground mb-6" data-testid="text-categories-title">Browse by Category</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer button-hover-effect">
              <Pizza className="w-6 h-6 text-secondary" />
            </div>
            <p className="text-sm font-semibold text-foreground" data-testid="text-category-pizza">Pizza</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer button-hover-effect">
              <div className="w-6 h-6 text-primary flex items-center justify-center rounded border-2 border-current"><div className="w-2 h-2 bg-current rounded"></div></div>
            </div>
            <p className="text-sm font-semibold text-foreground" data-testid="text-category-burgers">Burgers</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer button-hover-effect">
              <Fish className="w-6 h-6 text-accent" />
            </div>
            <p className="text-sm font-semibold text-foreground" data-testid="text-category-asian">Asian</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer button-hover-effect">
              <div className="w-6 h-6 text-destructive flex items-center justify-center">🌶️</div>
            </div>
            <p className="text-sm font-semibold text-foreground" data-testid="text-category-mexican">Mexican</p>
          </div>
        </div>
      </div>

      {/* For Workers Section */}
      <div className="px-6 py-8 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/10 border-t border-border/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center mb-2" data-testid="text-workers-title">
              <span className="w-8 h-8 food-gradient-accent rounded-lg flex items-center justify-center mr-3 shadow-md">
                <HardHat className="w-4 h-4 text-white" />
              </span>
              Perfect for Workers
            </h2>
            <p className="text-muted-foreground" data-testid="text-workers-subtitle">Quick meals for busy professionals</p>
          </div>
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-lg">
            <div className="w-full h-full food-gradient-accent flex items-center justify-center">
              <HardHat className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-food hover:shadow-food-hover transition-all duration-300 cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 food-gradient-secondary rounded-xl flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-foreground" data-testid="text-fast-pickup">Fast Pickup</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-fast-pickup-desc">Ready in 10 min or less</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-food hover:shadow-food-hover transition-all duration-300 cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 food-gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-foreground" data-testid="text-hearty-meals">Hearty Meals</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-hearty-meals-desc">Filling portions for workers</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}