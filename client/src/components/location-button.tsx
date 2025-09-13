import { useState, useRef } from "react";
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
  
  // Keep ref in sync with state
  statusRef.current = status;

  const isLoading = externalLoading || internalLoading;

  const handleLocationDetection = async () => {
    if (isLoading) return;

    if (!navigator.geolocation) {
      onLocationError("Geolocation is not supported by this browser.");
      setStatus("error");
      return;
    }

    setInternalLoading(true);
    setStatus("loading");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Update location
          onLocationUpdate({ lat: latitude, lng: longitude });
          
          // Get location name via reverse geocoding
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
          setTimeout(() => {
            if (statusRef.current === "success") {
              setStatus("idle");
            }
          }, 2000);
          
        } catch (error) {
          onLocationError("Failed to update location. Please try again.");
          setStatus("error");
        } finally {
          setInternalLoading(false);
        }
      },
      (error) => {
        setInternalLoading(false);
        setStatus("error");
        
        let errorMessage = "Unable to get your location. Please try again.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please check your connection.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        
        onLocationError(errorMessage);
        
        // Reset error status after 3 seconds
        setTimeout(() => {
          if (statusRef.current === "error") {
            setStatus("idle");
          }
        }, 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000 // 30 seconds cache for better UX
      }
    );
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