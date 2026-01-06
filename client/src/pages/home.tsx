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

  const shortLocation = locationName?.split(',')[0] || 'your area';
  const firstName = (user as any)?.firstName?.trim() || (user as any)?.name?.split?.(' ')?.[0] || '';
  const welcomeName = firstName || 'there';

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
                  onClick={() => setNavigateTo('/customer-signup?role=business')}
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
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {firstName ? `Hey ${firstName}, hungry?` : "Hungry?"}
            </h2>
            <p className="text-sm text-gray-600">
              See what's happening {shortLocation === 'Your Location' ? 'near you' : `in ${shortLocation}`}. Fresh deals and local favorites.
            </p>
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
      <div className="py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-y border-emerald-100/50">
        <div className="mx-auto max-w-[420px] w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-900">Live Trucks: {shortLocation === 'Your Location' ? 'Nearby' : shortLocation}</h3>
            </div>
            <Link href="/map">
              <Button variant="link" className="text-emerald-700 hover:text-emerald-800 p-0 h-auto text-xs">
                View Map →
              </Button>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {/* Placeholder food truck cards - replace with actual data */}
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-56">
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
      <div className="py-4 bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-[420px] w-full">
          <div className="mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center">
              <Sparkles className="w-4 h-4 text-orange-500 mr-1.5" />
              Trending in {shortLocation === 'Your Location' ? 'Your Neighborhood' : shortLocation}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fast-moving offers from spots around you</p>
            <Link href="/deals/featured">
              <Button variant="link" className="text-orange-600 hover:text-orange-700 p-0 h-auto mt-1">
                See all nearby deals →
              </Button>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 w-56 bg-gray-100 rounded-lg h-48 animate-pulse" />
              ))}
            </div>
          ) : featuredDeals && featuredDeals.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {featuredDeals.map((deal: Deal) => (
                <div key={deal.id} className="flex-shrink-0 w-56">
                  <DealCard deal={deal} />
                </div>
              ))}
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

      {/* Owner Section - MOVED UP FOR LOGGED OUT USERS */}
      {!user && (
        <div className="py-2 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="mx-auto max-w-[420px] w-full text-center">
            <ChefHat className="w-6 h-6 mx-auto mb-1 text-orange-400" />
            <h3 className="text-base font-bold mb-0.5">
              Bring your restaurant to the neighborhood
            </h3>
            <p className="text-gray-300 mb-2 text-xs">
              Post real-time deals, broadcast when you're open, reach people nearby
            </p>
            <Link href="/customer-signup?role=business">
              <Button size="sm" variant="secondary" className="px-3 py-1 text-xs">
                Claim & Go Live
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* TWO-COLUMN SECTIONS - SIDE BY SIDE */}
      <div className="py-6 bg-white border-y border-gray-100">
        <div className="mx-auto max-w-[840px] w-full px-4">
          {!user ? (
            /* LOGGED OUT - TWO SECTIONS SIDE BY SIDE */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stay Connected Section */}
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Unlock the {shortLocation === 'Your Location' ? 'Local' : shortLocation} Scene</h3>
                  <p className="text-sm text-gray-600">Save go-tos, track trucks live, and get a heads-up when spots reopen</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-xs">{shortLocation === 'Your Location' ? 'Neighborhood' : shortLocation} favorites</h4>
                      <p className="text-[11px] text-gray-600">Keep your go-tos one tap away</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-xs">Food trucks {shortLocation === 'Your Location' ? 'nearby' : `in ${shortLocation}`}</h4>
                      <p className="text-[11px] text-gray-600">Live locations around you</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-xs">Deals {shortLocation === 'Your Location' ? 'nearby' : `in ${shortLocation}`}</h4>
                      <p className="text-[11px] text-gray-600">Quick wins close to you</p>
                    </div>
                  </div>
                </div>
                
                <Link href="/customer-signup">
                  <Button className="w-full h-9 text-xs font-medium">
                    Create free account
                  </Button>
                </Link>
              </div>

              {/* Community Building Section */}
              <div>
                <div className="text-center mb-4">
                  <h3 className="text-base font-bold text-gray-900 mb-1">Promote {shortLocation === 'Your Location' ? 'Local' : shortLocation} Gems</h3>
                  <p className="text-xs text-gray-600">Pass along great spots and help them stay busy</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-bold text-xs">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-xs mb-0.5">Share Your Link</h4>
                      <p className="text-[11px] text-gray-600">Get a unique referral link to share with restaurants</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-bold text-xs">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-xs mb-0.5">Restaurant Subscribes</h4>
                      <p className="text-[11px] text-gray-600">When they join, you become their community partner</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-bold text-xs">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-xs mb-0.5">Earn Recurring Income</h4>
                      <p className="text-[11px] text-gray-600">Receive commission as long as they remain active</p>
                    </div>
                  </div>
                </div>
                
                <Link href={user ? "/affiliate-dashboard" : "/customer-signup"}>
                  <Button className="w-full h-9 text-xs font-medium">
                    {user ? 'Community Builder Dashboard' : 'Start Building'}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
          /* LOGGED IN - REAL FEATURES */
          <div className="max-w-[420px] mx-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Browse by Category
            </h3>
            
            {/* Category Rows */}
            {groupedFeaturedDeals && Object.keys(groupedFeaturedDeals).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(
                  Object.values(groupedFeaturedDeals).reduce((acc: Record<string, any[]>, bucket: any) => {
                    const cuisine = bucket.restaurant?.cuisineType || "Other";
                    if (!acc[cuisine]) acc[cuisine] = [];
                    acc[cuisine].push(bucket);
                    return acc;
                  }, {})
                ).map(([cuisine, buckets]) => (
                  <div key={cuisine}>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <h4 className="font-bold text-gray-900">{cuisine}</h4>
                      <Link href={`/search?q=${encodeURIComponent(cuisine)}`}>
                        <Button variant="link" size="sm" className="text-orange-600 h-auto p-0 text-xs">View all</Button>
                      </Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                      {buckets.map((bucket: any) => {
                        const restaurantName = bucket.restaurant?.name || "Restaurant";
                        const distance = bucket.distance;
                        const deals = bucket.deals.slice(0, 3); // Limit to 3 deals per card in horizontal view
                        
                        return (
                          <div key={bucket.restaurant?.id || Math.random()} className="flex-shrink-0 w-[280px] rounded-xl border border-gray-200 bg-white shadow-sm p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[180px]">{restaurantName}</h3>
                                <div className="text-[11px] text-gray-600 flex items-center gap-1">
                                  {distance !== undefined && <span>{distance.toFixed(1)} mi</span>}
                                </div>
                              </div>
                              <Link href={`/restaurant/${bucket.deals[0].restaurantId}`}>
                                <Button size="sm" variant="secondary" className="px-2 py-1 text-[10px] h-6">Visit</Button>
                              </Link>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {deals.map((deal: any) => (
                                <div key={deal.id} className="py-2 flex items-start gap-2">
                                  <div className="px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-[10px] font-semibold leading-none whitespace-nowrap">
                                    {deal.dealType === 'percentage' ? `${deal.discountValue}%` : deal.dealType === 'dollar' ? `$${deal.discountValue}` : deal.discountValue}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 leading-tight truncate">{deal.title}</p>
                                  </div>
                                </div>
                              ))}
                              {bucket.deals.length > 3 && (
                                <div className="pt-2 text-center">
                                  <span className="text-[10px] text-gray-500">+{bucket.deals.length - 3} more deals</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-sm">No categories available yet.</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-5 bg-gray-50 border-t border-gray-200">
        <div className="mx-auto max-w-[420px] w-full px-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Product</h4>
              <Link href="/how-it-works" className="block text-gray-600 hover:text-orange-600">How It Works</Link>
              <Link href="/faq" className="block text-gray-600 hover:text-orange-600">FAQ</Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Company</h4>
              <Link href="/about" className="block text-gray-600 hover:text-orange-600">About</Link>
              <Link href="/contact" className="block text-gray-600 hover:text-orange-600">Contact</Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Legal</h4>
              <Link href="/privacy-policy" className="block text-gray-600 hover:text-orange-600">Privacy</Link>
              <Link href="/terms-of-service" className="block text-gray-600 hover:text-orange-600">Terms</Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Support</h4>
              <Link href="/help" className="block text-gray-600 hover:text-orange-600">Help Center</Link>
              <Link href="/status" className="block text-gray-600 hover:text-orange-600">Status</Link>
            </div>
          </div>
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4 mt-5">
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
