var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import DealCard from "@/components/deal-card";
import Navigation from "@/components/navigation";
import SmartSearch from "@/components/smart-search";
import WelcomeLocationModal from "@/components/WelcomeLocationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Truck, ChefHat, Target, Heart, Bell, LogIn, UserPlus, Store, } from "lucide-react";
import mealScoutLogo from "@assets/meal-scout-icon.png";
import { useFoodTruckSocket } from "@/hooks/useFoodTruckSocket";
import { getReverseGeocodedLocationName } from "@/utils/locationUtils";
import { sendGeoPing, trackGeoAdEvent, trackGeoAdImpression } from "@/utils/geoAds";
// Version marker for deployment verification
console.log("MealScout Client Loaded - Build: " + new Date().toISOString());
export default function Home() {
    var _this = this;
    var _a, _b, _c, _d;
    var user = useAuth().user;
    var _e = useState(null), location = _e[0], setLocation = _e[1];
    var _f = useState("Your Location"), locationName = _f[0], setLocationName = _f[1];
    var _g = useState(null), locationError = _g[0], setLocationError = _g[1];
    var _h = useState(false), isLoadingLocation = _h[0], setIsLoadingLocation = _h[1];
    var _j = useState(""), manualLocation = _j[0], setManualLocation = _j[1];
    var _k = useState(""), searchQuery = _k[0], setSearchQuery = _k[1];
    var _l = useLocation(), setNavigateTo = _l[1];
    var _m = useState(false), showWelcomeModal = _m[0], setShowWelcomeModal = _m[1];
    var _o = useFoodTruckSocket(), isConnected = _o.isConnected, subscribeToNearby = _o.subscribeToNearby;
    // Show welcome modal only for anonymous users; auto-detect for logged-in users
    useEffect(function () {
        var hasSeenWelcome = sessionStorage.getItem("mealscout_welcome_seen");
        if (user) {
            // Logged-in: skip welcome modal and auto-detect location silently
            setShowWelcomeModal(false);
            if (!location) {
                setIsLoadingLocation(true);
                handleLocationDetection();
            }
            return;
        }
        if (!hasSeenWelcome && !location) {
            setShowWelcomeModal(true);
        }
    }, [user, location]);
    var handleLocationDetection = function () { return __awaiter(_this, void 0, void 0, function () {
        var position, newLocation, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!navigator.geolocation) return [3 /*break*/, 6];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                                enableHighAccuracy: true,
                                timeout: 8000,
                                maximumAge: 0,
                            });
                        })];
                case 2:
                    position = _a.sent();
                    newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setLocation(newLocation);
                    setLocationError(null);
                    return [4 /*yield*/, getReverseGeocodedLocationName(newLocation.lat, newLocation.lng, setLocationName)];
                case 3:
                    _a.sent();
                    queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });
                    if (isConnected) {
                        subscribeToNearby(newLocation.lat, newLocation.lng, 5000);
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    setLocationError("Unable to detect location automatically. Please set your location.");
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoadingLocation(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleLocationUpdate = function (newLocation) {
        setLocation(newLocation);
        setLocationError(null);
        queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });
    };
    var handleLocationNameUpdate = function (name) {
        setLocationName(name);
    };
    var handleLocationErrorUpdate = function (error) {
        setLocationError(error);
        setIsLoadingLocation(false);
    };
    var handleManualLocation = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, newLocation, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!manualLocation.trim())
                        return [2 /*return*/];
                    setIsLoadingLocation(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("https://nominatim.openstreetmap.org/search?format=json&q=".concat(encodeURIComponent(manualLocation), "&limit=1"))];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (data && data[0]) {
                        newLocation = {
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon),
                        };
                        setLocation(newLocation);
                        setLocationName(data[0].display_name);
                        setLocationError(null);
                        queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });
                    }
                    else {
                        setLocationError("Could not find that location. Please try a different city name.");
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    setLocationError("Failed to search for location. Please try again.");
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoadingLocation(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var retryLocation = function () {
        setLocationError(null);
        setIsLoadingLocation(true);
        handleLocationDetection();
    };
    var handleWelcomeLocationSet = function (newLocation, name) {
        setLocation(newLocation);
        setLocationName(name);
        setLocationError(null);
        sessionStorage.setItem("mealscout_welcome_seen", "true");
        setShowWelcomeModal(false);
        queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });
        if (isConnected) {
            subscribeToNearby(newLocation.lat, newLocation.lng, 5000);
        }
    };
    var handleWelcomeSkip = function () {
        sessionStorage.setItem("mealscout_welcome_seen", "true");
        setShowWelcomeModal(false);
    };
    var _p = useQuery({
        queryKey: ["/api/deals/featured"],
        queryFn: function () {
            return fetch(apiUrl("/api/deals/featured"), { credentials: "include" }).then(function (res) { return res.json(); });
        },
    }), featuredDeals = _p.data, featuredLoading = _p.isLoading, featuredError = _p.isError;
    var sortedFeaturedDeals = featuredDeals
        ? __spreadArray([], featuredDeals, true).sort(function (a, b) {
            var _a, _b;
            var aDistance = (_a = a.distance) !== null && _a !== void 0 ? _a : Number.POSITIVE_INFINITY;
            var bDistance = (_b = b.distance) !== null && _b !== void 0 ? _b : Number.POSITIVE_INFINITY;
            return aDistance - bDistance;
        })
        : [];
    var _q = useQuery({
        queryKey: ["/api/geo-ads", "home", location === null || location === void 0 ? void 0 : location.lat, location === null || location === void 0 ? void 0 : location.lng],
        enabled: !!location,
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!location)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, fetch("/api/geo-ads?placement=home&lat=".concat(location.lat, "&lng=").concat(location.lng, "&limit=1"), { credentials: "include" })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            return [2 /*return*/, []];
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
    }).data, geoAds = _q === void 0 ? [] : _q;
    useEffect(function () {
        if (!location)
            return;
        sendGeoPing({ lat: location.lat, lng: location.lng, source: "home" });
    }, [location === null || location === void 0 ? void 0 : location.lat, location === null || location === void 0 ? void 0 : location.lng]);
    useEffect(function () {
        if (!geoAds.length)
            return;
        geoAds.forEach(function (ad) {
            return trackGeoAdImpression({ adId: ad.id, placement: "home" });
        });
    }, [geoAds]);
    var shortLocation = (locationName === null || locationName === void 0 ? void 0 : locationName.split(",")[0]) || "your area";
    var firstName = ((_a = user === null || user === void 0 ? void 0 : user.firstName) === null || _a === void 0 ? void 0 : _a.trim()) ||
        ((_d = (_c = (_b = user === null || user === void 0 ? void 0 : user.name) === null || _b === void 0 ? void 0 : _b.split) === null || _c === void 0 ? void 0 : _c.call(_b, " ")) === null || _d === void 0 ? void 0 : _d[0]) ||
        "";
    var welcomeName = firstName || "there";
    var handleGeoAdClick = function (ad) {
        trackGeoAdEvent({ adId: ad.id, eventType: "click", placement: "home" });
        window.open(ad.targetUrl, "_blank", "noopener,noreferrer");
    };
    return (<div className="page relative overflow-hidden home-cinematic">
      <Navigation />

      {/* Header with Logo and Navigation */}
      <header className="section section--full bg-[hsl(var(--surface))]/85 backdrop-blur-md border-b border-[color:var(--border-subtle)] sticky top-0 z-10 shadow-sm">
        <div className="content flex items-center justify-between py-3">
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-14 h-14 flex items-center justify-center overflow-hidden">
              <img src={mealScoutLogo} alt="MealScout Logo" className="w-full h-full object-contain object-center" loading="lazy" decoding="async"/>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!user ? (<>
                <Button variant="ghost" size="icon" onClick={function () { return setNavigateTo("/login"); }} className="text-primary hover:text-[color:var(--accent-text-hover)]" title="Login">
                  <LogIn className="w-5 h-5"/>
                </Button>
                <Button variant="ghost" size="icon" onClick={function () { return setNavigateTo("/customer-signup"); }} className="text-primary hover:text-[color:var(--accent-text-hover)]" title="Customer Sign Up">
                  <UserPlus className="w-5 h-5"/>
                </Button>
                <Button variant="ghost" size="icon" onClick={function () {
                return setNavigateTo("/customer-signup?role=business");
            }} className="text-primary hover:text-[color:var(--accent-text-hover)]" title="Restaurant/Bar/Food Truck Sign Up">
                  <Store className="w-5 h-5"/>
                </Button>
                <Button variant="ghost" size="icon" onClick={retryLocation} disabled={isLoadingLocation} className="text-primary hover:text-[color:var(--accent-text-hover)]" title="Refresh Location">
                  {isLoadingLocation ? (<div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"/>) : (<Target className="w-4 h-4"/>)}
                </Button>
              </>) : (<div className="flex items-center space-x-2">
                <span className="hidden sm:inline text-sm font-medium text-secondary">
                  {locationName.split(",")[0]}
                </span>
                <div className="w-2 h-2 rounded-full bg-emerald-500" title="Real-time location active"/>
                <Button variant="ghost" size="icon" onClick={retryLocation} disabled={isLoadingLocation} className="text-primary hover:text-[color:var(--accent-text-hover)] w-7 h-7" title="Refresh Location">
                  {isLoadingLocation ? (<div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"/>) : (<Target className="w-3.5 h-3.5"/>)}
                </Button>
              </div>)}
          </div>
        </div>
      </header>

      {/* Hero & Search Section */}
      <section className="section section--full section--surface border-b border-[color:var(--border-subtle)] py-4">
        <div className="content">
          <div className="home-hero-panel">
            <div className="mb-3">
              <h2 className="hero-title text-xl mb-1">
                {firstName ? "Hey ".concat(firstName, ", hungry?") : "Hungry?"}
              </h2>
              <p className="hero-subtitle text-sm">
                See what's happening{" "}
                {shortLocation === "Your Location"
            ? "near you"
            : "in ".concat(shortLocation)}
                . Fresh deals and local favorites.
              </p>
            </div>

            <SmartSearch value={searchQuery} onChange={setSearchQuery} onSearch={function (query) {
            return setNavigateTo("/search?q=".concat(encodeURIComponent(query)));
        }} className="mb-6 shadow-lg" placeholder="Search deals, restaurants..."/>

            {geoAds.length > 0 && (<div className="mb-5">
                {geoAds.map(function (ad) { return (<div key={ad.id} className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-4 shadow-sm">
                    {ad.mediaUrl && (<img src={ad.mediaUrl} alt={ad.title} className="w-full h-40 object-cover rounded-xl mb-3" loading="lazy" decoding="async"/>)}
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Sponsored
                    </div>
                    <div className="text-base font-semibold text-foreground mt-1">
                      {ad.title}
                    </div>
                    {ad.body && (<p className="text-sm text-muted-foreground mt-1">
                        {ad.body}
                      </p>)}
                    <div className="mt-3">
                      <Button size="sm" onClick={function () { return handleGeoAdClick(ad); }}>
                        {ad.ctaText || "Learn more"}
                      </Button>
                    </div>
                  </div>); })}
              </div>)}

            {/* Filter Chips */}
            <div className="flex space-x-2 overflow-x-auto pb-1">
              <Link href="/deals/featured">
                <Button className="filter-pill filter-pill--active flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all" size="sm">
                  <Sparkles className="w-4 h-4 mr-1.5"/> 🔥 Hot Deals
                </Button>
              </Link>
              <Link href="/category/pizza">
                <Button variant="outline" size="sm" className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium">
                  🍕 Pizza
                </Button>
              </Link>
              <Link href="/category/burgers">
                <Button variant="outline" size="sm" className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium">
                  🍔 Burgers
                </Button>
              </Link>
              <Link href="/category/sushi">
                <Button variant="outline" size="sm" className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium">
                  🍣 Sushi
                </Button>
              </Link>
              <Link href="/category/chinese">
                <Button variant="outline" size="sm" className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium">
                  🥡 Chinese
                </Button>
              </Link>
              <Link href="/category/mexican">
                <Button variant="outline" size="sm" className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium">
                  🌮 Tacos
                </Button>
              </Link>
              <Link href="/category/breakfast">
                <Button variant="outline" size="sm" className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium">
                  🥐 Breakfast
                </Button>
              </Link>
              <Link href="/category/seafood">
                <Button variant="outline" size="sm" className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium">
                  🦞 Seafood
                </Button>
              </Link>
              <Link href="/category/bbq">
                <Button variant="outline" size="sm" className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium">
                  🍖 BBQ
                </Button>
              </Link>
              <Link href="/category/dessert">
                <Button variant="outline" size="sm" className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium">
                  🍰 Desserts
                </Button>
              </Link>
              <Link href="/category/coffee">
                <Button variant="outline" size="sm" className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium">
                  ☕ Coffee
                </Button>
              </Link>
              <Link href="/category/healthy">
                <Button variant="outline" size="sm" className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium">
                  🥗 Healthy
                </Button>
              </Link>
            </div>

            {/* Manual location input (only when we don't have a location) */}
            {!location && !showWelcomeModal && (<div className="mt-4 w-full max-w-md">
                <div className="manual-location-shell">
                  <Input type="text" placeholder="Enter city or zip" value={manualLocation} onChange={function (e) { return setManualLocation(e.target.value); }} className="manual-location-input" onKeyPress={function (e) {
                return e.key === "Enter" && handleManualLocation();
            }}/>
                  <Button onClick={handleManualLocation} disabled={!manualLocation.trim() || isLoadingLocation} className="manual-location-button">
                    {isLoadingLocation ? "..." : "Go"}
                  </Button>
                </div>
                {locationError && (<p className="manual-location-error">{locationError}</p>)}
              </div>)}
          </div>
        </div>
      </section>

      {/* Food Trucks Nearby - Horizontal Scroll Row */}
      <section className="section section--full section--surface-2 border-y border-[color:var(--border-subtle)] py-4">
        <div className="content">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[color:var(--accent-text)]"/>
              <h3 className="text-sm font-bold text-foreground">
                Live Trucks:{" "}
                {shortLocation === "Your Location" ? "Nearby" : shortLocation}
              </h3>
            </div>
            <Link href="/map">
              <Button variant="link" className="text-[color:var(--accent-text)] hover:text-[color:var(--accent-text-hover)] p-0 h-auto text-xs">
                View Map →
              </Button>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
            {[1, 2, 3].map(function (i) { return (<div key={i} className="flex-shrink-0 w-56">
                <DealCard deal={{
                id: "truck-".concat(i),
                restaurantId: "truck-".concat(i),
                title: "Food Truck Deal",
                description: "Special lunch combo",
                dealType: "percentage",
                discountValue: "20",
                minOrderAmount: "10",
                restaurant: {
                    name: "Tasty Truck #".concat(i),
                    cuisineType: "Street Food",
                },
                distance: 0.3,
                currentUses: 45,
                isFeatured: false,
            }}/>
              </div>); })}
          </div>
        </div>
      </section>

      {/* Featured Deals Section - ORIGINAL LAYOUT */}
      <section className="section section--full border-y border-[color:var(--border-subtle)] py-4">
        <div className="content">
          <div className="mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center">
              <Sparkles className="w-4 h-4 text-[color:var(--accent-text)] mr-1.5"/>
              Trending in{" "}
              {shortLocation === "Your Location"
            ? "Your Neighborhood"
            : shortLocation}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fast-moving offers from spots around you
            </p>
            <Link href="/deals/featured">
              <Button variant="link" className="text-[color:var(--accent-text)] hover:text-[color:var(--accent-text-hover)] p-0 h-auto mt-1">
                See all nearby deals →
              </Button>
            </Link>
          </div>

          {featuredLoading ? (<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
              {[1, 2, 3].map(function (i) { return (<div key={i} className="flex-shrink-0 w-56 bg-[hsl(var(--surface-hover))]/60 rounded-lg h-48 animate-pulse"/>); })}
            </div>) : featuredError ? (<div className="text-center py-8 text-red-500 text-sm">
              We couldnt load deals right now. Try again in a bit.
            </div>) : sortedFeaturedDeals.length > 0 ? (<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
              {sortedFeaturedDeals.map(function (deal) { return (<div key={deal.id} className="flex-shrink-0 w-56">
                  <DealCard deal={deal}/>
                </div>); })}
            </div>) : (<div className="text-center py-8 text-muted-foreground">
              <p className="mb-3">No deals nearby yet</p>
              <Link href="/contact">
                <Button size="sm" variant="outline">
                  Recommend your favorite spot
                </Button>
              </Link>
            </div>)}
        </div>
      </section>

      {/* Owner Section - MOVED UP FOR LOGGED OUT USERS */}
      {!user && (<section className="section section--full section--surface-2 py-3 text-foreground">
          <div className="content text-center">
            <ChefHat className="w-6 h-6 mx-auto mb-1 text-[color:var(--accent-text)]"/>
            <h3 className="text-base font-bold mb-0.5">
              Bring your restaurant to the neighborhood
            </h3>
            <p className="text-secondary mb-2 text-xs">
              Post real-time deals, broadcast when you're open, reach people
              nearby
            </p>
            <Link href="/customer-signup?role=business">
              <Button size="sm" variant="secondary" className="px-3 py-1 text-xs">
                Claim & Go Live
              </Button>
            </Link>
          </div>
        </section>)}

      {/* TWO-COLUMN SECTIONS - SIDE BY SIDE */}
      <section className="section section--full border-y border-[color:var(--border-subtle)] py-6">
        <div className="content">
          {!user ? (
        /* LOGGED OUT - TWO SECTIONS SIDE BY SIDE */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stay Connected Section */}
              <div>
                <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Unlock the{" "}
                    {shortLocation === "Your Location"
                ? "Local"
                : shortLocation}{" "}
                    Scene
                  </h3>
              <p className="text-sm text-muted-foreground">
                Save go-tos, track trucks live, and get a heads-up when
                spots reopen
              </p>
            </div>

                <div className="space-y-2 mb-4">
                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-[hsl(var(--primary))]"/>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs">
                        {shortLocation === "Your Location"
                ? "Neighborhood"
                : shortLocation}{" "}
                        favorites
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Keep your go-tos one tap away
                      </p>
                    </div>
                  </div>

                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-[hsl(var(--primary))]"/>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs">
                        Food trucks{" "}
                        {shortLocation === "Your Location"
                ? "nearby"
                : "in ".concat(shortLocation)}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Live locations around you
                      </p>
                    </div>
                  </div>

                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-[hsl(var(--primary))]"/>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs">
                        Deals{" "}
                        {shortLocation === "Your Location"
                ? "nearby"
                : "in ".concat(shortLocation)}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Quick wins close to you
                      </p>
                    </div>
                  </div>
                </div>

                <Link href="/customer-signup">
                  <Button className="w-full h-9 text-xs font-medium">
                    Create free account
                  </Button>
                </Link>
              </div>

              {/* Community Building Section */}
              <div>
                <div className="text-center mb-4">
                  <h3 className="text-base font-bold text-foreground mb-1">
                    Promote{" "}
                    {shortLocation === "Your Location"
                ? "Local"
                : shortLocation}{" "}
                    Gems
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Pass along great spots and help them stay busy
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-start gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[hsl(var(--primary))] font-bold text-xs">
                        1
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs mb-0.5">
                        Share Your Link
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Get a unique referral link to share with restaurants
                      </p>
                    </div>
                  </div>

                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-start gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[hsl(var(--primary))] font-bold text-xs">
                        2
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs mb-0.5">
                        Restaurant Subscribes
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        When they join, you become their community partner
                      </p>
                    </div>
                  </div>

                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-start gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[hsl(var(--primary))] font-bold text-xs">
                        3
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs mb-0.5">
                        Earn Recurring Income
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Receive commission as long as they remain active
                      </p>
                    </div>
                  </div>
                </div>

                <Link href={user ? "/affiliate-dashboard" : "/customer-signup"}>
                  <Button className="w-full h-9 text-xs font-medium">
                    {user ? "Community Builder Dashboard" : "Start Building"}
                  </Button>
                </Link>
              </div>
            </div>) : (<div className="max-w-[520px] mx-auto">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Deals Nearby
              </h3>

              {featuredLoading ? (<div className="space-y-3">
                  {[1, 2, 3].map(function (i) { return (<div key={i} className="h-40 rounded-xl bg-[hsl(var(--surface-hover))]/60 animate-pulse"/>); })}
                </div>) : featuredError ? (<div className="text-center py-8 text-red-500 text-sm">
                  We couldn't load deals right now. Try again in a bit.
                </div>) : sortedFeaturedDeals.length > 0 ? (<div className="space-y-3">
                  {sortedFeaturedDeals.map(function (deal) { return (<DealCard key={deal.id} deal={deal}/>); })}
                </div>) : (<div className="text-center py-8 text-muted bg-surface-muted rounded-lg border border-dashed border-subtle">
                  <p className="text-sm">No deals nearby yet.</p>
                </div>)}
            </div>)}
        </div>
      </section>

      {/* Footer */}
      <footer className="section section--full border-t border-[color:var(--border-subtle)] py-6">
        <div className="content">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Product</h4>
              <Link href="/how-it-works" className="block text-muted-foreground hover:text-[hsl(var(--primary))]">
                How It Works
              </Link>
              <Link href="/faq" className="block text-muted-foreground hover:text-[hsl(var(--primary))]">
                FAQ
              </Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Company</h4>
              <Link href="/about" className="block text-muted-foreground hover:text-[hsl(var(--primary))]">
                About
              </Link>
              <Link href="/contact" className="block text-muted-foreground hover:text-[hsl(var(--primary))]">
                Contact
              </Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <Link href="/privacy-policy" className="block text-muted-foreground hover:text-[hsl(var(--primary))]">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="block text-muted-foreground hover:text-[hsl(var(--primary))]">
                Terms
              </Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Support</h4>
              <Link href="/faq" className="block text-muted-foreground hover:text-[hsl(var(--primary))]">
                Help Center
              </Link>
              <Link href="/status" className="block text-muted-foreground hover:text-[hsl(var(--primary))]">
                Status
              </Link>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground border-t border-[color:var(--border-subtle)] pt-4 mt-5">
            <p>&copy; 2026 MealScout. A TradeScout Product.</p>
          </div>
        </div>
      </footer>

      {/* Welcome Modal for First-Time Session Visitors */}
      <WelcomeLocationModal open={showWelcomeModal} onLocationSet={handleWelcomeLocationSet} onSkip={handleWelcomeSkip}/>
    </div>);
}
