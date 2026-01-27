var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import ShareButton from "@/components/share-button";
import { Store, Plus, TrendingUp, Users, DollarSign, Eye, ShoppingCart, Star, Settings, CreditCard, BarChart3, MapPin, Clock, Edit, Download, RefreshCw, Truck, Navigation as NavigationIcon, Radio, Wifi, WifiOff, Activity, AlertCircle, Play, Square, Loader2, Zap, Smartphone, Satellite, Save, RotateCcw, } from "lucide-react";
import Navigation from "@/components/navigation";
import RestaurantCreditRedemptionForm from "@/components/RestaurantCreditRedemptionForm";
import { format, subDays } from "date-fns";
import { useFoodTruckSocket } from "@/hooks/useFoodTruckSocket";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, } from "recharts";
import { z } from "zod";
import { BackHeader } from "@/components/back-header";
import { SEOHead } from "@/components/seo-head";
export default function RestaurantOwnerDashboard() {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    var user = useAuth().user;
    var _0 = useLocation(), setLocation = _0[1];
    var toast = useToast().toast;
    var _1 = useState(""), selectedRestaurant = _1[0], setSelectedRestaurant = _1[1];
    var _2 = useState({
        start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
        end: format(new Date(), "yyyy-MM-dd"),
    }), analyticsDateRange = _2[0], setAnalyticsDateRange = _2[1];
    var _3 = useState("month"), comparisonPeriod = _3[0], setComparisonPeriod = _3[1];
    // Food truck state
    var _4 = useState(false), isBroadcasting = _4[0], setIsBroadcasting = _4[1];
    var _5 = useState(null), currentLocation = _5[0], setCurrentLocation = _5[1];
    var _6 = useState(null), locationError = _6[0], setLocationError = _6[1];
    var _7 = useState(null), gpsWatchId = _7[0], setGpsWatchId = _7[1];
    var _8 = useState(null), lastBroadcast = _8[0], setLastBroadcast = _8[1];
    var _9 = useState(0), broadcastCount = _9[0], setBroadcastCount = _9[1];
    var _10 = useState("disconnected"), connectionStatus = _10[0], setConnectionStatus = _10[1];
    var _11 = useState(null), gpsAccuracy = _11[0], setGpsAccuracy = _11[1];
    var _12 = useState(null), sessionId = _12[0], setSessionId = _12[1];
    var isRestaurantOwner = (user === null || user === void 0 ? void 0 : user.userType) === "restaurant_owner";
    var isAdmin = (user === null || user === void 0 ? void 0 : user.userType) === "admin" || (user === null || user === void 0 ? void 0 : user.userType) === "super_admin";
    var isStaff = (user === null || user === void 0 ? void 0 : user.userType) === "staff";
    useEffect(function () {
        if (!user)
            return;
        // Only restaurant owners, admins, and staff should see this dashboard.
        if (!isRestaurantOwner && !isAdmin && !isStaff) {
            setLocation("/");
        }
    }, [user, isRestaurantOwner, isAdmin, isStaff, setLocation]);
    // Location update state
    var _13 = useState(false), isUpdatingLocation = _13[0], setIsUpdatingLocation = _13[1];
    var _14 = useState(null), locationUpdateError = _14[0], setLocationUpdateError = _14[1];
    // WebSocket integration for real-time updates
    var _15 = useFoodTruckSocket({
        onLocationUpdate: function (location) {
            console.log("Received location update:", location);
            // Update UI with real-time location data from other sources if needed
        },
        onStatusUpdate: function (status) {
            console.log("Received status update:", status);
            // Handle status updates from server
        },
        autoConnect: true,
    }), isConnected = _15.isConnected, wsError = _15.connectionError, subscribeToRestaurant = _15.subscribeToRestaurant, connectWS = _15.connect, disconnectWS = _15.disconnect;
    // Fetch user's restaurants
    var _16 = useQuery({
        queryKey: ["/api/restaurants/my-restaurants"],
        enabled: !!user,
    }), _17 = _16.data, restaurants = _17 === void 0 ? [] : _17, loadingRestaurants = _16.isLoading;
    // Fetch subscription status (no aggressive retries to avoid 503 spam)
    var subscription = useQuery({
        queryKey: ["/api/subscription/status"],
        enabled: !!user,
        retry: false,
        refetchOnWindowFocus: false,
    }).data;
    // Fetch favorites analytics for paid users
    var _18 = useQuery({
        queryKey: [
            "/api/restaurants/".concat(selectedRestaurant, "/analytics/favorites"),
            analyticsDateRange,
        ],
        enabled: !!selectedRestaurant && ((_a = subscription === null || subscription === void 0 ? void 0 : subscription.hasAccess) !== null && _a !== void 0 ? _a : false),
    }), favoritesAnalytics = _18.data, loadingFavorites = _18.isLoading;
    // Fetch recommendations analytics for paid users
    var _19 = useQuery({
        queryKey: [
            "/api/restaurants/".concat(selectedRestaurant, "/analytics/recommendations"),
            analyticsDateRange,
        ],
        enabled: !!selectedRestaurant && ((_b = subscription === null || subscription === void 0 ? void 0 : subscription.hasAccess) !== null && _b !== void 0 ? _b : false),
    }), recommendationsAnalytics = _19.data, loadingRecommendations = _19.isLoading;
    // Fetch deals for selected restaurant
    var _20 = useQuery({
        queryKey: ["/api/deals/restaurant/".concat(selectedRestaurant)],
        enabled: !!selectedRestaurant,
    }), _21 = _20.data, deals = _21 === void 0 ? [] : _21, loadingDeals = _20.isLoading;
    // Fetch dashboard stats
    var stats = useQuery({
        queryKey: ["/api/restaurants/".concat(selectedRestaurant, "/stats")],
        enabled: !!selectedRestaurant,
    }).data;
    // Fetch advanced analytics
    var _22 = useQuery({
        queryKey: [
            "/api/restaurants",
            selectedRestaurant,
            "analytics/summary",
            analyticsDateRange,
        ],
        enabled: !!selectedRestaurant && ((_c = subscription === null || subscription === void 0 ? void 0 : subscription.hasAccess) !== null && _c !== void 0 ? _c : false),
    }), analyticsSummary = _22.data, loadingAnalytics = _22.isLoading;
    var analyticsTimeseries = useQuery({
        queryKey: [
            "/api/restaurants",
            selectedRestaurant,
            "analytics/timeseries",
            analyticsDateRange,
        ],
        enabled: !!selectedRestaurant && ((_d = subscription === null || subscription === void 0 ? void 0 : subscription.hasAccess) !== null && _d !== void 0 ? _d : false),
    }).data;
    var customerInsights = useQuery({
        queryKey: [
            "/api/restaurants",
            selectedRestaurant,
            "analytics/customers",
            analyticsDateRange,
        ],
        enabled: !!selectedRestaurant && ((_e = subscription === null || subscription === void 0 ? void 0 : subscription.hasAccess) !== null && _e !== void 0 ? _e : false),
    }).data;
    var comparison = useQuery({
        queryKey: [
            "/api/restaurants",
            selectedRestaurant,
            "analytics/compare",
            comparisonPeriod,
        ],
        queryFn: function () {
            var currentEnd = new Date(analyticsDateRange.end);
            var currentStart = new Date(analyticsDateRange.start);
            var daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
            var previousStart = new Date(currentStart.getTime() - daysDiff * 24 * 60 * 60 * 1000);
            var previousEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
            return apiRequest("GET", "/api/restaurants/".concat(selectedRestaurant, "/analytics/compare?currentStart=").concat(currentStart.toISOString(), "&currentEnd=").concat(currentEnd.toISOString(), "&previousStart=").concat(previousStart.toISOString(), "&previousEnd=").concat(previousEnd.toISOString()));
        },
        enabled: !!selectedRestaurant && ((_f = subscription === null || subscription === void 0 ? void 0 : subscription.hasAccess) !== null && _f !== void 0 ? _f : false),
    }).data;
    // Calculate distance between two GPS coordinates
    var getDistance = function (lat1, lng1, lat2, lng2) {
        var R = 6371e3; // Earth's radius in meters
        var φ1 = (lat1 * Math.PI) / 180;
        var φ2 = (lat2 * Math.PI) / 180;
        var Δφ = ((lat2 - lat1) * Math.PI) / 180;
        var Δλ = ((lng2 - lng1) * Math.PI) / 180;
        var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
    };
    // Food truck mutations - declared early to avoid hoisting issues
    var updateLocationMutation = useMutation({
        mutationFn: function (location) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/restaurants/".concat(selectedRestaurant, "/location"), {
                            sessionId: sessionId,
                            latitude: location.lat,
                            longitude: location.lng,
                            accuracy: location.accuracy,
                            heading: location.heading,
                            speed: location.speed,
                            source: "gps",
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            setBroadcastCount(function (prev) { return prev + 1; });
            setLastBroadcast(new Date());
        },
        onError: function (error) {
            console.error("Location update failed:", error);
            setLocationError("Failed to update location");
        },
    });
    var stopFoodTruckSessionMutation = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/restaurants/".concat(selectedRestaurant, "/truck-session/end"), {
                            sessionId: sessionId,
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            setIsBroadcasting(false);
            setSessionId(null);
            setConnectionStatus("disconnected");
            // Disconnect WebSocket
            disconnectWS();
            if (gpsWatchId) {
                navigator.geolocation.clearWatch(gpsWatchId);
                setGpsWatchId(null);
            }
            toast({
                title: "Broadcasting Stopped",
                description: "Your food truck is no longer visible to customers.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error Stopping Broadcast",
                description: error.message || "Failed to stop broadcasting.",
                variant: "destructive",
            });
        },
    });
    // Set default restaurant
    useEffect(function () {
        if (restaurants.length > 0 && !selectedRestaurant) {
            setSelectedRestaurant(restaurants[0].id);
        }
    }, [restaurants, selectedRestaurant]);
    // Get current restaurant data
    var currentRestaurant = restaurants.find(function (r) { return r.id === selectedRestaurant; });
    var liveShareUrl = selectedRestaurant
        ? "/restaurant/".concat(selectedRestaurant, "?live=1")
        : "/map";
    var liveShareTitle = (currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.name)
        ? "".concat(currentRestaurant.name, " is live on MealScout")
        : "We are live on MealScout";
    var liveShareDescription = "Find us live right now on the MealScout map.";
    // GPS fallback function using IP geolocation
    var tryFallbackLocation = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch("https://ipapi.co/json/")];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (data.latitude && data.longitude) {
                        return [2 /*return*/, {
                                lat: parseFloat(data.latitude),
                                lng: parseFloat(data.longitude),
                                accuracy: 10000, // IP location is less accurate
                            }];
                    }
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.warn("IP geolocation fallback failed:", error_1);
                    return [3 /*break*/, 5];
                case 5:
                    // Final fallback: use restaurant's base location if available
                    if ((currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.latitude) && (currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.longitude)) {
                        return [2 /*return*/, {
                                lat: parseFloat(currentRestaurant.latitude),
                                lng: parseFloat(currentRestaurant.longitude),
                                accuracy: 5000, // Restaurant location accuracy estimate
                            }];
                    }
                    return [2 /*return*/, null];
            }
        });
    }); };
    // GPS tracking effect with fallback
    useEffect(function () {
        if (isBroadcasting && sessionId) {
            if (!navigator.geolocation) {
                setLocationError("GPS not supported. Trying fallback location...");
                // Use fallback location when GPS is not supported
                tryFallbackLocation().then(function (fallbackLocation) {
                    if (fallbackLocation) {
                        setCurrentLocation(fallbackLocation);
                        setGpsAccuracy(fallbackLocation.accuracy || 10000);
                        setLocationError("Using approximate location (GPS unavailable)");
                        setConnectionStatus("connected");
                        updateLocationMutation.mutate({
                            lat: fallbackLocation.lat,
                            lng: fallbackLocation.lng,
                            accuracy: fallbackLocation.accuracy || 10000,
                        });
                    }
                    else {
                        setLocationError("Unable to determine location. Please check your settings.");
                        setConnectionStatus("disconnected");
                    }
                });
                return;
            }
            var watchId_1 = navigator.geolocation.watchPosition(function (position) {
                var newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                };
                // Update location state
                setCurrentLocation(newLocation);
                setGpsAccuracy(position.coords.accuracy);
                setLocationError(null);
                setConnectionStatus("connected");
                // Only send updates if location changed significantly (50m threshold)
                if (!lastBroadcast ||
                    Date.now() - lastBroadcast.getTime() > 30000 || // 30 seconds minimum
                    (currentLocation &&
                        getDistance(currentLocation.lat, currentLocation.lng, newLocation.lat, newLocation.lng) > 50)) {
                    updateLocationMutation.mutate({
                        lat: newLocation.lat,
                        lng: newLocation.lng,
                        accuracy: position.coords.accuracy,
                        heading: position.coords.heading || undefined,
                        speed: position.coords.speed || undefined,
                    });
                }
            }, function (error) { return __awaiter(_this, void 0, void 0, function () {
                var fallbackMessage, fallbackLocation;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.error("GPS error:", error);
                            fallbackMessage = "GPS error. ";
                            if (error.code === error.PERMISSION_DENIED) {
                                fallbackMessage += "Location access denied. ";
                            }
                            else if (error.code === error.POSITION_UNAVAILABLE) {
                                fallbackMessage += "Location unavailable. ";
                            }
                            else if (error.code === error.TIMEOUT) {
                                fallbackMessage += "Location timeout. ";
                            }
                            setLocationError(fallbackMessage + "Trying fallback...");
                            setConnectionStatus("connecting");
                            return [4 /*yield*/, tryFallbackLocation()];
                        case 1:
                            fallbackLocation = _a.sent();
                            if (fallbackLocation) {
                                setCurrentLocation(fallbackLocation);
                                setGpsAccuracy(fallbackLocation.accuracy || 10000);
                                setLocationError(fallbackMessage + "Using approximate location.");
                                setConnectionStatus("connected");
                                updateLocationMutation.mutate({
                                    lat: fallbackLocation.lat,
                                    lng: fallbackLocation.lng,
                                    accuracy: fallbackLocation.accuracy || 10000,
                                });
                            }
                            else {
                                setLocationError(fallbackMessage + "Unable to determine location.");
                                setConnectionStatus("disconnected");
                            }
                            return [2 /*return*/];
                    }
                });
            }); }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000,
            });
            setGpsWatchId(watchId_1);
            return function () {
                navigator.geolocation.clearWatch(watchId_1);
            };
        }
    }, [
        isBroadcasting,
        sessionId,
        lastBroadcast,
        currentLocation,
        updateLocationMutation,
        currentRestaurant,
    ]);
    // Auto-stop broadcasting after 2 minutes of inactivity
    useEffect(function () {
        if (isBroadcasting && lastBroadcast) {
            var timeout_1 = setTimeout(function () {
                if (Date.now() - lastBroadcast.getTime() > 120000) {
                    // 2 minutes
                    stopFoodTruckSessionMutation.mutate();
                    setLocationError("Session timed out due to inactivity");
                }
            }, 125000); // Check after 2 minutes 5 seconds
            return function () { return clearTimeout(timeout_1); };
        }
    }, [lastBroadcast, isBroadcasting, stopFoodTruckSessionMutation]);
    // Operating hours form schema
    var operatingHoursSchema = z.object({
        mon: z
            .array(z.object({
            open: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
            close: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
        }))
            .optional(),
        tue: z
            .array(z.object({
            open: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
            close: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
        }))
            .optional(),
        wed: z
            .array(z.object({
            open: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
            close: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
        }))
            .optional(),
        thu: z
            .array(z.object({
            open: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
            close: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
        }))
            .optional(),
        fri: z
            .array(z.object({
            open: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
            close: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
        }))
            .optional(),
        sat: z
            .array(z.object({
            open: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
            close: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
        }))
            .optional(),
        sun: z
            .array(z.object({
            open: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
            close: z
                .string()
                .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
        }))
            .optional(),
    });
    // Operating hours form
    var operatingHoursForm = useForm({
        resolver: zodResolver(operatingHoursSchema),
        defaultValues: {
            mon: ((_g = currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.operatingHours) === null || _g === void 0 ? void 0 : _g.mon) || [],
            tue: ((_h = currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.operatingHours) === null || _h === void 0 ? void 0 : _h.tue) || [],
            wed: ((_j = currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.operatingHours) === null || _j === void 0 ? void 0 : _j.wed) || [],
            thu: ((_k = currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.operatingHours) === null || _k === void 0 ? void 0 : _k.thu) || [],
            fri: ((_l = currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.operatingHours) === null || _l === void 0 ? void 0 : _l.fri) || [],
            sat: ((_m = currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.operatingHours) === null || _m === void 0 ? void 0 : _m.sat) || [],
            sun: ((_o = currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.operatingHours) === null || _o === void 0 ? void 0 : _o.sun) || [],
        },
    });
    // Reset form when restaurant changes
    useEffect(function () {
        var _a, _b, _c, _d, _e, _f, _g;
        if (currentRestaurant) {
            operatingHoursForm.reset({
                mon: ((_a = currentRestaurant.operatingHours) === null || _a === void 0 ? void 0 : _a.mon) || [],
                tue: ((_b = currentRestaurant.operatingHours) === null || _b === void 0 ? void 0 : _b.tue) || [],
                wed: ((_c = currentRestaurant.operatingHours) === null || _c === void 0 ? void 0 : _c.wed) || [],
                thu: ((_d = currentRestaurant.operatingHours) === null || _d === void 0 ? void 0 : _d.thu) || [],
                fri: ((_e = currentRestaurant.operatingHours) === null || _e === void 0 ? void 0 : _e.fri) || [],
                sat: ((_f = currentRestaurant.operatingHours) === null || _f === void 0 ? void 0 : _f.sat) || [],
                sun: ((_g = currentRestaurant.operatingHours) === null || _g === void 0 ? void 0 : _g.sun) || [],
            });
        }
    }, [currentRestaurant, operatingHoursForm]);
    // Start broadcasting handler
    var handleStartBroadcasting = function () {
        if (!navigator.geolocation) {
            toast({
                title: "GPS Not Available",
                description: "Your device doesn't support GPS location.",
                variant: "destructive",
            });
            return;
        }
        setConnectionStatus("connecting");
        navigator.geolocation.getCurrentPosition(function (position) {
            var location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setCurrentLocation(__assign(__assign({}, location), { accuracy: position.coords.accuracy, timestamp: position.timestamp }));
            startFoodTruckSessionMutation.mutate(location);
        }, function (error) {
            setLocationError(error.message);
            setConnectionStatus("disconnected");
            toast({
                title: "Location Error",
                description: "Unable to get your current location. Please check your GPS settings.",
                variant: "destructive",
            });
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
        });
    };
    // Stop broadcasting handler
    var handleStopBroadcasting = function () {
        stopFoodTruckSessionMutation.mutate();
    };
    // Handle restaurant location update
    var handleUpdateRestaurantLocation = function () {
        if (!navigator.geolocation) {
            toast({
                title: "GPS Not Available",
                description: "Your device doesn't support GPS location.",
                variant: "destructive",
            });
            return;
        }
        setIsUpdatingLocation(true);
        setLocationUpdateError(null);
        navigator.geolocation.getCurrentPosition(function (position) {
            var location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
            updateRestaurantLocationMutation.mutate(location);
        }, function (error) {
            setLocationUpdateError(error.message);
            setIsUpdatingLocation(false);
            toast({
                title: "Location Error",
                description: "Unable to get your current location. Please check your GPS settings.",
                variant: "destructive",
            });
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
        });
    };
    // Handle operating hours form submission
    var handleOperatingHoursSubmit = function (data) {
        updateOperatingHoursMutation.mutate(data);
    };
    // Helper function to add time slot
    var addTimeSlot = function (day) {
        var currentSlots = operatingHoursForm.getValues(day) || [];
        if (currentSlots.length < 3) {
            operatingHoursForm.setValue(day, __spreadArray(__spreadArray([], currentSlots, true), [
                { open: "09:00", close: "17:00" },
            ], false));
        }
    };
    // Helper function to remove time slot
    var removeTimeSlot = function (day, index) {
        var currentSlots = operatingHoursForm.getValues(day) || [];
        var newSlots = currentSlots.filter(function (_, i) { return i !== index; });
        operatingHoursForm.setValue(day, newSlots);
    };
    // Toggle deal status
    var toggleDealMutation = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var dealId = _b.dealId, isActive = _b.isActive;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/deals/".concat(dealId), {
                            isActive: !isActive,
                        })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/deals/restaurant/".concat(selectedRestaurant)],
            });
            toast({
                title: "Deal Updated",
                description: "Deal status has been updated successfully.",
            });
        },
    });
    // Delete deal
    var deleteDealMutation = useMutation({
        mutationFn: function (dealId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("DELETE", "/api/deals/".concat(dealId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/deals/restaurant/".concat(selectedRestaurant)],
            });
            toast({
                title: "Deal Deleted",
                description: "Deal has been deleted successfully.",
            });
        },
    });
    // Update deal
    var updateDealMutation = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var dealId = _b.dealId, updates = _b.updates;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/deals/".concat(dealId), updates)];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/deals/restaurant/".concat(selectedRestaurant)],
            });
            toast({
                title: "Deal Updated",
                description: "Deal has been updated successfully.",
            });
        },
    });
    // Food truck mutations
    var startFoodTruckSessionMutation = useMutation({
        mutationFn: function (location) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/restaurants/".concat(selectedRestaurant, "/truck-session/start"), {
                            latitude: location.lat,
                            longitude: location.lng,
                            deviceId: navigator.userAgent || "web-browser",
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function (data) {
            var _a;
            setSessionId(((_a = data === null || data === void 0 ? void 0 : data.session) === null || _a === void 0 ? void 0 : _a.id) || null);
            setIsBroadcasting(true);
            setConnectionStatus("connected");
            // Connect to WebSocket and subscribe to restaurant updates
            connectWS();
            setTimeout(function () {
                subscribeToRestaurant(selectedRestaurant);
            }, 1000);
            toast({
                title: "Broadcasting Started",
                description: "Your food truck is now visible to customers nearby.",
            });
        },
        onError: function (error) {
            toast({
                title: "Failed to Start Broadcasting",
                description: error.message || "Unable to start food truck session.",
                variant: "destructive",
            });
        },
    });
    var toggleFoodTruckMutation = useMutation({
        mutationFn: function (isFoodTruck) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/restaurants/".concat(selectedRestaurant), {
                            isFoodTruck: isFoodTruck,
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/restaurants/my-restaurants"],
            });
            toast({
                title: "Restaurant Updated",
                description: "Food truck settings have been saved.",
            });
        },
    });
    // Restaurant location update mutation (different from food truck location)
    var updateRestaurantLocationMutation = useMutation({
        mutationFn: function (location) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/restaurants/".concat(selectedRestaurant, "/location"), location)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/restaurants/my-restaurants"],
            });
            setLocationUpdateError(null);
            setIsUpdatingLocation(false);
            toast({
                title: "Location Updated",
                description: "Your restaurant location has been updated successfully.",
            });
        },
        onError: function (error) {
            setLocationUpdateError(error.message || "Failed to update location");
            setIsUpdatingLocation(false);
            toast({
                title: "Error Updating Location",
                description: error.message || "Failed to update restaurant location.",
                variant: "destructive",
            });
        },
    });
    // Operating hours update mutation
    var updateOperatingHoursMutation = useMutation({
        mutationFn: function (operatingHours) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("PATCH", "/api/restaurants/".concat(selectedRestaurant, "/operating-hours"), {
                            operatingHours: operatingHours,
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({
                queryKey: ["/api/restaurants/my-restaurants"],
            });
            toast({
                title: "Operating Hours Updated",
                description: "Your restaurant operating hours have been updated successfully.",
            });
        },
        onError: function (error) {
            toast({
                title: "Error Updating Operating Hours",
                description: error.message || "Failed to update operating hours.",
                variant: "destructive",
            });
        },
    });
    var formatTime = function (time) {
        var _a = time.split(":"), hours = _a[0], minutes = _a[1];
        var hour = parseInt(hours);
        var ampm = hour >= 12 ? "PM" : "AM";
        var displayHour = hour % 12 || 12;
        return "".concat(displayHour, ":").concat(minutes, " ").concat(ampm);
    };
    var getDealTypeColor = function (type) {
        switch (type) {
            case "breakfast":
                return "bg-yellow-100 text-yellow-800";
            case "lunch":
                return "bg-blue-100 text-blue-800";
            case "dinner":
                return "bg-purple-100 text-purple-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    if (loadingRestaurants) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
      </div>);
    }
    if (restaurants.length === 0) {
        return (<div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <Store className="h-16 w-16 mx-auto text-muted-foreground"/>
          <h1 className="text-3xl font-bold">No Restaurant Found</h1>
          <p className="text-muted-foreground">
            You need to register your restaurant first to create specials.
          </p>
          <Link href="/restaurant-signup">
            <Button size="lg" data-testid="button-register-restaurant">
              Register Your Restaurant
            </Button>
          </Link>
        </div>
      </div>);
    }
    return (<div className="container mx-auto px-4 py-8">
      <SEOHead title="Restaurant Dashboard - MealScout | Manage Your Specials" description="Manage your restaurant specials, view analytics, track performance, and engage with customers. Access insights on special claims, views, conversion rates, and customer feedback." keywords="restaurant dashboard, manage specials, restaurant analytics, special performance, customer insights" canonicalUrl="https://mealscout.us/restaurant-owner-dashboard" noIndex={true}/>
      {/* Header with Back Button */}
      <BackHeader title="Restaurant Dashboard" fallbackHref="/" icon={Store} rightActions={<div className="flex gap-3">
            {(subscription === null || subscription === void 0 ? void 0 : subscription.status) === "active" ||
                (subscription === null || subscription === void 0 ? void 0 : subscription.hasAccess) === true ? (<Link href="/deal-creation">
                <Button data-testid="button-create-deal">
                  <Plus className="h-4 w-4 mr-2"/>
                  Create New Special
                </Button>
              </Link>) : (<Link href="/subscribe">
                <Button variant="default" data-testid="button-subscribe">
                  <CreditCard className="h-4 w-4 mr-2"/>
                  Subscribe to Create Specials
                </Button>
              </Link>)}
            <Link href="/subscription">
              <Button variant="outline" data-testid="button-manage-subscription">
                <Settings className="h-4 w-4 mr-2"/>
                Manage Subscription
              </Button>
            </Link>
          </div>} className="bg-white border-b border-border mb-8"/>

      {/* Restaurant Selector */}
      {restaurants.length > 1 && (<div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Restaurant
          </label>
          <select value={selectedRestaurant} onChange={function (e) { return setSelectedRestaurant(e.target.value); }} className="px-3 py-2 border rounded-lg" data-testid="select-restaurant">
            {restaurants.map(function (restaurant) { return (<option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>); })}
          </select>
        </div>)}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4"/>
              Active Specials
            </CardDescription>
            <CardTitle className="text-3xl">
              {(stats === null || stats === void 0 ? void 0 : stats.activeDeals) || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-4 w-4"/>
              Total Views
            </CardDescription>
            <CardTitle className="text-3xl">{(stats === null || stats === void 0 ? void 0 : stats.totalViews) || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4"/>
              Claims
            </CardDescription>
            <CardTitle className="text-3xl">
              {(stats === null || stats === void 0 ? void 0 : stats.totalClaims) || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4"/>
              Conversion Rate
            </CardDescription>
            <CardTitle className="text-3xl">
              {((_p = stats === null || stats === void 0 ? void 0 : stats.conversionRate) === null || _p === void 0 ? void 0 : _p.toFixed(1)) || 0}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Deals Management */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Specials</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Specials</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="credits">
            <CreditCard className="h-4 w-4 mr-1"/>
            MealScout Credits
          </TabsTrigger>
          <TabsTrigger value="foodtruck" data-testid="tab-food-truck">
            <Truck className="h-4 w-4 mr-1"/>
            Food Truck
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loadingDeals ? (<Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
              </CardContent>
            </Card>) : (deals
            .filter(function (deal) { return deal.isActive; })
            .map(function (deal) { return (<Card key={deal.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {deal.title}
                          </h3>
                          <Badge className={getDealTypeColor(deal.dealType)}>
                            {deal.dealType}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground mb-3">
                          {deal.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4"/>
                            <span className="font-medium">
                              {deal.discountValue}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4"/>
                            <span>
                              {deal.availableDuringBusinessHours
                ? "During business hours"
                : deal.startTime && deal.endTime
                    ? "".concat(formatTime(deal.startTime), " - ").concat(formatTime(deal.endTime))
                    : "All day"}
                            </span>
                          </div>
                          {deal.totalUsesLimit && (<div className="flex items-center gap-1">
                              <Users className="h-4 w-4"/>
                              <span>
                                {deal.currentUses || 0} / {deal.totalUsesLimit}{" "}
                                claimed
                              </span>
                            </div>)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={"/deal/".concat(deal.id)}>
                          <Button variant="ghost" size="sm" data-testid={"button-view-".concat(deal.id)}>
                            <Eye className="h-4 w-4 mr-1"/>
                            View
                          </Button>
                        </Link>
                        <Link href={"/deal-edit/".concat(deal.id)}>
                          <Button variant="outline" size="sm" data-testid={"button-edit-".concat(deal.id)}>
                            <Edit className="h-4 w-4 mr-1"/>
                            Edit
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={function () {
                return toggleDealMutation.mutate({
                    dealId: deal.id,
                    isActive: Boolean(deal.isActive),
                });
            }} data-testid={"button-deactivate-".concat(deal.id)}>
                          {deal.isActive ? "Pause" : "Activate"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={function () {
                if (confirm("Are you sure you want to delete \"".concat(deal.title, "\"? This cannot be undone."))) {
                    deleteDealMutation.mutate(deal.id);
                }
            }} data-testid={"button-delete-".concat(deal.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>); }))}

          {deals.filter(function (deal) { return deal.isActive; }).length === 0 &&
            !loadingDeals && (<Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No active specials
                  </p>
                  <Link href="/deal-creation">
                    <Button data-testid="button-create-first-deal">
                      <Plus className="h-4 w-4 mr-2"/>
                      Create Your First Special
                    </Button>
                  </Link>
                </CardContent>
              </Card>)}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {deals
            .filter(function (deal) { return !deal.isActive; })
            .map(function (deal) { return (<Card key={deal.id} className="opacity-75">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{deal.title}</h3>
                        <Badge variant="secondary">Inactive</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">
                        {deal.description}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={function () {
                return toggleDealMutation.mutate({
                    dealId: deal.id,
                    isActive: Boolean(deal.isActive),
                });
            }} data-testid={"button-activate-".concat(deal.id)}>
                        Activate
                      </Button>
                      <Button variant="destructive" size="sm" onClick={function () { return deleteDealMutation.mutate(deal.id); }} data-testid={"button-delete-inactive-".concat(deal.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>); })}

          {deals.filter(function (deal) { return !deal.isActive; }).length === 0 &&
            !loadingDeals && (<Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No inactive specials</p>
                </CardContent>
              </Card>)}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Analytics Header with Date Range */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5"/>
                      Performance Analytics
                    </CardTitle>
                    <CardDescription>
                      Comprehensive insights into your specials performance and
                      customer engagement
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2">
                      <input type="date" value={analyticsDateRange.start} onChange={function (e) {
            return setAnalyticsDateRange(function (prev) { return (__assign(__assign({}, prev), { start: e.target.value })); });
        }} className="px-3 py-2 border rounded-md text-sm" data-testid="input-analytics-start-date"/>
                      <input type="date" value={analyticsDateRange.end} onChange={function (e) {
            return setAnalyticsDateRange(function (prev) { return (__assign(__assign({}, prev), { end: e.target.value })); });
        }} className="px-3 py-2 border rounded-md text-sm" data-testid="input-analytics-end-date"/>
                    </div>
                    {(subscription === null || subscription === void 0 ? void 0 : subscription.hasAccess) && (<Button variant="outline" size="sm" onClick={function () {
                var url = "/api/restaurants/".concat(selectedRestaurant, "/analytics/export?startDate=").concat(analyticsDateRange.start, "&endDate=").concat(analyticsDateRange.end, "&format=csv");
                window.open(url, "_blank");
            }} data-testid="button-export-analytics">
                        <Download className="h-4 w-4 mr-2"/>
                        Export CSV
                      </Button>)}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Performance Overview Cards */}
            {loadingAnalytics ? (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {__spreadArray([], Array(4), true).map(function (_, i) { return (<Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-8 bg-muted rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>); })}
              </div>) : (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Views
                        </p>
                        <p className="text-2xl font-bold" data-testid="text-total-views">
                          {((_q = analyticsSummary === null || analyticsSummary === void 0 ? void 0 : analyticsSummary.totalViews) === null || _q === void 0 ? void 0 : _q.toLocaleString()) || 0}
                        </p>
                      </div>
                      <Eye className="h-8 w-8 text-blue-500"/>
                    </div>
                    {comparison &&
                (comparison === null || comparison === void 0 ? void 0 : comparison.changes) &&
                typeof comparison.changes.viewsChange ===
                    "number" && (<div className="mt-2 flex items-center text-xs">
                          <TrendingUp className={"h-3 w-3 mr-1 ".concat(comparison.changes.viewsChange >= 0
                    ? "text-green-500"
                    : "text-red-500")}/>
                          <span className={comparison.changes.viewsChange >= 0
                    ? "text-green-500"
                    : "text-red-500"}>
                            {comparison.changes.viewsChange >= 0
                    ? "+"
                    : ""}
                            {comparison.changes.viewsChange.toFixed(1)}
                            %
                          </span>
                          <span className="text-muted-foreground ml-1">
                            vs previous period
                          </span>
                        </div>)}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Claims
                        </p>
                        <p className="text-2xl font-bold" data-testid="text-total-claims">
                          {((_r = analyticsSummary === null || analyticsSummary === void 0 ? void 0 : analyticsSummary.totalClaims) === null || _r === void 0 ? void 0 : _r.toLocaleString()) || 0}
                        </p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-green-500"/>
                    </div>
                    {comparison &&
                (comparison === null || comparison === void 0 ? void 0 : comparison.changes) &&
                typeof comparison.changes.claimsChange ===
                    "number" && (<div className="mt-2 flex items-center text-xs">
                          <TrendingUp className={"h-3 w-3 mr-1 ".concat(comparison.changes.claimsChange >= 0
                    ? "text-green-500"
                    : "text-red-500")}/>
                          <span className={comparison.changes.claimsChange >= 0
                    ? "text-green-500"
                    : "text-red-500"}>
                            {comparison.changes.claimsChange >= 0
                    ? "+"
                    : ""}
                            {comparison.changes.claimsChange.toFixed(1)}
                            %
                          </span>
                          <span className="text-muted-foreground ml-1">
                            vs previous period
                          </span>
                        </div>)}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Revenue
                        </p>
                        <p className="text-2xl font-bold" data-testid="text-total-revenue">
                          $
                          {((_s = analyticsSummary === null || analyticsSummary === void 0 ? void 0 : analyticsSummary.totalRevenue) === null || _s === void 0 ? void 0 : _s.toLocaleString()) || 0}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-yellow-500"/>
                    </div>
                    {comparison &&
                (comparison === null || comparison === void 0 ? void 0 : comparison.changes) &&
                typeof comparison.changes.revenueChange ===
                    "number" && (<div className="mt-2 flex items-center text-xs">
                          <TrendingUp className={"h-3 w-3 mr-1 ".concat(comparison.changes.revenueChange >= 0
                    ? "text-green-500"
                    : "text-red-500")}/>
                          <span className={comparison.changes.revenueChange >= 0
                    ? "text-green-500"
                    : "text-red-500"}>
                            {comparison.changes.revenueChange >= 0
                    ? "+"
                    : ""}
                            {comparison.changes.revenueChange.toFixed(1)}
                            %
                          </span>
                          <span className="text-muted-foreground ml-1">
                            vs previous period
                          </span>
                        </div>)}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Conversion Rate
                        </p>
                        <p className="text-2xl font-bold" data-testid="text-conversion-rate">
                          {((_t = analyticsSummary === null || analyticsSummary === void 0 ? void 0 : analyticsSummary.conversionRate) === null || _t === void 0 ? void 0 : _t.toFixed(1)) || 0}
                          %
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-500"/>
                    </div>
                    {comparison &&
                (comparison === null || comparison === void 0 ? void 0 : comparison.changes) &&
                typeof comparison.changes
                    .conversionRateChange === "number" && (<div className="mt-2 flex items-center text-xs">
                          <TrendingUp className={"h-3 w-3 mr-1 ".concat(comparison.changes
                    .conversionRateChange >= 0
                    ? "text-green-500"
                    : "text-red-500")}/>
                          <span className={comparison.changes
                    .conversionRateChange >= 0
                    ? "text-green-500"
                    : "text-red-500"}>
                            {comparison.changes.conversionRateChange >=
                    0
                    ? "+"
                    : ""}
                            {comparison.changes.conversionRateChange.toFixed(1)}
                            %
                          </span>
                          <span className="text-muted-foreground ml-1">
                            vs previous period
                          </span>
                        </div>)}
                  </CardContent>
                </Card>
              </div>)}

            {/* Premium Analytics Cards - Favorites & Recommendations */}
            {(subscription === null || subscription === void 0 ? void 0 : subscription.hasAccess) ? (<div className="grid grid-cols-2 gap-4 mt-4">
                <Card className="border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Star className="h-3 w-3"/>
                          Total Favorites
                        </p>
                        <p className="text-2xl font-bold" data-testid="text-total-favorites">
                          {loadingFavorites ? (<div className="animate-pulse bg-muted rounded w-16 h-8"></div>) : (((_u = favoritesAnalytics === null || favoritesAnalytics === void 0 ? void 0 : favoritesAnalytics.totalFavorites) === null || _u === void 0 ? void 0 : _u.toLocaleString()) ||
                0)}
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-500"/>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Users who favorited your restaurant
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Zap className="h-3 w-3"/>
                          Recommendations
                        </p>
                        <p className="text-2xl font-bold" data-testid="text-total-recommendations">
                          {loadingRecommendations ? (<div className="animate-pulse bg-muted rounded w-16 h-8"></div>) : (((_v = recommendationsAnalytics === null || recommendationsAnalytics === void 0 ? void 0 : recommendationsAnalytics.totalRecommendations) === null || _v === void 0 ? void 0 : _v.toLocaleString()) ||
                0)}
                        </p>
                      </div>
                      <Zap className="h-8 w-8 text-blue-500"/>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Times shown in recommendations •{" "}
                      {((_w = recommendationsAnalytics === null || recommendationsAnalytics === void 0 ? void 0 : recommendationsAnalytics.clickThroughRate) === null || _w === void 0 ? void 0 : _w.toFixed(1)) ||
                0}
                      % CTR
                    </p>
                  </CardContent>
                </Card>
              </div>) : (<Card className="mt-4 border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-5 w-5"/>
                      <span className="text-sm font-medium">
                        Premium Analytics
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Upgrade to see how many customers have favorited your
                      restaurant and track recommendation performance
                    </p>
                    <Link href="/subscribe">
                      <Button size="sm" className="mt-2" data-testid="button-upgrade-for-analytics">
                        <TrendingUp className="h-4 w-4 mr-2"/>
                        Upgrade Plan
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>)}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Timeline Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Over Time</CardTitle>
                  <CardDescription>
                    Daily revenue and special performance trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsTimeseries &&
            analyticsTimeseries.length > 0 ? (<ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsTimeseries}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="date"/>
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2}/>
                        <Line type="monotone" dataKey="claims" stroke="#82ca9d" strokeWidth={2}/>
                      </LineChart>
                    </ResponsiveContainer>) : (<div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available for selected period
                    </div>)}
                </CardContent>
              </Card>

              {/* Views vs Claims Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Views vs Claims</CardTitle>
                  <CardDescription>
                    Daily views and conversion tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsTimeseries &&
            analyticsTimeseries.length > 0 ? (<ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsTimeseries}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="date"/>
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="views" fill="#8884d8"/>
                        <Bar dataKey="claims" fill="#82ca9d"/>
                      </BarChart>
                    </ResponsiveContainer>) : (<div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available for selected period
                    </div>)}
                </CardContent>
              </Card>
            </div>

            {/* Top Deals Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Top Performing Specials
                </CardTitle>
                <CardDescription>
                  Your most successful specials ranked by views and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {((_x = analyticsSummary === null || analyticsSummary === void 0 ? void 0 : analyticsSummary.topDeals) === null || _x === void 0 ? void 0 : _x.length) > 0 ? (<div className="space-y-4">
                    {analyticsSummary.topDeals.map(function (deal, index) { return (<div key={deal.dealId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{deal.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Deal ID: {deal.dealId}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-6 text-sm">
                            <div className="text-center">
                              <p className="font-medium">{deal.views}</p>
                              <p className="text-muted-foreground">Views</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{deal.claims}</p>
                              <p className="text-muted-foreground">Claims</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">${deal.revenue}</p>
                              <p className="text-muted-foreground">Revenue</p>
                            </div>
                          </div>
                        </div>); })}
                  </div>) : (<div className="text-center py-8 text-muted-foreground">
                    No special performance data available
                  </div>)}
              </CardContent>
            </Card>

            {/* Customer Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Insights</CardTitle>
                  <CardDescription>
                    Understanding your customer behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Repeat Customers
                      </p>
                      <p className="text-2xl font-bold">
                        {(customerInsights === null || customerInsights === void 0 ? void 0 : customerInsights.repeatCustomers) || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Avg Order Value
                      </p>
                      <p className="text-2xl font-bold">
                        $
                        {((_y = customerInsights === null || customerInsights === void 0 ? void 0 : customerInsights.averageOrderValue) === null || _y === void 0 ? void 0 : _y.toFixed(2)) || 0}
                      </p>
                    </div>
                  </div>

                  {((_z = customerInsights === null || customerInsights === void 0 ? void 0 : customerInsights.peakHours) === null || _z === void 0 ? void 0 : _z.length) > 0 && (<div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Peak Hours
                      </p>
                      <div className="space-y-1">
                        {customerInsights.peakHours
                .slice(0, 3)
                .map(function (hour, index) { return (<div key={hour.hour} className="flex justify-between items-center">
                              <span className="text-sm">
                                {hour.hour}:00 - {hour.hour + 1}:00
                              </span>
                              <span className="text-sm font-medium">
                                {hour.count} orders
                              </span>
                            </div>); })}
                      </div>
                    </div>)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Demographics</CardTitle>
                  <CardDescription>
                    Customer age and gender breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(customerInsights === null || customerInsights === void 0 ? void 0 : customerInsights.demographics) ? (<div className="space-y-4">
                      {customerInsights.demographics.ageGroups.length >
                0 && (<div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Age Groups
                          </p>
                          <div className="space-y-1">
                            {customerInsights.demographics.ageGroups.map(function (group) { return (<div key={group.range} className="flex justify-between items-center">
                                <span className="text-sm">{group.range}</span>
                                <span className="text-sm font-medium">
                                  {group.count}
                                </span>
                              </div>); })}
                          </div>
                        </div>)}

                      {customerInsights.demographics.genderBreakdown
                .length > 0 && (<div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Gender Distribution
                          </p>
                          <div className="space-y-1">
                            {customerInsights.demographics.genderBreakdown.map(function (gender) { return (<div key={gender.gender} className="flex justify-between items-center">
                                  <span className="text-sm capitalize">
                                    {gender.gender}
                                  </span>
                                  <span className="text-sm font-medium">
                                    {gender.count}
                                  </span>
                                </div>); })}
                          </div>
                        </div>)}
                    </div>) : (<div className="text-center py-8 text-muted-foreground">
                      No demographic data available
                    </div>)}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* PHASE R1: MealScout Credits Redemption */}
        <TabsContent value="credits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5"/>
                Accept MealScout Credits
              </CardTitle>
              <CardDescription>
                Accept MealScout credits from users as payment. Credits are
                settled weekly via Stripe.
              </CardDescription>
            </CardHeader>
          </Card>

          {selectedRestaurant && (<RestaurantCreditRedemptionForm restaurantId={selectedRestaurant} onSuccess={function (redemption) {
                var _a;
                toast({
                    title: "Success",
                    description: "Credit redeemed successfully! Redemption ID: ".concat((_a = redemption.redemption) === null || _a === void 0 ? void 0 : _a.id),
                });
                // Optionally refresh data or update UI
            }}/>)}
        </TabsContent>

        <TabsContent value="foodtruck" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5"/>
                Food Truck Management
              </CardTitle>
              <CardDescription>
                Manage your mobile restaurant and broadcast live location to
                customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Food Truck Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Truck className="h-6 w-6"/>
                  <div>
                    <h3 className="font-medium">This is a Food Truck</h3>
                    <p className="text-sm text-muted-foreground">
                      Enable mobile location broadcasting for customers to find
                      you
                    </p>
                  </div>
                </div>
                <Button variant={(currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.isFoodTruck) ? "default" : "outline"} onClick={function () {
            return toggleFoodTruckMutation.mutate(!(currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.isFoodTruck));
        }} data-testid="button-toggle-food-truck">
                  {(currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.isFoodTruck) ? "Enabled" : "Enable"}
                </Button>
              </div>

              {/* Broadcasting Controls */}
              {(currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.isFoodTruck) && (<div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={"p-2 rounded-lg ".concat(connectionStatus === "connected"
                ? "bg-green-100"
                : connectionStatus === "connecting"
                    ? "bg-yellow-100"
                    : "bg-gray-100")}>
                          {connectionStatus === "connected" ? (<Radio className="h-5 w-5 text-green-600"/>) : connectionStatus === "connecting" ? (<Loader2 className="h-5 w-5 text-yellow-600 animate-spin"/>) : (<WifiOff className="h-5 w-5 text-gray-600"/>)}
                        </div>
                        <div>
                          <h3 className="font-medium">
                            Live Location Broadcasting
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {connectionStatus === "connected"
                ? "Broadcasting your location to customers"
                : connectionStatus === "connecting"
                    ? "Connecting to GPS..."
                    : "Start broadcasting to appear on customer maps"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isBroadcasting ? (<Button onClick={handleStartBroadcasting} disabled={startFoodTruckSessionMutation.isPending} className="bg-green-600 hover:bg-green-700" data-testid="button-start-broadcasting">
                            {startFoodTruckSessionMutation.isPending ? (<Loader2 className="h-4 w-4 mr-2 animate-spin"/>) : (<Play className="h-4 w-4 mr-2"/>)}
                            Start Broadcasting
                          </Button>) : (<Button onClick={handleStopBroadcasting} disabled={stopFoodTruckSessionMutation.isPending} variant="destructive" data-testid="button-stop-broadcasting">
                            {stopFoodTruckSessionMutation.isPending ? (<Loader2 className="h-4 w-4 mr-2 animate-spin"/>) : (<Square className="h-4 w-4 mr-2"/>)}
                            Stop Broadcasting
                          </Button>)}
                        <ShareButton url={liveShareUrl} title={liveShareTitle} description={liveShareDescription} variant="outline" size="sm"/>
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          {connectionStatus === "connected" && isConnected ? (<Wifi className="h-4 w-4 text-green-500"/>) : connectionStatus === "connected" &&
                !isConnected ? (<Zap className="h-4 w-4 text-yellow-500"/>) : (<WifiOff className="h-4 w-4 text-red-500"/>)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Connection
                        </p>
                        <p className="text-sm font-medium capitalize" data-testid="text-connection-status">
                          {connectionStatus === "connected" && isConnected
                ? "Real-time"
                : connectionStatus === "connected" && !isConnected
                    ? "GPS Only"
                    : connectionStatus}
                        </p>
                        {wsError && (<p className="text-xs text-red-500 mt-1">
                            WS: {wsError}
                          </p>)}
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Activity className="h-4 w-4 text-blue-500"/>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Updates Sent
                        </p>
                        <p className="text-sm font-medium" data-testid="text-broadcast-count">
                          {broadcastCount}
                        </p>
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Satellite className="h-4 w-4 text-orange-500"/>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          GPS Accuracy
                        </p>
                        <p className="text-sm font-medium" data-testid="text-gps-accuracy">
                          {gpsAccuracy ? "".concat(Math.round(gpsAccuracy), "m") : "N/A"}
                        </p>
                      </div>

                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="h-4 w-4 text-purple-500"/>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last Update
                        </p>
                        <p className="text-sm font-medium" data-testid="text-last-broadcast">
                          {lastBroadcast
                ? format(lastBroadcast, "HH:mm:ss")
                : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Location Display */}
                  {currentLocation && (<div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4"/>
                          Current Location
                        </h3>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <NavigationIcon className="h-3 w-3 mr-1"/>
                          Live GPS
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Latitude:
                          </span>
                          <p className="font-mono" data-testid="text-current-lat">
                            {currentLocation.lat.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Longitude:
                          </span>
                          <p className="font-mono" data-testid="text-current-lng">
                            {currentLocation.lng.toFixed(6)}
                          </p>
                        </div>
                      </div>
                      {currentLocation.timestamp && (<p className="text-xs text-muted-foreground mt-2">
                          Recorded:{" "}
                          {format(new Date(currentLocation.timestamp), "PPpp")}
                        </p>)}
                    </div>)}

                  {/* Error Display */}
                  {locationError && (<div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500"/>
                        <span className="text-sm font-medium text-red-800">
                          Location Error
                        </span>
                      </div>
                      <p className="text-sm text-red-700 mt-1" data-testid="text-location-error">
                        {locationError}
                      </p>
                    </div>)}

                  {/* Tips and Information */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <Smartphone className="h-4 w-4"/>
                      Broadcasting Tips
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Keep GPS enabled for accurate location tracking</li>
                      <li>
                        • Location updates every 30 seconds or when you move 50+
                        meters
                      </li>
                      <li>
                        • Sessions auto-stop after 2 minutes of inactivity
                      </li>
                      <li>
                        • Customers can see your live location and active
                        specials
                      </li>
                      <li>• Works best with mobile internet connection</li>
                    </ul>
                  </div>
                </div>)}

              {/* Restaurant Location Update */}
              <Separator />
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <MapPin className="h-5 w-5 text-blue-600"/>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          Update Restaurant Location
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Update your restaurant's permanent address location
                          using GPS
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleUpdateRestaurantLocation} disabled={isUpdatingLocation ||
            updateRestaurantLocationMutation.isPending} variant="outline" data-testid="button-update-location">
                      {isUpdatingLocation ||
            updateRestaurantLocationMutation.isPending ? (<Loader2 className="h-4 w-4 mr-2 animate-spin"/>) : (<RefreshCw className="h-4 w-4 mr-2"/>)}
                      Update Location
                    </Button>
                  </div>

                  {/* Current Restaurant Location */}
                  {((currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.city) || (currentRestaurant === null || currentRestaurant === void 0 ? void 0 : currentRestaurant.state)) && (<div className="text-sm">
                      <span className="text-muted-foreground">
                        Current Location:
                      </span>
                      <p className="font-medium" data-testid="text-restaurant-location">
                        {currentRestaurant.city || "Unknown Location"}
                        {currentRestaurant.state
                ? ", ".concat(currentRestaurant.state)
                : ""}
                      </p>
                    </div>)}

                  {/* Location Update Error */}
                  {locationUpdateError && (<div className="mt-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500"/>
                        <span className="text-sm font-medium text-red-800">
                          Update Error
                        </span>
                      </div>
                      <p className="text-sm text-red-700 mt-1" data-testid="text-location-update-error">
                        {locationUpdateError}
                      </p>
                    </div>)}
                </div>
              </div>

              {/* Operating Hours Management */}
              <Separator />
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Clock className="h-5 w-5 text-green-600"/>
                      </div>
                      <div>
                        <h3 className="font-medium">Operating Hours</h3>
                        <p className="text-sm text-muted-foreground">
                          Set your restaurant's opening and closing hours for
                          each day
                        </p>
                      </div>
                    </div>
                  </div>

                  <Form {...operatingHoursForm}>
                    <form onSubmit={operatingHoursForm.handleSubmit(handleOperatingHoursSubmit)} className="space-y-4">
                      {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map(function (day) {
            var dayName = {
                mon: "Monday",
                tue: "Tuesday",
                wed: "Wednesday",
                thu: "Thursday",
                fri: "Friday",
                sat: "Saturday",
                sun: "Sunday",
            }[day];
            var timeSlots = operatingHoursForm.watch(day) || [];
            return (<div key={day} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <FormLabel className="text-sm font-medium">
                                  {dayName}
                                </FormLabel>
                                <Button type="button" variant="ghost" size="sm" onClick={function () {
                    return addTimeSlot(day);
                }} disabled={timeSlots.length >= 3} data-testid={"button-add-".concat(day, "-hours")}>
                                  <Plus className="h-4 w-4 mr-1"/>
                                  Add Hours
                                </Button>
                              </div>

                              {timeSlots.length === 0 ? (<p className="text-sm text-muted-foreground pl-2" data-testid={"text-".concat(day, "-closed")}>
                                  Closed
                                </p>) : (<div className="space-y-2">
                                  {timeSlots.map(function (slot, index) { return (<div key={index} className="flex items-center gap-2">
                                      <FormField control={operatingHoursForm.control} name={"".concat(day, ".").concat(index, ".open")} render={function (_a) {
                            var field = _a.field;
                            return (<FormItem className="flex-1">
                                            <FormControl>
                                              <Input {...field} type="time" placeholder="09:00" data-testid={"input-".concat(day, "-").concat(index, "-open")}/>
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>);
                        }}/>
                                      <span className="text-sm text-muted-foreground">
                                        to
                                      </span>
                                      <FormField control={operatingHoursForm.control} name={"".concat(day, ".").concat(index, ".close")} render={function (_a) {
                            var field = _a.field;
                            return (<FormItem className="flex-1">
                                            <FormControl>
                                              <Input {...field} type="time" placeholder="17:00" data-testid={"input-".concat(day, "-").concat(index, "-close")}/>
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>);
                        }}/>
                                      <Button type="button" variant="ghost" size="sm" onClick={function () {
                            return removeTimeSlot(day, index);
                        }} data-testid={"button-remove-".concat(day, "-").concat(index, "-hours")}>
                                        <RotateCcw className="h-4 w-4"/>
                                      </Button>
                                    </div>); })}
                                </div>)}
                            </div>);
        })}

                      <div className="flex items-center gap-3 pt-4">
                        <Button type="submit" disabled={updateOperatingHoursMutation.isPending} data-testid="button-save-operating-hours">
                          {updateOperatingHoursMutation.isPending ? (<Loader2 className="h-4 w-4 mr-2 animate-spin"/>) : (<Save className="h-4 w-4 mr-2"/>)}
                          Save Operating Hours
                        </Button>
                        <Button type="button" variant="outline" onClick={function () { return operatingHoursForm.reset(); }} data-testid="button-reset-operating-hours">
                          <RotateCcw className="h-4 w-4 mr-2"/>
                          Reset
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Navigation */}
      <Navigation />
    </div>);
}
