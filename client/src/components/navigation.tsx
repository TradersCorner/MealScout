import { useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Search,
  Heart,
  Receipt,
  User,
  MapPin,
  Store,
  Plus,
  BarChart3,
  UserPlus,
  Clapperboard,
  Bug,
  Shield,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import html2canvas from "html2canvas";

type NavItem = {
  path?: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  isBug?: boolean;
};

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isReporting, setIsReporting] = useState(false);

  const handleBugReport = async () => {
    if (isReporting) return;
    setIsReporting(true);
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
      });

      const screenshot = canvas.toDataURL("image/png");
      const currentUrl = window.location.href;
      const userAgent = navigator.userAgent;

      await apiRequest("POST", "/api/bug-report", {
        screenshot,
        currentUrl,
        userAgent,
      });

      toast({
        title: "Bug report sent!",
        description: "Thank you for helping us improve MealScout.",
      });
    } catch (error) {
      console.error("Failed to submit bug report:", error);
      toast({
        title: "Failed to send report",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsReporting(false);
    }
  };

  // Check user role
  const isRestaurantOwner = user && user.userType === "restaurant_owner";
  const isAdmin =
    user && (user.userType === "admin" || user.userType === "super_admin");
  const isStaff = user && user.userType === "staff";

  // Debug logging (development only)
  if (user && typeof window !== "undefined" && import.meta.env.DEV) {
    console.log("🔍 Navigation User Debug:", {
      email: user.email,
      userType: user.userType,
      isAdmin,
      isStaff,
      isRestaurantOwner,
    });
  }

  const customerNavItems: NavItem[] = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/map", icon: MapPin, label: "Map" },
    { path: "/video", icon: Clapperboard, label: "Video" },
    { path: "/favorites", icon: Heart, label: "Favorites" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const unauthenticatedNavItems: NavItem[] = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/map", icon: MapPin, label: "Map" },
    { path: "/video", icon: Clapperboard, label: "Video" },
    { path: "/customer-signup", icon: UserPlus, label: "Create Account" },
  ];

  const staffNavItems: NavItem[] = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/staff", icon: Users, label: "Dashboard" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const restaurantOwnerNavItems: NavItem[] = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/restaurant-owner-dashboard", icon: Store, label: "Dashboard" },
    { path: "/deal-creation", icon: Plus, label: "Create Deal" },
    { path: "/subscription", icon: BarChart3, label: "Subscription" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const bugNavItem: NavItem = {
    label: "Report",
    icon: Bug,
    onClick: handleBugReport,
    isBug: true,
  };

  // Admins should see every flow; merge all nav items and de-duplicate by path
  const adminNavItems: NavItem[] = (() => {
    const merged = [
      // Admin/staff controls
      { path: "/", icon: Home, label: "Home" },
      { path: "/admin/dashboard", icon: Shield, label: "Admin" },
      { path: "/staff", icon: Users, label: "Staff" },
      // Restaurant owner flows
      ...restaurantOwnerNavItems,
      // Customer flows
      ...customerNavItems,
    ];

    const seen = new Set<string>();
    const deduped: NavItem[] = [];
    for (const item of merged) {
      if (!item.path) continue;
      if (seen.has(item.path)) continue;
      seen.add(item.path);
      deduped.push(item);
    }
    return deduped;
  })();

  const navItems = !user
    ? [...unauthenticatedNavItems, bugNavItem]
    : isAdmin
    ? [...adminNavItems, bugNavItem]
    : isStaff
    ? [...staffNavItems, bugNavItem]
    : isRestaurantOwner
    ? [...restaurantOwnerNavItems, bugNavItem]
    : [...customerNavItems, bugNavItem];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 px-4 py-2 z-50 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) =>
          item.path ? (
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
          ) : (
            <button
              key={item.label}
              onClick={item.onClick}
              disabled={isReporting}
              className={`flex flex-col items-center space-y-1 py-2 px-2 rounded-lg transition-all duration-200 ${
                item.isBug
                  ? "text-white bg-orange-500 hover:bg-orange-600 shadow-md"
                  : "text-gray-600 hover:text-red-600 hover:bg-red-50"
              } ${isReporting ? "opacity-80 cursor-not-allowed" : ""}`}
              data-testid={`nav-${item.label.toLowerCase()}`}
              aria-label={item.label}
            >
              {isReporting ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <item.icon className="w-5 h-5" />
              )}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        )}
      </div>
    </nav>
  );
}
