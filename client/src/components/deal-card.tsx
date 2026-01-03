
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Clock, Utensils } from "lucide-react";
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
  const [isSaved, setIsSaved] = useState(false);
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

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Toggle saved state
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      
      // Track the save action
      if (newSavedState) {
        await apiRequest('POST', `/api/deals/${deal.id}/save`, {});
      } else {
        await apiRequest('DELETE', `/api/deals/${deal.id}/save`, {});
      }
    } catch (error) {
      console.error('Failed to save deal:', error);
      // Revert on error
      setIsSaved(!isSaved);
    }
  };

  const handleCardClick = () => {
    setShowDealsDrawer(true);
  };

  return (
    <div>
      <Card 
        ref={cardRef}
        className="bg-white rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 shadow-sm group overflow-hidden" 
        data-testid={`card-deal-${deal.id}`}
      >
        <CardContent className="p-0">
          {/* Image with gradient overlay - framed inside card */}
          <div className="relative h-16 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-t-2xl">
            <img 
              src={deal.imageUrl || getDefaultImage(deal.restaurant?.cuisineType, deal.title)}
              alt={deal.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Gradient overlay for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            
            {/* Save Fork Icon - top right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave(e);
              }}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-300 hover:scale-110 z-10"
              title={isSaved ? "Saved!" : "Save deal"}
            >
              <Utensils 
                className={`w-3 h-3 transition-all duration-300 ${
                  isSaved 
                    ? 'text-yellow-500 fill-yellow-500' 
                    : 'text-gray-600'
                }`}
              />
            </button>
          </div>

          {/* Content */}
          <div className="p-2.5" onClick={handleCardClick}>
            {/* Deal Line: One Tight Row */}
            <div className="mb-1.5">
              <div className="text-orange-600 leading-none">
                <span className="font-semibold text-lg">{formatDiscount()} OFF</span>
                <span className="text-sm ml-1.5">${deal.minOrderAmount || '8'}+</span>
              </div>
            </div>

            {/* Description: One Line, Clean Copy */}
            <p className="text-gray-900 text-sm font-semibold mb-1.5 line-clamp-1" data-testid={`text-restaurant-info-${deal.id}`}>
              {deal.description}
            </p>

            {/* Restaurant Name */}
            <h3 className="font-semibold text-gray-900 text-sm mb-0.5 truncate" data-testid={`text-restaurant-name-${deal.id}`}>
              {deal.restaurant?.name || 'Restaurant Name'}
            </h3>

            {/* Rating + Distance (Second Line) */}
            <div className="flex items-center gap-1 mb-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-0.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>4.5</span>
              </div>
              <span>·</span>
              <span>{deal.distance ? `${deal.distance.toFixed(1)} mi` : '0.5 mi'}</span>
            </div>

            {/* Meta Line: Icons Only, Subtle */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                <span>2h15m</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-orange-500" />
                <span>{deal.currentUses || 188}</span>
              </div>
            </div>

            {/* Button: Slim, Secondary Weight */}
            <Button 
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium h-8 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              View Deal
            </Button>
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
