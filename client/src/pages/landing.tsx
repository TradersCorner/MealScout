import { Button } from "@/components/ui/button";
import { useFacebook } from '@/hooks/useFacebook';

export default function Landing() {
  const { isLoaded } = useFacebook();
  
  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };
  
  return (
    <div className="min-h-screen bg-white">
      {/* Professional Hero Section */}
      <div className="px-8 pt-24 pb-20">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-4xl font-semibold text-gray-900 mb-6 tracking-tight" data-testid="text-app-title">
            MealScout
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed font-normal" data-testid="text-app-subtitle">
            Discover exclusive meal deals from restaurants within walking distance
          </p>
          
          <Button 
            className="w-full h-14 bg-[#1877f2] hover:bg-[#166fe5] text-white font-medium text-base rounded-lg shadow-sm transition-colors duration-200"
            onClick={handleFacebookLogin}
            data-testid="button-get-started"
          >
            <i className="fab fa-facebook-f mr-3"></i>
            Continue with Facebook
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            Secure authentication to enable deal claiming and social sharing
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="px-8 py-20 bg-gray-50">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-16">How it works</h2>
          
          <div className="space-y-12">
            <div className="flex items-start space-x-6">
              <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-medium flex-shrink-0 mt-1">
                1
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Browse local deals</h3>
                <p className="text-gray-600 leading-relaxed">
                  View available meal deals from restaurants near your current location
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-6">
              <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-medium flex-shrink-0 mt-1">
                2
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Check in and claim</h3>
                <p className="text-gray-600 leading-relaxed">
                  Visit the restaurant and check in via Facebook to activate your deal
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-6">
              <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-medium flex-shrink-0 mt-1">
                3
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Enjoy your meal</h3>
                <p className="text-gray-600 leading-relaxed">
                  Present your claimed deal and enjoy discounted dining
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Owner Section */}
      <div className="px-8 py-20 bg-gray-900 text-white">
        <div className="max-w-md mx-auto text-center">
          <h3 className="text-2xl font-semibold mb-4">For restaurant owners</h3>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Attract nearby customers during peak hours with targeted meal promotions
          </p>
          
          <div className="space-y-4 mb-10 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              <span className="text-gray-300">Hyper-local customer targeting</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              <span className="text-gray-300">Social media integration</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              <span className="text-gray-300">Real-time deal management</span>
            </div>
          </div>
          
          <button 
            className="w-full py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
            onClick={handleFacebookLogin}
            data-testid="link-restaurant-signup"
          >
            Learn more
          </button>
          
          <p className="text-gray-400 text-sm mt-4">
            30-day trial • $49/month
          </p>
        </div>
      </div>
    </div>
  );
}