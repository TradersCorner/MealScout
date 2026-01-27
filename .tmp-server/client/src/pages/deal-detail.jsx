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
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DealClaimModal from "@/components/deal-claim-modal";
import DealShareModal from "@/components/deal-share-modal";
import { BackHeader } from "@/components/back-header";
import { Tag } from "lucide-react";
import { SEOHead } from "@/components/seo-head";
export default function DealDetail() {
    var _this = this;
    var dealId = useParams().id;
    var _a = useAuth(), user = _a.user, isAuthenticated = _a.isAuthenticated;
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    var _b = useState(false), showClaimModal = _b[0], setShowClaimModal = _b[1];
    var _c = useState(false), showShareModal = _c[0], setShowShareModal = _c[1];
    var _d = useQuery({
        queryKey: ["/api/deals", dealId],
        enabled: !!dealId,
    }), deal = _d.data, dealLoading = _d.isLoading;
    var _e = useQuery({
        queryKey: ["/api/restaurants", deal === null || deal === void 0 ? void 0 : deal.restaurantId],
        enabled: !!(deal === null || deal === void 0 ? void 0 : deal.restaurantId),
    }), restaurant = _e.data, restaurantLoading = _e.isLoading;
    var reviews = useQuery({
        queryKey: ["/api/reviews/restaurant", deal === null || deal === void 0 ? void 0 : deal.restaurantId],
        enabled: !!(deal === null || deal === void 0 ? void 0 : deal.restaurantId),
    }).data;
    var rating = useQuery({
        queryKey: [
            "/api/reviews/restaurant",
            deal === null || deal === void 0 ? void 0 : deal.restaurantId,
            "rating",
        ],
        enabled: !!(deal === null || deal === void 0 ? void 0 : deal.restaurantId),
    }).data;
    // Track deal view when deal is loaded
    useEffect(function () {
        if (dealId && deal && !dealLoading) {
            // Track the deal view
            var trackView = function () { return __awaiter(_this, void 0, void 0, function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, apiRequest("POST", "/api/deals/".concat(dealId, "/view"), {})];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            error_1 = _a.sent();
                            // Silently fail - view tracking shouldn't interrupt user experience
                            console.debug("View tracking failed:", error_1);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            // Delay to ensure the user actually viewed the page (not just a quick navigation)
            var timer_1 = setTimeout(trackView, 1000);
            return function () { return clearTimeout(timer_1); };
        }
    }, [dealId, deal, dealLoading]);
    var claimDealMutation = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/deals/".concat(dealId, "/claim"), {})];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: "Special Claimed!",
                description: "You have successfully claimed this deal. Show this to the restaurant.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/deals", dealId] });
        },
        onError: function (error) {
            if (isUnauthorizedError(error)) {
                toast({
                    title: "Unauthorized",
                    description: "You are logged out. Logging in again...",
                    variant: "destructive",
                });
                setTimeout(function () {
                    window.location.href = "/api/auth/google/customer";
                }, 500);
                return;
            }
            toast({
                title: "Error",
                description: error.message || "Failed to claim deal",
                variant: "destructive",
            });
        },
    });
    if (dealLoading || restaurantLoading) {
        return (<div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-white min-h-screen">
        <div className="animate-pulse">
          <div className="w-full h-64 bg-muted"></div>
          <div className="p-4 space-y-4">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </div>);
    }
    if (!deal) {
        return (<div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-white min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <i className="fas fa-exclamation-triangle text-muted-foreground text-3xl mb-4"></i>
            <p className="text-muted-foreground mb-4">Special not found</p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>);
    }
    var formatDiscount = function (deal) {
        if (deal.dealType === "percentage") {
            return "".concat(deal.discountValue, "% OFF");
        }
        else {
            return "$".concat(deal.discountValue, " OFF");
        }
    };
    var formatTime = function (timeString) {
        var _a = timeString.split(":"), hours = _a[0], minutes = _a[1];
        var hour = parseInt(hours);
        var ampm = hour >= 12 ? "PM" : "AM";
        var displayHour = hour % 12 || 12;
        return "".concat(displayHour, ":").concat(minutes, " ").concat(ampm);
    };
    var dealTitle = (deal === null || deal === void 0 ? void 0 : deal.title) || "Food Special";
    var restaurantName = (restaurant === null || restaurant === void 0 ? void 0 : restaurant.name) || "Restaurant";
    var dealDescription = (deal === null || deal === void 0 ? void 0 : deal.description) ||
        "Exclusive food special from a local restaurant";
    var discountValue = (deal === null || deal === void 0 ? void 0 : deal.discountValue) || "";
    var dealType = (deal === null || deal === void 0 ? void 0 : deal.dealType) || "";
    var distance = deal === null || deal === void 0 ? void 0 : deal.distance;
    var offerSchema = {
        "@context": "https://schema.org",
        "@type": "Offer",
        name: dealTitle,
        description: dealDescription,
        url: "https://mealscout.us/deals/".concat(dealId),
        priceCurrency: "USD",
        price: dealType === "percentage" ? "0" : discountValue,
        discount: dealType === "percentage" ? "".concat(discountValue, "%") : "$".concat(discountValue),
        seller: {
            "@type": "Restaurant",
            name: restaurantName,
            address: (restaurant === null || restaurant === void 0 ? void 0 : restaurant.address) || "",
        },
        validFrom: deal === null || deal === void 0 ? void 0 : deal.startDate,
        validThrough: deal === null || deal === void 0 ? void 0 : deal.endDate,
        availability: "https://schema.org/InStock",
    };
    return (<div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-white min-h-screen">
      <SEOHead title={"".concat(dealTitle, " - ").concat(restaurantName, " | MealScout")} description={"".concat(dealDescription, ". ").concat(dealType === "percentage"
            ? "Get ".concat(discountValue, "% off")
            : "Save $".concat(discountValue), " at ").concat(restaurantName, ". Claim this exclusive special now on MealScout!")} keywords={"".concat(restaurantName, ", ").concat(dealTitle, ", food special, restaurant discount, ").concat((restaurant === null || restaurant === void 0 ? void 0 : restaurant.cuisineType) || "food")} canonicalUrl={"https://mealscout.us/deals/".concat(dealId)} schemaData={offerSchema}/>
      <BackHeader title="Special Details" fallbackHref="/" icon={Tag} className="bg-white sticky top-0 z-10"/>

      {/* Action Buttons */}
      <div className="bg-white px-4 py-2 border-b border-border sticky top-16 z-10">
        <div className="flex justify-end space-x-2">
          <button className="p-2 rounded-full hover:bg-muted" onClick={function () { return setShowShareModal(true); }} data-testid="button-share">
            <i className="fas fa-share text-foreground"></i>
          </button>
          <button className="p-2 rounded-full hover:bg-muted" data-testid="button-favorite">
            <i className="fas fa-heart text-muted-foreground hover:text-primary"></i>
          </button>
        </div>
      </div>

      {/* Deal Image */}
      <div className="relative">
        <div className="w-full h-64 bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
          {(deal === null || deal === void 0 ? void 0 : deal.imageUrl) ? (<img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover" data-testid="img-deal" loading="lazy" decoding="async" referrerPolicy="no-referrer"/>) : (<i className="fas fa-utensils text-primary text-4xl"></i>)}
        </div>
        <div className="absolute top-4 left-4 bg-accent text-accent-foreground px-3 py-1 rounded-full font-bold text-sm" data-testid="text-discount-badge">
          {formatDiscount(deal)}
        </div>
      </div>

      {/* Deal Content */}
      <div className="px-4 py-6 pb-32">
        {/* Restaurant Info */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1" data-testid="text-restaurant-name">
              {(restaurant === null || restaurant === void 0 ? void 0 : restaurant.name) || "Restaurant"}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {distance !== undefined && (<div className="flex items-center space-x-1">
                  <i className="fas fa-map-marker-alt"></i>
                  <span data-testid="text-restaurant-distance">
                    {distance.toFixed(1)} mi away
                  </span>
                </div>)}
              <div className="flex items-center space-x-1">
                <i className="fas fa-star text-yellow-400"></i>
                <span data-testid="text-restaurant-rating">
                  {(rating === null || rating === void 0 ? void 0 : rating.rating) &&
            typeof rating.rating === "number"
            ? rating.rating.toFixed(1)
            : (rating === null || rating === void 0 ? void 0 : rating.rating) &&
                !isNaN(Number(rating.rating))
                ? Number(rating.rating).toFixed(1)
                : "New"}
                  {Array.isArray(reviews) && " (".concat(reviews.length, " reviews)")}
                </span>
              </div>
            </div>
          </div>
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <i className="fas fa-utensils text-white text-xl"></i>
          </div>
        </div>

        {/* Deal Description */}
        <Card className="bg-muted/50 mb-6">
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground mb-2" data-testid="text-deal-title">
              {deal === null || deal === void 0 ? void 0 : deal.title}
            </h2>
            <p className="text-muted-foreground text-sm mb-3" data-testid="text-deal-description">
              {deal === null || deal === void 0 ? void 0 : deal.description}
            </p>

            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <i className="fas fa-clock text-muted-foreground"></i>
                <span data-testid="text-deal-time">
                  Valid {formatTime((deal === null || deal === void 0 ? void 0 : deal.startTime) || "11:00")} -{" "}
                  {formatTime((deal === null || deal === void 0 ? void 0 : deal.endTime) || "15:00")}
                </span>
              </div>
              {(deal === null || deal === void 0 ? void 0 : deal.minOrderAmount) && (<div className="flex items-center space-x-1">
                  <i className="fas fa-dollar-sign text-muted-foreground"></i>
                  <span data-testid="text-min-order">
                    Min. order ${deal.minOrderAmount}
                  </span>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="text-center p-3">
              <i className="fas fa-clock text-secondary text-lg mb-1"></i>
              <p className="text-xs font-medium text-foreground" data-testid="text-pickup-time">
                15-25 min
              </p>
              <p className="text-xs text-muted-foreground">Pickup time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center p-3">
              <i className="fas fa-phone text-primary text-lg mb-1"></i>
              <p className="text-xs font-medium text-foreground">Call Now</p>
              <p className="text-xs text-muted-foreground" data-testid="text-restaurant-phone">
                {(restaurant === null || restaurant === void 0 ? void 0 : restaurant.phone) || "(555) 123-4567"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center p-3">
              <i className="fas fa-directions text-accent text-lg mb-1"></i>
              <p className="text-xs font-medium text-foreground">Directions</p>
              {(restaurant === null || restaurant === void 0 ? void 0 : restaurant.address) && (<p className="text-xs text-muted-foreground" data-testid="text-directions">
                  {restaurant.address.split(",")[0]}
                </p>)}
            </CardContent>
          </Card>
        </div>

        {/* Reviews */}
        {Array.isArray(reviews) && reviews.length > 0 && (<div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground" data-testid="text-reviews-title">
                Recent Reviews
              </h3>
              <button className="text-primary text-sm font-medium" data-testid="button-see-all-reviews">
                See all
              </button>
            </div>

            <div className="space-y-4">
              {reviews
                .slice(0, 2)
                .map(function (review, index) {
                var _a;
                return (<Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <i className="fas fa-user text-muted-foreground text-xs"></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-sm text-foreground" data-testid={"text-reviewer-name-".concat(index)}>
                              {((_a = review.user) === null || _a === void 0 ? void 0 : _a.firstName) || "Anonymous"}
                            </p>
                            <div className="flex text-yellow-400">
                              {__spreadArray([], Array(5), true).map(function (_, i) { return (<i key={i} className={"fas fa-star text-xs ".concat(i < review.rating
                            ? "text-yellow-400"
                            : "text-muted-foreground")}></i>); })}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground" data-testid={"text-review-date-".concat(index)}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-foreground" data-testid={"text-review-comment-".concat(index)}>
                        {review.comment || "Great special!"}
                      </p>
                    </CardContent>
                  </Card>);
            })}
            </div>
          </div>)}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-border px-4 py-4">
        <div className="flex items-center space-x-3">
          <Button className="flex-1 py-3 font-semibold text-sm food-gradient-primary border-0" onClick={function () { return setShowClaimModal(true); }} disabled={!isAuthenticated} data-testid="button-claim-deal">
            <i className="fab fa-facebook-f mr-2"></i>
            Claim & Post to Facebook
          </Button>
          <Button variant="outline" size="icon" className="px-4 py-3" data-testid="button-save-deal">
            <i className="fas fa-heart text-muted-foreground"></i>
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2" data-testid="text-deal-expires">
          Special expires in{" "}
          {Math.ceil((new Date((deal === null || deal === void 0 ? void 0 : deal.endDate) || Date.now()).getTime() -
            Date.now()) /
            (1000 * 60 * 60 * 24))}{" "}
          days
        </p>
      </div>

      {/* Deal Claim Modal */}
      <DealClaimModal dealId={dealId || ""} isOpen={showClaimModal} onClose={function () { return setShowClaimModal(false); }}/>

      {/* Deal Share Modal */}
      <DealShareModal isOpen={showShareModal} onClose={function () { return setShowShareModal(false); }} deal={{
            id: (deal === null || deal === void 0 ? void 0 : deal.id) || "",
            title: (deal === null || deal === void 0 ? void 0 : deal.title) || "",
            description: (deal === null || deal === void 0 ? void 0 : deal.description) || "",
            discountValue: (deal === null || deal === void 0 ? void 0 : deal.discountValue) || "0",
            minOrderAmount: deal === null || deal === void 0 ? void 0 : deal.minOrderAmount,
            restaurant: {
                name: (restaurant === null || restaurant === void 0 ? void 0 : restaurant.name) || "Restaurant",
                cuisineType: restaurant === null || restaurant === void 0 ? void 0 : restaurant.cuisineType,
            },
        }}/>
    </div>);
}
