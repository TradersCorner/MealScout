/**
 * PHASE 7: Share Anything = Affiliate Link Middleware
 *
 * Global middleware that appends ?ref=<userId> to any shared URL
 *
 * Catches:
 * - Share links
 * - Copy link
 * - Social share (SMS, email, etc)
 * - QR codes
 * - Restaurant profiles
 * - Deal pages
 * - Home page
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
import { appendReferralParam } from './referralService.js';
import { ensureAffiliateTag } from "./affiliateTagService.js";
/**
 * Generate shareable URL with affiliate param
 *
 * Can be used for:
 * - Restaurant pages: /restaurants/:id
 * - Deal pages: /deals/:id
 * - Searches: /search?q=pizza
 * - County pages: /counties/san_diego/ca
 * - Collection pages: /collections/best-of-town
 * - Any other page
 */
export function generateShareableUrl(path, baseUrl, affiliateTag) {
    // Build full URL
    var fullUrl = baseUrl.startsWith('http')
        ? "".concat(baseUrl).concat(path)
        : "".concat(baseUrl).concat(path);
    // Append affiliate param if user is logged in
    if (!affiliateTag) {
        return fullUrl;
    }
    return appendReferralParam(fullUrl, affiliateTag);
}
/**
 * Express middleware to add shareUrl to res.locals
 *
 * Makes generateShareableUrl available in all route handlers
 * Usage: res.locals.generateShareableUrl(path)
 */
export function shareUrlMiddleware(req, res, next) {
    var baseUrl = "".concat(req.protocol, "://").concat(req.get('host'));
    res.locals.generateShareableUrl = function (path) {
        var _a, _b;
        var tag = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.affiliateTag) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        return generateShareableUrl(path, baseUrl, tag);
    };
    res.locals.appendAffiliateParam = function (url) {
        var _a, _b;
        var tag = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.affiliateTag) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        if (!tag)
            return url;
        return appendReferralParam(url, tag);
    };
    next();
}
/**
 * API endpoint to generate share links
 *
 * Called by frontend when user clicks share
 */
export function generateShareLink(path, baseUrl, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var tag, _a, shareLink;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!userId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ensureAffiliateTag(userId)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = undefined;
                    _b.label = 3;
                case 3:
                    tag = _a;
                    shareLink = generateShareableUrl(path, baseUrl, tag);
                    return [2 /*return*/, {
                            shareLink: shareLink,
                            shortPath: path,
                        }];
            }
        });
    });
}
export default {
    generateShareableUrl: generateShareableUrl,
    shareUrlMiddleware: shareUrlMiddleware,
    generateShareLink: generateShareLink,
};

