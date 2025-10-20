import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import DealCard from "@/components/deal-card";
import SmartSearch from "@/components/smart-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, MapPin, Clock, X, SlidersHorizontal, Utensils, Pizza, Beef, ChefHat, Crown, Salad, Coffee, Fish, Cake } from "lucide-react";
import { SEOHead } from "@/components/seo-head";

// Category configuration mapping (from category.tsx)
const categoryConfig = {
  pizza: { title: "Pizza", icon: Pizza, keywords: ['pizza', 'italian'] },
  burgers: { title: "Burgers", icon: Beef, keywords: ['american', 'burger', 'sandwich'] },
  asian: { title: "Asian", icon: ChefHat, keywords: ['asian', 'chinese', 'japanese', 'sushi', 'noodle'] },
  mexican: { title: "Mexican", icon: Crown, keywords: ['mexican', 'taco', 'burrito'] },
  healthy: { title: "Healthy", icon: Salad, keywords: ['healthy', 'salad', 'smoothie'] },
  breakfast: { title: "Breakfast", icon: Coffee, keywords: ['breakfast', 'brunch', 'pancake', 'coffee'] },
  seafood: { title: "Seafood", icon: Fish, keywords: ['seafood', 'fish', 'shrimp'] },
  coffee: { title: "Coffee", icon: Coffee, keywords: ['cafe', 'coffee', 'latte'] },
  dessert: { title: "Desserts", icon: Cake, keywords: ['dessert', 'ice cream', 'cake'] }
};

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [sortBy, setSortBy] = useState("relevance");
  
  // Location state management
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Parse URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(decodeURIComponent(query));
    }
  }, [location]);

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setIsLocating(false);
        },
        (error) => {
          console.log("Location error:", error);
          setLocationError("Unable to get your location");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Fetch nearby deals when location is available, otherwise featured deals
  const { data: nearbyDeals, isLoading: nearbyLoading } = useQuery({
    queryKey: userLocation 
      ? ["/api/deals/nearby", userLocation.lat, userLocation.lng]
      : ["/api/deals/featured"],
    queryFn: userLocation 
      ? async () => {
          const response = await fetch(`/api/deals/nearby/${userLocation.lat}/${userLocation.lng}`);
          if (!response.ok) throw new Error('Failed to fetch nearby deals');
          return response.json();
        }
      : undefined,
    enabled: !!userLocation || !isLocating,
  });

  const { data: featuredDeals, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: !userLocation && !isLocating,
  });

  // Search for restaurants when there's a search query
  const { data: searchedRestaurants, isLoading: restaurantsLoading } = useQuery({
    queryKey: ["/api/restaurants/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const params = new URLSearchParams({ q: searchQuery });
      // Don't filter by location when searching by text - show all matching restaurants
      const response = await fetch(`/api/restaurants/search?${params}`);
      if (!response.ok) throw new Error('Failed to search restaurants');
      return response.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const isLoading = nearbyLoading || featuredLoading || restaurantsLoading;

  // Function to map cuisine types and titles to category IDs
  const mapDealToCategory = (deal: any): string[] => {
    const categories: string[] = [];
    const cuisineType = deal.restaurant?.cuisineType?.toLowerCase() || '';
    const title = deal.title?.toLowerCase() || '';
    
    // Check each category for matches
    Object.entries(categoryConfig).forEach(([categoryId, config]) => {
      const keywords = config.keywords;
      const matches = keywords.some(keyword => 
        cuisineType.includes(keyword) || title.includes(keyword)
      );
      if (matches) {
        categories.push(categoryId);
      }
    });
    
    return categories;
  };

  // Generate dynamic categories based on nearby deals
  const generateDynamicCategories = (deals: any[]) => {
    const categoryCounts: Record<string, number> = {};
    
    // Count deals per category
    deals.forEach(deal => {
      const dealCategories = mapDealToCategory(deal);
      dealCategories.forEach(categoryId => {
        categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
      });
    });
    
    // Sort categories by count and take top 5
    const sortedCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([categoryId]) => categoryId);
    
    // Build category buttons
    const dynamicCategories = [{ id: "all", label: "All", icon: Utensils }];
    
    sortedCategories.forEach(categoryId => {
      if (categoryConfig[categoryId as keyof typeof categoryConfig]) {
        const config = categoryConfig[categoryId as keyof typeof categoryConfig];
        dynamicCategories.push({
          id: categoryId,
          label: config.title,
          icon: config.icon
        });
      }
    });
    
    return dynamicCategories;
  };

  // Static fallback categories
  const staticCategories = [
    { id: "all", label: "All", icon: Utensils },
    { id: "pizza", label: "Pizza", icon: Pizza },
    { id: "burgers", label: "Burgers", icon: Beef },
    { id: "asian", label: "Asian", icon: ChefHat },
    { id: "mexican", label: "Mexican", icon: Crown },
    { id: "healthy", label: "Healthy", icon: Salad },
  ];

  // Use dynamic categories when we have nearby deals, otherwise use static
  const allDeals = Array.isArray(nearbyDeals) ? nearbyDeals : Array.isArray(featuredDeals) ? featuredDeals : [];
  const categories = userLocation && nearbyDeals && nearbyDeals.length > 0 
    ? generateDynamicCategories(nearbyDeals)
    : staticCategories;

  // allDeals is already defined above
  const filteredDeals = allDeals.filter((deal: any) => {
    const matchesSearch = !searchQuery || 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || (
      selectedCategory && mapDealToCategory(deal).includes(selectedCategory)
    );
    
    // Apply price range filter
    const dealPrice = parseFloat(deal.minOrderAmount) || 0;
    const matchesPrice = dealPrice >= priceRange[0] && dealPrice <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  }).sort((a: any, b: any) => {
    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        return parseFloat(a.minOrderAmount || '0') - parseFloat(b.minOrderAmount || '0');
      case 'price_high':
        return parseFloat(b.minOrderAmount || '0') - parseFloat(a.minOrderAmount || '0');
      case 'discount':
        return parseFloat(b.discountValue || '0') - parseFloat(a.discountValue || '0');
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  const searchTitle = searchQuery ? `${searchQuery} - Search Results` : 'Search Deals';
  const searchDescription = searchQuery 
    ? `Find the best deals for "${searchQuery}". Browse local restaurants and discover exclusive discounts on your favorite food.`
    : 'Search for food deals near you. Filter by category, price range, and more. Discover the best discounts from local restaurants.';

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative pb-20">
      <SEOHead
        title={`${searchTitle} | MealScout`}
        description={searchDescription}
        keywords={`search food deals, find restaurants, ${searchQuery || 'food search'}, restaurant search, deal finder`}
        canonicalUrl="https://mealscout.replit.app/search"
      />
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Search Deals</h1>
            <p className="text-sm text-muted-foreground">
              {isLocating ? "Finding your location..." : userLocation ? "Popular deals near you" : "Find your perfect meal"}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-filter"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <SmartSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={(query) => {
            setSearchQuery(query);
            // Update URL with search query
            const newUrl = `/search?q=${encodeURIComponent(query)}`;
            setLocation(newUrl);
          }}
          placeholder="Search restaurants, cuisines, deals..."
          className="mb-6"
        />

        {/* Category Filters */}
        <div className="flex space-x-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-visible">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex-shrink-0 rounded-full px-4 py-2"
              data-testid={`button-category-${category.id}`}
            >
              <category.icon className="w-4 h-4 mr-2" />
              {category.label}
            </Button>
          ))}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-4 space-y-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="discount">Best Discount</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>$0</span>
                  <span>$100+</span>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-muted-foreground">
                  {filteredDeals.length} deals found
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSortBy("relevance");
                    setPriceRange([0, 50]);
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </header>

      {/* Results */}
      <div className="px-6 py-6">
        {/* Restaurants Section (when searching) */}
        {searchQuery && searchedRestaurants && searchedRestaurants.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Restaurants</h2>
              <span className="text-sm text-muted-foreground">
                {searchedRestaurants.length} found
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {searchedRestaurants.map((restaurant: any) => (
                <Link 
                  key={restaurant.id} 
                  href={`/restaurant/${restaurant.id}`}
                  data-testid={`card-restaurant-${restaurant.id}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1" data-testid={`text-restaurant-name-${restaurant.id}`}>
                            {restaurant.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {restaurant.cuisineType}
                          </p>
                          {restaurant.address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {restaurant.address}
                            </p>
                          )}
                        </div>
                        {restaurant.isVerified && (
                          <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                            Verified
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Deals Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {searchQuery ? `Deals for "${searchQuery}"` : "Popular Deals"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredDeals.length} deals found
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-md">
                <div className="w-full h-48 bg-muted"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDeals.length > 0 ? (
          <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
            {filteredDeals.map((deal: any) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">
              {searchQuery && searchedRestaurants && searchedRestaurants.length > 0 
                ? "No deals found, but restaurants are listed above"
                : "No deals found"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery && searchedRestaurants && searchedRestaurants.length > 0
                ? "Check out the restaurants above to see when they post new deals"
                : "Try adjusting your search or browse all deals"}
            </p>
            <Button 
              onClick={() => {setSearchQuery(""); setSelectedCategory("all");}} 
              className="mt-4"
              data-testid="button-clear-search"
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}