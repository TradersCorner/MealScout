
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

const getDefaultImage = (cuisineType?: string, title?: string) => {
  const images = {
    pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&auto=format',
    burger: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&auto=format',
    mexican: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop&auto=format',
    asian: 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop&auto=format',
    italian: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&auto=format',
    chinese: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400&h=300&fit=crop&auto=format',
    indian: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&auto=format',
    default: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=300&fit=crop&auto=format'
  };

  const lowerCuisine = cuisineType?.toLowerCase() || '';
  const lowerTitle = title?.toLowerCase() || '';

  if (lowerTitle.includes('burger') || lowerTitle.includes('sandwich')) return images.burger;
  if (lowerTitle.includes('pizza')) return images.pizza;
  if (lowerTitle.includes('taco') || lowerTitle.includes('burrito') || lowerCuisine.includes('mexican')) return images.mexican;
  if (lowerCuisine.includes('chinese') || lowerCuisine.includes('asian')) return images.chinese;
  if (lowerCuisine.includes('italian')) return images.italian;
  if (lowerCuisine.includes('indian')) return images.indian;
  
  return images.default;
};

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
          <div className="relative h-48 bg-gray-100 overflow-hidden">
            <img 
              src={deal.imageUrl || getDefaultImage(deal.restaurant?.cuisineType, deal.title)}
              alt={deal.title}
              className="w-full h-full object-cover"
            />
            
            {/* Deal badge */}
            {deal.isFeatured && (
              <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
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

            {/* Categories and location info */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
              <span>{deal.restaurant?.cuisineType || 'American'}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>{deal.distance ? `${deal.distance.toFixed(1)} mi` : '0.5 mi'}</span>
              </span>
              <span>•</span>
              <span>Pickup available</span>
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
