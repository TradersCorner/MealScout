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
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2, Share2, Trash2 } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { BookingPaymentModal } from "@/components/booking-payment-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ShareButton from "@/components/share-button";
import mealScoutIcon from "@assets/meal-scout-icon.png";
var formatSlotLabel = function (slot) {
    return slot.charAt(0).toUpperCase() + slot.slice(1);
};
var hasPricing = function (event) {
    var _a, _b, _c, _d, _e, _f;
    return ((_a = event.breakfastPriceCents) !== null && _a !== void 0 ? _a : 0) > 0 ||
        ((_b = event.lunchPriceCents) !== null && _b !== void 0 ? _b : 0) > 0 ||
        ((_c = event.dinnerPriceCents) !== null && _c !== void 0 ? _c : 0) > 0 ||
        ((_d = event.dailyPriceCents) !== null && _d !== void 0 ? _d : 0) > 0 ||
        ((_e = event.weeklyPriceCents) !== null && _e !== void 0 ? _e : 0) > 0 ||
        ((_f = event.monthlyPriceCents) !== null && _f !== void 0 ? _f : 0) > 0;
};
var buildSlotOptions = function (event) {
    return [
        {
            label: "Breakfast",
            type: "breakfast",
            priceCents: event.breakfastPriceCents,
        },
        {
            label: "Lunch",
            type: "lunch",
            priceCents: event.lunchPriceCents,
        },
        {
            label: "Dinner",
            type: "dinner",
            priceCents: event.dinnerPriceCents,
        },
        {
            label: "Daily",
            type: "daily",
            priceCents: event.dailyPriceCents,
        },
        {
            label: "Weekly",
            type: "weekly",
            priceCents: event.weeklyPriceCents,
        },
        {
            label: "Monthly",
            type: "monthly",
            priceCents: event.monthlyPriceCents,
        },
    ].filter(function (slot) { return (slot.priceCents || 0) > 0; });
};
var getFeeCentsForSlots = function (slotTypes, slotTotalCents) {
    if (!slotTypes.length || slotTotalCents <= 0)
        return 0;
    if (slotTypes.includes("monthly"))
        return 15000;
    return slotTypes.includes("weekly") ? 7000 : 1000;
};
var parseCoord = function (value) {
    if (value === null || value === undefined)
        return null;
    var parsed = typeof value === "string" ? Number.parseFloat(value) : value;
    return Number.isFinite(parsed) ? parsed : null;
};
var buildFullAddress = function (event) {
    var _a, _b, _c;
    return [(_a = event.host) === null || _a === void 0 ? void 0 : _a.address, (_b = event.host) === null || _b === void 0 ? void 0 : _b.city, (_c = event.host) === null || _c === void 0 ? void 0 : _c.state]
        .filter(Boolean)
        .join(", ");
};
var parkingPassPinIcon = new L.Icon({
    iconUrl: mealScoutIcon,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -30],
});
var MapCenterer = function (_a) {
    var center = _a.center;
    var map = useMap();
    useEffect(function () {
        if (!center)
            return;
        map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }, [center === null || center === void 0 ? void 0 : center.lat, center === null || center === void 0 ? void 0 : center.lng, map]);
    return null;
};
export default function ParkingPassPage() {
    var _this = this;
    var _a = useAuth(), isAuthenticated = _a.isAuthenticated, user = _a.user;
    var toast = useToast().toast;
    var _b = useLocation(), setLocation = _b[1];
    var _c = useState(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = useState([]), events = _d[0], setEvents = _d[1];
    var _e = useState(null), truckId = _e[0], setTruckId = _e[1];
    var _f = useState(null), truck = _f[0], setTruck = _f[1];
    var _g = useState(false), hasHostProfile = _g[0], setHasHostProfile = _g[1];
    var _h = useState([]), manualSchedules = _h[0], setManualSchedules = _h[1];
    var _j = useState([]), bookedSchedule = _j[0], setBookedSchedule = _j[1];
    var _k = useState(null), selectedEvent = _k[0], setSelectedEvent = _k[1];
    var _l = useState([]), selectedSlotTypes = _l[0], setSelectedSlotTypes = _l[1];
    var _m = useState(false), paymentOpen = _m[0], setPaymentOpen = _m[1];
    var _o = useState(function () {
        var params = new URLSearchParams(window.location.search);
        var dateParam = params.get("date");
        if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
            return dateParam;
        }
        return new Date().toISOString().split("T")[0];
    }), selectedDate = _o[0], setSelectedDate = _o[1];
    var _p = useState({}), selectedSlotsByEvent = _p[0], setSelectedSlotsByEvent = _p[1];
    var _q = useState(""), cityQuery = _q[0], setCityQuery = _q[1];
    var _r = useState([]), cartItems = _r[0], setCartItems = _r[1];
    var _s = useState([]), checkoutQueue = _s[0], setCheckoutQueue = _s[1];
    var _t = useState("map"), viewMode = _t[0], setViewMode = _t[1];
    var _u = useState(null), activeEventId = _u[0], setActiveEventId = _u[1];
    var _v = useState({}), parkingCoords = _v[0], setParkingCoords = _v[1];
    var _w = useState({}), geocodeCache = _w[0], setGeocodeCache = _w[1];
    var geocodeInFlight = useRef(false);
    var _x = useState({
        date: new Date().toISOString().split("T")[0],
        startTime: "",
        endTime: "",
        locationName: "",
        address: "",
        city: "",
        state: "",
        notes: "",
        isPublic: true,
    }), scheduleForm = _x[0], setScheduleForm = _x[1];
    var _y = useState(false), isSavingSchedule = _y[0], setIsSavingSchedule = _y[1];
    var _z = useState(false), isSharingLocation = _z[0], setIsSharingLocation = _z[1];
    var _0 = useState(false), isLive = _0[0], setIsLive = _0[1];
    useEffect(function () {
        try {
            var cached = localStorage.getItem("mealscout_parking_pass_geocode_cache");
            if (cached) {
                var parsed = JSON.parse(cached);
                setGeocodeCache(parsed);
            }
        }
        catch (_a) {
            // ignore localStorage issues
        }
    }, []);
    useEffect(function () {
        try {
            localStorage.setItem("mealscout_parking_pass_geocode_cache", JSON.stringify(geocodeCache));
        }
        catch (_a) {
            // ignore localStorage issues
        }
    }, [geocodeCache]);
    useEffect(function () {
        setSelectedSlotsByEvent({});
    }, [selectedDate]);
    useEffect(function () {
        var params = new URLSearchParams(window.location.search);
        var passId = params.get("pass");
        if (passId) {
            setActiveEventId(passId);
        }
    }, []);
    useEffect(function () {
        if (!isAuthenticated) {
            setTruckId(null);
        }
    }, [isAuthenticated]);
    useEffect(function () {
        var cancelled = false;
        var loadData = function () { return __awaiter(_this, void 0, void 0, function () {
            var truckRes, trucks, foodTruck, hostRes, hosts, eventsRes, data, openEvents, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setIsLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, 12, 13]);
                        if (!isAuthenticated) return [3 /*break*/, 8];
                        return [4 /*yield*/, fetch("/api/restaurants/my-restaurants")];
                    case 2:
                        truckRes = _a.sent();
                        if (!truckRes.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, truckRes.json()];
                    case 3:
                        trucks = _a.sent();
                        if (!cancelled && Array.isArray(trucks) && trucks.length > 0) {
                            foodTruck = trucks.find(function (item) { return item.isFoodTruck; }) || trucks[0];
                            setTruckId(foodTruck.id);
                            setTruck(foodTruck);
                        }
                        _a.label = 4;
                    case 4: return [4 /*yield*/, fetch("/api/hosts")];
                    case 5:
                        hostRes = _a.sent();
                        if (!hostRes.ok) return [3 /*break*/, 7];
                        return [4 /*yield*/, hostRes.json()];
                    case 6:
                        hosts = _a.sent();
                        if (!cancelled && Array.isArray(hosts) && hosts.length > 0) {
                            setHasHostProfile(true);
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        if (!cancelled) {
                            setHasHostProfile(false);
                        }
                        _a.label = 8;
                    case 8: return [4 /*yield*/, fetch("/api/parking-pass")];
                    case 9:
                        eventsRes = _a.sent();
                        if (!eventsRes.ok) {
                            throw new Error("Failed to load parking pass listings");
                        }
                        return [4 /*yield*/, eventsRes.json()];
                    case 10:
                        data = _a.sent();
                        if (!cancelled) {
                            openEvents = Array.isArray(data)
                                ? data.filter(function (e) { return e.status === "open" && hasPricing(e); })
                                : [];
                            setEvents(openEvents);
                        }
                        return [3 /*break*/, 13];
                    case 11:
                        error_1 = _a.sent();
                        if (!cancelled) {
                            toast({
                                title: "Error",
                                description: error_1.message || "Failed to load parking pass listings.",
                                variant: "destructive",
                            });
                        }
                        return [3 /*break*/, 13];
                    case 12:
                        if (!cancelled)
                            setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 13: return [2 /*return*/];
                }
            });
        }); };
        loadData();
        return function () {
            cancelled = true;
        };
    }, [isAuthenticated, toast]);
    useEffect(function () {
        if (!truckId) {
            setManualSchedules([]);
            return;
        }
        var cancelled = false;
        var loadManualSchedules = function () { return __awaiter(_this, void 0, void 0, function () {
            var res, data, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/api/trucks/".concat(truckId, "/manual-schedule"))];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) {
                            throw new Error("Failed to load schedule");
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        if (!cancelled && Array.isArray(data)) {
                            setManualSchedules(data);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        if (!cancelled) {
                            toast({
                                title: "Schedule Error",
                                description: error_2 instanceof Error
                                    ? error_2.message
                                    : "Failed to load your schedule.",
                                variant: "destructive",
                            });
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        loadManualSchedules();
        return function () {
            cancelled = true;
        };
    }, [truckId, toast]);
    useEffect(function () {
        if (!truckId) {
            setBookedSchedule([]);
            return;
        }
        var cancelled = false;
        var loadBookedSchedule = function () { return __awaiter(_this, void 0, void 0, function () {
            var res, data, schedule, parkingBookings, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/api/bookings/truck/".concat(truckId, "/schedule"))];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) {
                            throw new Error("Failed to load booked schedule");
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        schedule = Array.isArray(data === null || data === void 0 ? void 0 : data.schedule) ? data.schedule : [];
                        parkingBookings = schedule.filter(function (entry) { var _a; return entry.type === "booking" && ((_a = entry.event) === null || _a === void 0 ? void 0 : _a.requiresPayment); });
                        if (!cancelled) {
                            setBookedSchedule(parkingBookings);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        if (!cancelled) {
                            toast({
                                title: "Schedule Error",
                                description: error_3 instanceof Error
                                    ? error_3.message
                                    : "Failed to load booked schedule.",
                                variant: "destructive",
                            });
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        loadBookedSchedule();
        return function () {
            cancelled = true;
        };
    }, [truckId, toast]);
    var handleScheduleFieldChange = function (field, value) {
        setScheduleForm(function (current) {
            var _a;
            return (__assign(__assign({}, current), (_a = {}, _a[field] = value, _a)));
        });
    };
    var handleCreateSchedule = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, created_1, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!truckId) {
                        toast({
                            title: "Missing truck",
                            description: "Select a food truck before adding a schedule stop.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    if (!scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime) {
                        toast({
                            title: "Missing time",
                            description: "Date, start time, and end time are required.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    if (!scheduleForm.address) {
                        toast({
                            title: "Missing address",
                            description: "Address is required for schedule entries.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    setIsSavingSchedule(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch("/api/trucks/".concat(truckId, "/manual-schedule"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                date: scheduleForm.date,
                                startTime: scheduleForm.startTime,
                                endTime: scheduleForm.endTime,
                                locationName: scheduleForm.locationName || undefined,
                                address: scheduleForm.address,
                                city: scheduleForm.city || undefined,
                                state: scheduleForm.state || undefined,
                                notes: scheduleForm.notes || undefined,
                                isPublic: scheduleForm.isPublic,
                            }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to save schedule");
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    created_1 = _a.sent();
                    setManualSchedules(function (prev) { return __spreadArray(__spreadArray([], prev, true), [created_1], false); });
                    setScheduleForm(function (current) { return (__assign(__assign({}, current), { startTime: "", endTime: "", locationName: "", address: "", city: "", state: "", notes: "" })); });
                    toast({
                        title: "Schedule saved",
                        description: "Your stop is now on your schedule.",
                    });
                    return [3 /*break*/, 8];
                case 6:
                    error_4 = _a.sent();
                    toast({
                        title: "Save failed",
                        description: error_4 instanceof Error
                            ? error_4.message
                            : "Failed to save schedule entry.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 8];
                case 7:
                    setIsSavingSchedule(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteSchedule = function (scheduleId) { return __awaiter(_this, void 0, void 0, function () {
        var res, data, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!truckId)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("/api/trucks/".concat(truckId, "/manual-schedule/").concat(scheduleId), { method: "DELETE" })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to delete schedule");
                case 4:
                    setManualSchedules(function (prev) {
                        return prev.filter(function (entry) { return entry.id !== scheduleId; });
                    });
                    toast({
                        title: "Schedule removed",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    error_5 = _a.sent();
                    toast({
                        title: "Delete failed",
                        description: error_5 instanceof Error
                            ? error_5.message
                            : "Failed to delete schedule entry.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var getCartTotals = function () {
        return cartItems.reduce(function (totals, item) {
            var slotTotal = item.slotTypes.reduce(function (sum, slotType) {
                var price = (slotType === "breakfast" && item.event.breakfastPriceCents) ||
                    (slotType === "lunch" && item.event.lunchPriceCents) ||
                    (slotType === "dinner" && item.event.dinnerPriceCents) ||
                    (slotType === "daily" && item.event.dailyPriceCents) ||
                    (slotType === "weekly" && item.event.weeklyPriceCents) ||
                    (slotType === "monthly" && item.event.monthlyPriceCents) ||
                    0;
                return sum + price;
            }, 0);
            var fee = getFeeCentsForSlots(item.slotTypes, slotTotal);
            totals.hostCents += slotTotal;
            totals.feeCents += fee;
            totals.totalCents += slotTotal + fee;
            return totals;
        }, { hostCents: 0, feeCents: 0, totalCents: 0 });
    };
    var geocodeAddress = function (address) { return __awaiter(_this, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!address)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, fetch("https://nominatim.openstreetmap.org/search?format=json&q=".concat(encodeURIComponent(address), "&limit=1"), {
                            headers: { "Accept-Language": "en", "User-Agent": "MealScout/1.0" },
                        })];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = (_a.sent());
                    if (!data.length)
                        return [2 /*return*/, null];
                    return [2 /*return*/, { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }];
            }
        });
    }); };
    var getEventCoords = function (event) {
        if (!(event === null || event === void 0 ? void 0 : event.host))
            return null;
        var lat = parseCoord(event.host.latitude);
        var lng = parseCoord(event.host.longitude);
        if (lat === null || lng === null)
            return null;
        return { lat: lat, lng: lng };
    };
    var handleSelect = function (event, slotType) {
        setSelectedSlotsByEvent(function (prev) {
            var _a;
            var existing = prev[event.id] || [];
            var updated = existing.includes(slotType)
                ? existing.filter(function (type) { return type !== slotType; })
                : __spreadArray(__spreadArray([], existing, true), [slotType], false);
            return __assign(__assign({}, prev), (_a = {}, _a[event.id] = updated, _a));
        });
    };
    var handleBookSelected = function (event) {
        var slotTypes = selectedSlotsByEvent[event.id] || [];
        if (slotTypes.length === 0)
            return;
        setCartItems(function (prev) {
            var rest = prev.filter(function (item) { return item.event.id !== event.id; });
            return __spreadArray(__spreadArray([], rest, true), [{ event: event, slotTypes: slotTypes }], false);
        });
    };
    var removeCartItem = function (eventId) {
        setCartItems(function (prev) { return prev.filter(function (item) { return item.event.id !== eventId; }); });
    };
    var startCheckout = function () {
        if (cartItems.length === 0)
            return;
        var first = cartItems[0], rest = cartItems.slice(1);
        setCheckoutQueue(rest);
        setSelectedEvent(first.event);
        setSelectedSlotTypes(first.slotTypes);
        setPaymentOpen(true);
    };
    var handleSuccess = function () {
        if (selectedEvent) {
            removeCartItem(selectedEvent.id);
        }
        if (checkoutQueue.length > 0) {
            var next = checkoutQueue[0], rest = checkoutQueue.slice(1);
            setCheckoutQueue(rest);
            setSelectedEvent(next.event);
            setSelectedSlotTypes(next.slotTypes);
            setPaymentOpen(true);
        }
        else {
            setPaymentOpen(false);
            setSelectedEvent(null);
            setSelectedSlotTypes([]);
        }
        toast({
            title: "Parking Pass Booked",
            description: "Your booking is confirmed.",
        });
    };
    var handleShareLocation = function () { return __awaiter(_this, void 0, void 0, function () {
        var position, locationRes, data, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!truckId) {
                        toast({
                            title: "Missing truck",
                            description: "Select a food truck before sharing location.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    setIsSharingLocation(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, 10, 11]);
                    if (!isLive) return [3 /*break*/, 3];
                    return [4 /*yield*/, fetch("/api/restaurants/".concat(truckId, "/mobile-settings"), {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ mobileOnline: false }),
                        })];
                case 2:
                    _a.sent();
                    setIsLive(false);
                    toast({ title: "You are offline" });
                    return [2 /*return*/];
                case 3:
                    if (!navigator.geolocation) {
                        throw new Error("Location services are not available.");
                    }
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                                enableHighAccuracy: true,
                                timeout: 10000,
                            });
                        })];
                case 4:
                    position = _a.sent();
                    return [4 /*yield*/, fetch("/api/restaurants/".concat(truckId, "/mobile-settings"), {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ mobileOnline: true }),
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, fetch("/api/restaurants/".concat(truckId, "/location"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy,
                                source: "manual",
                            }),
                        })];
                case 6:
                    locationRes = _a.sent();
                    if (!!locationRes.ok) return [3 /*break*/, 8];
                    return [4 /*yield*/, locationRes.json().catch(function () { return ({}); })];
                case 7:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to share location");
                case 8:
                    setIsLive(true);
                    toast({
                        title: "Live location shared",
                        description: "You are now visible on the map.",
                    });
                    return [3 /*break*/, 11];
                case 9:
                    error_6 = _a.sent();
                    toast({
                        title: "Location update failed",
                        description: error_6 instanceof Error ? error_6.message : "Unable to share location.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 11];
                case 10:
                    setIsSharingLocation(false);
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var isAdminOrStaff = ["admin", "super_admin", "staff"].includes((user === null || user === void 0 ? void 0 : user.userType) || "");
    var isTruckViewUser = (user === null || user === void 0 ? void 0 : user.userType) === "food_truck" || isAdminOrStaff;
    var showHostParkingPass = isAuthenticated && hasHostProfile && !isAdminOrStaff;
    var normalizedCityQuery = cityQuery.trim().toLowerCase();
    var filteredEvents = events
        .filter(function (event) {
        var eventDate = new Date(event.date).toISOString().split("T")[0];
        if (eventDate !== selectedDate) {
            return false;
        }
        if (!normalizedCityQuery) {
            return true;
        }
        var locationText = [
            event.host.city,
            event.host.state,
            event.host.address,
            event.host.businessName,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return locationText.includes(normalizedCityQuery);
    })
        .sort(function (a, b) {
        var cityA = (a.host.city || "").toLowerCase();
        var cityB = (b.host.city || "").toLowerCase();
        if (cityA && cityB && cityA !== cityB) {
            return cityA.localeCompare(cityB);
        }
        return a.host.businessName.localeCompare(b.host.businessName);
    });
    var activeEvent = filteredEvents.find(function (event) { return event.id === activeEventId; }) ||
        filteredEvents[0] ||
        null;
    var activeEventBookings = Array.isArray(activeEvent === null || activeEvent === void 0 ? void 0 : activeEvent.bookings)
        ? activeEvent.bookings
        : [];
    var activeEventAvailability = (activeEvent === null || activeEvent === void 0 ? void 0 : activeEvent.availableSpotNumbers)
        ? activeEvent.availableSpotNumbers.length > 0
            ? "Open spots: ".concat(activeEvent.availableSpotNumbers.join(", "))
            : "Fully booked"
        : (activeEvent === null || activeEvent === void 0 ? void 0 : activeEvent.status)
            ? activeEvent.status === "open"
                ? "Open"
                : "Closed"
            : null;
    var mapEvents = useMemo(function () {
        return filteredEvents
            .map(function (event) {
            var coords = getEventCoords(event) || parkingCoords[event.id] || null;
            return coords ? { event: event, coords: coords } : null;
        })
            .filter(function (item) {
            return item !== null;
        });
    }, [filteredEvents]);
    var mapCenter = useMemo(function () {
        var _a;
        var activeCoords = getEventCoords(activeEvent) || (activeEvent ? parkingCoords[activeEvent.id] : null);
        return activeCoords || ((_a = mapEvents[0]) === null || _a === void 0 ? void 0 : _a.coords) || null;
    }, [activeEvent, mapEvents, parkingCoords]);
    useEffect(function () {
        if (geocodeInFlight.current)
            return;
        var queue = filteredEvents
            .filter(function (event) {
            var _a, _b;
            var hostLat = parseCoord((_a = event.host) === null || _a === void 0 ? void 0 : _a.latitude);
            var hostLng = parseCoord((_b = event.host) === null || _b === void 0 ? void 0 : _b.longitude);
            if (hostLat !== null && hostLng !== null)
                return false;
            return !parkingCoords[event.id] && Boolean(buildFullAddress(event));
        })
            .slice(0, 8);
        if (!queue.length)
            return;
        geocodeInFlight.current = true;
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var _loop_1, _i, queue_1, event_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, , 5, 6]);
                        _loop_1 = function (event_1) {
                            var address, cached, point;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        address = buildFullAddress(event_1);
                                        if (!address)
                                            return [2 /*return*/, "continue"];
                                        cached = geocodeCache[address];
                                        if (cached) {
                                            setParkingCoords(function (prev) {
                                                var _a;
                                                return (__assign(__assign({}, prev), (_a = {}, _a[event_1.id] = cached, _a)));
                                            });
                                            return [2 /*return*/, "continue"];
                                        }
                                        return [4 /*yield*/, geocodeAddress(address).catch(function () { return null; })];
                                    case 1:
                                        point = _b.sent();
                                        if (!point) {
                                            return [2 /*return*/, "continue"];
                                        }
                                        setParkingCoords(function (prev) {
                                            var _a;
                                            return (__assign(__assign({}, prev), (_a = {}, _a[event_1.id] = point, _a)));
                                        });
                                        setGeocodeCache(function (prev) {
                                            var _a;
                                            return (__assign(__assign({}, prev), (_a = {}, _a[address] = point, _a)));
                                        });
                                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 300); })];
                                    case 2:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, queue_1 = queue;
                        _a.label = 1;
                    case 1:
                        if (!(_i < queue_1.length)) return [3 /*break*/, 4];
                        event_1 = queue_1[_i];
                        return [5 /*yield**/, _loop_1(event_1)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        geocodeInFlight.current = false;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); })();
    }, [filteredEvents, parkingCoords, geocodeCache]);
    useEffect(function () {
        if (!activeEvent) {
            setActiveEventId(null);
            return;
        }
        if (activeEventId && activeEventId === activeEvent.id) {
            return;
        }
        setActiveEventId(activeEvent.id);
    }, [activeEvent, activeEventId]);
    if (isAuthenticated &&
        user &&
        !["food_truck", "admin", "super_admin", "staff"].includes(user.userType)) {
        return (<div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Parking Pass is for food trucks only</h1>
        <p className="text-gray-600 mb-4 max-w-md">
          Restaurant and bar accounts can’t book parking pass slots. Switch to a food truck profile to access Parking Pass.
        </p>
        <Button onClick={function () { return setLocation("/dashboard"); }}>Back to Dashboard</Button>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parking Pass</h1>
          <p className="text-xs text-gray-500">
            Book available parking spots by day and time.
          </p>
        </div>
        {showHostParkingPass && (<div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-900">
                Host parking pass listings
              </p>
              <p className="text-xs text-orange-700">
                Create and manage parking passes for your locations.
              </p>
            </div>
            <Button size="sm" onClick={function () { return setLocation("/host/dashboard"); }}>
              Open host dashboard
            </Button>
          </div>)}

        {isTruckViewUser && (<Card className="rounded-2xl border border-gray-200 bg-white">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Live share
                  </p>
                  <p className="text-xs text-gray-500">
                    Share your live location in one tap.
                  </p>
                </div>
                <Button size="sm" onClick={handleShareLocation} disabled={isSharingLocation || !truckId}>
                  <Share2 className="h-4 w-4 mr-1"/>
                  {isSharingLocation
                ? "Working..."
                : isLive
                    ? "Go offline"
                    : "Go live + share"}
                </Button>
              </div>
              {((truck === null || truck === void 0 ? void 0 : truck.instagramUrl) || (truck === null || truck === void 0 ? void 0 : truck.facebookPageUrl)) && (<div className="flex flex-wrap gap-2">
                  {(truck === null || truck === void 0 ? void 0 : truck.instagramUrl) && (<Button variant="outline" size="sm" onClick={function () { return window.open(truck.instagramUrl, "_blank"); }}>
                      Open Instagram
                    </Button>)}
                  {(truck === null || truck === void 0 ? void 0 : truck.facebookPageUrl) && (<Button variant="outline" size="sm" onClick={function () {
                        return window.open(truck.facebookPageUrl, "_blank");
                    }}>
                      Open Facebook
                    </Button>)}
                </div>)}
            </CardContent>
          </Card>)}

        {isTruckViewUser && (<Card className="rounded-2xl border border-gray-200 bg-white">
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Your current schedule
                </p>
                <p className="text-xs text-gray-500">
                  Add non-MealScout stops to keep customers in the loop.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">
                  Booked parking pass schedule
                </p>
                {bookedSchedule.length > 0 ? (<div className="space-y-2">
                    {bookedSchedule.map(function (entry) {
                    var _a, _b;
                    return (<div key={"".concat(((_a = entry.event) === null || _a === void 0 ? void 0 : _a.id) || "booking", "-").concat(entry.slotType || "slot")} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        <p className="font-semibold text-gray-900 text-sm">
                          {entry.event
                            ? "".concat(format(new Date(entry.event.date), "EEE, MMM d"), " \u2022 ").concat(entry.event.startTime, " - ").concat(entry.event.endTime)
                            : "Upcoming booking"}
                        </p>
                        <p>{((_b = entry.host) === null || _b === void 0 ? void 0 : _b.businessName) || "Host location"}</p>
                        {entry.slotType && (<p className="text-[11px] text-gray-500">
                            Slot: {formatSlotLabel(entry.slotType)}
                          </p>)}
                      </div>);
                })}
                  </div>) : (<p className="text-xs text-gray-500">
                    No confirmed parking pass bookings yet.
                  </p>)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="schedule-date">Date</Label>
                  <Input id="schedule-date" type="date" value={scheduleForm.date} onChange={function (event) {
                return handleScheduleFieldChange("date", event.target.value);
            }}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-location">Location name</Label>
                  <Input id="schedule-location" placeholder="Downtown plaza" value={scheduleForm.locationName} onChange={function (event) {
                return handleScheduleFieldChange("locationName", event.target.value);
            }}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-start">Start time</Label>
                  <Input id="schedule-start" type="time" value={scheduleForm.startTime} onChange={function (event) {
                return handleScheduleFieldChange("startTime", event.target.value);
            }}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-end">End time</Label>
                  <Input id="schedule-end" type="time" value={scheduleForm.endTime} onChange={function (event) {
                return handleScheduleFieldChange("endTime", event.target.value);
            }}/>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-address">Address</Label>
                <Input id="schedule-address" placeholder="123 Main St, City" value={scheduleForm.address} onChange={function (event) {
                return handleScheduleFieldChange("address", event.target.value);
            }}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="schedule-city">City</Label>
                  <Input id="schedule-city" placeholder="City" value={scheduleForm.city} onChange={function (event) {
                return handleScheduleFieldChange("city", event.target.value);
            }}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-state">State</Label>
                  <Input id="schedule-state" placeholder="State" value={scheduleForm.state} onChange={function (event) {
                return handleScheduleFieldChange("state", event.target.value);
            }}/>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-notes">Notes</Label>
                <Textarea id="schedule-notes" placeholder="Optional notes for this stop." value={scheduleForm.notes} onChange={function (event) {
                return handleScheduleFieldChange("notes", event.target.value);
            }}/>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={scheduleForm.isPublic} onChange={function (event) {
                return handleScheduleFieldChange("isPublic", event.target.checked);
            }}/>
                  Show on public profile
                </label>
                <Button size="sm" onClick={handleCreateSchedule} disabled={isSavingSchedule}>
                  {isSavingSchedule ? "Saving..." : "Add stop"}
                </Button>
              </div>
              {manualSchedules.length > 0 && (<div className="space-y-2">
                  {manualSchedules.map(function (entry) { return (<div key={entry.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {new Date(entry.date).toLocaleDateString()} -{" "}
                            {entry.startTime} - {entry.endTime}
                          </p>
                          <p>
                            {entry.locationName ? "".concat(entry.locationName, " - ") : ""}
                            {entry.address}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={function () { return handleDeleteSchedule(entry.id); }} aria-label="Remove schedule entry">
                          <Trash2 className="h-4 w-4 text-gray-500"/>
                        </Button>
                      </div>
                    </div>); })}
                </div>)}
            </CardContent>
          </Card>)}

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Find parking pass spots
              </p>
              <p className="text-xs text-gray-500">
                Search by date, city, or address.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={viewMode === "map" ? "default" : "outline"} onClick={function () { return setViewMode("map"); }}>
                Map view
              </Button>
              <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={function () { return setViewMode("list"); }}>
                List view
              </Button>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
            <div className="space-y-4 order-1 lg:order-none">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-700">
                  Pick a day to book
                </p>
                <input type="date" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" value={selectedDate} onChange={function (event) { return setSelectedDate(event.target.value); }}/>
                <input type="text" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Search city or address" value={cityQuery} onChange={function (event) { return setCityQuery(event.target.value); }}/>
              </div>

              {isLoading ? (<div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600"/>
                  <p className="text-sm text-gray-600">
                    Loading parking pass spots...
                  </p>
                </div>) : events.length === 0 ? (<div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                  No parking pass spots are available right now.
                </div>) : viewMode === "map" ? (<div className="space-y-3">
                  <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                    <div className="h-72 w-full bg-gray-100">
                      {mapCenter ? (<MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13} scrollWheelZoom className="h-full w-full">
                          <MapCenterer center={mapCenter}/>
                          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"/>
                          {mapEvents.map(function (_a) {
                    var event = _a.event, coords = _a.coords;
                    var bookings = Array.isArray(event.bookings)
                        ? event.bookings
                        : [];
                    var slotOptions = buildSlotOptions(event);
                    var selectedSlots = selectedSlotsByEvent[event.id] || [];
                    var selectedTotalCents = selectedSlots.reduce(function (sum, slot) {
                        var _a;
                        var price = ((_a = slotOptions.find(function (item) { return item.type === slot; })) === null || _a === void 0 ? void 0 : _a.priceCents) || 0;
                        return sum + price;
                    }, 0);
                    var selectedFeeCents = getFeeCentsForSlots(selectedSlots, selectedTotalCents);
                    var selectedTotalWithFee = selectedTotalCents > 0
                        ? selectedTotalCents + selectedFeeCents
                        : 0;
                    var availability = event.availableSpotNumbers
                        ? event.availableSpotNumbers.length > 0
                            ? "Open spots: ".concat(event.availableSpotNumbers.join(", "))
                            : "Fully booked"
                        : event.status === "open"
                            ? "Open"
                            : "Closed";
                    var hasAvailability = event.availableSpotNumbers
                        ? event.availableSpotNumbers.length > 0
                        : event.status === "open";
                    return (<Marker key={event.id} position={[coords.lat, coords.lng]} icon={parkingPassPinIcon} eventHandlers={{
                            click: function () { return setActiveEventId(event.id); },
                        }}>
                                <Popup>
                                  <div className="space-y-2 text-xs">
                                    <p className="font-semibold text-gray-900">
                                      {event.host.businessName}
                                    </p>
                                    <p className="text-gray-600">
                                      {event.host.address}
                                    </p>
                                    <p className="text-gray-600">
                                      {format(new Date(event.date), "EEE, MMM d")}{" "}
                                      •{" "}
                                      {event.startTime === "00:00" &&
                            event.endTime === "23:59"
                            ? "Any time"
                            : "".concat(event.startTime, " - ").concat(event.endTime)}
                                    </p>
                                    <p className="text-gray-600">
                                      {availability}
                                    </p>
                                    {slotOptions.length > 0 && (<div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                          {slotOptions.map(function (slot) {
                                var feeCents = getFeeCentsForSlots([slot.type], slot.priceCents || 0);
                                var totalPrice = ((slot.priceCents || 0) +
                                    feeCents) /
                                    100;
                                var isSelected = selectedSlots.includes(slot.type);
                                return (<Button key={slot.type} variant={isSelected
                                        ? "default"
                                        : "outline"} size="sm" className="justify-between text-[11px]" disabled={!hasAvailability} onClick={function () {
                                        return handleSelect(event, slot.type);
                                    }}>
                                                <span>{slot.label}</span>
                                                <span>
                                                  ${totalPrice.toFixed(2)}
                                                </span>
                                              </Button>);
                            })}
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] text-gray-500">
                                            Includes $10 MealScout fee.
                                          </span>
                                          <Button size="sm" onClick={function () {
                                return handleBookSelected(event);
                            }} disabled={selectedSlots.length === 0}>
                                            Book spot
                                            {selectedTotalWithFee > 0 && (<span className="ml-2 text-[11px]">
                                                ${((selectedTotalWithFee || 0) /
                                    100).toFixed(2)}
                                              </span>)}
                                          </Button>
                                        </div>
                                      </div>)}
                                    {bookings.length > 0 ? (<div className="pt-1 text-[11px] text-gray-500 space-y-1">
                                        {bookings
                                .slice(0, 3)
                                .map(function (booking) { return (<div key={"".concat(booking.truckId, "-").concat(booking.slotType || "slot")}>
                                              {booking.truckName}
                                              {booking.slotType
                                    ? " \u2022 ".concat(formatSlotLabel(booking.slotType))
                                    : ""}
                                            </div>); })}
                                        {bookings.length > 3 && (<div>
                                            +{bookings.length - 3} more
                                          </div>)}
                                      </div>) : (<p className="pt-1 text-[11px] text-gray-500">
                                        No bookings yet
                                      </p>)}
                                  </div>
                                </Popup>
                              </Marker>);
                })}
                        </MapContainer>) : (<div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
                          No mappable locations yet.
                        </div>)}
                    </div>
                    <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
                      Tap a location below to update the map.
                    </div>
                  </div>
                  <div className="space-y-2">
                    {filteredEvents.map(function (event) {
                var _a;
                var slotOptions = buildSlotOptions(event);
                var selectedSlots = selectedSlotsByEvent[event.id] || [];
                var selectedTotalCents = selectedSlots.reduce(function (sum, slot) {
                    var _a;
                    var price = ((_a = slotOptions.find(function (item) { return item.type === slot; })) === null || _a === void 0 ? void 0 : _a.priceCents) || 0;
                    return sum + price;
                }, 0);
                var selectedFeeCents = getFeeCentsForSlots(selectedSlots, selectedTotalCents);
                var selectedTotalWithFee = selectedTotalCents > 0
                    ? selectedTotalCents + selectedFeeCents
                    : 0;
                var availableSpots = event.availableSpotNumbers;
                var hasAvailability = availableSpots === undefined
                    ? event.status === "open"
                    : availableSpots.length > 0;
                var bookings = Array.isArray(event.bookings)
                    ? event.bookings
                    : [];
                return (<div key={event.id} role="button" tabIndex={0} aria-pressed={(activeEvent === null || activeEvent === void 0 ? void 0 : activeEvent.id) === event.id} onClick={function () { return setActiveEventId(event.id); }} onKeyDown={function (keyboardEvent) {
                        if (keyboardEvent.key === "Enter" ||
                            keyboardEvent.key === " ") {
                            keyboardEvent.preventDefault();
                            setActiveEventId(event.id);
                        }
                    }} className={"w-full rounded-xl border px-4 py-3 space-y-2 transition cursor-pointer ".concat((activeEvent === null || activeEvent === void 0 ? void 0 : activeEvent.id) === event.id
                        ? "border-orange-300 bg-orange-50"
                        : "border-gray-200 bg-white hover:bg-gray-50")}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-gray-900">
                                {event.host.businessName}
                              </span>
                              <div className="text-xs text-gray-500">
                                {format(new Date(event.date), "EEE, MMM d")}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={function () { return setActiveEventId(event.id); }}>
                              View
                            </Button>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>{event.host.address}</p>
                            <p>
                              {event.startTime === "00:00" &&
                        event.endTime === "23:59"
                        ? "Any time"
                        : "".concat(event.startTime, " - ").concat(event.endTime)}
                            </p>
                            {event.availableSpotNumbers && (<p className="text-[11px] text-gray-500">
                                {event.availableSpotNumbers.length > 0
                            ? "Open spot".concat(event.availableSpotNumbers.length > 1 ? "s" : "", ": ").concat(event.availableSpotNumbers.join(", "))
                            : "Fully booked"}
                              </p>)}
                            {bookings.length > 0 ? (<div className="text-[11px] text-gray-500">
                                Booked trucks:{" "}
                                {bookings
                            .slice(0, 2)
                            .map(function (booking) { return booking.truckName; })
                            .join(", ")}
                                {bookings.length > 2
                            ? " +".concat(bookings.length - 2, " more")
                            : ""}
                              </div>) : (<div className="text-[11px] text-gray-500">
                                No bookings yet
                              </div>)}
                          </div>
                          <div>
                            <ShareButton url={"/parking-pass?date=".concat(encodeURIComponent(((_a = event.date) === null || _a === void 0 ? void 0 : _a.split("T")[0]) || selectedDate), "&pass=").concat(event.id)} title={"Parking Pass at ".concat(event.host.businessName)} description={"".concat(event.host.address).concat(event.host.city ? ", ".concat(event.host.city) : "").concat(event.host.state ? ", ".concat(event.host.state) : "")} size="sm" variant="outline"/>
                          </div>
                          {slotOptions.length > 0 && (<div className="grid grid-cols-2 gap-2 pt-1">
                              {slotOptions.map(function (slot) {
                            var feeCents = getFeeCentsForSlots([slot.type], slot.priceCents || 0);
                            var totalPrice = ((slot.priceCents || 0) + feeCents) / 100;
                            var isSelected = selectedSlots.includes(slot.type);
                            return (<Button key={slot.type} variant={isSelected ? "default" : "outline"} size="sm" className="justify-between" disabled={!hasAvailability} onClick={function () { return handleSelect(event, slot.type); }}>
                                    <span>{slot.label}</span>
                                    <span>${totalPrice.toFixed(2)}</span>
                                  </Button>);
                        })}
                            </div>)}
                          {hasAvailability ? (<div className="flex items-center justify-between gap-3 pt-2">
                              <p className="text-[11px] text-gray-500">
                                Includes a $10/day MealScout fee per host.
                              </p>
                              <Button size="sm" onClick={function () { return handleBookSelected(event); }} disabled={selectedSlots.length === 0}>
                                Add to cart
                                {selectedTotalWithFee > 0 && (<span className="ml-2 text-xs">
                                    ${((selectedTotalWithFee || 0) / 100).toFixed(2)}
                                  </span>)}
                              </Button>
                            </div>) : (<p className="text-[11px] text-gray-500">
                              Fully booked.
                            </p>)}
                        </div>);
            })}
                    {filteredEvents.length === 0 && (<div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                        No spots are available for that day.
                      </div>)}
                  </div>
                </div>) : (<div className="space-y-3">
                  {filteredEvents.map(function (event) {
                var _a;
                var slotOptions = buildSlotOptions(event);
                var selectedSlots = selectedSlotsByEvent[event.id] || [];
                var selectedTotalCents = selectedSlots.reduce(function (sum, slot) {
                    var _a;
                    var price = ((_a = slotOptions.find(function (item) { return item.type === slot; })) === null || _a === void 0 ? void 0 : _a.priceCents) || 0;
                    return sum + price;
                }, 0);
                var selectedFeeCents = getFeeCentsForSlots(selectedSlots, selectedTotalCents);
                var selectedTotalWithFee = selectedTotalCents > 0
                    ? selectedTotalCents + selectedFeeCents
                    : 0;
                var availableSpots = event.availableSpotNumbers;
                var hasAvailability = availableSpots === undefined
                    ? event.status === "open"
                    : availableSpots.length > 0;
                return (<div key={event.id} role="button" tabIndex={0} aria-pressed={(activeEvent === null || activeEvent === void 0 ? void 0 : activeEvent.id) === event.id} onClick={function () { return setActiveEventId(event.id); }} onKeyDown={function (keyboardEvent) {
                        if (keyboardEvent.key === "Enter" ||
                            keyboardEvent.key === " ") {
                            keyboardEvent.preventDefault();
                            setActiveEventId(event.id);
                        }
                    }} className={"w-full text-left rounded-xl border px-4 py-3 space-y-2 transition cursor-pointer ".concat((activeEvent === null || activeEvent === void 0 ? void 0 : activeEvent.id) === event.id
                        ? "border-orange-300 bg-orange-50"
                        : "border-gray-200 bg-white hover:bg-gray-50")}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">
                            {event.host.businessName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(event.date), "EEE, MMM d")}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p>{event.host.address}</p>
                          <p>
                            {event.startTime === "00:00" &&
                        event.endTime === "23:59"
                        ? "Any time"
                        : "".concat(event.startTime, " - ").concat(event.endTime)}
                          </p>
                          {availableSpots && (<p className="text-[11px] text-gray-500">
                              {availableSpots.length > 0
                            ? "Open spot".concat(availableSpots.length > 1 ? "s" : "", ": ").concat(availableSpots.join(", "))
                            : "Fully booked"}
                            </p>)}
                        </div>
                        <div>
                          <ShareButton url={"/parking-pass?date=".concat(encodeURIComponent(((_a = event.date) === null || _a === void 0 ? void 0 : _a.split("T")[0]) || selectedDate), "&pass=").concat(event.id)} title={"Parking Pass at ".concat(event.host.businessName)} description={"".concat(event.host.address).concat(event.host.city ? ", ".concat(event.host.city) : "").concat(event.host.state ? ", ".concat(event.host.state) : "")} size="sm" variant="outline"/>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {slotOptions.map(function (slot) {
                        var feeCents = getFeeCentsForSlots([slot.type], slot.priceCents || 0);
                        var totalPrice = ((slot.priceCents || 0) + feeCents) / 100;
                        var isSelected = selectedSlots.includes(slot.type);
                        return (<Button key={slot.type} variant={isSelected ? "default" : "outline"} size="sm" className="justify-between" disabled={!hasAvailability} onClick={function () { return handleSelect(event, slot.type); }}>
                                <span>{slot.label}</span>
                                <span>${totalPrice.toFixed(2)}</span>
                              </Button>);
                    })}
                        </div>
                        {hasAvailability ? (<div className="flex items-center justify-between gap-3 pt-2">
                            <p className="text-[11px] text-gray-500">
                              Includes a $10/day MealScout fee per host.
                            </p>
                            <Button size="sm" onClick={function () { return handleBookSelected(event); }} disabled={selectedSlots.length === 0}>
                              Add to cart
                              {selectedTotalWithFee > 0 && (<span className="ml-2 text-xs">
                                  ${((selectedTotalWithFee || 0) / 100).toFixed(2)}
                                </span>)}
                            </Button>
                          </div>) : (<p className="text-[11px] text-gray-500">
                            Fully booked.
                          </p>)}
                      </div>);
            })}
                  {filteredEvents.length === 0 && (<div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                      No spots are available for that day.
                    </div>)}
                </div>)}
            </div>

            <div className="space-y-4 order-2 lg:order-none">
              {cartItems.length > 0 && (<div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Booking cart
                      </p>
                      <p className="text-xs text-gray-500">
                        Separate charges per host.
                      </p>
                    </div>
                    <Button size="sm" onClick={startCheckout}>
                      Checkout {cartItems.length}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {cartItems.map(function (item) { return (<div key={item.event.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        <div className="flex items-center justify-between text-sm text-gray-900">
                          <span>{item.event.host.businessName}</span>
                          <button type="button" className="text-xs text-gray-500 underline" onClick={function () { return removeCartItem(item.event.id); }}>
                            remove
                          </button>
                        </div>
                        <p>
                          {format(new Date(item.event.date), "EEE, MMM d")} -{" "}
                          {item.slotTypes.join(", ")}
                        </p>
                      </div>); })}
                  </div>
                  {(function () {
                var totals = getCartTotals();
                if (!totals.totalCents)
                    return null;
                return (<div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Host total</span>
                          <span>${(totals.hostCents / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>MealScout fee</span>
                          <span>${(totals.feeCents / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between font-semibold text-gray-900">
                          <span>Total</span>
                          <span>${(totals.totalCents / 100).toFixed(2)}</span>
                        </div>
                      </div>);
            })()}
                </div>)}

              <Card className="rounded-2xl border border-gray-200 bg-white">
                <CardContent className="p-5 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {(activeEvent === null || activeEvent === void 0 ? void 0 : activeEvent.host.businessName) || "Select a location"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(activeEvent === null || activeEvent === void 0 ? void 0 : activeEvent.host.address) || "Choose a spot to see details."}
                    </p>
                  </div>
                  {activeEvent && (<>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                          {activeEvent.host.locationType || "Location"}
                        </span>
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                          Foot traffic:{" "}
                          {activeEvent.host.expectedFootTraffic || "Not shared"}
                        </span>
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                          {activeEvent.startTime === "00:00" &&
                activeEvent.endTime === "23:59"
                ? "Any time"
                : "".concat(activeEvent.startTime, " - ").concat(activeEvent.endTime)}
                        </span>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 space-y-2">
                        <p className="text-[11px] font-semibold text-gray-700">
                          Schedule
                        </p>
                        <div className="flex items-center justify-between">
                          <span>Date</span>
                          <span>
                            {format(new Date(activeEvent.date), "EEE, MMM d")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Time</span>
                          <span>
                            {activeEvent.startTime === "00:00" &&
                activeEvent.endTime === "23:59"
                ? "Any time"
                : "".concat(activeEvent.startTime, " - ").concat(activeEvent.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Status</span>
                          <span className="capitalize">{activeEvent.status}</span>
                        </div>
                        {activeEventAvailability && (<div className="flex items-center justify-between">
                            <span>Availability</span>
                            <span>{activeEventAvailability}</span>
                          </div>)}
                      </div>
                      {activeEventBookings.length > 0 ? (<div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 space-y-2">
                          <p className="text-[11px] font-semibold text-gray-700">
                            Booked trucks
                          </p>
                          <div className="space-y-1">
                            {activeEventBookings.slice(0, 5).map(function (booking) { return (<div key={"".concat(booking.truckId, "-").concat(booking.slotType || "slot")} className="flex items-center justify-between">
                                <span>{booking.truckName}</span>
                                <span className="text-[11px] text-gray-500">
                                  {booking.slotType
                        ? formatSlotLabel(booking.slotType)
                        : "Booked"}
                                  {booking.spotNumber
                        ? " \u2022 Spot ".concat(booking.spotNumber)
                        : ""}
                                </span>
                              </div>); })}
                            {activeEventBookings.length > 5 && (<div className="text-[11px] text-gray-500">
                                +{activeEventBookings.length - 5} more
                              </div>)}
                          </div>
                        </div>) : (<p className="text-[11px] text-gray-500">
                          No bookings yet.
                        </p>)}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-700">
                          Slot pricing
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                {
                    label: "Breakfast",
                    type: "breakfast",
                    priceCents: activeEvent.breakfastPriceCents,
                },
                {
                    label: "Lunch",
                    type: "lunch",
                    priceCents: activeEvent.lunchPriceCents,
                },
                {
                    label: "Dinner",
                    type: "dinner",
                    priceCents: activeEvent.dinnerPriceCents,
                },
                {
                    label: "Daily",
                    type: "daily",
                    priceCents: activeEvent.dailyPriceCents,
                },
                {
                    label: "Weekly",
                    type: "weekly",
                    priceCents: activeEvent.weeklyPriceCents,
                },
                {
                    label: "Monthly",
                    type: "monthly",
                    priceCents: activeEvent.monthlyPriceCents,
                },
            ]
                .filter(function (slot) { return (slot.priceCents || 0) > 0; })
                .map(function (slot) {
                var feeCents = getFeeCentsForSlots([slot.type], slot.priceCents || 0);
                var totalPrice = ((slot.priceCents || 0) + feeCents) / 100;
                var selectedSlots = selectedSlotsByEvent[activeEvent.id] || [];
                var isSelected = selectedSlots.includes(slot.type);
                return (<Button key={slot.type} variant={isSelected ? "default" : "outline"} size="sm" className="justify-between" disabled={activeEvent.status !== "open"} onClick={function () {
                        return handleSelect(activeEvent, slot.type);
                    }}>
                                  <span>{slot.label}</span>
                                  <span>${totalPrice.toFixed(2)}</span>
                                </Button>);
            })}
                        </div>
                      </div>
                      {activeEvent.status === "open" && (<div className="flex items-center justify-between gap-3 pt-2">
                          <p className="text-[11px] text-gray-500">
                            Includes a $10/day MealScout fee per host.
                          </p>
                          <Button size="sm" onClick={function () { return handleBookSelected(activeEvent); }} disabled={(selectedSlotsByEvent[activeEvent.id] || [])
                    .length === 0}>
                            Add to cart
                          </Button>
                        </div>)}
                    </>)}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && truckId && selectedSlotTypes.length > 0 && (<BookingPaymentModal open={paymentOpen} onOpenChange={setPaymentOpen} passId={selectedEvent.id} truckId={truckId} slotTypes={selectedSlotTypes} eventDetails={{
                name: "Parking Pass",
                date: format(new Date(selectedEvent.date), "MMMM d, yyyy"),
                startTime: selectedEvent.startTime,
                endTime: selectedEvent.endTime,
                hostName: selectedEvent.host.businessName,
                hostPrice: selectedEvent.hostPriceCents,
                slotSummary: selectedSlotTypes.map(formatSlotLabel).join(", "),
            }} onSuccess={function () {
                if (selectedEvent) {
                    removeCartItem(selectedEvent.id);
                }
                handleSuccess();
            }}/>)}
    </div>);
}
