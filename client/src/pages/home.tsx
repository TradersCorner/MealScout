import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import DealCard from "@/components/deal-card";
import Navigation from "@/components/navigation";
import SmartSearch from "@/components/smart-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, User, Search, Flame, Clock, Pizza, DollarSign, Utensils, Fish, Zap, HardHat, Beef, ChefHat, Soup, Star, Sparkles, Timer, ShoppingBag, Target, Trophy, Rocket, Crown, Coffee, Cookie, Wheat, Leaf, Grape, Cherry, Sandwich, Salad, IceCream, Croissant, Plus, Send } from "lucide-react";
import mealScoutLogo from "@assets/image_1757213417158.png";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [, setNavigateTo] = useLocation();
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    location: "",
    cuisineType: "",
    description: ""
  });

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

  const handleRestaurantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send to your backend
    console.log("Restaurant recommendation:", restaurantForm);
    // Reset form
    setRestaurantForm({
      name: "",
      location: "",
      cuisineType: "",
      description: ""
    });
    // Show success message
    alert("Thank you! We'll reach out to this restaurant about joining MealScout.");
  };

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative overflow-hidden">
      {/* Header with Logo and Location */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          {/* MealScout Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src={mealScoutLogo} 
                alt="MealScout Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MealScout</h1>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs" data-testid="text-location-label">Location</p>
              <p className="text-gray-900 font-medium text-sm" data-testid="text-location-name">{locationName}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 py-6 bg-gray-50">
        <SmartSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={(query) => {
            setNavigateTo(`/search?q=${encodeURIComponent(query)}`);
          }}
          className="mb-4"
          placeholder="Search deals, restaurants..."
        />
        
        {/* Filter Chips */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Link href="/deals/featured">
            <Button 
              className="flex-shrink-0 rounded-lg px-4 py-2 font-medium text-white bg-red-500 hover:bg-red-600 border-0 shadow-sm"
              size="sm" 
              data-testid="button-filter-hot"
            >
              <Sparkles className="w-4 h-4 mr-1" /> Hot Deals
            </Button>
          </Link>
          <Link href="/search?filter=quick">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-shrink-0 rounded-lg px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 font-medium"
              data-testid="button-filter-quick"
            >
              <Rocket className="w-4 h-4 mr-1" /> Quick Bites
            </Button>
          </Link>
          <Link href="/category/pizza">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-shrink-0 rounded-lg px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 font-medium"
              data-testid="button-filter-italian"
            >
              <Crown className="w-4 h-4 mr-1" /> Italian
            </Button>
          </Link>
          <Link href="/search?filter=budget">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-shrink-0 rounded-lg px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 font-medium"
              data-testid="button-filter-budget"
            >
              <Target className="w-4 h-4 mr-1" /> Under $10
            </Button>
          </Link>
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
          <Link href="/deals/featured">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all">View All</button>
          </Link>
        </div>

        {featuredLoading ? (
          <div className="flex space-x-4 overflow-x-auto pb-4 px-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-72">
                <div className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse">
                  <div className="relative h-56 bg-gradient-to-r from-gray-200 to-gray-300"></div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32"></div>
                      <div className="h-6 bg-gradient-to-r from-green-100 to-green-200 rounded-full w-12"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-16"></div>
                      <div className="h-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full w-12"></div>
                    </div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-full"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5"></div>
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-2xl p-4">
                      <div className="h-4 bg-gradient-to-r from-red-100 to-red-200 rounded-lg w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex space-x-4 overflow-x-auto pb-4 px-6 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
            {Array.isArray(featuredDeals) && featuredDeals.length > 0 ? (
              featuredDeals.map((deal: Deal) => (
                <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                  <DealCard deal={deal} />
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-6 w-full lg:col-span-full">
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
          <Link href="/category/pizza">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-pizza">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
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
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
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
          <Link href="/category/burgers">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-burger">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
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
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
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
          <Link href="/category/asian">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-asian">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
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
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
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
          <Link href="/category/mexican">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-mexican">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
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
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
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
          <Link href="/category/breakfast">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-breakfast">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
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
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
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
          <Link href="/category/healthy">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-healthy">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
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
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
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
          <Link href="/category/seafood">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-seafood">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
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
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
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
          <Link href="/category/coffee">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-coffee">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
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
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
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
          <Link href="/category/dessert">
            <button className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="button-view-all-dessert">View All</button>
          </Link>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-4 px-6 scrollbar-hide lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:overflow-visible">
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
              <div key={deal.id} className="flex-shrink-0 w-72 lg:w-auto">
                <DealCard deal={deal} />
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-72 lg:w-auto text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IceCream className="w-8 h-8 text-pink-600" />
              </div>
              <p className="text-muted-foreground">No dessert deals available</p>
            </div>
          )}
        </div>
      </div>

      {/* Restaurant Recommendation Section */}
      <div className="px-6 py-8 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/10 border-t border-border/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center mb-2" data-testid="text-recommend-title">
              <span className="w-8 h-8 food-gradient-accent rounded-lg flex items-center justify-center mr-3 shadow-md">
                <Plus className="w-4 h-4 text-white" />
              </span>
              Missing Your Favorite Spot?
            </h2>
            <p className="text-muted-foreground" data-testid="text-recommend-subtitle">Didn't see your favorite spot? Recommend them below.</p>
          </div>
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-lg">
            <div className="w-full h-full food-gradient-accent flex items-center justify-center">
              <Plus className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-food">
          <form onSubmit={handleRestaurantSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Input
                  id="restaurant-name"
                  placeholder="Restaurant name (e.g. Tony's Italian Bistro)"
                  value={restaurantForm.name}
                  onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
                  required
                  data-testid="input-restaurant-name"
                  className="w-full h-12 text-base"
                />
              </div>
              <div>
                <Input
                  id="restaurant-location"
                  placeholder="Location (e.g. Downtown Main Street)"
                  value={restaurantForm.location}
                  onChange={(e) => setRestaurantForm({...restaurantForm, location: e.target.value})}
                  required
                  data-testid="input-restaurant-location"
                  className="w-full h-12 text-base"
                />
              </div>
            </div>
            
            <Input
              id="cuisine-type"
              placeholder="Cuisine type (optional - e.g. Italian, Mexican, Asian)"
              value={restaurantForm.cuisineType}
              onChange={(e) => setRestaurantForm({...restaurantForm, cuisineType: e.target.value})}
              data-testid="input-cuisine-type"
              className="w-full h-12 text-base"
            />
            
            <Button 
              type="submit" 
              className="w-full food-gradient-primary text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              data-testid="button-submit-recommendation"
            >
              <Send className="w-5 h-5 mr-2" />
              Recommend This Spot
            </Button>
          </form>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}