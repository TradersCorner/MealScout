import { Button } from "@/components/ui/button";
import { useFacebook } from '@/hooks/useFacebook';
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import DealCard from "@/components/deal-card";

export default function Landing() {
  const { isLoaded } = useFacebook();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>("Your Area");
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };

  // Get user location on component mount
  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by this browser.');
        setLocationName("All Areas");
        return;
      }

      // Set timeout for location request
      const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Location acquired:', { latitude, longitude });
          setLocation({ lat: latitude, lng: longitude });
          setLocationError(null);

          // Reverse geocoding for display name
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(res => {
              if (!res.ok) throw new Error('Geocoding failed');
              return res.json();
            })
            .then(data => {
              const displayName = data.locality || data.city || data.principalSubdivision || "Your Area";
              console.log('Location name resolved:', displayName);
              setLocationName(displayName);
            })
            .catch((error) => {
              console.error('Geocoding error:', error);
              setLocationName("Your Area");
            });
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Location access denied. ';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please allow location access to see nearby deals.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
              break;
          }
          
          setLocationError(errorMessage);
          setLocationName("All Areas");
        },
        options
      );
    };

    getLocation();
  }, []);

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
  const dealsToShow = (nearbyDeals || featuredDeals || []) as any[];
  const isLoading = nearbyLoading || featuredLoading;

  return (
    <div className="min-h-screen animated-gradient-bg">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">MealScout</span>
          </div>
          <button className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Location Header */}
      <div className="bg-white/90 backdrop-blur-sm px-4 py-4 border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-md mx-auto lg:max-w-none lg:flex lg:justify-center">
          <button 
            onClick={() => {
              setLocationName("Getting location...");
              setLocationError(null);
              setLocation(null);
              // Re-trigger location fetch
              if (navigator.geolocation) {
                const options = {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0 // Force fresh location
                };

                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('Location refreshed:', { latitude, longitude });
                    setLocation({ lat: latitude, lng: longitude });
                    setLocationError(null);

                    // Reverse geocoding for display name
                    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                      .then(res => {
                        if (!res.ok) throw new Error('Geocoding failed');
                        return res.json();
                      })
                      .then(data => {
                        const displayName = data.locality || data.city || data.principalSubdivision || "Your Area";
                        console.log('Location name refreshed:', displayName);
                        setLocationName(displayName);
                      })
                      .catch((error) => {
                        console.error('Geocoding error:', error);
                        setLocationName("Your Area");
                      });
                  },
                  (error) => {
                    console.error('Geolocation refresh error:', error);
                    setLocationError('Unable to refresh location. Please check permissions.');
                    setLocationName("All Areas");
                  },
                  options
                );
              }
            }}
            className="w-full text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 mb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={locationError ? "text-orange-500" : "text-gray-600"}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="text-lg font-semibold text-gray-900">Deals near</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M1 4v6h6"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            </div>
            <p className="text-gray-600 text-sm" data-testid="text-location-name">{locationName}</p>
          </button>
          {locationError && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-700 text-xs">{locationError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-orange-600 text-xs underline mt-1 hover:text-orange-800"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/90 backdrop-blur-sm px-4 py-4 border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-lg mx-auto">
          <div className="relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search for restaurant or cuisine" 
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="bg-white/90 backdrop-blur-sm px-4 py-3 border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center">
            <div className="max-w-2xl w-full">
          <div className="flex space-x-3 overflow-x-auto">
            <button className="flex-shrink-0 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              Deals
            </button>
            <button className="flex-shrink-0 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
              Fast Food
            </button>
            <button className="flex-shrink-0 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
              Pizza
            </button>
            <button className="flex-shrink-0 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
              Burgers
            </button>
          </div>
        </div>
      </div>

      {/* Deals Section */}
      <div className="px-4 py-8 bg-transparent">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8 drop-shadow-lg">Deals near you</h2>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-6"></div>
              <p className="text-white/80 text-lg">Finding deals near you...</p>
            </div>
          )}

          {/* Deal Cards */}
          {!isLoading && dealsToShow.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-md mx-auto md:max-w-none">
              {dealsToShow.slice(0, 8).map((deal: any) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}

          {/* No Deals State */}
          {!isLoading && dealsToShow.length === 0 && (
            <div className="text-center py-16 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🍽️</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No deals found nearby</h3>
              <p className="text-gray-600 mb-8 text-lg">Be the first to discover great deals in {locationName}!</p>
              <Link href="/restaurant-signup" className="text-red-500 hover:text-red-600 font-medium text-lg">
                Add your restaurant
              </Link>
            </div>
          )}

          {/* Get Notifications */}
          {dealsToShow.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mt-12 text-center border border-white/20 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold text-white mb-4">Never miss a deal</h3>
              <p className="text-white/80 mb-6 text-lg">
                Get notified when new deals are available in {locationName}
              </p>
              <Button 
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-xl font-medium border border-white/30 backdrop-blur-sm text-lg"
                onClick={handleFacebookLogin}
              >
                Get notifications
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}