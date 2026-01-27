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
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, } from "react-leaflet";
import L from "leaflet";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation as NavigationIcon, List, X, } from "lucide-react";
import DealCard from "@/components/deal-card";
import { SEOHead } from "@/components/seo-head";
import mealScoutIcon from "@assets/meal-scout-icon.png";
import { sendGeoPing, trackGeoAdEvent, trackGeoAdImpression } from "@/utils/geoAds";
// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
});
var svgToDataUrl = function (svg) {
    return "data:image/svg+xml;base64," + btoa(svg);
};
// Custom user location icon (person silhouette, not a pin)
var userLocationIcon = L.divIcon({
    className: "map-user-marker",
    html: "\n    <div class=\"map-user-marker__pulse\"></div>\n    <div class=\"map-user-marker__logo\">\n      <svg class=\"map-user-marker__person\" viewBox=\"0 0 32 32\" aria-hidden=\"true\">\n        <circle cx=\"16\" cy=\"11\" r=\"5.2\" fill=\"#0F172A\" />\n        <path d=\"M6 28c0-5.2 4.5-9.4 10-9.4s10 4.2 10 9.4\" fill=\"#0F172A\" />\n      </svg>\n    </div>\n  ",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});
var parkingPassPinIcon = new L.Icon({
    iconUrl: mealScoutIcon,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -30],
});
// Component to handle map controls
function MapControls(_a) {
    var onZoomIn = _a.onZoomIn, onZoomOut = _a.onZoomOut, onCenterUser = _a.onCenterUser, userLocation = _a.userLocation, zoomLevel = _a.zoomLevel;
    var map = useMap();
    var handleZoomIn = function () {
        map.zoomIn();
        onZoomIn();
    };
    var handleZoomOut = function () {
        map.zoomOut();
        onZoomOut();
    };
    var handleCenterUser = function () {
        if (userLocation) {
            map.setView([userLocation.lat, userLocation.lng], map.getZoom());
            onCenterUser();
        }
    };
    return (<div className="absolute top-5 right-5 flex flex-col space-y-2 z-[1000]">
      <Button variant="secondary" size="sm" className="w-9 h-9 p-0 rounded-full bg-white/90 border border-white/60 shadow-lg backdrop-blur" onClick={handleZoomIn} data-testid="button-zoom-in" title="Zoom in">
        +
      </Button>
      <Button variant="secondary" size="sm" className="w-9 h-9 p-0 rounded-full bg-white/90 border border-white/60 shadow-lg backdrop-blur" onClick={handleZoomOut} data-testid="button-zoom-out" title="Zoom out">
        −
      </Button>
      <Button variant="secondary" size="sm" className="w-9 h-9 p-0 rounded-full bg-white/90 border border-white/60 shadow-lg backdrop-blur" onClick={handleCenterUser} disabled={!userLocation} data-testid="button-center-location" title="Center on location">
        <NavigationIcon className="w-4 h-4"/>
      </Button>
    </div>);
}
function MapViewportWatcher(_a) {
    var onZoomChange = _a.onZoomChange, onBoundsChange = _a.onBoundsChange;
    var map = useMapEvents({
        zoomend: function (event) {
            onZoomChange(event.target.getZoom());
            onBoundsChange(event.target.getBounds());
        },
        moveend: function (event) {
            onBoundsChange(event.target.getBounds());
        },
    });
    useEffect(function () {
        onZoomChange(map.getZoom());
        onBoundsChange(map.getBounds());
    }, [map, onZoomChange, onBoundsChange]);
    return null;
}
function MapCenterer(_a) {
    var center = _a.center;
    var map = useMap();
    useEffect(function () {
        if (!center)
            return;
        map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }, [center === null || center === void 0 ? void 0 : center.lat, center === null || center === void 0 ? void 0 : center.lng, map]);
    return null;
}
var toNumberOrNull = function (value) {
    if (value === null || value === undefined)
        return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};
var buildFullAddress = function (address, city, state) {
    return [address, city, state].filter(Boolean).join(", ");
};
var haversineKm = function (a, b) {
    var toRad = function (deg) { return (deg * Math.PI) / 180; };
    var earthRadiusKm = 6371;
    var dLat = toRad(b.lat - a.lat);
    var dLng = toRad(b.lng - a.lng);
    var lat1 = toRad(a.lat);
    var lat2 = toRad(b.lat);
    var sinLat = Math.sin(dLat / 2);
    var sinLng = Math.sin(dLng / 2);
    var h = sinLat * sinLat +
        Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
    return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};
