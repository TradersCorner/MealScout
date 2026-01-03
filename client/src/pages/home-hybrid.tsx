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
import { MapPin, Sparkles, Rocket, Pizza, DollarSign, Truck, RotateCw, ChefHat, Clock, Target, Heart, Bell, Map } from "lucide-react";
import mealScoutLogo from "@assets/ChatGPT Image Sep 14, 2025, 09_25_52 AM_1757872111259.png";
import { useFoodTruckSocket } from "@/hooks/useFoodTruckSocket";
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

  const { isConnected, subscribeToNearby, connect: connectWS } = useFoodTruckSocket();

  // Auto-detect location on mount
  useEffect(() => {
    if (!location && !isLoadingLocation) {
      setIsLoadingLocation(true);
      handleLocationDetection();
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

  const { data: featuredDeals, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    queryFn: () => fetch('/api/deals/featured').then(res => res.json()),
  });

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative overflow-hidden">
      <Navigation />
      
      {/* Header with Logo and Location */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={mealScoutLogo} alt="MealScout Logo" className="w-10 h-10 object-contain" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-xl font-bold text-gray-900">MealScout</h1>
            </div>
          </div>

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
                <p className="text-gray-700 text-xs font-semibold mb-0.5">
                  {location ? 'Deals near you' : 'Location needed'}
                </p>
                <p className="text-gray-900 font-semibold text-sm leading-tight truncate" title={locationName}>
                  <span className="lg:hidden">{locationName.split(',')[0]}</span>
                  <span className="hidden lg:inline">{locationName}</span>
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {locationError ? 'Access denied — enter your city' : location ? 'Live nearby deals' : 'Enable GPS or enter city'}
                </p>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button 
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-orange-100 bg-white hover:bg-orange-50 text-gray-700 transition-colors"
                  onClick={retryLocation}
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

      {/* Search Bar & Hero Section - ORIGINAL WORDING */}
      <div className="px-6 py-8 bg-gradient-to-br from-gray-50 via-white to-orange-50 border-b border-orange-100">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Find Amazing Deals In Your Neighborhood</h2>
          <p className="text-gray-600">Discover nearby restaurants & food trucks — support your local spots with exclusive offers</p>
        </div>
        
        <SmartSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={(query) => setNavigateTo(`/search?q=${encodeURIComponent(query)}`)}
          className="mb-6"
          placeholder="Search deals, restaurants..."
        />
        
        {/* Filter Chips */}
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2">
          <Link href="/deals/featured">
            <Button className="flex-shrink-0 rounded-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0 shadow-md hover:shadow-lg transition-all" size="sm">
              <Sparkles className="w-4 h-4 mr-2" /> Hot Deals
            </Button>
          </Link>
          <Link href="/search?filter=quick">
            <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full px-4 py-2 bg-white border-2 border-orange-200 hover:bg-orange-50 font-semibold text-gray-700 hover:text-orange-600 transition-colors">
              <Rocket className="w-4 h-4 mr-2" /> Quick Bites
            </Button>
          </Link>
          <Link href="/category/pizza">
            <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full px-4 py-2 bg-white border-2 border-orange-200 hover:bg-orange-50 font-semibold text-gray-700 hover:text-orange-600 transition-colors">
              <Pizza className="w-4 h-4 mr-2" /> Pizza
            </Button>
          </Link>
          <Link href="/search?filter=budget">
            <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full px-4 py-2 bg-white border-2 border-orange-200 hover:bg-orange-50 font-semibold text-gray-700 hover:text-orange-600 transition-colors">
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
                  <p className="text-gray-700 text-sm">{locationError}</p>
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
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
                />
                <Button
                  onClick={handleManualLocation}
                  disabled={!manualLocation.trim() || isLoadingLocation}
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                >
                  {isLoadingLocation ? "Finding..." : "Find Deals"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Featured Deals Section - ORIGINAL LAYOUT */}
      <div className="px-6 py-8 bg-white">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center">
            <Sparkles className="w-5 h-5 text-orange-500 mr-2" />
            What's Happening Near You Right Now
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Time-sensitive offers from neighborhood restaurants</p>
          <Link href="/deals/featured">
            <Button variant="link" className="text-orange-600 hover:text-orange-700 p-0 h-auto mt-1">
              See all nearby deals →
            </Button>
          </Link>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(featuredDeals) && featuredDeals.length > 0 ? (
              featuredDeals.slice(0, 6).map((deal: Deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p>No featured deals available at the moment</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AUTH-GATED SECTION - PROGRESSIVE DISCLOSURE */}
      <div className="px-6 py-12 bg-gradient-to-br from-gray-50 to-white">
        {!user ? (
          /* LOGGED OUT - PREVIEW */
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Stay connected to your city's food scene
            </h3>
            <p className="text-gray-600 mb-8">
              Join neighbors discovering the best spots in your area — save favorites, track food trucks, and know when your go-to places are open
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Heart className="w-10 h-10 text-orange-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Save neighborhood favorites</h4>
                <p className="text-sm text-gray-600">Quick access to the spots you love</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Truck className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Track trucks nearby</h4>
                <p className="text-sm text-gray-600">See where mobile kitchens are right now</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <Bell className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Get real-time alerts</h4>
                <p className="text-sm text-gray-600">Know when places in your area go live</p>
              </div>
            </div>
            <Link href="/customer-signup">
              <Button size="lg" className="px-8 py-6 text-lg">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Owner Section - ORIGINAL STYLE */}
      <div className="px-6 py-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <ChefHat className="w-16 h-16 mx-auto mb-6 text-orange-400" />
          <h3 className="text-3xl font-bold mb-4">
            Bring your restaurant to the neighborhood
          </h3>
          <p className="text-gray-300 mb-6">
            Connect with customers in your area — post real-time deals, broadcast when you're open, reach people nearby — no pay-to-play rankings
          </p>
          <Link href="/restaurant-signup">
            <Button size="lg" variant="secondary" className="px-8 py-6 text-lg">
              Claim & Go Live
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
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
      </footer>
    </div>
  );
}
