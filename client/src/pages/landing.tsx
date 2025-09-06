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
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight" data-testid="text-app-title">
                Discover what neighbors<br />are raving about
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed" data-testid="text-app-subtitle">
                Uncover exclusive restaurant deals through authentic recommendations from people in your area
              </p>
              
              {/* Food Category Icons */}
              <div className="flex justify-center space-x-6 mb-10">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-2">
                    <i className="fas fa-pizza-slice text-yellow-600 text-xl"></i>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Pizza</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-2">
                    <i className="fas fa-hamburger text-red-600 text-xl"></i>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Burgers</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-2">
                    <i className="fas fa-leaf text-blue-600 text-xl"></i>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Healthy</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-2">
                    <i className="fas fa-fish text-purple-600 text-xl"></i>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Sushi</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-xl shadow-lg transition-colors duration-200"
                onClick={handleFacebookLogin}
                data-testid="button-get-started"
              >
                <i className="fab fa-facebook-f mr-3"></i>
                Start Discovering
              </Button>
              
              <p className="text-sm text-gray-500 mt-4">
                📍 Location-based • 🔒 Secure login • ✨ Curated by neighbors
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">2.5K+</div>
                  <div className="text-xs text-gray-600">Local Contributors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">150+</div>
                  <div className="text-xs text-gray-600">Partner Restaurants</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">$45</div>
                  <div className="text-xs text-gray-600">Average Monthly Savings</div>
                </div>
              </div>
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

          {/* Dynamic Deals */}
          {!isLoading && dealsToShow.length > 0 && (
            <div className="space-y-4">
              {dealsToShow.slice(0, 3).map((deal: any) => (
                <Link key={deal.id} href={`/deal/${deal.id}`} className="block">
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          {deal.cuisine === 'pizza' ? '🍕' : 
                           deal.cuisine === 'burger' ? '🍔' : 
                           deal.cuisine === 'healthy' ? '🥗' : 
                           deal.cuisine === 'sushi' ? '🍣' : '🍽️'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{deal.restaurant?.name || 'Restaurant'}</h3>
                          <p className="text-gray-500 text-sm">
                            {deal.cuisine || 'Food'} • {deal.distance ? `${deal.distance.toFixed(1)} miles away` : 'Nearby'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {deal.discount_type === 'percentage' ? `${deal.discount_value}% OFF` : 
                           deal.discount_type === 'fixed' ? `$${deal.discount_value} OFF` : 
                           deal.discount_type === 'bogo' ? 'BOGO' : `${deal.discount_value}% OFF`}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">{deal.title || 'Special Deal'}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <i className="fas fa-clock text-sm"></i>
                        <span className="text-sm">
                          {deal.valid_until ? `Until ${new Date(deal.valid_until).toLocaleDateString()}` : 'Limited time'}
                        </span>
                      </div>
                      {deal.is_featured && (
                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          🔥 Popular
                        </div>
                      )}
                      {deal.usage_limit && (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          ✅ {deal.usage_limit - (deal.usage_count || 0)} left
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
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
            <div className="text-center mt-8">
              <p className="text-gray-600 mb-4 text-sm">
                Want updates when new deals appear in {locationName}?
              </p>
              <div className="flex flex-col space-y-3">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
                  onClick={handleFacebookLogin}
                >
                  <i className="fab fa-facebook-f mr-2"></i>
                  Get Deal Notifications
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-semibold"
                  onClick={() => window.location.reload()}
                >
                  🔄 Refresh Deals
                </Button>
              </div>
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