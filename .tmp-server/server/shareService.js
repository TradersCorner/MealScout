/**
 * URL Sharing Utility
 *
 * Automatically converts any shared link into an affiliate link
 * Works for: deals, restaurants, collections, search, pages, etc.
 *
 * When a logged-in user shares content, they become the affiliate
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
import affiliateService from './affiliateService.js';
/**
 * Convert any URL into an affiliate link if user is logged in
 * This happens transparently - no extra friction
 */
export function generateShareableLink(baseUrl, context) {
    return __awaiter(this, void 0, void 0, function () {
        var affiliateLink;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // If no user, return original URL
                    if (!context.userId) {
                        return [2 /*return*/, { url: baseUrl, code: '' }];
                    }
                    return [4 /*yield*/, affiliateService.createAffiliateLink(context.userId, context.resourceType, baseUrl, context.resourceId)];
                case 1:
                    affiliateLink = _a.sent();
                    return [2 /*return*/, {
                            url: affiliateLink.fullUrl,
                            code: affiliateLink.code,
                        }];
            }
        });
    });
}
/**
 * Share templates with placeholders
 * Pre-composed copy for different platforms
 */
export var shareTemplates = {
    email: function (restaurantName, affiliateUrl) { return ({
        subject: "Check out ".concat(restaurantName, " \u2014 killer deals on MealScout"),
        body: "Hey! Found this amazing spot on MealScout:\n\n".concat(restaurantName, "\n\nHere's a link with the best deals:\n").concat(affiliateUrl, "\n\nLet me know what you think!"),
    }); },
    sms: function (restaurantName, shortUrl) {
        return "Check out ".concat(restaurantName, " on MealScout for deals \u2014 ").concat(shortUrl);
    },
    facebook: function (restaurantName, affiliateUrl) { return ({
        title: "Just discovered ".concat(restaurantName, " on MealScout"),
        description: 'Amazing local food spot with killer deals 🍔',
        url: affiliateUrl,
    }); },
    twitter: function (restaurantName, shortUrl) {
        return "Just found ".concat(restaurantName, " on @MealScout with incredible deals \uD83D\uDD25 Check it out: ").concat(shortUrl);
    },
    whatsapp: function (restaurantName, shortUrl) {
        return "Hey! You gotta check out ".concat(restaurantName, " on MealScout. Here's the link: ").concat(shortUrl);
    },
    copy: function (affiliateUrl) { return ({
        text: affiliateUrl,
        copyMessage: 'Affiliate link copied!',
    }); },
};
/**
 * Track outbound share event
 * Called when user actually completes the share action
 */
export function trackShare(userId, affiliateCode, platform, resourceType) {
    // This could be sent to analytics
    return {
        userId: userId,
        affiliateCode: affiliateCode,
        platform: platform,
        resourceType: resourceType,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Build share dialog copy based on context
 */
export function getShareDialogCopy(resourceType) {
    var copy = {
        deal: {
            title: '💰 Share this deal',
            subtitle: 'Earn recurring commission every time someone signs up',
            cta: 'Share now',
        },
        restaurant: {
            title: '🍽️ Recommend this restaurant',
            subtitle: 'Get paid when they become an MealScout partner',
            cta: 'Share now',
        },
        page: {
            title: '📱 Share MealScout',
            subtitle: 'Your friends earn money too when they recommend',
            cta: 'Share now',
        },
        collection: {
            title: '⭐ Share this collection',
            subtitle: 'Earn affiliate commissions on all recommendations',
            cta: 'Share now',
        },
        search: {
            title: '🔍 Share search results',
            subtitle: 'Get paid for recommendations that convert',
            cta: 'Share now',
        },
    };
    return copy[resourceType] || copy.page;
}
/**
 * Format affiliate URL for different platforms
 * Some platforms need shortened URLs, some need tracking params
 */
export function formatUrlForPlatform(fullUrl, platform) {
    // URL shortening could be integrated here if needed
    // For now, return full URL - modern platforms handle long URLs fine
    return fullUrl;
}
export default {
    generateShareableLink: generateShareableLink,
    shareTemplates: shareTemplates,
    trackShare: trackShare,
    getShareDialogCopy: getShareDialogCopy,
    formatUrlForPlatform: formatUrlForPlatform,
};

