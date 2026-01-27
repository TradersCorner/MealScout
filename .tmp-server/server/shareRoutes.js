/**
 * PHASE 7: Share Link Routes
 *
 * Endpoints for generating shareable links with affiliate params
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
import { generateShareableUrl } from './shareMiddleware.js';
import { db } from "./db.js";
import { affiliateShareEvents } from "@shared/schema";
import { ensureAffiliateTag, resolveAffiliateUserId } from "./affiliateTagService.js";
export default function setupShareRoutes(app) {
    var _this = this;
    /**
     * POST /api/share/generate
     * Generate a shareable link with affiliate param
     *
     * Body: { path: '/restaurants/123' | '/deals/456' | etc }
     * Returns: { shareLink, shortPath, copied: true }
     */
    app.post('/api/share/generate', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, path, ref, baseUrl, affiliateUserId, affiliateTag, trimmed, resolved, shareLink, error_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 7, , 8]);
                    _a = req.body, path = _a.path, ref = _a.ref;
                    if (!path) {
                        return [2 /*return*/, res.status(400).json({ error: 'Path required' })];
                    }
                    baseUrl = "".concat(req.protocol, "://").concat(req.get('host'));
                    affiliateUserId = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || null;
                    affiliateTag = void 0;
                    if (!affiliateUserId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ensureAffiliateTag(affiliateUserId)];
                case 1:
                    affiliateTag = _c.sent();
                    return [3 /*break*/, 4];
                case 2:
                    if (!(typeof ref === "string" && ref.trim())) return [3 /*break*/, 4];
                    trimmed = ref.trim();
                    return [4 /*yield*/, resolveAffiliateUserId(trimmed)];
                case 3:
                    resolved = _c.sent();
                    if (resolved) {
                        affiliateUserId = resolved;
                        affiliateTag = trimmed;
                    }
                    _c.label = 4;
                case 4:
                    shareLink = generateShareableUrl(path, baseUrl, affiliateTag);
                    if (!affiliateUserId) return [3 /*break*/, 6];
                    return [4 /*yield*/, db.insert(affiliateShareEvents).values({
                            affiliateUserId: affiliateUserId,
                            sourcePath: path,
                        })];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6:
                    res.json({
                        shareLink: shareLink,
                        shortPath: path,
                        message: 'Share link generated',
                    });
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _c.sent();
                    console.error('[share routes] Error generating link:', error_1);
                    res.status(500).json({ error: error_1.message });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    /**
     * GET /api/share/info
     * Get info about sharing capabilities
     *
     * Returns copy templates, platform info, etc
     */
    app.get('/api/share/info', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                res.json({
                    shareChannels: [
                        {
                            name: 'Email',
                            icon: 'mail',
                            template: 'Check out {name} on MealScout: {link}',
                        },
                        {
                            name: 'SMS',
                            icon: 'message',
                            template: 'MealScout: {link}',
                        },
                        {
                            name: 'Facebook',
                            icon: 'facebook',
                            template: 'Found something great on MealScout: {link}',
                        },
                        {
                            name: 'Twitter',
                            icon: 'twitter',
                            template: 'Check this out on @MealScout: {link}',
                        },
                        {
                            name: 'WhatsApp',
                            icon: 'message-circle',
                            template: 'Hey! Check this on MealScout: {link}',
                        },
                    ],
                    message: 'Share and earn! When restaurants you refer sign up, you get credits.',
                    earnMessage: 'Every share brings potential earnings. No limits, never expires.',
                });
            }
            catch (error) {
                console.error('[share routes] Error getting info:', error);
                res.status(500).json({ error: error.message });
            }
            return [2 /*return*/];
        });
    }); });
}

