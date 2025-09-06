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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });

          // Reverse geocoding for display name
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(res => res.json())
            .then(data => {
              setLocationName(data.locality || data.city || "Your Area");
            })
            .catch(() => {
              setLocationName("Your Area");
            });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Location access denied. Showing deals from all areas.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  // Fetch nearby deals based on location
  const { data: nearbyDeals, isLoading: nearbyLoading } = useQuery({
    queryKey: ["/api/deals/nearby", location?.lat, location?.lng],
    enabled: !!location,
  });

  // Fetch featured deals as fallback when no location
  const { data: featuredDeals, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: !location, // Only fetch when we don't have location
  });

  // Use nearby deals if available, otherwise featured deals
  const dealsToShow = (nearbyDeals || featuredDeals || []) as any[];
  const isLoading = nearbyLoading || featuredLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">MealScout</span>
          </div>
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Location Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="max-w-md mx-auto">
          <div className="flex items-center space-x-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="text-lg font-semibold text-gray-900">Delivery to</span>
          </div>
          <p className="text-gray-600 text-sm" data-testid="text-location-name">{locationName}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="max-w-md mx-auto">
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
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="max-w-md mx-auto">
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
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Deals near you</h2>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Finding deals near you...</p>
            </div>
          )}

          {/* Deal Cards */}
          {!isLoading && dealsToShow.length > 0 && (
            <div className="space-y-4">
              {dealsToShow.slice(0, 4).map((deal: any) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}

          {/* No Deals State */}
          {!isLoading && dealsToShow.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="text-4xl mb-4">🍽️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals found nearby</h3>
              <p className="text-gray-600 mb-6">Be the first to discover great deals in {locationName}!</p>
              <Link href="/restaurant-signup" className="text-red-500 hover:text-red-600 font-medium">
                Add your restaurant
              </Link>
            </div>
          )}

          {/* Get Notifications */}
          {dealsToShow.length > 0 && (
            <div className="bg-red-50 rounded-xl p-6 mt-8 text-center border border-red-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Never miss a deal</h3>
              <p className="text-gray-600 mb-4">
                Get notified when new deals are available in {locationName}
              </p>
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium"
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