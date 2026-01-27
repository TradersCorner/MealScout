// Shared location utility functions
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
export function getReverseGeocodedLocationName(latitude, longitude, onLocationNameUpdate) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, address, locationName, parts, _i, parts_1, part, zipResponse, zipData, zipError_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, , 11]);
                    console.log("🌍 Attempting reverse geocoding for:", {
                        latitude: latitude,
                        longitude: longitude,
                    });
                    return [4 /*yield*/, fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat=".concat(latitude, "&lon=").concat(longitude, "&zoom=16&addressdetails=1&extratags=1"), {
                            headers: {
                                "User-Agent": "MealScout/1.0",
                            },
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 9];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (!(data && data.address)) return [3 /*break*/, 9];
                    address = data.address;
                    locationName = "";
                    // Try multiple city-level fields first
                    if (address.city) {
                        locationName = address.city;
                    }
                    else if (address.town) {
                        locationName = address.town;
                    }
                    else if (address.village) {
                        locationName = address.village;
                    }
                    else if (address.suburb) {
                        locationName = address.suburb;
                    }
                    else if (address.neighbourhood) {
                        locationName = address.neighbourhood;
                    }
                    else if (address.hamlet) {
                        locationName = address.hamlet;
                    }
                    // If no city-level name found, try extracting from display_name
                    if (!locationName && data.display_name) {
                        parts = data.display_name
                            .split(",")
                            .map(function (p) { return p.trim(); });
                        // Look for a recognizable city/town in the display name
                        // Skip house numbers, roads, and administrative divisions
                        for (_i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                            part = parts_1[_i];
                            if (part &&
                                !part.match(/^\d/) && // Skip house numbers
                                !part.includes("Lane") &&
                                !part.includes("Road") &&
                                !part.includes("Street") &&
                                !part.includes("Parish") &&
                                !part.includes("County") &&
                                !part.includes("Louisiana") &&
                                !part.includes("United States") &&
                                !part.includes("US-LA") &&
                                part.length > 2) {
                                locationName = part;
                                break;
                            }
                        }
                    }
                    if (!(!locationName && address.postcode)) return [3 /*break*/, 8];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 7, , 8]);
                    console.log("\uD83C\uDFD8\uFE0F No city found, trying ZIP code lookup for ".concat(address.postcode));
                    return [4 /*yield*/, fetch("https://api.zippopotam.us/us/".concat(address.postcode))];
                case 4:
                    zipResponse = _a.sent();
                    if (!zipResponse.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, zipResponse.json()];
                case 5:
                    zipData = _a.sent();
                    if (zipData.places && zipData.places.length > 0) {
                        locationName = zipData.places[0]["place name"];
                        console.log("\u2705 Found city from ZIP code: ".concat(locationName));
                    }
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    zipError_1 = _a.sent();
                    console.warn("ZIP code lookup failed:", zipError_1);
                    return [3 /*break*/, 8];
                case 8:
                    // Last resort: try administrative areas but exclude "Parish"
                    if (!locationName) {
                        if (address.county && !address.county.includes("Parish")) {
                            locationName = address.county;
                        }
                    }
                    // Add state if we have a city/town and it's not already included
                    if (locationName &&
                        address.state &&
                        !locationName.includes(address.state)) {
                        locationName += ", ".concat(address.state);
                    }
                    if (locationName) {
                        console.log("✅ Reverse geocoding successful:", locationName);
                        onLocationNameUpdate(locationName);
                        return [2 /*return*/];
                    }
                    _a.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    error_1 = _a.sent();
                    console.warn("⚠️ Reverse geocoding failed:", error_1);
                    return [3 /*break*/, 11];
                case 11:
                    // Fallback: show generic location name instead of coordinates
                    onLocationNameUpdate("Location");
                    console.log("📍 Using generic location fallback (no coordinates shown)");
                    return [2 /*return*/];
            }
        });
    });
}
