import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import CustomerSignup from "@/pages/customer-signup";
import Home from "@/pages/home-north-star";
import RestaurantSignup from "@/pages/restaurant-signup";
import DealCreation from "@/pages/deal-creation";
import DealEdit from "@/pages/deal-edit";
import DealDetail from "@/pages/deal-detail";
import Subscribe from "@/pages/subscribe";
import Search from "@/pages/search";
import MapPage from "@/pages/map";
import ReviewsPage from "@/pages/reviews";
import Favorites from "@/pages/favorites";
import Orders from "@/pages/orders";
import Profile from "@/pages/profile";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import StaffDashboard from "@/pages/staff-dashboard";
import AdminIncidents from "@/pages/AdminIncidents";
import AdminControlCenter from "@/pages/AdminControlCenter";
import AdminSupportTickets from "@/pages/AdminSupportTickets";
import AdminModerationEvents from "@/pages/AdminModerationEvents";
import AdminModerationVideos from "@/pages/admin-moderation-videos";
import AdminModerationMetrics from "@/pages/admin-moderation-metrics";
import AdminModerationAppeals from "@/pages/admin-moderation-appeals";
import AdminAuditLogs from "@/pages/AdminAuditLogs";
import AdminTelemetry from "@/pages/admin-telemetry";
import AffiliateEarnings from "@/pages/AffiliateEarnings";
import EmptyCountyExperience from "@/pages/EmptyCountyExperience";
import CategoryPage from "@/pages/category";
import FeaturedDealsPage from "@/pages/deals-featured";
import RestaurantDetail from "@/pages/restaurant-detail";
import NotificationsPage from "@/pages/profile/notifications";
import SettingsPage from "@/pages/profile/settings";
import AddressesPage from "@/pages/profile/addresses";
import PaymentMethodsPage from "@/pages/profile/payment";
import HelpSupportPage from "@/pages/profile/help";
import RestaurantOwnerDashboard from "@/pages/restaurant-owner-dashboard";
import UserDashboard from "@/pages/user-dashboard";
import DashboardSwitcher from "@/components/dashboard-switcher";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import DataDeletion from "@/pages/data-deletion";
import About from "@/pages/about";
import FAQ from "@/pages/faq";
import HowItWorks from "@/pages/how-it-works";
import Contact from "@/pages/contact";
import Sitemap from "@/pages/sitemap";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import OAuthSetupGuide from "@/pages/oauth-setup-guide";
import GoldenPlateWinners from "@/pages/golden-plate-winners";
import ParkingPassPage from "@/pages/parking-pass";
import HostSignup from "@/pages/host-signup";
import HostDashboard from "@/pages/host-dashboard";
import TruckDiscovery from "@/pages/truck-discovery";
import EventSignup from "@/pages/event-signup";
import ForFoodTrucks from "@/pages/for-food-trucks";
import ForRestaurants from "@/pages/for-restaurants";
import ForBars from "@/pages/for-bars";
import HostFood from "@/pages/host-food";
import FindFood from "@/pages/find-food";
import { BetaDisclaimer } from "@/components/beta-disclaimer";
import VideoPage from "@/pages/video";
import VideoDetailPage from "@/pages/video-detail";
import ChangePassword from "@/pages/change-password";

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/welcome" component={Landing} />
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
          <Route path="/sitemap" component={Sitemap} />
          <Route path="/golden-plate-winners" component={GoldenPlateWinners} />
          <Route path="/parking-pass" component={ParkingPassPage} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/change-password" component={ChangePassword} />
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
          <Route path="/admin/control-center" component={AdminControlCenter} />
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
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/change-password" component={ChangePassword} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/oauth-setup" component={OAuthSetupGuide} />
          <Route path="/profile/notifications" component={NotificationsPage} />
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
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BetaDisclaimer />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
