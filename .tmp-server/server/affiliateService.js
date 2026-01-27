/**
 * Affiliate Service
 *
 * Manages affiliate link generation, tracking, click attribution, and commission calculation.
 * Every user is automatically an affiliate - any shared link becomes trackable.
 */
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { db } from './db.js';
import { affiliateLinks, affiliateClicks, affiliateCommissions, affiliateWallet, } from '@shared/schema';
import { eq, and, sql, asc } from 'drizzle-orm';
var AFFILIATE_CODE_LENGTH = 8;
/**
 * Generate random 8-character affiliate code
 * Format: UX72A91 (mix of letters and numbers)
 */
function generateAffiliateCode() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var code = '';
    for (var i = 0; i < AFFILIATE_CODE_LENGTH; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
/**
 * Create an affiliate link for a shared resource
 * If the user shares a deal, restaurant, or page, their ID is automatically tracked
 */
export function createAffiliateLink(userId, resourceType, sourceUrl, resourceId) {
    return __awaiter(this, void 0, void 0, function () {
        var code, attempts, existing, separator, fullUrl, link;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    attempts = 0;
                    _a.label = 1;
                case 1:
                    code = generateAffiliateCode();
                    return [4 /*yield*/, db
                            .select()
                            .from(affiliateLinks)
                            .where(eq(affiliateLinks.code, code))
                            .limit(1)];
                case 2:
                    existing = (_a.sent())[0];
                    if (!existing)
                        return [3 /*break*/, 4];
                    attempts++;
                    _a.label = 3;
                case 3:
                    if (attempts < 10) return [3 /*break*/, 1];
                    _a.label = 4;
                case 4:
                    if (attempts >= 10) {
                        throw new Error('Failed to generate unique affiliate code');
                    }
                    separator = sourceUrl.includes('?') ? '&' : '?';
                    fullUrl = "".concat(sourceUrl).concat(separator, "ref=").concat(code);
                    return [4 /*yield*/, db
                            .insert(affiliateLinks)
                            .values({
                            affiliateUserId: userId,
                            code: code,
                            resourceType: resourceType,
                            resourceId: resourceId,
                            sourceUrl: sourceUrl,
                            fullUrl: fullUrl,
                        })
                            .returning()];
                case 5:
                    link = _a.sent();
                    return [2 /*return*/, link[0]];
            }
        });
    });
}
/**
 * Track a click on an affiliate link
 * First-click attribution: only count if no previous conversion in this session
 */
export function trackAffiliateClick(code, visitorIp, visitorUserAgent, referrerSource, sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        var link, existingClick, click;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .select()
                        .from(affiliateLinks)
                        .where(eq(affiliateLinks.code, code))
                        .limit(1)];
                case 1:
                    link = (_a.sent())[0];
                    if (!link) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(affiliateClicks)
                            .where(and(eq(affiliateClicks.affiliateLinkId, link.id), eq(affiliateClicks.sessionId, sessionId)))
                            .limit(1)];
                case 2:
                    existingClick = (_a.sent())[0];
                    if (existingClick) {
                        return [2 /*return*/, existingClick]; // Return existing, don't create duplicate
                    }
                    return [4 /*yield*/, db
                            .insert(affiliateClicks)
                            .values({
                            affiliateLinkId: link.id,
                            visitorIp: visitorIp,
                            visitorUserAgent: visitorUserAgent,
                            referrerSource: referrerSource,
                            sessionId: sessionId,
                        })
                            .returning()];
                case 3:
                    click = _a.sent();
                    // Increment click count on affiliate link
                    return [4 /*yield*/, db.update(affiliateLinks)
                            .set({ clickCount: sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " + 1"], ["", " + 1"])), affiliateLinks.clickCount) })
                            .where(eq(affiliateLinks.id, link.id))];
                case 4:
                    // Increment click count on affiliate link
                    _a.sent();
                    return [2 /*return*/, click[0]];
            }
        });
    });
}
/**
 * Attribute a signup to an affiliate link via first-click
 * Called when a restaurant completes signup after clicking an affiliate link
 */
