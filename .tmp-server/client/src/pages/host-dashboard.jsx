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
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { AlertCircle, Calendar, Clock, Loader2, Plus, Truck, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
var normalizeDollar = function (value) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed))
        return 0;
    return Math.round(parsed);
};
var parseOptionalDollar = function (value) {
    var trimmed = value.trim();
    if (!trimmed)
        return null;
    var parsed = Number(trimmed);
    if (!Number.isFinite(parsed))
        return null;
    return Math.max(0, Math.round(parsed));
};
function HostDashboard() {
    var _this = this;
    var _a = useAuth(), isAuthenticated = _a.isAuthenticated, isLoading = _a.isLoading, user = _a.user;
    var toast = useToast().toast;
    var _b = useLocation(), setLocation = _b[1];
    var _c = useState(true), isLoadingPage = _c[0], setIsLoadingPage = _c[1];
    var _d = useState([]), hosts = _d[0], setHosts = _d[1];
    var _e = useState(""), selectedHostId = _e[0], setSelectedHostId = _e[1];
    var _f = useState(null), host = _f[0], setHost = _f[1];
    var _g = useState([]), events = _g[0], setEvents = _g[1];
    var _h = useState(false), isCreating = _h[0], setIsCreating = _h[1];
    var _j = useState([]), daysOfWeek = _j[0], setDaysOfWeek = _j[1];
    var _k = useState(""), startTime = _k[0], setStartTime = _k[1];
    var _l = useState(""), endTime = _l[0], setEndTime = _l[1];
    var _m = useState(false), anyTime = _m[0], setAnyTime = _m[1];
    var _o = useState(1), maxTrucks = _o[0], setMaxTrucks = _o[1];
    var _p = useState(false), hardCapEnabled = _p[0], setHardCapEnabled = _p[1];
    var _q = useState(""), createError = _q[0], setCreateError = _q[1];
    var _r = useState(""), breakfastPrice = _r[0], setBreakfastPrice = _r[1];
    var _s = useState(""), lunchPrice = _s[0], setLunchPrice = _s[1];
    var _t = useState(""), dinnerPrice = _t[0], setDinnerPrice = _t[1];
    var _u = useState(""), weeklyOverride = _u[0], setWeeklyOverride = _u[1];
    var _v = useState(""), monthlyOverride = _v[0], setMonthlyOverride = _v[1];
    var _w = useState({
        water: false,
        electric: false,
        bathrooms: false,
        wifi: false,
        seating: false,
    }), amenities = _w[0], setAmenities = _w[1];
    var _x = useState(false), isSavingAmenities = _x[0], setIsSavingAmenities = _x[1];
    var _y = useState(""), blackoutDateInput = _y[0], setBlackoutDateInput = _y[1];
    var _z = useState([]), blackoutDates = _z[0], setBlackoutDates = _z[1];
    var _0 = useState(false), isSavingBlackout = _0[0], setIsSavingBlackout = _0[1];
    var _1 = useState(false), hasActiveParkingPass = _1[0], setHasActiveParkingPass = _1[1];
    var _2 = useState({
        businessName: "",
        address: "",
        city: "",
        state: "",
        locationType: "other",
        contactPhone: "",
    }), newLocationForm = _2[0], setNewLocationForm = _2[1];
    var _3 = useState(false), isSavingLocation = _3[0], setIsSavingLocation = _3[1];
    var _4 = useState(false), isUpdatingLocation = _4[0], setIsUpdatingLocation = _4[1];
    var _5 = useState(false), isDeletingLocation = _5[0], setIsDeletingLocation = _5[1];
    var _6 = useState(false), isCheckingStripe = _6[0], setIsCheckingStripe = _6[1];
    useEffect(function () {
        if (isLoading) {
            return;
        }
        if (!isAuthenticated) {
            setLocation("/login?redirect=/host/dashboard");
            return;
        }
        if ((user === null || user === void 0 ? void 0 : user.userType) === "event_coordinator") {
            setLocation("/event-coordinator/dashboard");
            return;
        }
        var fetchData = function () { return __awaiter(_this, void 0, void 0, function () {
            var hostsRes, hostList, initialHost_1, eventsRes, eventsData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, 7, 8]);
                        return [4 /*yield*/, fetch("/api/hosts")];
                    case 1:
                        hostsRes = _a.sent();
                        if (!hostsRes.ok) {
                            throw new Error("Failed to fetch host profiles");
                        }
                        return [4 /*yield*/, hostsRes.json()];
                    case 2:
                        hostList = _a.sent();
                        if (!Array.isArray(hostList) || hostList.length === 0) {
                            setLocation("/host-signup");
                            return [2 /*return*/];
                        }
                        setHosts(hostList);
                        initialHost_1 = hostList[0];
                        setSelectedHostId(initialHost_1.id);
                        setHost(initialHost_1);
                        setAmenities(function (current) {
                            var _a;
                            return (__assign(__assign({}, current), ((_a = initialHost_1.amenities) !== null && _a !== void 0 ? _a : {})));
                        });
                        return [4 /*yield*/, fetch("/api/hosts/events?hostId=".concat(initialHost_1.id))];
                    case 3:
                        eventsRes = _a.sent();
                        if (!eventsRes.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, eventsRes.json()];
                    case 4:
                        eventsData = _a.sent();
                        setEvents(eventsData);
                        _a.label = 5;
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        error_1 = _a.sent();
                        console.error(error_1);
                        return [3 /*break*/, 8];
                    case 7:
                        setIsLoadingPage(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
        fetchData();
    }, [isAuthenticated, isLoading, setLocation, user]);
    useEffect(function () {
        if (!selectedHostId)
            return;
        var selected = hosts.find(function (item) { return item.id === selectedHostId; }) || null;
        setHost(selected);
        if (selected) {
            setAmenities(function (current) {
                var _a;
                return (__assign(__assign({}, current), ((_a = selected.amenities) !== null && _a !== void 0 ? _a : {})));
            });
        }
        var fetchEvents = function () { return __awaiter(_this, void 0, void 0, function () {
            var res, data, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch("/api/hosts/events?hostId=".concat(selectedHostId))];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        setEvents(data);
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error(error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchEvents();
        var fetchBlackouts = function () { return __awaiter(_this, void 0, void 0, function () {
            var res, data, dates, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch("/api/hosts/".concat(selectedHostId, "/blackout-dates"))];
                    case 1:
                        res = _a.sent();
                        if (res.status === 404) {
                            setBlackoutDates([]);
                            setHasActiveParkingPass(false);
                            return [2 /*return*/];
                        }
                        if (!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        if (Array.isArray(data)) {
                            dates = data
                                .map(function (row) {
                                return new Date(row.date).toISOString().split("T")[0];
                            })
                                .sort();
                            setBlackoutDates(dates);
                            setHasActiveParkingPass(true);
                        }
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        console.error(error_3);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchBlackouts();
    }, [hosts, selectedHostId]);
    var handleCreateLocation = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, created_1, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!newLocationForm.businessName || !newLocationForm.address) {
                        toast({
                            title: "Missing details",
                            description: "Business name and address are required.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    if (!newLocationForm.city || !newLocationForm.state) {
                        toast({
                            title: "Missing city/state",
                            description: "City and state are required to save a location.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    setIsSavingLocation(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/hosts", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                businessName: newLocationForm.businessName,
                                address: newLocationForm.address,
                                city: newLocationForm.city,
                                state: newLocationForm.state,
                                locationType: newLocationForm.locationType,
                                contactPhone: newLocationForm.contactPhone || null,
                            }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!res.ok) {
                        throw new Error("Failed to create host location");
                    }
                    return [4 /*yield*/, res.json()];
                case 3:
                    created_1 = _a.sent();
                    setHosts(function (current) { return __spreadArray([created_1], current, true); });
                    setSelectedHostId(created_1.id);
                    setNewLocationForm({
                        businessName: "",
                        address: "",
                        city: "",
                        state: "",
                        locationType: "other",
                        contactPhone: "",
                    });
                    toast({
                        title: "Location added",
                        description: "You can edit this location any time.",
                    });
                    return [3 /*break*/, 6];
                case 4:
                    error_4 = _a.sent();
                    toast({
                        title: "Unable to save location",
                        description: error_4.message || "Failed to create location.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setIsSavingLocation(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleUpdateLocation = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, updated_1, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!host)
                        return [2 /*return*/];
                    setIsUpdatingLocation(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/hosts/".concat(host.id), {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                businessName: host.businessName,
                                address: host.address,
                                city: host.city,
                                state: host.state,
                                locationType: host.locationType,
                                contactPhone: host.contactPhone || null,
                            }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!res.ok) {
                        throw new Error("Failed to update location");
                    }
                    return [4 /*yield*/, res.json()];
                case 3:
                    updated_1 = _a.sent();
                    setHosts(function (current) {
                        return current.map(function (item) { return (item.id === updated_1.id ? updated_1 : item); });
                    });
                    setHost(updated_1);
                    toast({
                        title: "Location updated",
                    });
                    return [3 /*break*/, 6];
                case 4:
                    error_5 = _a.sent();
                    toast({
                        title: "Update failed",
                        description: error_5.message || "Failed to update location.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setIsUpdatingLocation(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteLocation = function () { return __awaiter(_this, void 0, void 0, function () {
        var confirmed, res, data, nextHosts, nextHost, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!host)
                        return [2 /*return*/];
                    confirmed = window.confirm("Delete ".concat(host.businessName, "? This removes the location and its listings."));
                    if (!confirmed)
                        return [2 /*return*/];
                    setIsDeletingLocation(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch("/api/hosts/".concat(host.id), { method: "DELETE" })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to delete location");
                case 4:
                    nextHosts = hosts.filter(function (item) { return item.id !== host.id; });
                    setHosts(nextHosts);
                    if (!nextHosts.length) {
                        setHost(null);
                        setSelectedHostId("");
                        toast({
                            title: "Location deleted",
                            description: "Your test location has been removed.",
                        });
                        setLocation("/host-signup");
                        return [2 /*return*/];
                    }
                    nextHost = nextHosts[0];
                    setSelectedHostId(nextHost.id);
                    setHost(nextHost);
                    toast({
                        title: "Location deleted",
                        description: "Your test location has been removed.",
                    });
                    return [3 /*break*/, 7];
                case 5:
                    error_6 = _a.sent();
                    toast({
                        title: "Delete failed",
                        description: error_6.message || "Failed to delete location.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 7];
                case 6:
                    setIsDeletingLocation(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var hasPricing = function (item) {
        var _a, _b, _c, _d, _e, _f;
        return ((_a = item.breakfastPriceCents) !== null && _a !== void 0 ? _a : 0) > 0 ||
            ((_b = item.lunchPriceCents) !== null && _b !== void 0 ? _b : 0) > 0 ||
            ((_c = item.dinnerPriceCents) !== null && _c !== void 0 ? _c : 0) > 0 ||
            ((_d = item.dailyPriceCents) !== null && _d !== void 0 ? _d : 0) > 0 ||
            ((_e = item.weeklyPriceCents) !== null && _e !== void 0 ? _e : 0) > 0 ||
            ((_f = item.monthlyPriceCents) !== null && _f !== void 0 ? _f : 0) > 0;
    };
    var hasActivePass = events.some(function (item) {
        if (!item.requiresPayment)
            return false;
        if (!hasPricing(item))
            return false;
        var itemDate = new Date(item.date);
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        return itemDate >= today;
    });
    var groupParkingPassListings = function (items) {
        var sorted = __spreadArray([], items, true).sort(function (a, b) { return new Date(a.date).getTime() - new Date(b.date).getTime(); });
        var grouped = new Map();
        sorted.forEach(function (item) {
            var key = item.seriesId || item.id;
            if (!grouped.has(key)) {
                grouped.set(key, item);
            }
        });
        return Array.from(grouped.values());
    };
    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    var upcomingListings = groupParkingPassListings(events.filter(function (event) {
        return event.requiresPayment && new Date(event.date) >= todayStart;
    }));
    var pastListings = groupParkingPassListings(events.filter(function (event) { return event.requiresPayment && new Date(event.date) < todayStart; }));
    var handleCreateEvent = function (event) { return __awaiter(_this, void 0, void 0, function () {
        var finalStartTime, finalEndTime, breakfast, lunch, dinner, hasSlotPrice, res, data, newEvent, newEvents, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    setCreateError("");
                    if (hasActivePass) {
                        setCreateError("You already have a parking pass for this address. Edit the existing listing.");
                        return [2 /*return*/];
                    }
                    finalStartTime = anyTime ? "00:00" : startTime;
                    finalEndTime = anyTime ? "23:59" : endTime;
                    breakfast = normalizeDollar(breakfastPrice);
                    lunch = normalizeDollar(lunchPrice);
                    dinner = normalizeDollar(dinnerPrice);
                    hasSlotPrice = breakfast > 0 || lunch > 0 || dinner > 0;
                    if (!hasSlotPrice) {
                        setCreateError("At least one slot price is required.");
                        return [2 /*return*/];
                    }
                    if (daysOfWeek.length === 0) {
                        setCreateError("Select at least one day of the week.");
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch("/api/hosts/events", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(__assign(__assign({ hostId: selectedHostId, daysOfWeek: daysOfWeek, startTime: finalStartTime, endTime: finalEndTime, maxTrucks: Number(maxTrucks), hardCapEnabled: hardCapEnabled, requiresPayment: true, breakfastPriceCents: breakfast ? breakfast * 100 : 0, lunchPriceCents: lunch ? lunch * 100 : 0, dinnerPriceCents: dinner ? dinner * 100 : 0 }, (weeklyOverrideValue !== null
                                ? { weeklyPriceCents: weeklyOverrideValue * 100 }
                                : {})), (monthlyOverrideValue !== null
                                ? { monthlyPriceCents: monthlyOverrideValue * 100 }
                                : {}))),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to create listing");
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    newEvent = _a.sent();
                    newEvents = Array.isArray(newEvent) ? newEvent : [newEvent];
                    setEvents(__spreadArray(__spreadArray([], events, true), newEvents, true));
                    setIsCreating(false);
                    setDaysOfWeek([]);
                    setStartTime("");
                    setEndTime("");
                    setAnyTime(false);
                    setMaxTrucks(1);
                    setHardCapEnabled(false);
                    setBreakfastPrice("");
                    setLunchPrice("");
                    setDinnerPrice("");
                    setWeeklyOverride("");
                    setMonthlyOverride("");
                    return [3 /*break*/, 7];
                case 6:
                    error_7 = _a.sent();
                    setCreateError(error_7.message);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleAmenitiesSave = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, updatedHost_1, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!host) {
                        return [2 /*return*/];
                    }
                    setIsSavingAmenities(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch("/api/hosts/".concat(host.id), {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ amenities: amenities }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to update amenities");
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    updatedHost_1 = _a.sent();
                    setHost(updatedHost_1);
                    setHosts(function (current) {
                        return current.map(function (item) { return (item.id === updatedHost_1.id ? updatedHost_1 : item); });
                    });
                    toast({
                        title: "Amenities updated",
                        description: "Your parking pass amenities are saved.",
                    });
                    return [3 /*break*/, 8];
                case 6:
                    error_8 = _a.sent();
                    toast({
                        title: "Update failed",
                        description: error_8.message,
                        variant: "destructive",
                    });
                    return [3 /*break*/, 8];
                case 7:
                    setIsSavingAmenities(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleAddBlackout = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, dateKey_1, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!host || !blackoutDateInput || !hasActiveParkingPass)
                        return [2 /*return*/];
                    setIsSavingBlackout(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch("/api/hosts/".concat(host.id, "/blackout-dates"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ date: blackoutDateInput }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to add blackout date");
                case 4:
                    dateKey_1 = blackoutDateInput;
                    setBlackoutDates(function (current) {
                        return current.includes(dateKey_1) ? current : __spreadArray(__spreadArray([], current, true), [dateKey_1], false).sort();
                    });
                    setBlackoutDateInput("");
                    return [3 /*break*/, 7];
                case 5:
                    error_9 = _a.sent();
                    toast({
                        title: "Update failed",
                        description: error_9.message,
                        variant: "destructive",
                    });
                    return [3 /*break*/, 7];
                case 6:
                    setIsSavingBlackout(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleRemoveBlackout = function (dateKey) { return __awaiter(_this, void 0, void 0, function () {
        var res, data, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!host || !hasActiveParkingPass)
                        return [2 /*return*/];
                    setIsSavingBlackout(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch("/api/hosts/".concat(host.id, "/blackout-dates"), {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ date: dateKey }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to remove blackout date");
                case 4:
                    setBlackoutDates(function (current) {
                        return current.filter(function (item) { return item !== dateKey; });
                    });
                    return [3 /*break*/, 7];
                case 5:
                    error_10 = _a.sent();
                    toast({
                        title: "Update failed",
                        description: error_10.message,
                        variant: "destructive",
                    });
                    return [3 /*break*/, 7];
                case 6:
                    setIsSavingBlackout(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var formatCents = function (value) {
        return value && value > 0 ? "$".concat((value / 100).toFixed(2)) : "—";
    };
    var breakfastValue = normalizeDollar(breakfastPrice);
    var lunchValue = normalizeDollar(lunchPrice);
    var dinnerValue = normalizeDollar(dinnerPrice);
    var slotSum = breakfastValue + lunchValue + dinnerValue;
    var dailyEstimate = slotSum ? slotSum + 10 : 0;
    var weeklyEstimate = slotSum ? slotSum * 7 + 10 : 0;
    var monthlyEstimate = slotSum ? slotSum * 30 + 10 : 0;
    var weeklyOverrideValue = parseOptionalDollar(weeklyOverride);
    var monthlyOverrideValue = parseOptionalDollar(monthlyOverride);
    var weeklyFinal = weeklyOverrideValue !== null && weeklyOverrideValue !== void 0 ? weeklyOverrideValue : weeklyEstimate;
    var monthlyFinal = monthlyOverrideValue !== null && monthlyOverrideValue !== void 0 ? monthlyOverrideValue : monthlyEstimate;
    var handleEnablePayments = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, onboardingUrl, error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/hosts/stripe/onboard", { method: "POST" })];
                case 1:
                    res = _a.sent();
                    if (!res.ok) {
                        throw new Error("Failed to initiate Stripe onboarding");
                    }
                    return [4 /*yield*/, res.json()];
                case 2:
                    onboardingUrl = (_a.sent()).onboardingUrl;
                    window.location.href = onboardingUrl;
                    return [3 /*break*/, 4];
                case 3:
                    error_11 = _a.sent();
                    console.error("Stripe onboarding error:", error_11);
                    toast({
                        title: "Error",
                        description: "Failed to initiate payment setup. Please try again.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var refreshStripeStatus = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data_1, error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsCheckingStripe(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/hosts/stripe/status")];
                case 2:
                    res = _a.sent();
                    if (!res.ok) {
                        throw new Error("Failed to check payment status");
                    }
                    return [4 /*yield*/, res.json()];
                case 3:
                    data_1 = _a.sent();
                    setHost(function (prev) {
                        return prev
                            ? __assign(__assign({}, prev), { stripeChargesEnabled: data_1.chargesEnabled, stripePayoutsEnabled: data_1.payoutsEnabled, stripeOnboardingCompleted: data_1.onboardingCompleted }) : prev;
                    });
                    toast({
                        title: "Stripe status updated",
                        description: data_1.chargesEnabled
                            ? "Payments are enabled."
                            : "Payments are still pending.",
                    });
                    return [3 /*break*/, 6];
                case 4:
                    error_12 = _a.sent();
                    console.error("Stripe status error:", error_12);
                    toast({
                        title: "Unable to refresh status",
                        description: error_12.message || "Please try again in a moment.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setIsCheckingStripe(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    if (isLoading || isLoadingPage) {
        return (<div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600"/>
      </div>);
    }
    if (!host)
        return null;
    return (<div className="max-w-5xl mx-auto px-4 py-12">
      {!host.stripeChargesEnabled && (<Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600"/>
          <AlertTitle className="text-orange-900">
            Enable Payments to Accept Bookings
          </AlertTitle>
          <AlertDescription className="text-orange-800">
            <p className="mb-3">
              Set up payments to receive booking fees from trucks. You set your
              price per slot and get paid automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleEnablePayments} className="bg-orange-600 hover:bg-orange-700">
                Enable Payments with Stripe
              </Button>
              <Button variant="outline" onClick={refreshStripeStatus} disabled={isCheckingStripe}>
                {isCheckingStripe ? "Checking..." : "Refresh Stripe Status"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>)}

        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {host.businessName}
            </h1>
            <p className="text-slate-600">{host.address}</p>
          </div>
          {hosts.length > 1 && (<div className="flex items-center gap-2">
            <Label htmlFor="hostSelect" className="text-sm text-slate-600">
              Property
            </Label>
            <select id="hostSelect" value={selectedHostId} onChange={function (event) { return setSelectedHostId(event.target.value); }} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
              {hosts.map(function (item) { return (<option key={item.id} value={item.id}>
                  {item.businessName} · {item.address}
                </option>); })}
            </select>
          </div>)}
          <Button onClick={function () { return setIsCreating(!isCreating); }}>
            {isCreating ? ("Cancel") : (<>
              <Plus className="mr-2 h-4 w-4"/> New Parking Pass
            </>)}
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              On-site Amenities
            </h2>
            <p className="text-sm text-slate-500">
              Share what trucks can expect at your location.
            </p>
          </div>
          <Button variant="outline" onClick={handleAmenitiesSave} disabled={isSavingAmenities}>
            {isSavingAmenities ? "Saving..." : "Save amenities"}
          </Button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Location details
              </h2>
              <p className="text-sm text-slate-500">
                Keep each parking address accurate for trucks.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleUpdateLocation} disabled={isUpdatingLocation}>
                {isUpdatingLocation ? "Saving..." : "Save location"}
              </Button>
              <Button variant="outline" onClick={handleDeleteLocation} disabled={isDeletingLocation}>
                {isDeletingLocation ? "Deleting..." : "Delete location"}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hostBusinessName">Location name</Label>
              <Input id="hostBusinessName" value={host.businessName} onChange={function (event) {
            return setHost(function (current) {
                return current
                    ? __assign(__assign({}, current), { businessName: event.target.value }) : current;
            });
        }}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostContactPhone">Contact phone</Label>
              <Input id="hostContactPhone" value={host.contactPhone || ""} onChange={function (event) {
            return setHost(function (current) {
                return current
                    ? __assign(__assign({}, current), { contactPhone: event.target.value }) : current;
            });
        }}/>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hostAddress">Address</Label>
              <Input id="hostAddress" value={host.address} onChange={function (event) {
            return setHost(function (current) {
                return current ? __assign(__assign({}, current), { address: event.target.value }) : current;
            });
        }}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostCity">City</Label>
              <Input id="hostCity" value={host.city || ""} onChange={function (event) {
            return setHost(function (current) {
                return current ? __assign(__assign({}, current), { city: event.target.value }) : current;
            });
        }}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostState">State</Label>
              <Input id="hostState" value={host.state || ""} onChange={function (event) {
            return setHost(function (current) {
                return current ? __assign(__assign({}, current), { state: event.target.value }) : current;
            });
        }}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostType">Location type</Label>
              <select id="hostType" value={host.locationType || "other"} onChange={function (event) {
            return setHost(function (current) {
                return current
                    ? __assign(__assign({}, current), { locationType: event.target.value }) : current;
            });
        }} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="office">Office</option>
                <option value="bar">Bar</option>
                <option value="brewery">Brewery</option>
                <option value="restaurant">Restaurant</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              Add another parking location
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newHostName">Location name</Label>
                <Input id="newHostName" value={newLocationForm.businessName} onChange={function (event) {
            return setNewLocationForm(function (current) { return (__assign(__assign({}, current), { businessName: event.target.value })); });
        }}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newHostPhone">Contact phone</Label>
                <Input id="newHostPhone" value={newLocationForm.contactPhone} onChange={function (event) {
            return setNewLocationForm(function (current) { return (__assign(__assign({}, current), { contactPhone: event.target.value })); });
        }}/>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="newHostAddress">Address</Label>
                <Input id="newHostAddress" value={newLocationForm.address} onChange={function (event) {
            return setNewLocationForm(function (current) { return (__assign(__assign({}, current), { address: event.target.value })); });
        }}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newHostCity">City</Label>
                <Input id="newHostCity" value={newLocationForm.city} onChange={function (event) {
            return setNewLocationForm(function (current) { return (__assign(__assign({}, current), { city: event.target.value })); });
        }}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newHostState">State</Label>
                <Input id="newHostState" value={newLocationForm.state} onChange={function (event) {
            return setNewLocationForm(function (current) { return (__assign(__assign({}, current), { state: event.target.value })); });
        }}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newHostType">Location type</Label>
                <select id="newHostType" value={newLocationForm.locationType} onChange={function (event) {
            return setNewLocationForm(function (current) { return (__assign(__assign({}, current), { locationType: event.target.value })); });
        }} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="office">Office</option>
                  <option value="bar">Bar</option>
                  <option value="brewery">Brewery</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={handleCreateLocation} disabled={isSavingLocation}>
                  {isSavingLocation ? "Saving..." : "Add location"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {[
            { key: "water", label: "Water" },
            { key: "electric", label: "Electric" },
            { key: "bathrooms", label: "Bathrooms" },
            { key: "wifi", label: "Wi-Fi" },
            { key: "seating", label: "Seating" },
        ].map(function (amenity) {
            var _a;
            return (<label key={amenity.key} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4" checked={(_a = amenities[amenity.key]) !== null && _a !== void 0 ? _a : false} onChange={function (event) {
                    return setAmenities(function (prev) {
                        var _a;
                        return (__assign(__assign({}, prev), (_a = {}, _a[amenity.key] = event.target.checked, _a)));
                    });
                }}/>
              {amenity.label}
            </label>);
        })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Blackout Dates
            </h2>
            <p className="text-sm text-slate-500">
              Block specific days when trucks cannot park.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input type="date" value={blackoutDateInput} onChange={function (event) { return setBlackoutDateInput(event.target.value); }} min={new Date().toISOString().split("T")[0]} disabled={!hasActiveParkingPass}/>
          <Button type="button" onClick={handleAddBlackout} disabled={!hasActiveParkingPass || !blackoutDateInput || isSavingBlackout}>
            {isSavingBlackout ? "Saving..." : "Add blackout date"}
          </Button>
        </div>
        {!hasActiveParkingPass && (<p className="mt-3 text-sm text-slate-500">
            Create a parking pass to manage blackout dates for that pass.
          </p>)}
        {blackoutDates.length === 0 ? (<p className="mt-4 text-sm text-slate-500">
            No blackout dates set.
          </p>) : (<div className="mt-4 flex flex-wrap gap-2">
            {blackoutDates.map(function (dateKey) { return (<button key={dateKey} type="button" onClick={function () { return handleRemoveBlackout(dateKey); }} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100" disabled={isSavingBlackout ||
                    dateKey <= new Date().toISOString().split("T")[0]}>
                {format(new Date(dateKey), "MMM d, yyyy")} (remove)
              </button>); })}
          </div>)}
      </div>

      {isCreating && (<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Post a Parking Pass
              </h2>
              <p className="text-sm text-slate-500">
                Set the day, time window, and what each slot costs.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
              {host.businessName}
            </div>
          </div>
          <form onSubmit={handleCreateEvent} className="mt-6 space-y-6">
            {createError && (<div className="p-3 bg-rose-50 text-rose-700 rounded-md text-sm">
                {createError}
              </div>)}
            {hasActivePass && (<div className="p-3 bg-amber-50 text-amber-700 rounded-md text-sm">
                You already have a parking pass for this address. Edit the
                existing listing instead of creating a new one.
              </div>)}

            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      When trucks can park
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pick the weekly schedule and a time window.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="anyTime" checked={anyTime} onCheckedChange={setAnyTime}/>
                    <Label htmlFor="anyTime" className="text-xs text-slate-600">
                      Any time
                    </Label>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Days of the week</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                { label: "Mon", value: 1 },
                { label: "Tue", value: 2 },
                { label: "Wed", value: 3 },
                { label: "Thu", value: 4 },
                { label: "Fri", value: 5 },
                { label: "Sat", value: 6 },
                { label: "Sun", value: 0 },
            ].map(function (day) {
                var selected = daysOfWeek.includes(day.value);
                return (<button key={day.value} type="button" className={"rounded-md border px-3 py-2 text-xs font-medium transition ".concat(selected
                        ? "border-orange-300 bg-orange-100 text-orange-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")} onClick={function () {
                        return setDaysOfWeek(function (current) {
                            return current.includes(day.value)
                                ? current.filter(function (item) { return item !== day.value; })
                                : __spreadArray(__spreadArray([], current, true), [day.value], false);
                        });
                    }}>
                            {day.label}
                          </button>);
            })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTrucks">Number of spots</Label>
                    <Input id="maxTrucks" type="number" min="1" max="10" value={maxTrucks} onChange={function (event) {
                return setMaxTrucks(Number(event.target.value));
            }} required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start</Label>
                    <Input id="startTime" type="time" value={startTime} onChange={function (event) { return setStartTime(event.target.value); }} disabled={anyTime} required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End</Label>
                    <Input id="endTime" type="time" value={endTime} onChange={function (event) { return setEndTime(event.target.value); }} disabled={anyTime} required/>
                  </div>
                </div>
                {anyTime && (<p className="mt-3 text-xs text-slate-500">
                    Any time means trucks can park 24/7.
                  </p>)}
              </div>

              <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
                <h3 className="text-base font-semibold text-orange-900">
                  Earnings preview
                </h3>
                <p className="text-xs text-orange-700 mb-4">
                  Daily = slot total + $10. Weekly = (slot total x 7) + $10.
                  Monthly = (slot total x 30) + $10.
                </p>
                <div className="space-y-2 text-sm text-orange-900">
                  <div className="flex items-center justify-between">
                    <span>Slot total</span>
                    <span className="font-semibold">
                      {slotSum ? "$".concat(slotSum.toFixed(2)) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Daily</span>
                    <span className="font-semibold">
                      {dailyEstimate ? "$".concat(dailyEstimate.toFixed(2)) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      Weekly{" "}
                      {weeklyOverrideValue !== null ? "(custom)" : "(auto)"}
                    </span>
                    <span className="font-semibold">
                      {weeklyFinal ? "$".concat(weeklyFinal.toFixed(2)) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      Monthly{" "}
                      {monthlyOverrideValue !== null ? "(custom)" : "(auto)"}
                    </span>
                    <span className="font-semibold">
                      {monthlyFinal ? "$".concat(monthlyFinal.toFixed(2)) : "-"}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-orange-800">
                  Trucks see your full payout per slot.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Set slot pricing
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Set any slot to $0 if you don't want to offer it.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <Label htmlFor="breakfastPrice">Breakfast</Label>
                  <Input id="breakfastPrice" type="number" min="0" step="1" inputMode="numeric" value={breakfastPrice} onChange={function (event) { return setBreakfastPrice(event.target.value); }} placeholder="0"/>
                  <p className="text-xs text-slate-500">Early shift pricing.</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <Label htmlFor="lunchPrice">Lunch</Label>
                  <Input id="lunchPrice" type="number" min="0" step="1" inputMode="numeric" value={lunchPrice} onChange={function (event) { return setLunchPrice(event.target.value); }} placeholder="0"/>
                  <p className="text-xs text-slate-500">Peak traffic slot.</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <Label htmlFor="dinnerPrice">Dinner</Label>
                  <Input id="dinnerPrice" type="number" min="0" step="1" inputMode="numeric" value={dinnerPrice} onChange={function (event) { return setDinnerPrice(event.target.value); }} placeholder="0"/>
                  <p className="text-xs text-slate-500">Evening coverage.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Weekly & monthly rates (optional)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Leave blank to use the auto-calculated weekly and monthly
                totals.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <Label htmlFor="weeklyOverride">Weekly rate</Label>
                  <Input id="weeklyOverride" type="number" min="0" step="1" inputMode="numeric" value={weeklyOverride} onChange={function (event) { return setWeeklyOverride(event.target.value); }} placeholder={weeklyEstimate ? "$".concat(weeklyEstimate.toFixed(0)) : "Auto"}/>
                  <p className="text-xs text-slate-500">
                    Auto weekly:{" "}
                    {weeklyEstimate ? "$".concat(weeklyEstimate.toFixed(0)) : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <Label htmlFor="monthlyOverride">Monthly rate</Label>
                  <Input id="monthlyOverride" type="number" min="0" step="1" inputMode="numeric" value={monthlyOverride} onChange={function (event) { return setMonthlyOverride(event.target.value); }} placeholder={monthlyEstimate ? "$".concat(monthlyEstimate.toFixed(0)) : "Auto"}/>
                  <p className="text-xs text-slate-500">
                    Auto monthly:{" "}
                    {monthlyEstimate ? "$".concat(monthlyEstimate.toFixed(0)) : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 border p-4 rounded-xl border-slate-200 bg-slate-50">
              <Switch id="hard-cap" checked={hardCapEnabled} onCheckedChange={setHardCapEnabled}/>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="hard-cap" className="font-semibold">
                    Capacity Guard v2.2
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  Strictly enforces the max trucks limit. Once you accept enough
                  trucks to hit the limit, no further approvals will be allowed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                You can edit times later if plans change.
              </p>
              <Button type="submit" className="px-6" disabled={hasActivePass}>
                Publish Parking Pass
              </Button>
            </div>
          </form>
        </div>)}

      <div className="space-y-6">
        <Tabs defaultValue="upcoming" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Your Parking Pass Listings
            </h2>
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingListings.length === 0 ? (<div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3"/>
                <h3 className="text-lg font-medium text-slate-900">
                  No upcoming parking pass listings
                </h3>
                <p className="text-slate-500 mb-4">
                  Create a parking pass listing for trucks.
                </p>
                <Button variant="outline" onClick={function () { return setIsCreating(true); }}>
                  Create Parking Pass Listing
                </Button>
              </div>) : (<div className="grid gap-4">
                {upcomingListings.map(function (event) { return (<div key={event.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-rose-50 rounded-lg text-rose-700">
                          <span className="text-xs font-bold uppercase">
                            {format(new Date(event.date), "MMM")}
                          </span>
                          <span className="text-2xl font-bold">
                            {format(new Date(event.date), "d")}
                          </span>
                        </div>

                        <div>
            <div className="flex items-center gap-4 text-sm text-slate-600 mb-1">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4"/>
                {event.startTime === "00:00" &&
                    event.endTime === "23:59"
                    ? "Any time"
                    : "".concat(event.startTime, " - ").concat(event.endTime)}
              </span>
              <span className="flex items-center gap-1">
                <Truck className="h-4 w-4"/>
                {event.maxTrucks} Spot
                {event.maxTrucks !== 1 ? "s" : ""}
              </span>
                            {event.requiresPayment && (<span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                                Daily {formatCents(event.dailyPriceCents)} / Weekly{" "}
                                {formatCents(event.weeklyPriceCents)} / Monthly{" "}
                                {formatCents(event.monthlyPriceCents)}
                              </span>)}
                            {event.hardCapEnabled && (<span title="Capacity Guard v2.2 Enabled" className="flex items-center gap-1 text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                <AlertCircle className="h-3 w-3 text-emerald-600"/>
                                <span className="text-emerald-700 font-medium">
                                  Strict Cap
                                </span>
                              </span>)}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ".concat(event.status === "open"
                    ? "bg-emerald-100 text-emerald-800"
                    : event.status === "filled"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-800")}>
                              {event.status.charAt(0).toUpperCase() +
                    event.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge variant="secondary">Listing</Badge>
                    </div>); })}
              </div>)}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastListings.length === 0 ? (<div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3"/>
                <h3 className="text-lg font-medium text-slate-900">
                  No past parking pass listings
                </h3>
                <p className="text-slate-500">
                  Your parking pass history will appear here.
                </p>
              </div>) : (<div className="grid gap-4 opacity-75">
                {pastListings.map(function (event) { return (<div key={event.id} className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-200 rounded-lg text-slate-600">
                          <span className="text-xs font-bold uppercase">
                            {format(new Date(event.date), "MMM")}
                          </span>
                          <span className="text-2xl font-bold">
                            {format(new Date(event.date), "d")}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mb-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4"/>
                              {event.startTime} - {event.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
                              Completed
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" disabled>
                        Archived
                      </Button>
                    </div>); })}
              </div>)}
          </TabsContent>
        </Tabs>
      </div>
    </div>);
}
export default HostDashboard;
