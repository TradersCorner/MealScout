/**
 * PHASE R1: Restaurant Credit Redemption Routes
 *
 * Endpoints:
 * POST   /api/restaurants/:restaurantId/accept-credits  - Accept credit payment
 * GET    /api/restaurants/:restaurantId/redemptions     - View credit history
 * GET    /api/restaurants/:restaurantId/credit-summary  - Pending/settled totals
 * POST   /api/redemptions/:redemptionId/dispute         - Flag for dispute
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
import { Router } from 'express';
import { isAuthenticated } from './unifiedAuth.js';
import { redeemCreditAtRestaurant, getRestaurantCreditSummary, getRedemptionHistory, flagRedemptionForDispute, } from './redemptionService.js';
import { getUserCreditBalance } from './creditService.js';
import { z } from 'zod';
var router = Router();
// Validation schemas
var acceptCreditsSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    creditAmount: z.number().positive('Credit amount must be positive'),
    orderReference: z.string().optional(),
    notes: z.string().optional(),
});
var disputeSchema = z.object({
    reason: z.string().min(10, 'Dispute reason must be at least 10 characters'),
});
/**
 * POST /api/restaurants/:restaurantId/accept-credits
 *
 * Restaurant submits credit redemption form
 * Creates immutable ledger entries for credit deduction
 */