export function attributeSignupToAffiliate(sessionId, restaurantUserId) {
    return __awaiter(this, void 0, void 0, function () {
        var firstClick, converted, click;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .select()
                        .from(affiliateClicks)
                        .where(and(eq(affiliateClicks.sessionId, sessionId), sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " IS NULL"], ["", " IS NULL"])), affiliateClicks.convertedAt)))
                        .orderBy(asc(affiliateClicks.clickedAt))
                        .limit(1)];
                case 1:
                    firstClick = (_a.sent())[0];
                    if (!firstClick) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, db.update(affiliateClicks)
                            .set({
                            convertedAt: new Date(),
                            restaurantSignupId: restaurantUserId,
                        })
                            .where(eq(affiliateClicks.id, firstClick.id))
                            .returning()];
                case 2:
                    converted = _a.sent();
                    return [4 /*yield*/, db
                            .select()
                            .from(affiliateClicks)
                            .where(eq(affiliateClicks.id, firstClick.id))
                            .limit(1)];
                case 3:
                    click = (_a.sent())[0];
                    if (!click) return [3 /*break*/, 5];
                    return [4 /*yield*/, db.update(affiliateLinks)
                            .set({ conversions: sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " + 1"], ["", " + 1"])), affiliateLinks.conversions) })
                            .where(eq(affiliateLinks.id, click.affiliateLinkId))];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/, converted[0]];
            }
        });
    });
}
/**
 * Calculate and create commission when restaurant becomes a paid subscriber
 * Commission policy (updated):
 * - Signup bonus: 20% of the first paid subscription (one-time)
 * - Recurring: 5% per paid month thereafter
 * - Only monthly billing is supported; any non-month cycle is treated as monthly
 */
export function createCommission(affiliateUserId, restaurantUserId, subscriptionValue, billingCycle, affiliateLinkId) {
    return __awaiter(this, void 0, void 0, function () {
        var value, existing, isFirstCommission, effectiveBilling, results, now, forMonth, percent, amount, signupRow, percent, amount, monthRow;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    value = parseFloat(subscriptionValue);
                    return [4 /*yield*/, db
                            .select({ id: affiliateCommissions.id })
                            .from(affiliateCommissions)
                            .where(and(eq(affiliateCommissions.affiliateUserId, affiliateUserId), eq(affiliateCommissions.restaurantUserId, restaurantUserId)))
                            .limit(1)];
                case 1:
                    existing = _a.sent();
                    isFirstCommission = existing.length === 0;
                    effectiveBilling = 'month';
                    results = [];
                    now = new Date();
                    forMonth = now.toISOString().slice(0, 7);
                    if (!isFirstCommission) return [3 /*break*/, 4];
                    percent = 20;
                    amount = +(value * (percent / 100)).toFixed(2);
                    return [4 /*yield*/, db.insert(affiliateCommissions).values({
                            affiliateUserId: affiliateUserId,
                            restaurantUserId: restaurantUserId,
                            affiliateLinkId: affiliateLinkId || undefined,
                            commissionAmount: amount.toString(),
                            commissionPercent: percent,
                            basedOn: 'subscription_value',
                            subscriptionValue: subscriptionValue,
                            billingCycle: effectiveBilling,
                            forMonth: forMonth,
                        }).returning()];
                case 2:
                    signupRow = _a.sent();
                    results.push(signupRow[0]);
                    return [4 /*yield*/, updateAffiliateWallet(affiliateUserId, { pendingCommissions: amount })];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 4:
                    percent = 10;
                    amount = +(value * (percent / 100)).toFixed(2);
                    return [4 /*yield*/, db.insert(affiliateCommissions).values({
                            affiliateUserId: affiliateUserId,
                            restaurantUserId: restaurantUserId,
                            affiliateLinkId: affiliateLinkId || undefined,
                            commissionAmount: amount.toString(),
                            commissionPercent: percent,
                            basedOn: 'subscription_value',
                            subscriptionValue: subscriptionValue,
                            billingCycle: effectiveBilling,
                            forMonth: forMonth,
                        }).returning()];
                case 5:
                    monthRow = _a.sent();
                    results.push(monthRow[0]);
                    return [4 /*yield*/, updateAffiliateWallet(affiliateUserId, { pendingCommissions: amount })];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [2 /*return*/, results];
            }
        });
    });
}
/**
 * Process pending commissions to available balance (e.g., monthly payout)
 */
export function processPendingCommissions(forMonth) {
    return __awaiter(this, void 0, void 0, function () {
        var pending, updated, _i, pending_1, commission, updatedCommission, amount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .select()
                        .from(affiliateCommissions)
                        .where(and(eq(affiliateCommissions.forMonth, forMonth), eq(affiliateCommissions.status, 'pending')))];
                case 1:
                    pending = _a.sent();
                    updated = [];
                    _i = 0, pending_1 = pending;
                    _a.label = 2;
                case 2:
                    if (!(_i < pending_1.length)) return [3 /*break*/, 6];
                    commission = pending_1[_i];
                    return [4 /*yield*/, db.update(affiliateCommissions)
                            .set({
                            status: 'paid',
                            paidAt: new Date(),
                        })
                            .where(eq(affiliateCommissions.id, commission.id))
                            .returning()];
                case 3:
                    updatedCommission = _a.sent();
                    amount = parseFloat(commission.commissionAmount.toString());
                    return [4 /*yield*/, updateAffiliateWallet(commission.affiliateUserId, {
                            pendingCommissions: -amount,
                            availableBalance: amount,
                            totalEarned: amount,
                        })];
                case 4:
                    _a.sent();
                    updated.push(updatedCommission[0]);
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/, updated];
            }
        });
    });
}
/**
 * Update affiliate wallet balances
 */
