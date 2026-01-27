/**
 * PHASE 1 + 2: Referral Service
 *
 * Tracks referrals:
 * 1. Records every click on affiliate link (Phase 1)
 * 2. Attaches referral to restaurant signup (Phase 2)
 * 3. Creates commissions when restaurant pays (Phase 3)
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
import { db } from "./db.js";
import { referrals, referralClicks, restaurants, affiliateCommissionLedger, } from "@shared/schema";
import { eq } from "drizzle-orm";
import { resolveAffiliateUserId } from "./affiliateTagService.js";
/**
 * PHASE 1: Record a click on an affiliate link
 *
 * Called when:
 * - User clicks shared link with ?ref=<affiliateTag>
 * - Link leads to restaurant signup page
 *
 * Returns referral ID (stored in cookie or session)
 */
export function recordReferralClick(affiliateUserId, url, userAgent, ip) {
    return __awaiter(this, void 0, void 0, function () {
        var clickRecord, referralRecord, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, db
                            .insert(referralClicks)
                            .values({
                            affiliateUserId: affiliateUserId,
                            url: url,
                            userAgent: userAgent,
                            ip: ip,
                        })
                            .returning()];
                case 1:
                    clickRecord = _a.sent();
                    if (!clickRecord[0]) {
                        throw new Error("Failed to record referral click");
                    }
                    return [4 /*yield*/, db
                            .insert(referrals)
                            .values({
                            affiliateUserId: affiliateUserId,
                            clickedAt: new Date(),
                            status: "clicked",
                        })
                            .returning()];
                case 2:
                    referralRecord = _a.sent();
                    return [2 /*return*/, {
                            clickId: clickRecord[0].id,
                            referralId: referralRecord[0].id,
                        }];
                case 3:
                    error_1 = _a.sent();
                    console.error("[referralService] Error recording click:", error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * PHASE 2: Attach referral to restaurant signup
 *
 * Called when a restaurant completes their signup/registration
 *
 * @param referralIdOrTag - referral ID or affiliate tag
 * @param newRestaurantId - ID of the newly created restaurant account
 */
export function attachReferralToSignup(referralIdOrTag, newRestaurantId) {
    return __awaiter(this, void 0, void 0, function () {
        var referral, updated, affiliateUserId, restaurant, created, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, db
                            .select()
                            .from(referrals)
                            .where(eq(referrals.id, referralIdOrTag))
                            .limit(1)];
                case 1:
                    referral = (_a.sent())[0];
                    if (!referral) return [3 /*break*/, 3];
                    return [4 /*yield*/, db
                            .update(referrals)
                            .set({
                            referredRestaurantId: newRestaurantId,
                            signedUpAt: new Date(),
                            status: "signed_up",
                        })
                            .where(eq(referrals.id, referral.id))
                            .returning()];
                case 2:
                    updated = _a.sent();
                    return [2 /*return*/, updated[0]];
                case 3: return [4 /*yield*/, resolveAffiliateUserId(referralIdOrTag)];
                case 4:
                    affiliateUserId = _a.sent();
                    if (!affiliateUserId) {
                        console.warn("[referralService] Referral ".concat(referralIdOrTag, " not found"));
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, db
                            .select({ id: restaurants.id })
                            .from(restaurants)
                            .where(eq(restaurants.id, newRestaurantId))
                            .limit(1)];
                case 5:
                    restaurant = (_a.sent())[0];
                    if (!restaurant) {
                        console.warn("[referralService] Restaurant ".concat(newRestaurantId, " not found"));
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, db
                            .insert(referrals)
                            .values({
                            affiliateUserId: affiliateUserId,
                            referredRestaurantId: newRestaurantId,
                            clickedAt: new Date(),
                            signedUpAt: new Date(),
                            status: "signed_up",
                        })
                            .returning()];
                case 6:
                    created = _a.sent();
                    return [2 /*return*/, created[0]];
                case 7:
                    error_2 = _a.sent();
                    console.error("[referralService] Error attaching referral to signup:", error_2);
                    throw error_2;
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * PHASE 1: Parse referral ID from URL
 *
 * Extracts ?ref=<affiliateTag> from any shared URL
 */
export function extractReferralIdFromUrl(url) {
    try {
        var urlObj = new URL(url, "http://localhost"); // Use base URL if relative
        return urlObj.searchParams.get("ref");
    }
    catch (_a) {
        return null;
    }
}
/**
 * PHASE 1: Append referral parameter to any URL
 *
 * Used by share middleware (Phase 7)
 */
export function appendReferralParam(url, affiliateTag) {
    if (!affiliateTag)
        return url;
    try {
        var separator = url.includes("?") ? "&" : "?";
        return "".concat(url).concat(separator, "ref=").concat(affiliateTag);
    }
    catch (error) {
        console.error("[referralService] Error appending referral param:", error);
        return url;
    }
}
/**
 * Get referral stats for an affiliate user
 */
export function getAffiliateReferralStats(affiliateUserId) {
    return __awaiter(this, void 0, void 0, function () {
        var allReferrals, stats_1, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select()
                            .from(referrals)
                            .where(eq(referrals.affiliateUserId, affiliateUserId))];
                case 1:
                    allReferrals = _a.sent();
                    stats_1 = {
                        totalClicks: 0,
                        signedUp: 0,
                        activated: 0,
                        paid: 0,
                        referrals: allReferrals,
                    };
                    allReferrals.forEach(function (ref) {
                        if (ref.status === "clicked")
                            stats_1.totalClicks++;
                        if (ref.status === "signed_up" || ["activated", "paid"].includes(ref.status))
                            stats_1.signedUp++;
                        if (ref.status === "activated" || ref.status === "paid")
                            stats_1.activated++;
                        if (ref.status === "paid")
                            stats_1.paid++;
                    });
                    return [2 /*return*/, stats_1];
                case 2:
                    error_3 = _a.sent();
                    console.error("[referralService] Error getting referral stats:", error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * PHASE 3: Create commission when restaurant becomes a paying customer
 *
 * Called by Stripe webhook when invoice.payment_succeeded
 *
 * @param restaurantId - ID of the restaurant that paid
 * @param invoiceAmount - Amount paid on the invoice (in cents, converted to dollars)
 * @param invoiceId - Stripe invoice ID for tracking
 * @returns Commission details or null if no referral found
 */
export function createCommissionForRestaurantPayment(restaurantId, invoiceAmount, invoiceId) {
    return __awaiter(this, void 0, void 0, function () {
        var referral, commissionAmount, commission, createCreditFromCommission, creditError_1, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    return [4 /*yield*/, db
                            .select()
                            .from(referrals)
                            .where(eq(referrals.referredRestaurantId, restaurantId))
                            .limit(1)];
                case 1:
                    referral = (_a.sent())[0];
                    if (!referral) {
                        console.log("[Phase 3] No referral found for restaurant ".concat(restaurantId));
                        return [2 /*return*/, null];
                    }
                    commissionAmount = (invoiceAmount / 100) * 0.1;
                    return [4 /*yield*/, db
                            .insert(affiliateCommissionLedger)
                            .values({
                            affiliateUserId: referral.affiliateUserId,
                            referralId: referral.id,
                            restaurantId: restaurantId,
                            amount: commissionAmount.toString(),
                            commissionSource: "subscription_payment",
                            stripeInvoiceId: invoiceId,
                        })
                            .returning()];
                case 2:
                    commission = _a.sent();
                    // Update referral status to 'paid'
                    return [4 /*yield*/, db
                            .update(referrals)
                            .set({
                            activatedAt: new Date(),
                            commissionEligibleAt: new Date(),
                            status: "paid",
                        })
                            .where(eq(referrals.id, referral.id))];
                case 3:
                    // Update referral status to 'paid'
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 7, , 8]);
                    return [4 /*yield*/, import("./creditService.js")];
                case 5:
                    createCreditFromCommission = (_a.sent()).createCreditFromCommission;
                    return [4 /*yield*/, createCreditFromCommission(referral.affiliateUserId, commission[0].id, commissionAmount)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    creditError_1 = _a.sent();
                    console.error("[Phase 4] Error creating credit from commission:", creditError_1);
                    return [3 /*break*/, 8];
                case 8:
                    console.log("[Phase 3] Commission created:", {
                        affiliateUserId: referral.affiliateUserId,
                        restaurantId: restaurantId,
                        amount: commissionAmount,
                        invoiceId: invoiceId,
                    });
                    return [2 /*return*/, commission[0]];
                case 9:
                    error_4 = _a.sent();
                    console.error("[referralService] Error creating commission:", error_4);
                    throw error_4;
                case 10: return [2 /*return*/];
            }
        });
    });
}
export default {
    recordReferralClick: recordReferralClick,
    attachReferralToSignup: attachReferralToSignup,
    extractReferralIdFromUrl: extractReferralIdFromUrl,
    appendReferralParam: appendReferralParam,
    getAffiliateReferralStats: getAffiliateReferralStats,
    createCommissionForRestaurantPayment: createCommissionForRestaurantPayment,
};

