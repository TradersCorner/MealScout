import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense, useEffect, useState } from "react";
import { BetaDisclaimer } from "@/components/beta-disclaimer";
import Navigation from "@/components/navigation";
import { apiUrl } from "@/lib/api";

// Eager load only critical pages (home, login) - everything else lazy loads
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

// Lazy load ALL pages including home for faster initial load
const Home = lazy(() => import("@/pages/home"));

// Lazy load all other pages - they only download when the user navigates to them
const CustomerSignup = lazy(() => import("@/pages/customer-signup"));
const RestaurantSignup = lazy(() => import("@/pages/restaurant-signup"));
const CityLanding = lazy(() => import("@/pages/city-landing"));
const DealCreation = lazy(() => import("@/pages/deal-creation"));
const DealEdit = lazy(() => import("@/pages/deal-edit"));
const DealDetail = lazy(() => import("@/pages/deal-detail"));
const Subscribe = lazy(() => import("@/pages/subscribe"));
const Search = lazy(() => import("@/pages/search"));
const MapPage = lazy(() => import("@/pages/map"));
const ReviewsPage = lazy(() => import("@/pages/reviews"));
const Favorites = lazy(() => import("@/pages/favorites"));
const Orders = lazy(() => import("@/pages/orders"));
const Profile = lazy(() => import("@/pages/profile"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const StaffDashboard = lazy(() => import("@/pages/staff-dashboard"));
const AdminIncidents = lazy(() => import("@/pages/AdminIncidents"));
const AdminControlCenter = lazy(() => import("@/pages/AdminControlCenter"));
const AdminSupportTickets = lazy(() => import("@/pages/AdminSupportTickets"));
const AdminModerationEvents = lazy(
  () => import("@/pages/AdminModerationEvents"),
);
const AdminModerationVideos = lazy(
  () => import("@/pages/admin-moderation-videos"),
);
const AdminModerationMetrics = lazy(
  () => import("@/pages/admin-moderation-metrics"),
);
const AdminModerationAppeals = lazy(
  () => import("@/pages/admin-moderation-appeals"),
);
const AdminAuditLogs = lazy(() => import("@/pages/AdminAuditLogs"));
const AdminTelemetry = lazy(() => import("@/pages/admin-telemetry"));
const AdminAffiliateManagement = lazy(
  () => import("@/pages/AdminAffiliateManagement"),
);
const AffiliateEarnings = lazy(() => import("@/pages/AffiliateEarnings"));
const EmptyCountyExperience = lazy(
  () => import("@/pages/EmptyCountyExperience"),
);
const CategoryPage = lazy(() => import("@/pages/category"));
const FeaturedDealsPage = lazy(() => import("@/pages/deals-featured"));
const RestaurantDetail = lazy(() => import("@/pages/restaurant-detail"));
const NotificationsPage = lazy(() => import("@/pages/profile/notifications"));
const SettingsPage = lazy(() => import("@/pages/profile/settings"));
const AddressesPage = lazy(() => import("@/pages/profile/addresses"));
const PaymentMethodsPage = lazy(() => import("@/pages/profile/payment"));
const HelpSupportPage = lazy(() => import("@/pages/profile/help"));
const RestaurantOwnerDashboard = lazy(
  () => import("@/pages/restaurant-owner-dashboard"),
);
const UserDashboard = lazy(() => import("@/pages/user-dashboard"));
const DashboardSwitcher = lazy(() => import("@/components/dashboard-switcher"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const DataDeletion = lazy(() => import("@/pages/data-deletion"));
const About = lazy(() => import("@/pages/about"));
const FAQ = lazy(() => import("@/pages/faq"));
const HowItWorks = lazy(() => import("@/pages/how-it-works"));
const Contact = lazy(() => import("@/pages/contact"));
const Sitemap = lazy(() => import("@/pages/sitemap"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const AccountSetup = lazy(() => import("@/pages/account-setup"));
const OAuthSetupGuide = lazy(() => import("@/pages/oauth-setup-guide"));
const GoldenPlateWinners = lazy(() => import("@/pages/golden-plate-winners"));
const ParkingPassPage = lazy(() => import("@/pages/parking-pass"));
const ParkingPassManage = lazy(() => import("@/pages/parking-pass-manage"));
const StatusPage = lazy(() => import("@/pages/status"));
const HostSignup = lazy(() => import("@/pages/host-signup"));
const HostDashboard = lazy(() => import("@/pages/host-dashboard"));
const EventCoordinatorDashboard = lazy(
  () => import("@/pages/event-coordinator-dashboard"),
);
const DashboardRouter = lazy(() => import("@/pages/dashboard-router"));
const TruckDiscovery = lazy(() => import("@/pages/truck-discovery"));
const EventSignup = lazy(() => import("@/pages/event-signup"));
const EventsPage = lazy(() => import("@/pages/events"));
const EventsRouter = lazy(() => import("@/pages/events-router"));
const ForRestaurants = lazy(() => import("@/pages/for-restaurants"));
const ForBars = lazy(() => import("@/pages/for-bars"));
const ForHosts = lazy(() => import("@/pages/for-hosts"));
const ForEvents = lazy(() => import("@/pages/for-events"));
const FindFood = lazy(() => import("@/pages/find-food"));
const VideoPage = lazy(() => import("@/pages/video"));
const VideoDetailPage = lazy(() => import("@/pages/video-detail"));
const ChangePassword = lazy(() => import("@/pages/change-password"));
const TruckLanding = lazy(() => import("@/pages/truck-landing"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

// Wrapper component to handle route props
function DashboardSwitcherPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get("view") as "admin" | "user" | "restaurant" | null;
  return <DashboardSwitcher defaultView={view || "admin"} />;
}

function Router() {
  const { authState, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [affiliateTag, setAffiliateTag] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated) {
      setAffiliateTag("");
      return;
    }
    let cancelled = false;
    fetch(apiUrl("/api/affiliate/tag"), { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.tag) setAffiliateTag(data.tag);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!affiliateTag) return;
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (url.pathname.startsWith("/ref/")) return;
    if (url.searchParams.has("ref")) return;

    url.searchParams.set("ref", affiliateTag);
    window.history.replaceState({}, "", url.toString());
  }, [affiliateTag, location]);

  // Canonical guard: never redirect until authState resolves
  if (authState === "loading") {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {!isAuthenticated ? (
          <>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/customer-signup" component={CustomerSignup} />
            <Route path="/restaurant-signup" component={RestaurantSignup} />
            <Route path="/deal-creation" component={DealCreation} />
            <Route path="/deal/:id" component={DealDetail} />
            <Route path="/search" component={Search} />
            <Route path="/map" component={MapPage} />
            <Route path="/video" component={VideoPage} />
            <Route path="/video/:id" component={VideoDetailPage} />
            <Route path="/category/:category" component={CategoryPage} />
            <Route path="/deals" component={FeaturedDealsPage} />
            <Route path="/deals/featured" component={FeaturedDealsPage} />
            <Route path="/restaurant/:id" component={RestaurantDetail} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/data-deletion" component={DataDeletion} />
            <Route path="/about" component={About} />
            <Route path="/faq" component={FAQ} />
            <Route path="/how-it-works" component={HowItWorks} />
            <Route path="/contact" component={Contact} />
            <Route path="/host-signup" component={HostSignup} />
            <Route path="/for-restaurants" component={ForRestaurants} />
            <Route path="/for-bars" component={ForBars} />
            <Route path="/for-hosts" component={ForHosts} />
            <Route path="/for-events" component={ForEvents} />
            <Route path="/find-food" component={FindFood} />
            <Route path="/event-signup" component={EventSignup} />
            <Route path="/events" component={EventsRouter} />
            <Route path="/events/public" component={EventsPage} />
            <Route path="/dashboard" component={DashboardRouter} />
            <Route path="/food-trucks/:citySlug" component={CityLanding} />
            <Route path="/truck-landing" component={TruckLanding} />
            <Route path="/sitemap" component={Sitemap} />
            <Route path="/status" component={StatusPage} />
            <Route
              path="/golden-plate-winners"
              component={GoldenPlateWinners}
            />
            <Route path="/parking-pass" component={ParkingPassPage} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/change-password" component={ChangePassword} />
            <Route path="/account-setup" component={AccountSetup} />
            <Route path="/admin" component={AdminLogin} />
            <Route path="/admin/login" component={AdminLogin} />
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/customer-signup" component={CustomerSignup} />
            <Route path="/restaurant-signup" component={RestaurantSignup} />
            <Route path="/deal-creation" component={DealCreation} />
            <Route path="/deal-edit/:dealId" component={DealEdit} />
            <Route path="/deal/:id" component={DealDetail} />
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/subscription" component={Subscribe} />
            <Route path="/subscription/manage" component={Subscribe} />
            <Route
              path="/restaurant-owner-dashboard"
              component={RestaurantOwnerDashboard}
            />
            <Route
              path="/restaurant/dashboard"
              component={RestaurantOwnerDashboard}
            />
            <Route path="/dashboard" component={DashboardRouter} />
            <Route path="/user-dashboard" component={UserDashboard} />
        <Route path="/host/dashboard" component={HostDashboard} />
        <Route
          path="/event-coordinator/dashboard"
          component={EventCoordinatorDashboard}
        />
            <Route path="/truck-discovery" component={TruckDiscovery} />
            <Route path="/for-restaurants" component={ForRestaurants} />
            <Route path="/for-bars" component={ForBars} />
            <Route path="/for-hosts" component={ForHosts} />
            <Route path="/for-events" component={ForEvents} />
            <Route path="/find-food" component={FindFood} />
            <Route path="/search" component={Search} />
            <Route path="/map" component={MapPage} />
            <Route path="/video" component={VideoPage} />
            <Route path="/favorites" component={Favorites} />
            <Route path="/orders" component={Orders} />
            <Route path="/profile" component={Profile} />
            <Route path="/affiliate/earnings" component={AffiliateEarnings} />
            <Route path="/staff" component={StaffDashboard} />
            <Route path="/admin" component={AdminLogin} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/incidents" component={AdminIncidents} />
            <Route
              path="/admin/control-center"
              component={AdminControlCenter}
            />
            <Route path="/admin/tickets" component={AdminSupportTickets} />
            <Route path="/admin/moderation" component={AdminModerationEvents} />
            <Route
              path="/admin/moderation/videos"
              component={AdminModerationVideos}
            />
            <Route
              path="/admin/moderation/metrics"
              component={AdminModerationMetrics}
            />
            <Route
              path="/admin/moderation/appeals"
              component={AdminModerationAppeals}
            />
            <Route path="/admin/audit-logs" component={AdminAuditLogs} />
            <Route path="/admin/telemetry" component={AdminTelemetry} />
            <Route path="/admin/affiliates" component={AdminAffiliateManagement} />
            <Route path="/admin/switcher" component={DashboardSwitcherPage} />
            <Route path="/category/:category" component={CategoryPage} />
            <Route path="/deals" component={FeaturedDealsPage} />
            <Route path="/deals/featured" component={FeaturedDealsPage} />
            <Route path="/restaurant/:id" component={RestaurantDetail} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/data-deletion" component={DataDeletion} />
            <Route path="/about" component={About} />
            <Route path="/faq" component={FAQ} />
            <Route path="/how-it-works" component={HowItWorks} />
            <Route path="/contact" component={Contact} />
            <Route path="/host-signup" component={HostSignup} />
            <Route path="/event-signup" component={EventSignup} />
            <Route path="/events" component={EventsRouter} />
            <Route path="/events/public" component={EventsPage} />
            <Route path="/sitemap" component={Sitemap} />
            <Route path="/truck-landing" component={TruckLanding} />
            <Route path="/status" component={StatusPage} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/change-password" component={ChangePassword} />
            <Route path="/account-setup" component={AccountSetup} />
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin/oauth-setup" component={OAuthSetupGuide} />
            <Route
              path="/profile/notifications"
              component={NotificationsPage}
            />
            <Route path="/profile/settings" component={SettingsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/profile/addresses" component={AddressesPage} />
            <Route path="/profile/payment" component={PaymentMethodsPage} />
            <Route path="/profile/help" component={HelpSupportPage} />
            <Route
              path="/restaurant/:restaurantId/reviews"
              component={ReviewsPage}
            />
            <Route path="/parking-pass" component={ParkingPassPage} />
            <Route path="/parking-pass-manage" component={ParkingPassManage} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    const getHourInTimezone = (timezone: string) => {
      const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: timezone,
      });
      return Number(formatter.format(new Date()));
    };

    const applyTheme = () => {
      const manual = document.documentElement.dataset.themeOverride;
      if (manual) {
        document.documentElement.dataset.theme = manual;
        document.documentElement.dataset.contrast =
          manual === "day" ? "light" : "dark";
        document.documentElement.style.removeProperty("--bg-app-dynamic");
        return;
      }
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const hour = getHourInTimezone(timezone);

      const palettes = {
        morning: { top: [233, 214, 194], bottom: [200, 171, 144] },
        midday: { top: [228, 210, 190], bottom: [196, 170, 143] },
        night: { top: [28, 26, 24], bottom: [28, 26, 24] },
      };

      const lerp = (a: number, b: number, t: number) =>
        Math.round(a + (b - a) * t);

      const lerpColor = (c1: number[], c2: number[], t: number) =>
        `rgb(${lerp(c1[0], c2[0], t)}, ${lerp(c1[1], c2[1], t)}, ${lerp(
          c1[2],
          c2[2],
          t
        )})`;

      const getProgress = (h: number, start: number, end: number) =>
        Math.min(1, Math.max(0, (h - start) / (end - start)));

      let from = palettes.morning;
      let to = palettes.midday;
      let t = 0;

      if (hour < 12) {
        from = palettes.morning;
        to = palettes.midday;
        t = getProgress(hour, 7, 12);
      } else if (hour < 21) {
        from = palettes.midday;
        to = palettes.night;
        t = getProgress(hour, 12, 21);
      } else {
        from = palettes.night;
        to = palettes.night;
        t = 1;
      }

      const bgTop = lerpColor(from.top, to.top, t);
      const bgBottom = lerpColor(from.bottom, to.bottom, t);
      document.documentElement.style.setProperty(
        "--bg-app-dynamic",
        `linear-gradient(180deg, ${bgTop} 0%, ${bgBottom} 70%)`
      );

      const nightFactor =
        hour >= 16 ? Math.min(1, (hour - 16) / 5) : 0;
      document.documentElement.style.setProperty(
        "--bg-texture-opacity",
        `${0.01 + nightFactor * 0.02}`
      );

      const contrast =
        hour >= 7 && hour < 11 ? "light" : hour >= 11 && hour < 17 ? "mid" : "dark";
      document.documentElement.dataset.contrast = contrast;
      document.documentElement.dataset.theme = "evening";
    };

    const scheduleNextUpdate = () => {
      const now = new Date();
      const msUntilNextHour =
        (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000;
      window.setTimeout(() => {
        applyTheme();
        scheduleNextUpdate();
      }, Math.max(msUntilNextHour, 1000));
    };

    applyTheme();
    scheduleNextUpdate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="desktop-full-width app-background min-h-screen md:pt-16">
          <Toaster />
          <BetaDisclaimer />
          <Router />
          <Navigation />
          <ThemePreviewToggle />
          {/* Build canary - shows deployment timestamp */}
          {import.meta.env.PROD && (
            <div
              style={{
                position: "fixed",
                bottom: 4,
                right: 6,
                fontSize: 10,
                opacity: 0.4,
                zIndex: 99999,
                pointerEvents: "none",
                fontFamily: "monospace",
              }}
            >
              {typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev"}
            </div>
          )}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function ThemePreviewToggle() {
  const { user } = useAuth();
  if (user?.userType !== "super_admin") return null;

  const applyAutoTheme = () => {
    const getHourInTimezone = (timezone: string) => {
      const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: timezone,
      });
      return Number(formatter.format(new Date()));
    };

    const getThemeByHour = (hour: number) => {
      if (hour >= 16 && hour < 21) return "evening";
      if (hour >= 21 || hour < 7) return "overnight";
      return "day";
    };

    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const hour = getHourInTimezone(timezone);
    const theme = getThemeByHour(hour);
    delete document.documentElement.dataset.themeOverride;
    document.documentElement.dataset.theme = theme;
  };

  return (
    <div className="fixed bottom-20 right-4 z-[100000] bg-[hsl(var(--surface))] border border-white/10 rounded-xl px-3 py-2 shadow-lg">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
        Theme Preview
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 rounded-md bg-[hsl(var(--surface-hover))] text-xs text-foreground"
          onClick={() => {
            document.documentElement.dataset.themeOverride = "day";
            document.documentElement.dataset.theme = "day";
            document.documentElement.dataset.contrast = "light";
          }}
        >
          Day
        </button>
        <button
          className="px-2 py-1 rounded-md bg-[hsl(var(--surface-hover))] text-xs text-foreground"
          onClick={() => {
            document.documentElement.dataset.themeOverride = "evening";
            document.documentElement.dataset.theme = "evening";
            document.documentElement.dataset.contrast = "dark";
          }}
        >
          Evening
        </button>
        <button
          className="px-2 py-1 rounded-md bg-[hsl(var(--surface-hover))] text-xs text-foreground"
          onClick={() => {
            document.documentElement.dataset.themeOverride = "overnight";
            document.documentElement.dataset.theme = "overnight";
            document.documentElement.dataset.contrast = "dark";
          }}
        >
          Overnight
        </button>
        <button
          className="px-2 py-1 rounded-md bg-[hsl(var(--primary))] text-xs text-[hsl(var(--primary-foreground))]"
          onClick={() => {
            applyAutoTheme();
          }}
        >
          Auto
        </button>
      </div>
    </div>
  );
}

export default App;
