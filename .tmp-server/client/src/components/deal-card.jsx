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
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Clock, Star, UserPlus } from "lucide-react";
import { GoldenForkIcon } from "@/components/award-badges";
import { apiRequest } from "@/lib/queryClient";
import { getAffiliateShareUrl } from "@/lib/share";
import DealShareModal from "./deal-share-modal";
import RestaurantDealsDrawer from "./restaurant-deals-drawer";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
var SAVED_DEALS_KEY = "mealscout_saved_deals";
function getSavedDeals() {
    try {
        var raw = localStorage.getItem(SAVED_DEALS_KEY);
        if (!raw)
            return [];
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch (_a) {
        return [];
    }
}
function persistSavedDeals(ids) {
    try {
        localStorage.setItem(SAVED_DEALS_KEY, JSON.stringify(ids));
    }
    catch (_a) {
        // Best effort; ignore storage failures
    }
}
var getDefaultImage = function (cuisineType, title) {
    var images = {
        pizza: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&auto=format",
        burger: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&auto=format",
        mexican: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop&auto=format",
        asian: "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop&auto=format",
        italian: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&auto=format",
        chinese: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400&h=300&fit=crop&auto=format",
        indian: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&auto=format",
        cafe: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&auto=format",
        creole: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format",
        seafood: "https://images.unsplash.com/photo-1565299585323-38174c97c24d?w=400&h=300&fit=crop&auto=format",
        sushi: "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop&auto=format",
        deli: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format",
        healthy: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&auto=format",
        default: "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=300&fit=crop&auto=format",
    };
    var lowerCuisine = (cuisineType === null || cuisineType === void 0 ? void 0 : cuisineType.toLowerCase()) || "";
    var lowerTitle = (title === null || title === void 0 ? void 0 : title.toLowerCase()) || "";
    // Title-based matching
    if (lowerTitle.includes("burger") || lowerTitle.includes("sandwich"))
        return images.burger;
    if (lowerTitle.includes("pizza"))
        return images.pizza;
    if (lowerTitle.includes("taco") || lowerTitle.includes("burrito"))
        return images.mexican;
    if (lowerTitle.includes("sushi") || lowerTitle.includes("roll"))
        return images.sushi;
    if (lowerTitle.includes("beignet") ||
        lowerTitle.includes("coffee") ||
        lowerTitle.includes("pastry"))
        return images.cafe;
    if (lowerTitle.includes("curry") || lowerTitle.includes("naan"))
        return images.indian;
    if (lowerTitle.includes("pasta") || lowerTitle.includes("garlic bread"))
        return images.italian;
    if (lowerTitle.includes("noodle") || lowerTitle.includes("bowl"))
        return images.asian;
    if (lowerTitle.includes("jambalaya") ||
        lowerTitle.includes("brunch") ||
        lowerTitle.includes("mimosa"))
        return images.creole;
    if (lowerTitle.includes("shrimp") ||
        lowerTitle.includes("fish") ||
        lowerTitle.includes("catch"))
        return images.seafood;
    if (lowerTitle.includes("smoothie") || lowerTitle.includes("salad"))
        return images.healthy;
    // Cuisine-based matching
    if (lowerCuisine.includes("mexican"))
        return images.mexican;
    if (lowerCuisine.includes("chinese") || lowerCuisine.includes("asian"))
        return images.chinese;
    if (lowerCuisine.includes("italian"))
        return images.italian;
    if (lowerCuisine.includes("indian"))
        return images.indian;
    if (lowerCuisine.includes("cafe"))
        return images.cafe;
    if (lowerCuisine.includes("creole"))
        return images.creole;
    if (lowerCuisine.includes("seafood"))
        return images.seafood;
    if (lowerCuisine.includes("sushi"))
        return images.sushi;
    if (lowerCuisine.includes("deli"))
        return images.deli;
    if (lowerCuisine.includes("healthy"))
        return images.healthy;
    return images.default;
};
export default function DealCard(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f, _g;
    var deal = _a.deal;
    var _h = useAuth(), user = _h.user, isGuest = _h.isGuest;
    var isLiveTruck = !!((_b = deal.restaurant) === null || _b === void 0 ? void 0 : _b.isFoodTruck) && !!((_c = deal.restaurant) === null || _c === void 0 ? void 0 : _c.mobileOnline);
    var _j = useState(false), showShareModal = _j[0], setShowShareModal = _j[1];
    var _k = useState(false), showDealsDrawer = _k[0], setShowDealsDrawer = _k[1];
    var _l = useState(false), isSaved = _l[0], setIsSaved = _l[1];
    var cardRef = useRef(null);
    var _m = useState(false), hasTrackedView = _m[0], setHasTrackedView = _m[1];
    var _o = useState(false), forkPressed = _o[0], setForkPressed = _o[1];
    var _p = useState(false), showRecommendModal = _p[0], setShowRecommendModal = _p[1];
    var _q = useState(""), recommendationText = _q[0], setRecommendationText = _q[1];
    var _r = useState(false), favoriteSelection = _r[0], setFavoriteSelection = _r[1];
    var _s = useState(null), favoriteCount = _s[0], setFavoriteCount = _s[1];
    var _t = useState(false), isRestaurantFavorite = _t[0], setIsRestaurantFavorite = _t[1];
    var _u = useState(""), favoriteError = _u[0], setFavoriteError = _u[1];
    var _v = useState(false), favoriteLoading = _v[0], setFavoriteLoading = _v[1];
    var _w = useState(false), followSelection = _w[0], setFollowSelection = _w[1];
    var _x = useState(false), isRestaurantFollowed = _x[0], setIsRestaurantFollowed = _x[1];
    var _y = useState(""), followError = _y[0], setFollowError = _y[1];
    var _z = useState(false), followLoading = _z[0], setFollowLoading = _z[1];
    var _0 = useState(false), recommendSelection = _0[0], setRecommendSelection = _0[1];
    var _1 = useState(false), isRestaurantRecommended = _1[0], setIsRestaurantRecommended = _1[1];
    var _2 = useState(""), recommendError = _2[0], setRecommendError = _2[1];
    var _3 = useState(false), recommendSubmitting = _3[0], setRecommendSubmitting = _3[1];
    var isGoldenForkUser = Boolean((user === null || user === void 0 ? void 0 : user.influenceScore) && (user === null || user === void 0 ? void 0 : user.influenceScore) > 0);
    var _4 = useLocation(), setLocation = _4[1];
    // Initialize saved state from localStorage for quick UX feedback
    useEffect(function () {
        var saved = getSavedDeals();
        setIsSaved(saved.includes(deal.id));
    }, [deal.id]);
    // Track view when card becomes visible
    useEffect(function () {
        if (hasTrackedView)
            return;
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    // Track view when card is more than 50% visible
                    var trackView = function () { return __awaiter(_this, void 0, void 0, function () {
                        var error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, apiRequest("POST", "/api/deals/".concat(deal.id, "/view"), {})];
                                case 1:
                                    _a.sent();
                                    setHasTrackedView(true);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_1 = _a.sent();
                                    // Silently fail - view tracking shouldn't interrupt user experience
                                    console.debug("Card view tracking failed:", error_1);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); };
                    // Small delay to ensure it's not just scrolling past
                    setTimeout(trackView, 500);
                }
            });
        }, { threshold: 0.5 } // Track when 50% of card is visible
        );
        if (cardRef.current) {
            observer.observe(cardRef.current);
        }
        return function () {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, [deal.id, hasTrackedView]);
    useEffect(function () {
        if (!showRecommendModal || !user)
            return;
        var fetchPreferenceSnapshot = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, favorites, follows, recommendations, list, isFav, followList, isFollowed, recommendationList, isRecommended, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                apiRequest("GET", "/api/favorites/restaurants"),
                                apiRequest("GET", "/api/following/restaurants"),
                                apiRequest("GET", "/api/recommendations/restaurants"),
                            ])];
                    case 1:
                        _a = _b.sent(), favorites = _a[0], follows = _a[1], recommendations = _a[2];
                        list = Array.isArray(favorites) ? favorites : [];
                        isFav = list.some(function (fav) { var _a; return (fav.restaurantId || ((_a = fav.restaurant) === null || _a === void 0 ? void 0 : _a.id)) === deal.restaurantId; });
                        followList = Array.isArray(follows) ? follows : [];
                        isFollowed = followList.some(function (follow) { var _a; return (follow.restaurantId || ((_a = follow.restaurant) === null || _a === void 0 ? void 0 : _a.id)) === deal.restaurantId; });
                        recommendationList = Array.isArray(recommendations)
                            ? recommendations
                            : [];
                        isRecommended = recommendationList.some(function (rec) { var _a; return (rec.restaurantId || ((_a = rec.restaurant) === null || _a === void 0 ? void 0 : _a.id)) === deal.restaurantId; });
                        setFavoriteCount(list.length);
                        setIsRestaurantFavorite(isFav);
                        setFavoriteSelection(isFav);
                        setIsRestaurantFollowed(isFollowed);
                        setFollowSelection(isFollowed);
                        setIsRestaurantRecommended(isRecommended);
                        setRecommendSelection(isRecommended);
                        setFavoriteError("");
                        setFollowError("");
                        setRecommendError("");
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _b.sent();
                        console.error("Failed to load preference snapshot:", error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        fetchPreferenceSnapshot();
    }, [showRecommendModal, user, deal.restaurantId]);
    var formatDiscount = function () {
        var _a;
        // Normalize discount display for percentage vs flat amounts
        if (deal.dealType === "percentage") {
            return "".concat(deal.discountValue, "%");
        }
        // Handle values that may already include a dollar sign
        if ((_a = deal.discountValue) === null || _a === void 0 ? void 0 : _a.trim().startsWith("$")) {
            return deal.discountValue.trim();
        }
        return "$".concat(deal.discountValue);
    };
    var handleSave = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var newSavedState, currentSaved, updatedSaved, apiError_1, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    e.stopPropagation();
                    if (isGuest) {
                        window.location.href = "/login";
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    newSavedState = !isSaved;
                    setIsSaved(newSavedState);
                    currentSaved = getSavedDeals();
                    updatedSaved = newSavedState
                        ? Array.from(new Set(__spreadArray(__spreadArray([], currentSaved, true), [deal.id], false)))
                        : currentSaved.filter(function (id) { return id !== deal.id; });
                    persistSavedDeals(updatedSaved);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    if (!newSavedState) return [3 /*break*/, 4];
                    return [4 /*yield*/, apiRequest("POST", "/api/deals/".concat(deal.id, "/save"), {})];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, apiRequest("DELETE", "/api/deals/".concat(deal.id, "/save"), {})];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    apiError_1 = _a.sent();
                    console.debug("Deal save API not available; kept client bookmark", apiError_1);
                    return [3 /*break*/, 8];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_3 = _a.sent();
                    console.error("Failed to save deal:", error_3);
                    // Revert on error
                    setIsSaved(!isSaved);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    var handleShare = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var shareUrl, shareText, err_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    e.preventDefault();
                    e.stopPropagation();
                    return [4 /*yield*/, getAffiliateShareUrl("/deal/".concat(deal.id))];
                case 1:
                    shareUrl = _b.sent();
                    shareText = "".concat(deal.title, " at ").concat(((_a = deal.restaurant) === null || _a === void 0 ? void 0 : _a.name) || "this restaurant");
                    if (!navigator.share) return [3 /*break*/, 5];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, navigator.share({
                            title: "MealScout Special",
                            text: shareText,
                            url: shareUrl,
                        })];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
                case 4:
                    err_1 = _b.sent();
                    console.debug("Web Share failed, falling back to modal", err_1);
                    return [3 /*break*/, 5];
                case 5:
                    setShowShareModal(true);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleCardClick = function () {
        setShowDealsDrawer(true);
    };
    var handleParkingClick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var params = new URLSearchParams();
        if (deal.restaurantId) {
            params.set("hostId", deal.restaurantId);
        }
        params.set("source", "deal");
        setLocation("/parking-pass?".concat(params.toString()));
    };
    var MAX_FAVORITES = 3;
    var toggleRestaurantFavorite = function (nextSelected) { return __awaiter(_this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!user) {
                        window.location.href = "/api/auth/facebook";
                        return [2 /*return*/, false];
                    }
                    if (favoriteLoading)
                        return [2 /*return*/, false];
                    // Enforce max favorites for new additions
                    if (nextSelected &&
                        !isRestaurantFavorite &&
                        favoriteCount !== null &&
                        favoriteCount >= MAX_FAVORITES) {
                        setFavoriteError("You can favorite up to ".concat(MAX_FAVORITES, " restaurants."));
                        setFavoriteSelection(false);
                        return [2 /*return*/, false];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    setFavoriteLoading(true);
                    setFavoriteError("");
                    if (!nextSelected) return [3 /*break*/, 3];
                    return [4 /*yield*/, apiRequest("POST", "/api/restaurants/".concat(deal.restaurantId, "/favorite"), {})];
                case 2:
                    _a.sent();
                    setIsRestaurantFavorite(true);
                    setFavoriteSelection(true);
                    setFavoriteCount(function (prev) { return (prev !== null && prev !== void 0 ? prev : 0) + (isRestaurantFavorite ? 0 : 1); });
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, apiRequest("DELETE", "/api/restaurants/".concat(deal.restaurantId, "/favorite"), {})];
                case 4:
                    _a.sent();
                    setIsRestaurantFavorite(false);
                    setFavoriteSelection(false);
                    setFavoriteCount(function (prev) { return Math.max((prev !== null && prev !== void 0 ? prev : 1) - 1, 0); });
                    _a.label = 5;
                case 5: return [2 /*return*/, true];
                case 6:
                    error_4 = _a.sent();
                    console.error("Favorite toggle failed:", error_4);
                    setFavoriteError((error_4 === null || error_4 === void 0 ? void 0 : error_4.message) || "Unable to update favorite");
                    // Reset selection to previous state on failure
                    setFavoriteSelection(isRestaurantFavorite);
                    return [2 /*return*/, false];
                case 7:
                    setFavoriteLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var toggleRestaurantFollow = function (nextSelected) { return __awaiter(_this, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!user) {
                        window.location.href = "/api/auth/facebook";
                        return [2 /*return*/, false];
                    }
                    if (followLoading)
                        return [2 /*return*/, false];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    setFollowLoading(true);
                    setFollowError("");
                    if (!nextSelected) return [3 /*break*/, 3];
                    return [4 /*yield*/, apiRequest("POST", "/api/restaurants/".concat(deal.restaurantId, "/follow"), {})];
                case 2:
                    _a.sent();
                    setIsRestaurantFollowed(true);
                    setFollowSelection(true);
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, apiRequest("DELETE", "/api/restaurants/".concat(deal.restaurantId, "/follow"), {})];
                case 4:
                    _a.sent();
                    setIsRestaurantFollowed(false);
                    setFollowSelection(false);
                    _a.label = 5;
                case 5: return [2 /*return*/, true];
                case 6:
                    error_5 = _a.sent();
                    console.error("Follow toggle failed:", error_5);
                    setFollowError((error_5 === null || error_5 === void 0 ? void 0 : error_5.message) || "Unable to update follow");
                    setFollowSelection(isRestaurantFollowed);
                    return [2 /*return*/, false];
                case 7:
                    setFollowLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleRecommendSubmit = function () { return __awaiter(_this, void 0, void 0, function () {
        var followOk, favoriteOk, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!user) {
                        window.location.href = "/api/auth/facebook";
                        return [2 /*return*/];
                    }
                    // If user opts to favorite the restaurant, enforce max rules before submitting recommendation text
                    if (favoriteSelection &&
                        !isRestaurantFavorite &&
                        favoriteCount !== null &&
                        favoriteCount >= MAX_FAVORITES) {
                        setFavoriteError("You can favorite up to ".concat(MAX_FAVORITES, " restaurants."));
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, 11, 12]);
                    setRecommendSubmitting(true);
                    setRecommendError("");
                    if (!(followSelection !== isRestaurantFollowed)) return [3 /*break*/, 3];
                    return [4 /*yield*/, toggleRestaurantFollow(followSelection)];
                case 2:
                    followOk = _a.sent();
                    if (!followOk)
                        return [2 /*return*/];
                    _a.label = 3;
                case 3:
                    if (!(favoriteSelection !== isRestaurantFavorite)) return [3 /*break*/, 5];
                    return [4 /*yield*/, toggleRestaurantFavorite(favoriteSelection)];
                case 4:
                    favoriteOk = _a.sent();
                    if (!favoriteOk)
                        return [2 /*return*/];
                    _a.label = 5;
                case 5:
                    if (!(recommendSelection && !isRestaurantRecommended)) return [3 /*break*/, 7];
                    return [4 /*yield*/, apiRequest("POST", "/api/restaurants/".concat(deal.restaurantId, "/recommend"), {})];
                case 6:
                    _a.sent();
                    setIsRestaurantRecommended(true);
                    setRecommendSelection(true);
                    _a.label = 7;
                case 7:
                    if (!(recommendationText.trim().length > 0)) return [3 /*break*/, 9];
                    return [4 /*yield*/, apiRequest("POST", "/api/reviews", {
                            restaurantId: deal.restaurantId,
                            rating: 5,
                            comment: recommendationText.trim(),
                        })];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    setShowRecommendModal(false);
                    setRecommendationText("");
                    return [3 /*break*/, 12];
                case 10:
                    error_6 = _a.sent();
                    console.error("Recommendation submit failed:", error_6);
                    setRecommendError((error_6 === null || error_6 === void 0 ? void 0 : error_6.message) || "Could not submit recommendation.");
                    return [3 /*break*/, 12];
                case 11:
                    setRecommendSubmitting(false);
                    return [7 /*endfinally*/];
                case 12: return [2 /*return*/];
            }
        });
    }); };
    return (<div>
      <Card ref={cardRef} className="deal-card transition-all duration-300 cursor-pointer group overflow-hidden" data-testid={"card-deal-".concat(deal.id)}>
        <CardContent className="p-0">
          {/* Image with gradient overlay - framed inside card */}
          <div className="deal-card-media relative h-24 overflow-hidden rounded-t-2xl">
            <img src={deal.imageUrl ||
            getDefaultImage((_d = deal.restaurant) === null || _d === void 0 ? void 0 : _d.cuisineType, deal.title)} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" referrerPolicy="no-referrer"/>
            {/* Deal Badge - top left */}
            <div className="absolute top-1.5 left-1.5 bg-[#F59E0B] text-[#111111] px-1.5 py-0.5 rounded-lg shadow-lg">
              <span className="font-bold text-sm leading-none">
                {formatDiscount()} OFF
              </span>
            </div>

            {/* Golden fork (restaurant recommendation) - top right */}
            <button onClick={function (e) {
            e.stopPropagation();
            setShowRecommendModal(true);
            setForkPressed(true);
        }} onMouseDown={function () { return setForkPressed(true); }} onMouseUp={function () { return setForkPressed(false); }} onMouseLeave={function () { return setForkPressed(false); }} className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-300 hover:scale-110 z-10" title="Recommend this restaurant">
              <GoldenForkIcon className={"w-3.5 h-3.5 transition-colors duration-200 ".concat(forkPressed ? "text-[color:var(--accent-text)]" : "text-muted")}/>
            </button>

            {/* Restaurant Name Overlay - bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
              <h3 className="font-semibold text-white text-xs truncate" data-testid={"text-restaurant-name-".concat(deal.id)}>
                {((_e = deal.restaurant) === null || _e === void 0 ? void 0 : _e.name) || "Restaurant Name"}
              </h3>
              {((_f = deal.restaurant) === null || _f === void 0 ? void 0 : _f.cuisineType) && (<p className="text-white/80 text-[10px] truncate">
                  {deal.restaurant.cuisineType}
                </p>)}
            </div>
          </div>

          {/* Content */}
          <div className="p-2" onClick={handleCardClick}>
            {/* Deal Title */}
            <p className="text-primary text-sm font-semibold mb-1.5 line-clamp-2 leading-tight min-h-[2.5rem]" data-testid={"text-restaurant-info-".concat(deal.id)}>
              {deal.title}
            </p>

            {/* Rating + Distance */}
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-secondary">
              {isLiveTruck && (<div className="flex items-center gap-1 rounded-full bg-[rgba(245,158,11,0.18)] px-1.5 py-0.5 text-[11px] font-semibold text-[color:var(--accent-text)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]"/>
                  Live now
                </div>)}
              <div className="flex items-center gap-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-[color:var(--accent-text)]">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="font-medium">4.5</span>
              </div>
              {deal.distance !== undefined && (<>
                  <span>•</span>
                  <span>{deal.distance.toFixed(1)} mi</span>
                </>)}
              {deal.minOrderAmount && (<>
                  <span>•</span>
                  <span className="text-[color:var(--accent-text)] font-medium">
                    ${deal.minOrderAmount} min
                  </span>
                </>)}
            </div>

            {/* Meta Line: Time & Popularity */}
            <div className="flex items-center gap-2 text-[11px] text-secondary mb-2">
              <div className="flex items-center gap-0.5 text-[color:var(--accent-text)]">
                <Clock className="w-3 h-3"/>
                <span>Ends in 2h15m</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-[color:var(--accent-text)]"/>
                <span className="font-medium text-secondary">
                  {deal.currentUses || 188} claimed
                </span>
              </div>
            </div>

            {/* Action row: save + share + parking */}
            <div className="flex gap-1.5 mb-2">
              <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px] px-1 text-primary border-[color:var(--border-strong)] bg-[color:var(--bg-surface-muted)] hover:bg-[color:var(--bg-surface-muted)]" onClick={function (e) { return handleSave(e); }}>
                {isSaved ? "Bookmarked" : "Bookmark special"}
              </Button>

              <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px] px-1 text-primary border-[color:var(--border-strong)] bg-[color:var(--bg-surface-muted)] hover:bg-[color:var(--bg-surface-muted)]" onClick={handleShare}>
                Share
              </Button>
            </div>

            {/* Button */}
            <Button className="w-full h-11 bg-[#F59E0B] text-[#111111] font-semibold text-sm shadow-none hover:bg-[#F59E0B]" onClick={function (e) {
            e.stopPropagation();
            handleCardClick();
        }}>
              View Special
              </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommend Modal */}
      {showRecommendModal && (<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={function () { return setShowRecommendModal(false); }}/>
          <div className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-yellow-200/60">
            {/* Hero header */}
            <div className="bg-gradient-to-br from-yellow-200 via-amber-200 to-yellow-300 px-5 py-4 flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-yellow-300 flex items-center justify-center shadow-md">
                <GoldenForkIcon className="w-7 h-7 text-yellow-700"/>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 leading-tight">
                  Recommend this restaurant
                </h3>
                <p className="text-xs text-yellow-800/80">
                  Your recommendation directly affects local visibility
                </p>
                {isGoldenForkUser && (<div className="mt-1 text-xs text-yellow-900 font-semibold flex items-center gap-1">
                    <span role="img" aria-label="golden">
                      🥇
                    </span>
                    Your recommendations carry extra weight in this area
                  </div>)}
              </div>
            </div>

            <div className="bg-white px-5 pb-5 pt-4">
              <label className="block text-sm font-semibold text-primary mb-1">
                Add context (optional)
              </label>
              <p className="text-xs text-secondary mb-2">
                What makes this spot worth recommending?
              </p>
              <textarea className="w-full rounded-xl border border-subtle focus:border-[color:var(--action-primary)] focus:ring-2 focus:ring-[color:var(--action-hover)] text-sm p-3 min-h-[96px] resize-none" placeholder="Great food, fair prices, fast service, friendly owner…" value={recommendationText} onChange={function (e) { return setRecommendationText(e.target.value); }}/>

              {/* Recommend toggle card */}
              <button type="button" disabled={isRestaurantRecommended} onClick={function () {
                if (isRestaurantRecommended)
                    return;
                var next = !recommendSelection;
                setRecommendSelection(next);
                setRecommendError("");
            }} className={"mt-4 w-full rounded-xl border transition-all text-left p-3 flex items-center gap-3 ".concat(recommendSelection
                ? "border-yellow-400 bg-yellow-50"
                : "border-subtle bg-surface-muted", " ").concat(isRestaurantRecommended ? "opacity-70 cursor-not-allowed" : "")}>
                <div className={"w-9 h-9 rounded-lg flex items-center justify-center border ".concat(recommendSelection
                ? "bg-white text-yellow-700 border-yellow-300"
                : "bg-card text-muted border-subtle")}>
                  <GoldenForkIcon className="w-5 h-5"/>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-primary text-sm">
                    Recommend this spot
                  </div>
                  <div className="text-xs text-secondary">
                    {isRestaurantRecommended
                ? "Already recommended"
                : "One recommendation per restaurant"}
                  </div>
                  {recommendError && (<div className="text-red-600 text-xs mt-1">
                      {recommendError}
                    </div>)}
                </div>
              </button>

              {/* Follow toggle card */}
              <button type="button" onClick={function () {
                var next = !followSelection;
                setFollowSelection(next);
                setFollowError("");
            }} className={"mt-3 w-full rounded-xl border transition-all text-left p-3 flex items-center gap-3 ".concat(followSelection
                ? "border-emerald-400 bg-emerald-50"
                : "border-subtle bg-surface-muted")}>
                <div className={"w-9 h-9 rounded-lg flex items-center justify-center border ".concat(followSelection
                ? "bg-white text-emerald-600 border-emerald-300"
                : "bg-card text-muted border-subtle")}>
                  <UserPlus className="w-5 h-5"/>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-primary text-sm">
                    Follow this restaurant
                  </div>
                  <div className="text-xs text-secondary">
                    Get updates when specials go live
                  </div>
                  {followError && (<div className="text-red-600 text-xs mt-1">
                      {followError}
                    </div>)}
                </div>
              </button>

              {/* Favorite toggle card */}
              <button type="button" onClick={function () {
                var next = !favoriteSelection;
                setFavoriteSelection(next);
                if (next &&
                    favoriteCount !== null &&
                    favoriteCount >= MAX_FAVORITES &&
                    !isRestaurantFavorite) {
                    setFavoriteError("You can favorite up to ".concat(MAX_FAVORITES, " restaurants."));
                }
                else {
                    setFavoriteError("");
                }
            }} className={"mt-4 w-full rounded-xl border transition-all text-left p-3 flex items-center gap-3 ".concat(favoriteSelection
                ? "border-yellow-400 bg-yellow-50"
                : "border-subtle bg-surface-muted")}>
                <div className={"w-9 h-9 rounded-lg flex items-center justify-center border ".concat(favoriteSelection
                ? "bg-white text-yellow-600 border-yellow-300"
                : "bg-card text-muted border-subtle")}>
                  <Star className={"w-5 h-5 ".concat(favoriteSelection ? "fill-yellow-500 text-yellow-600" : "")}/>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-primary text-sm">
                    Add to Favorites
                  </div>
                  <div className="text-xs text-secondary">
                    Only 3 favorites allowed
                    {favoriteSelection
                ? " · One of your top 3 restaurants"
                : ""}
                  </div>
                  {favoriteCount !== null && (<div className="text-[11px] text-muted mt-0.5">
                      Currently using {favoriteCount}/{MAX_FAVORITES}
                    </div>)}
                  {favoriteError && (<div className="text-red-600 text-xs mt-1">
                      {favoriteError}
                    </div>)}
                </div>
              </button>

              <div className="flex justify-end gap-2 mt-5">
                <Button variant="outline" className="h-9 text-sm border-subtle text-secondary" onClick={function () { return setShowRecommendModal(false); }}>
                  Cancel
                </Button>
                <Button className="h-9 bg-yellow-500 hover:bg-yellow-600 text-white text-sm shadow-md shadow-yellow-200/80" onClick={handleRecommendSubmit} disabled={recommendSubmitting || favoriteLoading || followLoading}>
                  {recommendSubmitting ? "Saving..." : "Save choices"}
                </Button>
              </div>
            </div>
          </div>
        </div>)}

      {/* Share Modal */}
      <DealShareModal isOpen={showShareModal} onClose={function () { return setShowShareModal(false); }} deal={deal}/>

      {/* Restaurant Deals Drawer */}
      <RestaurantDealsDrawer isOpen={showDealsDrawer} onClose={function () { return setShowDealsDrawer(false); }} restaurantId={deal.restaurantId} restaurantName={((_g = deal.restaurant) === null || _g === void 0 ? void 0 : _g.name) || "Restaurant"} initialDealId={deal.id}/>
    </div>);
}