export function updateAffiliateWallet(userId, updates) {
    return __awaiter(this, void 0, void 0, function () {
        var wallet, created, updateData, current, current, current, current, current, updated;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, db
                        .select()
                        .from(affiliateWallet)
                        .where(eq(affiliateWallet.userId, userId))
                        .limit(1)];
                case 1:
                    wallet = (_f.sent())[0];
                    if (!!wallet) return [3 /*break*/, 3];
                    return [4 /*yield*/, db.insert(affiliateWallet).values({
                            userId: userId,
                        }).returning()];
                case 2:
                    created = _f.sent();
                    wallet = created[0];
                    _f.label = 3;
                case 3:
                    updateData = { updatedAt: new Date() };
                    if (updates.availableBalance !== undefined) {
                        current = parseFloat(((_a = wallet.availableBalance) === null || _a === void 0 ? void 0 : _a.toString()) || '0');
                        updateData.availableBalance = (current + updates.availableBalance).toString();
                    }
                    if (updates.pendingCommissions !== undefined) {
                        current = parseFloat(((_b = wallet.pendingCommissions) === null || _b === void 0 ? void 0 : _b.toString()) || '0');
                        updateData.pendingCommissions = (current + updates.pendingCommissions).toString();
                    }
                    if (updates.totalEarned !== undefined) {
                        current = parseFloat(((_c = wallet.totalEarned) === null || _c === void 0 ? void 0 : _c.toString()) || '0');
                        updateData.totalEarned = (current + updates.totalEarned).toString();
                    }
                    if (updates.totalWithdrawn !== undefined) {
                        current = parseFloat(((_d = wallet.totalWithdrawn) === null || _d === void 0 ? void 0 : _d.toString()) || '0');
                        updateData.totalWithdrawn = (current + updates.totalWithdrawn).toString();
                    }
                    if (updates.totalSpent !== undefined) {
                        current = parseFloat(((_e = wallet.totalSpent) === null || _e === void 0 ? void 0 : _e.toString()) || '0');
                        updateData.totalSpent = (current + updates.totalSpent).toString();
                    }
                    return [4 /*yield*/, db
                            .update(affiliateWallet)
                            .set(updateData)
                            .where(eq(affiliateWallet.userId, userId))
                            .returning()];
                case 4:
                    updated = _f.sent();
                    return [2 /*return*/, updated[0]];
            }
        });
    });
}
/**
 * Get affiliate stats for a user
 */
export function getAffiliateStats(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var wallet, links, totalClicks, totalConversions, pendingCommissions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .select()
                        .from(affiliateWallet)
                        .where(eq(affiliateWallet.userId, userId))
                        .limit(1)];
                case 1:
                    wallet = (_a.sent())[0];
                    return [4 /*yield*/, db
                            .select()
                            .from(affiliateLinks)
                            .where(eq(affiliateLinks.affiliateUserId, userId))];
                case 2:
                    links = _a.sent();
                    totalClicks = links.reduce(function (sum, link) { return sum + Number(link.clickCount || 0); }, 0);
                    totalConversions = links.reduce(function (sum, link) { return sum + Number(link.conversions || 0); }, 0);
                    return [4 /*yield*/, db
                            .select()
                            .from(affiliateCommissions)
                            .where(and(eq(affiliateCommissions.affiliateUserId, userId), eq(affiliateCommissions.status, 'pending')))];
                case 3:
                    pendingCommissions = _a.sent();
                    return [2 /*return*/, {
                            wallet: wallet || {
                                totalEarned: 0,
                                availableBalance: 0,
                                pendingCommissions: 0,
                                totalWithdrawn: 0,
                                totalSpent: 0,
                            },
                            stats: {
                                totalLinks: links.length,
                                totalClicks: totalClicks,
                                totalConversions: totalConversions,
                                conversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : '0',
                                pendingMonthlyCount: pendingCommissions.length,
                            },
                            recentLinks: links.slice(-5),
                        }];
            }
        });
    });
}
export default {
    generateAffiliateCode: generateAffiliateCode,
    createAffiliateLink: createAffiliateLink,
    trackAffiliateClick: trackAffiliateClick,
    attributeSignupToAffiliate: attributeSignupToAffiliate,
    createCommission: createCommission,
    processPendingCommissions: processPendingCommissions,
    updateAffiliateWallet: updateAffiliateWallet,
    getAffiliateStats: getAffiliateStats,
};
var templateObject_1, templateObject_2, templateObject_3;

