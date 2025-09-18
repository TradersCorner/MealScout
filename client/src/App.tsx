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
import Home from "@/pages/home";
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

// Wrapper component to handle route props
function DashboardSwitcherPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get('view') as 'admin' | 'user' | 'restaurant' | null;
  return <DashboardSwitcher defaultView={view || 'admin'} />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while authentication is being determined
  if (isLoading) {
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
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/customer-signup" component={CustomerSignup} />
          <Route path="/restaurant-signup" component={RestaurantSignup} />
          <Route path="/deal-creation" component={DealCreation} />
          <Route path="/deal/:id" component={DealDetail} />
          <Route path="/search" component={Search} />
          <Route path="/map" component={MapPage} />
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
          <Route path="/sitemap" component={Sitemap} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/admin" component={AdminLogin} />
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
          <Route path="/restaurant-owner-dashboard" component={RestaurantOwnerDashboard} />
          <Route path="/restaurant/dashboard" component={RestaurantOwnerDashboard} />
          <Route path="/user-dashboard" component={UserDashboard} />
          <Route path="/search" component={Search} />
          <Route path="/map" component={MapPage} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/orders" component={Orders} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
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
          <Route path="/sitemap" component={Sitemap} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/profile/notifications" component={NotificationsPage} />
          <Route path="/profile/settings" component={SettingsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/profile/addresses" component={AddressesPage} />
          <Route path="/profile/payment" component={PaymentMethodsPage} />
          <Route path="/profile/help" component={HelpSupportPage} />
          <Route path="/restaurant/:restaurantId/reviews" component={ReviewsPage} />
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
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
