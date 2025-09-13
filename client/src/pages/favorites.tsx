import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import DealCard from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Search, MapPin, Star } from "lucide-react";
import { BackHeader } from "@/components/back-header";
import { useAuth } from "@/hooks/useAuth";

export default function FavoritesPage() {
  const { user } = useAuth();

  // Fetch user's restaurant favorites
  const { data: restaurantFavorites = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ["/api/favorites/restaurants"],
    enabled: !!user,
  });

  // Also fetch featured deals for the legacy favorites display
  const { data: featuredDeals, isLoading: loadingDeals } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
  });

  const allDeals = Array.isArray(featuredDeals) ? featuredDeals : [];
  const favoriteDeals = allDeals.slice(0, 2); // Show first 2 as favorites for demo (legacy)

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative pb-20">
      <BackHeader
        title="Favorites"
        fallbackHref="/"
        icon={Heart}
        className="bg-white border-b border-border"
        subtitle="Your saved deals and restaurants"
      />

      {/* Content */}
      <div className="px-6 py-6">
        {/* Restaurant Favorites Section */}
        {loadingFavorites ? (
          <div className="space-y-4 mb-8">
            <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : restaurantFavorites.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Favorite Restaurants ({restaurantFavorites.length})
            </h2>
            <div className="space-y-3">
              {restaurantFavorites.map((favorite: any) => (
                <Card key={favorite.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                          <Heart className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{favorite.restaurant.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {favorite.restaurant.address}
                            </span>
                            {favorite.restaurant.cuisineType && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {favorite.restaurant.cuisineType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link href={`/restaurant/${favorite.restaurant.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-view-restaurant-${favorite.restaurant.id}`}>
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : user ? (
          <div className="text-center py-8 mb-8">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">No favorite restaurants yet</h3>
            <p className="text-muted-foreground mb-4">
              Start saving restaurants by tapping the heart icon on restaurant pages
            </p>
            <Link href="/search">
              <Button data-testid="button-browse-restaurants">
                <Search className="w-4 h-4 mr-2" />
                Browse Restaurants
              </Button>
            </Link>
          </div>
        ) : null}

        {/* Legacy Deals Section (for backward compatibility) */}
        {loadingDeals ? (
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-md">
                <div className="w-full h-48 bg-muted"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : favoriteDeals.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Featured Deals ({favoriteDeals.length})
            </h2>
            <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
              {favoriteDeals.map((deal: any) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Empty state when no favorites at all */}
        {!loadingFavorites && !loadingDeals && !user && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">Sign in to see favorites</h3>
            <p className="text-muted-foreground mb-6">
              Create an account to save your favorite restaurants and deals
            </p>
            <Link href="/login">
              <Button data-testid="button-sign-in">
                Sign In
              </Button>
            </Link>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-100">
          <h3 className="font-bold text-foreground mb-3 flex items-center">
            <Heart className="w-5 h-5 text-red-500 mr-2" />
            Pro Tip
          </h3>
          <p className="text-sm text-muted-foreground">
            Save deals to get notified when they're about to expire or when similar deals become available!
          </p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}