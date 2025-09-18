import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DealClaimModal from "./deal-claim-modal";

interface Deal {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  dealType: string;
  discountValue: string;
  minOrderAmount?: string;
  imageUrl?: string;
  restaurant?: {
    name: string;
    cuisineType?: string;
    phone?: string;
  };
}

interface RestaurantDealsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  initialDealId?: string;
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
    default: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=300&fit=crop&auto=format'
  };

  const lowerCuisine = cuisineType?.toLowerCase() || '';
  const lowerTitle = title?.toLowerCase() || '';

  // Title-based matching
  if (lowerTitle.includes('burger') || lowerTitle.includes('sandwich')) return images.burger;
  if (lowerTitle.includes('pizza')) return images.pizza;
  if (lowerTitle.includes('taco') || lowerTitle.includes('burrito')) return images.mexican;
  if (lowerTitle.includes('curry') || lowerTitle.includes('naan')) return images.indian;
  if (lowerTitle.includes('pasta') || lowerTitle.includes('garlic bread')) return images.italian;
  if (lowerTitle.includes('noodle') || lowerTitle.includes('bowl')) return images.asian;
  if (lowerTitle.includes('coffee') || lowerTitle.includes('pastry')) return images.cafe;

  // Cuisine-based matching
  if (lowerCuisine.includes('mexican')) return images.mexican;
  if (lowerCuisine.includes('chinese') || lowerCuisine.includes('asian')) return images.chinese;
  if (lowerCuisine.includes('italian')) return images.italian;
  if (lowerCuisine.includes('indian')) return images.indian;
  if (lowerCuisine.includes('cafe')) return images.cafe;
  
  return images.default;
};

export default function RestaurantDealsDrawer({ 
  isOpen, 
  onClose, 
  restaurantId, 
  restaurantName,
  initialDealId 
}: RestaurantDealsDrawerProps) {
  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: [`/api/deals/restaurant/${restaurantId}`],
    enabled: isOpen && !!restaurantId,
  });

  // Find initial deal index when data loads
  useEffect(() => {
    if (isOpen && deals && initialDealId) {
      const index = deals.findIndex((deal: Deal) => deal.id === initialDealId);
      if (index !== -1) {
        setCurrentDealIndex(index);
      }
    }
  }, [isOpen, deals, initialDealId]);

  const formatDiscount = (dealType: string, discountValue: string) => {
    if (dealType === "percentage") {
      return `${discountValue}%`;
    } else {
      return `$${discountValue}`;
    }
  };

  const nextDeal = () => {
    if (deals && currentDealIndex < deals.length - 1) {
      setCurrentDealIndex(currentDealIndex + 1);
    }
  };

  const prevDeal = () => {
    if (currentDealIndex > 0) {
      setCurrentDealIndex(currentDealIndex - 1);
    }
  };

  const handleClaimDeal = () => {
    setShowClaimModal(true);
  };

  if (!isOpen) return null;

  // Handle background click to close
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center md:items-center"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-2xl h-[90vh] md:h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900" data-testid="text-restaurant-deals-title">
              {restaurantName}
            </h2>
            <p className="text-sm text-gray-600">
              {deals ? `${deals.length} deals available` : 'Loading deals...'}
            </p>
          </div>
          <button
            onClick={onClose}
            data-testid="button-close-drawer"
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading deals...</p>
              </div>
            </div>
          ) : deals && deals.length > 0 ? (
            <div className="h-full flex flex-col">
              {/* Deal counter */}
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Deal {currentDealIndex + 1} of {deals.length}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevDeal}
                      disabled={currentDealIndex === 0}
                      data-testid="button-prev-deal"
                      className="rounded-full h-8 w-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextDeal}
                      disabled={currentDealIndex === deals.length - 1}
                      data-testid="button-next-deal"
                      className="rounded-full h-8 w-8"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Current deal display */}
              <div className="flex-1 overflow-y-auto p-6">
                <Card className="border-0 shadow-lg" data-testid={`card-restaurant-deal-${deals[currentDealIndex].id}`}>
                  <CardContent className="p-0">
                    {/* Deal Image */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden rounded-t-xl">
                      <img 
                        src={deals[currentDealIndex].imageUrl || getDefaultImage(deals[currentDealIndex].restaurant?.cuisineType, deals[currentDealIndex].title)}
                        alt={deals[currentDealIndex].title}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Deal badge */}
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-xl">
                        {formatDiscount(deals[currentDealIndex].dealType, deals[currentDealIndex].discountValue)} off
                      </div>
                    </div>

                    {/* Deal Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3" data-testid={`text-deal-title-${deals[currentDealIndex].id}`}>
                        {deals[currentDealIndex].title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed" data-testid={`text-deal-description-${deals[currentDealIndex].id}`}>
                        {deals[currentDealIndex].description}
                      </p>

                      {/* Promo highlight */}
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4 mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                          <div>
                            <span className="text-red-700 font-bold text-lg">
                              {formatDiscount(deals[currentDealIndex].dealType, deals[currentDealIndex].discountValue)} off
                            </span>
                            <p className="text-red-600 text-sm">
                              orders ${deals[currentDealIndex].minOrderAmount || '15'}+
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action button */}
                      <Button 
                        onClick={handleClaimDeal}
                        className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 rounded-2xl"
                        data-testid={`button-claim-deal-${deals[currentDealIndex].id}`}
                      >
                        Claim This Deal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Deal dots indicator */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex justify-center space-x-2">
                  {deals.map((_: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentDealIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentDealIndex ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                      data-testid={`button-deal-dot-${index}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600">No deals available for this restaurant.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deal Claim Modal */}
      {deals && deals[currentDealIndex] && (
        <DealClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          dealId={deals[currentDealIndex].id}
        />
      )}
    </div>
  );
}