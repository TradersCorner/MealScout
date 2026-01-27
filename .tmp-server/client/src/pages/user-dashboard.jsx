import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { User, Heart, Receipt, TrendingUp, MapPin, Clock, Star, DollarSign, Calendar, Gift, Utensils, Navigation as NavigationIcon, ChefHat, } from "lucide-react";
import Navigation from "@/components/navigation";
import { SEOHead } from "@/components/seo-head";
export default function UserDashboard() {
    var user = useAuth().user;
    var _a = useState(null), location = _a[0], setLocation = _a[1];
    var _b = useState("Getting location..."), locationName = _b[0], setLocationName = _b[1];
    // Get user location
    useEffect(function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var _a = position.coords, latitude = _a.latitude, longitude = _a.longitude;
                setLocation({ lat: latitude, lng: longitude });
                // Better reverse geocoding that prioritizes real city names
                fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat=".concat(latitude, "&lon=").concat(longitude, "&zoom=10&addressdetails=1"))
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                    if (data.address) {
                        // Prioritize actual cities over administrative divisions
                        var locationName_1 = data.address.city ||
                            data.address.town ||
                            data.address.village ||
                            data.address.county ||
                            data.address.state ||
                            "Your Location";
                        setLocationName(locationName_1);
                    }
                    else {
                        setLocationName("Your Location");
                    }
                })
                    .catch(function () {
                    setLocationName("Your Location");
                });
            }, function () {
                setLocationName("Location unavailable");
            });
        }
    }, []);
    // Fetch user stats
    var userStats = useQuery({
        queryKey: ["/api/users/stats"],
        enabled: !!user,
    }).data;
    // Fetch user's claimed deals
    var _c = useQuery({
        queryKey: ["/api/users/claimed-deals"],
        enabled: !!user,
    }), _d = _c.data, claimedDeals = _d === void 0 ? [] : _d, claimedLoading = _c.isLoading;
    // Fetch user's favorite restaurants
    var _e = useQuery({
        queryKey: ["/api/users/favorites"],
        enabled: !!user,
    }), _f = _e.data, favoriteRestaurants = _f === void 0 ? [] : _f, favoritesLoading = _e.isLoading;
    // Fetch nearby deals
    var _g = useQuery({
        queryKey: ["/api/deals/nearby", location === null || location === void 0 ? void 0 : location.lat, location === null || location === void 0 ? void 0 : location.lng],
        enabled: !!location,
    }), _h = _g.data, nearbyDeals = _h === void 0 ? [] : _h, nearbyLoading = _g.isLoading;
    // Fetch recommended deals based on user preferences
    var _j = useQuery({
        queryKey: ["/api/deals/recommended"],
        enabled: !!user,
    }).data, recommendedDeals = _j === void 0 ? [] : _j;
    var formatCurrency = function (amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };
    var formatTime = function (time) {
        var _a = time.split(":"), hours = _a[0], minutes = _a[1];
        var hour = parseInt(hours);
        var ampm = hour >= 12 ? "PM" : "AM";
        var displayHour = hour % 12 || 12;
        return "".concat(displayHour, ":").concat(minutes, " ").concat(ampm);
    };
    var getDealTypeColor = function (type) {
        switch (type) {
            case "breakfast":
                return "bg-yellow-100 text-yellow-800";
            case "lunch":
                return "bg-blue-100 text-blue-800";
            case "dinner":
                return "bg-purple-100 text-purple-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    if (!user) {
        return (<div className="max-w-md mx-auto text-center py-12">
        <User className="h-16 w-16 mx-auto text-muted-foreground mb-4"/>
        <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
        <p className="text-muted-foreground mb-4">
          Please sign in to view your dashboard.
        </p>
        <Button asChild data-testid="button-sign-in">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>);
    }
    return (<div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen pb-20">
      <SEOHead title="My Dashboard - MealScout | Track Your Specials & Savings" description="View your personal dashboard with special history, savings tracker, favorite restaurants, and personalized recommendations. Track your food special journey on MealScout." keywords="user dashboard, my specials, savings tracker, special history, favorite restaurants" canonicalUrl="https://mealscout.us/user-dashboard" noIndex={true}/>
      {/* Header */}
      <header className="px-6 py-6 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4"/>
              <span>{locationName}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Welcome back</div>
            <div className="font-semibold" data-testid="text-user-welcome">
              {(user === null || user === void 0 ? void 0 : user.firstName) ? "".concat(user.firstName, "!") : "Food Explorer!"}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Receipt className="h-4 w-4"/>
                Specials Used
              </CardDescription>
              <CardTitle className="text-2xl">
                {(userStats === null || userStats === void 0 ? void 0 : userStats.totalDealsUsed) || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4"/>
                Total Saved
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {formatCurrency((userStats === null || userStats === void 0 ? void 0 : userStats.totalSavings) || 0)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Heart className="h-4 w-4"/>
                Favorites
              </CardDescription>
              <CardTitle className="text-2xl">
                {(userStats === null || userStats === void 0 ? void 0 : userStats.favoriteRestaurants) || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4"/>
                This Month
              </CardDescription>
              <CardTitle className="text-2xl">
                {(userStats === null || userStats === void 0 ? void 0 : userStats.dealsThisMonth) || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="px-6">
        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList className="grid grid-cols-4 lg:grid-cols-4">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="nearby">Nearby</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="recommended">For You</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Button variant="outline" size="sm" asChild data-testid="button-view-all-orders">
                <Link href="/orders">View All</Link>
              </Button>
            </div>

            {claimedLoading ? (<Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
                </CardContent>
              </Card>) : claimedDeals.length > 0 ? (<div className="space-y-3">
                {claimedDeals.slice(0, 5).map(function (claim) { return (<Card key={claim.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">
                              {claim.deal.title}
                            </h4>
                            <Badge className={getDealTypeColor(claim.deal.dealType)}>
                              {claim.deal.dealType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {claim.restaurant.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3"/>
                              {claim.claimedAt
                    ? new Date(claim.claimedAt).toLocaleDateString()
                    : "Unknown"}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3"/>
                              {claim.deal.discountValue}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild data-testid={"button-view-deal-".concat(claim.deal.id)}>
                          <Link href={"/deal/".concat(claim.deal.id)}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>); })}
              </div>) : (<Card>
                <CardContent className="text-center py-12">
                  <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                  <h3 className="text-lg font-semibold mb-2">
                    No specials claimed yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start discovering amazing specials near you!
                  </p>
                  <Button asChild data-testid="button-explore-deals">
                    <Link href="/">Explore Specials</Link>
                  </Button>
                </CardContent>
              </Card>)}
          </TabsContent>

          <TabsContent value="nearby" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Specials Near You</h3>
              <Button variant="outline" size="sm" asChild data-testid="button-view-map">
                <Link href="/map">View Map</Link>
              </Button>
            </div>

            {nearbyLoading ? (<Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
                </CardContent>
              </Card>) : nearbyDeals.length > 0 ? (<div className="space-y-3">
                {nearbyDeals.slice(0, 5).map(function (deal) { return (<Card key={deal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{deal.title}</h4>
                            <Badge className={getDealTypeColor(deal.dealType)}>
                              {deal.dealType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {deal.restaurant.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3"/>
                              {deal.availableDuringBusinessHours
                    ? "During business hours"
                    : deal.startTime && deal.endTime
                        ? "".concat(formatTime(deal.startTime), " - ").concat(formatTime(deal.endTime))
                        : "All day"}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3"/>
                              {deal.discountValue}
                            </span>
                            {deal.distance !== undefined && (<span className="flex items-center gap-1">
                                <NavigationIcon className="h-3 w-3"/>
                                {deal.distance.toFixed(1)}mi
                              </span>)}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild data-testid={"button-view-nearby-".concat(deal.id)}>
                          <Link href={"/deal/".concat(deal.id)}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>); })}
              </div>) : (<Card>
                <CardContent className="text-center py-12">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                  <h3 className="text-lg font-semibold mb-2">
                    No nearby specials
                  </h3>
                  <p className="text-muted-foreground">
                    Check back later for specials in your area.
                  </p>
                </CardContent>
              </Card>)}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Favorite Restaurants</h3>
              <Button variant="outline" size="sm" asChild data-testid="button-view-all-favorites">
                <Link href="/favorites">View All</Link>
              </Button>
            </div>

            {favoritesLoading ? (<Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
                </CardContent>
              </Card>) : favoriteRestaurants.length > 0 ? (<div className="space-y-3">
                {favoriteRestaurants.slice(0, 5).map(function (restaurant) {
                var _a;
                return (<Card key={restaurant.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                            <Utensils className="h-6 w-6 text-primary"/>
                          </div>
                          <div>
                            <h4 className="font-semibold">{restaurant.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {restaurant.cuisineType}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current"/>
                              <span className="text-xs text-muted-foreground">
                                {((_a = restaurant.averageRating) === null || _a === void 0 ? void 0 : _a.toFixed(1)) || "New"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild data-testid={"button-view-restaurant-".concat(restaurant.id)}>
                          <Link href={"/restaurant/".concat(restaurant.id)}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>);
            })}
              </div>) : (<Card>
                <CardContent className="text-center py-12">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                  <h3 className="text-lg font-semibold mb-2">
                    No favorites yet
                  </h3>
                  <p className="text-muted-foreground">
                    Start exploring and save your favorite restaurants!
                  </p>
                </CardContent>
              </Card>)}
          </TabsContent>

          <TabsContent value="recommended" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recommended For You</h3>
            </div>

            {recommendedDeals.length > 0 ? (<div className="space-y-3">
                {recommendedDeals.slice(0, 5).map(function (deal) { return (<Card key={deal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{deal.title}</h4>
                            <Badge className={getDealTypeColor(deal.dealType)}>
                              {deal.dealType}
                            </Badge>
                            <Badge variant="secondary">
                              <TrendingUp className="h-3 w-3 mr-1"/>
                              Recommended
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {deal.restaurant.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3"/>
                              {deal.availableDuringBusinessHours
                    ? "During business hours"
                    : deal.startTime && deal.endTime
                        ? "".concat(formatTime(deal.startTime), " - ").concat(formatTime(deal.endTime))
                        : "All day"}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3"/>
                              {deal.discountValue}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild data-testid={"button-view-recommended-".concat(deal.id)}>
                          <Link href={"/deal/".concat(deal.id)}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>); })}
              </div>) : (<Card>
                <CardContent className="text-center py-12">
                  <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                  <h3 className="text-lg font-semibold mb-2">
                    Building recommendations
                  </h3>
                  <p className="text-muted-foreground">
                    Use more specials to get personalized recommendations!
                  </p>
                </CardContent>
              </Card>)}
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>);
}
