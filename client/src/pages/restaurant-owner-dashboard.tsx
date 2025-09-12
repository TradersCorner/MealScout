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
  CreditCard, BarChart3, MapPin, Clock, Edit,
  Download, Calendar as CalendarIcon, RefreshCw
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
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
  const [analyticsDateRange, setAnalyticsDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month' | 'quarter'>('month');

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

  // Fetch advanced analytics
  const { data: analyticsSummary, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['/api/restaurants', selectedRestaurant, 'analytics/summary', analyticsDateRange],
    enabled: !!selectedRestaurant,
  });

  const { data: analyticsTimeseries } = useQuery({
    queryKey: ['/api/restaurants', selectedRestaurant, 'analytics/timeseries', analyticsDateRange],
    enabled: !!selectedRestaurant,
  });

  const { data: customerInsights } = useQuery({
    queryKey: ['/api/restaurants', selectedRestaurant, 'analytics/customers', analyticsDateRange],
    enabled: !!selectedRestaurant,
  });

  const { data: comparison } = useQuery({
    queryKey: ['/api/restaurants', selectedRestaurant, 'analytics/compare', comparisonPeriod],
    queryFn: () => {
      const currentEnd = new Date(analyticsDateRange.end);
      const currentStart = new Date(analyticsDateRange.start);
      const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
      const previousStart = new Date(currentStart.getTime() - daysDiff * 24 * 60 * 60 * 1000);
      const previousEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      
      return apiRequest('GET', `/api/restaurants/${selectedRestaurant}/analytics/compare?currentStart=${currentStart.toISOString()}&currentEnd=${currentEnd.toISOString()}&previousStart=${previousStart.toISOString()}&previousEnd=${previousEnd.toISOString()}`);
    },
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

  // Update deal
  const updateDealMutation = useMutation({
    mutationFn: async ({ dealId, updates }: { dealId: string, updates: any }) => {
      return await apiRequest("PATCH", `/api/deals/${dealId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/deals/restaurant/${selectedRestaurant}`] });
      toast({
        title: "Deal Updated",
        description: "Deal has been updated successfully.",
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
          <TabsTrigger value="claims">Claims</TabsTrigger>
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
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Quick edit toggle - we'll use a simple approach with prompts for now
                          const newTitle = prompt("Edit deal title:", deal.title);
                          if (newTitle && newTitle !== deal.title) {
                            updateDealMutation.mutate({ 
                              dealId: deal.id, 
                              updates: { title: newTitle }
                            });
                          }
                        }}
                        data-testid={`button-quick-edit-${deal.id}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Quick Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleDealMutation.mutate({ dealId: deal.id, isActive: Boolean(deal.isActive) })}
                        data-testid={`button-deactivate-${deal.id}`}
                      >
                        {deal.isActive ? 'Pause' : 'Activate'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${deal.title}"? This cannot be undone.`)) {
                            deleteDealMutation.mutate(deal.id);
                          }
                        }}
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
          <div className="space-y-6">
            {/* Analytics Header with Date Range */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Analytics
                    </CardTitle>
                    <CardDescription>
                      Comprehensive insights into your deals performance and customer engagement
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={analyticsDateRange.start}
                        onChange={(e) => setAnalyticsDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="px-3 py-2 border rounded-md text-sm"
                        data-testid="input-analytics-start-date"
                      />
                      <input
                        type="date"
                        value={analyticsDateRange.end}
                        onChange={(e) => setAnalyticsDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="px-3 py-2 border rounded-md text-sm"
                        data-testid="input-analytics-end-date"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `/api/restaurants/${selectedRestaurant}/analytics/export?startDate=${analyticsDateRange.start}&endDate=${analyticsDateRange.end}&format=csv`;
                        window.open(url, '_blank');
                      }}
                      data-testid="button-export-analytics"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Performance Overview Cards */}
            {loadingAnalytics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-8 bg-muted rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Views</p>
                        <p className="text-2xl font-bold" data-testid="text-total-views">
                          {analyticsSummary?.totalViews?.toLocaleString() || 0}
                        </p>
                      </div>
                      <Eye className="h-8 w-8 text-blue-500" />
                    </div>
                    {comparison && (
                      <div className="mt-2 flex items-center text-xs">
                        <TrendingUp className={`h-3 w-3 mr-1 ${comparison.changes.viewsChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={comparison.changes.viewsChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {comparison.changes.viewsChange >= 0 ? '+' : ''}{comparison.changes.viewsChange.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground ml-1">vs previous period</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Claims</p>
                        <p className="text-2xl font-bold" data-testid="text-total-claims">
                          {analyticsSummary?.totalClaims?.toLocaleString() || 0}
                        </p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-green-500" />
                    </div>
                    {comparison && (
                      <div className="mt-2 flex items-center text-xs">
                        <TrendingUp className={`h-3 w-3 mr-1 ${comparison.changes.claimsChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={comparison.changes.claimsChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {comparison.changes.claimsChange >= 0 ? '+' : ''}{comparison.changes.claimsChange.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground ml-1">vs previous period</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold" data-testid="text-total-revenue">
                          ${analyticsSummary?.totalRevenue?.toLocaleString() || 0}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-yellow-500" />
                    </div>
                    {comparison && (
                      <div className="mt-2 flex items-center text-xs">
                        <TrendingUp className={`h-3 w-3 mr-1 ${comparison.changes.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={comparison.changes.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {comparison.changes.revenueChange >= 0 ? '+' : ''}{comparison.changes.revenueChange.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground ml-1">vs previous period</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                        <p className="text-2xl font-bold" data-testid="text-conversion-rate">
                          {analyticsSummary?.conversionRate?.toFixed(1) || 0}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                    </div>
                    {comparison && (
                      <div className="mt-2 flex items-center text-xs">
                        <TrendingUp className={`h-3 w-3 mr-1 ${comparison.changes.conversionRateChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={comparison.changes.conversionRateChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {comparison.changes.conversionRateChange >= 0 ? '+' : ''}{comparison.changes.conversionRateChange.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground ml-1">vs previous period</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Timeline Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Over Time</CardTitle>
                  <CardDescription>Daily revenue and deal performance trends</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsTimeseries && analyticsTimeseries.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsTimeseries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="claims" stroke="#82ca9d" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available for selected period
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Views vs Claims Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Views vs Claims</CardTitle>
                  <CardDescription>Daily views and conversion tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsTimeseries && analyticsTimeseries.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsTimeseries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="views" fill="#8884d8" />
                        <Bar dataKey="claims" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available for selected period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Deals Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performing Deals</CardTitle>
                <CardDescription>Your most successful deals ranked by views and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsSummary?.topDeals?.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsSummary.topDeals.map((deal, index) => (
                      <div key={deal.dealId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{deal.title}</p>
                            <p className="text-sm text-muted-foreground">Deal ID: {deal.dealId}</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{deal.views}</p>
                            <p className="text-muted-foreground">Views</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{deal.claims}</p>
                            <p className="text-muted-foreground">Claims</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">${deal.revenue}</p>
                            <p className="text-muted-foreground">Revenue</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No deal performance data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Insights</CardTitle>
                  <CardDescription>Understanding your customer behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Repeat Customers</p>
                      <p className="text-2xl font-bold">{customerInsights?.repeatCustomers || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Order Value</p>
                      <p className="text-2xl font-bold">${customerInsights?.averageOrderValue?.toFixed(2) || 0}</p>
                    </div>
                  </div>
                  
                  {customerInsights?.peakHours?.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Peak Hours</p>
                      <div className="space-y-1">
                        {customerInsights.peakHours.slice(0, 3).map((hour, index) => (
                          <div key={hour.hour} className="flex justify-between items-center">
                            <span className="text-sm">{hour.hour}:00 - {hour.hour + 1}:00</span>
                            <span className="text-sm font-medium">{hour.count} orders</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Demographics</CardTitle>
                  <CardDescription>Customer age and gender breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {customerInsights?.demographics ? (
                    <div className="space-y-4">
                      {customerInsights.demographics.ageGroups.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Age Groups</p>
                          <div className="space-y-1">
                            {customerInsights.demographics.ageGroups.map((group) => (
                              <div key={group.range} className="flex justify-between items-center">
                                <span className="text-sm">{group.range}</span>
                                <span className="text-sm font-medium">{group.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {customerInsights.demographics.genderBreakdown.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Gender Distribution</p>
                          <div className="space-y-1">
                            {customerInsights.demographics.genderBreakdown.map((gender) => (
                              <div key={gender.gender} className="flex justify-between items-center">
                                <span className="text-sm capitalize">{gender.gender}</span>
                                <span className="text-sm font-medium">{gender.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No demographic data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}