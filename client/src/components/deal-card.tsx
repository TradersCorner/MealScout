
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
      <Card className="bg-white border-0 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer" data-testid={`card-deal-${deal.id}`}>
        {/* Restaurant Icon and Deal Badge */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-sm">
                <i className="fas fa-utensils text-white text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight" data-testid={`text-restaurant-name-${deal.id}`}>
                  Restaurant
                </h3>
                <p className="text-sm text-gray-600 mt-0.5" data-testid={`text-restaurant-info-${deal.id}`}>
                  Save {formatDiscountText().toLowerCase()} on any burger combo meal
                </p>
              </div>
            </div>
            <div className="bg-green-500 text-white px-3 py-2 rounded-xl font-bold text-lg shadow-sm">
              <div className="text-xs font-semibold opacity-90">$5.00</div>
              <div className="text-xs font-medium -mt-1">OFF</div>
            </div>
          </div>

          {/* Location and Timer */}
          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-600 font-medium text-sm">Nearby</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-clock text-gray-400 text-xs"></i>
                <span className="text-gray-600 font-medium">00:00 - 23:59</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button 
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-2xl text-base shadow-sm transition-all duration-200"
              data-testid={`button-claim-${deal.id}`}
            >
              <i className="fas fa-ticket-alt mr-2"></i>
              Claim Deal
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="w-14 h-14 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
            >
              <i className="fas fa-bookmark text-blue-500"></i>
            </Button>
          </div>

          {/* Deal Stats */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full text-sm font-bold flex items-center">
              <i className="fas fa-bolt text-yellow-600 mr-1.5"></i>
              188 left
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <i className="fas fa-users mr-1.5"></i>
              <span className="font-medium">12</span>
              <span className="ml-1">saved today</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
