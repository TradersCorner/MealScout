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
import { TimeOfDayBackground } from "@/components/TimeOfDayBackground";
// Eager load only critical pages (home, login) - everything else lazy loads
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
// Lazy load ALL pages including home for faster initial load
var Home = lazy(function () { return import("@/pages/home"); });
// Lazy load all other pages - they only download when the user navigates to them
var CustomerSignup = lazy(function () { return import("@/pages/customer-signup"); });
var RestaurantSignup = lazy(function () { return import("@/pages/restaurant-signup"); });
var CityLanding = lazy(function () { return import("@/pages/city-landing"); });
var DealCreation = lazy(function () { return import("@/pages/deal-creation"); });
var DealEdit = lazy(function () { return import("@/pages/deal-edit"); });
var DealDetail = lazy(function () { return import("@/pages/deal-detail"); });
var Subscribe = lazy(function () { return import("@/pages/subscribe"); });
var Search = lazy(function () { return import("@/pages/search"); });
var MapPage = lazy(function () { return import("@/pages/map"); });
var ReviewsPage = lazy(function () { return import("@/pages/reviews"); });
var Favorites = lazy(function () { return import("@/pages/favorites"); });
var Orders = lazy(function () { return import("@/pages/orders"); });
var Profile = lazy(function () { return import("@/pages/profile"); });
var AdminLogin = lazy(function () { return import("@/pages/admin-login"); });
var AdminDashboard = lazy(function () { return import("@/pages/admin-dashboard"); });
var StaffDashboard = lazy(function () { return import("@/pages/staff-dashboard"); });
var AdminIncidents = lazy(function () { return import("@/pages/AdminIncidents"); });
var AdminControlCenter = lazy(function () { return import("@/pages/AdminControlCenter"); });
var AdminSupportTickets = lazy(function () { return import("@/pages/AdminSupportTickets"); });
var AdminModerationEvents = lazy(function () { return import("@/pages/AdminModerationEvents"); });
var AdminModerationVideos = lazy(function () { return import("@/pages/admin-moderation-videos"); });
var AdminModerationMetrics = lazy(function () { return import("@/pages/admin-moderation-metrics"); });
var AdminModerationAppeals = lazy(function () { return import("@/pages/admin-moderation-appeals"); });
var AdminAuditLogs = lazy(function () { return import("@/pages/AdminAuditLogs"); });
var AdminTelemetry = lazy(function () { return import("@/pages/admin-telemetry"); });
var AdminAffiliateManagement = lazy(function () { return import("@/pages/AdminAffiliateManagement"); });
var AdminGeoAds = lazy(function () { return import("@/pages/admin-geo-ads"); });
var AffiliateEarnings = lazy(function () { return import("@/pages/AffiliateEarnings"); });
var EmptyCountyExperience = lazy(function () { return import("@/pages/EmptyCountyExperience"); });
var CategoryPage = lazy(function () { return import("@/pages/category"); });
var FeaturedDealsPage = lazy(function () { return import("@/pages/deals-featured"); });
var RestaurantDetail = lazy(function () { return import("@/pages/restaurant-detail"); });
var NotificationsPage = lazy(function () { return import("@/pages/profile/notifications"); });
var SettingsPage = lazy(function () { return import("@/pages/profile/settings"); });
var AddressesPage = lazy(function () { return import("@/pages/profile/addresses"); });
var PaymentMethodsPage = lazy(function () { return import("@/pages/profile/payment"); });
var HelpSupportPage = lazy(function () { return import("@/pages/profile/help"); });
var RestaurantOwnerDashboard = lazy(function () { return import("@/pages/restaurant-owner-dashboard"); });
var UserDashboard = lazy(function () { return import("@/pages/user-dashboard"); });
var DashboardSwitcher = lazy(function () { return import("@/components/dashboard-switcher"); });
var TermsOfService = lazy(function () { return import("@/pages/terms-of-service"); });
var PrivacyPolicy = lazy(function () { return import("@/pages/privacy-policy"); });
var DataDeletion = lazy(function () { return import("@/pages/data-deletion"); });
var About = lazy(function () { return import("@/pages/about"); });
var FAQ = lazy(function () { return import("@/pages/faq"); });
var HowItWorks = lazy(function () { return import("@/pages/how-it-works"); });
var Contact = lazy(function () { return import("@/pages/contact"); });
var Sitemap = lazy(function () { return import("@/pages/sitemap"); });
var ForgotPassword = lazy(function () { return import("@/pages/forgot-password"); });
var ResetPassword = lazy(function () { return import("@/pages/reset-password"); });
var AccountSetup = lazy(function () { return import("@/pages/account-setup"); });
var OAuthSetupGuide = lazy(function () { return import("@/pages/oauth-setup-guide"); });
var GoldenPlateWinners = lazy(function () { return import("@/pages/golden-plate-winners"); });
var ParkingPassPage = lazy(function () { return import("@/pages/parking-pass"); });
var ParkingPassManage = lazy(function () { return import("@/pages/parking-pass-manage"); });
var StatusPage = lazy(function () { return import("@/pages/status"); });
var HostSignup = lazy(function () { return import("@/pages/host-signup"); });
var HostDashboard = lazy(function () { return import("@/pages/host-dashboard"); });
var EventCoordinatorDashboard = lazy(function () { return import("@/pages/event-coordinator-dashboard"); });
var DashboardRouter = lazy(function () { return import("@/pages/dashboard-router"); });
var TruckDiscovery = lazy(function () { return import("@/pages/truck-discovery"); });
var EventSignup = lazy(function () { return import("@/pages/event-signup"); });
var EventsPage = lazy(function () { return import("@/pages/events"); });
var EventsRouter = lazy(function () { return import("@/pages/events-router"); });
var ForRestaurants = lazy(function () { return import("@/pages/for-restaurants"); });
var ForBars = lazy(function () { return import("@/pages/for-bars"); });
var ForHosts = lazy(function () { return import("@/pages/for-hosts"); });
var ForEvents = lazy(function () { return import("@/pages/for-events"); });
var FindFood = lazy(function () { return import("@/pages/find-food"); });
var VideoPage = lazy(function () { return import("@/pages/video"); });
var VideoDetailPage = lazy(function () { return import("@/pages/video-detail"); });
var ChangePassword = lazy(function () { return import("@/pages/change-password"); });
var TruckLanding = lazy(function () { return import("@/pages/truck-landing"); });
// Loading fallback component
var PageLoader = function () { return (<div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
  </div>); };
