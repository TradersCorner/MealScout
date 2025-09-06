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
      <div className="relative bg-white border-b border-gray-100 overflow-hidden">
        {/* Clean background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600"></div>
        
        <div className="relative px-6 pt-12 pb-24">
          <div className="max-w-md mx-auto">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div className="text-2xl font-bold text-white">MealScout</div>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white border-opacity-30">
                <i className="fas fa-user text-white"></i>
              </div>
            </div>
            
            {/* Hero Content */}
            <div className="text-center mb-12">
              <div className="mb-8">
                <div className="flex justify-center space-x-4 mb-6">
                  <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white border-opacity-30 animate-bounce" style={{animationDelay: '0s'}}>
                    <span className="text-3xl">🍕</span>
                  </div>
                  <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white border-opacity-30 animate-bounce" style={{animationDelay: '0.2s'}}>
                    <span className="text-3xl">🍔</span>
                  </div>
                  <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white border-opacity-30 animate-bounce" style={{animationDelay: '0.4s'}}>
                    <span className="text-3xl">🍣</span>
                  </div>
                </div>
              </div>
              <h1 className="text-6xl font-black text-white mb-6 leading-tight drop-shadow-2xl" data-testid="text-app-title">
                Great deals.<br />Right now.
              </h1>
              <p className="text-2xl text-white text-opacity-90 mb-8 leading-relaxed drop-shadow-lg" data-testid="text-app-subtitle">
                Real restaurant deals in {locationName}
              </p>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 border border-white border-opacity-20">
                <div className="flex items-center justify-center space-x-6 text-white text-opacity-90">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">📍</span>
                    <span className="font-semibold">Local</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">⚡</span>
                    <span className="font-semibold">Real-time</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💰</span>
                    <span className="font-semibold">Save big</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location-Based Deals */}
      <div className="px-6 py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-16">
            <div className="text-7xl mb-6">🔥</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Hot deals in {locationName}</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {locationError ? locationError : `Real-time deals from restaurants near you right now`}
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
              {dealsToShow.slice(0, 4).map((deal: any, index: number) => (
                <div key={deal.id} className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 hover:shadow-3xl hover:scale-105 transition-all duration-300 group">
                  {/* Food Background Image */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded-full" style={{
                      backgroundImage: deal.restaurant?.cuisineType === 'pizza' ? 
                        'url("data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E🍕%3C/text%3E%3C/svg%3E")' :
                        deal.restaurant?.cuisineType === 'burger' ?
                        'url("data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E🍔%3C/text%3E%3C/svg%3E")' :
                        deal.restaurant?.cuisineType === 'sushi' ?
                        'url("data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E🍣%3C/text%3E%3C/svg%3E")' :
                        'url("data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E🥗%3C/text%3E%3C/svg%3E")',
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center'
                    }}></div>
                  </div>
                  
                  {/* Featured Badge */}
                  {deal.isFeatured && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                      🔥 Hot Deal
                    </div>
                  )}
                  
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 rounded-3xl flex items-center justify-center text-3xl shadow-xl border-4 border-white group-hover:scale-110 transition-transform duration-300">
                          {deal.restaurant?.cuisineType === 'pizza' ? '🍕' : 
                           deal.restaurant?.cuisineType === 'burger' ? '🍔' : 
                           deal.restaurant?.cuisineType === 'healthy' ? '🥗' : 
                           deal.restaurant?.cuisineType === 'sushi' ? '🍣' : '🍽️'}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-300">{deal.restaurant?.name || 'Restaurant'}</h2>
                          <p className="text-gray-700 mb-3 text-lg leading-relaxed">{deal.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center bg-red-50 px-3 py-1 rounded-full">
                              <span className="text-lg mr-1">📍</span>
                              <span className="font-semibold text-red-700">{deal.distance ? `${deal.distance.toFixed(1)} miles` : 'Nearby'}</span>
                            </span>
                            <span className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                              <span className="text-lg mr-1">⏰</span>
                              <span className="font-semibold text-blue-700">{deal.startTime && deal.endTime ? `${deal.startTime} - ${deal.endTime}` : 'Limited time'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-2xl shadow-lg mb-2">
                          <div className="text-3xl font-black">
                            {deal.dealType === 'percentage' ? `${deal.discountValue}%` : 
                             deal.dealType === 'fixed' ? `$${deal.discountValue}` : 
                             deal.dealType === 'bogo' ? 'BOGO' : `${deal.discountValue}%`}
                          </div>
                          <div className="text-xs font-bold opacity-90">OFF</div>
                        </div>
                        <div className="text-sm text-gray-600 font-semibold">{deal.title}</div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3 mb-4">
                      <Link 
                        href={`/deal/${deal.id}`} 
                        className="flex-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 hover:from-orange-600 hover:via-red-600 hover:to-pink-700 text-white py-4 px-6 rounded-2xl font-black text-lg text-center transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                      >
                        🎯 Claim Deal
                      </Link>
                      {deal.restaurant?.phone && (
                        <a 
                          href={`tel:${deal.restaurant.phone}`}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-2xl font-black transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105"
                        >
                          <span className="text-xl">📞</span>
                        </a>
                      )}
                      <a 
                        href={`https://maps.google.com/?q=${deal.restaurant?.latitude},${deal.restaurant?.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-4 px-6 rounded-2xl font-black transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105"
                      >
                        <span className="text-xl">🗺️</span>
                      </a>
                    </div>
                    
                    {/* Social Proof & Urgency */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-3">
                        {deal.totalUsesLimit && deal.currentUses && (
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            ⚡ {deal.totalUsesLimit - deal.currentUses} left
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">👥</span>
                          <span className="font-bold text-gray-700">{deal.currentUses || 0}</span>
                          <span className="text-gray-600">saved today</span>
                        </div>
                      </div>
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
            <div className="relative bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 rounded-3xl p-8 mt-12 text-center overflow-hidden border border-orange-200">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 opacity-5"></div>
              <div className="relative">
                <div className="text-6xl mb-4">🔔</div>
                <h3 className="text-3xl font-black text-gray-900 mb-4">Never miss a deal</h3>
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                  Get notified instantly when restaurants in {locationName} post new deals
                </p>
                <Button 
                  className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 hover:from-orange-600 hover:via-red-600 hover:to-pink-700 text-white px-12 py-6 rounded-3xl font-black text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                  onClick={handleFacebookLogin}
                >
                  <span className="text-2xl mr-3">📱</span>
                  Get Deal Alerts
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Social Proof */}
      <div className="px-6 py-20 bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-16">
            <div className="text-7xl mb-6">💬</div>
            <h2 className="text-4xl font-black text-gray-900 mb-6">What people are saying</h2>
            <p className="text-xl text-gray-700">Real savings from real people in {locationName}</p>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center mr-4 shadow-xl">
                  <span className="text-white font-black text-2xl">S</span>
                </div>
                <div>
                  <div className="font-black text-xl text-gray-900">Sarah M.</div>
                  <div className="flex text-yellow-400 text-xl">
                    <span>⭐⭐⭐⭐⭐</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-800 leading-relaxed text-lg font-medium">
                "💰 Found some incredible deals through local recommendations. Saved over <span className="font-black text-green-600">$120 last month</span> on places I actually wanted to try!"
              </p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mr-4 shadow-xl">
                  <span className="text-white font-black text-2xl">M</span>
                </div>
                <div>
                  <div className="font-black text-xl text-gray-900">Mike T.</div>
                  <div className="flex text-yellow-400 text-xl">
                    <span>⭐⭐⭐⭐⭐</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-800 leading-relaxed text-lg font-medium">
                "🚀 Finally discovered those hidden gems everyone talks about but never shares. The local insights here are <span className="font-black text-orange-600">genuinely valuable</span>."
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="text-center">
                <div className="text-6xl mb-4">💫</div>
                <h3 className="text-2xl font-black mb-4">Join the community</h3>
                <p className="text-lg opacity-90 mb-6">Over 2,500 people in {locationName} are already saving big!</p>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4">
                  <div className="text-4xl font-black">$45</div>
                  <div className="text-sm opacity-90">Average monthly savings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}