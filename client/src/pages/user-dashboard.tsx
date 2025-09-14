import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  User, Heart, Receipt, TrendingUp, MapPin, 
  Clock, Star, DollarSign, Calendar, Gift,
  Utensils, Navigation as NavigationIcon, ChefHat
} from "lucide-react";
import Navigation from "@/components/navigation";
import type { Deal, Restaurant, DealClaim } from "@shared/schema";

interface UserStats {
  totalDealsUsed: number;
  totalSavings: number;
  favoriteRestaurants: number;
  averageRating: number;
  dealsThisMonth: number;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationName, setLocationName] = useState("Hammond, LA");

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

  // Fetch user stats
  const { data: userStats } = useQuery<UserStats>({
    queryKey: ['/api/users/stats'],
    enabled: !!user,
  });

  // Fetch user's claimed deals
  const { data: claimedDeals = [], isLoading: claimedLoading } = useQuery<(DealClaim & {deal: Deal, restaurant: Restaurant})[]>({
    queryKey: ['/api/users/claimed-deals'],
    enabled: !!user,
  });

  // Fetch user's favorite restaurants  
  const { data: favoriteRestaurants = [], isLoading: favoritesLoading } = useQuery<Restaurant[]>({
    queryKey: ['/api/users/favorites'],
    enabled: !!user,
  });

  // Fetch nearby deals
  const { data: nearbyDeals = [], isLoading: nearbyLoading } = useQuery<(Deal & {restaurant: Restaurant})[]>({
    queryKey: ["/api/deals/nearby", location?.lat, location?.lng],
    enabled: !!location,
  });

  // Fetch recommended deals based on user preferences
  const { data: recommendedDeals = [] } = useQuery<(Deal & {restaurant: Restaurant})[]>({
    queryKey: ['/api/deals/recommended'],
    enabled: !!user,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800';
      case 'lunch': return 'bg-blue-100 text-blue-800';
      case 'dinner': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
        <p className="text-muted-foreground mb-4">Please sign in to view your dashboard.</p>
        <Button asChild data-testid="button-sign-in">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen pb-20">
      {/* Header */}
      <header className="px-6 py-6 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{locationName}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Welcome back</div>
            <div className="font-semibold" data-testid="text-user-welcome">
              {user?.firstName ? `${user.firstName}!` : 'Food Explorer!'}
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
                <Receipt className="h-4 w-4" />
                Deals Used
              </CardDescription>
              <CardTitle className="text-2xl">
                {userStats?.totalDealsUsed || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Saved
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {formatCurrency(userStats?.totalSavings || 0)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Favorites
              </CardDescription>
              <CardTitle className="text-2xl">
                {userStats?.favoriteRestaurants || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                This Month
              </CardDescription>
              <CardTitle className="text-2xl">
                {userStats?.dealsThisMonth || 0}
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
            
            {claimedLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </CardContent>
              </Card>
            ) : claimedDeals.length > 0 ? (
              <div className="space-y-3">
                {claimedDeals.slice(0, 5).map((claim) => (
                  <Card key={claim.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{claim.deal.title}</h4>
                            <Badge className={getDealTypeColor(claim.deal.dealType)}>
                              {claim.deal.dealType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {claim.restaurant.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {claim.claimedAt ? new Date(claim.claimedAt).toLocaleDateString() : 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {claim.deal.discountValue}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild data-testid={`button-view-deal-${claim.deal.id}`}>
                          <Link href={`/deal/${claim.deal.id}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No deals claimed yet</h3>
                  <p className="text-muted-foreground mb-4">Start discovering amazing deals near you!</p>
                  <Button asChild data-testid="button-explore-deals">
                    <Link href="/">Explore Deals</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="nearby" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Deals Near You</h3>
              <Button variant="outline" size="sm" asChild data-testid="button-view-map">
                <Link href="/map">View Map</Link>
              </Button>
            </div>
            
            {nearbyLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </CardContent>
              </Card>
            ) : nearbyDeals.length > 0 ? (
              <div className="space-y-3">
                {nearbyDeals.slice(0, 5).map((deal) => (
                  <Card key={deal.id} className="hover:shadow-md transition-shadow">
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
                              <Clock className="h-3 w-3" />
                              {formatTime(deal.startTime)} - {formatTime(deal.endTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {deal.discountValue}
                            </span>
                            <span className="flex items-center gap-1">
                              <NavigationIcon className="h-3 w-3" />
                              {((deal as any).distance || 0.5).toFixed(1)}mi
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild data-testid={`button-view-nearby-${deal.id}`}>
                          <Link href={`/deal/${deal.id}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No nearby deals</h3>
                  <p className="text-muted-foreground">Check back later for deals in your area.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Favorite Restaurants</h3>
              <Button variant="outline" size="sm" asChild data-testid="button-view-all-favorites">
                <Link href="/favorites">View All</Link>
              </Button>
            </div>
            
            {favoritesLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </CardContent>
              </Card>
            ) : favoriteRestaurants.length > 0 ? (
              <div className="space-y-3">
                {favoriteRestaurants.slice(0, 5).map((restaurant) => (
                  <Card key={restaurant.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                            <Utensils className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{restaurant.name}</h4>
                            <p className="text-sm text-muted-foreground">{restaurant.cuisineType}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-muted-foreground">
                                {(restaurant as any).averageRating?.toFixed(1) || 'New'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild data-testid={`button-view-restaurant-${restaurant.id}`}>
                          <Link href={`/restaurant/${restaurant.id}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                  <p className="text-muted-foreground">Start exploring and save your favorite restaurants!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommended" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recommended For You</h3>
            </div>
            
            {recommendedDeals.length > 0 ? (
              <div className="space-y-3">
                {recommendedDeals.slice(0, 5).map((deal) => (
                  <Card key={deal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{deal.title}</h4>
                            <Badge className={getDealTypeColor(deal.dealType)}>
                              {deal.dealType}
                            </Badge>
                            <Badge variant="secondary">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Recommended
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {deal.restaurant.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(deal.startTime)} - {formatTime(deal.endTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {deal.discountValue}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild data-testid={`button-view-recommended-${deal.id}`}>
                          <Link href={`/deal/${deal.id}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Building recommendations</h3>
                  <p className="text-muted-foreground">Use more deals to get personalized recommendations!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
}