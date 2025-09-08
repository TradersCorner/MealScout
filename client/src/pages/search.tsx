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
import { Search, Filter, MapPin, Clock, X, SlidersHorizontal } from "lucide-react";

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [sortBy, setSortBy] = useState("relevance");

  // Parse URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(decodeURIComponent(query));
    }
  }, [location]);

  // Use featured deals for now - we'll enhance search later
  const { data: featuredDeals, isLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
  });

  const categories = [
    { id: "all", label: "All", icon: "🍽️" },
    { id: "pizza", label: "Pizza", icon: "🍕" },
    { id: "burger", label: "Burgers", icon: "🍔" },
    { id: "asian", label: "Asian", icon: "🥢" },
    { id: "mexican", label: "Mexican", icon: "🌮" },
    { id: "healthy", label: "Healthy", icon: "🥗" },
  ];

  const allDeals = Array.isArray(featuredDeals) ? featuredDeals : [];
  const filteredDeals = allDeals.filter((deal: any) => {
    const matchesSearch = !searchQuery || 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      deal.restaurant?.cuisineType?.toLowerCase().includes(selectedCategory);
    
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

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Search Deals</h1>
            <p className="text-sm text-muted-foreground">Find your perfect meal</p>
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
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex-shrink-0 rounded-full px-4 py-2"
              data-testid={`button-category-${category.id}`}
            >
              <span className="mr-2">{category.icon}</span>
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {searchQuery ? `Results for "${searchQuery}"` : "Popular Deals"}
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
          <div className="space-y-4">
            {filteredDeals.map((deal: any) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">No deals found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or browse all deals
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