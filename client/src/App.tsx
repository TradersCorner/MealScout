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
import Favorites from "@/pages/favorites";
import Orders from "@/pages/orders";
import Profile from "@/pages/profile";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/restaurant-signup" component={RestaurantSignup} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/restaurant-signup" component={RestaurantSignup} />
          <Route path="/deal-creation" component={DealCreation} />
          <Route path="/deal/:id" component={DealDetail} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/search" component={Search} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/orders" component={Orders} />
          <Route path="/profile" component={Profile} />
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
