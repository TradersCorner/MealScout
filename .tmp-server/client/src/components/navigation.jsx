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
import { Link, useLocation } from "wouter";
import { Search, Heart, Receipt, User, MapPin, Store, Plus, BarChart3, UserPlus, Clapperboard, Bug, Shield, Users, UtensilsCrossed, Calendar, LayoutDashboard, ParkingSquare, } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
var navRenderLock = 0;
export default function Navigation() {
    var _this = this;
    var canRender = useState(function () {
        if (navRenderLock > 0)
            return false;
        navRenderLock += 1;
        return true;
    })[0];
    var location = useLocation()[0];
    var user = useAuth().user;
    var toast = useToast().toast;
    var _a = useState(false), isReporting = _a[0], setIsReporting = _a[1];
    useEffect(function () {
        if (!canRender)
            return;
        return function () {
            navRenderLock = Math.max(0, navRenderLock - 1);
        };
    }, [canRender]);
    if (!canRender) {
        return null;
    }
    var handleBugReport = function () { return __awaiter(_this, void 0, void 0, function () {
        var html2canvas, canvas, screenshot, currentUrl, userAgent, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isReporting)
                        return [2 /*return*/];
                    setIsReporting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, import("html2canvas")];
                case 2:
                    html2canvas = (_a.sent()).default;
                    return [4 /*yield*/, html2canvas(document.body, {
                            useCORS: true,
                            allowTaint: true,
                            scale: 0.5,
                            logging: false,
                        })];
                case 3:
                    canvas = _a.sent();
                    screenshot = canvas.toDataURL("image/png");
                    currentUrl = window.location.href;
                    userAgent = navigator.userAgent;
                    return [4 /*yield*/, apiRequest("POST", "/api/bug-report", {
                            screenshot: screenshot,
                            currentUrl: currentUrl,
                            userAgent: userAgent,
                        })];
                case 4:
                    _a.sent();
                    toast({
                        title: "Bug report sent!",
                        description: "Thank you for helping us improve MealScout.",
                    });
                    return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    console.error("Failed to submit bug report:", error_1);
                    toast({
                        title: "Failed to send report",
                        description: "Please try again or contact support.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 7];
                case 6:
                    setIsReporting(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    // Check user role
    var isRestaurantOwner = user && user.userType === "restaurant_owner";
    var isFoodTruck = user && user.userType === "food_truck";
    var isAdmin = user && (user.userType === "admin" || user.userType === "super_admin");
    var isStaff = user && user.userType === "staff";
    var isEventCoordinator = user && user.userType === "event_coordinator";
    var _b = useState(false), isHost = _b[0], setIsHost = _b[1];
    // Detect if this user has a host profile so we can show host flows
    useEffect(function () {
        if (!user) {
            setIsHost(false);
            return;
        }
        var cancelled = false;
        fetch("/api/hosts/me")
            .then(function (res) {
            if (cancelled)
                return;
            setIsHost(res.ok);
        })
            .catch(function () {
            if (cancelled)
                return;
            setIsHost(false);
        });
        return function () {
            cancelled = true;
        };
    }, [user === null || user === void 0 ? void 0 : user.id]);
    // Debug logging (development only)
    if (user && typeof window !== "undefined" && import.meta.env.DEV) {
        console.log("🔍 Navigation User Debug:", {
            email: user.email,
            userType: user.userType,
            isAdmin: isAdmin,
            isStaff: isStaff,
            isRestaurantOwner: isRestaurantOwner,
            isEventCoordinator: isEventCoordinator,
            isHost: isHost,
        });
    }
    // Shared core nav: Food (home), Map, Video, Profile (only when logged in)
    var sharedNavItems = __spreadArray([
        { path: "/", icon: UtensilsCrossed, label: "Food" },
        { path: "/map", icon: MapPin, label: "Map" },
        { path: "/parking-pass", icon: ParkingSquare, label: "Parking Pass" },
        { path: "/video", icon: Clapperboard, label: "Video" }
    ], (user ? [{ path: "/profile", icon: User, label: "Profile" }] : []), true);
    var customerExtras = [
        { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/favorites", icon: Heart, label: "Favorites" },
    ];
    var unauthenticatedExtras = [
        { path: "/customer-signup", icon: UserPlus, label: "Create Account" },
    ];
    // Host-specific flows: dashboard + host marketing and discovery
    var hostExtras = [
        { path: "/events", icon: Calendar, label: "Events" },
        { path: "/host/dashboard", icon: Users, label: "Host" },
        { path: "/for-restaurants", icon: Store, label: "For Restaurants" },
        { path: "/for-bars", icon: Store, label: "For Bars" },
    ];
    // Staff should be able to jump into every major website flow
    // Including all business types (restaurant, food truck, bar), host, and event coordinator capabilities
    var staffExtras = [
        { path: "/events", icon: Calendar, label: "Events" },
        { path: "/staff", icon: Users, label: "Staff" },
        { path: "/host/dashboard", icon: Users, label: "Host" },
        { path: "/restaurant-owner-dashboard", icon: Store, label: "Dashboard" },
        { path: "/deal-creation", icon: Plus, label: "Create Special" },
        { path: "/subscription", icon: BarChart3, label: "Subscription" },
        { path: "/parking-pass", icon: Search, label: "Parking Pass" },
        { path: "/for-restaurants", icon: Store, label: "For Restaurants" },
        { path: "/for-bars", icon: Store, label: "For Bars" },
        { path: "/deals/featured", icon: Receipt, label: "Featured Specials" },
    ];
    var restaurantOwnerExtras = [
        { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/deal-creation", icon: Plus, label: "Create Special" },
        { path: "/subscription", icon: BarChart3, label: "Subscription" },
    ];
    var bugNavItem = {
        label: "Report",
        icon: Bug,
        onClick: handleBugReport,
        isBug: true,
    };
    var mergeNavItems = function () {
        var groups = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            groups[_i] = arguments[_i];
        }
        var seen = new Set();
        var result = [];
        for (var _a = 0, groups_1 = groups; _a < groups_1.length; _a++) {
            var group = groups_1[_a];
            for (var _b = 0, group_1 = group; _b < group_1.length; _b++) {
                var item = group_1[_b];
                var key = item.path ? "path:".concat(item.path) : "label:".concat(item.label);
                if (seen.has(key))
                    continue;
                seen.add(key);
                result.push(item);
            }
        }
        return result;
    };
    // Admins should see every flow including all business types, host, and event coordinator capabilities
    var adminNavItems = mergeNavItems(sharedNavItems, __spreadArray(__spreadArray(__spreadArray([
        { path: "/admin/dashboard", icon: Shield, label: "Admin" },
        { path: "/admin/affiliates", icon: Users, label: "Affiliates" },
        { path: "/staff", icon: Users, label: "Staff" },
        { path: "/events", icon: Calendar, label: "Events" },
        { path: "/host/dashboard", icon: Users, label: "Host" }
    ], restaurantOwnerExtras, true), [
        { path: "/parking-pass", icon: Search, label: "Parking Pass" }
    ], false), customerExtras, true));
    var customerNavItems = mergeNavItems(sharedNavItems, customerExtras);
    var unauthenticatedNavItems = mergeNavItems(sharedNavItems, unauthenticatedExtras);
    var staffNavItems = mergeNavItems(sharedNavItems, staffExtras);
    var restaurantOwnerNavItems = mergeNavItems(sharedNavItems, restaurantOwnerExtras);
    var hostNavItems = mergeNavItems(sharedNavItems, customerExtras, hostExtras);
    var eventCoordinatorExtras = [
        { path: "/events", icon: Calendar, label: "Events" },
        { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ];
    var eventCoordinatorNavItems = mergeNavItems(sharedNavItems, eventCoordinatorExtras);
    var foodTruckNavItems = mergeNavItems(sharedNavItems, customerExtras, [
        { path: "/events", icon: Calendar, label: "Events" },
        { path: "/parking-pass", icon: ParkingSquare, label: "Parking Pass" },
    ]);
    var navItems = !user
        ? __spreadArray(__spreadArray([], unauthenticatedNavItems, true), [bugNavItem], false) : isAdmin
        ? __spreadArray(__spreadArray([], adminNavItems, true), [bugNavItem], false) : isStaff
        ? __spreadArray(__spreadArray([], staffNavItems, true), [bugNavItem], false) : isEventCoordinator
        ? __spreadArray(__spreadArray([], eventCoordinatorNavItems, true), [bugNavItem], false) : isFoodTruck
        ? __spreadArray(__spreadArray([], foodTruckNavItems, true), [bugNavItem], false) : isRestaurantOwner
        ? __spreadArray(__spreadArray([], restaurantOwnerNavItems, true), [bugNavItem], false) : isHost
        ? __spreadArray(__spreadArray([], hostNavItems, true), [bugNavItem], false) : __spreadArray(__spreadArray([], customerNavItems, true), [bugNavItem], false);
    return (<nav className="nav-bar fixed bottom-0 left-0 right-0 w-full border-t px-4 py-2 z-50">
      <div className="w-full mx-auto overflow-x-auto md:overflow-visible md:max-w-none md:px-6">
        <div className="flex items-center justify-start space-x-2 min-w-max md:flex-wrap md:justify-center md:gap-3">
          {navItems.map(function (item) {
            return item.path ? (<Link key={item.path} href={item.path} className={"nav-link flex flex-col items-center space-y-1 py-2 px-2 rounded-lg transition-all duration-200 ".concat(location === item.path ? "nav-link--active" : "nav-link--inactive")} data-testid={"nav-".concat(item.label.toLowerCase())} aria-label={item.label}>
                <item.icon className="w-5 h-5"/>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>) : (<button key={item.label} onClick={item.onClick} disabled={isReporting} className={"nav-link flex flex-col items-center space-y-1 py-2 px-2 rounded-lg transition-all duration-200 ".concat(item.isBug ? "nav-bug" : "nav-link--inactive", " ").concat(isReporting ? "opacity-80 cursor-not-allowed" : "")} data-testid={"nav-".concat(item.label.toLowerCase())} aria-label={item.label}>
                {isReporting ? (<div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>) : (<item.icon className="w-5 h-5"/>)}
                <span className="text-xs font-medium">{item.label}</span>
              </button>);
        })}
        </div>
      </div>
    </nav>);
}
