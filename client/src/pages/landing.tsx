import { Button } from "@/components/ui/button";
import { useFacebook } from '@/hooks/useFacebook';

export default function Landing() {
  const { isLoaded } = useFacebook();
  
  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };
  
  return (
    <div className="min-h-screen bg-white">
      {/* Clean Hero Section */}
      <div className="px-6 pt-20 pb-16 text-center">
        <div className="max-w-sm mx-auto">
          {/* App Icon */}
          <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center shadow-lg">
            <i className="fas fa-utensils text-white text-2xl"></i>
          </div>
          
          {/* Title */}
          <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight" data-testid="text-app-title">
            MealScout
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-12 font-medium" data-testid="text-app-subtitle">
            Discover amazing meal deals within walking distance
          </p>
          
          {/* Main CTA */}
          <Button 
            className="w-full h-14 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold text-lg rounded-xl shadow-lg"
            onClick={handleFacebookLogin}
            data-testid="button-get-started"
          >
            <i className="fab fa-facebook-f mr-3 text-lg"></i>
            Continue with Facebook
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            We use Facebook to verify your identity and enable deal sharing
          </p>
        </div>
      </div>

      {/* Simple Features */}
      <div className="px-6 py-16 bg-gray-50">
        <div className="max-w-sm mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How it works</h2>
            <p className="text-gray-600">Three simple steps to start saving</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-orange-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Find nearby deals</h3>
                <p className="text-gray-600 text-sm">Browse deals from restaurants within walking distance</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-orange-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Check in & claim</h3>
                <p className="text-gray-600 text-sm">Check in at the restaurant on Facebook to claim your deal</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-orange-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Enjoy & save</h3>
                <p className="text-gray-600 text-sm">Show your claimed deal and enjoy your discounted meal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Owner CTA */}
      <div className="px-6 py-12 text-center">
        <div className="max-w-sm mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Own a restaurant?</h3>
          <p className="text-gray-600 text-sm mb-6">
            Promote your deals to hungry customers nearby
          </p>
          <button 
            className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
            onClick={handleFacebookLogin}
            data-testid="link-restaurant-signup"
          >
            Start promoting your deals →
          </button>
        </div>
      </div>
    </div>
  );
}