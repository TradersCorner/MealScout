import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFacebook } from '@/hooks/useFacebook';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { Mail, Eye, EyeOff, Pizza, Utensils, Coffee, Cookie, Apple, Fish, ChefHat, IceCream, Sandwich, Beef, Cherry, Soup, Wheat, Grape, Croissant } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DealCard from "@/components/deal-card";
import mealScoutLogo from "@assets/image_1757213417158.png";

const signupSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

type SignupFormData = z.infer<typeof signupSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export default function Landing() {
  const { toast } = useToast();
  const { isLoaded } = useFacebook();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>("Your Area");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };


  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const { confirmPassword, ...signupData } = data;
      return await apiRequest("POST", "/api/auth/customer/register", signupData);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Account created successfully!",
      });
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Logged in successfully!",
      });
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSignup = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  // Force accurate location detection with manual fallback
  useEffect(() => {
    const forceAccurateLocation = () => {
      if (!navigator.geolocation) {
        setLocationError('Location services not available. Please enter your city manually.');
        setShowLocationInput(true);
        return;
      }

      console.log('🎯 Starting high-accuracy location detection...');
      setLocationName('Getting your precise location...');
      
      const options = {
        enableHighAccuracy: true,
        timeout: 20000, // 20 seconds for most accurate reading
        maximumAge: 0 // Force fresh location, ignore all cache
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('📍 HIGH-ACCURACY GPS:', { 
            latitude, 
            longitude, 
            accuracy: `${Math.round(accuracy)}m`,
            timestamp: new Date().toLocaleTimeString()
          });
          
          setLocation({ lat: latitude, lng: longitude });
          setLocationError(null);

          // Get city name from coordinates
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await response.json();
            
            // Try multiple location name sources
            const cityName = data.city || data.locality || data.principalSubdivision || data.countryName || "Your Area";
            
            console.log('🏙️ Location resolved:', {
              city: data.city,
              locality: data.locality,
              state: data.principalSubdivision,
              final: cityName
            });
            
            setLocationName(cityName);
          } catch (error) {
            console.error('❌ Geocoding failed:', error);
            setLocationName(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          }
        },
        (error) => {
          console.error('❌ GPS location failed:', error.message);
          
          let errorMessage = '';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please click "Use My Location" to try again or enter your city manually.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Please enter your city manually below.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please enter your city manually below.';
              break;
            default:
              errorMessage = 'Unable to get your location. Please enter your city manually below.';
              break;
          }
          
          setLocationError(errorMessage);
          setLocationName("Location Not Found");
          setShowLocationInput(true);
        },
        options
      );
    };

    forceAccurateLocation();
  }, []);

  // Handle manual location input
  const handleManualLocation = async () => {
    if (!manualLocation.trim()) return;
    
    try {
      console.log('🔍 Searching for:', manualLocation);
      setLocationName('Finding location...');
      
      // Use Nominatim API for better city search
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=1&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        setLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
        
        // Use city name from address details
        const address = result.address;
        const cityName = address.city || address.town || address.village || address.county || result.display_name.split(',')[0];
        
        setLocationName(cityName);
        setLocationError(null);
        setShowLocationInput(false);
        console.log('✅ Manual location set:', { city: cityName, coords: [result.lat, result.lon] });
      } else {
        throw new Error('Location not found');
      }
    } catch (error) {
      console.error('Manual location failed:', error);
      setLocationError('Could not find that location. Please try a different city name (e.g., "Hammond, LA").');
    }
  };

  // Retry location detection
  const retryLocation = () => {
    setLocationError(null);
    setShowLocationInput(false);
    setLocationName('Getting your location...');
    setLocation(null);
    
    // Force fresh location detection
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('🔄 Location retry successful:', { latitude, longitude });
          setLocation({ lat: latitude, lng: longitude });
          
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await response.json();
            const cityName = data.city || data.locality || data.principalSubdivision || "Your Area";
            setLocationName(cityName);
          } catch (error) {
            setLocationName(`Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          }
        },
        (error) => {
          console.error('Location retry failed:', error);
          setLocationError('Still unable to get your location. Please enter your city manually.');
          setShowLocationInput(true);
        },
        options
      );
    }
  };

  // Fetch nearby deals based on location
  const { data: nearbyDeals, isLoading: nearbyLoading } = useQuery({
    queryKey: ["/api/deals/nearby", location?.lat, location?.lng],
    enabled: !!location && !locationError,
    retry: 2,
  });

  // Fetch featured deals as fallback when no location or location error
  const { data: featuredDeals, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: !location || !!locationError,
    retry: 2,
  });

  // Use nearby deals if available, otherwise featured deals
  const allDeals = (nearbyDeals || featuredDeals || []) as any[];
  const isLoading = nearbyLoading || featuredLoading;

  // Filter deals based on selected category and search query
  const dealsToShow = allDeals.filter((deal: any) => {
    const matchesCategory = selectedCategory === 'all' || 
      (deal.restaurant?.cuisineType && deal.restaurant.cuisineType.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (deal.title && deal.title.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (deal.description && deal.description.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    const matchesSearch = searchQuery === '' ||
      (deal.title && deal.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (deal.description && deal.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (deal.restaurant?.name && deal.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Category filter functions
  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src={mealScoutLogo} 
                alt="MealScout Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-gray-900">MealScout</span>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/restaurant-signup">
              <button className="hidden sm:flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                <span>For Restaurants</span>
              </button>
            </Link>
            <button 
              onClick={handleFacebookLogin}
              className="hidden sm:flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Login</span>
            </button>
            <button 
              onClick={handleFacebookLogin}
              className="w-11 h-11 sm:hidden bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Location Header */}
      <div className="bg-white px-4 py-6 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-md mx-auto lg:max-w-none lg:flex lg:justify-center">
          <button 
            onClick={retryLocation}
            className="w-full text-left hover:bg-gray-50 rounded-xl p-4 -m-2 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 mb-1">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={locationError ? "text-orange-500" : "text-red-500"}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">Deals near</span>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                  <path d="M1 4v6h6"/>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                </svg>
              </div>
            </div>
            <p className="text-gray-600 text-base font-medium" data-testid="text-location-name">{locationName}</p>
          </button>
          
          {/* Modern location input */}
          <div className="mt-6 max-w-lg mx-auto">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl p-6">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="Search your city..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/80 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white text-gray-900 placeholder-gray-500 font-medium text-lg transition-all duration-200 shadow-sm focus:shadow-md"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleManualLocation}
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Find Deals
                  </button>
                  <button
                    onClick={retryLocation}
                    className="px-5 py-3.5 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 rounded-xl font-medium text-sm transition-all duration-200 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <span>GPS</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Location error message */}
          {locationError && (
            <div className="mt-2 max-w-md mx-auto">
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-xs text-center">{locationError}</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurants, cuisines, or dishes" 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 text-lg shadow-sm hover:shadow-md transition-shadow"
            />
          </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="bg-white px-4 py-6 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center">
            <div className="max-w-4xl w-full">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            <button 
              onClick={() => handleCategoryFilter('all')}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 ${
                selectedCategory === 'all' 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              🔥 All Deals
            </button>
            <button 
              onClick={() => handleCategoryFilter('american')}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                selectedCategory === 'american' 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              🍔 Fast Food
            </button>
            <button 
              onClick={() => handleCategoryFilter('pizza')}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                selectedCategory === 'pizza' 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              🍕 Pizza
            </button>
            <button 
              onClick={() => handleCategoryFilter('burger')}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                selectedCategory === 'burger' 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              🍟 Burgers
            </button>
            <button 
              onClick={() => handleCategoryFilter('mexican')}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                selectedCategory === 'mexican' 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              🌮 Mexican
            </button>
            <button 
              onClick={() => handleCategoryFilter('asian')}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                selectedCategory === 'asian' 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              🍜 Asian
            </button>
          </div>
            </div>
        </div>
      </div>

      {/* Deals Section */}
      <div className="py-8 bg-gradient-to-b from-transparent to-red-100/30">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16 px-4">
            <div className="animate-spin w-16 h-16 border-4 border-gray-200 border-t-red-500 rounded-full mx-auto mb-6"></div>
            <p className="text-gray-600 text-xl font-medium">Finding amazing deals near you...</p>
          </div>
        )}

        {!isLoading && selectedCategory !== 'all' && dealsToShow.length > 0 && (
          <div className="px-4 mb-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} deals in {locationName}
                </h2>
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  View all →
                </button>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {dealsToShow.slice(0, 10).map((deal: any) => (
                  <div key={deal.id} className="flex-shrink-0 w-80">
                    <DealCard deal={deal} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isLoading && selectedCategory === 'all' && allDeals.length > 0 && (
          <div className="space-y-8">
            {/* Featured Deals Section */}
            <div className="px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">🔥 Featured Deals</h2>
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  {allDeals.filter((deal: any) => deal.isFeatured).slice(0, 8).map((deal: any) => (
                    <div key={deal.id} className="flex-shrink-0 w-80">
                      <DealCard deal={deal} />
                    </div>
                  ))}
                  {allDeals.filter((deal: any) => deal.isFeatured).length === 0 && 
                    allDeals.slice(0, 6).map((deal: any) => (
                      <div key={deal.id} className="flex-shrink-0 w-80">
                        <DealCard deal={deal} />
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* Fast Food Section */}
            {allDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('american') || 
              deal.title?.toLowerCase().includes('burger') ||
              deal.title?.toLowerCase().includes('fast')
            ).length > 0 && (
              <div className="px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">🍔 Fast Food</h2>
                    <button 
                      onClick={() => handleCategoryFilter('american')}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                    {allDeals.filter((deal: any) => 
                      deal.restaurant?.cuisineType?.toLowerCase().includes('american') || 
                      deal.title?.toLowerCase().includes('burger') ||
                      deal.title?.toLowerCase().includes('fast')
                    ).slice(0, 8).map((deal: any) => (
                      <div key={deal.id} className="flex-shrink-0 w-80">
                        <DealCard deal={deal} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pizza Section */}
            {allDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('pizza') || 
              deal.title?.toLowerCase().includes('pizza')
            ).length > 0 && (
              <div className="px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">🍕 Pizza</h2>
                    <button 
                      onClick={() => handleCategoryFilter('pizza')}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                    {allDeals.filter((deal: any) => 
                      deal.restaurant?.cuisineType?.toLowerCase().includes('pizza') || 
                      deal.title?.toLowerCase().includes('pizza')
                    ).slice(0, 8).map((deal: any) => (
                      <div key={deal.id} className="flex-shrink-0 w-80">
                        <DealCard deal={deal} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mexican Section */}
            {allDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('mexican') || 
              deal.title?.toLowerCase().includes('mexican') ||
              deal.title?.toLowerCase().includes('taco')
            ).length > 0 && (
              <div className="px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">🌮 Mexican</h2>
                    <button 
                      onClick={() => handleCategoryFilter('mexican')}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                    {allDeals.filter((deal: any) => 
                      deal.restaurant?.cuisineType?.toLowerCase().includes('mexican') || 
                      deal.title?.toLowerCase().includes('mexican') ||
                      deal.title?.toLowerCase().includes('taco')
                    ).slice(0, 8).map((deal: any) => (
                      <div key={deal.id} className="flex-shrink-0 w-80">
                        <DealCard deal={deal} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Asian Section */}
            {allDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('asian') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('chinese') ||
              deal.restaurant?.cuisineType?.toLowerCase().includes('thai') ||
              deal.title?.toLowerCase().includes('sushi')
            ).length > 0 && (
              <div className="px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">🍜 Asian</h2>
                    <button 
                      onClick={() => handleCategoryFilter('asian')}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                    {allDeals.filter((deal: any) => 
                      deal.restaurant?.cuisineType?.toLowerCase().includes('asian') || 
                      deal.restaurant?.cuisineType?.toLowerCase().includes('chinese') ||
                      deal.restaurant?.cuisineType?.toLowerCase().includes('thai') ||
                      deal.title?.toLowerCase().includes('sushi')
                    ).slice(0, 8).map((deal: any) => (
                      <div key={deal.id} className="flex-shrink-0 w-80">
                        <DealCard deal={deal} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

          {/* No Deals State */}
          {!isLoading && dealsToShow.length === 0 && allDeals.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl shadow-xl max-w-2xl mx-auto">
              <div className="text-8xl mb-8">🍽️</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">No deals found nearby</h3>
              <p className="text-gray-600 mb-10 text-xl">Be the first to discover great deals in {locationName}!</p>
              <Link href="/restaurant-signup" className="inline-block bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors">
                Add your restaurant
              </Link>
            </div>
          )}

          {/* No Filtered Deals State */}
          {!isLoading && dealsToShow.length === 0 && allDeals.length > 0 && (
            <div className="text-center py-20 bg-white rounded-3xl shadow-xl max-w-2xl mx-auto">
              <div className="text-8xl mb-8">🔍</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                No {selectedCategory === 'all' ? '' : selectedCategory} deals match your search
              </h3>
              <p className="text-gray-600 mb-10 text-xl">
                Try a different category or clear your search to see all available deals
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors"
                >
                  Show All Deals
                </button>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-2xl font-semibold text-lg transition-colors"
                >
                  Clear Search
                </button>
              </div>
            </div>
          )}

          {/* User Account CTA */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-10 text-center shadow-xl border border-red-200/50 mb-12">
              <div className="text-6xl mb-6">👤</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Join MealScout Today</h3>
              <p className="text-gray-600 mb-8 text-xl max-w-2xl mx-auto">
                Create your free account to save favorite deals, get personalized recommendations, and never miss out on great food offers near you!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
                  onClick={handleFacebookLogin}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                  Create Free Account
                </Button>
                <div className="text-gray-500 text-sm">or</div>
                <Button 
                  variant="outline"
                  className="border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 w-full sm:w-auto"
                  onClick={handleFacebookLogin}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  </svg>
                  Login to Account
                </Button>
              </div>
              <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>100% Free</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>Instant Access</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>No Spam</span>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurant CTA */}
          {dealsToShow.length > 0 && (
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="bg-white rounded-3xl p-10 text-center shadow-xl">
                <div className="text-6xl mb-6">🔔</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Never miss a deal</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Get notified when new deals are available in {locationName}
                </p>
                <Button 
                  className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={handleFacebookLogin}
                >
                  Get notifications
                </Button>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-10 text-center shadow-xl border border-blue-200/50">
                <div className="text-6xl mb-6">🏪</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Own a restaurant?</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Attract more customers with targeted deals in {locationName}
                </p>
                <Link href="/restaurant-signup">
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}