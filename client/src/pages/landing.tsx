import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      {/* Hero Section */}
      <div className="relative food-gradient-primary text-white px-6 py-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 text-shadow" data-testid="text-app-title">MealScout</h1>
            <p className="text-xl opacity-95 font-medium text-shadow" data-testid="text-app-subtitle">Hyper-Local Meal Deals</p>
          </div>
          
          <div className="mb-10">
            <div className="w-28 h-28 mx-auto bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
              <i className="fas fa-utensils text-4xl text-white drop-shadow-md"></i>
            </div>
            <p className="text-lg opacity-95 leading-relaxed text-shadow" data-testid="text-hero-description">
              Discover amazing meal deals from restaurants near you
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Features */}
      <div className="px-6 py-10 bg-gradient-to-b from-background to-muted/30">
        <div className="space-y-6">
          <Card className="shadow-food hover:shadow-food-hover transition-all duration-300 border-0 gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 food-gradient-accent rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                  <i className="fas fa-map-marker-alt text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1" data-testid="text-feature-local-title">Hyper-Local</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-feature-local-desc">
                    Find deals within walking distance of your location
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-food hover:shadow-food-hover transition-all duration-300 border-0 gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 food-gradient-primary rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                  <i className="fas fa-clock text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1" data-testid="text-feature-meals-title">All-Day Dining</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-feature-meals-desc">
                    Great deals for breakfast, lunch, and dinner
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-food hover:shadow-food-hover transition-all duration-300 border-0 gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 food-gradient-secondary rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                  <i className="fas fa-percentage text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1" data-testid="text-feature-deals-title">Great Deals</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-feature-deals-desc">
                    Save money on delicious meals from local restaurants
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 pb-12 bg-gradient-to-b from-muted/30 to-background">
        <div className="bg-white rounded-3xl p-8 shadow-food border border-border/50">
          <Button 
            className="w-full py-4 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 food-gradient-primary border-0 button-hover-effect"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-get-started"
          >
            Get Started
          </Button>
          
          <div className="text-center mt-8">
            <p className="text-muted-foreground font-medium mb-3" data-testid="text-restaurant-owner">
              Restaurant owner?
            </p>
            <button 
              className="text-primary font-bold text-base hover:text-primary/80 transition-colors duration-200"
              onClick={() => window.location.href = "/api/login"}
              data-testid="link-restaurant-signup"
            >
              Sign up to promote your deals →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}