import { Link, useLocation } from "wouter";
import { Home, Search, Heart, Receipt, User, MapPin, Store, Plus, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Check if user is a restaurant owner
  const isRestaurantOwner = user && user.userType === 'restaurant_owner';

  const customerNavItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/map", icon: MapPin, label: "Map" },
    { path: "/favorites", icon: Heart, label: "Favorites" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const restaurantOwnerNavItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/restaurant-owner-dashboard", icon: Store, label: "Dashboard" },
    { path: "/deal-creation", icon: Plus, label: "Create Deal" },
    { path: "/subscription", icon: BarChart3, label: "Subscription" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const navItems = isRestaurantOwner ? restaurantOwnerNavItems : customerNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 px-4 py-2 z-50 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <button 
              className={`flex flex-col items-center space-y-1 py-2 px-2 rounded-lg transition-all duration-200 ${
                location === item.path 
                  ? "text-red-600 bg-red-50" 
                  : "text-gray-600 hover:text-red-600 hover:bg-red-50"
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
