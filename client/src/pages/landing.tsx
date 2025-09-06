import { Button } from "@/components/ui/button";
import { useFacebook } from '@/hooks/useFacebook';

export default function Landing() {
  const { isLoaded } = useFacebook();
  
  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };
  
  return (
    <div className="min-h-screen">
      {/* Hero Section with Background */}
      <div className="relative min-h-screen bg-gradient-to-b from-orange-600 to-red-700 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-20 w-40 h-40 bg-white/15 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative px-6 pt-20 pb-24">
          <div className="max-w-md mx-auto">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between mb-16">
              <div className="text-2xl font-bold">MealScout</div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-sm"></i>
              </div>
            </div>
            
            {/* Hero Content */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-6 leading-tight" data-testid="text-app-title">
                Find deals.<br />Save money.<br />Eat better.
              </h1>
              <p className="text-xl mb-8 opacity-90 leading-relaxed" data-testid="text-app-subtitle">
                Discover exclusive meal deals from local restaurants in your area
              </p>
              
              <Button 
                className="w-full h-16 bg-white text-gray-900 hover:bg-gray-100 font-semibold text-lg rounded-xl shadow-lg transition-all duration-300"
                onClick={handleFacebookLogin}
                data-testid="button-get-started"
              >
                <i className="fab fa-facebook-f mr-3 text-blue-600"></i>
                Get Started with Facebook
              </Button>
              
              <p className="text-sm mt-4 opacity-80">
                Join thousands of food lovers saving money daily
              </p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-1">2.5K+</div>
                <div className="text-sm opacity-80">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">150+</div>
                <div className="text-sm opacity-80">Partner Restaurants</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">$45</div>
                <div className="text-sm opacity-80">Avg Monthly Savings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Deals Preview */}
      <div className="px-6 py-16 bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Today's Featured Deals</h2>
            <p className="text-gray-600">Real deals from restaurants in your area</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Tony's Pizza</h3>
                  <p className="text-gray-500 text-sm">Italian • 0.5 miles away</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">25% OFF</div>
                  <div className="text-xs text-gray-500">Lunch Special</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <i className="fas fa-clock text-sm"></i>
                  <span className="text-sm">11:30 AM - 3:00 PM</span>
                </div>
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                  5 left today
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Burger Junction</h3>
                  <p className="text-gray-500 text-sm">American • 0.3 miles away</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">$5 OFF</div>
                  <div className="text-xs text-gray-500">Any Combo</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <i className="fas fa-clock text-sm"></i>
                  <span className="text-sm">All Day</span>
                </div>
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                  12 left today
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Sushi Express</h3>
                  <p className="text-gray-500 text-sm">Japanese • 0.8 miles away</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">Buy 1 Get 1</div>
                  <div className="text-xs text-gray-500">Sushi Rolls</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <i className="fas fa-clock text-sm"></i>
                  <span className="text-sm">5:00 PM - 9:00 PM</span>
                </div>
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                  8 left today
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-semibold"
              onClick={handleFacebookLogin}
            >
              View All Deals
            </Button>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="px-6 py-16 bg-white">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What People Are Saying</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                  <i className="fas fa-user text-gray-600"></i>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah M.</div>
                  <div className="flex text-yellow-400">
                    <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "Saved over $120 last month on lunch! The deals are actually good and the Facebook check-in makes it feel social."
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                  <i className="fas fa-user text-gray-600"></i>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Mike T.</div>
                  <div className="flex text-yellow-400">
                    <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "Perfect for lunch breaks at work. Great variety of nearby restaurants with real deals."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant CTA */}
      <div className="px-6 py-16 bg-gray-900 text-white">
        <div className="max-w-md mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">Restaurant Partners</h3>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join 150+ restaurants using MealScout to attract nearby customers during peak dining hours
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-400 mb-1">+40%</div>
              <div className="text-sm text-gray-400">Foot Traffic</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400 mb-1">85%</div>
              <div className="text-sm text-gray-400">Deal Completion</div>
            </div>
          </div>
          
          <Button 
            className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg rounded-xl mb-4"
            onClick={handleFacebookLogin}
            data-testid="link-restaurant-signup"
          >
            Partner With Us
          </Button>
          
          <p className="text-gray-400 text-sm">
            30-day free trial • $49/month • No setup fees
          </p>
        </div>
      </div>
    </div>
  );
}