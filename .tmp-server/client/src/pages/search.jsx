var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import DealCard from "@/components/deal-card";
import SmartSearch from "@/components/smart-search";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, X, SlidersHorizontal, Utensils, Pizza, Sandwich, Soup, UtensilsCrossed, Salad, Coffee, Fish, Cake, Croissant, Beef, ChefHat, Crown, } from "lucide-react";
import { SEOHead } from "@/components/seo-head";
// Category configuration mapping (from category.tsx)
var categoryConfig = {
    pizza: { title: "Pizza", icon: Pizza, keywords: ["pizza", "italian"] },
    burgers: {
        title: "Burgers",
        icon: Sandwich,
        keywords: ["american", "burger", "sandwich"],
    },
    asian: {
        title: "Asian",
        icon: Soup,
        keywords: ["asian", "chinese", "japanese", "sushi", "noodle"],
    },
    mexican: {
        title: "Mexican",
        icon: UtensilsCrossed,
        keywords: ["mexican", "taco", "burrito"],
    },
    healthy: {
        title: "Healthy",
        icon: Salad,
        keywords: ["healthy", "salad", "smoothie"],
    },
    breakfast: {
        title: "Breakfast",
        icon: Croissant,
        keywords: ["breakfast", "brunch", "pancake", "coffee"],
    },
    seafood: {
        title: "Seafood",
        icon: Fish,
        keywords: ["seafood", "fish", "shrimp"],
    },
    coffee: {
        title: "Coffee",
        icon: Coffee,
        keywords: ["cafe", "coffee", "latte"],
    },
    dessert: {
        title: "Desserts",
        icon: Cake,
        keywords: ["dessert", "ice cream", "cake"],
    },
};
export default function SearchPage() {
    var _this = this;
    var _a = useLocation(), location = _a[0], setLocation = _a[1];
    var _b = useState(""), searchQuery = _b[0], setSearchQuery = _b[1];
    var _c = useState("all"), selectedCategory = _c[0], setSelectedCategory = _c[1];
    var _d = useState(false), showFilters = _d[0], setShowFilters = _d[1];
    var _e = useState([0, 50]), priceRange = _e[0], setPriceRange = _e[1];
    var _f = useState("relevance"), sortBy = _f[0], setSortBy = _f[1];
    // Location state management
    var _g = useState(null), userLocation = _g[0], setUserLocation = _g[1];
    var _h = useState(false), isLocating = _h[0], setIsLocating = _h[1];
    var _j = useState(null), locationError = _j[0], setLocationError = _j[1];
    // Parse URL query parameter
    useEffect(function () {
        var urlParams = new URLSearchParams(window.location.search);
        var query = urlParams.get("q");
        if (query) {
            setSearchQuery(decodeURIComponent(query));
        }
    }, [location]);
    // Get user location on component mount
    useEffect(function () {
        if (navigator.geolocation) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(function (position) {
                var location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserLocation(location);
                setIsLocating(false);
            }, function (error) {
                console.log("Location error:", error);
                setLocationError("Unable to get your location");
                setIsLocating(false);
            }, { enableHighAccuracy: true, timeout: 10000 });
        }
    }, []);
    // Fetch nearby deals when location is available, otherwise featured deals
    var _k = useQuery({
        queryKey: userLocation
            ? ["/api/deals/nearby", userLocation.lat, userLocation.lng]
            : ["/api/deals/featured"],
        queryFn: userLocation
            ? function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fetch("/api/deals/nearby/".concat(userLocation.lat, "/").concat(userLocation.lng))];
                        case 1:
                            response = _a.sent();
                            if (!response.ok)
                                throw new Error("Failed to fetch nearby deals");
                            return [2 /*return*/, response.json()];
                    }
                });
            }); }
            : undefined,
        enabled: !!userLocation || !isLocating,
    }), nearbyDeals = _k.data, nearbyLoading = _k.isLoading;
    var _l = useQuery({
        queryKey: ["/api/deals/featured"],
        enabled: !userLocation && !isLocating,
    }), featuredDeals = _l.data, featuredLoading = _l.isLoading;
    // Search for restaurants when there's a search query
    var _m = useQuery({
        queryKey: ["/api/restaurants/search", searchQuery],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var params, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!searchQuery || searchQuery.length < 2)
                            return [2 /*return*/, []];
                        params = new URLSearchParams({ q: searchQuery });
                        return [4 /*yield*/, fetch("/api/restaurants/search?".concat(params))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error("Failed to search restaurants");
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        enabled: searchQuery.length >= 2,
    }), searchedRestaurants = _m.data, restaurantsLoading = _m.isLoading;
    var isLoading = nearbyLoading || featuredLoading || restaurantsLoading;
    // Function to map cuisine types and titles to category IDs
    var mapDealToCategory = function (deal) {
        var _a, _b, _c;
        var categories = [];
        var cuisineType = ((_b = (_a = deal.restaurant) === null || _a === void 0 ? void 0 : _a.cuisineType) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || "";
        var title = ((_c = deal.title) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || "";
        // Check each category for matches
        Object.entries(categoryConfig).forEach(function (_a) {
            var categoryId = _a[0], config = _a[1];
            var keywords = config.keywords;
            var matches = keywords.some(function (keyword) { return cuisineType.includes(keyword) || title.includes(keyword); });
            if (matches) {
                categories.push(categoryId);
            }
        });
        return categories;
    };
    // Generate dynamic categories based on nearby deals
    var generateDynamicCategories = function (deals) {
        var categoryCounts = {};
        // Count deals per category
        deals.forEach(function (deal) {
            var dealCategories = mapDealToCategory(deal);
            dealCategories.forEach(function (categoryId) {
                categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
            });
        });
        // Sort categories by count and take top 5
        var sortedCategories = Object.entries(categoryCounts)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, 5)
            .map(function (_a) {
            var categoryId = _a[0];
            return categoryId;
        });
        // Build category buttons
        var dynamicCategories = [{ id: "all", label: "All", icon: Utensils }];
        sortedCategories.forEach(function (categoryId) {
            if (categoryConfig[categoryId]) {
                var config = categoryConfig[categoryId];
                dynamicCategories.push({
                    id: categoryId,
                    label: config.title,
                    icon: config.icon,
                });
            }
        });
        return dynamicCategories;
    };
    // Static fallback categories
    var staticCategories = [
        { id: "all", label: "All", icon: Utensils },
        { id: "pizza", label: "Pizza", icon: Pizza },
        { id: "burgers", label: "Burgers", icon: Beef },
        { id: "asian", label: "Asian", icon: ChefHat },
        { id: "mexican", label: "Mexican", icon: Crown },
        { id: "healthy", label: "Healthy", icon: Salad },
    ];
    // Use dynamic categories when we have nearby deals, otherwise use static
    var allDeals = Array.isArray(nearbyDeals)
        ? nearbyDeals
        : Array.isArray(featuredDeals)
            ? featuredDeals
            : [];
    var categories = userLocation && nearbyDeals && nearbyDeals.length > 0
        ? generateDynamicCategories(nearbyDeals)
        : staticCategories;
    // allDeals is already defined above
    var filteredDeals = allDeals
        .filter(function (deal) {
        var _a, _b;
        var matchesSearch = !searchQuery ||
            deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            deal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ((_b = (_a = deal.restaurant) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchQuery.toLowerCase()));
        var matchesCategory = selectedCategory === "all" ||
            (selectedCategory &&
                mapDealToCategory(deal).includes(selectedCategory));
        // Apply price range filter
        var dealPrice = parseFloat(deal.minOrderAmount) || 0;
        var matchesPrice = dealPrice >= priceRange[0] && dealPrice <= priceRange[1];
        return matchesSearch && matchesCategory && matchesPrice;
    })
        .sort(function (a, b) {
        // Apply sorting
        switch (sortBy) {
            case "price_low":
                return (parseFloat(a.minOrderAmount || "0") -
                    parseFloat(b.minOrderAmount || "0"));
            case "price_high":
                return (parseFloat(b.minOrderAmount || "0") -
                    parseFloat(a.minOrderAmount || "0"));
            case "discount":
                return (parseFloat(b.discountValue || "0") -
                    parseFloat(a.discountValue || "0"));
            case "newest":
                return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            default:
                return 0;
        }
    });
    var searchTitle = searchQuery
        ? "".concat(searchQuery, " - Search Results")
        : "Search Deals";
    var searchDescription = searchQuery
        ? "Find nearby deals for \"".concat(searchQuery, "\". Browse local restaurants and discover limited-time discounts close to you.")
        : "Search for food deals near you. Filter by category, price range, and more. Discover nearby discounts from local restaurants.";
    return (<div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative pb-20">
      <SEOHead title={"".concat(searchTitle, " | MealScout")} description={searchDescription} keywords={"search food deals, find restaurants, ".concat(searchQuery || "food search", ", restaurant search, deal finder")} canonicalUrl="https://mealscout.us/search"/>
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Search Deals</h1>
            <p className="text-sm text-muted-foreground">
              {isLocating
            ? "Finding your location..."
            : userLocation
                ? "Popular deals near you"
                : filteredDeals.length > 0
                    ? "Showing deals that match your search"
                    : "Set your location to see what's nearby"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={function () { return setShowFilters(!showFilters); }} data-testid="button-filter">
            <SlidersHorizontal className="w-4 h-4"/>
          </Button>
        </div>

        {/* Search Bar */}
        <SmartSearch value={searchQuery} onChange={setSearchQuery} onSearch={function (query) {
            setSearchQuery(query);
            // Update URL with search query
            var newUrl = "/search?q=".concat(encodeURIComponent(query));
            setLocation(newUrl);
        }} placeholder="Search restaurants, cuisines, deals..." className="mb-6"/>

        {/* Category Filters */}
        <div className="flex space-x-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-visible">
          {categories.map(function (category) { return (<Button key={category.id} variant={selectedCategory === category.id ? "default" : "outline"} size="sm" onClick={function () { return setSelectedCategory(category.id); }} className="flex-shrink-0 rounded-full px-4 py-2" data-testid={"button-category-".concat(category.id)}>
              <category.icon className="w-4 h-4 mr-2"/>
              {category.label}
            </Button>); })}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (<Card className="mb-6">
            <CardContent className="p-4 space-y-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Sort by
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                    <SelectItem value="price_low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price_high">
                      Price: High to Low
                    </SelectItem>
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
                <Slider value={priceRange} onValueChange={setPriceRange} max={100} step={5} className="w-full"/>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>$0</span>
                  <span>$100+</span>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-muted-foreground">
                  {filteredDeals.length} deal
                  {filteredDeals.length === 1 ? "" : "s"} found
                </span>
                <Button variant="outline" size="sm" onClick={function () {
                setSortBy("relevance");
                setPriceRange([0, 50]);
                setSelectedCategory("all");
                setSearchQuery("");
            }}>
                  <X className="w-3 h-3 mr-1"/>
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>)}
      </header>

      {/* Results */}
      <div className="px-6 py-6">
        {/* Restaurants Section (when searching) */}
        {searchQuery &&
            searchedRestaurants &&
            searchedRestaurants.length > 0 && (<div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Restaurants
                </h2>
                <span className="text-sm text-muted-foreground">
                  {searchedRestaurants.length} found
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {searchedRestaurants.map(function (restaurant) { return (<Link key={restaurant.id} href={"/restaurant/".concat(restaurant.id)} data-testid={"card-restaurant-".concat(restaurant.id)}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1" data-testid={"text-restaurant-name-".concat(restaurant.id)}>
                              {restaurant.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {restaurant.cuisineType}
                            </p>
                            {restaurant.address && (<p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3"/>
                                {restaurant.address}
                              </p>)}
                          </div>
                          {restaurant.isVerified && (<div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                              Verified
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>); })}
              </div>
            </div>)}

        {/* Deals Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {searchQuery ? "Deals for \"".concat(searchQuery, "\"") : "Popular Deals"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredDeals.length} deals found
          </span>
        </div>

        {isLoading ? (<div className="space-y-4">
            {[1, 2, 3].map(function (i) { return (<div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-md">
                <div className="w-full h-48 bg-muted"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                </div>
              </div>); })}
          </div>) : filteredDeals.length > 0 ? (<div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
            {filteredDeals.map(function (deal) { return (<DealCard key={deal.id} deal={deal}/>); })}
          </div>) : (<div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground"/>
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">
              {searchQuery &&
                searchedRestaurants &&
                searchedRestaurants.length > 0
                ? "No deals found, but restaurants are listed above"
                : "No deals found"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery &&
                searchedRestaurants &&
                searchedRestaurants.length > 0
                ? "Check out the restaurants above to see when they post new deals"
                : "Try adjusting your search or browse all deals"}
            </p>
            <Button onClick={function () {
                setSearchQuery("");
                setSelectedCategory("all");
            }} className="mt-4" data-testid="button-clear-search">
              Clear Search
            </Button>
          </div>)}
      </div>

      <Navigation />
    </div>);
}
