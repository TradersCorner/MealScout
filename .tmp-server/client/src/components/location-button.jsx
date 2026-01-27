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
import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, CheckCircle, XCircle, RefreshCw, Home, MapPinIcon, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getReverseGeocodedLocationName } from "@/utils/locationUtils";
export default function LocationButton(_a) {
    var _this = this;
    var onLocationUpdate = _a.onLocationUpdate, onLocationNameUpdate = _a.onLocationNameUpdate, onLocationError = _a.onLocationError, onShowManualInput = _a.onShowManualInput, _b = _a.isLoading, externalLoading = _b === void 0 ? false : _b, className = _a.className, _c = _a.size, size = _c === void 0 ? "default" : _c, _d = _a.variant, variant = _d === void 0 ? "default" : _d;
    var isAuthenticated = useAuth().isAuthenticated;
    var _e = useState(false), internalLoading = _e[0], setInternalLoading = _e[1];
    var _f = useState("idle"), status = _f[0], setStatus = _f[1];
    var _g = useState(null), lastUpdateTime = _g[0], setLastUpdateTime = _g[1];
    var _h = useState(false), showLocationOptions = _h[0], setShowLocationOptions = _h[1];
    var statusRef = useRef(status);
    var mountedRef = useRef(true);
    var timeoutRef = useRef(null);
    var inFlightRef = useRef(false);
    var abortControllerRef = useRef(null);
    var lastCoordsRef = useRef(null);
    // Fetch user addresses if authenticated
    var _j = useQuery({
        queryKey: ["/api/user/addresses"],
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
    }).data, userAddresses = _j === void 0 ? [] : _j;
    // Keep refs in sync with state
    statusRef.current = status;
    // Cleanup on unmount
    useEffect(function () {
        return function () {
            mountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    var isLoading = internalLoading;
    var detectPlatform = function () {
        var userAgent = navigator.userAgent.toLowerCase();
        var isWindows = userAgent.includes("windows");
        var isAndroid = userAgent.includes("android");
        var isIOS = userAgent.includes("iphone") || userAgent.includes("ipad");
        var isChrome = userAgent.includes("chrome");
        var isFirefox = userAgent.includes("firefox");
        var isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        // Detect Facebook in-app browser
        var isFacebookBrowser = userAgent.includes("fban") ||
            userAgent.includes("fbav") ||
            userAgent.includes("fb_iab") ||
            userAgent.includes("fb//") ||
            (userAgent.includes("mobile") && userAgent.includes("facebook"));
        return {
            isWindows: isWindows,
            isAndroid: isAndroid,
            isIOS: isIOS,
            isChrome: isChrome,
            isFirefox: isFirefox,
            isMobile: isMobile,
            isFacebookBrowser: isFacebookBrowser,
        };
    };
    var checkSecureContext = function () {
        return (window.isSecureContext ||
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1");
    };
    var checkGeolocationPermission = function () { return __awaiter(_this, void 0, void 0, function () {
        var permission, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!navigator.permissions)
                        return [2 /*return*/, "unknown"];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, navigator.permissions.query({
                            name: "geolocation",
                        })];
                case 2:
                    permission = _a.sent();
                    return [2 /*return*/, permission.state];
                case 3:
                    error_1 = _a.sent();
                    return [2 /*return*/, "unknown"];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var normalizeGeolocationError = function (error) {
        var _a, _b;
        // Handle both numeric codes and modern DOMException names
        var errorName = error.name || "Code".concat(error.code);
        var isDenied = error.code === 1 ||
            errorName === "NotAllowedError" ||
            ((_a = error.message) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("denied")) ||
            ((_b = error.message) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes("not allowed"));
        return {
            code: error.code,
            name: errorName,
            isDenied: isDenied,
        };
    };
    var ipGeolocationFallback = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log("🌐 Trying IP-based geolocation fallback...");
                    return [4 /*yield*/, fetch("https://ipapi.co/json/")];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (data.latitude && data.longitude) {
                        console.log("✅ IP geolocation success:", {
                            lat: data.latitude,
                            lng: data.longitude,
                            city: data.city,
                        });
                        return [2 /*return*/, {
                                lat: parseFloat(data.latitude),
                                lng: parseFloat(data.longitude),
                                city: data.city || data.region || "Your Location",
                            }];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.log("❌ IP geolocation failed:", error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, null];
            }
        });
    }); };
    var handleLocationDetection = function () { return __awaiter(_this, void 0, void 0, function () {
        var clearForcedLocation, platform, ipLocation, permissionState, attemptNumber, maxAttempts, tryLocationMethod, position, _a, latitude, longitude, error_3, error_4, normalizedError, errorMessage, ipLocation, finalErrorMessage;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, import("@/lib/location")];
                case 1:
                    clearForcedLocation = (_b.sent()).clearForcedLocation;
                    clearForcedLocation();
                    console.log("🧭 Using real GPS location detection");
                    // Single-flight guard: prevent duplicate detection attempts
                    if (isLoading || inFlightRef.current) {
                        console.log("🚫 Location detection already in progress, skipping...");
                        return [2 /*return*/];
                    }
                    if (!navigator.geolocation) {
                        onLocationError("Geolocation is not supported by this browser.");
                        onLocationNameUpdate("Your Location");
                        if (mountedRef.current)
                            setStatus("error");
                        return [2 /*return*/];
                    }
                    // Check secure context (HTTPS requirement)
                    if (!checkSecureContext()) {
                        onLocationError("Location access requires a secure connection (HTTPS). Please access this site via HTTPS.");
                        onLocationNameUpdate("Your Location");
                        if (mountedRef.current)
                            setStatus("error");
                        return [2 /*return*/];
                    }
                    platform = detectPlatform();
                    if (!platform.isFacebookBrowser) return [3 /*break*/, 3];
                    console.log("🔵 Facebook in-app browser detected - using IP fallback");
                    onLocationError("For the best experience, open this in your regular browser. Using approximate location based on your internet connection.");
                    return [4 /*yield*/, ipGeolocationFallback()];
                case 2:
                    ipLocation = _b.sent();
                    if (ipLocation && mountedRef.current) {
                        console.log("📍 Facebook browser IP fallback success:", ipLocation);
                        onLocationUpdate({ lat: ipLocation.lat, lng: ipLocation.lng });
                        onLocationNameUpdate("".concat(ipLocation.city, " (approximate)"));
                        setStatus("success");
                        setLastUpdateTime(new Date());
                        // Reset success status after 2 seconds
                        timeoutRef.current = setTimeout(function () {
                            if (mountedRef.current && statusRef.current === "success") {
                                setStatus("idle");
                            }
                        }, 2000);
                        return [2 /*return*/];
                    }
                    else {
                        // If IP fallback fails in Facebook browser, suggest manual entry
                        onLocationNameUpdate("Your Location");
                        if (onShowManualInput) {
                            setTimeout(function () {
                                onShowManualInput();
                            }, 1000);
                        }
                        return [2 /*return*/];
                    }
                    _b.label = 3;
                case 3: return [4 /*yield*/, checkGeolocationPermission()];
                case 4:
                    permissionState = _b.sent();
                    if (permissionState === "denied") {
                        onLocationError("Location access is permanently denied. Please reset location permissions in your browser settings.");
                        onLocationNameUpdate("Your Location");
                        if (mountedRef.current)
                            setStatus("error");
                        return [2 /*return*/];
                    }
                    if (mountedRef.current) {
                        setInternalLoading(true);
                        setStatus("loading");
                    }
                    // Cancel any in-flight requests
                    if (abortControllerRef.current) {
                        abortControllerRef.current.abort();
                    }
                    // Set up new abort controller for this detection
                    abortControllerRef.current = new AbortController();
                    // Mark detection as in-flight (after all early checks)
                    inFlightRef.current = true;
                    attemptNumber = 0;
                    maxAttempts = 3;
                    tryLocationMethod = function (attempt) {
                        return new Promise(function (resolve, reject) {
                            // Platform-specific timeout and accuracy settings
                            var options;
                            if (platform.isWindows || platform.isAndroid) {
                                // Windows/Android: More conservative settings
                                options = {
                                    enableHighAccuracy: attempt === 1, // Only high accuracy on first attempt
                                    timeout: attempt === 1 ? 8000 : 15000, // Shorter timeout for first attempt
                                    maximumAge: attempt === 1 ? 0 : 60000, // Allow cached location after first attempt
                                };
                            }
                            else if (platform.isIOS) {
                                // iOS: Works well with high accuracy
                                options = {
                                    enableHighAccuracy: true,
                                    timeout: 15000,
                                    maximumAge: 30000,
                                };
                            }
                            else {
                                // Default for other platforms
                                options = {
                                    enableHighAccuracy: attempt <= 2,
                                    timeout: attempt === 1 ? 10000 : 15000,
                                    maximumAge: attempt === 1 ? 0 : 30000,
                                };
                            }
                            console.log("\uD83C\uDFAF GPS attempt ".concat(attempt, " for ").concat(platform.isWindows
                                ? "Windows"
                                : platform.isAndroid
                                    ? "Android"
                                    : platform.isIOS
                                        ? "iOS"
                                        : "Other", ":"), options);
                            navigator.geolocation.getCurrentPosition(function (position) {
                                console.log("\u2705 GPS attempt ".concat(attempt, " success:"), {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                    accuracy: "".concat(Math.round(position.coords.accuracy), "m"),
                                });
                                resolve(position);
                            }, function (error) {
                                console.log("\u274C GPS attempt ".concat(attempt, " failed:"), error.message, error.code);
                                reject(error);
                            }, options);
                        });
                    };
                    attemptNumber = 1;
                    _b.label = 5;
                case 5:
                    if (!(attemptNumber <= maxAttempts)) return [3 /*break*/, 16];
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 12, , 15]);
                    return [4 /*yield*/, tryLocationMethod(attemptNumber)];
                case 7:
                    position = _b.sent();
                    _a = position.coords, latitude = _a.latitude, longitude = _a.longitude;
                    // Validate coordinates are reasonable
                    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
                        console.warn("\u26A0\uFE0F Invalid coordinates on attempt ".concat(attemptNumber, ", trying next method..."));
                        return [3 /*break*/, 15];
                    }
                    console.log("\uD83D\uDCCD GPS SUCCESS on attempt ".concat(attemptNumber, ":"), {
                        latitude: latitude,
                        longitude: longitude,
                    });
                    _b.label = 8;
                case 8:
                    _b.trys.push([8, 10, , 11]);
                    // Update location
                    onLocationUpdate({ lat: latitude, lng: longitude });
                    // Get location name via simple coordinate display
                    return [4 /*yield*/, getReverseGeocodedLocationName(latitude, longitude, onLocationNameUpdate)];
                case 9:
                    // Get location name via simple coordinate display
                    _b.sent();
                    setStatus("success");
                    setLastUpdateTime(new Date());
                    // Reset success status after 2 seconds
                    timeoutRef.current = setTimeout(function () {
                        if (mountedRef.current && statusRef.current === "success") {
                            setStatus("idle");
                        }
                    }, 2000);
                    if (mountedRef.current)
                        setInternalLoading(false);
                    // Clean up on success
                    inFlightRef.current = false;
                    abortControllerRef.current = null;
                    console.debug("✅ GPS location detection completed successfully");
                    return [2 /*return*/]; // Success! Exit the retry loop
                case 10:
                    error_3 = _b.sent();
                    console.error("Error processing location:", error_3);
                    return [3 /*break*/, 11];
                case 11: return [3 /*break*/, 15];
                case 12:
                    error_4 = _b.sent();
                    console.log("\uD83D\uDD04 GPS attempt ".concat(attemptNumber, " failed, trying next method..."));
                    normalizedError = normalizeGeolocationError(error_4);
                    // If this is a permission denied error, offer alternatives
                    if (normalizedError.isDenied) {
                        if (mountedRef.current) {
                            setInternalLoading(false);
                            setStatus("error");
                        }
                        errorMessage = userAddresses.length > 0
                            ? "Location access denied. You can use one of your saved addresses or enter your location manually."
                            : "Location access denied. Please enter your location manually below.";
                        onLocationError(errorMessage);
                        onLocationNameUpdate("Your Location");
                        // Show manual input option after a short delay
                        if (onShowManualInput) {
                            setTimeout(function () {
                                onShowManualInput();
                            }, 1500);
                        }
                        // Clear flight guard on permission denied
                        inFlightRef.current = false;
                        abortControllerRef.current = null;
                        return [2 /*return*/];
                    }
                    if (!(attemptNumber === maxAttempts)) return [3 /*break*/, 14];
                    console.log("🌐 All GPS attempts failed, trying IP geolocation fallback...");
                    return [4 /*yield*/, ipGeolocationFallback()];
                case 13:
                    ipLocation = _b.sent();
                    if (ipLocation && mountedRef.current) {
                        console.log("📍 IP fallback SUCCESS:", ipLocation);
                        onLocationUpdate({ lat: ipLocation.lat, lng: ipLocation.lng });
                        onLocationNameUpdate("".concat(ipLocation.city, " (approximate)"));
                        setStatus("success");
                        setLastUpdateTime(new Date());
                        // Reset success status after 2 seconds
                        timeoutRef.current = setTimeout(function () {
                            if (mountedRef.current && statusRef.current === "success") {
                                setStatus("idle");
                            }
                        }, 2000);
                        setInternalLoading(false);
                        // Clear flight guard on IP fallback success
                        inFlightRef.current = false;
                        abortControllerRef.current = null;
                        return [2 /*return*/];
                    }
                    // Final failure
                    if (mountedRef.current) {
                        setInternalLoading(false);
                        setStatus("error");
                    }
                    finalErrorMessage = userAddresses.length > 0
                        ? "Unable to detect your location. You can use one of your saved addresses or enter your location manually."
                        : "Unable to detect your location. Please enter your location manually below.";
                    onLocationError(finalErrorMessage);
                    onLocationNameUpdate("Your Location");
                    // Show manual input option after a short delay
                    if (onShowManualInput) {
                        setTimeout(function () {
                            onShowManualInput();
                        }, 1500);
                    }
                    // Clear flight guard on final failure
                    inFlightRef.current = false;
                    abortControllerRef.current = null;
                    return [2 /*return*/];
                case 14: return [3 /*break*/, 15];
                case 15:
                    attemptNumber++;
                    return [3 /*break*/, 5];
                case 16: return [2 /*return*/];
            }
        });
    }); };
    var handleRetry = function () {
        setStatus("idle");
        handleLocationDetection();
    };
    var buttonSize = size === "sm"
        ? "h-8 px-3 text-xs"
        : size === "lg"
            ? "h-12 px-6 text-base"
            : "h-10 px-4 text-sm";
    var iconSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;
    if (variant === "minimal") {
        return (<Button data-testid="button-location-minimal" variant="ghost" size="sm" onClick={handleLocationDetection} disabled={isLoading} className={cn("p-2", className)}>
        {isLoading ? (<Loader2 size={iconSize} className="animate-spin"/>) : status === "success" ? (<CheckCircle size={iconSize} className="text-green-600"/>) : status === "error" ? (<XCircle size={iconSize} className="text-red-600"/>) : (<MapPin size={iconSize}/>)}
      </Button>);
    }
    return (<div className="flex items-center gap-2">
      {userAddresses.length > 0 ? (<DropdownMenu open={showLocationOptions} onOpenChange={setShowLocationOptions}>
          <DropdownMenuTrigger asChild>
            <Button data-testid="button-location-options" variant="outline" disabled={isLoading} className={cn(buttonSize, className)}>
              {isLoading ? (<>
                  <Loader2 size={iconSize} className="animate-spin mr-2"/>
                  Detecting...
                </>) : status === "success" ? (<>
                  <CheckCircle size={iconSize} className="text-green-600 mr-2"/>
                  Location Found
                </>) : status === "error" ? (<>
                  <XCircle size={iconSize} className="text-red-600 mr-2"/>
                  Location Error
                </>) : (<>
                  <MapPin size={iconSize} className="mr-2"/>
                  Use Location
                </>)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Choose Location</DropdownMenuLabel>
            <DropdownMenuItem data-testid="menu-location-gps" onClick={handleLocationDetection} disabled={isLoading} className="cursor-pointer">
              <MapPinIcon className="mr-2 h-4 w-4"/>
              {isLoading ? "Detecting..." : "Use Current Location"}
            </DropdownMenuItem>

            {userAddresses.length > 0 && (<>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Saved Addresses</DropdownMenuLabel>
                {userAddresses.map(function (address) { return (<DropdownMenuItem key={address.id} data-testid={"menu-address-".concat(address.id)} onClick={function () {
                        if (address.latitude && address.longitude) {
                            onLocationUpdate({
                                lat: parseFloat(address.latitude),
                                lng: parseFloat(address.longitude),
                            });
                            onLocationNameUpdate(address.label || address.address);
                            setStatus("success");
                            setLastUpdateTime(new Date());
                            setShowLocationOptions(false);
                            // Reset success status after 2 seconds
                            timeoutRef.current = setTimeout(function () {
                                if (mountedRef.current &&
                                    statusRef.current === "success") {
                                    setStatus("idle");
                                }
                            }, 2000);
                        }
                    }} className="cursor-pointer">
                    <Home className="mr-2 h-4 w-4"/>
                    <div className="flex flex-col">
                      <span className="font-medium">{address.label}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {address.address}
                      </span>
                    </div>
                  </DropdownMenuItem>); })}
              </>)}
          </DropdownMenuContent>
        </DropdownMenu>) : (<Button data-testid="button-location-detect" variant="outline" onClick={status === "error" ? handleRetry : handleLocationDetection} disabled={isLoading} className={cn(buttonSize, className)}>
          {isLoading ? (<>
              <Loader2 size={iconSize} className="animate-spin mr-2"/>
              Detecting...
            </>) : status === "success" ? (<>
              <CheckCircle size={iconSize} className="text-green-600 mr-2"/>
              Location Found
            </>) : status === "error" ? (<>
              <RefreshCw size={iconSize} className="mr-2"/>
              Retry Location
            </>) : (<>
              <MapPin size={iconSize} className="mr-2"/>
              Use My Location
            </>)}
        </Button>)}

      {lastUpdateTime && status === "success" && (<span className="text-xs text-muted-foreground">
          Updated {lastUpdateTime.toLocaleTimeString()}
        </span>)}
    </div>);
}
