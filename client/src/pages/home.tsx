import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import DealCard from "@/components/deal-card";
import Navigation from "@/components/navigation";
import SmartSearch from "@/components/smart-search";
import LocationButton from "@/components/location-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, User, Search, Flame, Clock, Pizza, DollarSign, Utensils, Fish, Zap, HardHat, Beef, ChefHat, Soup, Star, Sparkles, Timer, ShoppingBag, Target, Trophy, Rocket, Crown, Coffee, Cookie, Wheat, Leaf, Grape, Cherry, Sandwich, Salad, IceCream, Croissant, Plus, Send, Truck, Radio, Activity, Wifi, Loader2, Sunrise, Heart, Waves, Egg, Apple, Store, CheckCircle, RotateCw } from "lucide-react";
import mealScoutLogo from "@assets/ChatGPT Image Sep 14, 2025, 09_25_52 AM_1757872111259.png";
import { useFoodTruckSocket } from "@/hooks/useFoodTruckSocket";
import { format } from "date-fns";
import { getReverseGeocodedLocationName } from "@/utils/locationUtils";

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

interface FoodTruck {
  id: string;
  name: string;
  cuisineType: string;
  latitude: number;
  longitude: number;
  lastSeen: string;
  isOnline: boolean;
  distance?: number;
  sessionId?: string;
  currentDeals?: Deal[];
  lastBroadcast?: string;
}

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationName, setLocationName] = useState("Your Location");
  const [copiedLink, setCopiedLink] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState("");
  const [, setNavigateTo] = useLocation();
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    location: "",
    cuisineType: "",
    description: ""
  });
  const handleCopyAffiliateLink = async () => {
    try {
      const ref = (user as any)?.referralCode || (user as any)?.id || "";
      const url = ref ? `${window.location.origin}/?ref=${ref}` : window.location.origin;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link', error);
    }
  };

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const [foodTrucks, setFoodTrucks] = useState<FoodTruck[]>([]);
  const [showFoodTrucks, setShowFoodTrucks] = useState(true);
  const [loadingFoodTrucks, setLoadingFoodTrucks] = useState(false);
  const [dealFilter, setDealFilter] = useState<'all' | 'limited-time'>('all');

  // WebSocket integration for real-time food truck updates (disabled to prevent errors)
  const {
    isConnected,
    subscribeToNearby,
    connect: connectWS
  } = useFoodTruckSocket({
    autoConnect: false, // Disable auto-connection to prevent error spam
    onLocationUpdate: (locationUpdate) => {
      setFoodTrucks(prev => prev.map(truck => 
        truck.id === locationUpdate.restaurantId 
          ? { 
              ...truck, 
              latitude: locationUpdate.latitude,
              longitude: locationUpdate.longitude,
              lastSeen: locationUpdate.timestamp,
              lastBroadcast: locationUpdate.timestamp,
              isOnline: true
            }
          : truck
      ));
    },
    onStatusUpdate: (statusUpdate) => {
      setFoodTrucks(prev => prev.map(truck => 
        truck.id === statusUpdate.restaurantId 
          ? { ...truck, isOnline: statusUpdate.isOnline, lastSeen: statusUpdate.lastSeen }
          : truck
      ));
    }
  });

  // WebSocket subscription disabled to prevent errors
  // useEffect(() => {
  //   if (location && isConnected) {
  //     subscribeToNearby(location.lat, location.lng, 5000);
  //   }
  // }, [location, isConnected, subscribeToNearby]);

  // Auto-detect location on page load
  useEffect(() => {
    if (!location && !isLoadingLocation) {
      setIsLoadingLocation(true);
      handleLocationDetection();
    }
  }, []); // Run only once on mount

  // Fetch initial food truck data only once when location is first set
  useEffect(() => {
    if (location && foodTrucks.length === 0) {
      fetchNearbyFoodTrucks();
    }
  }, [location]);

  // Auto location detection function
  const handleLocationDetection = async () => {
    if (navigator.geolocation) {
      console.log('🧭 Starting automatic location detection');
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
        console.log('✅ Automatic location detection successful:', newLocation);
        
        // Get proper location name using reverse geocoding
        await getReverseGeocodedLocationName(
          newLocation.lat, 
          newLocation.lng, 
          setLocationName
        );
        
        // Invalidate and refresh nearby deals cache immediately
        queryClient.invalidateQueries({ 
          queryKey: ["/api/deals/nearby"] 
        });
        
        // Subscribe to nearby food trucks
        if (isConnected) {
          subscribeToNearby(newLocation.lat, newLocation.lng, 5000);
        } else {
          try {
            connectWS();
            subscribeToNearby(newLocation.lat, newLocation.lng, 5000);
          } catch (err: any) {
            console.warn('Failed to connect WebSocket for food truck updates:', err);
          }
        }

      } catch (error: any) {
        console.warn('Automatic location detection failed:', error.message);
        setLocationError("Unable to detect location automatically. Please click the location button to set your location.");
        setShowLocationInput(true);
      } finally {
        setIsLoadingLocation(false);
      }
    } else {
      setLocationError("Location services not supported by your browser");
      setShowLocationInput(true);
      setIsLoadingLocation(false);
    }
  };

  const fetchNearbyFoodTrucks = async () => {
    if (!location || loadingFoodTrucks) return;
    
    setLoadingFoodTrucks(true);
    try {
      const response = await fetch(`/api/trucks/live?lat=${location.lat}&lng=${location.lng}&radiusKm=5`);
      if (response.ok) {
        const data = await response.json();
        setFoodTrucks(data.trucks || []);
      } else {
        console.error('Food truck API response not ok:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch nearby food trucks:', error);
      // Don't retry automatically on error
    } finally {
      setLoadingFoodTrucks(false);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Update food truck distances when location changes
  useEffect(() => {
    if (location && foodTrucks.length > 0) {
      setFoodTrucks(prev => prev.map(truck => ({
        ...truck,
        distance: calculateDistance(location.lat, location.lng, truck.latitude, truck.longitude)
      })));
    }
  }, [location, foodTrucks.length]);

  // Retry location detection using LocationButton
  const retryLocation = () => {
    // Clear error state and let LocationButton handle detection
    setLocationError(null);
    setShowLocationInput(false);
    
    // The actual location detection will be handled by LocationButton component
    // when user clicks it. This just resets the error state.
  };

  // Handle manual location search
  const handleManualLocation = async () => {
    if (!manualLocation.trim()) return;
    
    setIsLoadingLocation(true);
    try {
      // For manual location, create a simple location object
      // Note: This is a simplified approach since we can't reliably geocode without external APIs
      // Consider this a fallback that lets users manually specify their general location
      
      // Set a basic coordinate (users would need to adjust this for their actual needs)
      // For demo purposes, use a reasonable default coordinate
      const defaultLat = 30.5364992; // New Orleans area as example
      const defaultLng = -90.5347072;
      
      setLocation({ lat: defaultLat, lng: defaultLng });
      setLocationName(`Manual: ${manualLocation}`);
      setLocationError(null);
      setShowLocationInput(false);
      
      // Subscribe to nearby food trucks using the default coordinates
      if (isConnected) {
        subscribeToNearby(defaultLat, defaultLng, 5000);
      } else {
        try {
          connectWS();
          subscribeToNearby(defaultLat, defaultLng, 5000);
        } catch (err: any) {
          console.warn('Failed to connect WebSocket for food truck updates:', err);
        }
      }
    } catch (error) {
      setLocationError("Failed to set location. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const { data: featuredDeals, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/deals/featured", dealFilter],
    queryFn: () => {
      const params = dealFilter === 'limited-time' ? '?filter=limited-time' : '';
      return fetch(`/api/deals/featured${params}`).then(res => res.json());
    },
    enabled: true,
  });

  const { data: nearbyDeals, isLoading: nearbyLoading } = useQuery({
    queryKey: ["/api/deals/nearby", location?.lat, location?.lng],
    enabled: !!location,
  });

  // Fetch subscribed restaurants (with or without deals)
  const { data: subscribedRestaurants, isLoading: subscribedLoading } = useQuery({
    queryKey: ["/api/restaurants/subscribed", location?.lat, location?.lng],
    queryFn: () => {
      if (!location) return Promise.resolve([]);
      return fetch(`/api/restaurants/subscribed/${location.lat}/${location.lng}`).then(res => res.json());
    },
    enabled: !!location,
  });

  const hasRestaurants = Array.isArray(subscribedRestaurants) && subscribedRestaurants.length > 0;

  // Handler for LocationButton component
  const handleLocationUpdate = (newLocation: { lat: number; lng: number }) => {
    setLocation(newLocation);
    setLocationError(null);
    setShowLocationInput(false);
    setIsLoadingLocation(false); // Clear loading state on location success
    
    // Invalidate and refresh nearby deals cache immediately
    queryClient.invalidateQueries({ 
      queryKey: ["/api/deals/nearby"] 
    });
    
    // Subscribe to nearby food trucks with new location
    // Ensure WebSocket is connected before subscribing
    if (isConnected) {
      subscribeToNearby(newLocation.lat, newLocation.lng, 5000);
    } else {
      // Connect WebSocket and then subscribe
      try {
        connectWS();
        // Subscribe will work once connection is established
        subscribeToNearby(newLocation.lat, newLocation.lng, 5000);
      } catch (err: any) {
        console.warn('Failed to connect WebSocket for food truck updates:', err);
      }
    }
    
    // Fetch nearby food trucks for the new location
    setTimeout(() => {
      fetchNearbyFoodTrucks();
    }, 500); // Small delay to ensure location state is updated
  };

  const handleLocationNameUpdate = (name: string) => {
    setLocationName(name);
    setIsLoadingLocation(false); // Clear loading state on name update
  };

  const handleLocationErrorUpdate = (error: string) => {
    setLocationError(error);
    setShowLocationInput(true);
  };

  const handleRestaurantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send to your backend
    console.log("Restaurant recommendation:", restaurantForm);
    // Reset form
    setRestaurantForm({
      name: "",
      location: "",
      cuisineType: "",
      description: ""
    });
    // Show success message
    alert("Thank you! We'll reach out to this restaurant about joining MealScout.");
  };

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative overflow-hidden">
      {/* Header with Logo and Location */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          {/* MealScout Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src={mealScoutLogo} 
                alt="MealScout Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-xl font-bold text-gray-900">MealScout</h1>
            </div>
          </div>

          {/* Location Section */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 justify-end">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-xl px-3 py-2 flex items-center space-x-3 shadow-sm w-full sm:w-auto">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                isLoadingLocation ? 'bg-amber-500' : 
                locationError ? 'bg-red-500' : 
                location ? 'bg-emerald-500' : 'bg-gray-400'
              }`}>
                {isLoadingLocation ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-gray-700 text-xs font-semibold mb-0.5" data-testid="text-location-label">
                  {location ? 'Deals near you' : 'Location needed'}
                </p>
                <p className="text-gray-900 font-semibold text-sm leading-tight truncate" data-testid="text-location-name" title={locationName}>
                  <span className="lg:hidden">
                    {locationName.split(',')[0]}
                  </span>
                  <span className="hidden lg:inline">
                    {locationName}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="text-location-sub">
                  {locationError ? 'Access denied — enter your city' : location ? 'Live nearby deals' : 'Enable GPS or enter city'}
                </p>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button 
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-orange-100 bg-white hover:bg-orange-50 text-gray-700 transition-colors"
                  aria-label="Retry location"
                  onClick={retryLocation}
                  data-testid="button-retry-location"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <LocationButton
                  onLocationUpdate={handleLocationUpdate}
                  onLocationNameUpdate={handleLocationNameUpdate}
                  onLocationError={handleLocationErrorUpdate}
                  isLoading={isLoadingLocation}
                  size="sm"
                  variant="default"
                  className="text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg transition-colors shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar & Hero Section */}
      <div className="px-6 py-8 bg-gradient-to-br from-gray-50 via-white to-orange-50 border-b border-orange-100">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Find Amazing Deals</h2>
          <p className="text-gray-600">Discover local restaurants & food trucks with exclusive offers</p>
        </div>
        
        <SmartSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={(query) => {
            setNavigateTo(`/search?q=${encodeURIComponent(query)}`);
          }}
          className="mb-6"
          placeholder="Search deals, restaurants..."
        />
        
        {/* Filter Chips */}
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2">
          <Link href="/deals/featured">
            <Button 
              className="flex-shrink-0 rounded-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0 shadow-md hover:shadow-lg transition-all"
              size="sm" 
              data-testid="button-filter-hot"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Hot Deals
            </Button>
          </Link>
          <Link href="/search?filter=quick">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-shrink-0 rounded-full px-4 py-2 bg-white border-2 border-orange-200 hover:bg-orange-50 font-semibold text-gray-700 hover:text-orange-600 transition-colors"
              data-testid="button-filter-quick"
            >
              <Rocket className="w-4 h-4 mr-2" /> Quick Bites
            </Button>
          </Link>
          <Link href="/category/pizza">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-shrink-0 rounded-full px-4 py-2 bg-white border-2 border-orange-200 hover:bg-orange-50 font-semibold text-gray-700 hover:text-orange-600 transition-colors"
              data-testid="button-filter-italian"
            >
              <Pizza className="w-4 h-4 mr-2" /> Pizza
            </Button>
          </Link>
          <Link href="/search?filter=budget">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-shrink-0 rounded-full px-4 py-2 bg-white border-2 border-orange-200 hover:bg-orange-50 font-semibold text-gray-700 hover:text-orange-600 transition-colors"
              data-testid="button-filter-budget"
            >
              <DollarSign className="w-4 h-4 mr-2" /> Budget
            </Button>
          </Link>
        </div>

        {/* Location Error and Manual Input */}
        {(locationError || showLocationInput) && (
          <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-xl shadow-sm">
            {locationError && (
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-9 h-9 bg-white border border-red-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-red-700 text-sm font-semibold">Location access denied</p>
                  <p className="text-gray-700 text-sm" data-testid="text-location-error">{locationError}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <p className="text-gray-800 text-sm font-semibold">Enter your city to find nearby deals:</p>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Enter city name (e.g., New York, Los Angeles)"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="flex-1 border-orange-100 focus-visible:ring-orange-500"
                  data-testid="input-manual-location"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualLocation();
                    }
                  }}
                />
                <Button
                  onClick={handleManualLocation}
                  disabled={!manualLocation.trim() || isLoadingLocation}
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                  data-testid="button-find-location"
                >
                  {isLoadingLocation ? "Finding..." : "Find Deals"}
                </Button>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-white border border-orange-100 text-orange-700 font-medium">Tip</span>
                <span>Use GPS for faster, more accurate results.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Motivation CTA when no vendors nearby */}
      {(!loadingFoodTrucks && !hasRestaurants && foodTrucks.filter(t => t.isOnline).length === 0) && (
        <div className="px-6 py-6">
          <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-red-50 shadow-sm p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Bring great food to your area</h3>
            <p className="text-gray-700 mb-4">
              We don’t see restaurants or food trucks near you yet. Enable location or enter your city to discover deals, or invite local vendors to join MealScout.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => scrollToElement('community-builder')} className="w-full sm:w-auto border-orange-300 text-orange-700 hover:bg-orange-50" variant="outline">
                Invite Restaurants & Food Trucks
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Food Trucks Nearby Section */}
      {showFoodTrucks && (
        <div className="py-8 bg-gradient-to-br from-white via-orange-50 to-white">
          <div className="px-6 mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center" data-testid="text-food-trucks-title">
                <span className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <Truck className="w-5 h-5 text-white" />
                </span>
                Food Trucks Near You
              </h2>
              {isConnected && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-700">Live</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 text-sm ml-12">Real-time updates from mobile restaurants in your area</p>
          </div>
          <div className="px-6 flex items-center space-x-2 mb-6">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setShowFoodTrucks(!showFoodTrucks)}
              data-testid="button-toggle-food-trucks"
            >
              {showFoodTrucks ? 'Hide' : 'Show'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNearbyFoodTrucks}
              disabled={loadingFoodTrucks}
              data-testid="button-refresh-food-trucks"
            >
              {loadingFoodTrucks ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
            </Button>
          </div>

          {loadingFoodTrucks ? (
            <div className="flex space-x-4 overflow-x-auto pb-4 px-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-80">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                    <div className="relative h-32 bg-gradient-to-r from-orange-200 to-red-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32"></div>
                        <div className="h-4 bg-gradient-to-r from-green-100 to-green-200 rounded-full w-16"></div>
                      </div>
                      <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg w-24"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto pb-4 px-6 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
              {foodTrucks.length > 0 ? (
                foodTrucks
                  .filter(truck => truck.isOnline)
                  .sort((a, b) => (a.distance || 0) - (b.distance || 0))
                  .map((truck) => (
                    <div key={truck.id} className="flex-shrink-0 w-80 lg:w-auto">
                      <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-orange-100 hover:shadow-xl transition-shadow" data-testid={`card-food-truck-${truck.id}`}>
                        {/* Food Truck Header */}
                        <div className="relative h-32 bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
                          <div className="absolute top-3 right-3 flex items-center space-x-2">
                            {truck.isOnline ? (
                              <div className="flex items-center bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium" data-testid={`status-online-${truck.id}`}>
                                <Radio className="w-3 h-3 mr-1 animate-pulse" />
                                LIVE
                              </div>
                            ) : (
                              <div className="flex items-center bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium" data-testid={`status-offline-${truck.id}`}>
                                Offline
                              </div>
                            )}
                          </div>
                          <div className="text-center text-white">
                            <Truck className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm font-medium">Mobile Restaurant</p>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Restaurant Info */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-foreground mb-1" data-testid={`text-truck-name-${truck.id}`}>
                                {truck.name}
                              </h3>
                              <p className="text-sm text-muted-foreground" data-testid={`text-truck-cuisine-${truck.id}`}>
                                {truck.cuisineType || 'Food Truck'}
                              </p>
                            </div>
                            {truck.distance && (
                              <div className="text-right">
                                <p className="text-sm font-medium text-orange-600" data-testid={`text-truck-distance-${truck.id}`}>
                                  {truck.distance < 1 ? 
                                    `${Math.round(truck.distance * 1000)}m` : 
                                    `${truck.distance.toFixed(1)}km`}
                                </p>
                                <p className="text-xs text-muted-foreground">away</p>
                              </div>
                            )}
                          </div>

                          {/* Location Status */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span data-testid={`text-truck-location-${truck.id}`}>
                                {truck.latitude.toFixed(4)}, {truck.longitude.toFixed(4)}
                              </span>
                            </div>
                            {truck.lastBroadcast && (
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                <span data-testid={`text-truck-last-update-${truck.id}`}>
                                  {format(new Date(truck.lastBroadcast), 'HH:mm')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Active Deals */}
                          {truck.currentDeals && truck.currentDeals.length > 0 && (
                            <div className="border-t pt-3 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">Active Deals:</p>
                              {truck.currentDeals.slice(0, 2).map((deal) => (
                                <div key={deal.id} className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                  <p className="text-sm font-medium text-orange-800" data-testid={`text-deal-title-${deal.id}`}>
                                    {deal.title}
                                  </p>
                                  <p className="text-xs text-orange-600" data-testid={`text-deal-discount-${deal.id}`}>
                                    {deal.discountValue}
                                  </p>
                                </div>
                              ))}
                              {truck.currentDeals.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{truck.currentDeals.length - 2} more deals
                                </p>
                              )}
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="pt-2">
                            <Link href={`/restaurant/${truck.id}`}>
                              <Button 
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white" 
                                size="sm"
                                data-testid={`button-view-truck-${truck.id}`}
                              >
                                View Menu & Deals
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-16 px-4 sm:px-6 w-full lg:col-span-full max-w-2xl mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <Truck className="w-12 h-12 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-2xl sm:text-3xl text-gray-900 mb-3">
                    {hasRestaurants
                      ? 'No food trucks nearby yet'
                      : 'Welcome to MealScout'}
                  </h3>
                  <p className="text-gray-600 mb-6 text-base sm:text-lg leading-relaxed" data-testid="text-no-food-trucks">
                    {hasRestaurants
                      ? 'We found great restaurants in your area! Food trucks and mobile vendors are coming soon. Check back regularly for new deals and exclusive offers.'
                      : 'MealScout connects you with local restaurants and food trucks offering amazing deals. Enable location or enter your city to get started.'}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                    <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <Wifi className={`w-5 h-5 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm font-medium text-gray-700">{isConnected ? 'Real-time updates enabled' : 'Offline mode'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={fetchNearbyFoodTrucks} disabled={loadingFoodTrucks} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all">
                      {loadingFoodTrucks ? 'Searching...' : 'Search Again'}
                    </Button>
                    <Button onClick={() => scrollToElement('community-builder')} className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all">
                      Help bring vendors to your area
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Browse Categories Section */}
      <div className="py-6 bg-white">
        <div className="px-6 mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center" data-testid="text-categories-title">
            <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
              <Utensils className="w-3 h-3 text-white" />
            </span>
            Browse by Category
          </h2>
        </div>
        
        <div className="flex overflow-x-auto pb-4 px-6 space-x-4 lg:grid lg:grid-cols-8 lg:gap-4 lg:overflow-visible">
          {/* Pizza */}
          <Link href="/search?cuisine=Italian" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-pizza">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Pizza className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-red-600">Pizza</span>
            </div>
          </Link>

          {/* Breakfast */}
          <Link href="/search?cuisine=Breakfast" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-breakfast">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-300 to-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Egg className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-orange-600">Breakfast</span>
            </div>
          </Link>

          {/* Chinese */}
          <Link href="/search?cuisine=Chinese" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-chinese">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-red-600">Chinese</span>
            </div>
          </Link>

          {/* Japanese */}
          <Link href="/search?cuisine=Japanese" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-japanese">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Fish className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-pink-600">Japanese</span>
            </div>
          </Link>

          {/* Wings */}
          <Link href="/search?cuisine=Wings" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-wings">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-orange-600">Wings</span>
            </div>
          </Link>

          {/* Burgers */}
          <Link href="/search?cuisine=American" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-burgers">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Sandwich className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-yellow-600">Burgers</span>
            </div>
          </Link>

          {/* Sandwiches */}
          <Link href="/search?cuisine=Sandwiches" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-sandwiches">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Sandwich className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-amber-600">Sandwiches</span>
            </div>
          </Link>

          {/* Mexican */}
          <Link href="/search?cuisine=Mexican" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-mexican">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Cherry className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-green-600">Mexican</span>
            </div>
          </Link>

          {/* Thai */}
          <Link href="/search?cuisine=Thai" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-thai">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-green-600">Thai</span>
            </div>
          </Link>

          {/* Indian */}
          <Link href="/search?cuisine=Indian" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-indian">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Star className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-yellow-600">Indian</span>
            </div>
          </Link>

          {/* BBQ */}
          <Link href="/search?cuisine=BBQ" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-bbq">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Beef className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-red-600">BBQ</span>
            </div>
          </Link>

          {/* Korean */}
          <Link href="/search?cuisine=Korean" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-korean">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Beef className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-purple-600">Korean</span>
            </div>
          </Link>

          {/* Seafood */}
          <Link href="/search?cuisine=Seafood" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-seafood">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Waves className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">Seafood</span>
            </div>
          </Link>

          {/* Coffee */}
          <Link href="/search?cuisine=Coffee" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-coffee">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-amber-600">Coffee</span>
            </div>
          </Link>

          {/* Healthy */}
          <Link href="/search?cuisine=Healthy" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-healthy">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-green-600">Healthy</span>
            </div>
          </Link>

          {/* Desserts */}
          <Link href="/search?cuisine=Dessert" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-desserts">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <IceCream className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-pink-600">Desserts</span>
            </div>
          </Link>

          {/* Bakery */}
          <Link href="/search?cuisine=Bakery" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-bakery">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-300 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Cookie className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-orange-600">Bakery</span>
            </div>
          </Link>

          {/* French */}
          <Link href="/search?cuisine=French" className="flex-shrink-0">
            <div className="w-20 text-center group cursor-pointer" data-testid="category-french">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Croissant className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-purple-600">French</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Golden Plate Winners Section */}
      <div className="py-6 bg-gradient-to-r from-amber-50 to-yellow-50">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center">
            <span className="w-8 h-8 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
              <Trophy className="w-4 h-4 text-white" />
            </span>
            Golden Plate Winners
          </h2>
          <Link href="/golden-plate-winners">
            <button className="text-amber-600 font-semibold hover:text-amber-700 transition-colors">View All</button>
          </Link>
        </div>
        <div className="px-6">
          <p className="text-sm text-gray-600 mb-4">
            Celebrating the finest restaurants in each community, awarded quarterly based on customer recommendations, favorites, and reviews.
          </p>
          <Link href="/golden-plate-winners">
            <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white">
              <Trophy className="w-4 h-4 mr-2" />
              See All Golden Plate Winners
            </Button>
          </Link>
        </div>
      </div>

      {/* Featured Deals Section */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-featured-title">
            <span className="w-8 h-8 food-gradient-primary rounded-lg flex items-center justify-center mr-3 shadow-md">
              <Star className="w-4 h-4 text-white" />
            </span>
            Hot Deals Nearby
          </h2>
          <Link href="/deals/featured">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all">View All</button>
          </Link>
        </div>
        
        {/* Deal Filter Buttons */}
        <div className="flex gap-2 mb-4 px-6">
          <Button
            onClick={() => setDealFilter('all')}
            variant={dealFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
            data-testid="button-filter-all-deals"
          >
            <Utensils className="w-4 h-4" />
            All Deals
          </Button>
          <Button
            onClick={() => setDealFilter('limited-time')}
            variant={dealFilter === 'limited-time' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
            data-testid="button-filter-limited-time"
          >
            <Timer className="w-4 h-4" />
            Limited Time Only
          </Button>
        </div>

        {featuredLoading ? (
          <div className="flex space-x-4 overflow-x-auto pb-4 px-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-72">
                <div className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse">
                  <div className="relative h-56 bg-gradient-to-r from-gray-200 to-gray-300"></div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32"></div>
                      <div className="h-6 bg-gradient-to-r from-green-100 to-green-200 rounded-full w-12"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-16"></div>
                      <div className="h-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full w-12"></div>
                    </div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-full"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5"></div>
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-2xl p-4">
                      <div className="h-4 bg-gradient-to-r from-red-100 to-red-200 rounded-lg w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex space-x-4 overflow-x-auto pb-4 px-6 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
            {Array.isArray(featuredDeals) && featuredDeals.length > 0 ? (
              featuredDeals.map((deal: Deal) => (
                <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                  <DealCard deal={deal} />
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-6 w-full lg:col-span-full">
                <div className="w-20 h-20 food-gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Utensils className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">MealScout is New in Your Area</h3>
                <p className="text-muted-foreground" data-testid="text-no-deals">We're just getting started here. Check back soon as local restaurants join MealScout and start offering amazing deals!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subscribed Restaurants Section */}
      {location && Array.isArray(subscribedRestaurants) && subscribedRestaurants.length > 0 && (
        <div className="py-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-6 px-6">
            <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-subscribed-restaurants-title">
              <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <Store className="w-4 h-4 text-white" />
              </span>
              Active Restaurants
            </h2>
            <span className="text-sm text-muted-foreground">{subscribedRestaurants.length} nearby</span>
          </div>
          
          <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
            {subscribedRestaurants.map((restaurant: any) => {
              const hasDeals = restaurant.activeDealsCount > 0;
              
              return (
                <div key={restaurant.id} className="flex-shrink-0 w-72 lg:w-auto">
                  <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div className="relative h-48 bg-gradient-to-br from-blue-400 to-indigo-500">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Store className="w-16 h-16 text-white/30" />
                      </div>
                      {restaurant.isVerified && (
                        <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-lg text-foreground mb-2" data-testid={`text-restaurant-name-${restaurant.id}`}>
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        {restaurant.address}
                      </div>
                      {restaurant.cuisineType && (
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            {restaurant.cuisineType}
                          </span>
                        </div>
                      )}
                      
                      {hasDeals ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                          <p className="text-green-700 text-sm font-semibold">
                            {restaurant.activeDealsCount} active deal{restaurant.activeDealsCount > 1 ? 's' : ''} available
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                          <p className="text-gray-600 text-sm">
                            No active deals yet - Coming soon!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extended Food Categories with Horizontal Scrolling */}
      
      {/* Pizza & Italian */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-pizza-title">
            <span className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Pizza className="w-4 h-4 text-white" />
            </span>
            Pizza & Italian
          </h2>
          <Link href="/category/pizza">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-pizza">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('pizza') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('italian') ||
            deal.title?.toLowerCase().includes('pizza') ||
            deal.title?.toLowerCase().includes('pasta')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('pizza') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('italian') ||
              deal.title?.toLowerCase().includes('pizza') ||
              deal.title?.toLowerCase().includes('pasta')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Pizza className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-muted-foreground">No pizza deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Burgers & Sandwiches */}
      <div className="py-6 bg-gradient-to-r from-slate-50 to-stone-50">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-burger-title">
            <span className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Sandwich className="w-4 h-4 text-white" />
            </span>
            Burgers & Sandwiches
          </h2>
          <Link href="/category/burgers">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-burger">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('burger') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('deli') ||
            deal.title?.toLowerCase().includes('burger') ||
            deal.title?.toLowerCase().includes('sandwich')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('burger') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('deli') ||
              deal.title?.toLowerCase().includes('burger') ||
              deal.title?.toLowerCase().includes('sandwich')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sandwich className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-muted-foreground">No burger deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Asian Cuisine */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-asian-title">
            <span className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <ChefHat className="w-4 h-4 text-white" />
            </span>
            Asian Cuisine
          </h2>
          <Link href="/category/asian">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-asian">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('asian') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('chinese') ||
            deal.restaurant?.cuisineType?.toLowerCase().includes('japanese') ||
            deal.restaurant?.cuisineType?.toLowerCase().includes('thai') ||
            deal.title?.toLowerCase().includes('noodle') ||
            deal.title?.toLowerCase().includes('rice') ||
            deal.title?.toLowerCase().includes('curry')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('asian') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('chinese') ||
              deal.restaurant?.cuisineType?.toLowerCase().includes('japanese') ||
              deal.restaurant?.cuisineType?.toLowerCase().includes('thai') ||
              deal.title?.toLowerCase().includes('noodle') ||
              deal.title?.toLowerCase().includes('rice') ||
              deal.title?.toLowerCase().includes('curry')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-muted-foreground">No Asian deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Mexican & Latin */}
      <div className="py-6 bg-gradient-to-r from-amber-50 to-yellow-50">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-mexican-title">
            <span className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Soup className="w-4 h-4 text-white" />
            </span>
            Mexican & Latin
          </h2>
          <Link href="/category/mexican">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-mexican">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('mexican') || 
            deal.title?.toLowerCase().includes('taco') ||
            deal.title?.toLowerCase().includes('burrito') ||
            deal.title?.toLowerCase().includes('quesadilla')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('mexican') || 
              deal.title?.toLowerCase().includes('taco') ||
              deal.title?.toLowerCase().includes('burrito') ||
              deal.title?.toLowerCase().includes('quesadilla')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Soup className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-muted-foreground">No Mexican deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Breakfast & Brunch */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-breakfast-title">
            <span className="w-8 h-8 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Croissant className="w-4 h-4 text-white" />
            </span>
            Breakfast & Brunch
          </h2>
          <Link href="/category/breakfast">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-breakfast">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('cafe') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('breakfast') ||
            deal.title?.toLowerCase().includes('breakfast') ||
            deal.title?.toLowerCase().includes('brunch') ||
            deal.title?.toLowerCase().includes('coffee') ||
            deal.title?.toLowerCase().includes('morning')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('cafe') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('breakfast') ||
              deal.title?.toLowerCase().includes('breakfast') ||
              deal.title?.toLowerCase().includes('brunch') ||
              deal.title?.toLowerCase().includes('coffee') ||
              deal.title?.toLowerCase().includes('morning')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Croissant className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-muted-foreground">No breakfast deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Healthy & Salads */}
      <div className="py-6 bg-gradient-to-r from-green-50 to-lime-50">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-healthy-title">
            <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-lime-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Salad className="w-4 h-4 text-white" />
            </span>
            Healthy & Salads
          </h2>
          <Link href="/category/healthy">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-healthy">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('healthy') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('salad') ||
            deal.title?.toLowerCase().includes('salad') ||
            deal.title?.toLowerCase().includes('smoothie') ||
            deal.title?.toLowerCase().includes('bowl') ||
            deal.title?.toLowerCase().includes('healthy')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('healthy') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('salad') ||
              deal.title?.toLowerCase().includes('salad') ||
              deal.title?.toLowerCase().includes('smoothie') ||
              deal.title?.toLowerCase().includes('bowl') ||
              deal.title?.toLowerCase().includes('healthy')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-lime-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Salad className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-muted-foreground">No healthy deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Seafood */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-seafood-title">
            <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Fish className="w-4 h-4 text-white" />
            </span>
            Fresh Seafood
          </h2>
          <Link href="/category/seafood">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-seafood">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('seafood') || 
            deal.title?.toLowerCase().includes('fish') ||
            deal.title?.toLowerCase().includes('seafood') ||
            deal.title?.toLowerCase().includes('shrimp') ||
            deal.title?.toLowerCase().includes('catch')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('seafood') || 
              deal.title?.toLowerCase().includes('fish') ||
              deal.title?.toLowerCase().includes('seafood') ||
              deal.title?.toLowerCase().includes('shrimp') ||
              deal.title?.toLowerCase().includes('catch')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Fish className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-muted-foreground">No seafood deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Coffee & Bakery */}
      <div className="py-6 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-coffee-title">
            <span className="w-8 h-8 bg-gradient-to-r from-amber-700 to-orange-700 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Coffee className="w-4 h-4 text-white" />
            </span>
            Coffee & Bakery
          </h2>
          <Link href="/category/coffee">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-coffee">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('coffee') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('bakery') ||
            deal.title?.toLowerCase().includes('coffee') ||
            deal.title?.toLowerCase().includes('pastry') ||
            deal.title?.toLowerCase().includes('beignet') ||
            deal.title?.toLowerCase().includes('croissant')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('coffee') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('bakery') ||
              deal.title?.toLowerCase().includes('coffee') ||
              deal.title?.toLowerCase().includes('pastry') ||
              deal.title?.toLowerCase().includes('beignet') ||
              deal.title?.toLowerCase().includes('croissant')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-8 h-8 text-amber-700" />
              </div>
              <p className="text-muted-foreground">No coffee deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Desserts & Ice Cream */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-dessert-title">
            <span className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <IceCream className="w-4 h-4 text-white" />
            </span>
            Desserts & Ice Cream
          </h2>
          <Link href="/category/dessert">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-dessert">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('dessert') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('ice') ||
            deal.title?.toLowerCase().includes('ice') ||
            deal.title?.toLowerCase().includes('dessert') ||
            deal.title?.toLowerCase().includes('sweet') ||
            deal.title?.toLowerCase().includes('cake')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('dessert') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('ice') ||
              deal.title?.toLowerCase().includes('ice') ||
              deal.title?.toLowerCase().includes('dessert') ||
              deal.title?.toLowerCase().includes('sweet') ||
              deal.title?.toLowerCase().includes('cake')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IceCream className="w-8 h-8 text-pink-600" />
              </div>
              <p className="text-muted-foreground">No dessert deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Community Builder Program Section (summary) */}
      <div id="community-builder-summary" className="px-6 py-8 bg-gradient-to-br from-orange-50 via-red-50 to-orange-50">
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-xl border-2 border-orange-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <span className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </span>
                <h2 className="text-2xl font-bold text-gray-900">
                  You’re a MealScout Community Builder
                </h2>
              </div>
              <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                Every user is automatically a Community Builder. Share any MealScout link and earn <strong className="text-orange-600">10% recurring commission</strong> whenever restaurants you refer subscribe to our platform.
              </p>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-4">
                <p className="text-gray-800 font-semibold mb-2">💰 Affiliate Payout Structure:</p>
                <ul className="space-y-1 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span><strong>First Month:</strong> Earn $20 when your referral subscribes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span><strong>Every Month After:</strong> Earn $5/month recurring - forever!</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span><strong>No Limits:</strong> Refer unlimited restaurants and earn passive income</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span><strong>Cash Out Weekly:</strong> Withdraw via Stripe, Plaid, Venmo, or spend directly at MealScout partners</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="hidden lg:block w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex-shrink-0 ml-6 shadow-lg flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center mb-2">
                <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">1</span>
                </span>
                <h3 className="font-bold text-gray-900 text-sm">Share Your Link</h3>
              </div>
              <p className="text-sm text-gray-600">
                Every link you share automatically includes your unique referral code
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center mb-2">
                <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">2</span>
                </span>
                <h3 className="font-bold text-gray-900 text-sm">Restaurant Subscribes</h3>
              </div>
              <p className="text-sm text-gray-600">
                When a restaurant signs up through your link, they're linked to you forever
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center mb-2">
                <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">3</span>
                </span>
                <h3 className="font-bold text-gray-900 text-sm">Earn Recurring Income</h3>
              </div>
              <p className="text-sm text-gray-600">
                Get paid $20 first month, then $5/month recurring - unlimited potential!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {!user ? (
              <div className="bg-white border border-orange-200 rounded-xl p-4 space-y-3 shadow-sm">
                <h3 className="font-semibold text-gray-900">Create your account</h3>
                <p className="text-sm text-gray-700">Choose how you want to join MealScout and start earning or exploring deals.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/customer-signup" className="w-full sm:w-auto">
                    <Button className="w-full bg-orange-500 text-white hover:bg-orange-600">Sign up as User</Button>
                  </Link>
                  <Link href="/restaurant-signup" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">Sign up as Restaurant</Button>
                  </Link>
                  <Link href="/restaurant-signup?type=foodtruck" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">Sign up as Food Truck</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-orange-200 rounded-xl p-4 space-y-3 shadow-sm">
                <h3 className="font-semibold text-gray-900">Share or invite</h3>
                <p className="text-sm text-gray-700">Copy your Community Builder link or recommend a restaurant to join.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleCopyAffiliateLink} className="bg-orange-500 text-white hover:bg-orange-600 w-full sm:w-auto">
                    {copiedLink ? 'Link Copied!' : 'Copy Community Builder Link'}
                  </Button>
                  <Link href="#recommend-restaurant" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">
                      Recommend a Restaurant
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm opacity-90 mb-1">Your Community Builder Credits</p>
                <p className="text-3xl font-bold">
                  {user ? `$${((user.creditBalance || 0) * 0.01).toFixed(2)}` : 'Sign in to see balance'}
                </p>
                <p className="text-xs opacity-75 mt-1">Redeem at partners or cash out weekly via Stripe/Plaid/Venmo</p>
              </div>
              <Link href={user ? "/affiliate-dashboard" : "/auth"}>
                <Button className="bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-lg px-6 py-3">
                  {user ? 'Community Builder Dashboard' : 'Start Building'}
                  <Rocket className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Community Builder Program Section (detailed) */}
      <div id="community-builder" className="px-6 py-10 bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 border-t border-orange-200">
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-xl border-2 border-orange-200">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <span className="w-11 h-11 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Earn Money with MealScout
                </h2>
              </div>
              <p className="text-gray-700 text-base lg:text-lg leading-relaxed">
                Every user is a Community Builder. Share MealScout and earn <span className="font-bold text-orange-600">10% recurring commission</span> on every restaurant referral.
              </p>
            </div>
            <div className="hidden lg:flex w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex-shrink-0 ml-6 shadow-lg items-center justify-center">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6">
            <p className="text-gray-800 font-semibold mb-3">💰 How You Get Paid:</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-orange-500 mr-3 font-bold">•</span>
                <span><strong>$20</strong> when your referral subscribes (first month bonus)</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3 font-bold">•</span>
                <span><strong>$5/month recurring</strong> - earn forever while they stay with us</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3 font-bold">•</span>
                <span><strong>Unlimited referrals</strong> - no cap on how many you can earn</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-3 font-bold">•</span>
                <span><strong>Weekly payouts</strong> via Stripe, Plaid, Venmo, or spend at partners</span>
              </li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center mb-2">
                <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-2 text-white font-bold text-sm">1</span>
                <h3 className="font-bold text-gray-900 text-sm">Share Your Link</h3>
              </div>
              <p className="text-sm text-gray-600">Every MealScout link includes your unique referral code automatically</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center mb-2">
                <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-2 text-white font-bold text-sm">2</span>
                <h3 className="font-bold text-gray-900 text-sm">Restaurant Subscribes</h3>
              </div>
              <p className="text-sm text-gray-600">When they sign up through your link, you're credited forever</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center mb-2">
                <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-2 text-white font-bold text-sm">3</span>
                <h3 className="font-bold text-gray-900 text-sm">Start Earning</h3>
              </div>
              <p className="text-sm text-gray-600">Get paid $20 first month, then $5/month - unlimited potential!</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm opacity-90 mb-1">Your Community Builder Credits</p>
                <p className="text-3xl font-bold">
                  {user ? `$${((user.creditBalance || 0) * 0.01).toFixed(2)}` : 'Sign in to view'}
                </p>
                <p className="text-xs opacity-75 mt-1">Redeem at partners or cash out weekly</p>
              </div>
              <Link href={user ? "/affiliate-dashboard" : "/auth"}>
                <Button className="bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-lg px-6 py-2 rounded-lg">
                  {user ? 'Go to Dashboard' : 'Get Started'}
                  <Rocket className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Recommendation Section */}
      <div id="recommend-restaurant" className="px-6 py-8 pb-24 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/10 border-t border-border/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center mb-2" data-testid="text-recommend-title">
              <span className="w-8 h-8 food-gradient-accent rounded-lg flex items-center justify-center mr-3 shadow-md">
                <Plus className="w-4 h-4 text-white" />
              </span>
              Missing Your Favorite Spot?
            </h2>
            <p className="text-muted-foreground" data-testid="text-recommend-subtitle">Help us add great local restaurants to MealScout!</p>
          </div>
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-lg">
            <div className="w-full h-full food-gradient-accent flex items-center justify-center">
              <Plus className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-food">
          <form onSubmit={handleRestaurantSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Input
                  id="restaurant-name"
                  placeholder="Restaurant name (e.g. Tony's Italian Bistro)"
                  value={restaurantForm.name}
                  onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
                  required
                  data-testid="input-restaurant-name"
                  className="w-full h-12 text-base"
                />
              </div>
              <div>
                <Input
                  id="restaurant-location"
                  placeholder="Location (e.g. Downtown Main Street)"
                  value={restaurantForm.location}
                  onChange={(e) => setRestaurantForm({...restaurantForm, location: e.target.value})}
                  required
                  data-testid="input-restaurant-location"
                  className="w-full h-12 text-base"
                />
              </div>
            </div>
            
            <Input
              id="cuisine-type"
              placeholder="Cuisine type (optional - e.g. Italian, Mexican, Asian)"
              value={restaurantForm.cuisineType}
              onChange={(e) => setRestaurantForm({...restaurantForm, cuisineType: e.target.value})}
              data-testid="input-cuisine-type"
              className="w-full h-12 text-base"
            />
            
            <Button 
              type="submit" 
              className="w-full food-gradient-primary text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              data-testid="button-submit-recommendation"
            >
              <Send className="w-5 h-5 mr-2" />
              Recommend This Spot
            </Button>
          </form>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}