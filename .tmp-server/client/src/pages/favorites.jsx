import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import DealCard from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Search, MapPin, Star } from "lucide-react";
import { BackHeader } from "@/components/back-header";
import { useAuth } from "@/hooks/useAuth";
import { SEOHead } from "@/components/seo-head";
export default function FavoritesPage() {
    var _a = useAuth(), user = _a.user, authState = _a.authState, isAuthenticated = _a.isAuthenticated;
    // Fetch user's restaurant favorites
    var _b = useQuery({
        queryKey: ["/api/favorites/restaurants"],
        enabled: isAuthenticated,
    }), _c = _b.data, restaurantFavorites = _c === void 0 ? [] : _c, loadingFavorites = _b.isLoading;
    // Also fetch featured deals for the legacy favorites display
    var _d = useQuery({
        queryKey: ["/api/deals/featured"],
        enabled: true,
    }), featuredDeals = _d.data, loadingDeals = _d.isLoading;
    var allDeals = Array.isArray(featuredDeals) ? featuredDeals : [];
    var favoriteDeals = allDeals.slice(0, 2); // Show first 2 as favorites for demo (legacy)
    if (authState === "loading") {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"/>
      </div>);
    }
    if (!isAuthenticated) {
        return (<div className="max-w-md mx-auto bg-background min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <SEOHead title="My Favorites - MealScout | Saved Deals & Restaurants" description="Sign in to save your favorite restaurants and specials so you can get back to them quickly." keywords="favorites, saved specials, favorite restaurants, saved restaurants, bookmarked specials" canonicalUrl="https://mealscout.us/favorites" noIndex={true}/>
        <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-orange-500"/>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Save specials you care about
        </h1>
        <p className="text-muted-foreground mb-6">
          Sign in to bookmark restaurants and specials and come back to them anytime. No ordering required — just keep track of what looks good.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link href="/login">
            <Button className="w-full" variant="default">
              Sign in to view favorites
            </Button>
          </Link>
          <Link href="/customer-signup">
            <Button className="w-full" variant="outline">
              Create a free account
            </Button>
          </Link>
        </div>
      </div>);
    }
    return (<div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative pb-20">
      <SEOHead title="My Favorites - MealScout | Saved Deals & Restaurants" description="View your saved favorite restaurants and specials. Quick access to the food specials you love most. Never lose track of great dining discounts." keywords="favorites, saved specials, favorite restaurants, saved restaurants, bookmarked specials" canonicalUrl="https://mealscout.us/favorites" noIndex={true}/>
      <BackHeader title="Favorites" fallbackHref="/" icon={Heart} className="bg-white border-b border-border" subtitle="Your saved specials and restaurants"/>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Restaurant Favorites Section */}
        {loadingFavorites ? (<div className="space-y-4 mb-8">
            <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
            {[1, 2, 3].map(function (i) { return (<Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>); })}
          </div>) : restaurantFavorites.length > 0 ? (<div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Favorite Restaurants ({restaurantFavorites.length})
            </h2>
            <div className="space-y-3">
              {restaurantFavorites.map(function (favorite) { return (<Card key={favorite.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                          <Heart className="w-6 h-6 text-orange-500"/>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{favorite.restaurant.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3"/>
                              {favorite.restaurant.address}
                            </span>
                            {favorite.restaurant.cuisineType && (<span className="flex items-center gap-1">
                                <Star className="h-3 w-3"/>
                                {favorite.restaurant.cuisineType}
                              </span>)}
                          </div>
                        </div>
                      </div>
                      <Link href={"/restaurant/".concat(favorite.restaurant.id)}>
                        <Button variant="outline" size="sm" data-testid={"button-view-restaurant-".concat(favorite.restaurant.id)}>
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>); })}
            </div>
          </div>) : user ? (<div className="text-center py-8 mb-8">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-orange-500"/>
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">No favorite restaurants yet</h3>
            <p className="text-muted-foreground mb-4">
              Start saving restaurants by tapping the heart icon on restaurant pages
            </p>
            <Link href="/search">
              <Button data-testid="button-browse-restaurants">
                <Search className="w-4 h-4 mr-2"/>
                Browse Restaurants
              </Button>
            </Link>
          </div>) : null}

        {/* Legacy Deals Section (for backward compatibility) */}
        {loadingDeals ? (<div className="space-y-4">
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
            {[1, 2].map(function (i) { return (<div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-md">
                <div className="w-full h-48 bg-muted"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                </div>
              </div>); })}
          </div>) : favoriteDeals.length > 0 ? (<div>
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Time-Sensitive Deals ({favoriteDeals.length})
            </h2>
            <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
              {favoriteDeals.map(function (deal) { return (<DealCard key={deal.id} deal={deal}/>); })}
            </div>
          </div>) : null}

        {/* Empty state when no favorites at all */}
        {!loadingFavorites && !loadingDeals && !user && (<div className="text-center py-12">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-red-500"/>
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">Sign in to see favorites</h3>
            <p className="text-muted-foreground mb-6">
              Create an account to save your favorite restaurants and specials
            </p>
            <Link href="/login">
              <Button data-testid="button-sign-in">
                Sign In
              </Button>
            </Link>
          </div>)}

        {/* Tips Section */}
        <div className="mt-12 p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-100">
          <h3 className="font-bold text-foreground mb-3 flex items-center">
            <Heart className="w-5 h-5 text-red-500 mr-2"/>
            Pro Tip
          </h3>
          <p className="text-sm text-muted-foreground">
            Save specials to get notified when they're about to expire or when similar specials become available!
          </p>
        </div>
      </div>

      <Navigation />
    </div>);
}
