import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import DealCard from "@/components/deal-card";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, User, Search, Flame, Clock, Pizza, DollarSign, Utensils, Fish, Zap, HardHat, Beef, ChefHat, Soup, Star, Sparkles, Timer, ShoppingBag, Target, Trophy, Rocket, Crown, Coffee, Cookie, Wheat, Leaf, Grape, Cherry, Sandwich, Salad, IceCream, Croissant } from "lucide-react";

interface Deal {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  dealType: string;
  discountValue: string;
  minOrderAmount?: string;
  imageUrl?: string;
  isFeatured: boolean;
}

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationName, setLocationName] = useState("Getting location...");

  // Get user location
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
              setLocationName(data.locality || data.city || "Your Location");
            })
            .catch(() => {
              setLocationName("Your Location");
            });
        },
        () => {
          setLocationName("Location unavailable");
        }
      );
    }
  }, []);

  const { data: featuredDeals, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
  });

  const { data: nearbyDeals, isLoading: nearbyLoading } = useQuery({
    queryKey: ["/api/deals/nearby", location?.lat, location?.lng],
    enabled: !!location,
  });

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative overflow-hidden">
      {/* Header with Location */}
      <header className="glass-effect border-b border-border/50 px-6 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 food-gradient-primary rounded-xl flex items-center justify-center shadow-md">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground" data-testid="text-location-label">Your Location</p>
              <p className="text-sm text-muted-foreground" data-testid="text-location-name">{locationName}</p>
            </div>
          </div>
          <button 
            className="p-3 rounded-xl bg-muted/60 hover:bg-muted/80 transition-all duration-200 shadow-md hover:shadow-lg"
            onClick={() => {
              // TODO: Navigate to profile page or show profile menu
              console.log('Profile button clicked');
            }}
            data-testid="button-profile"
          >
            <User className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 py-6 bg-gradient-to-r from-muted/30 to-muted/50">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            type="text" 
            placeholder="Search deals, restaurants..." 
            className="w-full pl-12 pr-4 py-4 text-base border-2 focus:border-primary rounded-xl bg-white/80 backdrop-blur-sm shadow-md focus:shadow-lg transition-all duration-200"
            data-testid="input-search"
          />
        </div>
        
        {/* Filter Chips */}
        <div className="flex space-x-3 mt-4 overflow-x-auto pb-2">
          <Button 
            className="flex-shrink-0 rounded-full px-4 py-2 font-semibold food-gradient-primary border-0 shadow-md button-hover-effect"
            size="sm" 
            data-testid="button-filter-hot"
          >
            <Sparkles className="w-4 h-4 mr-2" /> Hot Deals
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0 rounded-full px-4 py-2 bg-white/80 backdrop-blur-sm border-2 hover:bg-white shadow-md hover:shadow-lg transition-all duration-200"
            data-testid="button-filter-quick"
          >
            <Rocket className="w-4 h-4 mr-2" /> Quick Bites
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0 rounded-full px-4 py-2 bg-white/80 backdrop-blur-sm border-2 hover:bg-white shadow-md hover:shadow-lg transition-all duration-200"
            data-testid="button-filter-italian"
          >
            <Crown className="w-4 h-4 mr-2" /> Italian
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-shrink-0 rounded-full px-4 py-2 bg-white/80 backdrop-blur-sm border-2 hover:bg-white shadow-md hover:shadow-lg transition-all duration-200"
            data-testid="button-filter-budget"
          >
            <Target className="w-4 h-4 mr-2" /> Under $10
          </Button>
        </div>
      </div>

      {/* Featured Deals Section */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-featured-title">
            <span className="w-8 h-8 food-gradient-primary rounded-lg flex items-center justify-center mr-3 shadow-md">
              <Star className="w-4 h-4 text-white" />
            </span>
            Hot Deals Nearby
          </h2>
          <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all">View All</button>
        </div>

        {featuredLoading ? (
          <div className="flex space-x-4 overflow-x-auto pb-4 px-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-72 gradient-card border-0 rounded-2xl overflow-hidden animate-pulse shadow-md">
                <div className="w-full h-36 bg-muted"></div>
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex space-x-4 overflow-x-auto pb-4 px-6">
            {Array.isArray(featuredDeals) && featuredDeals.length > 0 ? (
              featuredDeals.map((deal: Deal) => (
                <div key={deal.id} className="flex-shrink-0 w-72">
                  <DealCard deal={deal} />
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-6 w-full">
                <div className="w-20 h-20 food-gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Utensils className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">No Deals Yet</h3>
                <p className="text-muted-foreground" data-testid="text-no-deals">Check back soon for amazing deals!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Extended Food Categories with Horizontal Scrolling */}
      
      {/* Pizza & Italian */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-pizza-title">
            <span className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Pizza className="w-4 h-4 text-white" />
            </span>
            Pizza & Italian
          </h2>
          <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-pizza">View All</button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('pizza') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('italian') ||
            deal.title?.toLowerCase().includes('pizza') ||
            deal.title?.toLowerCase().includes('pasta')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('pizza') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('italian') ||
              deal.title?.toLowerCase().includes('pizza') ||
              deal.title?.toLowerCase().includes('pasta')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Pizza className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-muted-foreground">No pizza deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Burgers & Sandwiches */}
      <div className="py-6 bg-gradient-to-r from-slate-50 to-stone-50">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-burger-title">
            <span className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Sandwich className="w-4 h-4 text-white" />
            </span>
            Burgers & Sandwiches
          </h2>
          <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-burger">View All</button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('burger') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('deli') ||
            deal.title?.toLowerCase().includes('burger') ||
            deal.title?.toLowerCase().includes('sandwich')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('burger') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('deli') ||
              deal.title?.toLowerCase().includes('burger') ||
              deal.title?.toLowerCase().includes('sandwich')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sandwich className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-muted-foreground">No burger deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Asian Cuisine */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-asian-title">
            <span className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <ChefHat className="w-4 h-4 text-white" />
            </span>
            Asian Cuisine
          </h2>
          <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-asian">View All</button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('asian') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('chinese') ||
            deal.restaurant?.cuisineType?.toLowerCase().includes('japanese') ||
            deal.restaurant?.cuisineType?.toLowerCase().includes('thai') ||
            deal.title?.toLowerCase().includes('noodle') ||
            deal.title?.toLowerCase().includes('rice') ||
            deal.title?.toLowerCase().includes('curry')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('asian') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('chinese') ||
              deal.restaurant?.cuisineType?.toLowerCase().includes('japanese') ||
              deal.restaurant?.cuisineType?.toLowerCase().includes('thai') ||
              deal.title?.toLowerCase().includes('noodle') ||
              deal.title?.toLowerCase().includes('rice') ||
              deal.title?.toLowerCase().includes('curry')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-muted-foreground">No Asian deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Mexican & Latin */}
      <div className="py-6 bg-gradient-to-r from-amber-50 to-yellow-50">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-mexican-title">
            <span className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Soup className="w-4 h-4 text-white" />
            </span>
            Mexican & Latin
          </h2>
          <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-mexican">View All</button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('mexican') || 
            deal.title?.toLowerCase().includes('taco') ||
            deal.title?.toLowerCase().includes('burrito') ||
            deal.title?.toLowerCase().includes('quesadilla')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('mexican') || 
              deal.title?.toLowerCase().includes('taco') ||
              deal.title?.toLowerCase().includes('burrito') ||
              deal.title?.toLowerCase().includes('quesadilla')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Soup className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-muted-foreground">No Mexican deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Breakfast & Brunch */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-breakfast-title">
            <span className="w-8 h-8 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Croissant className="w-4 h-4 text-white" />
            </span>
            Breakfast & Brunch
          </h2>
          <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-breakfast">View All</button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('cafe') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('breakfast') ||
            deal.title?.toLowerCase().includes('breakfast') ||
            deal.title?.toLowerCase().includes('brunch') ||
            deal.title?.toLowerCase().includes('coffee') ||
            deal.title?.toLowerCase().includes('morning')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('cafe') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('breakfast') ||
              deal.title?.toLowerCase().includes('breakfast') ||
              deal.title?.toLowerCase().includes('brunch') ||
              deal.title?.toLowerCase().includes('coffee') ||
              deal.title?.toLowerCase().includes('morning')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Croissant className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-muted-foreground">No breakfast deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Healthy & Salads */}
      <div className="py-6 bg-gradient-to-r from-green-50 to-lime-50">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-healthy-title">
            <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-lime-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Salad className="w-4 h-4 text-white" />
            </span>
            Healthy & Salads
          </h2>
          <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-healthy">View All</button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('healthy') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('salad') ||
            deal.title?.toLowerCase().includes('salad') ||
            deal.title?.toLowerCase().includes('smoothie') ||
            deal.title?.toLowerCase().includes('bowl') ||
            deal.title?.toLowerCase().includes('healthy')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('healthy') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('salad') ||
              deal.title?.toLowerCase().includes('salad') ||
              deal.title?.toLowerCase().includes('smoothie') ||
              deal.title?.toLowerCase().includes('bowl') ||
              deal.title?.toLowerCase().includes('healthy')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-lime-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Salad className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-muted-foreground">No healthy deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Seafood */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-seafood-title">
            <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Fish className="w-4 h-4 text-white" />
            </span>
            Fresh Seafood
          </h2>
          <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-seafood">View All</button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('seafood') || 
            deal.title?.toLowerCase().includes('fish') ||
            deal.title?.toLowerCase().includes('seafood') ||
            deal.title?.toLowerCase().includes('shrimp') ||
            deal.title?.toLowerCase().includes('catch')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('seafood') || 
              deal.title?.toLowerCase().includes('fish') ||
              deal.title?.toLowerCase().includes('seafood') ||
              deal.title?.toLowerCase().includes('shrimp') ||
              deal.title?.toLowerCase().includes('catch')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Fish className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-muted-foreground">No seafood deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Coffee & Bakery */}
      <div className="py-6 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-coffee-title">
            <span className="w-8 h-8 bg-gradient-to-r from-amber-700 to-orange-700 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Coffee className="w-4 h-4 text-white" />
            </span>
            Coffee & Bakery
          </h2>
          <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-coffee">View All</button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('coffee') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('bakery') ||
            deal.title?.toLowerCase().includes('coffee') ||
            deal.title?.toLowerCase().includes('pastry') ||
            deal.title?.toLowerCase().includes('beignet') ||
            deal.title?.toLowerCase().includes('croissant')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('coffee') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('bakery') ||
              deal.title?.toLowerCase().includes('coffee') ||
              deal.title?.toLowerCase().includes('pastry') ||
              deal.title?.toLowerCase().includes('beignet') ||
              deal.title?.toLowerCase().includes('croissant')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-8 h-8 text-amber-700" />
              </div>
              <p className="text-muted-foreground">No coffee deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Desserts & Ice Cream */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-6 px-6">
          <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="text-dessert-title">
            <span className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <IceCream className="w-4 h-4 text-white" />
            </span>
            Desserts & Ice Cream
          </h2>
          <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-dessert">View All</button>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide">
          {Array.isArray(featuredDeals) && featuredDeals.filter((deal: any) => 
            deal.restaurant?.cuisineType?.toLowerCase().includes('dessert') || 
            deal.restaurant?.cuisineType?.toLowerCase().includes('ice') ||
            deal.title?.toLowerCase().includes('ice') ||
            deal.title?.toLowerCase().includes('dessert') ||
            deal.title?.toLowerCase().includes('sweet') ||
            deal.title?.toLowerCase().includes('cake')
          ).length > 0 ? (
            featuredDeals.filter((deal: any) => 
              deal.restaurant?.cuisineType?.toLowerCase().includes('dessert') || 
              deal.restaurant?.cuisineType?.toLowerCase().includes('ice') ||
              deal.title?.toLowerCase().includes('ice') ||
              deal.title?.toLowerCase().includes('dessert') ||
              deal.title?.toLowerCase().includes('sweet') ||
              deal.title?.toLowerCase().includes('cake')
            ).map((deal: Deal) => (
              <div key={deal.id} className="flex-shrink-0 w-72">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IceCream className="w-8 h-8 text-pink-600" />
              </div>
              <p className="text-muted-foreground">No dessert deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* For Workers Section */}
      <div className="px-6 py-8 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/10 border-t border-border/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center mb-2" data-testid="text-workers-title">
              <span className="w-8 h-8 food-gradient-accent rounded-lg flex items-center justify-center mr-3 shadow-md">
                <Trophy className="w-4 h-4 text-white" />
              </span>
              Perfect for Workers
            </h2>
            <p className="text-muted-foreground" data-testid="text-workers-subtitle">Quick meals for busy professionals</p>
          </div>
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-lg">
            <div className="w-full h-full food-gradient-accent flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-food hover:shadow-food-hover transition-all duration-300 cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 food-gradient-secondary rounded-xl flex items-center justify-center shadow-md">
                <Timer className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-foreground" data-testid="text-fast-pickup">Fast Pickup</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-fast-pickup-desc">Ready in 10 min or less</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-food hover:shadow-food-hover transition-all duration-300 cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 food-gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-foreground" data-testid="text-hearty-meals">Hearty Meals</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-hearty-meals-desc">Filling portions for workers</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}