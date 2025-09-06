import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary to-secondary text-white px-6 py-12 text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-app-title">MealScout</h1>
          <p className="text-lg opacity-90" data-testid="text-app-subtitle">Hyper-Local Meal Deals</p>
        </div>
        
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-utensils text-3xl"></i>
          </div>
          <p className="text-sm opacity-90" data-testid="text-hero-description">
            Discover amazing meal deals from restaurants near you
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                  <i className="fas fa-map-marker-alt text-white"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground" data-testid="text-feature-local-title">Hyper-Local</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-feature-local-desc">
                    Find deals within walking distance of your location
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <i className="fas fa-clock text-white"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground" data-testid="text-feature-meals-title">All-Day Dining</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-feature-meals-desc">
                    Great deals for breakfast, lunch, and dinner
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <i className="fas fa-percentage text-white"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground" data-testid="text-feature-deals-title">Great Deals</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-feature-deals-desc">
                    Save money on delicious meals from local restaurants
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-8">
        <Button 
          className="w-full py-3 text-lg font-semibold"
          onClick={() => window.location.href = "/api/login"}
          data-testid="button-get-started"
        >
          Get Started
        </Button>
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground mb-2" data-testid="text-restaurant-owner">
            Restaurant owner?
          </p>
          <button 
            className="text-primary font-medium text-sm"
            onClick={() => window.location.href = "/api/login"}
            data-testid="link-restaurant-signup"
          >
            Sign up to promote your deals →
          </button>
        </div>
      </div>
    </div>
  );
}
