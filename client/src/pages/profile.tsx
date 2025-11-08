import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Settings, 
  Bell, 
  Heart, 
  Receipt, 
  CreditCard, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Star,
  MapPin,
  Store
} from "lucide-react";
import { SEOHead } from "@/components/seo-head";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [userStats] = useState({
    totalSaved: 156.50,
    dealsUsed: 23,
    favoriteRestaurants: 8,
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative pb-20">
        <header className="px-6 py-6 bg-white border-b border-border">
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <User className="w-6 h-6 text-primary mr-3" />
            Profile
          </h1>
        </header>
        
        <div className="px-6 py-12 text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view profile</h2>
          <p className="text-muted-foreground mb-6">
            Log in to access your profile, settings, and deal history
          </p>
          <Button onClick={() => window.location.href = "/api/auth/facebook"}>
            Sign In with Facebook
          </Button>
        </div>
        
        <Navigation />
      </div>
    );
  }

  const menuItems = [
    { icon: Receipt, label: "Deal History", badge: userStats.dealsUsed.toString(), href: "/orders" },
    { icon: Heart, label: "Favorites", badge: userStats.favoriteRestaurants.toString(), href: "/favorites" },
    { icon: Bell, label: "Notifications", badge: null, href: "/profile/notifications" },
    // Only show Payment Methods for restaurant owners who need subscription billing
    ...(user?.userType === 'restaurant_owner' ? [
      { icon: CreditCard, label: "Payment Methods", badge: null, href: "/profile/payment" }
    ] : []),
    { icon: MapPin, label: "Addresses", badge: null, href: "/profile/addresses" },
    { icon: Settings, label: "Settings", badge: null, href: "/profile/settings" },
    { icon: HelpCircle, label: "Help & Support", badge: null, href: "/profile/help" },
  ];

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative pb-20">
      <SEOHead
        title="My Profile - MealScout | Account Settings"
        description="Manage your MealScout profile, view account settings, update preferences, and access your deal history. Customize your food deal discovery experience."
        keywords="profile, account settings, user profile, account management, preferences"
        canonicalUrl="https://mealscout.us/profile"
        noIndex={true}
      />
      {/* Header */}
      <header className="px-6 py-6 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground flex items-center mb-6">
          <User className="w-6 h-6 text-primary mr-3" />
          Profile
        </h1>
        
        {/* User Info Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground" data-testid="text-user-name">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || 'User'
                  }
                </h2>
                <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                  {user?.email}
                </p>
                <div className="flex items-center mt-2">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-foreground" data-testid="text-user-type">
                    {user?.userType === 'restaurant_owner' ? 'Restaurant Owner' : 
                     user?.userType === 'admin' ? 'Admin' : 'Food Explorer'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Stats Section */}
      <div className="px-6 py-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Your Stats</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-saved">
              ${userStats.totalSaved}
            </div>
            <div className="text-xs text-muted-foreground">Total Saved</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-primary" data-testid="text-deals-used">
              {userStats.dealsUsed}
            </div>
            <div className="text-xs text-muted-foreground">Deals Used</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-orange-600" data-testid="text-favorite-restaurants">
              {userStats.favoriteRestaurants}
            </div>
            <div className="text-xs text-muted-foreground">Favorites</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-6 pb-6">
        {/* Become a Restaurant Owner CTA (Only for customers) */}
        {user?.userType === 'customer' && (
          <Card className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 transition-all cursor-pointer border-0 shadow-lg mb-6">
            <CardContent className="p-0">
              <Link href="/restaurant-signup">
                <div className="p-5" data-testid="card-become-restaurant-owner">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-1">
                        Own a Restaurant?
                      </h3>
                      <p className="text-white/90 text-sm">
                        List your business and start posting deals →
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between" data-testid={`menu-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <Card className="bg-white hover:bg-red-50 transition-colors cursor-pointer border-0 shadow-md mt-6">
          <CardContent className="p-4">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                  });
                  if (response.ok) {
                    window.location.href = '/';
                  } else {
                    console.error('Logout failed');
                  }
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }}
              className="w-full flex items-center justify-between"
              data-testid="button-logout"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-500">Sign Out</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}