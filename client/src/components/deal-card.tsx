
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
  restaurant?: {
    name: string;
    cuisineType?: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
  };
  distance?: number;
  currentUses?: number;
  totalUsesLimit?: number;
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

  return (
    <Link href={`/deal/${deal.id}`}>
      <Card className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200" data-testid={`card-deal-${deal.id}`}>
        <CardContent className="p-0">
          {/* Restaurant Image */}
          <div className="relative h-48 bg-gray-100">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            
            {/* Delivery time badge */}
            <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700 shadow-sm">
              25-35 min
            </div>
            
            {/* Deal badge */}
            {deal.isFeatured && (
              <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {formatDiscount()} off
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Restaurant name and rating */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight" data-testid={`text-restaurant-name-${deal.id}`}>
                {deal.restaurant?.name || 'Restaurant Name'}
              </h3>
              <div className="flex items-center space-x-1 ml-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">4.5</span>
              </div>
            </div>

            {/* Categories and delivery info */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
              <span>{deal.restaurant?.cuisineType || 'American'}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span>{deal.distance ? `${deal.distance.toFixed(1)} mi` : '0.5 mi'}</span>
              </span>
              <span>•</span>
              <span>$1.99 delivery fee</span>
            </div>

            {/* Deal description */}
            <p className="text-gray-700 text-sm mb-4 leading-relaxed" data-testid={`text-restaurant-info-${deal.id}`}>
              {deal.description}
            </p>

            {/* Promo highlight */}
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-red-600 font-medium text-sm">
                    {formatDiscount()} off orders ${deal.minOrderAmount || '15'}+
                  </span>
                </div>
              </div>
            </div>

            {/* Usage stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{deal.currentUses || 188} people used today</span>
              <span>Expires in 2h 15m</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
