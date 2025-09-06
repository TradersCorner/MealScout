import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
  const formatDiscount = () => {
    if (deal.dealType === "percentage") {
      return `${deal.discountValue}% OFF`;
    } else {
      return `$${deal.discountValue} OFF`;
    }
  };

  const getBadgeColor = () => {
    if (deal.isFeatured) return "bg-primary text-primary-foreground";
    if (deal.dealType === "percentage") return "bg-accent text-accent-foreground";
    return "bg-secondary text-secondary-foreground";
  };

  return (
    <Link href={`/deal/${deal.id}`}>
      <Card className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-deal-${deal.id}`}>
        {/* Deal Image */}
        <div className="relative">
          {deal.imageUrl ? (
            <img 
              src={deal.imageUrl} 
              alt={deal.title} 
              className="w-full h-32 object-cover"
              data-testid={`img-deal-${deal.id}`}
            />
          ) : (
            <div className="w-full h-32 bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
              <i className="fas fa-utensils text-primary text-2xl"></i>
            </div>
          )}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold ${getBadgeColor()}`}>
            {formatDiscount()}
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-foreground" data-testid={`text-restaurant-name-${deal.id}`}>
                Restaurant Name
              </h3>
              <p className="text-xs text-muted-foreground" data-testid={`text-restaurant-info-${deal.id}`}>
                0.2 mi • Fast Food
              </p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-deal-description-${deal.id}`}>
            {deal.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <i className="fas fa-star text-yellow-400 text-xs"></i>
                <span className="text-xs text-muted-foreground" data-testid={`text-rating-${deal.id}`}>4.6</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-clock text-muted-foreground text-xs"></i>
                <span className="text-xs text-muted-foreground" data-testid={`text-time-${deal.id}`}>15-25 min</span>
              </div>
            </div>
            <Button size="sm" className="text-sm font-medium" data-testid={`button-claim-${deal.id}`}>
              Claim Deal
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
