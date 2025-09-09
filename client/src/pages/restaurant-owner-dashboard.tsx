import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Store, Plus, TrendingUp, Users, DollarSign, 
  Eye, ShoppingCart, Star, Calendar, Settings,
  CreditCard, BarChart3, MapPin, Clock
} from "lucide-react";
import type { Deal, Restaurant } from "@shared/schema";

interface DashboardStats {
  totalDeals: number;
  activeDeals: number;
  totalViews: number;
  totalClaims: number;
  conversionRate: number;
  averageRating: number;
}

export default function RestaurantOwnerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");

  // Fetch user's restaurants
  const { data: restaurants = [], isLoading: loadingRestaurants } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants/my-restaurants'],
    enabled: !!user,
  });

  // Fetch subscription status
  const { data: subscription } = useQuery({
    queryKey: ['/api/subscription/status'],
    enabled: !!user,
  });

  // Fetch deals for selected restaurant
  const { data: deals = [], isLoading: loadingDeals } = useQuery<Deal[]>({
    queryKey: [`/api/deals/restaurant/${selectedRestaurant}`],
    enabled: !!selectedRestaurant,
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: [`/api/restaurants/${selectedRestaurant}/stats`],
    enabled: !!selectedRestaurant,
  });

  // Set default restaurant
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurant) {
      setSelectedRestaurant(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurant]);

  // Toggle deal status
  const toggleDealMutation = useMutation({
    mutationFn: async ({ dealId, isActive }: { dealId: string, isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/deals/${dealId}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/deals/restaurant/${selectedRestaurant}`] });
      toast({
        title: "Deal Updated",
        description: "Deal status has been updated successfully.",
      });
    },
  });

  // Delete deal
  const deleteDealMutation = useMutation({
    mutationFn: async (dealId: string) => {
      return await apiRequest("DELETE", `/api/deals/${dealId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/deals/restaurant/${selectedRestaurant}`] });
      toast({
        title: "Deal Deleted",
        description: "Deal has been deleted successfully.",
      });
    },
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800';
      case 'lunch': return 'bg-blue-100 text-blue-800';
      case 'dinner': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingRestaurants) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <Store className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-3xl font-bold">No Restaurant Found</h1>
          <p className="text-muted-foreground">
            You need to register your restaurant first to create deals.
          </p>
          <Link href="/restaurant-signup">
            <Button size="lg" data-testid="button-register-restaurant">
              Register Your Restaurant
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Restaurant Dashboard</h1>
          {restaurants.length > 1 && (
            <select 
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="px-3 py-2 border rounded-lg"
              data-testid="select-restaurant"
            >
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-3">
          {(subscription as any)?.status === 'active' ? (
            <Link href="/deal-creation">
              <Button data-testid="button-create-deal">
                <Plus className="h-4 w-4 mr-2" />
                Create New Deal
              </Button>
            </Link>
          ) : (
            <Link href="/subscribe">
              <Button variant="default" data-testid="button-subscribe">
                <CreditCard className="h-4 w-4 mr-2" />
                Subscribe to Create Deals
              </Button>
            </Link>
          )}
          <Link href="/subscription">
            <Button variant="outline" data-testid="button-manage-subscription">
              <Settings className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Active Deals
            </CardDescription>
            <CardTitle className="text-3xl">
              {stats?.activeDeals || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Views
            </CardDescription>
            <CardTitle className="text-3xl">
              {stats?.totalViews || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Claims
            </CardDescription>
            <CardTitle className="text-3xl">
              {stats?.totalClaims || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Conversion Rate
            </CardDescription>
            <CardTitle className="text-3xl">
              {stats?.conversionRate?.toFixed(1) || 0}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Deals Management */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Deals</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Deals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loadingDeals ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </CardContent>
            </Card>
          ) : (
            deals.filter(deal => deal.isActive).map(deal => (
              <Card key={deal.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{deal.title}</h3>
                        <Badge className={getDealTypeColor(deal.dealType)}>
                          {deal.dealType}
                        </Badge>
                        {deal.isFeatured && (
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{deal.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">{deal.discountValue}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(deal.startTime)} - {formatTime(deal.endTime)}</span>
                        </div>
                        {deal.totalUsesLimit && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{deal.currentUses || 0} / {deal.totalUsesLimit} claimed</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleDealMutation.mutate({ dealId: deal.id, isActive: Boolean(deal.isActive) })}
                        data-testid={`button-deactivate-${deal.id}`}
                      >
                        Deactivate
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDealMutation.mutate(deal.id)}
                        data-testid={`button-delete-${deal.id}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          
          {deals.filter(deal => deal.isActive).length === 0 && !loadingDeals && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">No active deals</p>
                <Link href="/deal-creation">
                  <Button data-testid="button-create-first-deal">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Deal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {deals.filter(deal => !deal.isActive).map(deal => (
            <Card key={deal.id} className="opacity-75">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{deal.title}</h3>
                      <Badge variant="secondary">Inactive</Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{deal.description}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleDealMutation.mutate({ dealId: deal.id, isActive: Boolean(deal.isActive) })}
                      data-testid={`button-activate-${deal.id}`}
                    >
                      Activate
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteDealMutation.mutate(deal.id)}
                      data-testid={`button-delete-inactive-${deal.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {deals.filter(deal => !deal.isActive).length === 0 && !loadingDeals && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No inactive deals</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Track your deals performance and customer engagement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold">{stats?.averageRating?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">{stats?.conversionRate?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Deal Performance</p>
                {deals.map(deal => (
                  <div key={deal.id} className="flex justify-between items-center py-2">
                    <span className="text-sm">{deal.title}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">Views: {(deal as any).viewCount || 0}</span>
                      <span className="text-muted-foreground">Claims: {deal.currentUses || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}