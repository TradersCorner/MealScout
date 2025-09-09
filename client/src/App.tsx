import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import RestaurantSignup from "@/pages/restaurant-signup";
import DealCreation from "@/pages/deal-creation";
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
import SubscriptionManagement from "@/pages/subscription-management";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/restaurant-signup" component={RestaurantSignup} />
          <Route path="/deal-creation" component={DealCreation} />
          <Route path="/deal/:id" component={DealDetail} />
          <Route path="/admin" component={AdminLogin} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/restaurant-signup" component={RestaurantSignup} />
          <Route path="/deal-creation" component={DealCreation} />
          <Route path="/deal/:id" component={DealDetail} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/subscription" component={SubscriptionManagement} />
          <Route path="/search" component={Search} />
          <Route path="/map" component={MapPage} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/orders" component={Orders} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/category/:category" component={CategoryPage} />
          <Route path="/deals/featured" component={FeaturedDealsPage} />
          <Route path="/restaurant/:id" component={RestaurantDetail} />
          <Route path="/profile/notifications" component={NotificationsPage} />
          <Route path="/profile/settings" component={SettingsPage} />
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
