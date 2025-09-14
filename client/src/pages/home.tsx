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
import { MapPin, User, Search, Flame, Clock, Pizza, DollarSign, Utensils, Fish, Zap, HardHat, Beef, ChefHat, Soup, Star, Sparkles, Timer, ShoppingBag, Target, Trophy, Rocket, Crown, Coffee, Cookie, Wheat, Leaf, Grape, Cherry, Sandwich, Salad, IceCream, Croissant, Plus, Send, Truck, Radio, Activity, Wifi, Loader2, Sunrise, Heart, Waves, Egg, Apple } from "lucide-react";
import mealScoutLogo from "@assets/ChatGPT Image Sep 14, 2025, 09_25_52 AM_1757872111259.png";
import { useFoodTruckSocket } from "@/hooks/useFoodTruckSocket";
import { format } from "date-fns";

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
  const [location, setLocation] = useState<{lat: number; lng: number} | null>({ lat: 30.5047, lng: -90.4612 });
  const [locationName, setLocationName] = useState("Hammond, LA");
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
  const [foodTrucks, setFoodTrucks] = useState<FoodTruck[]>([]);
  const [showFoodTrucks, setShowFoodTrucks] = useState(true);
  const [loadingFoodTrucks, setLoadingFoodTrucks] = useState(false);
  const [dealFilter, setDealFilter] = useState<'all' | 'limited-time'>('all');

  // WebSocket integration for real-time food truck updates (disabled to prevent errors)
  const {
    isConnected: wsConnected,
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

  // WebSocket subscription when location is available
  useEffect(() => {
    if (location && wsConnected) {
      subscribeToNearby(location.lat, location.lng, 5000);
    }
  }, [location, wsConnected, subscribeToNearby]);

  // Fetch initial food truck data only once when location is first set
  useEffect(() => {
    if (location && foodTrucks.length === 0) {
      fetchNearbyFoodTrucks();
    }
  }, [location]);

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
      // Use geocoding service to convert city name to coordinates
      const response = await fetch(`https://api.bigdatacloud.net/data/city?name=${encodeURIComponent(manualLocation)}`);
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        setLocation({ lat: data.latitude, lng: data.longitude });
        setLocationName(manualLocation);
        setLocationError(null);
        setShowLocationInput(false);
        
        // Subscribe to nearby food trucks
        // Ensure WebSocket is connected before subscribing
        if (wsConnected) {
          subscribeToNearby(data.latitude, data.longitude, 5000);
        } else {
          // Connect WebSocket and then subscribe
          try {
            connectWS();
            // Subscribe will work once connection is established
            subscribeToNearby(data.latitude, data.longitude, 5000);
          } catch (err: any) {
            console.warn('Failed to connect WebSocket for food truck updates:', err);
          }
        }
      } else {
        setLocationError("City not found. Please try a different location.");
      }
    } catch (error) {
      setLocationError("Failed to find location. Please check your connection.");
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

  // Handler for LocationButton component
  const handleLocationUpdate = (newLocation: { lat: number; lng: number }) => {
    setLocation(newLocation);
    setLocationError(null);
    setShowLocationInput(false);
    
    // Invalidate and refresh nearby deals cache immediately
    queryClient.invalidateQueries({ 
      queryKey: ["/api/deals/nearby"] 
    });
    
    // Subscribe to nearby food trucks with new location
    // Ensure WebSocket is connected before subscribing
    if (wsConnected) {
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
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          {/* MealScout Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src={mealScoutLogo} 
                alt="MealScout Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MealScout</h1>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-2 min-w-0 flex-1 justify-end">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLoadingLocation ? 'bg-yellow-500' : 
              locationError ? 'bg-red-500' : 
              location ? 'bg-green-500' : 'bg-gray-500'
            }`}>
              {isLoadingLocation ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-right min-w-0 flex-1 max-w-32">
              <p className="text-gray-500 text-xs whitespace-nowrap" data-testid="text-location-label">Location</p>
              <div className="flex items-center space-x-1">
                <p className="text-gray-900 font-medium text-sm truncate" data-testid="text-location-name" title={locationName}>
                  {locationName}
                </p>
                {locationError && (
                  <button
                    onClick={retryLocation}
                    className="text-blue-600 text-xs hover:text-blue-700 font-medium whitespace-nowrap"
                    data-testid="button-retry-location"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
            
            {/* Location Update Button - Disabled for testing */}
            <div className="flex-shrink-0">
              <button
                className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap px-2 py-1 rounded"
                onClick={() => console.log('Location locked to Hammond, LA for testing')}
              >
                📍 Update
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 py-6 bg-gray-50">
        <SmartSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={(query) => {
            setNavigateTo(`/search?q=${encodeURIComponent(query)}`);
          }}
          className="mb-4"
          placeholder="Search deals, restaurants..."
        />
        
        {/* Filter Chips */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Link href="/deals/featured">
            <Button 
              className="flex-shrink-0 rounded-lg px-4 py-2 font-medium text-white bg-red-500 hover:bg-red-600 border-0 shadow-sm"
              size="sm" 
              data-testid="button-filter-hot"
            >
              <Sparkles className="w-4 h-4 mr-1" /> Hot Deals
            </Button>
          </Link>
          <Link href="/search?filter=quick">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-shrink-0 rounded-lg px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 font-medium"
              data-testid="button-filter-quick"
            >
              <Rocket className="w-4 h-4 mr-1" /> Quick Bites
            </Button>
          </Link>
          <Link href="/category/pizza">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-shrink-0 rounded-lg px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 font-medium"
              data-testid="button-filter-italian"
            >
              <Crown className="w-4 h-4 mr-1" /> Italian
            </Button>
          </Link>
          <Link href="/search?filter=budget">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-shrink-0 rounded-lg px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 font-medium"
              data-testid="button-filter-budget"
            >
              <Target className="w-4 h-4 mr-1" /> Under $10
            </Button>
          </Link>
        </div>

        {/* Location Error and Manual Input */}
        {(locationError || showLocationInput) && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            {locationError && (
              <div className="flex items-start space-x-2 mb-3">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-yellow-800 text-sm font-medium">Location Issue</p>
                  <p className="text-yellow-700 text-sm" data-testid="text-location-error">{locationError}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <p className="text-gray-700 text-sm font-medium">Enter your city to find nearby deals:</p>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Enter city name (e.g., New York, Los Angeles)"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="flex-1"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-find-location"
                >
                  {isLoadingLocation ? "Finding..." : "Find Deals"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Food Trucks Nearby Section */}
      {showFoodTrucks && (
        <div className="py-6 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center justify-between mb-6 px-6">
            <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-food-trucks-title">
              <span className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <Truck className="w-4 h-4 text-white" />
              </span>
              Food Trucks Nearby
              {wsConnected && (
                <div className="flex items-center ml-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 ml-1">Live</span>
                </div>
              )}
            </h2>
            <div className="flex items-center space-x-2">
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
                <div className="text-center py-12 px-6 w-full lg:col-span-full">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Truck className="w-10 h-10 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">No Food Trucks Nearby</h3>
                  <p className="text-muted-foreground mb-4" data-testid="text-no-food-trucks">
                    No mobile restaurants are currently active in your area.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Wifi className={`w-4 h-4 mr-1 ${wsConnected ? 'text-green-500' : 'text-red-500'}`} />
                      <span>{wsConnected ? 'Real-time updates enabled' : 'Offline mode'}</span>
                    </div>
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
                <h3 className="font-bold text-lg text-foreground mb-2">No Deals Yet</h3>
                <p className="text-muted-foreground" data-testid="text-no-deals">Check back soon for amazing deals!</p>
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* Restaurant Recommendation Section */}
      <div className="px-6 py-8 pb-24 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/10 border-t border-border/30">
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