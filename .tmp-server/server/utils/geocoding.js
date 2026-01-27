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
var cache = new Map();
var roundCoord = function (value, digits) {
    if (digits === void 0) { digits = 3; }
    var factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
};
var getCacheKey = function (lat, lng) {
    return "".concat(roundCoord(lat), ":").concat(roundCoord(lng));
};
var extractCityState = function (data) {
    var address = (data === null || data === void 0 ? void 0 : data.address) || {};
    var city = address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.county;
    var state = address.state || address.region;
    return { city: city, state: state };
};
function reverseWithNominatim(lat, lng) {
    return __awaiter(this, void 0, void 0, function () {
        var url, res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=".concat(lat, "&lon=").concat(lng);
                    return [4 /*yield*/, fetch(url, {
                            headers: {
                                "User-Agent": "MealScout/1.0 (location lookup)",
                                "Accept-Language": "en",
                            },
                        })];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, extractCityState(data)];
            }
        });
    });
}
function reverseWithGoogle(lat, lng) {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, url, res, data, result, components, city, state;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    apiKey = process.env.GOOGLE_MAPS_API_KEY;
                    if (!apiKey)
                        return [2 /*return*/, null];
                    url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=".concat(lat, ",").concat(lng, "&key=").concat(apiKey);
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    res = _e.sent();
                    if (!res.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _e.sent();
                    result = (_a = data === null || data === void 0 ? void 0 : data.results) === null || _a === void 0 ? void 0 : _a[0];
                    if (!result)
                        return [2 /*return*/, null];
                    components = result.address_components || [];
                    city = ((_b = components.find(function (c) { var _a; return (_a = c.types) === null || _a === void 0 ? void 0 : _a.includes("locality"); })) === null || _b === void 0 ? void 0 : _b.long_name) ||
                        ((_c = components.find(function (c) { var _a; return (_a = c.types) === null || _a === void 0 ? void 0 : _a.includes("administrative_area_level_2"); })) === null || _c === void 0 ? void 0 : _c.long_name);
                    state = (_d = components.find(function (c) { var _a; return (_a = c.types) === null || _a === void 0 ? void 0 : _a.includes("administrative_area_level_1"); })) === null || _d === void 0 ? void 0 : _d.short_name;
                    return [2 /*return*/, { city: city, state: state }];
            }
        });
    });
}
export function reverseGeocode(lat, lng) {
    return __awaiter(this, void 0, void 0, function () {
        var key, cached, nominatimResult, googleResult, fallback;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    key = getCacheKey(lat, lng);
                    cached = cache.get(key);
                    if (cached)
                        return [2 /*return*/, cached];
                    return [4 /*yield*/, reverseWithNominatim(lat, lng)];
                case 1:
                    nominatimResult = _a.sent();
                    if ((nominatimResult === null || nominatimResult === void 0 ? void 0 : nominatimResult.city) || (nominatimResult === null || nominatimResult === void 0 ? void 0 : nominatimResult.state)) {
                        cache.set(key, nominatimResult);
                        return [2 /*return*/, nominatimResult];
                    }
                    return [4 /*yield*/, reverseWithGoogle(lat, lng)];
                case 2:
                    googleResult = _a.sent();
                    if ((googleResult === null || googleResult === void 0 ? void 0 : googleResult.city) || (googleResult === null || googleResult === void 0 ? void 0 : googleResult.state)) {
                        cache.set(key, googleResult);
                        return [2 /*return*/, googleResult];
                    }
                    fallback = {};
                    cache.set(key, fallback);
                    return [2 /*return*/, fallback];
            }
        });
    });
}
