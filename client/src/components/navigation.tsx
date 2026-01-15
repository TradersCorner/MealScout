import { useState, useEffect, type ComponentType } from "react";
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

  const [isHost, setIsHost] = useState(false);

  // Detect if this user has a host profile so we can show host flows
  useEffect(() => {
    if (!user) {
      setIsHost(false);
      return;
    }

    let cancelled = false;
    fetch("/api/hosts/me")
      .then((res) => {
        if (cancelled) return;
        setIsHost(res.ok);
      })
      .catch(() => {
        if (cancelled) return;
        setIsHost(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Debug logging (development only)
  if (user && typeof window !== "undefined" && import.meta.env.DEV) {
    console.log("🔍 Navigation User Debug:", {
      email: user.email,
      userType: user.userType,
      isAdmin,
      isStaff,
      isRestaurantOwner,
      isHost,
    });
  }
  // Shared core nav: Home, Deals, Map, Profile for all users
  const sharedNavItems: NavItem[] = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/find-food", icon: Receipt, label: "Deals" },
    { path: "/map", icon: MapPin, label: "Map" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const customerExtras: NavItem[] = [
    { path: "/video", icon: Clapperboard, label: "Video" },
    { path: "/favorites", icon: Heart, label: "Favorites" },
  ];

  const unauthenticatedExtras: NavItem[] = [
    { path: "/video", icon: Clapperboard, label: "Video" },
    { path: "/customer-signup", icon: UserPlus, label: "Create Account" },
  ];

  // Host-specific flows: dashboard + host marketing and discovery
  const hostExtras: NavItem[] = [
    { path: "/host/dashboard", icon: Users, label: "Host" },
    { path: "/host-food", icon: MapPin, label: "Host Food" },
    { path: "/truck-discovery", icon: Search, label: "Truck Slots" },
    { path: "/for-food-trucks", icon: Store, label: "For Trucks" },
    { path: "/for-restaurants", icon: Store, label: "For Restaurants" },
    { path: "/for-bars", icon: Store, label: "For Bars" },
  ];

  // Staff should be able to jump into every major website flow
  const staffExtras: NavItem[] = [
    { path: "/staff", icon: Users, label: "Staff" },
    { path: "/host/dashboard", icon: Users, label: "Host" },
    { path: "/restaurant-owner-dashboard", icon: Store, label: "Restaurants" },
    { path: "/deal-creation", icon: Plus, label: "Create Deal" },
    { path: "/subscription", icon: BarChart3, label: "Subscription" },
    { path: "/truck-discovery", icon: Search, label: "Truck Slots" },
    { path: "/for-food-trucks", icon: Store, label: "For Trucks" },
    { path: "/for-restaurants", icon: Store, label: "For Restaurants" },
    { path: "/for-bars", icon: Store, label: "For Bars" },
    { path: "/host-food", icon: MapPin, label: "Host Food" },
    { path: "/deals/featured", icon: Receipt, label: "Featured" },
  ];

  const restaurantOwnerExtras: NavItem[] = [
    { path: "/restaurant-owner-dashboard", icon: Store, label: "Dashboard" },
    { path: "/deal-creation", icon: Plus, label: "Create Deal" },
    { path: "/subscription", icon: BarChart3, label: "Subscription" },
  ];

  const bugNavItem: NavItem = {
    label: "Report",
    icon: Bug,
    onClick: handleBugReport,
    isBug: true,
  };

  const mergeNavItems = (...groups: NavItem[][]): NavItem[] => {
    const seen = new Set<string>();
    const result: NavItem[] = [];
    for (const group of groups) {
      for (const item of group) {
        const key = item.path ? `path:${item.path}` : `label:${item.label}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  };

  // Admins should see every flow; start from shared nav
  const adminNavItems: NavItem[] = mergeNavItems(sharedNavItems, [
    { path: "/admin/dashboard", icon: Shield, label: "Admin" },
    { path: "/staff", icon: Users, label: "Staff" },
    ...restaurantOwnerExtras,
    ...customerExtras,
  ]);

  const customerNavItems: NavItem[] = mergeNavItems(
    sharedNavItems,
    customerExtras
  );

  const unauthenticatedNavItems: NavItem[] = mergeNavItems(
    sharedNavItems,
    unauthenticatedExtras
  );

  const staffNavItems: NavItem[] = mergeNavItems(sharedNavItems, staffExtras);

  const restaurantOwnerNavItems: NavItem[] = mergeNavItems(
    sharedNavItems,
    restaurantOwnerExtras
  );

  const hostNavItems: NavItem[] = mergeNavItems(
    sharedNavItems,
    customerExtras,
    hostExtras
  );

  const navItems = !user
    ? [...unauthenticatedNavItems, bugNavItem]
    : isAdmin
    ? [...adminNavItems, bugNavItem]
    : isStaff
    ? [...staffNavItems, bugNavItem]
    : isRestaurantOwner
    ? [...restaurantOwnerNavItems, bugNavItem]
    : isHost
    ? [...hostNavItems, bugNavItem]
    : [...customerNavItems, bugNavItem];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-sm border-t border-orange-100/80 px-4 py-2 z-50 shadow-xl">
      <div className="max-w-md mx-auto overflow-x-auto">
        <div className="flex items-center justify-start space-x-2 min-w-max">
          {navItems.map((item) =>
            item.path ? (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center space-y-1 py-2 px-2 rounded-lg transition-all duration-200 ${
                    location === item.path
                      ? "text-orange-600 bg-orange-50 ring-1 ring-orange-200/70"
                      : "text-slate-800 hover:text-orange-600 hover:bg-orange-50"
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
                    ? "text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
                    : "text-slate-800 hover:text-orange-600 hover:bg-orange-50"
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
      </div>
    </nav>
  );
}
