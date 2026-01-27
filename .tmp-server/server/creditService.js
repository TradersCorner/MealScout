/**
 * PHASE 4: Credit System Service
 *
 * Manages user credits (never stores balance directly)
 * Balance is calculated as: SUM(creditLedger.amount WHERE userId = x AND redeemedAt IS NULL)
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
import { db } from './db.js';
import { creditLedger, affiliateCommissionLedger } from '@shared/schema';
import { eq, isNull, sum, and, inArray } from 'drizzle-orm';
/**
 * Get user's available credit balance
 *
 * Sums all unredeemed credits for a user
 */
export function getUserCreditBalance(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var result, balance, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select({ total: sum(creditLedger.amount) })
                            .from(creditLedger)
                            .where(and(eq(creditLedger.userId, userId), isNull(creditLedger.redeemedAt)))];
                case 1:
                    result = _b.sent();
                    balance = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.total) ? parseFloat(result[0].total.toString()) : 0;
                    return [2 /*return*/, balance];
                case 2:
                    error_1 = _b.sent();
                    console.error('[creditService] Error getting user credit balance:', error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Add credits to a user's account
 *
 * Called when:
 * - Commission is earned (Phase 3)
 * - Admin adjusts credits
 * - Referral bonuses
 */
export function addCredit(userId, amount, sourceType, sourceId) {
    return __awaiter(this, void 0, void 0, function () {
        var credit, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.insert(creditLedger).values({
                            userId: userId,
                            amount: amount.toString(),
                            sourceType: sourceType,
                            sourceId: sourceId,
                        }).returning()];
                case 1:
                    credit = _a.sent();
                    console.log('[Phase 4] Credit added:', {
                        userId: userId,
                        amount: amount,
                        sourceType: sourceType,
                        sourceId: sourceId,
                    });
                    return [2 /*return*/, credit[0]];
                case 2:
                    error_2 = _a.sent();
                    console.error('[creditService] Error adding credit:', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
export function debitCredit(userId, amount, sourceType, sourceId, redeemedFor) {
    return __awaiter(this, void 0, void 0, function () {
        var credit, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (amount <= 0) {
                        throw new Error("Debit amount must be positive");
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db
                            .insert(creditLedger)
                            .values({
                            userId: userId,
                            amount: (-amount).toString(),
                            sourceType: sourceType,
                            sourceId: sourceId,
                            redeemedAt: new Date(),
                            redeemedFor: redeemedFor || null,
                        })
                            .returning()];
                case 2:
                    credit = _a.sent();
                    console.log("[Phase 4] Credit debited:", {
                        userId: userId,
                        amount: amount,
                        sourceType: sourceType,
                        sourceId: sourceId,
                        redeemedFor: redeemedFor,
                    });
                    return [2 /*return*/, credit[0]];
                case 3:
                    error_3 = _a.sent();
                    console.error("[creditService] Error debiting credit:", error_3);
                    throw error_3;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Mark credits as redeemed
 *
 * Called when user redeems credits for:
 * - Cash payout
 * - Store credit with restaurant
 * - Donations etc
 */
export function redeemCredits(creditIds, redeemedFor) {
    return __awaiter(this, void 0, void 0, function () {
        var updated, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .update(creditLedger)
                            .set({
                            redeemedAt: new Date(),
                            redeemedFor: redeemedFor,
                        })
                            .where(creditIds.length === 1 ? eq(creditLedger.id, creditIds[0]) : inArray(creditLedger.id, creditIds))
                            .returning()];
                case 1:
                    updated = _a.sent();
                    console.log('[Phase 4] Credits redeemed:', {
                        count: updated.length,
                        redeemedFor: redeemedFor,
                    });
                    return [2 /*return*/, updated];
                case 2:
                    error_4 = _a.sent();
                    console.error('[creditService] Error redeeming credits:', error_4);
                    throw error_4;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get credit history for a user
 */
export function getUserCreditHistory(userId_1) {
    return __awaiter(this, arguments, void 0, function (userId, limit) {
        var history_1, error_5;
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db
                            .select()
                            .from(creditLedger)
                            .where(eq(creditLedger.userId, userId))
                            .orderBy(creditLedger.createdAt)
                            .limit(limit)];
                case 1:
                    history_1 = _a.sent();
                    return [2 /*return*/, history_1];
                case 2:
                    error_5 = _a.sent();
                    console.error('[creditService] Error getting credit history:', error_5);
                    throw error_5;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * PHASE 3 + 4 Integration: Create credit entry from commission
 *
 * When a commission is earned, automatically create a credit entry
 */
export function createCreditFromCommission(affiliateUserId, commissionId, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, addCredit(affiliateUserId, amount, 'commission', commissionId)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_6 = _a.sent();
                    console.error('[creditService] Error creating credit from commission:', error_6);
                    throw error_6;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Calculate and apply all pending commissions as credits
 *
 * Called periodically (e.g., daily or on-demand)
 */
export function processPendingCommissionsToCredits() {
    return __awaiter(this, void 0, void 0, function () {
        var pendingCommissions, processed, _i, pendingCommissions_1, commission, existingCredit, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, db.select().from(affiliateCommissionLedger)];
                case 1:
                    pendingCommissions = _a.sent();
                    processed = 0;
                    _i = 0, pendingCommissions_1 = pendingCommissions;
                    _a.label = 2;
                case 2:
                    if (!(_i < pendingCommissions_1.length)) return [3 /*break*/, 6];
                    commission = pendingCommissions_1[_i];
                    return [4 /*yield*/, db
                            .select()
                            .from(creditLedger)
                            .where(and(eq(creditLedger.sourceType, 'commission'), eq(creditLedger.sourceId, commission.id)))
                            .limit(1)];
                case 3:
                    existingCredit = (_a.sent())[0];
                    if (!!existingCredit) return [3 /*break*/, 5];
                    return [4 /*yield*/, createCreditFromCommission(commission.affiliateUserId, commission.id, parseFloat(commission.amount.toString()))];
                case 4:
                    _a.sent();
                    processed++;
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6:
                    console.log('[creditService] Processed pending commissions to credits:', {
                        processed: processed,
                    });
                    return [2 /*return*/, processed];
                case 7:
                    error_7 = _a.sent();
                    console.error('[creditService] Error processing pending commissions:', error_7);
                    throw error_7;
                case 8: return [2 /*return*/];
            }
        });
    });
}
export default {
    getUserCreditBalance: getUserCreditBalance,
    addCredit: addCredit,
    debitCredit: debitCredit,
    redeemCredits: redeemCredits,
    getUserCreditHistory: getUserCreditHistory,
    createCreditFromCommission: createCreditFromCommission,
    processPendingCommissionsToCredits: processPendingCommissionsToCredits,
};

