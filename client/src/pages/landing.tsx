import { Button } from "@/components/ui/button";
import { useFacebook } from '@/hooks/useFacebook';

export default function Landing() {
  const { isLoaded } = useFacebook();
  
  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-white">
        <div className="px-6 pt-16 pb-20">
          <div className="max-w-md mx-auto">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
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
                Join the food<br />community near you
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed" data-testid="text-app-subtitle">
                Connect with fellow food lovers and discover the best deals your neighbors are sharing
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
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-2">
                    <i className="fas fa-leaf text-green-600 text-xl"></i>
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
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-semibold text-base rounded-xl shadow-lg transition-colors duration-200"
                onClick={handleFacebookLogin}
                data-testid="button-get-started"
              >
                <i className="fab fa-facebook-f mr-3"></i>
                Join Our Community
              </Button>
              
              <p className="text-sm text-gray-500 mt-4">
                🤝 Connect with locals • 📍 Share your location • 🔒 Safe community
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">2.5K+</div>
                  <div className="text-xs text-gray-600">Community Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">150+</div>
                  <div className="text-xs text-gray-600">Neighborhood Spots</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">$45</div>
                  <div className="text-xs text-gray-600">Shared Savings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Deals Preview */}
      <div className="px-6 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🔥 What Your Neighbors Are Sharing</h2>
            <p className="text-gray-600">Real deals discovered by your local food community</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-pizza-slice text-red-600"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Tony's Pizza</h3>
                    <p className="text-gray-500 text-sm">Italian • 0.5 miles away</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">25% OFF</div>
                  <div className="text-xs text-gray-500 font-medium">Lunch Special</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <i className="fas fa-clock text-sm"></i>
                  <span className="text-sm">11:30 AM - 3:00 PM</span>
                </div>
                <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                  🔥 5 left
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-hamburger text-yellow-600"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Burger Junction</h3>
                    <p className="text-gray-500 text-sm">American • 0.3 miles away</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">$5 OFF</div>
                  <div className="text-xs text-gray-500 font-medium">Any Combo</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <i className="fas fa-clock text-sm"></i>
                  <span className="text-sm">All Day</span>
                </div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  ✅ 12 available
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-fish text-purple-600"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Sushi Express</h3>
                    <p className="text-gray-500 text-sm">Japanese • 0.8 miles away</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">BOGO</div>
                  <div className="text-xs text-gray-500 font-medium">Sushi Rolls</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <i className="fas fa-clock text-sm"></i>
                  <span className="text-sm">5:00 PM - 9:00 PM</span>
                </div>
                <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                  🍣 8 left
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold"
              onClick={handleFacebookLogin}
            >
              🤝 Join the Community
            </Button>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="px-6 py-16 bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">💬 Community Stories</h2>
            <p className="text-gray-600">Real stories from your local food-loving neighbors</p>
          </div>
          
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600 font-bold text-lg">S</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Sarah M.</div>
                  <div className="flex text-yellow-400">
                    <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "💰 Our community helped me save $120 last month! Love sharing my finds and seeing what others discover."
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
                "🚀 This community introduced me to so many hidden gems in my neighborhood. We're like a local food crew now!"
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}