
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DealShareModal from "./deal-share-modal";
import RestaurantDealsDrawer from "./restaurant-deals-drawer";
import { DealFeedback } from "./deal-feedback";

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
  isAiGenerated?: boolean;
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
        className="bg-white rounded-3xl hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 shadow-sm group overflow-hidden" 
        data-testid={`card-deal-${deal.id}`}
      >
        <CardContent className="p-0">
          {/* Restaurant Image */}
          <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-t-3xl">
            <img 
              src={deal.imageUrl || getDefaultImage(deal.restaurant?.cuisineType, deal.title)}
              alt={deal.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Restaurant name and rating */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-lg leading-tight" data-testid={`text-restaurant-name-${deal.id}`}>
                {deal.restaurant?.name || 'Restaurant Name'}
              </h3>
              <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-sm font-semibold text-gray-900">4.5</span>
              </div>
            </div>

            {/* Meta info */}
            <div className="space-y-2 mb-4">
              <p className="text-gray-600 text-sm">{deal.restaurant?.cuisineType || 'American'}</p>
              <div className="flex items-center text-gray-600 text-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 mr-1">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>{deal.distance ? `${deal.distance.toFixed(1)} mi` : '0.5 mi'}</span>
              </div>
              <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                Pickup
              </span>
            </div>

            {/* Deal description */}
            <p className="text-gray-600 text-sm mb-4 leading-relaxed" data-testid={`text-restaurant-info-${deal.id}`}>
              {deal.description}
            </p>

            {/* Promo highlight */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-100 rounded-2xl p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-red-600 font-bold text-xl">
                    {formatDiscount()} <span className="text-base">off</span>
                  </div>
                  <p className="text-red-600 text-sm">
                    orders ${deal.minOrderAmount || '8.00'}+
                  </p>
                </div>
              </div>
            </div>

            {/* Usage stats */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">{deal.currentUses || 188} people saved</span>
              <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-semibold">
                2h 15m left
              </span>
            </div>

            {/* Feedback section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <DealFeedback dealId={deal.id} compact={true} />
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
