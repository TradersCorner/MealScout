import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocationButtonProps {
  onLocationUpdate: (location: { lat: number; lng: number }) => void;
  onLocationNameUpdate: (name: string) => void;
  onLocationError: (error: string) => void;
  isLoading?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "minimal";
}

export default function LocationButton({
  onLocationUpdate,
  onLocationNameUpdate,
  onLocationError,
  isLoading: externalLoading = false,
  className,
  size = "default",
  variant = "default"
}: LocationButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const statusRef = useRef(status);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  const isLoading = externalLoading || internalLoading;

  const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isWindows = userAgent.includes('windows');
    const isAndroid = userAgent.includes('android');
    const isIOS = userAgent.includes('iphone') || userAgent.includes('ipad');
    const isChrome = userAgent.includes('chrome');
    const isFirefox = userAgent.includes('firefox');
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    return { isWindows, isAndroid, isIOS, isChrome, isFirefox, isMobile };
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
    if (isLoading) return;

    if (!navigator.geolocation) {
      onLocationError("Geolocation is not supported by this browser.");
      if (mountedRef.current) setStatus("error");
      return;
    }

    // Check secure context (HTTPS requirement)
    if (!checkSecureContext()) {
      onLocationError("Location access requires a secure connection (HTTPS). Please access this site via HTTPS.");
      if (mountedRef.current) setStatus("error");
      return;
    }

    // Check permissions first
    const permissionState = await checkGeolocationPermission();
    if (permissionState === 'denied') {
      onLocationError("Location access is permanently denied. Please reset location permissions in your browser settings.");
      if (mountedRef.current) setStatus("error");
      return;
    }

    if (mountedRef.current) {
      setInternalLoading(true);
      setStatus("loading");
    }

    const platform = detectPlatform();
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
          
          // Get location name via reverse geocoding with fallback
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const locationName = data.locality || data.city || "Your Location";
            onLocationNameUpdate(locationName);
          } catch (geocodeError) {
            // Fallback if reverse geocoding fails
            onLocationNameUpdate("Your Location");
          }

          setStatus("success");
          setLastUpdateTime(new Date());
          
          // Reset success status after 2 seconds
          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current && statusRef.current === "success") {
              setStatus("idle");
            }
          }, 2000);
          
          if (mountedRef.current) setInternalLoading(false);
          return; // Success! Exit the retry loop
          
        } catch (error) {
          console.error('Error processing location:', error);
          // Continue to next attempt
        }
        
      } catch (error: any) {
        console.log(`🔄 GPS attempt ${attemptNumber} failed, trying next method...`);
        
        const normalizedError = normalizeGeolocationError(error);
        
        // If this is a permission denied error, don't retry
        if (normalizedError.isDenied) {
          if (mountedRef.current) {
            setInternalLoading(false);
            setStatus("error");
          }
          onLocationError("Location access denied. Please enable location permissions in your browser settings and try again.");
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
            return;
          }
          
          // Final failure
          if (mountedRef.current) {
            setInternalLoading(false);
            setStatus("error");
          }
          
          let errorMessage = "Unable to get your location. Please try again.";
          
          switch (normalizedError.code) {
            case 2: // POSITION_UNAVAILABLE
              errorMessage = platform.isWindows || platform.isAndroid 
                ? "Location unavailable. Please check your device's location settings and ensure GPS is enabled."
                : "Location information is unavailable. Please check your connection.";
              break;
            case 3: // TIMEOUT
              errorMessage = platform.isWindows || platform.isAndroid
                ? "Location request timed out. Please ensure GPS is enabled and try again."
                : "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = platform.isWindows || platform.isAndroid
                ? "GPS not working. Please check your device settings or enter your location manually."
                : "Unable to get your location. Please try again.";
          }
          
          onLocationError(errorMessage);
          
          // Reset error status after 3 seconds
          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current && statusRef.current === "error") {
              setStatus("idle");
            }
          }, 3000);
          return;
        }
        
        // Small delay before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
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

  return (
    <div className="relative">
      <Button
        onClick={handleLocationDetection}
        disabled={isLoading}
        className={getButtonClasses()}
        data-testid="button-update-location"
      >
        {getButtonContent()}
      </Button>
      
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