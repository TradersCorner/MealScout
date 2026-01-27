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
import { apiRequest } from "@/lib/queryClient";
var STORAGE_KEYS = {
    SETTINGS: "mealscout_notification_settings",
    LAST_LOCATION: "mealscout_last_location",
    SHOWN_DEALS: "mealscout_shown_deals",
    SHOWN_EVENTS: "mealscout_shown_events",
    DAILY_COUNT: "mealscout_daily_count",
};
var DEFAULT_SETTINGS = {
    enabled: false,
    radius: 1, // 1km default
    categories: [], // empty means all categories
    quietHours: { start: "22:00", end: "08:00" },
    maxPerDay: 5,
};
var LocationNotificationService = /** @class */ (function () {
    function LocationNotificationService() {
        this.watchId = null;
        this.lastLocation = null;
        this.isMonitoring = false;
        this.shownDealsToday = new Set();
        this.shownEventsToday = new Set();
        this.dailyCount = 0;
        this.loadStoredData();
        this.resetDailyCountIfNeeded();
    }
    LocationNotificationService.prototype.loadStoredData = function () {
        try {
            var lastLocation = localStorage.getItem(STORAGE_KEYS.LAST_LOCATION);
            if (lastLocation) {
                this.lastLocation = JSON.parse(lastLocation);
            }
            var shownDeals = localStorage.getItem(STORAGE_KEYS.SHOWN_DEALS);
            if (shownDeals) {
                this.shownDealsToday = new Set(JSON.parse(shownDeals));
            }
            var shownEvents = localStorage.getItem(STORAGE_KEYS.SHOWN_EVENTS);
            if (shownEvents) {
                this.shownEventsToday = new Set(JSON.parse(shownEvents));
            }
            var dailyCount = localStorage.getItem(STORAGE_KEYS.DAILY_COUNT);
            if (dailyCount) {
                this.dailyCount = parseInt(dailyCount);
            }
        }
        catch (_a) {
            // Ignore errors
        }
    };
    LocationNotificationService.prototype.resetDailyCountIfNeeded = function () {
        var today = new Date().toDateString();
        var lastReset = localStorage.getItem("mealscout_last_reset");
        if (lastReset !== today) {
            this.shownDealsToday.clear();
            this.shownEventsToday.clear();
            this.dailyCount = 0;
            localStorage.setItem("mealscout_last_reset", today);
            localStorage.setItem(STORAGE_KEYS.SHOWN_DEALS, "[]");
            localStorage.setItem(STORAGE_KEYS.SHOWN_EVENTS, "[]");
            localStorage.setItem(STORAGE_KEYS.DAILY_COUNT, "0");
        }
    };
    LocationNotificationService.prototype.getSettings = function () {
        try {
            var stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (stored) {
                return __assign(__assign({}, DEFAULT_SETTINGS), JSON.parse(stored));
            }
        }
        catch (_a) {
            // Ignore errors
        }
        return DEFAULT_SETTINGS;
    };
    LocationNotificationService.prototype.updateSettings = function (settings) {
        var current = this.getSettings();
        var updated = __assign(__assign({}, current), settings);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        // Restart monitoring if settings changed
        if (this.isMonitoring) {
            this.stopMonitoring();
            this.startMonitoring();
        }
    };
    LocationNotificationService.prototype.requestPermission = function () {
        return __awaiter(this, void 0, void 0, function () {
            var permission;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!("Notification" in window)) {
                            console.log("This browser does not support notifications");
                            return [2 /*return*/, false];
                        }
                        if (Notification.permission === "granted") {
                            return [2 /*return*/, true];
                        }
                        if (!(Notification.permission !== "denied")) return [3 /*break*/, 2];
                        return [4 /*yield*/, Notification.requestPermission()];
                    case 1:
                        permission = _a.sent();
                        return [2 /*return*/, permission === "granted"];
                    case 2: return [2 /*return*/, false];
                }
            });
        });
    };
    LocationNotificationService.prototype.startMonitoring = function () {
        return __awaiter(this, void 0, void 0, function () {
            var settings, hasPermission;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        settings = this.getSettings();
                        if (!settings.enabled || !navigator.geolocation) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.requestPermission()];
                    case 1:
                        hasPermission = _a.sent();
                        if (!hasPermission) {
                            console.log("Notification permission not granted");
                            return [2 /*return*/];
                        }
                        this.isMonitoring = true;
                        // Watch for location changes
                        this.watchId = navigator.geolocation.watchPosition(function (position) { return _this.handleLocationUpdate(position); }, function (error) { return console.error("Location error:", error); }, {
                            enableHighAccuracy: true,
                            timeout: 30000,
                            maximumAge: 60 * 1000, // 1 minute for better accuracy
                        });
                        console.log("📍 Started location monitoring for deal notifications");
                        return [2 /*return*/];
                }
            });
        });
    };
    LocationNotificationService.prototype.stopMonitoring = function () {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.isMonitoring = false;
        console.log("📍 Stopped location monitoring");
    };
    LocationNotificationService.prototype.handleLocationUpdate = function (position) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, lat, lng, now, shouldCheck;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = position.coords, lat = _a.latitude, lng = _a.longitude;
                        now = Date.now();
                        shouldCheck = !this.lastLocation ||
                            this.hasMoved(lat, lng, this.lastLocation) ||
                            now - this.lastLocation.timestamp > 10 * 60 * 1000;
                        if (!shouldCheck)
                            return [2 /*return*/];
                        this.lastLocation = { lat: lat, lng: lng, timestamp: now };
                        localStorage.setItem(STORAGE_KEYS.LAST_LOCATION, JSON.stringify(this.lastLocation));
                        // Check for nearby deals and events
                        return [4 /*yield*/, Promise.all([
                                this.checkNearbyDeals(lat, lng),
                                this.checkNearbyEvents(lat, lng),
                            ])];
                    case 1:
                        // Check for nearby deals and events
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    LocationNotificationService.prototype.hasMoved = function (lat1, lng1, lastLocation) {
        var distance = this.calculateDistance(lat1, lng1, lastLocation.lat, lastLocation.lng);
        return distance > 0.1; // 100 meters
    };
    LocationNotificationService.prototype.calculateDistance = function (lat1, lng1, lat2, lng2) {
        var R = 6371; // Earth's radius in kilometers
        var dLat = this.toRadians(lat2 - lat1);
        var dLng = this.toRadians(lng2 - lng1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
                Math.cos(this.toRadians(lat2)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };
    LocationNotificationService.prototype.toRadians = function (degrees) {
        return degrees * (Math.PI / 180);
    };
    LocationNotificationService.prototype.checkNearbyDeals = function (lat, lng) {
        return __awaiter(this, void 0, void 0, function () {
            var settings, nearbyDeals, newDeals, _i, _a, deal, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        settings = this.getSettings();
                        // Check if we're in quiet hours
                        if (this.isQuietTime(settings.quietHours)) {
                            return [2 /*return*/];
                        }
                        // Check daily limit
                        if (this.dailyCount >= settings.maxPerDay) {
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, apiRequest("GET", "/api/deals/nearby/".concat(lat, "/").concat(lng, "?radius=").concat(settings.radius))];
                    case 2:
                        nearbyDeals = (_b.sent());
                        newDeals = nearbyDeals.filter(function (deal) {
                            return !_this.shownDealsToday.has(deal.id) &&
                                _this.matchesCategories(deal, settings.categories);
                        });
                        _i = 0, _a = newDeals.slice(0, settings.maxPerDay - this.dailyCount);
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        deal = _a[_i];
                        return [4 /*yield*/, this.showNotification(deal)];
                    case 4:
                        _b.sent();
                        this.markDealAsShown(deal.id);
                        this.dailyCount++;
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        // Update stored counts
                        localStorage.setItem(STORAGE_KEYS.DAILY_COUNT, this.dailyCount.toString());
                        localStorage.setItem(STORAGE_KEYS.SHOWN_DEALS, JSON.stringify(Array.from(this.shownDealsToday)));
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _b.sent();
                        console.error("Failed to check nearby deals:", error_1);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    LocationNotificationService.prototype.checkNearbyEvents = function (lat, lng) {
        return __awaiter(this, void 0, void 0, function () {
            var settings, response, eventLocations, EVENT_RADIUS_KM_1, candidates, newEvents, _i, _a, event_1, error_2;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        settings = this.getSettings();
                        // Respect quiet hours and daily cap (shared with deals)
                        if (this.isQuietTime(settings.quietHours)) {
                            return [2 /*return*/];
                        }
                        if (this.dailyCount >= settings.maxPerDay) {
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, apiRequest("GET", "/api/map/locations")];
                    case 2:
                        response = _b.sent();
                        eventLocations = (response || {}).eventLocations;
                        if (!eventLocations || eventLocations.length === 0) {
                            return [2 /*return*/];
                        }
                        EVENT_RADIUS_KM_1 = 16.1;
                        candidates = eventLocations.filter(function (event) {
                            if (event.status !== "open")
                                return false;
                            var hostLatRaw = event.hostLatitude;
                            var hostLngRaw = event.hostLongitude;
                            if (hostLatRaw == null || hostLngRaw == null)
                                return false;
                            var hostLat = typeof hostLatRaw === "string" ? parseFloat(hostLatRaw) : hostLatRaw;
                            var hostLng = typeof hostLngRaw === "string" ? parseFloat(hostLngRaw) : hostLngRaw;
                            if (Number.isNaN(hostLat) || Number.isNaN(hostLng))
                                return false;
                            var distanceKm = _this.calculateDistance(lat, lng, hostLat, hostLng);
                            return distanceKm <= EVENT_RADIUS_KM_1;
                        });
                        newEvents = candidates.filter(function (event) { return !_this.shownEventsToday.has(event.id); });
                        _i = 0, _a = newEvents.slice(0, settings.maxPerDay - this.dailyCount);
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        event_1 = _a[_i];
                        return [4 /*yield*/, this.showEventNotification(event_1)];
                    case 4:
                        _b.sent();
                        this.markEventAsShown(event_1.id);
                        this.dailyCount++;
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        localStorage.setItem(STORAGE_KEYS.DAILY_COUNT, this.dailyCount.toString());
                        localStorage.setItem(STORAGE_KEYS.SHOWN_EVENTS, JSON.stringify(Array.from(this.shownEventsToday)));
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _b.sent();
                        console.error("Failed to check nearby events:", error_2);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    LocationNotificationService.prototype.isQuietTime = function (quietHours) {
        var now = new Date();
        var currentTime = now.getHours() * 60 + now.getMinutes();
        var _a = quietHours.start.split(":").map(Number), startHour = _a[0], startMin = _a[1];
        var _b = quietHours.end.split(":").map(Number), endHour = _b[0], endMin = _b[1];
        var startTime = startHour * 60 + startMin;
        var endTime = endHour * 60 + endMin;
        if (startTime <= endTime) {
            // Same day quiet hours (e.g., 22:00 to 23:00)
            return currentTime >= startTime && currentTime <= endTime;
        }
        else {
            // Overnight quiet hours (e.g., 22:00 to 08:00)
            return currentTime >= startTime || currentTime <= endTime;
        }
    };
    LocationNotificationService.prototype.matchesCategories = function (deal, categories) {
        if (categories.length === 0)
            return true; // No filter means all categories
        // This would need to be enhanced based on how we store restaurant categories
        return true; // For now, allow all deals
    };
    LocationNotificationService.prototype.showNotification = function (deal) {
        return __awaiter(this, void 0, void 0, function () {
            var notification;
            return __generator(this, function (_a) {
                if (Notification.permission !== "granted")
                    return [2 /*return*/];
                notification = new Notification("\uD83C\uDF7D\uFE0F New Deal Nearby!", {
                    body: "".concat(deal.restaurantName, ": ").concat(deal.title, "\n").concat(deal.discountValue, "% OFF \u2022 ").concat(deal.distance.toFixed(1), "km away"),
                    icon: deal.imageUrl || "/favicon.ico",
                    tag: "deal-".concat(deal.id),
                    requireInteraction: false,
                    silent: false,
                });
                notification.onclick = function () {
                    window.focus();
                    window.location.href = "/deal/".concat(deal.id);
                    notification.close();
                };
                // Auto-close after 5 seconds
                setTimeout(function () { return notification.close(); }, 5000);
                return [2 /*return*/];
            });
        });
    };
    LocationNotificationService.prototype.markDealAsShown = function (dealId) {
        this.shownDealsToday.add(dealId);
    };
    LocationNotificationService.prototype.showEventNotification = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var when, title, bodyLines, notification;
            return __generator(this, function (_a) {
                if (Notification.permission !== "granted")
                    return [2 /*return*/];
                when = "".concat(new Date(event.date).toLocaleDateString(), " \u2022 ").concat(event.startTime, " - ").concat(event.endTime);
                title = "📅 Food truck event near you";
                bodyLines = [
                    event.name,
                    event.hostName ? "Host: ".concat(event.hostName) : null,
                    event.hostAddress || null,
                    when,
                ].filter(Boolean);
                notification = new Notification(title, {
                    body: bodyLines.join("\n"),
                    icon: "/icons/event-badge.png",
                    tag: "event-".concat(event.id),
                    requireInteraction: false,
                    silent: false,
                });
                notification.onclick = function () {
                    window.focus();
                    window.location.href = "/truck-discovery?eventId=".concat(event.id);
                    notification.close();
                };
                setTimeout(function () { return notification.close(); }, 7000);
                return [2 /*return*/];
            });
        });
    };
    LocationNotificationService.prototype.markEventAsShown = function (eventId) {
        this.shownEventsToday.add(eventId);
    };
    LocationNotificationService.prototype.isMonitoringActive = function () {
        return this.isMonitoring;
    };
    LocationNotificationService.prototype.getCurrentLocation = function () {
        return this.lastLocation
            ? { lat: this.lastLocation.lat, lng: this.lastLocation.lng }
            : null;
    };
    LocationNotificationService.prototype.getTodayStats = function () {
        return {
            notificationsShown: this.dailyCount,
            maxAllowed: this.getSettings().maxPerDay,
            dealsShown: this.shownDealsToday.size,
        };
    };
    return LocationNotificationService;
}());
// Export singleton instance
export var locationNotificationService = new LocationNotificationService();
