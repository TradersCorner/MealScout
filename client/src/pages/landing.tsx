import { Button } from "@/components/ui/button";
import { useFacebook } from '@/hooks/useFacebook';
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";

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
      {/* Hero Section */}
      <div className="relative bg-white">
        <div className="px-6 pt-16 pb-20">
          <div className="max-w-md mx-auto">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-utensils text-white"></i>
                </div>
                <div className="text-2xl font-bold text-gray-900">MealScout</div>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-gray-600"></i>
              </div>
            </div>
            
            {/* Hero Content */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight" data-testid="text-app-title">
                Great deals.<br />Right now.
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed" data-testid="text-app-subtitle">
                Real restaurant deals in {locationName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location-Based Deals */}
      <div className="px-6 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🔥 Deals in {locationName}</h2>
            <p className="text-gray-600">
              {locationError ? locationError : `Real-time deals from restaurants near you`}
            </p>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Finding deals near you...</p>
            </div>
          )}

          {/* Business-Focused Deal Cards */}
          {!isLoading && dealsToShow.length > 0 && (
            <div className="space-y-6">
              {dealsToShow.slice(0, 4).map((deal: any) => (
                <div key={deal.id} className="bg-white rounded-3xl p-6 shadow-xl border border-gray-50 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                        {deal.restaurant?.cuisineType === 'pizza' ? '🍕' : 
                         deal.restaurant?.cuisineType === 'burger' ? '🍔' : 
                         deal.restaurant?.cuisineType === 'healthy' ? '🥗' : 
                         deal.restaurant?.cuisineType === 'sushi' ? '🍣' : '🍽️'}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">{deal.restaurant?.name || 'Restaurant'}</h2>
                        <p className="text-gray-600 mb-2">{deal.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <i className="fas fa-map-marker-alt mr-1 text-red-500"></i>
                            {deal.distance ? `${deal.distance.toFixed(1)} miles` : 'Nearby'}
                          </span>
                          <span className="flex items-center">
                            <i className="fas fa-clock mr-1 text-blue-500"></i>
                            {deal.startTime && deal.endTime ? `${deal.startTime} - ${deal.endTime}` : 'Limited time'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-green-600 mb-1">
                        {deal.dealType === 'percentage' ? `${deal.discountValue}% OFF` : 
                         deal.dealType === 'fixed' ? `$${deal.discountValue} OFF` : 
                         deal.dealType === 'bogo' ? 'BOGO' : `${deal.discountValue}% OFF`}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">{deal.title}</div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-6">
                    <Link 
                      href={`/deal/${deal.id}`} 
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-bold text-center transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      🎯 Claim Deal
                    </Link>
                    {deal.restaurant?.phone && (
                      <a 
                        href={`tel:${deal.restaurant.phone}`}
                        className="bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-2xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                      >
                        <i className="fas fa-phone text-lg"></i>
                      </a>
                    )}
                    <a 
                      href={`https://maps.google.com/?q=${deal.restaurant?.latitude},${deal.restaurant?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-2xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                    >
                      <i className="fas fa-directions text-lg"></i>
                    </a>
                  </div>
                  
                  {/* Social Proof & Urgency */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      {deal.isFeatured && (
                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                          🔥 Popular Choice
                        </div>
                      )}
                      {deal.totalUsesLimit && deal.currentUses && (
                        <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                          ⚡ {deal.totalUsesLimit - deal.currentUses} left
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <span className="font-semibold">{deal.currentUses || 0}</span> people saved today
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Deals State */}
          {!isLoading && dealsToShow.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No deals found nearby</h3>
              <p className="text-gray-600 mb-6">Be the first to discover great deals in {locationName}!</p>
              <p className="text-sm text-gray-500">
                🍽️ Are you a restaurant owner? 
                <Link href="/restaurant-signup" className="text-blue-600 hover:text-blue-700 font-semibold ml-1">
                  Add your deals here
                </Link>
              </p>
            </div>
          )}
          
          {dealsToShow.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 mt-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Never miss a deal</h3>
              <p className="text-gray-600 mb-6">
                Get notified instantly when restaurants in {locationName} post new deals
              </p>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200"
                onClick={handleFacebookLogin}
              >
                <i className="fab fa-facebook-f mr-3"></i>
                Get Deal Alerts
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Social Proof */}
      <div className="px-6 py-16 bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">💬 Local Reviews</h2>
            <p className="text-gray-600">Authentic experiences from verified local diners</p>
          </div>
          
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">S</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Sarah M.</div>
                  <div className="flex text-yellow-400">
                    <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "💰 Found some incredible deals through local recommendations. Saved over $120 last month on places I actually wanted to try."
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">M</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Mike T.</div>
                  <div className="flex text-yellow-400">
                    <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "🚀 Finally discovered those hidden gems everyone talks about but never shares. The local insights here are genuinely valuable."
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}