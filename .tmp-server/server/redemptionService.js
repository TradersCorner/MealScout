/**
 * PHASE R1: Restaurant Credit Redemption Service
 *
 * Handles:
 * 1. Recording credit redemptions at restaurants
 * 2. Deducting credits from user ledger
 * 3. Creating immutable redemption records
 * 4. Managing dispute windows (7-day reversal period)
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
import { db } from './db.js';
import { restaurantCreditRedemptions, creditLedger, restaurants, users } from '@shared/schema';
import { eq, sum } from 'drizzle-orm';
/**
 * Process credit redemption at a restaurant
 *
 * Called when restaurant accepts credit payment from user
 *
 * Creates TWO ledger entries:
 * 1. restaurantCreditRedemptions (liability for restaurant)
 * 2. creditLedger (debit from user's balance)
 */
export function redeemCreditAtRestaurant(restaurantId, userId, creditAmount, orderReference, notes) {
    return __awaiter(this, void 0, void 0, function () {
        var restaurant, userCredits, balance, disputeUntilDate, redemption, creditEntry, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurants)
                            .where(eq(restaurants.id, restaurantId))
                            .limit(1)];
                case 1:
                    restaurant = (_b.sent())[0];
                    if (!restaurant) {
                        throw new Error('Restaurant not found');
                    }
                    return [4 /*yield*/, db
                            .select({ total: sum(creditLedger.amount) })
                            .from(creditLedger)
                            .where(eq(creditLedger.userId, userId))];
                case 2:
                    userCredits = _b.sent();
                    balance = ((_a = userCredits[0]) === null || _a === void 0 ? void 0 : _a.total)
                        ? parseFloat(userCredits[0].total.toString())
                        : 0;
                    if (balance < creditAmount) {
                        throw new Error("Insufficient credits. Available: $".concat(balance, ", Requested: $").concat(creditAmount));
                    }
                    disputeUntilDate = new Date();
                    disputeUntilDate.setDate(disputeUntilDate.getDate() + 7); // 7-day dispute window
                    return [4 /*yield*/, db.insert(restaurantCreditRedemptions).values({
                            restaurantId: restaurantId,
                            userId: userId,
                            creditAmount: creditAmount.toString(),
                            orderReference: orderReference || undefined,
                            notes: notes || undefined,
                            disputeUntil: disputeUntilDate,
                        }).returning()];
                case 3:
                    redemption = _b.sent();
                    return [4 /*yield*/, db.insert(creditLedger).values({
                            userId: userId,
                            amount: (-creditAmount).toString(),
                            sourceType: 'redemption',
                            sourceId: redemption[0].id,
                            redeemedAt: new Date(),
                            redeemedFor: 'restaurant',
                        }).returning()];
                case 4:
                    creditEntry = _b.sent();
                    console.log('[Phase R1] Credit redeemed at restaurant:', {
                        redemptionId: redemption[0].id,
                        restaurantId: restaurantId,
                        userId: userId,
                        amount: creditAmount,
                        disputeUntil: disputeUntilDate,
                    });
                    return [2 /*return*/, {
                            redemption: redemption[0],
                            creditEntry: creditEntry[0],
                        }];
                case 5:
                    error_1 = _b.sent();
                    console.error('[redemptionService] Error redeeming credit:', error_1);
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get all redemptions for a restaurant
 *
 * Used by restaurant dashboard to show pending payments
 */
export function getRestaurantRedemptions(restaurantId, status) {
    return __awaiter(this, void 0, void 0, function () {
        var redemptions, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurantCreditRedemptions)
                            .where(eq(restaurantCreditRedemptions.restaurantId, restaurantId))];
                case 1:
                    redemptions = _a.sent();
                    return [2 /*return*/, status ? redemptions.filter(function (item) { return item.settlementStatus === status; }) : redemptions];
                case 2:
                    error_2 = _a.sent();
                    console.error('[redemptionService] Error getting redemptions:', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get restaurant credit summary
 *
 * Returns pending credits, queued for settlement, and already paid
 */
export function getRestaurantCreditSummary(restaurantId) {
    return __awaiter(this, void 0, void 0, function () {
        var redemptions, pending, queued, paid, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurantCreditRedemptions)
                            .where(eq(restaurantCreditRedemptions.restaurantId, restaurantId))];
                case 1:
                    redemptions = _a.sent();
                    pending = redemptions
                        .filter(function (r) { return r.settlementStatus === 'pending'; })
                        .reduce(function (sum, r) { return sum + parseFloat(r.creditAmount.toString()); }, 0);
                    queued = redemptions
                        .filter(function (r) { return r.settlementStatus === 'queued'; })
                        .reduce(function (sum, r) { return sum + parseFloat(r.creditAmount.toString()); }, 0);
                    paid = redemptions
                        .filter(function (r) { return r.settlementStatus === 'paid'; })
                        .reduce(function (sum, r) { return sum + parseFloat(r.creditAmount.toString()); }, 0);
                    return [2 /*return*/, {
                            pendingCredits: pending,
                            queuedForSettlement: queued,
                            alreadyPaid: paid,
                            totalRedemptions: pending + queued + paid,
                            transactionCount: redemptions.length,
                        }];
                case 2:
                    error_3 = _a.sent();
                    console.error('[redemptionService] Error getting credit summary:', error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get redemption history with user details
 *
 * Used for restaurant transaction history view
 */
export function getRedemptionHistory(restaurantId_1) {
    return __awaiter(this, arguments, void 0, function (restaurantId, limit, offset) {
        var redemptions, withUsers, error_4;
        var _this = this;
        if (limit === void 0) { limit = 50; }
        if (offset === void 0) { offset = 0; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurantCreditRedemptions)
                            .where(eq(restaurantCreditRedemptions.restaurantId, restaurantId))
                            .limit(limit)
                            .offset(offset)];
                case 1:
                    redemptions = _a.sent();
                    return [4 /*yield*/, Promise.all(redemptions.map(function (r) { return __awaiter(_this, void 0, void 0, function () {
                            var user;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, db
                                            .select()
                                            .from(users)
                                            .where(eq(users.id, r.userId))
                                            .limit(1)];
                                    case 1:
                                        user = (_a.sent())[0];
                                        return [2 /*return*/, __assign(__assign({}, r), { user: user })];
                                }
                            });
                        }); }))];
                case 2:
                    withUsers = _a.sent();
                    return [2 /*return*/, withUsers];
                case 3:
                    error_4 = _a.sent();
                    console.error('[redemptionService] Error getting history:', error_4);
                    throw error_4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Flag redemption for dispute (7-day window)
 *
 * Restaurant can flag if fraudulent, duplicate, or mistaken
 */
export function flagRedemptionForDispute(redemptionId, reason) {
    return __awaiter(this, void 0, void 0, function () {
        var redemption, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurantCreditRedemptions)
                            .where(eq(restaurantCreditRedemptions.id, redemptionId))
                            .limit(1)];
                case 1:
                    redemption = (_a.sent())[0];
                    if (!redemption) {
                        throw new Error('Redemption not found');
                    }
                    // Check if still within dispute window
                    if (!redemption.disputeUntil || new Date() > new Date(redemption.disputeUntil)) {
                        throw new Error('Dispute window expired (7 days). Contact admin for override.');
                    }
                    // For MVP: just log the dispute flag
                    // In full version: create dispute record and hold settlement
                    console.log('[Phase R1] Redemption flagged for dispute:', {
                        redemptionId: redemptionId,
                        reason: reason,
                        restaurantId: redemption.restaurantId,
                    });
                    return [2 /*return*/, {
                            success: true,
                            message: 'Dispute flagged. Admin will review within 24 hours.',
                            redemptionId: redemptionId,
                        }];
                case 2:
                    error_5 = _a.sent();
                    console.error('[redemptionService] Error flagging dispute:', error_5);
                    throw error_5;
                case 3: return [2 /*return*/];
            }
        });
    });
}
export default {
    redeemCreditAtRestaurant: redeemCreditAtRestaurant,
    getRestaurantRedemptions: getRestaurantRedemptions,
    getRestaurantCreditSummary: getRestaurantCreditSummary,
    getRedemptionHistory: getRedemptionHistory,
    flagRedemptionForDispute: flagRedemptionForDispute,
};

