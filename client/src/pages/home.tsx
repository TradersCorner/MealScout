import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import DealCard from "@/components/deal-card";
import Navigation from "@/components/navigation";
import SmartSearch from "@/components/smart-search";
import WelcomeLocationModal from "@/components/WelcomeLocationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Sparkles, Rocket, Pizza, DollarSign, Truck, RotateCw, ChefHat, Clock, Target, Heart, Bell, Map, LogIn, UserPlus, Store, Bug } from "lucide-react";
import mealScoutLogo from "@assets/ChatGPT Image Sep 14, 2025, 09_25_52 AM_1757872111259.png";
import { useFoodTruckSocket } from "@/hooks/useFoodTruckSocket";
import { getReverseGeocodedLocationName } from "@/utils/locationUtils";

// Version marker for deployment verification
console.log("MealScout Client Loaded - Build: " + new Date().toISOString());

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
  restaurant?: {
    name: string;
    cuisineType?: string;
  };
  distance?: number;
}

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationName, setLocationName] = useState("Your Location");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState("");
  const [, setNavigateTo] = useLocation();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const { isConnected, subscribeToNearby, connect: connectWS } = useFoodTruckSocket();

  // Show welcome modal on initial session visit
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('mealscout_welcome_seen');
    if (!hasSeenWelcome && !location) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleLocationDetection = async () => {
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0
          });
        });

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setLocation(newLocation);
        setLocationError(null);
        
        await getReverseGeocodedLocationName(
          newLocation.lat, 
          newLocation.lng, 
          setLocationName
        );
        
        queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });
        
        if (isConnected) {
          subscribeToNearby(newLocation.lat, newLocation.lng, 5000);
        }
      } catch (error: any) {
        setLocationError("Unable to detect location automatically. Please set your location.");
        setShowLocationInput(true);
      } finally {
        setIsLoadingLocation(false);
      }
    }
  };

  const handleLocationUpdate = (newLocation: {lat: number; lng: number}) => {
    setLocation(newLocation);
    setLocationError(null);
    queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });
  };

  const handleLocationNameUpdate = (name: string) => {
    setLocationName(name);
  };

  const handleLocationErrorUpdate = (error: string | null) => {
    setLocationError(error);
    setIsLoadingLocation(false);
    if (error) {
      setShowLocationInput(true);
    }
  };

  const handleManualLocation = async () => {
    if (!manualLocation.trim()) return;
    
    setIsLoadingLocation(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=1`);
      const data = await response.json();
      
      if (data && data[0]) {
        const newLocation = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        setLocation(newLocation);
        setLocationName(data[0].display_name);
        setLocationError(null);
        setShowLocationInput(false);
        queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });
      } else {
        setLocationError("Could not find that location. Please try a different city name.");
      }
    } catch (error) {
      setLocationError("Failed to search for location. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const retryLocation = () => {
    setLocationError(null);
    setShowLocationInput(false);
    setIsLoadingLocation(true);
    handleLocationDetection();
  };

  const handleWelcomeLocationSet = (newLocation: {lat: number; lng: number}, name: string) => {
    setLocation(newLocation);
    setLocationName(name);
    setLocationError(null);
    sessionStorage.setItem('mealscout_welcome_seen', 'true');
    setShowWelcomeModal(false);
    queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });
    
    if (isConnected) {
      subscribeToNearby(newLocation.lat, newLocation.lng, 5000);
    }
  };

  const handleWelcomeSkip = () => {
    sessionStorage.setItem('mealscout_welcome_seen', 'true');
    setShowWelcomeModal(false);
  };

  const { data: featuredDeals, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    queryFn: () => fetch('/api/deals/featured').then(res => res.json()),
  });

  const groupedFeaturedDeals = featuredDeals?.reduce((acc: Record<string, { restaurant?: Deal['restaurant']; deals: Deal[]; distance?: number }>, deal: Deal) => {
    const bucket = acc[deal.restaurantId] || { restaurant: deal.restaurant, deals: [], distance: deal.distance };
    bucket.deals.push(deal);
    // prefer the first distance value we see
    if (bucket.distance === undefined && deal.distance !== undefined) {
      bucket.distance = deal.distance;
    }
    // prefer the first restaurant object we see
    if (!bucket.restaurant && deal.restaurant) {
      bucket.restaurant = deal.restaurant;
    }
    acc[deal.restaurantId] = bucket;
    return acc;
  }, {});

  return (
    <div className="w-full px-4 bg-background min-h-screen relative overflow-hidden">
      <Navigation />
      
      {/* Header with Logo and Navigation */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-2 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src={mealScoutLogo} alt="MealScout Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-lg font-bold text-gray-900">MealScout</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNavigateTo('/login')}
                  className="text-gray-700 hover:text-red-600"
                  title="Login"
                >
                  <LogIn className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNavigateTo('/customer-signup')}
                  className="text-gray-700 hover:text-red-600"
                  title="Customer Sign Up"
                >
                  <UserPlus className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNavigateTo('/restaurant-signup')}
                  className="text-gray-700 hover:text-red-600"
                  title="Restaurant/Bar/Food Truck Sign Up"
                >
                  <Store className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={retryLocation}
                  disabled={isLoadingLocation}
                  className="text-gray-700 hover:text-red-600"
                  title="Refresh Location"
                >
                  {isLoadingLocation ? (
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Target className="w-4 h-4" />
                  )}
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                  {locationName.split(',')[0]}
                </span>
                <div className="w-2 h-2 rounded-full bg-emerald-500" title="Real-time location active" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={retryLocation}
                  disabled={isLoadingLocation}
                  className="text-gray-700 hover:text-red-600 w-7 h-7"
                  title="Refresh Location"
                >
                  {isLoadingLocation ? (
                    <div className="w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Target className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Search Section */}
      <div className="py-3 bg-gradient-to-br from-gray-50 via-white to-orange-50 border-b border-orange-100">
        <div className="mx-auto max-w-[420px] w-full">
          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Find Amazing Deals In Your Neighborhood</h2>
            <p className="text-sm text-gray-600">Discover nearby restaurants & food trucks — support your local spots with exclusive offers</p>
          </div>
          
          <SmartSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={(query) => setNavigateTo(`/search?q=${encodeURIComponent(query)}`)}
            className="mb-3"
            placeholder="Search deals, restaurants..."
          />
          
          {/* Filter Chips */}
          <div className="flex space-x-2 overflow-x-auto pb-1">
          <Link href="/deals/featured">
            <Button className="flex-shrink-0 rounded-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0 shadow-md hover:shadow-lg transition-all" size="sm">
              <Sparkles className="w-4 h-4 mr-2" /> Hot Deals
            </Button>
          </Link>
          <Link href="/search?filter=quick">
            <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full px-4 py-2 font-medium bg-white border border-gray-200 hover:bg-gray-50">
              <Rocket className="w-4 h-4 mr-2" /> Quick Bites
            </Button>
          </Link>
          <Link href="/category/pizza">
            <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full px-4 py-2 font-medium bg-white border border-gray-200 hover:bg-gray-50">
              <Pizza className="w-4 h-4 mr-2" /> Pizza
            </Button>
          </Link>
          <Link href="/search?filter=budget">
            <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full px-4 py-2 font-medium bg-white border border-gray-200 hover:bg-gray-50">
              <DollarSign className="w-4 h-4 mr-2" /> Budget
            </Button>
          </Link>
          </div>

          {/* Location Error and Manual Input */}
          {locationError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter city or zip"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
              />
              <Button
                onClick={handleManualLocation}
                disabled={!manualLocation.trim() || isLoadingLocation}
                size="sm"
              >
                {isLoadingLocation ? "..." : "Go"}
              </Button>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Food Trucks Nearby - Horizontal Scroll Row */}
      {/* TODO: Replace with actual food truck data */}
      <div className="py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
        <div className="mx-auto max-w-[420px] w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-900">Food Trucks Nearby</h3>
            </div>
            <Link href="/map">
              <Button variant="link" className="text-emerald-700 hover:text-emerald-800 p-0 h-auto text-xs">
                View Map →
              </Button>
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Placeholder food truck cards - replace with actual data */}
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-64">
                <DealCard deal={{
                id: `truck-${i}`,
                restaurantId: `truck-${i}`,
                title: "Food Truck Deal",
                description: "Special lunch combo",
                dealType: "percentage",
                discountValue: "20",
                minOrderAmount: "10",
                restaurant: {
                  name: `Tasty Truck #${i}`,
                  cuisineType: "Street Food"
                },
                distance: 0.3,
                currentUses: 45,
                isFeatured: false
              } as any} />
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Featured Deals Section - ORIGINAL LAYOUT */}
      <div className="py-4 bg-white">
        <div className="mx-auto max-w-[420px] w-full">
          <div className="mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center">
              <Sparkles className="w-4 h-4 text-orange-500 mr-1.5" />
              What's Happening Near You Right Now
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Time-sensitive offers from neighborhood restaurants</p>
            <Link href="/deals/featured">
              <Button variant="link" className="text-orange-600 hover:text-orange-700 p-0 h-auto mt-1">
                See all nearby deals →
              </Button>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse" />
              ))}
            </div>
          ) : groupedFeaturedDeals && Object.keys(groupedFeaturedDeals).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(groupedFeaturedDeals).map(([restaurantId, bucket]) => {
                const restaurantName = bucket.restaurant?.name || "Restaurant";
                const cuisine = bucket.restaurant?.cuisineType;
                const distance = bucket.distance;
                const deals = bucket.deals.slice(0, 5);
                return (
                  <div key={restaurantId} className="rounded-xl border border-gray-200 bg-white shadow-sm p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">{restaurantName}</h3>
                        <div className="text-[11px] text-gray-600 flex items-center gap-1">
                          {cuisine && <span>{cuisine}</span>}
                          {cuisine && distance !== undefined && <span>•</span>}
                          {distance !== undefined && <span>{distance.toFixed(1)} mi</span>}
                        </div>
                      </div>
                      <Link href={`/restaurant/${restaurantId}`}>
                        <Button size="sm" variant="secondary" className="px-3 py-1 text-xs">View all deals</Button>
                      </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {deals.map((deal) => (
                        <div key={deal.id} className="py-2 flex items-start gap-2">
                          <div className="px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-[11px] font-semibold leading-none">
                            {deal.dealType === 'percentage' ? `${deal.discountValue}% off` : deal.dealType === 'dollar' ? `$${deal.discountValue} off` : deal.discountValue}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{deal.title}</p>
                            {deal.description && (
                              <p className="text-[11px] text-gray-600 leading-snug line-clamp-2">{deal.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-3">No deals nearby yet</p>
              <Link href="/recommend-spot">
                <Button size="sm" variant="outline">
                  Recommend your favorite spot
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* AUTH-GATED SECTION - PROGRESSIVE DISCLOSURE */}
      <div className="py-2 bg-gradient-to-br from-gray-50 to-white">
        <div className="mx-auto max-w-[420px] w-full">
          {!user ? (
            /* LOGGED OUT - PREVIEW */
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Stay connected to your city's food scene
              </h3>
            <p className="text-gray-600 mb-2 text-xs">
              Save favorites, track food trucks, and know when your go-to places are open
            </p>
            <div className="grid grid-cols-1 gap-2 mb-2">
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <Heart className="w-4 h-4 text-orange-600 mx-auto mb-0.5" />
                <h4 className="font-semibold text-gray-900 text-xs">Save favorites</h4>
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <Truck className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
                <h4 className="font-semibold text-gray-900 text-xs">Track trucks</h4>
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <Bell className="w-4 h-4 text-blue-600 mx-auto mb-0.5" />
                <h4 className="font-semibold text-gray-900 text-xs">Real-time alerts</h4>
              </div>
            </div>
            <Link href="/customer-signup">
              <Button size="sm" className="px-3 py-1 text-xs">
                Create free account
              </Button>
            </Link>
          </div>
        ) : (
          /* LOGGED IN - REAL FEATURES */
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              What's Open In Your Area (Live)
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <Link href="/favorites">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <Heart className="w-8 h-8 text-orange-600 mb-3" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Your Neighborhood Favorites</h4>
                  <p className="text-sm text-gray-600">Spots you return to</p>
                </div>
              </Link>
              
              <Link href="/map">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-lg border border-emerald-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <Map className="w-8 h-8 text-emerald-600 mb-3" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Food Trucks Nearby</h4>
                  <p className="text-sm text-gray-600">Live locations in your city</p>
                </div>
              </Link>
              
              <Link href="/deals/featured">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <DollarSign className="w-8 h-8 text-blue-600 mb-3" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Local Deals Active Now</h4>
                  <p className="text-sm text-gray-600">Opportunities near you</p>
                </div>
              </Link>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Community Building Section */}
      <div className="py-2 bg-gradient-to-br from-orange-50 via-red-50 to-orange-50">
        <div className="mx-auto max-w-[420px] w-full">
          <div className="text-center mb-2">
            <h3 className="text-base font-bold text-gray-900 mb-0.5">Build Your Neighborhood Food Community</h3>
            <p className="text-xs text-gray-600">Earn recurring income while strengthening your community</p>
          </div>
          
          <div className="grid grid-cols-1 gap-2 mb-2">
            <div className="bg-white p-2 rounded-xl border border-orange-200 shadow-sm">
              <div className="flex items-center">
                <span className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center mr-1.5 text-xs">
                  <span className="text-white font-bold text-[10px]">1</span>
                </span>
                <h4 className="font-bold text-gray-900 text-xs">Share Your Link</h4>
              </div>
            </div>
            
            <div className="bg-white p-2 rounded-xl border border-orange-200 shadow-sm">
              <div className="flex items-center">
                <span className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center mr-1.5 text-xs">
                  <span className="text-white font-bold text-[10px]">2</span>
                </span>
                <h4 className="font-bold text-gray-900 text-xs">Restaurant Subscribes</h4>
              </div>
            </div>
            
            <div className="bg-white p-2 rounded-xl border border-orange-200 shadow-sm">
              <div className="flex items-center">
                <span className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center mr-1.5 text-xs">
                  <span className="text-white font-bold text-[10px]">3</span>
                </span>
                <h4 className="font-bold text-gray-900 text-xs">Earn Recurring Income</h4>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href={user ? "/affiliate-dashboard" : "/customer-signup"}>
              <Button size="sm" className="px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600">
                {user ? 'Community Builder Dashboard' : 'Start Building'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Owner Section - ORIGINAL STYLE */}
      <div className="py-2 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="mx-auto max-w-[420px] w-full text-center">
          <ChefHat className="w-6 h-6 mx-auto mb-1 text-orange-400" />
          <h3 className="text-base font-bold mb-0.5">
            Bring your restaurant to the neighborhood
          </h3>
          <p className="text-gray-300 mb-2 text-xs">
            Post real-time deals, broadcast when you're open, reach people nearby
          </p>
          <Link href="/restaurant-signup">
            <Button size="sm" variant="secondary" className="px-3 py-1 text-xs">
              Claim & Go Live
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-gray-50 border-t border-gray-200">
        <div className="mx-auto max-w-[420px] w-full">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Product</h4>
              <div className="space-y-2">
                <Link href="/how-it-works" className="block text-gray-600 hover:text-orange-600">How It Works</Link>
                <Link href="/faq" className="block text-gray-600 hover:text-orange-600">FAQ</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Company</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-gray-600 hover:text-orange-600">About</Link>
                <Link href="/contact" className="block text-gray-600 hover:text-orange-600">Contact</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
              <div className="space-y-2">
                <Link href="/privacy-policy" className="block text-gray-600 hover:text-orange-600">Privacy</Link>
                <Link href="/terms-of-service" className="block text-gray-600 hover:text-orange-600">Terms</Link>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-6 mt-6">
            <p>&copy; 2026 MealScout. A TradeScout Product.</p>
          </div>
        </div>
      </footer>

      {/* Welcome Modal for First-Time Session Visitors */}
      <WelcomeLocationModal
        open={showWelcomeModal}
        onLocationSet={handleWelcomeLocationSet}
        onSkip={handleWelcomeSkip}
      />
    </div>
  );
}