// Wrapper component to handle route props
function DashboardSwitcherPage() {
    var urlParams = new URLSearchParams(window.location.search);
    var view = urlParams.get("view");
    return <DashboardSwitcher defaultView={view || "admin"}/>;
}
function Router() {
    var _a = useAuth(), authState = _a.authState, isAuthenticated = _a.isAuthenticated;
    var location = useLocation()[0];
    var _b = useState(""), affiliateTag = _b[0], setAffiliateTag = _b[1];
    useEffect(function () {
        if (!isAuthenticated) {
            setAffiliateTag("");
            return;
        }
        var cancelled = false;
        fetch(apiUrl("/api/affiliate/tag"), { credentials: "include" })
            .then(function (res) { return (res.ok ? res.json() : null); })
            .then(function (data) {
            if (cancelled)
                return;
            if (data === null || data === void 0 ? void 0 : data.tag)
                setAffiliateTag(data.tag);
        })
            .catch(function () { });
        return function () {
            cancelled = true;
        };
    }, [isAuthenticated]);
    useEffect(function () {
        if (!affiliateTag)
            return;
        if (typeof window === "undefined")
            return;
        var url = new URL(window.location.href);
        if (url.pathname.startsWith("/ref/"))
            return;
        if (url.searchParams.has("ref"))
            return;
        url.searchParams.set("ref", affiliateTag);
        window.history.replaceState({}, "", url.toString());
    }, [affiliateTag, location]);
    // Canonical guard: never redirect until authState resolves
    if (authState === "loading") {
        return <PageLoader />;
    }
    return (<Suspense fallback={<PageLoader />}>
      <Switch>
        {!isAuthenticated ? (<>
            <Route path="/" component={Home}/>
            <Route path="/login" component={Login}/>
            <Route path="/customer-signup" component={CustomerSignup}/>
            <Route path="/restaurant-signup" component={RestaurantSignup}/>
            <Route path="/deal-creation" component={DealCreation}/>
            <Route path="/deal/:id" component={DealDetail}/>
            <Route path="/search" component={Search}/>
            <Route path="/map" component={MapPage}/>
            <Route path="/video" component={VideoPage}/>
            <Route path="/video/:id" component={VideoDetailPage}/>
            <Route path="/category/:category" component={CategoryPage}/>
            <Route path="/deals" component={FeaturedDealsPage}/>
            <Route path="/deals/featured" component={FeaturedDealsPage}/>
            <Route path="/restaurant/:id" component={RestaurantDetail}/>
            <Route path="/terms-of-service" component={TermsOfService}/>
            <Route path="/privacy-policy" component={PrivacyPolicy}/>
            <Route path="/data-deletion" component={DataDeletion}/>
            <Route path="/about" component={About}/>
            <Route path="/faq" component={FAQ}/>
            <Route path="/how-it-works" component={HowItWorks}/>
            <Route path="/contact" component={Contact}/>
            <Route path="/host-signup" component={HostSignup}/>
            <Route path="/for-restaurants" component={ForRestaurants}/>
            <Route path="/for-bars" component={ForBars}/>
            <Route path="/for-hosts" component={ForHosts}/>
            <Route path="/for-events" component={ForEvents}/>
            <Route path="/find-food" component={FindFood}/>
            <Route path="/event-signup" component={EventSignup}/>
            <Route path="/events" component={EventsRouter}/>
            <Route path="/events/public" component={EventsPage}/>
            <Route path="/dashboard" component={DashboardRouter}/>
            <Route path="/food-trucks/:citySlug" component={CityLanding}/>
            <Route path="/truck-landing" component={TruckLanding}/>
            <Route path="/sitemap" component={Sitemap}/>
            <Route path="/status" component={StatusPage}/>
            <Route path="/golden-plate-winners" component={GoldenPlateWinners}/>
            <Route path="/parking-pass" component={ParkingPassPage}/>
            <Route path="/forgot-password" component={ForgotPassword}/>
            <Route path="/reset-password" component={ResetPassword}/>
            <Route path="/change-password" component={ChangePassword}/>
            <Route path="/account-setup" component={AccountSetup}/>
            <Route path="/admin" component={AdminLogin}/>
            <Route path="/admin/login" component={AdminLogin}/>
          </>) : (<>
            <Route path="/" component={Home}/>
            <Route path="/login" component={Login}/>
            <Route path="/customer-signup" component={CustomerSignup}/>
            <Route path="/restaurant-signup" component={RestaurantSignup}/>
            <Route path="/deal-creation" component={DealCreation}/>
            <Route path="/deal-edit/:dealId" component={DealEdit}/>
            <Route path="/deal/:id" component={DealDetail}/>
            <Route path="/subscribe" component={Subscribe}/>
            <Route path="/subscription" component={Subscribe}/>
            <Route path="/subscription/manage" component={Subscribe}/>
            <Route path="/restaurant-owner-dashboard" component={RestaurantOwnerDashboard}/>
            <Route path="/restaurant/dashboard" component={RestaurantOwnerDashboard}/>
            <Route path="/dashboard" component={DashboardRouter}/>
            <Route path="/user-dashboard" component={UserDashboard}/>
        <Route path="/host/dashboard" component={HostDashboard}/>
        <Route path="/event-coordinator/dashboard" component={EventCoordinatorDashboard}/>
            <Route path="/truck-discovery" component={TruckDiscovery}/>
            <Route path="/for-restaurants" component={ForRestaurants}/>
            <Route path="/for-bars" component={ForBars}/>
            <Route path="/for-hosts" component={ForHosts}/>
            <Route path="/for-events" component={ForEvents}/>
            <Route path="/find-food" component={FindFood}/>
            <Route path="/search" component={Search}/>
            <Route path="/map" component={MapPage}/>
            <Route path="/video" component={VideoPage}/>
            <Route path="/favorites" component={Favorites}/>
            <Route path="/orders" component={Orders}/>
            <Route path="/profile" component={Profile}/>
            <Route path="/affiliate/earnings" component={AffiliateEarnings}/>
            <Route path="/staff" component={StaffDashboard}/>
            <Route path="/admin" component={AdminLogin}/>
            <Route path="/admin/dashboard" component={AdminDashboard}/>
            <Route path="/admin/incidents" component={AdminIncidents}/>
            <Route path="/admin/control-center" component={AdminControlCenter}/>
            <Route path="/admin/tickets" component={AdminSupportTickets}/>
            <Route path="/admin/moderation" component={AdminModerationEvents}/>
            <Route path="/admin/moderation/videos" component={AdminModerationVideos}/>
            <Route path="/admin/moderation/metrics" component={AdminModerationMetrics}/>
            <Route path="/admin/moderation/appeals" component={AdminModerationAppeals}/>
            <Route path="/admin/audit-logs" component={AdminAuditLogs}/>
            <Route path="/admin/telemetry" component={AdminTelemetry}/>
            <Route path="/admin/geo-ads" component={AdminGeoAds}/>
            <Route path="/admin/affiliates" component={AdminAffiliateManagement}/>
            <Route path="/admin/switcher" component={DashboardSwitcherPage}/>
            <Route path="/category/:category" component={CategoryPage}/>
            <Route path="/deals" component={FeaturedDealsPage}/>
            <Route path="/deals/featured" component={FeaturedDealsPage}/>
            <Route path="/restaurant/:id" component={RestaurantDetail}/>
            <Route path="/terms-of-service" component={TermsOfService}/>
            <Route path="/privacy-policy" component={PrivacyPolicy}/>
            <Route path="/data-deletion" component={DataDeletion}/>
            <Route path="/about" component={About}/>
            <Route path="/faq" component={FAQ}/>
            <Route path="/how-it-works" component={HowItWorks}/>
            <Route path="/contact" component={Contact}/>
            <Route path="/host-signup" component={HostSignup}/>
            <Route path="/event-signup" component={EventSignup}/>
            <Route path="/events" component={EventsRouter}/>
            <Route path="/events/public" component={EventsPage}/>
            <Route path="/sitemap" component={Sitemap}/>
            <Route path="/truck-landing" component={TruckLanding}/>
            <Route path="/status" component={StatusPage}/>
            <Route path="/forgot-password" component={ForgotPassword}/>
            <Route path="/reset-password" component={ResetPassword}/>
            <Route path="/change-password" component={ChangePassword}/>
            <Route path="/account-setup" component={AccountSetup}/>
            <Route path="/admin/login" component={AdminLogin}/>
            <Route path="/admin/oauth-setup" component={OAuthSetupGuide}/>
            <Route path="/profile/notifications" component={NotificationsPage}/>
            <Route path="/profile/settings" component={SettingsPage}/>
            <Route path="/settings" component={SettingsPage}/>
            <Route path="/profile/addresses" component={AddressesPage}/>
            <Route path="/profile/payment" component={PaymentMethodsPage}/>
            <Route path="/profile/help" component={HelpSupportPage}/>
            <Route path="/restaurant/:restaurantId/reviews" component={ReviewsPage}/>
            <Route path="/parking-pass" component={ParkingPassPage}/>
            <Route path="/parking-pass-manage" component={ParkingPassManage}/>
          </>)}
        <Route component={NotFound}/>
      </Switch>
    </Suspense>);
}
function App() {
    return (<QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TimeOfDayBackground />
        <div className="desktop-full-width app-background app-content min-h-screen md:pt-16 relative z-10">
          <Toaster />
          <BetaDisclaimer />
          <Router />
          <Navigation />
          {/* Build canary - shows deployment timestamp */}
          {import.meta.env.PROD && (<div style={{
                position: "fixed",
                bottom: 4,
                right: 6,
                fontSize: 10,
                opacity: 0.4,
                zIndex: 99999,
                pointerEvents: "none",
                fontFamily: "monospace",
            }}>
              {typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev"}
            </div>)}
        </div>
      </TooltipProvider>
    </QueryClientProvider>);
}
export default App;