var hostPinIcon = new L.Icon({
    iconUrl: mealScoutIcon,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -30],
});
var hostPinActiveIcon = L.divIcon({
    className: "map-host-marker",
    html: "\n    <div class=\"map-host-marker__logo\">\n      <img src=\"".concat(mealScoutIcon, "\" alt=\"MealScout host\" />\n    </div>\n    <div class=\"map-host-marker__dot\" aria-hidden=\"true\"></div>\n  "),
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -30],
});
var foodPinIcon = new L.Icon({
    iconUrl: svgToDataUrl("\n    <svg width=\"34\" height=\"42\" viewBox=\"0 0 34 42\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n      <path d=\"M17 1C10.373 1 5 6.373 5 13c0 9.5 12 27 12 27s12-17.5 12-27C29 6.373 23.627 1 17 1z\" fill=\"#EF4444\" stroke=\"#991B1B\" stroke-width=\"1.5\"/>\n      <circle cx=\"17\" cy=\"13\" r=\"7\" fill=\"#FEF2F2\"/>\n    </svg>\n  "),
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -34],
});
var truckPinIcon = new L.Icon({
    iconUrl: svgToDataUrl("\n    <svg width=\"34\" height=\"42\" viewBox=\"0 0 34 42\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n      <path d=\"M17 1C10.373 1 5 6.373 5 13c0 9.5 12 27 12 27s12-17.5 12-27C29 6.373 23.627 1 17 1z\" fill=\"#2563EB\" stroke=\"#1D4ED8\" stroke-width=\"1.5\"/>\n      <circle cx=\"17\" cy=\"13\" r=\"7\" fill=\"#DBEAFE\"/>\n      <text x=\"17\" y=\"17\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"700\" fill=\"#1D4ED8\">T</text>\n    </svg>\n  "),
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -34],
});
var eventPinIcon = new L.Icon({
    iconUrl: svgToDataUrl("\n    <svg width=\"34\" height=\"42\" viewBox=\"0 0 34 42\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n      <path d=\"M17 1C10.373 1 5 6.373 5 13c0 9.5 12 27 12 27s12-17.5 12-27C29 6.373 23.627 1 17 1z\" fill=\"#8B5CF6\" stroke=\"#312E81\" stroke-width=\"1.5\"/>\n      <circle cx=\"17\" cy=\"13\" r=\"7\" fill=\"#F5F3FF\"/>\n      <text x=\"17\" y=\"17\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"700\" fill=\"#312E81\">E</text>\n    </svg>\n  "),
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -34],
});
var geoAdPinIcon = new L.Icon({
    iconUrl: svgToDataUrl("\n    <svg width=\"34\" height=\"42\" viewBox=\"0 0 34 42\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n      <path d=\"M17 1C10.373 1 5 6.373 5 13c0 9.5 12 27 12 27s12-17.5 12-27C29 6.373 23.627 1 17 1z\" fill=\"#14B8A6\" stroke=\"#0F766E\" stroke-width=\"1.5\"/>\n      <circle cx=\"17\" cy=\"13\" r=\"7\" fill=\"#ECFEFF\"/>\n      <text x=\"17\" y=\"17\" text-anchor=\"middle\" font-size=\"8\" font-weight=\"700\" fill=\"#0F766E\">AD</text>\n    </svg>\n  "),
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -34],
});
function geocodeAddress(address) {
    return __awaiter(this, void 0, void 0, function () {
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
    });
}
// Fallback: approximate location via IP for environments like in-app browsers
function ipGeolocationFallback() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("https://ipapi.co/json/")];
                case 1:
                    response = _b.sent();
                    if (!response.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _b.sent();
                    if (!data.latitude || !data.longitude)
                        return [2 /*return*/, null];
                    return [2 /*return*/, {
                            lat: parseFloat(data.latitude),
                            lng: parseFloat(data.longitude),
                            city: data.city || data.region,
                        }];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
export default function MapPage() {
    var _this = this;
    var _a;
    var _b = useState(null), userLocation = _b[0], setUserLocation = _b[1];
    var _c = useState({
        // Neutral default center (approximate center of continental US)
        lat: 39.8283,
        lng: -98.5795,
    }), mapCenter = _c[0], setMapCenter = _c[1];
    var _d = useState(false), showList = _d[0], setShowList = _d[1];
    var _e = useState(null), selectedDeal = _e[0], setSelectedDeal = _e[1];
    var _f = useState(false), isLocating = _f[0], setIsLocating = _f[1];
    var _g = useState(16), zoomLevel = _g[0], setZoomLevel = _g[1];
    var _h = useState(null), mapBounds = _h[0], setMapBounds = _h[1];
    var _j = useState(null), locationError = _j[0], setLocationError = _j[1];
    var _k = useState({}), hostCoords = _k[0], setHostCoords = _k[1];
    var _l = useState({}), eventCoords = _l[0], setEventCoords = _l[1];
    var _m = useState({}), parkingCoords = _m[0], setParkingCoords = _m[1];
    var geocodeInFlight = useRef(false);
    var _o = useState({}), geocodeCache = _o[0], setGeocodeCache = _o[1];
    var _p = useState({}), geocodeFailures = _p[0], setGeocodeFailures = _p[1];
    useEffect(function () {
        try {
            var cached = localStorage.getItem("mealscout_geocode_cache");
            if (cached) {
                setGeocodeCache(JSON.parse(cached));
            }
        }
        catch (_a) {
            // ignore localStorage issues
        }
        try {
            var failed = localStorage.getItem("mealscout_geocode_failures");
            if (failed) {
                setGeocodeFailures(JSON.parse(failed));
            }
        }
        catch (_b) {
            // ignore localStorage issues
        }
    }, []);
    useEffect(function () {
        try {
            localStorage.setItem("mealscout_geocode_cache", JSON.stringify(geocodeCache));
        }
        catch (_a) {
            // ignore localStorage issues
        }
    }, [geocodeCache]);
    useEffect(function () {
        try {
            localStorage.setItem("mealscout_geocode_failures", JSON.stringify(geocodeFailures));
        }
        catch (_a) {
            // ignore localStorage issues
        }
    }, [geocodeFailures]);
    // Get user location
    useEffect(function () {
        // Start from last known location if the user has previously shared it
        try {
            var stored = localStorage.getItem("mealscout_last_location");
            if (stored) {
                var parsed = JSON.parse(stored);
                if ((parsed === null || parsed === void 0 ? void 0 : parsed.lat) && (parsed === null || parsed === void 0 ? void 0 : parsed.lng)) {
                    var approx = { lat: parsed.lat, lng: parsed.lng };
                    setUserLocation(approx);
                    setMapCenter(approx);
                }
            }
        }
        catch (_a) {
            // ignore localStorage issues
        }
        if (navigator.geolocation) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(function (position) { return __awaiter(_this, void 0, void 0, function () {
                var location;
                return __generator(this, function (_a) {
                    location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserLocation(location);
                    setMapCenter(location);
                    try {
                        localStorage.setItem("mealscout_last_location", JSON.stringify(location));
                    }
                    catch (_b) {
                        // ignore localStorage issues
                    }
                    setIsLocating(false);
                    setLocationError(null);
                    return [2 /*return*/];
                });
            }); }, function (error) { return __awaiter(_this, void 0, void 0, function () {
                var ipLocation, approx;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log("Location error:", error);
                            // Try a softer message and approximate IP-based fallback
                            setLocationError("Couldn't get precise GPS, showing an approximate area instead.");
                            return [4 /*yield*/, ipGeolocationFallback()];
                        case 1:
                            ipLocation = _a.sent();
                            if (ipLocation) {
                                approx = { lat: ipLocation.lat, lng: ipLocation.lng };
                                setUserLocation(approx);
                                setMapCenter(approx);
                                try {
                                    localStorage.setItem("mealscout_last_location", JSON.stringify(approx));
                                }
                                catch (_b) {
                                    // ignore localStorage issues
                                }
                            }
                            setIsLocating(false);
                            return [2 /*return*/];
                    }
                });
            }); }, { enableHighAccuracy: true, timeout: 10000 });
        }
    }, []);
    // Fetch nearby deals based on user location
    var _q = useQuery({
        queryKey: userLocation
            ? ["/api/deals/nearby", userLocation.lat, userLocation.lng]
            : ["/api/deals/featured"],
        queryFn: userLocation
            ? function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fetch("/api/deals/nearby/".concat(userLocation.lat, "/").concat(userLocation.lng))];
                        case 1:
                            response = _a.sent();
                            if (!response.ok)
                                throw new Error("Failed to fetch nearby deals");
                            return [2 /*return*/, response.json()];
                    }
                });
            }); }
            : undefined,
        enabled: !!userLocation,
    }), _r = _q.data, dealsData = _r === void 0 ? [] : _r, isLoading = _q.isLoading;
    var deals = Array.isArray(dealsData) ? dealsData : [];
    var _s = useQuery({
        queryKey: userLocation
            ? ["/api/trucks/live", userLocation.lat, userLocation.lng]
            : ["live-trucks", "none"],
        queryFn: userLocation
            ? function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fetch("/api/trucks/live?lat=".concat(userLocation.lat, "&lng=").concat(userLocation.lng, "&radiusKm=5"))];
                        case 1:
                            response = _a.sent();
                            if (!response.ok)
                                throw new Error("Failed to fetch live trucks");
                            return [2 /*return*/, response.json()];
                    }
                });
            }); }
            : undefined,
        enabled: !!userLocation,
        staleTime: 30 * 1000,
    }).data, liveTrucksData = _s === void 0 ? [] : _s;
    var liveTrucks = Array.isArray(liveTrucksData) ? liveTrucksData : [];
    var adLocation = userLocation || mapCenter;
    var _t = useQuery({
        queryKey: ["/api/geo-ads", "map", adLocation === null || adLocation === void 0 ? void 0 : adLocation.lat, adLocation === null || adLocation === void 0 ? void 0 : adLocation.lng],
        enabled: !!adLocation,
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!adLocation)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, fetch("/api/geo-ads?placement=map&lat=".concat(adLocation.lat, "&lng=").concat(adLocation.lng, "&limit=10"), { credentials: "include" })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            return [2 /*return*/, []];
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
    }).data, geoAds = _t === void 0 ? [] : _t;
    useEffect(function () {
        if (!adLocation)
            return;
        sendGeoPing({ lat: adLocation.lat, lng: adLocation.lng, source: "map" });
    }, [adLocation === null || adLocation === void 0 ? void 0 : adLocation.lat, adLocation === null || adLocation === void 0 ? void 0 : adLocation.lng]);
    useEffect(function () {
        if (!geoAds.length)
            return;
        geoAds.forEach(function (ad) {
            return trackGeoAdImpression({ adId: ad.id, placement: "map" });
        });
    }, [geoAds]);
    var truckCoords = useMemo(function () {
        return liveTrucks
            .map(function (truck) {
            var lat = toNumberOrNull(truck.currentLatitude);
            var lng = toNumberOrNull(truck.currentLongitude);
            if (lat === null || lng === null)
                return null;
            return { id: truck.id, lat: lat, lng: lng };
        })
            .filter(Boolean);
    }, [liveTrucks]);
    var visibleDeals = useMemo(function () {
        if (!mapBounds)
            return deals;
        return deals.filter(function (deal) {
            var _a, _b;
            var lat = toNumberOrNull((_a = deal.restaurant) === null || _a === void 0 ? void 0 : _a.latitude);
            var lng = toNumberOrNull((_b = deal.restaurant) === null || _b === void 0 ? void 0 : _b.longitude);
            if (lat === null || lng === null)
                return false;
            return mapBounds.contains([lat, lng]);
        });
    }, [deals, mapBounds]);
    var visibleGeoAds = useMemo(function () {
        if (!mapBounds)
            return geoAds;
        return geoAds.filter(function (ad) {
            var _a, _b;
            var lat = (_a = ad.pinLat) !== null && _a !== void 0 ? _a : null;
            var lng = (_b = ad.pinLng) !== null && _b !== void 0 ? _b : null;
            if (lat === null || lng === null)
                return false;
            return mapBounds.contains([lat, lng]);
        });
    }, [geoAds, mapBounds]);
    var visibleLiveTrucks = useMemo(function () {
        if (!mapBounds)
            return liveTrucks;
        return liveTrucks.filter(function (truck) {
            var lat = toNumberOrNull(truck.currentLatitude);
            var lng = toNumberOrNull(truck.currentLongitude);
            if (lat === null || lng === null)
                return false;
            return mapBounds.contains([lat, lng]);
        });
    }, [liveTrucks, mapBounds]);
    var hostedRadiusKm = 0.12;
    var liveTruckById = useMemo(function () {
        return new Map(liveTrucks.map(function (truck) { return [truck.id, truck]; }));
    }, [liveTrucks]);
    var findNearbyTruck = function (coords, radiusKm) {
        if (radiusKm === void 0) { radiusKm = hostedRadiusKm; }
        var nearest = null;
        for (var _i = 0, truckCoords_1 = truckCoords; _i < truckCoords_1.length; _i++) {
            var truck = truckCoords_1[_i];
            var distance = haversineKm(coords, { lat: truck.lat, lng: truck.lng });
            if (distance > radiusKm)
                continue;
            var truckData = liveTruckById.get(truck.id);
            if (!truckData)
                continue;
            if (!nearest || distance < nearest.distance) {
                nearest = { truck: truckData, distance: distance };
            }
        }
        return nearest;
    };
    var resolveHostCoords = function (host) {
        var _a;
        var lat = toNumberOrNull(host.latitude);
        var lng = toNumberOrNull(host.longitude);
        if (lat !== null && lng !== null) {
            return { lat: lat, lng: lng };
        }
        return (_a = hostCoords[host.id]) !== null && _a !== void 0 ? _a : null;
    };
    var resolveEventCoords = function (event) {
        var _a;
        var lat = toNumberOrNull(event.hostLatitude);
        var lng = toNumberOrNull(event.hostLongitude);
        if (lat !== null && lng !== null) {
            return { lat: lat, lng: lng };
        }
        return (_a = eventCoords[event.id]) !== null && _a !== void 0 ? _a : null;
    };
    var resolveParkingCoords = function (event) {
        var _a, _b, _c;
        var lat = toNumberOrNull((_a = event.host) === null || _a === void 0 ? void 0 : _a.latitude);
        var lng = toNumberOrNull((_b = event.host) === null || _b === void 0 ? void 0 : _b.longitude);
        if (lat !== null && lng !== null) {
            return { lat: lat, lng: lng };
        }
        return (_c = parkingCoords[event.id]) !== null && _c !== void 0 ? _c : null;
    };
    var formatDistance = function (coords) {
        if (!userLocation)
            return null;
        var distanceKm = haversineKm(userLocation, coords);
        if (distanceKm < 1) {
            return "".concat(Math.round(distanceKm * 1000), " m");
        }
        return "".concat(distanceKm.toFixed(1), " km");
    };
    var formatSlotType = function (slot) {
        if (!slot)
            return null;
        return slot.charAt(0).toUpperCase() + slot.slice(1);
    };
    var handleGeoAdClick = function (ad) {
        trackGeoAdEvent({ adId: ad.id, eventType: "click", placement: "map" });
        window.open(ad.targetUrl, "_blank", "noopener,noreferrer");
    };
    // Fetch host + event locations for map
    var mapLocations = useQuery({
        queryKey: ["/api/map/locations"],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/map/locations")];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error("Failed to load map locations");
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        staleTime: 5 * 60 * 1000,
    }).data;
    var _u = useQuery({
        queryKey: ["/api/parking-pass"],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/parking-pass")];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error("Failed to load parking pass listings");
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        staleTime: 2 * 60 * 1000,
    }).data, parkingPassLocations = _u === void 0 ? [] : _u;
    var uniqueParkingPassLocations = useMemo(function () {
        var byHost = new Map();
        var sorted = __spreadArray([], parkingPassLocations, true).sort(function (a, b) { return new Date(a.date).getTime() - new Date(b.date).getTime(); });
        sorted.forEach(function (event) {
            var _a, _b;
            var key = ((_a = event.host) === null || _a === void 0 ? void 0 : _a.id) || ((_b = event.host) === null || _b === void 0 ? void 0 : _b.address) || event.id;
            if (!byHost.has(key)) {
                byHost.set(key, event);
            }
        });
        return Array.from(byHost.values());
    }, [parkingPassLocations]);
    var visibleHostLocations = useMemo(function () {
        var _a;
        if (!mapBounds || !((_a = mapLocations === null || mapLocations === void 0 ? void 0 : mapLocations.hostLocations) === null || _a === void 0 ? void 0 : _a.length))
            return [];
        return mapLocations.hostLocations.filter(function (host) {
            var coords = resolveHostCoords(host);
            if (!coords)
                return false;
            return mapBounds.contains([coords.lat, coords.lng]);
        });
    }, [mapLocations, hostCoords, mapBounds]);
    var visibleEventLocations = useMemo(function () {
        var _a;
        if (!mapBounds || !((_a = mapLocations === null || mapLocations === void 0 ? void 0 : mapLocations.eventLocations) === null || _a === void 0 ? void 0 : _a.length))
            return [];
        return mapLocations.eventLocations.filter(function (event) {
            var coords = resolveEventCoords(event);
            if (!coords)
                return false;
            return mapBounds.contains([coords.lat, coords.lng]);
        });
    }, [mapLocations, eventCoords, mapBounds]);
    var visibleParkingLocations = useMemo(function () {
        if (!mapBounds || !uniqueParkingPassLocations.length)
            return [];
        return uniqueParkingPassLocations.filter(function (event) {
            var coords = resolveParkingCoords(event);
            if (!coords)
                return false;
            return mapBounds.contains([coords.lat, coords.lng]);
        });
    }, [uniqueParkingPassLocations, parkingCoords, mapBounds]);
    var hostedTruckIds = useMemo(function () {
        var ids = new Set();
        visibleHostLocations.forEach(function (host) {
            var coords = resolveHostCoords(host);
            if (!coords)
                return;
            var nearby = findNearbyTruck(coords);
            if (nearby)
                ids.add(nearby.truck.id);
        });
        visibleParkingLocations.forEach(function (event) {
            var coords = resolveParkingCoords(event);
            if (!coords)
                return;
            var nearby = findNearbyTruck(coords);
            if (nearby)
                ids.add(nearby.truck.id);
        });
        visibleEventLocations.forEach(function (event) {
            var coords = resolveEventCoords(event);
            if (!coords)
                return;
            var nearby = findNearbyTruck(coords);
            if (nearby)
                ids.add(nearby.truck.id);
        });
        return ids;
    }, [
        visibleHostLocations,
        visibleParkingLocations,
        visibleEventLocations,
        resolveHostCoords,
        resolveParkingCoords,
        resolveEventCoords,
        findNearbyTruck,
    ]);
    var visibleUnhostedTrucks = useMemo(function () {
        return visibleLiveTrucks.filter(function (truck) { return !hostedTruckIds.has(truck.id); });
    }, [visibleLiveTrucks, hostedTruckIds]);
    useEffect(function () {
        var _a, _b;
        if (!((_a = mapLocations === null || mapLocations === void 0 ? void 0 : mapLocations.hostLocations) === null || _a === void 0 ? void 0 : _a.length) &&
            !((_b = mapLocations === null || mapLocations === void 0 ? void 0 : mapLocations.eventLocations) === null || _b === void 0 ? void 0 : _b.length)) {
            return;
        }
        var nextHosts = {};
        mapLocations === null || mapLocations === void 0 ? void 0 : mapLocations.hostLocations.forEach(function (host) {
            var lat = toNumberOrNull(host.latitude);
            var lng = toNumberOrNull(host.longitude);
            if (lat !== null && lng !== null) {
                nextHosts[host.id] = { lat: lat, lng: lng };
            }
        });
        var nextEvents = {};
        mapLocations === null || mapLocations === void 0 ? void 0 : mapLocations.eventLocations.forEach(function (event) {
            var lat = toNumberOrNull(event.hostLatitude);
            var lng = toNumberOrNull(event.hostLongitude);
            if (lat !== null && lng !== null) {
                nextEvents[event.id] = { lat: lat, lng: lng };
            }
        });
        if (Object.keys(nextHosts).length) {
            setHostCoords(function (prev) { return (__assign(__assign({}, prev), nextHosts)); });
        }
        if (Object.keys(nextEvents).length) {
            setEventCoords(function (prev) { return (__assign(__assign({}, prev), nextEvents)); });
        }
    }, [mapLocations]);
    useEffect(function () {
        if (!uniqueParkingPassLocations.length)
            return;
        var nextParking = {};
        uniqueParkingPassLocations.forEach(function (event) {
            var _a, _b;
            var lat = toNumberOrNull((_a = event.host) === null || _a === void 0 ? void 0 : _a.latitude);
            var lng = toNumberOrNull((_b = event.host) === null || _b === void 0 ? void 0 : _b.longitude);
            if (lat !== null && lng !== null) {
                nextParking[event.id] = { lat: lat, lng: lng };
            }
        });
        if (Object.keys(nextParking).length) {
            setParkingCoords(function (prev) { return (__assign(__assign({}, prev), nextParking)); });
        }
    }, [uniqueParkingPassLocations]);
    // Build a geocoding work list for any host/event without coordinates yet
    useEffect(function () {
        if (!mapBounds || zoomLevel < 12) {
            return;
        }
        if (geocodeInFlight.current) {
            return;
        }
        var queue = [];
        var addressByKey = {};
        var now = Date.now();
        var failureCooldownMs = 6 * 60 * 60 * 1000;
        var maxQueue = zoomLevel >= 16 ? 25 : 10;
        mapLocations === null || mapLocations === void 0 ? void 0 : mapLocations.hostLocations.forEach(function (host) {
            var lat = toNumberOrNull(host.latitude);
            var lng = toNumberOrNull(host.longitude);
            if (lat !== null && lng !== null) {
                return;
            }
            if (!hostCoords[host.id]) {
                queue.push("host:".concat(host.id));
                addressByKey["host:".concat(host.id)] = buildFullAddress(host.address, host.city, host.state);
            }
        });
        mapLocations === null || mapLocations === void 0 ? void 0 : mapLocations.eventLocations.forEach(function (event) {
            var lat = toNumberOrNull(event.hostLatitude);
            var lng = toNumberOrNull(event.hostLongitude);
            if (lat !== null && lng !== null) {
                return;
            }
            if (!eventCoords[event.id] && event.hostAddress) {
                queue.push("event:".concat(event.id));
                addressByKey["event:".concat(event.id)] = buildFullAddress(event.hostAddress, event.hostCity, event.hostState);
            }
        });
        uniqueParkingPassLocations.forEach(function (event) {
            var _a, _b, _c;
            var lat = toNumberOrNull((_a = event.host) === null || _a === void 0 ? void 0 : _a.latitude);
            var lng = toNumberOrNull((_b = event.host) === null || _b === void 0 ? void 0 : _b.longitude);
            if (lat !== null && lng !== null) {
                return;
            }
            if (!parkingCoords[event.id] && ((_c = event.host) === null || _c === void 0 ? void 0 : _c.address)) {
                queue.push("parking:".concat(event.id));
                addressByKey["parking:".concat(event.id)] = buildFullAddress(event.host.address, event.host.city, event.host.state);
            }
        });
        if (queue.length) {
            var limitedQueue_1 = queue.slice(0, maxQueue);
            geocodeInFlight.current = true;
            (function () { return __awaiter(_this, void 0, void 0, function () {
                var newHostCoords_1, newEventCoords_1, newParkingCoords_1, newFailures_1, _loop_1, _i, limitedQueue_2, key;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, , 5, 6]);
                            newHostCoords_1 = {};
                            newEventCoords_1 = {};
                            newParkingCoords_1 = {};
                            newFailures_1 = {};
                            _loop_1 = function (key) {
                                var address, cached, point_1, failed, point;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            address = addressByKey[key];
                                            if (!address)
                                                return [2 /*return*/, "continue"];
                                            cached = geocodeCache[address];
                                            if (cached) {
                                                point_1 = { lat: cached.lat, lng: cached.lng };
                                                if (key.startsWith("host:")) {
                                                    newHostCoords_1[key.replace("host:", "")] = point_1;
                                                }
                                                else if (key.startsWith("event:")) {
                                                    newEventCoords_1[key.replace("event:", "")] = point_1;
                                                }
                                                else if (key.startsWith("parking:")) {
                                                    newParkingCoords_1[key.replace("parking:", "")] = point_1;
                                                }
                                                return [2 /*return*/, "continue"];
                                            }
                                            failed = geocodeFailures[address];
                                            if (failed && now - failed.ts < failureCooldownMs) {
                                                return [2 /*return*/, "continue"];
                                            }
                                            return [4 /*yield*/, geocodeAddress(address).catch(function () { return null; })];
                                        case 1:
                                            point = _b.sent();
                                            if (!point) {
                                                newFailures_1[address] = { ts: Date.now() };
                                                return [2 /*return*/, "continue"];
                                            }
                                            if (key.startsWith("host:")) {
                                                newHostCoords_1[key.replace("host:", "")] = point;
                                            }
                                            else if (key.startsWith("event:")) {
                                                newEventCoords_1[key.replace("event:", "")] = point;
                                            }
                                            else if (key.startsWith("parking:")) {
                                                newParkingCoords_1[key.replace("parking:", "")] = point;
                                            }
                                            setGeocodeCache(function (prev) {
                                                var _a;
                                                return (__assign(__assign({}, prev), (_a = {}, _a[address] = { lat: point.lat, lng: point.lng, ts: Date.now() }, _a)));
                                            });
                                            // small delay to avoid hammering the free geocoder
                                            return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 300); })];
                                        case 2:
                                            // small delay to avoid hammering the free geocoder
                                            _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            };
                            _i = 0, limitedQueue_2 = limitedQueue_1;
                            _a.label = 1;
                        case 1:
                            if (!(_i < limitedQueue_2.length)) return [3 /*break*/, 4];
                            key = limitedQueue_2[_i];
                            return [5 /*yield**/, _loop_1(key)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4:
                            if (Object.keys(newHostCoords_1).length) {
                                setHostCoords(function (prev) { return (__assign(__assign({}, prev), newHostCoords_1)); });
                            }
                            if (Object.keys(newEventCoords_1).length) {
                                setEventCoords(function (prev) { return (__assign(__assign({}, prev), newEventCoords_1)); });
                            }
                            if (Object.keys(newParkingCoords_1).length) {
                                setParkingCoords(function (prev) { return (__assign(__assign({}, prev), newParkingCoords_1)); });
                            }
                            if (Object.keys(newFailures_1).length) {
                                setGeocodeFailures(function (prev) { return (__assign(__assign({}, prev), newFailures_1)); });
                            }
                            return [3 /*break*/, 6];
                        case 5:
                            geocodeInFlight.current = false;
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            }); })();
        }
    }, [
        mapLocations,
        uniqueParkingPassLocations,
        hostCoords,
        eventCoords,
        parkingCoords,
        geocodeCache,
        geocodeFailures,
        mapBounds,
        zoomLevel,
    ]);
    var handleCenterOnUser = function () {
        if (userLocation) {
            setMapCenter(userLocation);
        }
    };
    var handleDealClick = function (deal) {
        setSelectedDeal(deal);
        if (deal.restaurant) {
            setMapCenter({
                lat: deal.restaurant.latitude,
                lng: deal.restaurant.longitude,
            });
        }
    };
    var handleZoomIn = function () {
        setZoomLevel(function (prev) { return Math.min(prev + 1, 18); });
    };
    var handleZoomOut = function () {
        setZoomLevel(function (prev) { return Math.max(prev - 1, 1); });
    };
    var hasLocation = !!userLocation;
    var liveTruckPins = visibleLiveTrucks.length;
    var hostPins = visibleHostLocations.length;
    var eventPins = visibleEventLocations.length;
    var parkingPins = visibleParkingLocations.length;
    var activityPins = liveTruckPins + hostPins + eventPins + parkingPins;
    var headerSubtitle = isLocating
        ? "Locating live trucks and host spots..."
        : hasLocation && activityPins > 0
            ? "Live trucks and host locations nearby"
            : hasLocation
                ? "No live trucks or hosts nearby right now"
                : "Set your location to see live trucks and hosts.";
    return (<div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      <SEOHead title="Map View - MealScout | Find Deals Near You" description="Explore food deals on an interactive map. See nearby restaurants, view deal locations, and discover dining discounts in your area. Find the perfect meal deal near you!" keywords="map view, nearby deals, restaurant map, food deals location, nearby restaurants, local deals map" canonicalUrl="https://mealscout.us/map"/>
      {/* Header */}
      <header className="px-6 py-5 bg-white/90 backdrop-blur border-b border-border relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
              <img src={mealScoutIcon} alt="MealScout" className="w-7 h-7"/>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                MealScout Map
              </h1>
              <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={function () { return setShowList(!showList); }} data-testid="button-toggle-list">
              <List className="w-4 h-4"/>
            </Button>
          </div>
        </div>

        {/* Location Status */}
        {locationError && (<div className="text-xs text-red-600 mb-4 bg-red-50 border border-red-200 rounded p-2">
            ⚠️ {locationError}
          </div>)}
        {userLocation && (<div className="text-xs text-muted-foreground mb-4">
            📍 Located: {userLocation.lat.toFixed(4)},{" "}
            {userLocation.lng.toFixed(4)}
            {liveTruckPins > 0 &&
                " \u2022 ".concat(liveTruckPins, " truck").concat(liveTruckPins === 1 ? "" : "s", " nearby")}
          </div>)}
      </header>

      {/* Map Container */}
      <div className="relative flex-1">
        <div className="relative h-[60vh] min-h-[320px]">
          {mapCenter && (<MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={zoomLevel} preferCanvas style={{ height: "100%", width: "100%" }} className="rounded-lg overflow-hidden">
              <MapCenterer center={mapCenter}/>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"/>

              {/* User Location Marker */}
              {userLocation && (<Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
                  <Popup>
                    <div className="text-center rounded-xl bg-slate-900 text-white px-3 py-2 shadow-lg">
                      <div className="text-xs uppercase tracking-wide text-slate-300">
                        MealScout
                      </div>
                      <div className="font-semibold text-sm">You are here</div>
                    </div>
                  </Popup>
                </Marker>)}

              {/* Geo Ad Markers */}
              {visibleGeoAds.map(function (ad) {
                var _a, _b;
                return (<Marker key={ad.id} position={[(_a = ad.pinLat) !== null && _a !== void 0 ? _a : mapCenter.lat, (_b = ad.pinLng) !== null && _b !== void 0 ? _b : mapCenter.lng]} icon={geoAdPinIcon}>
                  <Popup>
                    <div className="min-w-52 rounded-xl bg-white text-slate-900 p-3 shadow-lg space-y-1">
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">
                        Sponsored
                      </div>
                      <div className="font-semibold text-sm">{ad.title}</div>
                      {ad.body && (<div className="text-xs text-slate-500">{ad.body}</div>)}
                      <Button size="sm" className="w-full mt-2" onClick={function () { return handleGeoAdClick(ad); }}>
                        {ad.ctaText || "Learn more"}
                      </Button>
                    </div>
                  </Popup>
                </Marker>);
            })}

              {/* Deal Markers */}
              {visibleDeals.map(function (deal) {
                if (!deal.restaurant)
                    return null;
                return (<Marker key={deal.id} position={[
                        deal.restaurant.latitude,
                        deal.restaurant.longitude,
                    ]} icon={foodPinIcon} eventHandlers={{
                        click: function () { return handleDealClick(deal); },
                    }}>
                    <Popup>
                      <div className="min-w-52 rounded-xl bg-white text-slate-900 p-3 shadow-lg space-y-1">
                        <div className="font-semibold text-sm">
                          {deal.restaurant.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Deal available
                        </div>
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="font-semibold text-amber-600">
                            {deal.discountValue}% OFF
                          </span>
                          <span className="text-slate-500">
                            Min ${deal.minOrderAmount}
                          </span>
                        </div>
                        <Button size="sm" className="w-full mt-2" onClick={function () { return handleDealClick(deal); }}>
                          View deal
                        </Button>
                      </div>
                    </Popup>
                  </Marker>);
            })}

              {/* Live Truck Markers */}
              {visibleUnhostedTrucks.map(function (truck) {
                var lat = toNumberOrNull(truck.currentLatitude);
                var lng = toNumberOrNull(truck.currentLongitude);
                if (!lat || !lng)
                    return null;
                var distanceLabel = formatDistance({ lat: lat, lng: lng });
                return (<Marker key={"live-".concat(truck.id)} position={[lat, lng]} icon={truckPinIcon}>
                    <Popup>
                      <div className="min-w-52 rounded-xl bg-white text-slate-900 p-3 shadow-lg space-y-1">
                        <div className="font-semibold text-sm">
                          {truck.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Food Truck • Live now
                        </div>
                        {distanceLabel && (<div className="text-xs text-slate-500">
                            {distanceLabel} away
                          </div>)}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button size="sm" className="w-full" onClick={function () {
                        window.location.href = "/restaurant/".concat(truck.id);
                    }}>
                            View menu
                          </Button>
                          <Button size="sm" variant="outline" className="w-full" onClick={function () {
                        window.open("https://maps.google.com/?q=".concat(lat, ",").concat(lng), "_blank");
                    }}>
                            Directions
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>);
            })}

              {/* Host Location Markers (open requests) */}
              {visibleHostLocations.map(function (host) {
                var coords = resolveHostCoords(host);
                if (!coords)
                    return null;
                var hostedTruck = findNearbyTruck(coords);
                var title = hostedTruck ? hostedTruck.truck.name : host.name;
                var subtitle = hostedTruck
                    ? "At ".concat(host.name)
                    : "Hosts food trucks";
                var distanceLabel = formatDistance(coords);
                return (<Marker key={"host-".concat(host.id)} position={[coords.lat, coords.lng]} icon={hostedTruck ? hostPinActiveIcon : hostPinIcon}>
                    <Popup>
                      <div className="min-w-56 space-y-1 rounded-xl bg-white text-slate-900 p-3 shadow-lg">
                        <div className="font-semibold text-sm">{title}</div>
                        <div className="text-xs text-slate-500">{subtitle}</div>
                        <div className="text-xs text-slate-500">
                          {host.address}
                        </div>
                        {distanceLabel && (<div className="text-xs text-slate-500">
                            {distanceLabel} away
                          </div>)}
                        {hostedTruck ? (<div className="grid grid-cols-2 gap-2 pt-2">
                            <Button size="sm" className="w-full" onClick={function () {
                            window.location.href = "/restaurant/".concat(hostedTruck.truck.id);
                        }}>
                              View menu
                            </Button>
                            <Button size="sm" variant="outline" className="w-full" onClick={function () {
                            window.open("https://maps.google.com/?q=".concat(coords.lat, ",").concat(coords.lng), "_blank");
                        }}>
                              Directions
                            </Button>
                          </div>) : (<div className="pt-2">
                            <Button size="sm" className="w-full" onClick={function () {
                            window.open("https://maps.google.com/?q=".concat(coords.lat, ",").concat(coords.lng), "_blank");
                        }}>
                              Directions
                            </Button>
                          </div>)}
                      </div>
                    </Popup>
                  </Marker>);
            })}

              {/* Event Markers */}
              {visibleEventLocations.map(function (event) {
                var coords = resolveEventCoords(event);
                if (!coords)
                    return null;
                var title = event.name;
                var subtitle = event.hostName
                    ? "Event at ".concat(event.hostName)
                    : "Event location";
                var distanceLabel = formatDistance(coords);
                return (<Marker key={"event-".concat(event.id)} position={[coords.lat, coords.lng]} icon={eventPinIcon}>
                    <Popup>
                      <div className="min-w-56 space-y-1 rounded-xl bg-white text-slate-900 p-3 shadow-lg">
                        <div className="font-semibold text-sm">{title}</div>
                        <div className="text-xs text-slate-500">{subtitle}</div>
                        {event.hostAddress && (<div className="text-xs text-slate-500">
                            {event.hostAddress}
                          </div>)}
                        <div className="text-xs text-slate-500">
                          {new Date(event.date).toLocaleDateString()} •{" "}
                          {event.startTime} - {event.endTime}
                        </div>
                        {distanceLabel && (<div className="text-xs text-slate-500">
                            {distanceLabel} away
                          </div>)}
                        <div className="pt-2">
                          <Button size="sm" className="w-full" onClick={function () {
                        window.open("https://maps.google.com/?q=".concat(coords.lat, ",").concat(coords.lng), "_blank");
                    }}>
                            Directions
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>);
            })}

              {/* Parking Pass Markers */}
              {visibleParkingLocations.map(function (event) {
                var _a, _b;
                var coords = resolveParkingCoords(event);
                if (!coords)
                    return null;
                var hostedTruck = findNearbyTruck(coords);
                var hostName = ((_a = event.host) === null || _a === void 0 ? void 0 : _a.businessName) || "Host location";
                var title = hostedTruck ? hostedTruck.truck.name : hostName;
                var subtitle = hostedTruck ? "At ".concat(hostName) : "Hosts food trucks";
                var distanceLabel = formatDistance(coords);
                var bookings = Array.isArray(event.bookings)
                    ? event.bookings
                    : [];
                var bookingPreview = bookings.slice(0, 3);
                return (<Marker key={"parking-".concat(event.id)} position={[coords.lat, coords.lng]} icon={parkingPassPinIcon}>
                    <Popup>
                      <div className="min-w-56 space-y-1 rounded-xl bg-white text-slate-900 p-3 shadow-lg">
                        <div className="font-semibold text-sm">{title}</div>
                        <div className="text-xs text-slate-500">{subtitle}</div>
                        {((_b = event.host) === null || _b === void 0 ? void 0 : _b.address) && (<div className="text-xs text-slate-500">
                            {event.host.address}
                          </div>)}
                        <div className="text-xs text-slate-500">
                          {new Date(event.date).toLocaleDateString()} •{" "}
                          {event.startTime === "00:00" &&
                        event.endTime === "23:59"
                        ? "Any time"
                        : "".concat(event.startTime, " - ").concat(event.endTime)}
                        </div>
                        {distanceLabel && (<div className="text-xs text-slate-500">
                            {distanceLabel} away
                          </div>)}
                        {bookings.length > 0 ? (<div className="pt-1 text-xs text-slate-500">
                            <div className="font-semibold text-slate-700">
                              Scheduled trucks
                            </div>
                            <div className="space-y-1 mt-1">
                              {bookingPreview.map(function (booking) {
                            var slotLabel = formatSlotType(booking.slotType);
                            var spotLabel = booking.spotNumber
                                ? "Spot ".concat(booking.spotNumber)
                                : null;
                            return (<div key={"".concat(booking.truckId, "-").concat(booking.slotType || "slot")}>
                                    {booking.truckName}
                                    {slotLabel ? " \u00B7 ".concat(slotLabel) : ""}
                                    {spotLabel ? " \u00B7 ".concat(spotLabel) : ""}
                                  </div>);
                        })}
                              {bookings.length > 3 && (<div className="text-[11px] text-slate-400">
                                  +{bookings.length - 3} more
                                </div>)}
                            </div>
                          </div>) : (<div className="text-xs text-slate-500 pt-1">
                            No bookings yet
                          </div>)}
                        {hostedTruck ? (<div className="grid grid-cols-2 gap-2 pt-2">
                            <Button size="sm" className="w-full" onClick={function () {
                            window.location.href = "/restaurant/".concat(hostedTruck.truck.id);
                        }}>
                              View menu
                            </Button>
                            <Button size="sm" variant="outline" className="w-full" onClick={function () {
                            window.open("https://maps.google.com/?q=".concat(coords.lat, ",").concat(coords.lng), "_blank");
                        }}>
                              Directions
                            </Button>
                          </div>) : (<div className="pt-2">
                            <Button size="sm" className="w-full" onClick={function () {
                            window.open("https://maps.google.com/?q=".concat(coords.lat, ",").concat(coords.lng), "_blank");
                        }}>
                              Directions
                            </Button>
                          </div>)}
                      </div>
                    </Popup>
                  </Marker>);
            })}

              {/* Map Controls */}
              <MapControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onCenterUser={handleCenterOnUser} userLocation={userLocation} zoomLevel={zoomLevel}/>
              <MapViewportWatcher onZoomChange={setZoomLevel} onBoundsChange={setMapBounds}/>
            </MapContainer>)}

          {/* Empty map overlay messaging */}
          {!isLoading && !isLocating && deals.length === 0 && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-background/90 rounded-xl px-4 py-3 text-center shadow-sm max-w-xs">
                <p className="text-sm font-medium text-foreground mb-1">
                  {hasLocation
                ? "No trucks nearby right now"
                : "Set your location to see trucks nearby"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hasLocation
                ? "Try moving the map or check back later."
                : "Use your location or move the map to explore different areas."}
                </p>
              </div>
            </div>)}
        </div>

        {/* Selected Deal Info Card */}
        {selectedDeal && (<Card className="absolute bottom-4 left-4 right-4 z-20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-sm">
                    {selectedDeal.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {(_a = selectedDeal.restaurant) === null || _a === void 0 ? void 0 : _a.name}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={function () { return setSelectedDeal(null); }} className="p-1 h-6 w-6" data-testid="button-close-selected-deal">
                  <X className="w-3 h-3"/>
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-primary font-bold text-sm">
                    {selectedDeal.discountValue}% OFF
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Min: ${selectedDeal.minOrderAmount}
                  </span>
                </div>
                <Button size="sm" data-testid="button-view-deal">
                  View Deal
                </Button>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* List View Overlay */}
      {showList && (<div className="absolute inset-0 bg-white z-40 overflow-y-auto">
          <header className="px-6 py-6 bg-white border-b border-border sticky top-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                Nearby Deals
              </h2>
              <Button variant="ghost" size="sm" onClick={function () { return setShowList(false); }} data-testid="button-close-list">
                <X className="w-4 h-4"/>
              </Button>
            </div>
          </header>

          <div className="px-6 py-4">
            {isLoading ? (<div className="space-y-4">
                {[1, 2, 3].map(function (i) { return (<div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-md">
                    <div className="w-full h-48 bg-muted"></div>
                    <div className="p-6 space-y-3">
                      <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                      <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                    </div>
                  </div>); })}
              </div>) : deals.length > 0 ? (<div className="space-y-4">
                {deals.map(function (deal) { return (<div key={deal.id} onClick={function () { return handleDealClick(deal); }}>
                    <DealCard deal={deal}/>
                  </div>); })}
              </div>) : (<div className="text-center py-12">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No deals nearby
                </h3>
                <p className="text-muted-foreground">
                  Try expanding your search area or check back later.
                </p>
              </div>)}
          </div>
        </div>)}

      <Navigation />
    </div>);
}
