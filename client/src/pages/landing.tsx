import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useFacebook } from '@/hooks/useFacebook';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { Mail, Eye, EyeOff, Pizza, Utensils, Coffee, Cookie, Apple, Fish, ChefHat, IceCream, Sandwich, Beef, Cherry, Soup, Wheat, Grape, Croissant } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DealCard from "@/components/deal-card";
import mealScoutLogo from "@assets/ChatGPT Image Sep 14, 2025, 09_25_52 AM_1757872111259.png";
import "../facebook-browser.css";

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'primary'>('primary');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Facebook Browser Detection
  const [isFacebookBrowser, setIsFacebookBrowser] = useState(false);
  
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isFBBrowser = /FBAN|FBAV|MessengerForiOS|FB_IAB|FBIOS/.test(userAgent);
    setIsFacebookBrowser(isFBBrowser);
    
    if (isFBBrowser) {
      console.log('🔵 Facebook Browser detected - optimizing experience');
      // Optimize for Facebook browser
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'pan-x pan-y';
      
      // Add Facebook browser class for specific styling
      document.documentElement.classList.add('facebook-browser');
    }
  }, []);

  const handleFacebookLogin = () => {
    // In Facebook browser, use different approach for better compatibility
    if (isFacebookBrowser) {
      console.log('🔵 Facebook Browser login - using optimized flow');
      // Add small delay to ensure proper handling in Facebook browser
      setTimeout(() => {
        window.location.href = '/api/auth/facebook';
      }, 100);
    } else {
      window.location.href = '/api/auth/facebook';
    }
  };

  const handleGoogleLogin = () => {
    // Use direct Google OAuth authentication
    window.location.href = '/api/auth/google/customer';
  };

  const handleEmailLogin = () => {
    console.log('🔑 Email login clicked');
    setAuthMode('login');
    setShowAuth(true); // Show modal directly
  };

  const handleEmailSignup = () => {
    console.log('✏️ Email signup clicked');
    setAuthMode('signup');
    setShowAuth(true); // Show modal directly
  };


  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (modalRef.current && !modalRef.current.contains(target)) {
        setShowAuth(false);
      }
    };

    if (showAuth) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showAuth]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleDropdownClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const dropdown = document.querySelector('.login-dropdown');
      if (dropdown && !dropdown.contains(target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleDropdownClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleDropdownClickOutside);
    };
  }, [showDropdown]);


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
    mode: "onSubmit",
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

  // Simplified and more reliable location detection
  useEffect(() => {
    const detectLocationWithFallbacks = async () => {
      if (!navigator.geolocation) {
        setLocationError('Location services not available. Please enter your city manually.');
        setShowLocationInput(true);
        return;
      }

      console.log('🎯 Starting location detection...');
      setLocationName('Getting your location...');
      
      // Simplified location detection with better reliability
      const tryLocationMethod = (attempt = 1) => {
        return new Promise<GeolocationPosition>((resolve, reject) => {
          const options = {
            enableHighAccuracy: attempt === 1, // High accuracy only on first attempt
            timeout: attempt === 1 ? 15000 : 10000, // Reasonable timeouts
            maximumAge: attempt === 1 ? 0 : 60000 // Allow cached location after first attempt
          };

          console.log(`📡 Location attempt ${attempt}:`, options);

          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log(`✅ Location attempt ${attempt} success:`, {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: `${Math.round(position.coords.accuracy)}m`,
                timestamp: new Date().toLocaleTimeString()
              });
              resolve(position);
            },
            (error) => {
              console.log(`❌ Location attempt ${attempt} failed:`, error.message, error.code);
              reject(error);
            },
            options
          );
        });
      };

      // Try up to 2 attempts for reliability
      const maxAttempts = 2;
      let permissionDenied = false;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (permissionDenied) break;
        
        try {
          const position = await tryLocationMethod(attempt);
          const { latitude, longitude, accuracy } = position.coords;
          
          // Validate coordinates are reasonable (within expected ranges)
          if (latitude < 24 || latitude > 50 || longitude < -130 || longitude > -65) {
            console.warn('⚠️ GPS coordinates seem invalid for US location, trying next method...');
            continue;
          }
          
          console.log(`📍 FINAL LOCATION:`, { 
            latitude, 
            longitude, 
            accuracy: `${Math.round(accuracy)}m`,
            method: `attempt-${attempt}`
          });
          
          setLocation({ lat: latitude, lng: longitude });
          setLocationError(null);

          // Simplified geocoding with fallbacks
          try {
            console.log('🔄 Getting location name...');
            let response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            
            if (!response.ok) throw new Error('BigDataCloud API failed');
            
            const data = await response.json();
            let cityName = data.city || data.locality || data.principalSubdivision;
            
            // If BigDataCloud doesn't give a good city name, try Nominatim as backup
            if (!cityName || cityName.toLowerCase().includes('district') || cityName.toLowerCase().includes('subdivision')) {
              console.log('🔄 Trying backup geocoding service...');
              response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=15&addressdetails=1`
              );
              
              if (response.ok) {
                const backupData = await response.json();
                const address = backupData.address;
                // Prioritize actual cities and towns over counties/parishes
                cityName = address?.city || address?.town || address?.village || address?.hamlet;
                
                // Only use county/parish as last resort if no city/town found
                if (!cityName) {
                  // Try a specialized nearby places API for better city data
                  try {
                    console.log('🔄 Trying nearby places API for nearest city...');
                    const response3 = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=en`
                    );
                    if (response3.ok) {
                      const place = await response3.json();
                      console.log('🔍 Nearby place data:', place);
                      
                      // Try to get city name from the more detailed reverse geocoding
                      if (place.address) {
                        const detailedCity = place.address.city || 
                                           place.address.town || 
                                           place.address.village || 
                                           place.address.hamlet;
                        
                        if (detailedCity && 
                            !detailedCity.toLowerCase().includes('district') && 
                            !detailedCity.toLowerCase().includes('parish') &&
                            !detailedCity.toLowerCase().includes('county') &&
                            detailedCity.length > 2) {
                          cityName = detailedCity;
                          console.log('🏙️ Found detailed city:', { name: detailedCity, display: place.display_name });
                        }
                      }
                    } else {
                      console.log('❌ Nearby places API returned:', response3.status, response3.statusText);
                    }
                  } catch (nearestError) {
                    console.log('❌ Nearby places lookup failed:', nearestError);
                  }
                  
                  // Final fallback to parish/county with user-friendly formatting
                  if (!cityName) {
                    const countyName = address?.county || address?.state;
                    
                    // For Louisiana parishes, provide a more user-friendly format
                    if (countyName && countyName.toLowerCase().includes('parish')) {
                      // Extract the parish name and format it better
                      const parishName = countyName.replace(/\s+Parish$/i, '').trim();
                      cityName = `${parishName} Area, LA`; // e.g., "Tangipahoa Area, LA"
                    } else if (countyName) {
                      cityName = countyName;
                    }
                  }
                }
              }
            }
            
            // Final fallback to any available location name
            if (!cityName) {
              cityName = data.locality || data.principalSubdivision || data.countryName || "Your Area";
            }
            
            console.log('🏙️ Location resolved:', {
              city: cityName,
              state: data.principalSubdivision,
              coordinates: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            });
            
            setLocationName(cityName);
          } catch (error) {
            console.error('❌ Geocoding failed:', error);
            setLocationName(`Location Found (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          }
          
          return; // Success, exit the retry loop
          
        } catch (error) {
          const geoError = error as GeolocationPositionError;
          console.log(`❌ Location attempt ${attempt} failed:`, geoError.message);
          
          // If permission is denied, stop all attempts immediately
          if (geoError.code === GeolocationPositionError.PERMISSION_DENIED) {
            console.log('🛑 Permission denied, stopping all location attempts');
            setLocationError('Location access denied. You can manually enter your location below.');
            setLocationName("Location Access Denied");
            setShowLocationInput(true);
            return; // Exit the entire function
          }
          
          if (attempt === maxAttempts) {
            // All attempts failed
            let errorMessage = 'Unable to detect your location automatically. ';
            if (geoError.code === GeolocationPositionError.TIMEOUT) {
              errorMessage += 'GPS signal timeout. Please enter your city manually.';
            } else if (geoError.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
              errorMessage += 'GPS unavailable. Please enter your city manually.';
            } else {
              errorMessage += 'Please enter your city manually below.';
            }
            
            setLocationError(errorMessage);
            setLocationName("Location Not Available");
            setShowLocationInput(true);
          }
          // Continue to next attempt only if not permission denied
        }
      }
    };

    // Start location detection
    detectLocationWithFallbacks();
  }, [isFacebookBrowser]);

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

  // Retry location detection using enhanced method
  const retryLocation = async () => {
    setLocationError(null);
    setShowLocationInput(false);
    setLocationName('Retrying location...');
    setLocation(null);
    
    // Use the same enhanced detection logic
    if (!navigator.geolocation) {
      setLocationError('Location services not available. Please enter your city manually.');
      setShowLocationInput(true);
      return;
    }

    console.log('🔄 Retrying enhanced location detection...');
    
    // Single retry attempt with high accuracy
    const options = {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        console.log('✅ Location retry successful:', {
          latitude, 
          longitude, 
          accuracy: `${Math.round(accuracy)}m`
        });
        
        // Validate coordinates are reasonable
        if (latitude < 24 || latitude > 50 || longitude < -130 || longitude > -65) {
          console.warn('⚠️ Retry GPS coordinates seem invalid for US location');
          setLocationError('Location seems inaccurate. Please enter your city manually.');
          setShowLocationInput(true);
          return;
        }
        
        setLocation({ lat: latitude, lng: longitude });
        
        // Enhanced reverse geocoding
        try {
          let response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (!response.ok) throw new Error('Primary geocoding failed');
          
          const data = await response.json();
          let cityName = data.city || data.locality || data.principalSubdivision;
          
          // Backup geocoding if needed
          if (!cityName || cityName.length < 3) {
            response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
            );
            
            if (response.ok) {
              const backupData = await response.json();
              const address = backupData.address;
              cityName = address?.city || address?.town || address?.village || address?.county;
            }
          }
          
          if (!cityName) {
            cityName = data.locality || data.principalSubdivision || 'Your Area';
          }
          
          console.log('🏙️ Retry location resolved:', { final: cityName });
          setLocationName(cityName);
          
        } catch (error) {
          console.error('❌ Retry geocoding failed:', error);
          setLocationName(`Location Found (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        }
      },
      (error) => {
        console.error('❌ Location retry failed:', error.message);
        setLocationError('Still unable to get your precise location. Please try entering your city manually.');
        setLocationName('Location Not Available');
        setShowLocationInput(true);
      },
      options
    );
  };

  // Fetch nearby deals based on location
  const { data: nearbyDeals, isLoading: nearbyLoading } = useQuery({
    queryKey: ["/api/deals/nearby", location?.lat, location?.lng],
    enabled: !!location && !locationError,
    retry: 2,
  });

  // Fetch featured deals - always available as fallback
  const { data: featuredDeals, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
    retry: 2,
  });

  // Use nearby deals if available, otherwise featured deals
  const allDeals = (Array.isArray(nearbyDeals) && nearbyDeals.length > 0) ? nearbyDeals : (Array.isArray(featuredDeals) ? featuredDeals : []) as any[];
  const isLoading = featuredLoading; // Only wait for featured deals
  
  

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
      
      {/* Facebook Browser Notification */}
      {isFacebookBrowser && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Optimized for Facebook • Tap outside links to open in your browser</span>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 px-3 sm:px-4 py-3 sm:py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
              <img 
                src={mealScoutLogo} 
                alt="MealScout Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
              />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900 truncate">MealScout</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Desktop Buttons */}
            <Link href="/restaurant-signup" className="hidden md:block">
              <button className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                <span>For Restaurants</span>
              </button>
            </Link>
            
            {/* Tablet Buttons */}
            <Link href="/restaurant-signup" className="hidden sm:block md:hidden">
              <button className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold text-xs shadow-md transition-all duration-200">
                Restaurant
              </button>
            </Link>
            
            {/* Login Dropdown Menu */}
            <div className="hidden sm:block relative login-dropdown">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm text-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
                data-testid="button-login-dropdown"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 sm:w-4 sm:h-4">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="hidden md:inline">Login</span>
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              
              {/* Login Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Login Method</h3>
                    
                    {/* Note about OAuth setup */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-xs text-blue-700">
                        💡 <strong>Free Setup:</strong> Google & Facebook auth are completely free to set up - no billing required!
                      </p>
                    </div>
                    
                    {/* Create Account Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        setAuthMode('signup');
                        setShowAuth(true);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors mb-2"
                      data-testid="button-desktop-create-account"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                      </svg>
                      <span className="font-medium">Create Account</span>
                    </button>
                    
                    {/* Login Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        setAuthMode('login');
                        setShowAuth(true);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors mb-2"
                      data-testid="button-desktop-login"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                      </svg>
                      <span className="font-medium">Sign In</span>
                    </button>
                    
                    <div className="text-center text-gray-500 text-xs mb-2">or continue with</div>
                    
                    {/* Google Login */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        handleGoogleLogin();
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-2"
                      data-testid="button-desktop-google"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="font-medium text-gray-700">Continue with Google</span>
                    </button>
                    
                    {/* Facebook Login */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        handleFacebookLogin();
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      data-testid="button-desktop-facebook"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="font-medium">Continue with Facebook</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="sm:hidden flex items-center space-x-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click outside handler
                  setAuthMode('signup'); // Open directly in signup mode
                  setShowAuth(true);
                }}
                className="w-9 h-9 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors duration-200 shadow-sm"
                data-testid="mobile-create-account-button"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click outside handler
                  setAuthMode('primary'); // Set to primary mode to show main auth options
                  setShowAuth(!showAuth);
                }}
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
                data-testid="mobile-login-button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal - Mobile and Desktop */}
      {showAuth && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            // Close modal when clicking on overlay
            if (e.target === e.currentTarget) {
              setShowAuth(false);
            }
          }}
          data-testid="login-modal-overlay"
        >
          <div 
            ref={modalRef}
            className="modal-content bg-white rounded-2xl w-full max-w-sm p-6"
            onMouseDown={(e) => {
              // Prevent the global click handler from firing when interacting with modal content
              e.stopPropagation();
            }}
            data-testid="login-modal-content"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Login to MealScout</h3>
              <button
                onClick={() => setShowAuth(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                data-testid="button-close-modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Email Login */}
              {authMode === 'login' ? (
                <div className="space-y-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4" method="post" autoComplete="on">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                data-testid="input-login-email"
                                autoComplete="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  name="password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  data-testid="input-login-password"
                                  autoComplete="current-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium"
                        disabled={loginMutation.isPending}
                        data-testid="button-login-submit"
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={() => setAuthMode('signup')}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Need an account? Sign up
                    </button>
                    <Link href="/forgot-password">
                      <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer" data-testid="link-forgot-password">
                        Forgot password?
                      </span>
                    </Link>
                  </div>
                </div>
              ) : authMode === 'signup' ? (
                <div className="space-y-4">
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4" method="post" autoComplete="on">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={signupForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700">First Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  name="firstName"
                                  placeholder="First name"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  data-testid="input-signup-firstname"
                                  autoComplete="given-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={signupForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700">Last Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  name="lastName"
                                  placeholder="Last name"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  data-testid="input-signup-lastname"
                                  autoComplete="family-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                data-testid="input-signup-email"
                                autoComplete="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  name="password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create password (6+ chars)"
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  data-testid="input-signup-password"
                                  autoComplete="new-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  name="confirmPassword"
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm your password"
                                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  data-testid="input-signup-confirm-password"
                                  autoComplete="new-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium"
                        disabled={signupMutation.isPending}
                        data-testid="button-signup-submit"
                      >
                        {signupMutation.isPending ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="text-center">
                    <button
                      onClick={() => setAuthMode('login')}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Create Account Button - Primary Action */}
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium mb-3"
                    data-testid="button-create-account"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                    </svg>
                    <span className="font-medium">Create Account</span>
                  </button>
                  
                  {/* Login Button - Secondary Action */}
                  <button
                    onClick={() => setAuthMode('login')}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium mb-3"
                    data-testid="button-login"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                    </svg>
                    <span className="font-medium">Sign In</span>
                  </button>
                  
                  <div className="text-center text-gray-500 text-sm mb-3">or continue with</div>
                  
                  {/* Google Login */}
                  <button
                    onClick={() => {
                      setShowAuth(false);
                      handleGoogleLogin();
                    }}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors mb-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium text-gray-700">Continue with Google</span>
                  </button>
                  
                  {/* Facebook Login */}
                  <button
                    onClick={() => {
                      setShowAuth(false);
                      handleFacebookLogin();
                    }}
                    className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="font-medium">Continue with Facebook</span>
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-6">
              By continuing, you agree to our{" "}
              <Link href="/terms-of-service">
                <span className="text-blue-600 underline hover:text-blue-700 cursor-pointer">Terms of Service</span>
              </Link> and{" "}
              <Link href="/privacy-policy">
                <span className="text-blue-600 underline hover:text-blue-700 cursor-pointer">Privacy Policy</span>
              </Link>
            </p>
          </div>
        </div>
      )}

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


            {/* Pizza Section */}
            {allDeals.filter((deal: any) => 
              deal.restaurant?.cuisine_type?.toLowerCase().includes('pizza') || 
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
                      deal.restaurant?.cuisine_type?.toLowerCase().includes('pizza') || 
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
              deal.restaurant?.cuisine_type?.toLowerCase().includes('mexican') || 
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
                      deal.restaurant?.cuisine_type?.toLowerCase().includes('mexican') || 
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
              deal.restaurant?.cuisine_type?.toLowerCase().includes('asian') || 
              deal.restaurant?.cuisine_type?.toLowerCase().includes('chinese') ||
              deal.restaurant?.cuisine_type?.toLowerCase().includes('thai') ||
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
                      deal.restaurant?.cuisine_type?.toLowerCase().includes('asian') || 
                      deal.restaurant?.cuisine_type?.toLowerCase().includes('chinese') ||
                      deal.restaurant?.cuisine_type?.toLowerCase().includes('thai') ||
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

          {/* Featured Deals - Force Show Always */}
          <div className="px-4 mb-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🔥 Featured Deals in {locationName}</h2>
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {isLoading ? (
                  <div className="text-center py-12 px-6 w-full">
                    <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-red-500 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading deals...</p>
                  </div>
                ) : allDeals.length > 0 ? (
                  allDeals.slice(0, 10).map((deal: any) => (
                    <div key={deal.id} className="flex-shrink-0 w-80">
                      <DealCard deal={deal} />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 px-6 w-full">
                    <p className="text-gray-600">No deals available</p>
                  </div>
                )}
              </div>
            </div>
          </div>


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
                  onClick={handleEmailSignup}
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
                  onClick={handleEmailLogin}
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
                  onClick={handleEmailLogin}
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