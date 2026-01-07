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
  Store,
  Building2,
  PartyPopper,
  Calendar
} from "lucide-react";
import { SEOHead } from "@/components/seo-head";
import { apiUrl } from "@/lib/api";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  // TODO: Fetch real stats from API
  const [userStats] = useState({
    dealsRedeemed: 0, // Real count from backend
    joinedDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null,
    lastActivity: null, // Real last activity date
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
    { icon: Receipt, label: "Deal History", badge: null, href: "/orders" },
    { icon: Heart, label: "Favorites", badge: null, href: "/favorites" },
    { icon: Bell, label: "Notifications", badge: null, href: "/profile/notifications" },
    { icon: MapPin, label: "Addresses", badge: null, href: "/profile/addresses" },
    // Only show Payment Methods for restaurant owners who need subscription billing
    ...(user?.userType === 'restaurant_owner' ? [
      { icon: CreditCard, label: "Payment Methods", badge: null, href: "/profile/payment" }
    ] : []),
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

      {/* Stats Section - Removed mock data */}
      <div className="px-6 py-6">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {userStats.joinedDate}</span>
              </div>
              {userStats.dealsRedeemed > 0 && (
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  <span>{userStats.dealsRedeemed} deals redeemed</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="px-6 pb-6">
        {/* Business Opportunities Section (Only for customers) */}
        {user?.userType === 'customer' && (
          <div className="mb-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Business Opportunities</h3>
            
            {/* Business Location Host CTA */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all cursor-pointer border border-blue-200">
              <CardContent className="p-0">
                <Link href="/host-signup">
                  <div className="p-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-bold text-base mb-1">
                          Host Food Trucks at Your Location
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Offices, bars, breweries — bring lunch to your people →
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Event Organizer CTA */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all cursor-pointer border border-purple-200">
              <CardContent className="p-0">
                <Link href="/event-signup">
                  <div className="p-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <PartyPopper className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-bold text-base mb-1">
                          Book Trucks for Your Event
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Festivals, concerts, markets — connect with vendors →
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
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
          
          {/* Restaurant Owner Option (de-emphasized in menu) */}
          {user?.userType === 'customer' && (
            <Link href="/customer-signup?role=business">
              <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Store className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">List Your Restaurant</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Logout Button */}
        <Card className="bg-white hover:bg-red-50 transition-colors cursor-pointer border-0 shadow-md mt-6">
          <CardContent className="p-4">
            <button
              onClick={async () => {
                try {
                  const response = await fetch(apiUrl('/api/auth/logout'), {
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