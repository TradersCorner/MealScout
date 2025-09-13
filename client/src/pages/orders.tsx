import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Clock, CheckCircle, XCircle, MapPin } from "lucide-react";
import { BackHeader } from "@/components/back-header";

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const { data: claimedDeals, isLoading } = useQuery({
    queryKey: ["/api/deals/claimed"],
    enabled: isAuthenticated,
  });

  // Mock order data based on claimed deals
  const allClaims = Array.isArray(claimedDeals) ? claimedDeals : [];
  const mockOrders = allClaims.map((claim: any, index: number) => ({
    id: `order-${claim.id}`,
    dealId: claim.dealId,
    restaurantName: `Restaurant ${index + 1}`,
    dealTitle: `Deal ${index + 1}`,
    status: index % 3 === 0 ? 'completed' : index % 3 === 1 ? 'active' : 'cancelled',
    claimedAt: new Date(claim.claimedAt || Date.now()),
    orderNumber: `#${1000 + index}`,
    total: (15 + Math.random() * 25).toFixed(2),
  }));

  const activeOrders = mockOrders.filter((order: any) => order.status === 'active');
  const completedOrders = mockOrders.filter((order: any) => order.status === 'completed');
  const currentOrders = activeTab === 'active' ? activeOrders : completedOrders;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <BackHeader
          title="Deal History"
          fallbackHref="/"
          icon={Receipt}
          className="bg-white border-b border-border"
        />
        
        <div className="px-6 py-12 text-center">
          <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view orders</h2>
          <p className="text-muted-foreground mb-6">
            Log in to see your claimed deals and deal history
          </p>
          <Button onClick={() => window.location.href = "/api/auth/facebook"}>
            Sign In
          </Button>
        </div>
        
        <Navigation />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      <BackHeader
        title="Deal History"
        fallbackHref="/"
        icon={Receipt}
        className="bg-white border-b border-border"
      />

      {/* Tabs */}
      <div className="px-6 py-4 bg-white border-b border-border">
        <div className="flex bg-muted rounded-xl p-1">
          <Button
            variant={activeTab === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('active')}
            className="flex-1 rounded-lg"
            data-testid="tab-active-orders"
          >
            Active ({activeOrders.length})
          </Button>
          <Button
            variant={activeTab === 'completed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('completed')}
            className="flex-1 rounded-lg"
            data-testid="tab-completed-orders"
          >
            Completed ({completedOrders.length})
          </Button>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-md animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : currentOrders.length > 0 ? (
          <div className="space-y-4">
            {currentOrders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-md" data-testid={`order-${order.orderNumber}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{order.restaurantName}</h3>
                    <p className="text-sm text-muted-foreground">{order.dealTitle}</p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                  <span>{order.orderNumber}</span>
                  <span>${order.total}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {order.claimedAt.toLocaleDateString()}
                  </span>
                  {order.status === 'active' && (
                    <Button size="sm" variant="outline" data-testid={`button-track-${order.orderNumber}`}>
                      <MapPin className="w-3 h-3 mr-1" />
                      Track
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">
              {activeTab === 'active' ? 'No active orders' : 'No completed orders'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeTab === 'active' 
                ? 'Claim some deals to see your active orders here'
                : 'Your deal history will appear here'
              }
            </p>
            <Button data-testid="button-browse-deals-orders">
              Browse Deals
            </Button>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}