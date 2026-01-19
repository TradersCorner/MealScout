import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";
import { BetaDisclaimer } from "@/components/beta-disclaimer";
import Navigation from "@/components/navigation";

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
const TruckDiscovery = lazy(() => import("@/pages/truck-discovery"));
const EventSignup = lazy(() => import("@/pages/event-signup"));
const EventsPage = lazy(() => import("@/pages/events"));
const ForFoodTrucks = lazy(() => import("@/pages/for-food-trucks"));
const ForRestaurants = lazy(() => import("@/pages/for-restaurants"));
const ForBars = lazy(() => import("@/pages/for-bars"));
const HostFood = lazy(() => import("@/pages/host-food"));
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
            <Route path="/host-food" component={HostFood} />
            <Route path="/for-food-trucks" component={ForFoodTrucks} />
            <Route path="/for-restaurants" component={ForRestaurants} />
            <Route path="/for-bars" component={ForBars} />
            <Route path="/find-food" component={FindFood} />
            <Route path="/event-signup" component={EventSignup} />
            <Route path="/events" component={EventsPage} />
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
            <Route path="/user-dashboard" component={UserDashboard} />
        <Route path="/host/dashboard" component={HostDashboard} />
        <Route
          path="/event-coordinator/dashboard"
          component={EventCoordinatorDashboard}
        />
            <Route path="/truck-discovery" component={TruckDiscovery} />
            <Route path="/for-food-trucks" component={ForFoodTrucks} />
            <Route path="/for-restaurants" component={ForRestaurants} />
            <Route path="/for-bars" component={ForBars} />
            <Route path="/host-food" component={HostFood} />
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BetaDisclaimer />
        <Router />
        <Navigation />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
