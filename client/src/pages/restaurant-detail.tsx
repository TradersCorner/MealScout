import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Navigation from "@/components/navigation";
import DealCard from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Phone, Star, Clock, Navigation as DirectionsIcon, Heart } from "lucide-react";

export default function RestaurantDetailPage() {
  const { id: restaurantId } = useParams();

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ["/api/restaurants", restaurantId],
    enabled: !!restaurantId,
  });

  const { data: reviews } = useQuery({
    queryKey: ["/api/reviews/restaurant", restaurantId],
    enabled: !!restaurantId,
  });

  const { data: rating } = useQuery({
    queryKey: ["/api/reviews/restaurant", restaurantId, "rating"],
    enabled: !!restaurantId,
  });

  const { data: featuredDeals } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
  });

  if (restaurantLoading) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <div className="animate-pulse">
          <div className="w-full h-64 bg-muted"></div>
          <div className="p-6 space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-4">Restaurant not found</h2>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
        <Navigation />
      </div>
    );
  }

  // Filter deals for this restaurant
  const allDeals = Array.isArray(featuredDeals) ? featuredDeals : [];
  const restaurantDeals = allDeals.filter((deal: any) => deal.restaurantId === restaurantId);

  const currentRating = rating?.rating || 0;
  const reviewCount = Array.isArray(reviews) ? reviews.length : 0;

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      {/* Header Image */}
      <div className="relative h-64 bg-gradient-to-br from-red-100 to-orange-100 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Link href="/">
            <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm" data-testid="button-back-restaurant">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Save Button */}
        <div className="absolute top-6 right-6 z-10">
          <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm" data-testid="button-save-restaurant">
            <Heart className="w-4 h-4" />
          </Button>
        </div>

        {/* Restaurant Image Placeholder */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white/80">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🍽️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="px-6 py-6">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-restaurant-name">
              {restaurant.name}
            </h1>
            {restaurant.cuisineType && (
              <Badge variant="secondary" data-testid="badge-cuisine-type">
                {restaurant.cuisineType}
              </Badge>
            )}
          </div>
          
          {/* Rating */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold" data-testid="text-rating">
                {currentRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-sm" data-testid="text-review-count">
                ({reviewCount} reviews)
              </span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-green-600">
              <Clock className="w-4 h-4" />
              <span>Open now</span>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start space-x-2 mb-4">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-foreground" data-testid="text-restaurant-address">
                {restaurant.address}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          {restaurant.phone && (
            <div className="flex items-center space-x-2 mb-6">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-foreground" data-testid="text-restaurant-phone">
                {restaurant.phone}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button className="flex-1" data-testid="button-directions">
              <DirectionsIcon className="w-4 h-4 mr-2" />
              Directions
            </Button>
            <Button variant="outline" className="flex-1" data-testid="button-call-restaurant">
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
          </div>
        </div>

        {/* Current Deals */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Current Deals</h2>
          {restaurantDeals.length > 0 ? (
            <div className="space-y-4">
              {restaurantDeals.map((deal: any) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-muted-foreground">No current deals available</p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Reviews</h2>
            <Button variant="outline" size="sm" data-testid="button-write-review">
              Write Review
            </Button>
          </div>
          
          {Array.isArray(reviews) && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">U</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">User</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-3 h-3 ${star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No reviews yet</p>
                <p className="text-sm text-muted-foreground mt-1">Be the first to review this restaurant!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}