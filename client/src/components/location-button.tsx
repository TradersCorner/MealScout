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

// Reverse geocoding to get actual location names
async function getReverseGeocodedLocationName(
  latitude: number, 
  longitude: number, 
  onLocationNameUpdate: (name: string) => void
): Promise<void> {
  // First set coordinate-based name as fallback
  const coordinateBasedName = `Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
  onLocationNameUpdate(coordinateBasedName);
  
  try {
    // Try reverse geocoding with OpenStreetMap Nominatim
    console.log('🌍 Attempting reverse geocoding for:', { latitude, longitude });
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&extratags=1`,
      {
        headers: {
          'User-Agent': 'MealScout/1.0'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        
        // Build location name prioritizing actual cities/towns over administrative divisions
        let locationName = '';
        
        // Try multiple city-level fields first
        if (address.city) {
          locationName = address.city;
        } else if (address.town) {
          locationName = address.town;
        } else if (address.village) {
          locationName = address.village;
        } else if (address.suburb) {
          locationName = address.suburb;
        } else if (address.neighbourhood) {
          locationName = address.neighbourhood;
        } else if (address.hamlet) {
          locationName = address.hamlet;
        }
        
        // If no city-level name found, try extracting from display_name
        if (!locationName && data.display_name) {
          const parts = data.display_name.split(',').map((p: string) => p.trim());
          // Look for a recognizable city/town in the display name
          // Skip house numbers, roads, and administrative divisions
          for (const part of parts) {
            if (part && 
                !part.match(/^\d/) && // Skip house numbers
                !part.includes('Lane') && 
                !part.includes('Road') && 
                !part.includes('Street') && 
                !part.includes('Parish') && 
                !part.includes('County') && 
                !part.includes('Louisiana') && 
                !part.includes('United States') &&
                !part.includes('US-LA') &&
                part.length > 2) {
              locationName = part;
              break;
            }
          }
        }
        
        // If still no city found, try ZIP code lookup for nearest city
        if (!locationName && address.postcode) {
          try {
            console.log(`🏘️ No city found, trying ZIP code lookup for ${address.postcode}`);
            const zipResponse = await fetch(`https://api.zippopotam.us/us/${address.postcode}`);
            if (zipResponse.ok) {
              const zipData = await zipResponse.json();
              if (zipData.places && zipData.places.length > 0) {
                locationName = zipData.places[0]['place name'];
                console.log(`✅ Found city from ZIP code: ${locationName}`);
              }
            }
          } catch (zipError) {
            console.warn('ZIP code lookup failed:', zipError);
          }
        }
        
        // Last resort: try administrative areas but exclude "Parish"
        if (!locationName) {
          if (address.county && !address.county.includes('Parish')) {
            locationName = address.county;
          }
        }
        
        // Add state if we have a city/town and it's not already included
        if (locationName && address.state && !locationName.includes(address.state)) {
          locationName += `, ${address.state}`;
        }
        
        if (locationName) {
          console.log('✅ Reverse geocoding successful:', locationName);
          onLocationNameUpdate(locationName);
          return;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Reverse geocoding failed:', error);
  }
  
  // Fallback: keep the coordinate-based name
  console.log('📍 Using coordinate-based fallback:', coordinateBasedName);
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

  const isLoading = internalLoading;

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
          
          // Get location name via simple coordinate display
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
          onLocationNameUpdate("Your Location");
          
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
          
          // Provide helpful error message
          const finalErrorMessage = userAddresses.length > 0 
            ? "Unable to detect your location. You can use one of your saved addresses or enter your location manually."
            : "Unable to detect your location. Please enter your location manually below.";
          
          onLocationError(finalErrorMessage);
          onLocationNameUpdate("Your Location");
          
          // Show manual input option after a short delay
          if (onShowManualInput) {
            setTimeout(() => {
              onShowManualInput();
            }, 1500);
          }
          
          // Clear flight guard on final failure
          inFlightRef.current = false;
          abortControllerRef.current = null;
          return;
        }
      }
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    handleLocationDetection();
  };

  const buttonSize = size === "sm" ? "h-8 px-3 text-xs" : size === "lg" ? "h-12 px-6 text-base" : "h-10 px-4 text-sm";
  const iconSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;

  if (variant === "minimal") {
    return (
      <Button
        data-testid="button-location-minimal"
        variant="ghost"
        size="sm"
        onClick={handleLocationDetection}
        disabled={isLoading}
        className={cn("p-2", className)}
      >
        {isLoading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : status === "success" ? (
          <CheckCircle size={iconSize} className="text-green-600" />
        ) : status === "error" ? (
          <XCircle size={iconSize} className="text-red-600" />
        ) : (
          <MapPin size={iconSize} />
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {userAddresses.length > 0 ? (
        <DropdownMenu open={showLocationOptions} onOpenChange={setShowLocationOptions}>
          <DropdownMenuTrigger asChild>
            <Button
              data-testid="button-location-options"
              variant="outline"
              disabled={isLoading}
              className={cn(buttonSize, className)}
            >
              {isLoading ? (
                <>
                  <Loader2 size={iconSize} className="animate-spin mr-2" />
                  Detecting...
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle size={iconSize} className="text-green-600 mr-2" />
                  Location Found
                </>
              ) : status === "error" ? (
                <>
                  <XCircle size={iconSize} className="text-red-600 mr-2" />
                  Location Error
                </>
              ) : (
                <>
                  <MapPin size={iconSize} className="mr-2" />
                  Use Location
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Choose Location</DropdownMenuLabel>
            <DropdownMenuItem
              data-testid="menu-location-gps"
              onClick={handleLocationDetection}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <MapPinIcon className="mr-2 h-4 w-4" />
              {isLoading ? "Detecting..." : "Use Current Location"}
            </DropdownMenuItem>
            
            {userAddresses.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Saved Addresses</DropdownMenuLabel>
                {userAddresses.map((address) => (
                  <DropdownMenuItem
                    key={address.id}
                    data-testid={`menu-address-${address.id}`}
                    onClick={() => {
                      if (address.latitude && address.longitude) {
                        onLocationUpdate({ 
                          lat: parseFloat(address.latitude), 
                          lng: parseFloat(address.longitude) 
                        });
                        onLocationNameUpdate(address.label || address.address);
                        setStatus("success");
                        setLastUpdateTime(new Date());
                        setShowLocationOptions(false);
                        
                        // Reset success status after 2 seconds
                        timeoutRef.current = setTimeout(() => {
                          if (mountedRef.current && statusRef.current === "success") {
                            setStatus("idle");
                          }
                        }, 2000);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{address.label}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {address.address}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          data-testid="button-location-detect"
          variant="outline"
          onClick={status === "error" ? handleRetry : handleLocationDetection}
          disabled={isLoading}
          className={cn(buttonSize, className)}
        >
          {isLoading ? (
            <>
              <Loader2 size={iconSize} className="animate-spin mr-2" />
              Detecting...
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle size={iconSize} className="text-green-600 mr-2" />
              Location Found
            </>
          ) : status === "error" ? (
            <>
              <RefreshCw size={iconSize} className="mr-2" />
              Retry Location
            </>
          ) : (
            <>
              <MapPin size={iconSize} className="mr-2" />
              Use My Location
            </>
          )}
        </Button>
      )}

      {lastUpdateTime && status === "success" && (
        <span className="text-xs text-muted-foreground">
          Updated {lastUpdateTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}