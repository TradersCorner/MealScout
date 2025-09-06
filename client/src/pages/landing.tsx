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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">MealScout</span>
          </div>
          <button className="w-11 h-11 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Location Header */}
      <div className="bg-white px-4 py-6 border-b border-gray-100">
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
            <button className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200">
              🔥 Deals
            </button>
            <button className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl text-sm font-semibold transition-colors duration-200">
              🍔 Fast Food
            </button>
            <button className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl text-sm font-semibold transition-colors duration-200">
              🍕 Pizza
            </button>
            <button className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl text-sm font-semibold transition-colors duration-200">
              🍟 Burgers
            </button>
            <button className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl text-sm font-semibold transition-colors duration-200">
              🌮 Mexican
            </button>
            <button className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl text-sm font-semibold transition-colors duration-200">
              🍜 Asian
            </button>
          </div>
            </div>
        </div>
      </div>

      {/* Deals Section */}
      <div className="px-4 py-12 bg-gradient-to-b from-transparent to-red-100/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Deals near you</h2>
            <p className="text-gray-600 text-lg">Discover amazing food deals in {locationName}</p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="animate-spin w-16 h-16 border-4 border-gray-200 border-t-red-500 rounded-full mx-auto mb-6"></div>
              <p className="text-gray-600 text-xl font-medium">Finding amazing deals near you...</p>
            </div>
          )}

          {/* Deal Cards */}
          {!isLoading && dealsToShow.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-md mx-auto md:max-w-none">
              {dealsToShow.slice(0, 8).map((deal: any) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}

          {/* No Deals State */}
          {!isLoading && dealsToShow.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl shadow-xl max-w-2xl mx-auto">
              <div className="text-8xl mb-8">🍽️</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">No deals found nearby</h3>
              <p className="text-gray-600 mb-10 text-xl">Be the first to discover great deals in {locationName}!</p>
              <Link href="/restaurant-signup" className="inline-block bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors">
                Add your restaurant
              </Link>
            </div>
          )}

          {/* Get Notifications */}
          {dealsToShow.length > 0 && (
            <div className="bg-white rounded-3xl p-10 mt-16 text-center shadow-xl max-w-2xl mx-auto">
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
          )}
        </div>
      </div>
    </div>
    </div>
  );
}