router.get('/users/:userId/balance', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, balance, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                return [4 /*yield*/, getUserCreditBalance(userId)];
            case 1:
                balance = _a.sent();
                res.json({
                    userId: userId,
                    balance: balance,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('[redemptionRoutes] Error getting user balance:', error_1);
                res.status(500).json({
                    error: 'Failed to fetch user balance',
                    message: error_1 instanceof Error ? error_1.message : 'Unknown error',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/restaurants/:restaurantId/accept-credits
 *
 * Restaurant submits credit redemption form
 * Creates immutable ledger entries for credit deduction
 */
router.post('/:restaurantId/accept-credits', isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var restaurantId, validation, _a, userId, creditAmount, orderReference, notes, restaurantOwnerId, userBalance, _b, redemption, creditEntry, updatedBalance, error_2;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 4, , 5]);
                restaurantId = req.params.restaurantId;
                validation = acceptCreditsSchema.safeParse(req.body);
                if (!validation.success) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Validation error',
                            details: validation.error.flatten(),
                        })];
                }
                _a = validation.data, userId = _a.userId, creditAmount = _a.creditAmount, orderReference = _a.orderReference, notes = _a.notes;
                restaurantOwnerId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
                return [4 /*yield*/, getUserCreditBalance(userId)];
            case 1:
                userBalance = _d.sent();
                if (userBalance < creditAmount) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Insufficient user credits',
                            available: userBalance,
                            requested: creditAmount,
                        })];
                }
                return [4 /*yield*/, redeemCreditAtRestaurant(restaurantId, userId, creditAmount, orderReference, notes)];
            case 2:
                _b = _d.sent(), redemption = _b.redemption, creditEntry = _b.creditEntry;
                return [4 /*yield*/, getUserCreditBalance(userId)];
            case 3:
                updatedBalance = _d.sent();
                res.status(201).json({
                    success: true,
                    redemption: {
                        id: redemption.id,
                        restaurantId: redemption.restaurantId,
                        userId: redemption.userId,
                        creditAmount: redemption.creditAmount,
                        orderReference: redemption.orderReference,
                        status: redemption.settlementStatus,
                        disputeUntil: redemption.disputeUntil,
                        createdAt: redemption.redeemedAt,
                    },
                    creditEntry: {
                        id: creditEntry.id,
                        userId: creditEntry.userId,
                        amountDeducted: creditAmount,
                        source: 'redemption',
                    },
                    userBalance: {
                        previous: userBalance,
                        updated: updatedBalance,
                    },
                    message: 'Credit redeemed successfully. User balance updated.',
                });
                console.log('[Phase R1 API] Credit accepted:', {
                    redemptionId: redemption.id,
                    restaurantId: restaurantId,
                    creditAmount: creditAmount,
                });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _d.sent();
                console.error('[redemptionRoutes] Error accepting credits:', error_2);
                res.status(500).json({
                    error: 'Failed to redeem credit',
                    message: error_2 instanceof Error ? error_2.message : 'Unknown error',
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/restaurants/:restaurantId/redemptions
 *
 * Restaurant dashboard: View all credit redemptions
 * Optional filter by status (pending|queued|paid)
 */
router.get('/:restaurantId/redemptions', isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var restaurantId, status_1, redemptions, filtered, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                restaurantId = req.params.restaurantId;
                status_1 = req.query.status;
                return [4 /*yield*/, getRedemptionHistory(restaurantId)];
            case 1:
                redemptions = _a.sent();
                filtered = status_1
                    ? redemptions.filter(function (r) { return r.settlementStatus === status_1; })
                    : redemptions;
                res.json({
                    restaurantId: restaurantId,
                    count: filtered.length,
                    redemptions: filtered.map(function (r) {
                        var _a;
                        return ({
                            id: r.id,
                            userId: r.userId,
                            userEmail: (_a = r.user) === null || _a === void 0 ? void 0 : _a.email,
                            creditAmount: r.creditAmount,
                            orderReference: r.orderReference,
                            status: r.settlementStatus,
                            redeemedAt: r.redeemedAt,
                            disputeUntil: r.disputeUntil,
                            batchId: r.settlementBatchId,
                        });
                    }),
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('[redemptionRoutes] Error fetching redemptions:', error_3);
                res.status(500).json({
                    error: 'Failed to fetch redemptions',
                    message: error_3 instanceof Error ? error_3.message : 'Unknown error',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/restaurants/:restaurantId/credit-summary
 *
 * Restaurant dashboard: Summary of pending, queued, and paid credits
 */
router.get('/:restaurantId/credit-summary', isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var restaurantId, summary, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                restaurantId = req.params.restaurantId;
                return [4 /*yield*/, getRestaurantCreditSummary(restaurantId)];
            case 1:
                summary = _a.sent();
                res.json({
                    restaurantId: restaurantId,
                    summary: {
                        pending: {
                            amount: summary.pendingCredits,
                            description: 'Credits redeemed, awaiting weekly settlement',
                        },
                        queued: {
                            amount: summary.queuedForSettlement,
                            description: 'Queued for this week\'s settlement batch',
                        },
                        paid: {
                            amount: summary.alreadyPaid,
                            description: 'Already settled via Stripe payout',
                        },
                        totals: {
                            totalRedeemed: summary.totalRedemptions,
                            transactionCount: summary.transactionCount,
                        },
                    },
                    nextSettlement: 'Every Sunday UTC (Phase R2)',
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('[redemptionRoutes] Error fetching credit summary:', error_4);
                res.status(500).json({
                    error: 'Failed to fetch credit summary',
                    message: error_4 instanceof Error ? error_4.message : 'Unknown error',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/redemptions/:redemptionId/dispute
 *
 * Restaurant flags redemption for dispute (within 7-day window)
 * Triggers admin review for potential reversal
 */
router.post('/:redemptionId/dispute', isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var redemptionId, validation, result, error_5, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                redemptionId = req.params.redemptionId;
                validation = disputeSchema.safeParse(req.body);
                if (!validation.success) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Validation error',
                            details: validation.error.flatten(),
                        })];
                }
                return [4 /*yield*/, flagRedemptionForDispute(redemptionId, validation.data.reason)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('[redemptionRoutes] Error flagging dispute:', error_5);
                errorMessage = error_5 instanceof Error ? error_5.message : 'Unknown error';
                if (errorMessage.includes('Dispute window expired')) {
                    return [2 /*return*/, res.status(410).json({
                            error: 'Dispute window expired',
                            message: errorMessage,
                        })];
                }
                res.status(500).json({
                    error: 'Failed to flag dispute',
                    message: errorMessage,
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
export default router;

