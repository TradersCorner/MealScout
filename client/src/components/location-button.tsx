import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, CheckCircle, XCircle, RefreshCw, Home, MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { UserAddress } from "@shared/schema";

// Extract reverse geocoding logic into a separate function for cleaner code structure
async function getReverseGeocodedLocationName(
  latitude: number, 
  longitude: number, 
  onLocationNameUpdate: (name: string) => void
): Promise<void> {
  let locationName = "Your Location";
  
  try {
    // Primary: US Census API (free, unlimited, very accurate for US)
    console.log('🏛️ Trying US Census reverse geocoding...');
    const censusResponse = await fetch(
      `https://geocoding.census.gov/geocoder/geographies/coordinates?x=${longitude}&y=${latitude}&benchmark=2020&vintage=2020&format=json`
    );
    const censusData = await censusResponse.json();
    
    if (censusData.result?.geographies?.['2020 Census Blocks']?.[0]) {
      const censusResult = censusData.result.geographies['2020 Census Blocks'][0];
      const zipCode = censusResult.ZCTA5CE20;
      const stateName = censusResult.STATE;
      
      console.log('🏛️ US Census result:', { 
        zip: zipCode, 
        state: stateName,
        county: censusResult.COUNTY,
        block: censusResult.BLOCK
      });
      
      if (zipCode) {
        // Now get city name from zip code using another free API
        console.log('📮 Looking up city from zip code:', zipCode);
        try {
          const zipResponse = await fetch(
            `https://api.zippopotam.us/us/${zipCode}`
          );
          const zipData = await zipResponse.json();
          
          if (zipData.places && zipData.places.length > 0) {
            const cityName = zipData.places[0]['place name'];
            const state = zipData.places[0]['state abbreviation'];
            locationName = `${cityName}, ${state}`;
            console.log('✅ Found city from zip code:', locationName);
          }
        } catch (zipError) {
          console.log('❌ Zip code lookup failed:', zipError);
        }
      }
    }
    
    // Fallback: Free BigDataCloud API if US Census fails
    if (locationName === "Your Location") {
      console.log('🌍 Trying BigDataCloud reverse geocoding...');
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const data = await response.json();
      
        // Prioritize real city names over administrative divisions
        locationName = data.city || data.locality || "Your Location";
                         
        console.log('🏙️ BigDataCloud result:', { 
          city: data.city, 
          locality: data.locality, 
          final: locationName 
        });
      } catch (error) {
        console.log('❌ BigDataCloud failed:', error);
      }
    }
    
    // OpenStreetMap fallback for difficult cases
    if (locationName === "Your Location" || 
        locationName.toLowerCase().includes('district') || 
        locationName.toLowerCase().includes('subdivision') ||
        locationName.toLowerCase().includes('parish')) {
      
      console.log('🌍 Trying OpenStreetMap reverse geocoding...');
      
      // Try multiple zoom levels to get better city results
      let bestCityName = null;
      
      for (const zoom of [14, 12, 10, 8]) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=${zoom}&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.address) {
            console.log(`🏙️ OpenStreetMap zoom ${zoom} result:`, { 
              city: data.address.city, 
              town: data.address.town,
              village: data.address.village,
              hamlet: data.address.hamlet
            });
            
            // Try to get actual city/town names first
            const cityCandidate = data.address.city || 
                                 data.address.town || 
                                 data.address.village || 
                                 data.address.hamlet;
            
            if (cityCandidate && 
                !cityCandidate.toLowerCase().includes('district') &&
                !cityCandidate.toLowerCase().includes('parish') &&
                !cityCandidate.toLowerCase().includes('subdivision')) {
              bestCityName = cityCandidate;
              console.log(`✅ Found good city name at zoom ${zoom}:`, bestCityName);
              break;
            }
          }
        } catch (error) {
          console.log(`❌ OpenStreetMap zoom ${zoom} failed:`, error);
        }
      }
      
      if (bestCityName) {
        locationName = bestCityName;
      }
    }
    
    // Final check: if we still have a bad location name, try one more precise search
    if (locationName === "District 6" || locationName === "Your Location" || 
        locationName.toLowerCase().includes('district') ||
        locationName.toLowerCase().includes('parish')) {
      
      console.log('🎯 Final attempt: searching for exact location name...');
      try {
        const exactResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${latitude},${longitude}&limit=1&addressdetails=1&extratags=1`
        );
        const exactData = await exactResponse.json();
        
        if (exactData.length > 0) {
          const place = exactData[0];
          const parts = place.display_name?.split(',') || [];
          
          // Look for city name in the display name parts
          for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed && 
                !trimmed.toLowerCase().includes('parish') &&
                !trimmed.toLowerCase().includes('district') &&
                !trimmed.toLowerCase().includes('louisiana') &&
                !trimmed.toLowerCase().includes('united states') &&
                trimmed.length > 2) {
              locationName = trimmed;
              console.log('✅ Found exact location:', trimmed);
              break;
            }
          }
        }
      } catch (error) {
        console.log('❌ Exact location search failed:', error);
      }
    }
    
    // Always call the name update callback
    console.debug('📍 Final location name:', locationName);
    onLocationNameUpdate(locationName || "Your Location");
    
  } catch (geocodeError) {
    console.log('❌ All reverse geocoding failed:', geocodeError);
    onLocationNameUpdate("Your Location");
  }
}

interface LocationButtonProps {
  onLocationUpdate: (location: { lat: number; lng: number }) => void;
  onLocationNameUpdate: (name: string) => void;
  onLocationError: (error: string) => void;
  onShowManualInput?: () => void;
  isLoading?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "minimal";
}

export default function LocationButton({
  onLocationUpdate,
  onLocationNameUpdate,
  onLocationError,
  onShowManualInput,
  isLoading: externalLoading = false,
  className,
  size = "default",
  variant = "default"
}: LocationButtonProps) {
  const { isAuthenticated } = useAuth();
  const [internalLoading, setInternalLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const statusRef = useRef(status);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  // Fetch user addresses if authenticated
  const { data: userAddresses = [] } = useQuery<UserAddress[]>({
    queryKey: ['/api/user/addresses'],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Keep refs in sync with state
  statusRef.current = status;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isLoading = internalLoading; // Only use internal loading, not external

  const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isWindows = userAgent.includes('windows');
    const isAndroid = userAgent.includes('android');
    const isIOS = userAgent.includes('iphone') || userAgent.includes('ipad');
    const isChrome = userAgent.includes('chrome');
    const isFirefox = userAgent.includes('firefox');
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Detect Facebook in-app browser
    const isFacebookBrowser = userAgent.includes('fban') || userAgent.includes('fbav') || 
                             userAgent.includes('fb_iab') || userAgent.includes('fb//') ||
                             (userAgent.includes('mobile') && userAgent.includes('facebook'));
    
    return { isWindows, isAndroid, isIOS, isChrome, isFirefox, isMobile, isFacebookBrowser };
  };

  const checkSecureContext = () => {
    return window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  };

  const checkGeolocationPermission = async (): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> => {
    if (!navigator.permissions) return 'unknown';
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permission.state;
    } catch (error) {
      return 'unknown';
    }
  };

  const normalizeGeolocationError = (error: GeolocationPositionError): { code: number; name: string; isDenied: boolean } => {
    // Handle both numeric codes and modern DOMException names
    const errorName = (error as any).name || `Code${error.code}`;
    const isDenied = error.code === 1 || 
                    errorName === 'NotAllowedError' || 
                    error.message?.toLowerCase().includes('denied') ||
                    error.message?.toLowerCase().includes('not allowed');
    
    return {
      code: error.code,
      name: errorName,
      isDenied
    };
  };

  const ipGeolocationFallback = async (): Promise<{ lat: number; lng: number; city: string } | null> => {
    try {
      console.log('🌐 Trying IP-based geolocation fallback...');
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        console.log('✅ IP geolocation success:', { lat: data.latitude, lng: data.longitude, city: data.city });
        return {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          city: data.city || data.region || 'Your Location'
        };
      }
    } catch (error) {
      console.log('❌ IP geolocation failed:', error);
    }
    return null;
  };

  const handleLocationDetection = async () => {
    // Clear any forced location for testing and use real GPS
    const { clearForcedLocation } = await import('@/lib/location');
    clearForcedLocation();
    console.log('🧭 Using real GPS location detection');

    // Single-flight guard: prevent duplicate detection attempts
    if (isLoading || inFlightRef.current) {
      console.log('🚫 Location detection already in progress, skipping...');
      return;
    }

    if (!navigator.geolocation) {
      onLocationError("Geolocation is not supported by this browser.");
      onLocationNameUpdate("Your Location");
      if (mountedRef.current) setStatus("error");
      return;
    }

    // Check secure context (HTTPS requirement)
    if (!checkSecureContext()) {
      onLocationError("Location access requires a secure connection (HTTPS). Please access this site via HTTPS.");
      onLocationNameUpdate("Your Location");
      if (mountedRef.current) setStatus("error");
      return;
    }

    const platform = detectPlatform();
    
    // Handle Facebook in-app browser restrictions
    if (platform.isFacebookBrowser) {
      console.log('🔵 Facebook in-app browser detected - using IP fallback');
      onLocationError("For the best experience, open this in your regular browser. Using approximate location based on your internet connection.");
      
      // Try IP fallback immediately for Facebook browser
      const ipLocation = await ipGeolocationFallback();
      if (ipLocation && mountedRef.current) {
        console.log('📍 Facebook browser IP fallback success:', ipLocation);
        onLocationUpdate({ lat: ipLocation.lat, lng: ipLocation.lng });
        onLocationNameUpdate(`${ipLocation.city} (approximate)`);
        setStatus("success");
        setLastUpdateTime(new Date());
        
        // Reset success status after 2 seconds
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current && statusRef.current === "success") {
            setStatus("idle");
          }
        }, 2000);
        
        return;
      } else {
        // If IP fallback fails in Facebook browser, suggest manual entry
        onLocationNameUpdate("Your Location");
        if (onShowManualInput) {
          setTimeout(() => {
            onShowManualInput();
          }, 1000);
        }
        return;
      }
    }

    // Check permissions first
    const permissionState = await checkGeolocationPermission();
    if (permissionState === 'denied') {
      onLocationError("Location access is permanently denied. Please reset location permissions in your browser settings.");
      onLocationNameUpdate("Your Location");
      if (mountedRef.current) setStatus("error");
      return;
    }

    if (mountedRef.current) {
      setInternalLoading(true);
      setStatus("loading");
    }

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Set up new abort controller for this detection
    abortControllerRef.current = new AbortController();
    
    // Mark detection as in-flight (after all early checks)
    inFlightRef.current = true;

    let attemptNumber = 0;
    const maxAttempts = 3;

    // Progressive fallback strategy with platform-specific optimizations
    const tryLocationMethod = (attempt: number): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        // Platform-specific timeout and accuracy settings
        let options: PositionOptions;
        
        if (platform.isWindows || platform.isAndroid) {
          // Windows/Android: More conservative settings
          options = {
            enableHighAccuracy: attempt === 1, // Only high accuracy on first attempt
            timeout: attempt === 1 ? 8000 : 15000, // Shorter timeout for first attempt
            maximumAge: attempt === 1 ? 0 : 60000 // Allow cached location after first attempt
          };
        } else if (platform.isIOS) {
          // iOS: Works well with high accuracy
          options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
          };
        } else {
          // Default for other platforms
          options = {
            enableHighAccuracy: attempt <= 2,
            timeout: attempt === 1 ? 10000 : 15000,
            maximumAge: attempt === 1 ? 0 : 30000
          };
        }

        console.log(`🎯 GPS attempt ${attempt} for ${platform.isWindows ? 'Windows' : platform.isAndroid ? 'Android' : platform.isIOS ? 'iOS' : 'Other'}:`, options);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log(`✅ GPS attempt ${attempt} success:`, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: `${Math.round(position.coords.accuracy)}m`
            });
            resolve(position);
          },
          (error) => {
            console.log(`❌ GPS attempt ${attempt} failed:`, error.message, error.code);
            reject(error);
          },
          options
        );
      });
    };

    // Try multiple location detection methods  
    for (attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
      try {
        const position = await tryLocationMethod(attemptNumber);
        const { latitude, longitude } = position.coords;
        
        // Validate coordinates are reasonable
        if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
          console.warn(`⚠️ Invalid coordinates on attempt ${attemptNumber}, trying next method...`);
          continue;
        }

        console.log(`📍 GPS SUCCESS on attempt ${attemptNumber}:`, { latitude, longitude });
        
        try {
          // Update location
          onLocationUpdate({ lat: latitude, lng: longitude });
          
          // Get location name via reverse geocoding with zip code approach for maximum accuracy
          await getReverseGeocodedLocationName(latitude, longitude, onLocationNameUpdate);

          setStatus("success");
          setLastUpdateTime(new Date());
          
          // Reset success status after 2 seconds
          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current && statusRef.current === "success") {
              setStatus("idle");
            }
          }, 2000);
          
          if (mountedRef.current) setInternalLoading(false);
          
          // Clean up on success
          inFlightRef.current = false;
          abortControllerRef.current = null;
          
          console.debug('✅ GPS location detection completed successfully');
          return; // Success! Exit the retry loop
          
        } catch (error) {
          console.error('Error processing location:', error);
          // Continue to next attempt
        }
        
      } catch (error: any) {
        console.log(`🔄 GPS attempt ${attemptNumber} failed, trying next method...`);
        
        const normalizedError = normalizeGeolocationError(error);
        
        // If this is a permission denied error, offer alternatives
        if (normalizedError.isDenied) {
          if (mountedRef.current) {
            setInternalLoading(false);
            setStatus("error");
          }
          
          // Provide helpful alternatives when location is denied
          const errorMessage = userAddresses.length > 0 
            ? "Location access denied. You can use one of your saved addresses or enter your location manually."
            : "Location access denied. Please enter your location manually below.";
          
          onLocationError(errorMessage);
          
          // Show manual input option after a short delay
          if (onShowManualInput) {
            setTimeout(() => {
              onShowManualInput();
            }, 1500);
          }
          
          // Clear flight guard on permission denied
          inFlightRef.current = false;
          abortControllerRef.current = null;
          return;
        }
        
        // If this is the last attempt, try IP fallback
        if (attemptNumber === maxAttempts) {
          console.log('🌐 All GPS attempts failed, trying IP geolocation fallback...');
          
          // Try IP-based geolocation as last resort
          const ipLocation = await ipGeolocationFallback();
          if (ipLocation && mountedRef.current) {
            console.log('📍 IP fallback SUCCESS:', ipLocation);
            onLocationUpdate({ lat: ipLocation.lat, lng: ipLocation.lng });
            onLocationNameUpdate(`${ipLocation.city} (approximate)`);
            setStatus("success");
            setLastUpdateTime(new Date());
            
            // Reset success status after 2 seconds
            timeoutRef.current = setTimeout(() => {
              if (mountedRef.current && statusRef.current === "success") {
                setStatus("idle");
              }
            }, 2000);
            
            setInternalLoading(false);
            
            // Clear flight guard on IP fallback success
            inFlightRef.current = false;
            abortControllerRef.current = null;
            return;
          }
          
          // Final failure
          if (mountedRef.current) {
            setInternalLoading(false);
            setStatus("error");
          }
          
          let errorMessage = "Unable to get your location. Please try again.";
          
          // Enhanced error messages with helpful alternatives
          switch (normalizedError.code) {
            case 2: // POSITION_UNAVAILABLE
              errorMessage = platform.isWindows || platform.isAndroid 
                ? userAddresses.length > 0
                  ? "Location unavailable. You can use one of your saved addresses instead."
                  : "Location unavailable. Please check your device's location settings or enter your location manually."
                : userAddresses.length > 0
                  ? "Location information is unavailable. You can select from your saved addresses."
                  : "Location information is unavailable. Please enter your city manually.";
              break;
            case 3: // TIMEOUT
              errorMessage = platform.isWindows || platform.isAndroid
                ? "Location request timed out. Try using a saved address or enter your location manually."
                : "Location request timed out. You can enter your location manually below.";
              break;
            default:
              errorMessage = platform.isWindows || platform.isAndroid
                ? userAddresses.length > 0
                  ? "GPS not working. Use a saved address or enter your location manually."
                  : "GPS not working. Please enter your location manually."
                : userAddresses.length > 0
                  ? "Unable to get your location. Select from your saved addresses or enter manually."
                  : "Unable to get your location. Please enter your city manually.";
          }
          
          // Show manual input for location errors  
          if (onShowManualInput) {
            setTimeout(() => {
              onShowManualInput();
            }, 2000);
          }
          
          onLocationError(errorMessage);
          
          // Reset error status after 3 seconds
          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current && statusRef.current === "error") {
              setStatus("idle");
            }
          }, 3000);
          
          // Clear flight guard on final failure
          inFlightRef.current = false;
          abortControllerRef.current = null;
          return;
        }
        
        // Small delay before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // If we get here, all attempts failed
    inFlightRef.current = false;
    if (mountedRef.current) {
      setInternalLoading(false);
    }
    abortControllerRef.current = null;
  };

  const getButtonContent = () => {
    switch (status) {
      case "loading":
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="ml-2">Detecting...</span>
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            <span className="ml-2">Updated!</span>
          </>
        );
      case "error":
        return (
          <>
            <XCircle className="w-4 h-4" />
            <span className="ml-2">Try Again</span>
          </>
        );
      default:
        return (
          <>
            <RefreshCw className="w-4 h-4" />
            <span className="ml-2">Update Location</span>
          </>
        );
    }
  };

  const getButtonClasses = () => {
    const baseClasses = "font-medium transition-all duration-200 flex items-center justify-center";
    
    const sizeClasses = {
      sm: "px-3 py-2 text-sm h-8",
      default: "px-4 py-2 text-sm h-10",
      lg: "px-6 py-3 text-base h-12"
    };

    const statusClasses = {
      idle: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transform hover:scale-105",
      loading: "bg-red-500 text-white shadow-md cursor-not-allowed",
      success: "bg-green-600 text-white shadow-md",
      error: "bg-red-700 hover:bg-red-800 text-white shadow-md"
    };

    if (variant === "minimal") {
      return cn(
        baseClasses,
        sizeClasses[size],
        "bg-transparent border-2 border-red-600 text-red-600 hover:bg-red-50",
        status === "loading" && "border-red-500 text-red-500 bg-red-50 cursor-not-allowed",
        status === "success" && "border-green-600 text-green-600 bg-green-50",
        status === "error" && "border-red-700 text-red-700 bg-red-50",
        className
      );
    }

    return cn(
      baseClasses,
      sizeClasses[size],
      statusClasses[status],
      "rounded-lg border-0 focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
      className
    );
  };

  const handleSavedAddressSelect = async (address: UserAddress) => {
    if (!address.latitude || !address.longitude) {
      // If coordinates aren't saved, try geocoding the address
      try {
        const fullAddress = `${address.address}, ${address.city}, ${address.state} ${address.postalCode}`.trim();
        const response = await fetch(
          `https://api.bigdatacloud.net/data/city?name=${encodeURIComponent(fullAddress)}`
        );
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
          onLocationUpdate({ lat: data.latitude, lng: data.longitude });
          onLocationNameUpdate(`${address.city}, ${address.state}`);
          setStatus("success");
          setLastUpdateTime(new Date());
        } else {
          onLocationError(`Could not locate ${address.label}. Please try updating the address.`);
        }
      } catch (error) {
        onLocationError(`Error locating ${address.label}. Please try again.`);
      }
    } else {
      // Use saved coordinates
      onLocationUpdate({ 
        lat: parseFloat(address.latitude), 
        lng: parseFloat(address.longitude) 
      });
      onLocationNameUpdate(`${address.city}, ${address.state}`);
      setStatus("success");
      setLastUpdateTime(new Date());
    }
  };

  const LocationButton = (
    <Button
      onClick={handleLocationDetection}
      disabled={isLoading}
      className={getButtonClasses()}
      data-testid="button-update-location"
    >
      {getButtonContent()}
    </Button>
  );

  // If user has saved addresses, show dropdown with options
  if (userAddresses.length > 0) {
    return (
      <div className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-2">
              {LocationButton}
              <Button
                variant="outline"
                size={size}
                className="px-2"
                data-testid="button-location-options"
              >
                <MapPinIcon className="w-4 h-4" />
              </Button>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Quick Location Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userAddresses.map((address) => (
              <DropdownMenuItem
                key={address.id}
                onClick={() => handleSavedAddressSelect(address)}
                className="cursor-pointer"
                data-testid={`menu-address-${address.id}`}
              >
                <Home className="w-4 h-4 mr-2" />
                <div className="flex-1">
                  <div className="font-medium">{address.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {address.city}, {address.state}
                  </div>
                </div>
                {address.isDefault && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {onShowManualInput && (
              <DropdownMenuItem
                onClick={onShowManualInput}
                className="cursor-pointer"
                data-testid="menu-enter-manually"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Enter location manually
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {lastUpdateTime && status === "idle" && (
          <div className="absolute -bottom-6 left-0 right-0 text-center">
            <span className="text-xs text-gray-500" data-testid="text-last-update">
              Updated {lastUpdateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Fallback to simple button if no saved addresses
  return (
    <div className="relative">
      {LocationButton}
      
      {lastUpdateTime && status === "idle" && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="text-xs text-gray-500" data-testid="text-last-update">
            Updated {lastUpdateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
}