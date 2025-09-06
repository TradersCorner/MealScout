import { Button } from "@/components/ui/button";
import { useFacebook } from '@/hooks/useFacebook';

export default function Landing() {
  const { isLoaded } = useFacebook();
  
  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Hero Section with Visual Interest */}
      <div className="px-6 pt-16 pb-12 text-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-10 left-4 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl"></div>
        <div className="absolute top-32 right-8 w-24 h-24 bg-red-200/40 rounded-full blur-xl"></div>
        <div className="absolute bottom-8 left-12 w-20 h-20 bg-yellow-200/30 rounded-full blur-lg"></div>
        
        <div className="max-w-sm mx-auto relative z-10">
          {/* App Icon with Animation */}
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <i className="fas fa-utensils text-white text-3xl"></i>
          </div>
          
          {/* Title with Gradient */}
          <h1 className="text-6xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4 tracking-tight" data-testid="text-app-title">
            MealScout
          </h1>
          
          {/* Engaging Subtitle */}
          <p className="text-2xl text-gray-700 mb-4 font-semibold" data-testid="text-app-subtitle">
            🍽️ Hungry? We've got deals!
          </p>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Find amazing meal deals from restaurants within walking distance and share your finds on Facebook
          </p>
          
          {/* Eye-catching Stats */}
          <div className="flex justify-center space-x-6 mb-10">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">50+</div>
              <div className="text-xs text-gray-500 font-medium">Local Deals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">15%</div>
              <div className="text-xs text-gray-500 font-medium">Avg Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">2min</div>
              <div className="text-xs text-gray-500 font-medium">Walk Time</div>
            </div>
          </div>
          
          {/* Main CTA with Better Design */}
          <Button 
            className="w-full h-16 bg-gradient-to-r from-[#1877f2] to-[#42a5f5] hover:from-[#166fe5] hover:to-[#1e88e5] text-white font-bold text-lg rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-0"
            onClick={handleFacebookLogin}
            data-testid="button-get-started"
          >
            <i className="fab fa-facebook-f mr-3 text-xl"></i>
            Continue with Facebook
          </Button>
          
          <p className="text-sm text-gray-500 mt-4 leading-relaxed">
            🔒 Secure login • Share your deals • Build your foodie reputation
          </p>
        </div>
      </div>

      {/* Engaging Features Section */}
      <div className="px-6 py-16 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-8 left-8 text-6xl">🍕</div>
          <div className="absolute top-24 right-12 text-4xl">🍔</div>
          <div className="absolute bottom-16 left-16 text-5xl">🌮</div>
          <div className="absolute bottom-8 right-8 text-4xl">🍜</div>
        </div>
        
        <div className="max-w-sm mx-auto space-y-8 relative z-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-600 text-lg">Three simple steps to start saving money!</p>
          </div>
          
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100 shadow-lg">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h3 className="font-bold text-xl text-gray-900">🗺️ Find nearby deals</h3>
              </div>
              <p className="text-gray-700 leading-relaxed ml-16">
                Browse delicious deals from restaurants within walking distance. Perfect for lunch breaks!
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-lg">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <h3 className="font-bold text-xl text-gray-900">📍 Check in & claim</h3>
              </div>
              <p className="text-gray-700 leading-relaxed ml-16">
                Check in at the restaurant on Facebook and tag #TradeScout to claim your exclusive deal
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-lg">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <h3 className="font-bold text-xl text-gray-900">🍽️ Enjoy & save</h3>
              </div>
              <p className="text-gray-700 leading-relaxed ml-16">
                Show your claimed deal and enjoy your discounted meal. Share the love with friends!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Owner CTA */}
      <div className="px-6 py-16 bg-gradient-to-r from-orange-500 to-red-600 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-4 right-4 text-6xl opacity-10">👨‍🍳</div>
        <div className="absolute bottom-6 left-6 text-5xl opacity-10">🏪</div>
        
        <div className="max-w-sm mx-auto text-center relative z-10">
          <h3 className="text-2xl font-bold mb-3">Own a restaurant? 🍽️</h3>
          <p className="text-orange-50 text-lg mb-6 leading-relaxed">
            Join 100+ restaurants already promoting their deals to hungry customers nearby!
          </p>
          
          {/* Benefits */}
          <div className="space-y-3 mb-8 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check text-white text-sm"></i>
              </div>
              <span className="text-orange-50">Reach customers within 2-minute walk</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check text-white text-sm"></i>
              </div>
              <span className="text-orange-50">Boost foot traffic during slow hours</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check text-white text-sm"></i>
              </div>
              <span className="text-orange-50">Get social media exposure automatically</span>
            </div>
          </div>
          
          <button 
            className="w-full py-4 bg-white text-orange-600 font-bold text-lg rounded-2xl shadow-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
            onClick={handleFacebookLogin}
            data-testid="link-restaurant-signup"
          >
            Start Promoting Your Deals 🚀
          </button>
          
          <p className="text-orange-100 text-sm mt-4">
            30-day free trial • $49/month after • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}