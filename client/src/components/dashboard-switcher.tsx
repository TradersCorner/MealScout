import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { 
  Shield, User, Store, Eye, ToggleLeft, 
  Monitor, Users, Utensils, Settings
} from "lucide-react";

// Import the dashboard components
import AdminDashboard from "@/pages/admin-dashboard";
import UserDashboard from "@/pages/user-dashboard";
import RestaurantOwnerDashboard from "@/pages/restaurant-owner-dashboard";

type DashboardType = 'admin' | 'user' | 'restaurant';

interface DashboardSwitcherProps {
  defaultView?: DashboardType;
}

export default function DashboardSwitcher({ defaultView = 'admin' }: DashboardSwitcherProps) {
  const [currentView, setCurrentView] = useState<DashboardType>(defaultView);
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  // Verify admin status with server
  const { data: adminUser, isLoading: isVerifyingAdmin, error: adminError } = useQuery({
    queryKey: ["/api/auth/admin/verify"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Loading state while verifying admin
  if (isVerifyingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If not admin, redirect to appropriate dashboard
  if (adminError || !adminUser) {
    if ((user as any)?.userType === 'restaurant_owner') {
      return <RestaurantOwnerDashboard />;
    } else {
      return <UserDashboard />;
    }
  }

  const dashboardTypes = [
    {
      type: 'admin' as DashboardType,
      label: 'Admin View',
      icon: Shield,
      description: 'Platform administration and management',
      color: 'bg-red-100 text-red-800'
    },
    {
      type: 'user' as DashboardType,
      label: 'Customer View',
      icon: User,
      description: 'Experience what customers see',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      type: 'restaurant' as DashboardType,
      label: 'Restaurant View',
      icon: Store,
      description: 'Experience what restaurant owners see',
      color: 'bg-green-100 text-green-800'
    }
  ];

  const renderDashboard = () => {
    switch (currentView) {
      case 'admin':
        return <AdminDashboard />;
      case 'user':
        return <UserDashboard />;
      case 'restaurant':
        return <RestaurantOwnerDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Switcher Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Dashboard Switcher</h1>
                <Badge variant="secondary" className="text-xs">
                  Admin Mode
                </Badge>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>Viewing as: {dashboardTypes.find(d => d.type === currentView)?.label || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">Switch View:</span>
              {dashboardTypes.map((dashboard) => (
                <Button
                  key={dashboard.type}
                  variant={currentView === dashboard.type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView(dashboard.type)}
                  className="flex items-center gap-2"
                  data-testid={`button-switch-${dashboard.type}`}
                >
                  <dashboard.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{dashboard.label}</span>
                  <span className="sm:hidden">{dashboard.label.split(' ')[0]}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="pb-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <Badge className={dashboardTypes.find(d => d.type === currentView)?.color}>
                  {(() => {
                    const currentDashboard = dashboardTypes.find(d => d.type === currentView);
                    const IconComponent = currentDashboard?.icon;
                    return IconComponent ? <IconComponent className="h-3 w-3 mr-1" /> : null;
                  })()}
                  {dashboardTypes.find(d => d.type === currentView)?.label}
                </Badge>
                <span className="text-muted-foreground">
                  {dashboardTypes.find(d => d.type === currentView)?.description}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  Admin: {(user as any)?.email}
                </span>
                <Button variant="ghost" size="sm" asChild data-testid="button-exit-switcher">
                  <Link href="/admin/dashboard">Exit Switcher</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {renderDashboard()}
      </div>

      {/* Floating Switch Button for Mobile */}
      <div className="fixed bottom-4 right-4 sm:hidden z-40">
        <div className="flex flex-col gap-2">
          {dashboardTypes.map((dashboard) => (
            <Button
              key={dashboard.type}
              variant={currentView === dashboard.type ? "default" : "secondary"}
              size="icon"
              onClick={() => setCurrentView(dashboard.type)}
              className="shadow-lg"
              data-testid={`button-mobile-switch-${dashboard.type}`}
            >
              <dashboard.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Quick Access Component for Admin Dashboard
export function QuickDashboardAccess() {
  const { user } = useAuth();

  // Verify admin status with server
  const { data: adminUser, isLoading: isVerifyingAdmin } = useQuery({
    queryKey: ["/api/auth/admin/verify"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Only show for verified admin users
  if (isVerifyingAdmin || !adminUser) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ToggleLeft className="h-5 w-5" />
          Dashboard Views
        </CardTitle>
        <CardDescription>
          Quickly switch to see what different user types experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button variant="outline" className="flex items-center gap-2 justify-start" asChild>
            <Link href="/admin/switcher?view=admin" data-testid="link-admin-view">
              <Shield className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Admin View</div>
                <div className="text-xs text-muted-foreground">Platform management</div>
              </div>
            </Link>
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2 justify-start" asChild>
            <Link href="/admin/switcher?view=user" data-testid="link-user-view">
              <User className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Customer View</div>
                <div className="text-xs text-muted-foreground">Customer experience</div>
              </div>
            </Link>
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2 justify-start" asChild>
            <Link href="/admin/switcher?view=restaurant" data-testid="link-restaurant-view">
              <Store className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Restaurant View</div>
                <div className="text-xs text-muted-foreground">Restaurant owner experience</div>
              </div>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}