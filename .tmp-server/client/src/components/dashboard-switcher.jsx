import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Shield, User, Store, Eye, Monitor, Settings } from "lucide-react";
// Import the dashboard components
import AdminDashboard from "@/pages/admin-dashboard";
import UserDashboard from "@/pages/user-dashboard";
import RestaurantOwnerDashboard from "@/pages/restaurant-owner-dashboard";
export default function DashboardSwitcher(_a) {
    var _b, _c, _d, _e;
    var _f = _a.defaultView, defaultView = _f === void 0 ? 'admin' : _f;
    var _g = useState(defaultView), currentView = _g[0], setCurrentView = _g[1];
    var user = useAuth().user;
    var _h = useLocation(), location = _h[0], navigate = _h[1];
    // Verify admin status with server
    var _j = useQuery({
        queryKey: ["/api/auth/admin/verify"],
        retry: false,
        refetchOnWindowFocus: false,
    }), adminUser = _j.data, isVerifyingAdmin = _j.isLoading, adminError = _j.error;
    // Loading state while verifying admin
    if (isVerifyingAdmin) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
      </div>);
    }
    // If not admin, redirect to appropriate dashboard
    if (adminError || !adminUser) {
        if ((user === null || user === void 0 ? void 0 : user.userType) === 'restaurant_owner') {
            return <RestaurantOwnerDashboard />;
        }
        else {
            return <UserDashboard />;
        }
    }
    var dashboardTypes = [
        {
            type: 'admin',
            label: 'Admin View',
            icon: Shield,
            description: 'Platform administration and management',
            color: 'bg-red-100 text-red-800'
        },
        {
            type: 'user',
            label: 'Customer View',
            icon: User,
            description: 'Experience what customers see',
            color: 'bg-blue-100 text-blue-800'
        },
        {
            type: 'restaurant',
            label: 'Restaurant View',
            icon: Store,
            description: 'Experience what restaurant owners see',
            color: 'bg-green-100 text-green-800'
        }
    ];
    var renderDashboard = function () {
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
    return (<div className="min-h-screen bg-background">
      {/* Dashboard Switcher Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-6 w-6 text-primary"/>
                <h1 className="text-xl font-bold">Dashboard Switcher</h1>
                <Badge variant="secondary" className="text-xs">
                  Admin Mode
                </Badge>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="h-4 w-4"/>
                <span>Viewing as: {((_b = dashboardTypes.find(function (d) { return d.type === currentView; })) === null || _b === void 0 ? void 0 : _b.label) || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">Switch View:</span>
              {dashboardTypes.map(function (dashboard) { return (<Button key={dashboard.type} variant={currentView === dashboard.type ? "default" : "outline"} size="sm" onClick={function () { return setCurrentView(dashboard.type); }} className="flex items-center gap-2" data-testid={"button-switch-".concat(dashboard.type)}>
                  <dashboard.icon className="h-4 w-4"/>
                  <span className="hidden sm:inline">{dashboard.label}</span>
                  <span className="sm:hidden">{dashboard.label.split(' ')[0]}</span>
                </Button>); })}
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="pb-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <Badge className={(_c = dashboardTypes.find(function (d) { return d.type === currentView; })) === null || _c === void 0 ? void 0 : _c.color}>
                  {(function () {
            var currentDashboard = dashboardTypes.find(function (d) { return d.type === currentView; });
            var IconComponent = currentDashboard === null || currentDashboard === void 0 ? void 0 : currentDashboard.icon;
            return IconComponent ? <IconComponent className="h-3 w-3 mr-1"/> : null;
        })()}
                  {(_d = dashboardTypes.find(function (d) { return d.type === currentView; })) === null || _d === void 0 ? void 0 : _d.label}
                </Badge>
                <span className="text-muted-foreground">
                  {(_e = dashboardTypes.find(function (d) { return d.type === currentView; })) === null || _e === void 0 ? void 0 : _e.description}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Settings className="h-4 w-4"/>
                  Admin: {user === null || user === void 0 ? void 0 : user.email}
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
          {dashboardTypes.map(function (dashboard) { return (<Button key={dashboard.type} variant={currentView === dashboard.type ? "default" : "secondary"} size="icon" onClick={function () { return setCurrentView(dashboard.type); }} className="shadow-lg" data-testid={"button-mobile-switch-".concat(dashboard.type)}>
              <dashboard.icon className="h-4 w-4"/>
            </Button>); })}
        </div>
      </div>
    </div>);
}
