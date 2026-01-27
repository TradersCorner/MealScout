/**
 * PHASE 5: Payout Preferences Routes
 */
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
import { isAuthenticated } from './unifiedAuth.js';
import { getUserPayoutPreferences, setPayoutMethod } from './payoutService.js';
import { getUserCreditBalance } from './creditService.js';
export default function setupPayoutRoutes(app) {
    var _this = this;
    /**
     * GET /api/payout/preferences
     * Get current user's payout preferences and credit balance
     */
    app.get('/api/payout/preferences', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, prefs, creditBalance, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    userId = req.user.id;
                    return [4 /*yield*/, getUserPayoutPreferences(userId)];
                case 1:
                    prefs = _a.sent();
                    return [4 /*yield*/, getUserCreditBalance(userId)];
                case 2:
                    creditBalance = _a.sent();
                    res.json({
                        preferences: prefs,
                        creditBalance: creditBalance,
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('[payout routes] Error getting preferences:', error_1);
                    res.status(500).json({ error: error_1.message });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    /**
     * POST /api/payout/preferences
     * Update payout method preference
     */
    app.post('/api/payout/preferences', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, _a, method, stripeConnectedId, methodDetails, prefs, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    userId = req.user.id;
                    _a = req.body, method = _a.method, stripeConnectedId = _a.stripeConnectedId, methodDetails = _a.methodDetails;
                    if (!['credit', 'paypal', 'ach', 'other'].includes(method)) {
                        return [2 /*return*/, res.status(400).json({ error: 'Invalid payout method' })];
                    }
                    if (method === 'credit' && stripeConnectedId) {
                        return [2 /*return*/, res.status(400).json({ error: 'Stripe Connected ID not allowed for credit payouts' })];
                    }
                    return [4 /*yield*/, setPayoutMethod(userId, method, methodDetails, stripeConnectedId)];
                case 1:
                    prefs = _b.sent();
                    res.json({
                        message: 'Payout preferences updated',
                        preferences: prefs,
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _b.sent();
                    console.error('[payout routes] Error setting preferences:', error_2);
                    res.status(500).json({ error: error_2.message });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    /**
     * GET /api/payout/balance
     * Get user's available credit balance
     */
    app.get('/api/payout/balance', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, balance, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    userId = req.user.id;
                    return [4 /*yield*/, getUserCreditBalance(userId)];
                case 1:
                    balance = _a.sent();
                    res.json({
                        balance: balance,
                        currency: 'USD',
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('[payout routes] Error getting balance:', error_3);
                    res.status(500).json({ error: error_3.message });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}

