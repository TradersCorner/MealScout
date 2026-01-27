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
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import DealCard from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, SlidersHorizontal, Filter } from "lucide-react";
import { SEOHead } from "@/components/seo-head";
import { sendGeoPing, trackGeoAdEvent, trackGeoAdImpression } from "@/utils/geoAds";
export default function FeaturedDealsPage() {
    var _this = this;
    var _a = useState(null), adLocation = _a[0], setAdLocation = _a[1];
    useEffect(function () {
        if (!navigator.geolocation)
            return;
        navigator.geolocation.getCurrentPosition(function (position) {
            setAdLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });
        }, function () {
            setAdLocation(null);
        }, { enableHighAccuracy: false, timeout: 6000 });
    }, []);
    var _b = useQuery({
        queryKey: ["/api/deals/featured"],
        enabled: true,
    }), featuredDeals = _b.data, isLoading = _b.isLoading;
    var _c = useQuery({
        queryKey: ["/api/geo-ads", "deals", adLocation === null || adLocation === void 0 ? void 0 : adLocation.lat, adLocation === null || adLocation === void 0 ? void 0 : adLocation.lng],
        enabled: !!adLocation,
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!adLocation)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, fetch("/api/geo-ads?placement=deals&lat=".concat(adLocation.lat, "&lng=").concat(adLocation.lng, "&limit=1"), { credentials: "include" })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            return [2 /*return*/, []];
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
    }).data, geoAds = _c === void 0 ? [] : _c;
    useEffect(function () {
        if (!adLocation)
            return;
        sendGeoPing({ lat: adLocation.lat, lng: adLocation.lng, source: "deals" });
    }, [adLocation === null || adLocation === void 0 ? void 0 : adLocation.lat, adLocation === null || adLocation === void 0 ? void 0 : adLocation.lng]);
    useEffect(function () {
        if (!geoAds.length)
            return;
        geoAds.forEach(function (ad) {
            return trackGeoAdImpression({ adId: ad.id, placement: "deals" });
        });
    }, [geoAds]);
    var allDeals = Array.isArray(featuredDeals) ? featuredDeals : [];
    var handleGeoAdClick = function (ad) {
        trackGeoAdEvent({ adId: ad.id, eventType: "click", placement: "deals" });
        window.open(ad.targetUrl, "_blank", "noopener,noreferrer");
    };
    return (<div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative pb-20">
      <SEOHead title="Time-Sensitive Specials - MealScout | Nearby Limited-Time Offers" description="Discover time-sensitive food specials near you. Limited-time offers from local restaurants, sorted by proximity." keywords="time-sensitive specials, nearby specials, restaurant discounts, limited time offers" canonicalUrl="https://mealscout.us/deals/featured"/>
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-3 -ml-2" data-testid="button-back-featured">
              <ArrowLeft className="w-4 h-4"/>
            </Button>
          </Link>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-3 shadow-sm">
              <Star className="w-4 h-4 text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Time-Sensitive Specials Nearby</h1>
              <p className="text-sm text-muted-foreground">Limited-time offers from nearby restaurants (distance-based)</p>
            </div>
          </div>
        </div>

        {/* Filter & Sort */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {allDeals.length} time-sensitive special{allDeals.length !== 1 ? 's' : ''}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" data-testid="button-sort-featured">
              <SlidersHorizontal className="w-4 h-4 mr-2"/>
              Sort
            </Button>
            <Button variant="outline" size="sm" data-testid="button-filter-featured">
              <Filter className="w-4 h-4 mr-2"/>
              Filter
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-6">
        {geoAds.length > 0 && (<div className="mb-6">
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

        {isLoading ? (<div className="space-y-4">
            {[1, 2, 3].map(function (i) { return (<div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-md">
                <div className="w-full h-48 bg-muted"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                </div>
              </div>); })}
          </div>) : allDeals.length > 0 ? (<div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
            {allDeals.map(function (deal) { return (<DealCard key={deal.id} deal={deal}/>); })}
          </div>) : (<div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-red-500"/>
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">No time-sensitive specials yet</h3>
            <p className="text-muted-foreground mb-6">
              Check back soon for nearby limited-time offers from local restaurants!
            </p>
            <Link href="/search">
              <Button data-testid="button-browse-all-featured">
                Browse All Specials
              </Button>
            </Link>
          </div>)}
      </div>

      <Navigation />
    </div>);
}
