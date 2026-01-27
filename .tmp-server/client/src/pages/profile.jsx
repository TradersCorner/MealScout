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
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Bell, Heart, Receipt, CreditCard, HelpCircle, LogOut, ChevronRight, Star, MapPin, Store, PartyPopper, Calendar, Link as LinkIcon, } from "lucide-react";
import { SEOHead } from "@/components/seo-head";
import { apiUrl } from "@/lib/api";
import { getOptimizedImageUrl } from "@/lib/images";
export default function ProfilePage() {
    var _this = this;
    var _a = useAuth(), user = _a.user, isAuthenticated = _a.isAuthenticated;
    var _b = useState(""), affiliateTag = _b[0], setAffiliateTag = _b[1];
    var _c = useState(""), tagInput = _c[0], setTagInput = _c[1];
    var _d = useState(false), tagSaving = _d[0], setTagSaving = _d[1];
    var _e = useState(null), tagError = _e[0], setTagError = _e[1];
    var userStats = useState({
        dealsRedeemed: 0,
        joinedDate: (user === null || user === void 0 ? void 0 : user.createdAt)
            ? new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
            })
            : null,
        lastActivity: null,
    })[0];
    var isEventCoordinator = (user === null || user === void 0 ? void 0 : user.userType) === "event_coordinator";
    var showEventCta = (user === null || user === void 0 ? void 0 : user.userType) === "customer" || isEventCoordinator;
    var eventCta = isEventCoordinator
        ? {
            href: "/event-coordinator/dashboard",
            title: "Manage Your Events",
            description: "View and update your upcoming events →",
            Icon: Calendar,
        }
        : {
            href: "/event-signup",
            title: "Book Trucks for Your Event",
            description: "Festivals, concerts, markets — connect with vendors →",
            Icon: PartyPopper,
        };
    useEffect(function () {
        var cancelled = false;
        if (!isAuthenticated)
            return;
        fetch(apiUrl("/api/affiliate/tag"), { credentials: "include" })
            .then(function (res) { return (res.ok ? res.json() : null); })
            .then(function (data) {
            if (cancelled)
                return;
            if (data === null || data === void 0 ? void 0 : data.tag) {
                setAffiliateTag(data.tag);
                setTagInput(data.tag);
            }
        })
            .catch(function () { });
        return function () {
            cancelled = true;
        };
    }, [isAuthenticated]);
    if (!isAuthenticated || !user) {
        return (<div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative pb-20">
      <header className="px-6 py-6 bg-[hsl(var(--background))] border-b border-white/5">
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <User className="w-6 h-6 text-primary mr-3"/>
            Profile
          </h1>
        </header>

        <div className="px-6 py-12 text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4"/>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Sign in to view profile
          </h2>
          <p className="text-muted-foreground mb-6">
            Log in to access your profile, settings, and deal history
          </p>
          <Button onClick={function () { return (window.location.href = "/api/auth/facebook"); }}>
            Sign In with Facebook
          </Button>
        </div>

        <Navigation />
      </div>);
    }
    var menuItems = __spreadArray(__spreadArray([
        { icon: Receipt, label: "Deal History", badge: null, href: "/orders" },
        { icon: Heart, label: "Favorites", badge: null, href: "/favorites" },
        {
            icon: Bell,
            label: "Notifications",
            badge: null,
            href: "/profile/notifications",
        },
        {
            icon: MapPin,
            label: "Addresses",
            badge: null,
            href: "/profile/addresses",
        }
    ], ((user === null || user === void 0 ? void 0 : user.userType) === "restaurant_owner"
        ? [
            {
                icon: CreditCard,
                label: "Payment Methods",
                badge: null,
                href: "/profile/payment",
            },
        ]
        : []), true), [
        {
            icon: Settings,
            label: "Settings",
            badge: null,
            href: "/profile/settings",
        },
        {
            icon: HelpCircle,
            label: "Help & Support",
            badge: null,
            href: "/profile/help",
        },
    ], false);
    var handleCopyAffiliateLink = function () { return __awaiter(_this, void 0, void 0, function () {
        var shareUrl, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!affiliateTag)
                        return [2 /*return*/];
                    shareUrl = "".concat(window.location.origin, "/ref/").concat(affiliateTag);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, navigator.clipboard.writeText(shareUrl)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to copy affiliate link:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleSaveTag = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data_1, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!tagInput.trim()) {
                        setTagError("Please enter a valid tag.");
                        return [2 /*return*/];
                    }
                    setTagSaving(true);
                    setTagError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch(apiUrl("/api/affiliate/tag"), {
                            method: "PUT",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ tag: tagInput.trim() }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data_1 = _a.sent();
                    throw new Error(data_1.error || "Failed to update tag");
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    data = _a.sent();
                    setAffiliateTag(data.tag);
                    setTagInput(data.tag);
                    return [3 /*break*/, 8];
                case 6:
                    error_2 = _a.sent();
                    setTagError(error_2.message || "Failed to update tag.");
                    return [3 /*break*/, 8];
                case 7:
                    setTagSaving(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-[var(--bg-app)] min-h-screen relative pb-20">
      <SEOHead title="My Profile - MealScout | Account Settings" description="Manage your MealScout profile, view account settings, update preferences, and access your deal history. Customize your food deal discovery experience." keywords="profile, account settings, user profile, account management, preferences" canonicalUrl="https://mealscout.us/profile" noIndex={true}/>
      {/* Header */}
      <header className="px-6 py-6 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-white/5">
        <h1 className="text-2xl font-bold text-foreground flex items-center mb-6">
          <User className="w-6 h-6 text-primary mr-3"/>
          Profile
        </h1>

        {/* User Info Card */}
        <Card className="bg-[hsl(var(--surface))] border border-white/5 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              {(user === null || user === void 0 ? void 0 : user.profileImageUrl) ? (<img src={getOptimizedImageUrl(user.profileImageUrl, "large")} alt="Profile" className="w-16 h-16 rounded-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer"/>) : (<div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white"/>
                </div>)}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground" data-testid="text-user-name">
                  {(user === null || user === void 0 ? void 0 : user.firstName) && (user === null || user === void 0 ? void 0 : user.lastName)
            ? "".concat(user.firstName, " ").concat(user.lastName)
            : (user === null || user === void 0 ? void 0 : user.email) || "User"}
                </h2>
                <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                  {user === null || user === void 0 ? void 0 : user.email}
                </p>
                <div className="flex items-center mt-2">
                  <Star className="w-4 h-4 text-yellow-500 mr-1"/>
                  <span className="text-sm font-medium text-foreground" data-testid="text-user-type">
                    {(user === null || user === void 0 ? void 0 : user.userType) === "restaurant_owner"
            ? "Restaurant Owner"
            : (user === null || user === void 0 ? void 0 : user.userType) === "admin"
                ? "Admin"
                : "Food Explorer"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Stats Section - Removed mock data */}
      <div className="px-6 py-6">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4"/>
                <span>Joined {userStats.joinedDate}</span>
              </div>
              {userStats.dealsRedeemed > 0 && (<div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4"/>
                  <span>{userStats.dealsRedeemed} deals redeemed</span>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Affiliate Link (Prominent) */}
      {affiliateTag && (<div className="px-6 pb-2">
          <Card className="border border-strong bg-[color:var(--bg-card)] shadow-lg">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl action-primary flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-[color:var(--action-primary-text)]"/>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-primary">
                    Affiliate Link
                  </h3>
                  <p className="text-sm text-secondary">
                    Customize your tag once and share your referral link.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex-1 flex items-center rounded-md border border-subtle bg-surface-muted px-3 py-2 text-sm text-primary">
                  <span className="text-secondary mr-1">
                    {"".concat(window.location.origin, "/ref/")}
                  </span>
                  <input type="text" value={tagInput} onChange={function (e) { return setTagInput(e.target.value); }} className="bg-transparent outline-none flex-1" placeholder="user1234"/>
                </div>
                <div className="flex gap-2">
                  <Button className="action-primary" onClick={handleSaveTag} disabled={tagSaving}>
                    {tagSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={handleCopyAffiliateLink}>
                    Copy Link
                  </Button>
                </div>
              </div>
              {tagError && (<p className="text-xs text-error">{tagError}</p>)}
            </CardContent>
          </Card>
        </div>)}

      {/* Menu Items */}
      <div className="px-6 pb-6">
        {/* Business Opportunities Section */}
        {showEventCta && (<div className="mb-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Business Opportunities
            </h3>

            {/* Event Organizer CTA */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all cursor-pointer border border-purple-200">
              <CardContent className="p-0">
                <Link href={eventCta.href}>
                  <div className="p-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <eventCta.Icon className="w-6 h-6 text-purple-600"/>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-bold text-base mb-1">
                          {eventCta.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {eventCta.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>)}

        <div className="space-y-2">
          {menuItems.map(function (item, index) { return (<Link key={index} href={item.href}>
              <Card className="bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-hover))] transition-colors cursor-pointer border border-white/5 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between" data-testid={"menu-item-".concat(item.label
                .toLowerCase()
                .replace(/\s+/g, "-"))}>
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 text-muted-foreground"/>
                      <span className="font-medium text-foreground">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.badge && (<Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>)}
                      <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>); })}

          {/* Restaurant Owner Option (de-emphasized in menu) */}
          {(user === null || user === void 0 ? void 0 : user.userType) === "customer" && (<Link href="/restaurant-signup">
              <Card className="bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-hover))] transition-colors cursor-pointer border border-white/5 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Store className="w-5 h-5 text-muted-foreground"/>
                      <span className="font-medium text-foreground">
                        List Your Restaurant
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground"/>
                  </div>
                </CardContent>
              </Card>
            </Link>)}
        </div>

        {/* Logout Button */}
        <Card className="bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-hover))] transition-colors cursor-pointer border border-white/5 shadow-md mt-6">
          <CardContent className="p-4">
            <button onClick={function () { return __awaiter(_this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch(apiUrl("/api/auth/logout"), {
                                method: "POST",
                                credentials: "include",
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.ok) {
                            window.location.href = "/";
                        }
                        else {
                            console.error("Logout failed");
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error("Logout error:", error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); }} className="w-full flex items-center justify-between" data-testid="button-logout">
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 text-red-500"/>
                <span className="font-medium text-red-500">Sign Out</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400"/>
            </button>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>);
}
