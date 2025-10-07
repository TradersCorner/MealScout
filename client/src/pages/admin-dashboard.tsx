import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { 
  Shield, Users, Store, TrendingUp, DollarSign, 
  AlertCircle, CheckCircle, XCircle, Clock,
  BarChart3, Activity, Package, Settings, Eye, MapPin, Phone, Mail, Calendar, CreditCard
} from "lucide-react";
import { Link } from "wouter";
import { QuickDashboardAccess } from "@/components/dashboard-switcher";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DashboardStats {
  totalUsers: number;
  totalRestaurants: number;
  totalDeals: number;
  activeDeals: number;
  totalClaims: number;
  todayClaims: number;
  revenue: number;
  newUsersToday: number;
}

interface PendingRestaurant {
  id: string;
  name: string;
  email: string;
  cuisineType: string;
  createdAt: string;
  isActive: boolean;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [dealDetailsOpen, setDealDetailsOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(7);

  // Check admin authentication
  const { data: adminUser, isLoading: isAuthLoading } = useQuery({
    queryKey: ["/api/auth/admin/verify"],
    retry: false,
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!adminUser,
  });

  // Fetch pending restaurants
  const { data: pendingRestaurants = [] } = useQuery<PendingRestaurant[]>({
    queryKey: ["/api/admin/restaurants/pending"],
    enabled: !!adminUser && selectedTab === "restaurants",
  });

  // Fetch all users
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!adminUser && selectedTab === "users",
  });

  // Fetch selected user's addresses
  const { data: userAddresses = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "addresses"],
    enabled: !!adminUser && !!selectedUser?.id && userDetailsOpen,
  });

  // Fetch selected deal's performance stats
  const { data: dealStats } = useQuery<any>({
    queryKey: ["/api/admin/deals", selectedDeal?.id, "stats"],
    enabled: !!adminUser && !!selectedDeal?.id && dealDetailsOpen,
  });

  // Fetch all deals
  const { data: deals = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/deals"],
    enabled: !!adminUser && selectedTab === "deals",
  });

  // Fetch verification requests
  const { data: verificationRequests = [], isLoading: loadingVerifications } = useQuery<any[]>({
    queryKey: ["/api/admin/verifications"],
    enabled: !!adminUser && selectedTab === "verifications",
  });

  // Approve restaurant mutation
  const approveRestaurant = useMutation({
    mutationFn: async (restaurantId: string) => {
      return await apiRequest("POST", `/api/admin/restaurants/${restaurantId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Restaurant Approved",
        description: "The restaurant has been activated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve restaurant. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject restaurant mutation
  const rejectRestaurant = useMutation({
    mutationFn: async (restaurantId: string) => {
      return await apiRequest("DELETE", `/api/admin/restaurants/${restaurantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Restaurant Rejected",
        description: "The restaurant application has been rejected.",
      });
    },
  });

  // Toggle deal featured status
  const toggleDealFeatured = useMutation({
    mutationFn: async ({ dealId, isFeatured }: { dealId: string; isFeatured: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/deals/${dealId}/featured`, { isFeatured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      toast({
        title: "Deal Updated",
        description: "Featured status has been updated.",
      });
    },
  });

  // Delete deal
  const deleteDeal = useMutation({
    mutationFn: async (dealId: string) => {
      return await apiRequest("DELETE", `/api/admin/deals/${dealId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDealDetailsOpen(false);
      toast({
        title: "Deal Deleted",
        description: "The deal has been permanently deleted.",
      });
    },
  });

  // Clone deal
  const cloneDeal = useMutation({
    mutationFn: async (dealId: string) => {
      return await apiRequest("POST", `/api/admin/deals/${dealId}/clone`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      toast({
        title: "Deal Cloned",
        description: "A copy of the deal has been created (inactive).",
      });
    },
  });

  // Toggle deal active status
  const toggleDealStatus = useMutation({
    mutationFn: async ({ dealId, isActive }: { dealId: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/deals/${dealId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Deal Status Updated",
        description: "The deal has been activated/deactivated.",
      });
    },
  });

  // Extend deal
  const extendDeal = useMutation({
    mutationFn: async ({ dealId, days }: { dealId: string; days: number }) => {
      return await apiRequest("PATCH", `/api/admin/deals/${dealId}/extend`, { days });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      setDealDetailsOpen(false);
      toast({
        title: "Deal Extended",
        description: `Deal extended by ${extendDays} days successfully.`,
      });
    },
  });

  // Toggle user status
  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Updated",
        description: "User status has been updated.",
      });
    },
  });

  // Approve verification request
  const approveVerification = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", `/api/admin/verifications/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Verification Approved",
        description: "Restaurant verification has been approved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve verification. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject verification request
  const rejectVerification = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      return await apiRequest("POST", `/api/admin/verifications/${requestId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Verification Rejected",
        description: "Restaurant verification has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject verification. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-destructive" />
              <span>Access Denied</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Link href="/admin/login">
              <Button className="w-full">Go to Admin Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultStats: DashboardStats = {
    totalUsers: 0,
    totalRestaurants: 0,
    totalDeals: 0,
    activeDeals: 0,
    totalClaims: 0,
    todayClaims: 0,
    revenue: 0,
    newUsersToday: 0,
  };

  const dashboardStats = stats || defaultStats;

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your MealScout platform</p>
            </div>
          </div>
          <Button variant="outline" asChild data-testid="button-logout-admin">
            <Link href="/api/logout">Logout</Link>
          </Button>
        </div>
      </header>

      {/* Dashboard Switcher */}
      <div className="px-6 pt-6">
        <QuickDashboardAccess />
      </div>

      {/* Stats Overview */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{dashboardStats.totalUsers}</div>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{dashboardStats.newUsersToday} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{dashboardStats.totalRestaurants}</div>
                <Store className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingRestaurants.length} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{dashboardStats.activeDeals}</div>
                <Package className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of {dashboardStats.totalDeals} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Claims Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{dashboardStats.todayClaims}</div>
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardStats.totalClaims} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="restaurants" data-testid="tab-restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="deals" data-testid="tab-deals">Deals</TabsTrigger>
            <TabsTrigger value="verifications" data-testid="tab-verifications">Verifications</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">System Status</span>
                  </div>
                  <Badge variant="default">Operational</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    <div className="text-xl font-bold">
                      {dashboardStats.totalClaims > 0 
                        ? ((dashboardStats.todayClaims / dashboardStats.totalClaims) * 100).toFixed(1)
                        : "0"}%
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                    <div className="text-xl font-bold">${dashboardStats.revenue.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Restaurant Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRestaurants.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No pending approvals</p>
                ) : (
                  <div className="space-y-3">
                    {pendingRestaurants.map((restaurant: PendingRestaurant) => (
                      <div key={restaurant.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{restaurant.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {restaurant.cuisineType} • {restaurant.email}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveRestaurant.mutate(restaurant.id)}
                            disabled={approveRestaurant.isPending}
                            data-testid={`button-approve-${restaurant.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectRestaurant.mutate(restaurant.id)}
                            disabled={rejectRestaurant.isPending}
                            data-testid={`button-reject-${restaurant.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                        {user.postalCode && (
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3" />
                            {user.postalCode}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserDetailsOpen(true);
                          }}
                          data-testid={`button-view-user-${user.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        <Badge variant={user.userType === 'admin' ? 'destructive' : 'secondary'}>
                          {user.userType}
                        </Badge>
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => 
                            toggleUserStatus.mutate({ userId: user.id, isActive: checked })
                          }
                          disabled={user.userType === 'admin'}
                          data-testid={`switch-user-${user.id}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deal Management</CardTitle>
                <CardDescription>View, edit, and manage all deals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deals.map((deal: any) => (
                    <div key={deal.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-lg">{deal.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {deal.restaurant?.name} • {deal.discountValue}% off • Ends {new Date(deal.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={deal.isActive ? 'default' : 'secondary'}>
                            {deal.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {deal.isFeatured && (
                            <Badge variant="outline">Featured</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            {deal.currentUses || 0} uses
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {deal.startTime} - {deal.endTime}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedDeal(deal);
                              setDealDetailsOpen(true);
                            }}
                            data-testid={`button-view-deal-${deal.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                          
                          <Link href={`/deal-edit/${deal.id}`}>
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`button-edit-deal-${deal.id}`}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => cloneDeal.mutate(deal.id)}
                            disabled={cloneDeal.isPending}
                            data-testid={`button-clone-deal-${deal.id}`}
                          >
                            <Package className="w-4 h-4 mr-1" />
                            Clone
                          </Button>
                          
                          <Switch
                            checked={deal.isActive}
                            onCheckedChange={(checked) => 
                              toggleDealStatus.mutate({ dealId: deal.id, isActive: checked })
                            }
                            data-testid={`switch-deal-active-${deal.id}`}
                          />
                          
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
                                deleteDeal.mutate(deal.id);
                              }
                            }}
                            disabled={deleteDeal.isPending}
                            data-testid={`button-delete-deal-${deal.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Business Verification Requests</span>
                </CardTitle>
                <CardDescription>
                  Review and approve restaurant verification documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingVerifications ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : verificationRequests.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No verification requests found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verificationRequests.map((request: any) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{request.restaurant?.name}</h3>
                            <p className="text-sm text-muted-foreground">{request.restaurant?.address}</p>
                          </div>
                          <Badge 
                            variant={
                              request.status === 'pending' ? 'secondary' :
                              request.status === 'approved' ? 'default' : 'destructive'
                            }
                            className="flex items-center space-x-1"
                          >
                            {request.status === 'pending' && <Clock className="w-3 h-3" />}
                            {request.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                            {request.status === 'rejected' && <XCircle className="w-3 h-3" />}
                            <span className="capitalize">{request.status}</span>
                          </Badge>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                          </p>
                          {request.documents && request.documents.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Documents ({request.documents.length}):</p>
                              <div className="flex flex-wrap gap-2">
                                {request.documents.map((doc: string, index: number) => (
                                  <div key={index} className="relative">
                                    {doc.startsWith('data:image') ? (
                                      <img 
                                        src={doc} 
                                        alt={`Document ${index + 1}`}
                                        className="w-20 h-20 object-cover rounded cursor-pointer border"
                                        onClick={() => window.open(doc, '_blank')}
                                        data-testid={`img-document-${request.id}-${index}`}
                                      />
                                    ) : (
                                      <div 
                                        className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center cursor-pointer border"
                                        onClick={() => window.open(doc, '_blank')}
                                        data-testid={`doc-document-${request.id}-${index}`}
                                      >
                                        <i className="fas fa-file-pdf text-2xl text-red-500"></i>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {request.rejectionReason && (
                          <div className="mb-4 p-3 bg-destructive/10 rounded-md">
                            <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                            <p className="text-sm text-destructive">{request.rejectionReason}</p>
                          </div>
                        )}

                        {request.status === 'pending' && (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => approveVerification.mutate(request.id)}
                              disabled={approveVerification.isPending}
                              data-testid={`button-approve-verification-${request.id}`}
                              className="flex items-center space-x-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = window.prompt('Please provide a reason for rejection:');
                                if (reason && reason.trim()) {
                                  rejectVerification.mutate({ requestId: request.id, reason: reason.trim() });
                                }
                              }}
                              disabled={rejectVerification.isPending}
                              data-testid={`button-reject-verification-${request.id}`}
                              className="flex items-center space-x-1"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>User Details</span>
            </DialogTitle>
            <DialogDescription>
              Complete profile information and activity details
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 mt-4">
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  BASIC INFORMATION
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">User Type</p>
                    <Badge variant={selectedUser.userType === 'admin' ? 'destructive' : 'secondary'}>
                      {selectedUser.userType}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {selectedUser.email}
                    </p>
                  </div>
                  {selectedUser.phone && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedUser.phone}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Email Verified</p>
                    <Badge variant={selectedUser.emailVerified ? 'default' : 'secondary'}>
                      {selectedUser.emailVerified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Account Status</p>
                    <Badge variant={selectedUser.isActive ? 'default' : 'destructive'}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Location & Demographics */}
              {(selectedUser.postalCode || selectedUser.birthYear || selectedUser.gender) && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    LOCATION & DEMOGRAPHICS
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.postalCode && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Postal Code</p>
                        <p className="text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedUser.postalCode}
                        </p>
                      </div>
                    )}
                    {selectedUser.birthYear && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Birth Year</p>
                        <p className="text-sm">{selectedUser.birthYear}</p>
                      </div>
                    )}
                    {selectedUser.gender && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="text-sm capitalize">{selectedUser.gender}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subscription Information */}
              {(selectedUser.stripeCustomerId || selectedUser.stripeSubscriptionId) && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <CreditCard className="w-4 h-4 mr-2" />
                    SUBSCRIPTION
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.stripeCustomerId && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Stripe Customer ID</p>
                        <p className="text-sm font-mono text-xs">{selectedUser.stripeCustomerId}</p>
                      </div>
                    )}
                    {selectedUser.stripeSubscriptionId && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Subscription ID</p>
                        <p className="text-sm font-mono text-xs">{selectedUser.stripeSubscriptionId}</p>
                      </div>
                    )}
                    {selectedUser.subscriptionBillingInterval && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Billing Interval</p>
                        <Badge variant="outline">
                          {selectedUser.subscriptionBillingInterval}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Authentication Methods */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 mr-2" />
                  AUTHENTICATION METHODS
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.googleId && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Google OAuth
                    </Badge>
                  )}
                  {selectedUser.facebookId && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Facebook OAuth
                    </Badge>
                  )}
                  {selectedUser.passwordHash && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Email/Password
                    </Badge>
                  )}
                </div>
              </div>

              {/* Account Activity */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  ACCOUNT ACTIVITY
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Account Created</p>
                    <p className="text-sm">
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {selectedUser.updatedAt && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="text-sm">
                        {new Date(selectedUser.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Addresses */}
              {userAddresses && userAddresses.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    SAVED ADDRESSES ({userAddresses.length})
                  </h3>
                  <div className="space-y-3">
                    {userAddresses.map((address: any) => (
                      <div key={address.id} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {address.type}
                            </Badge>
                            {address.isDefault && (
                              <Badge variant="default" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{address.label}</p>
                          <p className="text-sm text-muted-foreground">{address.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}
                            {address.state && `, ${address.state}`}
                            {address.postalCode && ` ${address.postalCode}`}
                          </p>
                          {(address.latitude && address.longitude) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                              <MapPin className="w-3 h-3" />
                              Coordinates: {parseFloat(address.latitude).toFixed(6)}, {parseFloat(address.longitude).toFixed(6)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile Image */}
              {selectedUser.profileImageUrl && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    PROFILE IMAGE
                  </h3>
                  <img 
                    src={selectedUser.profileImageUrl} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-2"
                    data-testid="img-user-profile"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deal Details Dialog */}
      <Dialog open={dealDetailsOpen} onOpenChange={setDealDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Deal Details & Performance</span>
            </DialogTitle>
            <DialogDescription>
              Comprehensive information and analytics for this deal
            </DialogDescription>
          </DialogHeader>

          {selectedDeal && (
            <div className="space-y-6 mt-4">
              {/* Deal Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Package className="w-4 h-4 mr-2" />
                  DEAL INFORMATION
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">Title</p>
                    <p className="font-medium text-lg">{selectedDeal.title}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm">{selectedDeal.description}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Restaurant</p>
                    <p className="font-medium">{selectedDeal.restaurant?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Discount</p>
                    <p className="font-medium">{selectedDeal.discountValue}% off</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Validity Period</p>
                    <p className="text-sm">
                      {new Date(selectedDeal.startDate).toLocaleDateString()} - {new Date(selectedDeal.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Time Window</p>
                    <p className="text-sm">{selectedDeal.startTime} - {selectedDeal.endTime}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={selectedDeal.isActive ? 'default' : 'secondary'}>
                      {selectedDeal.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Featured</p>
                    <Badge variant={selectedDeal.isFeatured ? 'default' : 'outline'}>
                      {selectedDeal.isFeatured ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {selectedDeal.totalUsesLimit && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Total Uses Limit</p>
                      <p className="text-sm">{selectedDeal.currentUses} / {selectedDeal.totalUsesLimit}</p>
                    </div>
                  )}
                  {selectedDeal.perCustomerLimit && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Per Customer Limit</p>
                      <p className="text-sm">{selectedDeal.perCustomerLimit}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              {dealStats && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    PERFORMANCE METRICS
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{dealStats.views || 0}</div>
                        <div className="text-xs text-muted-foreground">Total Views</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{dealStats.claims || 0}</div>
                        <div className="text-xs text-muted-foreground">Total Claims</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">
                          {dealStats.views > 0 ? ((dealStats.claims / dealStats.views) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Conversion Rate</div>
                      </CardContent>
                    </Card>
                  </div>

                  {dealStats.averageRating > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-medium">Average Rating</p>
                        <Badge variant="outline">{dealStats.averageRating.toFixed(1)} / 5.0</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Based on {dealStats.totalFeedback} reviews
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Settings className="w-4 h-4 mr-2" />
                  QUICK ACTIONS
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Extend Deal Duration</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={extendDays}
                        onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                        placeholder="Days"
                      />
                      <Button
                        size="sm"
                        onClick={() => extendDeal.mutate({ dealId: selectedDeal.id, days: extendDays })}
                        disabled={extendDeal.isPending}
                      >
                        Extend by {extendDays} days
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Deal Actions</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDealDetailsOpen(false);
                          window.location.href = `/deal-edit/${selectedDeal.id}`;
                        }}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Edit Deal
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          cloneDeal.mutate(selectedDeal.id);
                          setDealDetailsOpen(false);
                        }}
                        disabled={cloneDeal.isPending}
                      >
                        <Package className="w-4 h-4 mr-1" />
                        Clone
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
                <h3 className="font-semibold mb-2 text-destructive flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete this deal. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Are you absolutely sure? This will permanently delete the deal and all associated data.')) {
                      deleteDeal.mutate(selectedDeal.id);
                    }
                  }}
                  disabled={deleteDeal.isPending}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Delete Deal Permanently
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Navigation />
    </div>
  );
}