/**
 * PHASE 6: Empty County Experience Routes
 */
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
import { getEmptyCountyExperience, getNearbyCountyFallback } from './emptyCountyPhase6Service.js';
import { appendReferralParam } from './referralService.js';
export default function setupEmptyCountyRoutes(app) {
    var _this = this;
    /**
     * GET /api/counties/:state/:county/empty-experience
     * Get empty county experience messaging and CTAs
     *
     * Shows 4-step funnel if county is empty:
     * 1. Acknowledgement (no partners yet)
     * 2. Reframe (you're early, earn money)
     * 3. Community submission (tell us about restaurants)
     * 4. Affiliate CTA (earn when they sign up)
     */
    app.get('/api/counties/:state/:county/empty-experience', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, state, county, experience, response, error_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    _a = req.params, state = _a.state, county = _a.county;
                    return [4 /*yield*/, getEmptyCountyExperience(county, state)];
                case 1:
                    experience = _c.sent();
                    response = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) && experience.isEmpty
                        ? __assign(__assign({}, experience), { shareLink: appendReferralParam("".concat(req.protocol, "://").concat(req.get('host'), "/restaurants?county=").concat(county, "&state=").concat(state), req.user.id), shareMessage: "Help ".concat(county, " find great restaurants. Share this link and earn when restaurants join!") }) : experience;
                    res.json(response);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _c.sent();
                    console.error('[emptyCounty routes] Error getting experience:', error_1);
                    res.status(500).json({ error: error_1.message });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    /**
     * GET /api/counties/:state/:county/fallback
     * Get fallback content (restaurants from nearby counties)
     *
     * Called if county is empty to show something to the user
     */
    app.get('/api/counties/:state/:county/fallback', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, state, county, fallback, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    _a = req.params, state = _a.state, county = _a.county;
                    return [4 /*yield*/, getNearbyCountyFallback(county, state)];
                case 1:
                    fallback = _b.sent();
                    res.json(fallback);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _b.sent();
                    console.error('[emptyCounty routes] Error getting fallback:', error_2);
                    res.status(500).json({ error: error_2.message });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}

