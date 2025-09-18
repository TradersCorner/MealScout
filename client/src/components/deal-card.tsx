
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DealShareModal from "./deal-share-modal";
import RestaurantDealsDrawer from "./restaurant-deals-drawer";

interface Deal {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  dealType: string;
  discountValue: string;
  minOrderAmount?: string;
  imageUrl?: string;
  facebookPageUrl?: string;
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
    cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&auto=format',
    creole: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format',
    seafood: 'https://images.unsplash.com/photo-1565299585323-38174c97c24d?w=400&h=300&fit=crop&auto=format',
    sushi: 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop&auto=format',
    deli: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format',
    healthy: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&auto=format',
    default: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=300&fit=crop&auto=format'
  };

  const lowerCuisine = cuisineType?.toLowerCase() || '';
  const lowerTitle = title?.toLowerCase() || '';

  // Title-based matching
  if (lowerTitle.includes('burger') || lowerTitle.includes('sandwich')) return images.burger;
  if (lowerTitle.includes('pizza')) return images.pizza;
  if (lowerTitle.includes('taco') || lowerTitle.includes('burrito')) return images.mexican;
  if (lowerTitle.includes('sushi') || lowerTitle.includes('roll')) return images.sushi;
  if (lowerTitle.includes('beignet') || lowerTitle.includes('coffee') || lowerTitle.includes('pastry')) return images.cafe;
  if (lowerTitle.includes('curry') || lowerTitle.includes('naan')) return images.indian;
  if (lowerTitle.includes('pasta') || lowerTitle.includes('garlic bread')) return images.italian;
  if (lowerTitle.includes('noodle') || lowerTitle.includes('bowl')) return images.asian;
  if (lowerTitle.includes('jambalaya') || lowerTitle.includes('brunch') || lowerTitle.includes('mimosa')) return images.creole;
  if (lowerTitle.includes('shrimp') || lowerTitle.includes('fish') || lowerTitle.includes('catch')) return images.seafood;
  if (lowerTitle.includes('smoothie') || lowerTitle.includes('salad')) return images.healthy;

  // Cuisine-based matching
  if (lowerCuisine.includes('mexican')) return images.mexican;
  if (lowerCuisine.includes('chinese') || lowerCuisine.includes('asian')) return images.chinese;
  if (lowerCuisine.includes('italian')) return images.italian;
  if (lowerCuisine.includes('indian')) return images.indian;
  if (lowerCuisine.includes('cafe')) return images.cafe;
  if (lowerCuisine.includes('creole')) return images.creole;
  if (lowerCuisine.includes('seafood')) return images.seafood;
  if (lowerCuisine.includes('sushi')) return images.sushi;
  if (lowerCuisine.includes('deli')) return images.deli;
  if (lowerCuisine.includes('healthy')) return images.healthy;
  
  return images.default;
};

export default function DealCard({ deal }: DealCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDealsDrawer, setShowDealsDrawer] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // Track view when card becomes visible
  useEffect(() => {
    if (hasTrackedView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // Track view when card is more than 50% visible
            const trackView = async () => {
              try {
                await apiRequest('POST', `/api/deals/${deal.id}/view`, {});
                setHasTrackedView(true);
              } catch (error) {
                // Silently fail - view tracking shouldn't interrupt user experience
                console.debug('Card view tracking failed:', error);
              }
            };
            
            // Small delay to ensure it's not just scrolling past
            setTimeout(trackView, 500);
          }
        });
      },
      { threshold: 0.5 } // Track when 50% of card is visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [deal.id, hasTrackedView]);

  const formatDiscount = () => {
    if (deal.dealType === "percentage") {
      return `${deal.discountValue}%`;
    } else {
      return `$${deal.discountValue}`;
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to deal detail
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleCardClick = () => {
    setShowDealsDrawer(true);
  };

  return (
    <div onClick={handleCardClick}>
      <Card 
        ref={cardRef}
        className="bg-white rounded-3xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-0 shadow-lg group" 
        data-testid={`card-deal-${deal.id}`}
      >
        <CardContent className="p-0">
          {/* Restaurant Image */}
          <div className="relative h-56 bg-gray-100 overflow-hidden">
            <img 
              src={deal.imageUrl || getDefaultImage(deal.restaurant?.cuisineType, deal.title)}
              alt={deal.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            
            {/* Deal badge */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-xl">
              {formatDiscount()} off
            </div>
            
            {/* Action buttons */}
            <div className="absolute top-4 left-4 flex space-x-2">
              {/* Save button */}
              <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
              </div>
              
              {/* Share button */}
              <button
                onClick={handleShare}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                data-testid={`button-share-${deal.id}`}
              >
                <Share2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Restaurant name and rating */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-xl leading-tight" data-testid={`text-restaurant-name-${deal.id}`}>
                {deal.restaurant?.name || 'Restaurant Name'}
              </h3>
              <div className="flex items-center space-x-1 ml-2 bg-green-100 px-3 py-1 rounded-full">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-sm font-bold text-green-700">4.5</span>
              </div>
            </div>

            {/* Categories and location info */}
            <div className="flex items-center flex-wrap gap-2 mb-4">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">{deal.restaurant?.cuisineType || 'American'}</span>
              <span className="flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>{deal.distance ? `${deal.distance.toFixed(1)} mi` : '0.5 mi'}</span>
              </span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">Pickup</span>
            </div>

            {/* Deal description */}
            <p className="text-gray-600 text-base mb-5 leading-relaxed" data-testid={`text-restaurant-info-${deal.id}`}>
              {deal.description}
            </p>

            {/* Promo highlight */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-red-700 font-bold text-lg">
                      {formatDiscount()} off
                    </span>
                    <p className="text-red-600 text-sm">
                      orders ${deal.minOrderAmount || '15'}+
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage stats */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">{deal.currentUses || 188} people saved today</span>
              <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                2h 15m left
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Share Modal */}
      <DealShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        deal={deal}
      />
      
      {/* Restaurant Deals Drawer */}
      <RestaurantDealsDrawer
        isOpen={showDealsDrawer}
        onClose={() => setShowDealsDrawer(false)}
        restaurantId={deal.restaurantId}
        restaurantName={deal.restaurant?.name || 'Restaurant'}
        initialDealId={deal.id}
      />
    </div>
  );
}
