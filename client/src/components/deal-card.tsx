
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
      return `${deal.discountValue}%`;
    } else {
      return `$${deal.discountValue}`;
    }
  };

  const formatDiscountText = () => {
    if (deal.dealType === "percentage") {
      return `${deal.discountValue}% OFF`;
    } else {
      return `$${deal.discountValue} OFF`;
    }
  };

  return (
    <Link href={`/deal/${deal.id}`}>
      <Card className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer mb-4" data-testid={`card-deal-${deal.id}`}>
        <CardContent className="p-0">
          {/* Restaurant Image Placeholder */}
          <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-600">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            {/* Delivery time badge */}
            <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded text-xs font-medium text-gray-700 shadow-sm">
              20-30 min
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Restaurant name and rating */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-lg" data-testid={`text-restaurant-name-${deal.id}`}>
                Restaurant Name
              </h3>
              <div className="flex items-center space-x-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">4.5</span>
                <span className="text-sm text-gray-500">(500+)</span>
              </div>
            </div>

            {/* Categories and price */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>American</span>
                <span>•</span>
                <span>$$</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  <span className="text-green-600 font-medium">0.5 mi</span>
                </div>
              </div>
            </div>

            {/* Deal highlight */}
            <div className="bg-red-50 border border-red-100 rounded-md p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                  </svg>
                  <span className="text-red-600 font-semibold text-sm" data-testid={`text-restaurant-info-${deal.id}`}>
                    {formatDiscountText()} on orders $15+
                  </span>
                </div>
                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                  {formatDiscount()}
                </span>
              </div>
            </div>

            {/* Promo details */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>188 people used today</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  <span>Expires in 2h 15m</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2">
              <Button 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-md transition-colors"
                data-testid={`button-claim-${deal.id}`}
              >
                Order Now
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="w-10 h-10 rounded-md border-gray-200 hover:bg-gray-50 p-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                </svg>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
