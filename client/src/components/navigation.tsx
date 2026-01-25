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
  UtensilsCrossed,
  Calendar,
  LayoutDashboard,
  ParkingSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type NavItem = {
  path?: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  isBug?: boolean;
};

let navRenderLock = 0;

export default function Navigation() {
  const [canRender] = useState(() => {
    if (navRenderLock > 0) return false;
    navRenderLock += 1;
    return true;
  });
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    if (!canRender) return;
    return () => {
      navRenderLock = Math.max(0, navRenderLock - 1);
    };
  }, [canRender]);

  if (!canRender) {
    return null;
  }

  const handleBugReport = async () => {
    if (isReporting) return;
    setIsReporting(true);
    try {
      // Lazy load html2canvas only when needed (don't bundle it in main app)
      const html2canvas = (await import("html2canvas")).default;

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
  const isFoodTruck = user && user.userType === "food_truck";
  const isAdmin =
    user && (user.userType === "admin" || user.userType === "super_admin");
  const isStaff = user && user.userType === "staff";
  const isEventCoordinator = user && user.userType === "event_coordinator";

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
      isEventCoordinator,
      isHost,
    });
  }
  // Shared core nav: Food (home), Map, Video, Profile (only when logged in)
  const sharedNavItems: NavItem[] = [
    { path: "/", icon: UtensilsCrossed, label: "Food" },
    { path: "/map", icon: MapPin, label: "Map" },
    { path: "/video", icon: Clapperboard, label: "Video" },
    ...(user ? [{ path: "/profile", icon: User, label: "Profile" }] : []),
  ];

  const customerExtras: NavItem[] = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/favorites", icon: Heart, label: "Favorites" },
  ];

  const unauthenticatedExtras: NavItem[] = [
    { path: "/customer-signup", icon: UserPlus, label: "Create Account" },
  ];

  // Host-specific flows: dashboard + host marketing and discovery
  const hostExtras: NavItem[] = [
    { path: "/events", icon: Calendar, label: "Events" },
    { path: "/host/dashboard", icon: Users, label: "Host" },
    { path: "/for-restaurants", icon: Store, label: "For Restaurants" },
    { path: "/for-bars", icon: Store, label: "For Bars" },
  ];

  // Staff should be able to jump into every major website flow
  // Including all business types (restaurant, food truck, bar), host, and event coordinator capabilities
  const staffExtras: NavItem[] = [
    { path: "/events", icon: Calendar, label: "Events" },
    { path: "/staff", icon: Users, label: "Staff" },
    { path: "/host/dashboard", icon: Users, label: "Host" },
    { path: "/restaurant-owner-dashboard", icon: Store, label: "Dashboard" },
    { path: "/deal-creation", icon: Plus, label: "Create Special" },
    { path: "/subscription", icon: BarChart3, label: "Subscription" },
    { path: "/parking-pass", icon: Search, label: "Parking Pass" },
    { path: "/for-restaurants", icon: Store, label: "For Restaurants" },
    { path: "/for-bars", icon: Store, label: "For Bars" },
    { path: "/deals/featured", icon: Receipt, label: "Featured Specials" },
  ];

  const restaurantOwnerExtras: NavItem[] = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/deal-creation", icon: Plus, label: "Create Special" },
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

  // Admins should see every flow including all business types, host, and event coordinator capabilities
  const adminNavItems: NavItem[] = mergeNavItems(sharedNavItems, [
    { path: "/admin/dashboard", icon: Shield, label: "Admin" },
    { path: "/admin/affiliates", icon: Users, label: "Affiliates" },
    { path: "/staff", icon: Users, label: "Staff" },
    { path: "/events", icon: Calendar, label: "Events" },
    { path: "/host/dashboard", icon: Users, label: "Host" },
    ...restaurantOwnerExtras,
    { path: "/parking-pass", icon: Search, label: "Parking Pass" },
    ...customerExtras,
  ]);

  const customerNavItems: NavItem[] = mergeNavItems(
    sharedNavItems,
    customerExtras,
  );

  const unauthenticatedNavItems: NavItem[] = mergeNavItems(
    sharedNavItems,
    unauthenticatedExtras,
  );

  const staffNavItems: NavItem[] = mergeNavItems(sharedNavItems, staffExtras);

  const restaurantOwnerNavItems: NavItem[] = mergeNavItems(
    sharedNavItems,
    restaurantOwnerExtras,
  );

  const hostNavItems: NavItem[] = mergeNavItems(
    sharedNavItems,
    customerExtras,
    hostExtras,
  );

  const eventCoordinatorExtras: NavItem[] = [
    { path: "/events", icon: Calendar, label: "Events" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  ];

  const eventCoordinatorNavItems: NavItem[] = mergeNavItems(
    sharedNavItems,
    eventCoordinatorExtras,
  );

  const foodTruckNavItems: NavItem[] = mergeNavItems(
    sharedNavItems,
    customerExtras,
    [{ path: "/parking-pass", icon: ParkingSquare, label: "Parking Pass" }],
  );

  const navItems = !user
    ? [...unauthenticatedNavItems, bugNavItem]
    : isAdmin
      ? [...adminNavItems, bugNavItem]
      : isStaff
        ? [...staffNavItems, bugNavItem]
        : isEventCoordinator
          ? [...eventCoordinatorNavItems, bugNavItem]
          : isFoodTruck
            ? [...foodTruckNavItems, bugNavItem]
            : isRestaurantOwner
              ? [...restaurantOwnerNavItems, bugNavItem]
              : isHost
                ? [...hostNavItems, bugNavItem]
                : [...customerNavItems, bugNavItem];

  return (
    <nav className="nav-bar fixed bottom-0 left-0 right-0 w-full border-t px-4 py-2 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0 md:py-3">
      <div className="w-full mx-auto overflow-x-auto md:overflow-visible md:max-w-none md:px-6">
        <div className="flex items-center justify-start space-x-2 min-w-max md:flex-wrap md:justify-center md:gap-3">
          {navItems.map((item) =>
            item.path ? (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-link flex flex-col items-center space-y-1 py-2 px-2 rounded-lg transition-all duration-200 ${
                  location === item.path ? "nav-link--active" : "nav-link--inactive"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
                aria-label={item.label}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={item.onClick}
                disabled={isReporting}
                className={`nav-link flex flex-col items-center space-y-1 py-2 px-2 rounded-lg transition-all duration-200 ${
                  item.isBug ? "nav-bug" : "nav-link--inactive"
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
            ),
          )}
        </div>
      </div>
    </nav>
  );
}
