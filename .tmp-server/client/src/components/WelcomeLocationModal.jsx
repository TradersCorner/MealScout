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
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navigation, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
export default function WelcomeLocationModal(_a) {
    var _this = this;
    var open = _a.open, onLocationSet = _a.onLocationSet, onSkip = _a.onSkip;
    var _b = useState(false), isDetecting = _b[0], setIsDetecting = _b[1];
    var _c = useState(""), manualLocation = _c[0], setManualLocation = _c[1];
    var _d = useState(false), isSearching = _d[0], setIsSearching = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    var user = useAuth().user;
    var isTruckSideUser = user &&
        (user.userType === "restaurant_owner" ||
            user.userType === "staff" ||
            user.userType === "admin");
    var handleAutoDetect = function () { return __awaiter(_this, void 0, void 0, function () {
        var position, newLocation, response, data, locationName, _a, error_1;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    setIsDetecting(true);
                    setError(null);
                    if (!navigator.geolocation) {
                        setError("Location services not available in your browser");
                        setIsDetecting(false);
                        return [2 /*return*/];
                    }
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 8, 9, 10]);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                                enableHighAccuracy: true,
                                timeout: 8000,
                                maximumAge: 0,
                            });
                        })];
                case 2:
                    position = _e.sent();
                    newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat=".concat(newLocation.lat, "&lon=").concat(newLocation.lng))];
                case 4:
                    response = _e.sent();
                    return [4 /*yield*/, response.json()];
                case 5:
                    data = _e.sent();
                    locationName = ((_b = data.address) === null || _b === void 0 ? void 0 : _b.city) ||
                        ((_c = data.address) === null || _c === void 0 ? void 0 : _c.town) ||
                        ((_d = data.address) === null || _d === void 0 ? void 0 : _d.county) ||
                        "Your Location";
                    onLocationSet(newLocation, locationName);
                    return [3 /*break*/, 7];
                case 6:
                    _a = _e.sent();
                    onLocationSet(newLocation, "Your Location");
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 10];
                case 8:
                    error_1 = _e.sent();
                    setError("Unable to detect your location. Please enter it manually or skip.");
                    return [3 /*break*/, 10];
                case 9:
                    setIsDetecting(false);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    var handleManualSearch = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, newLocation, locationName, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!manualLocation.trim())
                        return [2 /*return*/];
                    setIsSearching(true);
                    setError(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("https://nominatim.openstreetmap.org/search?format=json&q=".concat(encodeURIComponent(manualLocation), "&limit=1"))];
                case 2:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _b.sent();
                    if (data && data[0]) {
                        newLocation = {
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon),
                        };
                        locationName = data[0].display_name.split(",")[0];
                        onLocationSet(newLocation, locationName);
                    }
                    else {
                        setError("Location not found. Try a different city or zip code.");
                    }
                    return [3 /*break*/, 6];
                case 4:
                    _a = _b.sent();
                    setError("Failed to search for location. Please try again.");
                    return [3 /*break*/, 6];
                case 5:
                    setIsSearching(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (<Dialog open={open} onOpenChange={function (isOpen) { return !isOpen && onSkip(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {isTruckSideUser
            ? "Find food truck spots"
            : "Welcome to MealScout!"}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {isTruckSideUser
            ? "Use your location to discover hosts, events, and neighborhoods looking for food trucks. We'll still surface deals when trucks post them."
            : "Discover nearby food trucks, pop-ups, and local meal deals near you."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Auto-detect option */}
          <Button onClick={handleAutoDetect} disabled={isDetecting} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-12">
            {isDetecting ? (<div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                <span>Detecting...</span>
              </div>) : (<div className="flex items-center space-x-2">
                <Navigation className="w-5 h-5"/>
                <span>Use My Current Location</span>
              </div>)}
          </Button>

          {/* Divider */}
          <div className="relative pt-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"/>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 py-0.5 text-muted-foreground">
                Or enter manually
              </span>
            </div>
          </div>

          {/* Manual search */}
          <div className="space-y-2 pt-1">
            <div className="flex space-x-2">
              <Input placeholder="Enter city or zip code..." value={manualLocation} onChange={function (e) { return setManualLocation(e.target.value); }} onKeyDown={function (e) { return e.key === "Enter" && handleManualSearch(); }} className="flex-1"/>
              <Button onClick={handleManualSearch} disabled={isSearching || !manualLocation.trim()} variant="outline" className="px-4">
                {isSearching ? (<div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"/>) : (<Search className="w-4 h-4"/>)}
              </Button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {/* Skip option */}
          <Button onClick={onSkip} variant="ghost" className="w-full text-gray-600 hover:text-gray-900">
            Skip for now
          </Button>

          {!user && (<Button asChild className="w-full">
              <Link href="/customer-signup">Create account</Link>
            </Button>)}
        </div>
      </DialogContent>
    </Dialog>);
}
