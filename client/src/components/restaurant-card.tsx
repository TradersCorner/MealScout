import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone?: string;
  cuisineType?: string;
  isActive: boolean;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link href={`/restaurant/${restaurant.id}`}>
      <Card className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-restaurant-${restaurant.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1" data-testid={`text-restaurant-name-${restaurant.id}`}>
                {restaurant.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-1" data-testid={`text-restaurant-cuisine-${restaurant.id}`}>
                {restaurant.cuisineType || "Restaurant"}
              </p>
              <p className="text-xs text-muted-foreground" data-testid={`text-restaurant-address-${restaurant.id}`}>
                {restaurant.address}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-utensils text-white"></i>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <i className="fas fa-star text-yellow-400 text-xs"></i>
                <span className="text-xs text-muted-foreground" data-testid={`text-rating-${restaurant.id}`}>4.5</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-clock text-muted-foreground text-xs"></i>
                <span className="text-xs text-muted-foreground" data-testid={`text-delivery-time-${restaurant.id}`}>20-30 min</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              restaurant.isActive 
                ? "bg-accent/20 text-accent" 
                : "bg-muted text-muted-foreground"
            }`} data-testid={`status-${restaurant.id}`}>
              {restaurant.isActive ? "Open" : "Closed"}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
