/**
 * Affiliate Routes
 *
 * Public routes for:
 * - Affiliate link tracking (ref param)
 * - Commission dashboards
 * - Withdrawal requests
 * - Commission history
 */
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { Router } from 'express';
import { db } from './db.js';
import { isAuthenticated } from './unifiedAuth.js';
import affiliateService from './affiliateService.js';
import emptyCountyService from './emptyCountyService.js';
import { logAudit } from './auditLogger.js';
import { eq, desc, sql, and, sum } from 'drizzle-orm';
import { affiliateWithdrawals, affiliateLinks, affiliateCommissions, affiliateShareEvents, creditLedger, referralClicks, referrals, } from '@shared/schema';
import { ensureAffiliateTag, setAffiliateTag } from "./affiliateTagService.js";
import { appendReferralParam } from "./referralService.js";
import { getUserCreditBalance } from "./creditService.js";
var router = Router();
/**
 * GET /api/affiliate/tag
 * Get or create the user's affiliate tag
 */
router.get('/tag', isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, tag, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({ error: 'Not authenticated' })];
                }
                return [4 /*yield*/, ensureAffiliateTag(userId)];
            case 1:
                tag = _b.sent();
                res.json({ tag: tag, sharePath: "/ref/".concat(tag) });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Failed to fetch affiliate tag:', error_1);
                res.status(500).json({ error: error_1.message || 'Failed to fetch tag' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * PUT /api/affiliate/tag
 * Update the user's affiliate tag
 */
router.put('/tag', isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, tag, updated, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                tag = req.body.tag;
                if (!userId || !tag) {
                    return [2 /*return*/, res.status(400).json({ error: 'Tag is required' })];
                }
                return [4 /*yield*/, setAffiliateTag(userId, tag)];
            case 1:
                updated = _b.sent();
                res.json({ tag: updated, sharePath: "/ref/".concat(updated) });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                console.error('Failed to update affiliate tag:', error_2);
                res.status(400).json({ error: error_2.message || 'Failed to update tag' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/affiliate/generate-link
 * Create an affiliate link for any shared resource
 */
router.post('/generate-link', isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, baseUrl, resourceType, resourceId, link, error_3;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                _a = req.body, baseUrl = _a.baseUrl, resourceType = _a.resourceType, resourceId = _a.resourceId;
                if (!userId || !baseUrl || !resourceType) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing required fields' })];
                }
                return [4 /*yield*/, affiliateService.createAffiliateLink(userId, resourceType, baseUrl, resourceId)];
            case 1:
                link = _c.sent();
                return [4 /*yield*/, logAudit(userId, 'affiliate_link_created', 'affiliate_link', link.id, req.ip || 'unknown', req.get('user-agent') || 'unknown', { resourceType: resourceType, baseUrl: baseUrl })];
            case 2:
                _c.sent();
                res.json(link);
                return [3 /*break*/, 4];
            case 3:
                error_3 = _c.sent();
                console.error('Failed to generate affiliate link:', error_3);
                res.status(500).json({ error: 'Failed to generate link' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/affiliate/click/:code
 * Track click on affiliate link (public, no auth required)
 * Stores tracking data and redirects to original URL
 */
router.get('/click/:code', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var code, sessionId, click, link, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                code = req.params.code;
                sessionId = req.sessionID || "anonymous-".concat(Date.now());
                return [4 /*yield*/, affiliateService.trackAffiliateClick(code, req.ip || 'unknown', req.get('user-agent') || 'unknown', req.get('referer') || 'direct', sessionId)];
            case 1:
                click = _a.sent();
                if (!click) {
                    return [2 /*return*/, res.status(404).json({ error: 'Link not found' })];
                }
                return [4 /*yield*/, db
                        .select()
                        .from(affiliateLinks)
                        .where(eq(affiliateLinks.id, click.affiliateLinkId))
                        .limit(1)];
            case 2:
                link = (_a.sent())[0];
                if (!link) {
                    return [2 /*return*/, res.status(404).json({ error: 'Link not found' })];
                }
                // Redirect to original URL
                res.redirect(link.sourceUrl);
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                console.error('Failed to track affiliate click:', error_4);
                res.status(500).json({ error: 'Failed to track click' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/affiliate/stats
 * Get affiliate dashboard stats for logged-in user
 */
router.get('/stats', isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, stats, baseUrl_1, affiliateTag_1, creditBalance, totalEarnedRows, totalEarnedRaw, totalEarned, totalWithdrawnRows, totalWithdrawnRaw, totalWithdrawn, pendingWithdrawalsRows, pendingWithdrawalsRaw, pendingWithdrawals, totalSpentRows, totalSpentRaw, totalSpent, referralClicksCount, referralConversions, shareCountRows, shareCount, shareRows, shareLinks, error_5;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return __generator(this, function (_m) {
        switch (_m.label) {
            case 0:
                _m.trys.push([0, 12, , 13]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({ error: 'Not authenticated' })];
                }
                return [4 /*yield*/, affiliateService.getAffiliateStats(userId)];
            case 1:
                stats = _m.sent();
                baseUrl_1 = "".concat(req.protocol, "://").concat(req.get("host"));
                return [4 /*yield*/, ensureAffiliateTag(userId)];
            case 2:
                affiliateTag_1 = _m.sent();
                return [4 /*yield*/, getUserCreditBalance(userId)];
            case 3:
                creditBalance = _m.sent();
                return [4 /*yield*/, db
                        .select({ total: sum(creditLedger.amount) })
                        .from(creditLedger)
                        .where(eq(creditLedger.userId, userId))];
            case 4:
                totalEarnedRows = _m.sent();
                totalEarnedRaw = ((_b = totalEarnedRows[0]) === null || _b === void 0 ? void 0 : _b.total)
                    ? parseFloat(totalEarnedRows[0].total.toString())
                    : 0;
                totalEarned = Math.max(0, totalEarnedRaw);
                return [4 /*yield*/, db
                        .select({ total: sum(creditLedger.amount) })
                        .from(creditLedger)
                        .where(and(eq(creditLedger.userId, userId), eq(creditLedger.redeemedFor, "cash_payout")))];
            case 5:
                totalWithdrawnRows = _m.sent();
                totalWithdrawnRaw = ((_c = totalWithdrawnRows[0]) === null || _c === void 0 ? void 0 : _c.total)
                    ? parseFloat(totalWithdrawnRows[0].total.toString())
                    : 0;
                totalWithdrawn = Math.abs(Math.min(0, totalWithdrawnRaw));
                return [4 /*yield*/, db
                        .select({ total: sum(creditLedger.amount) })
                        .from(creditLedger)
                        .where(and(eq(creditLedger.userId, userId), eq(creditLedger.redeemedFor, "cash_payout_request")))];
            case 6:
                pendingWithdrawalsRows = _m.sent();
                pendingWithdrawalsRaw = ((_d = pendingWithdrawalsRows[0]) === null || _d === void 0 ? void 0 : _d.total)
                    ? parseFloat(pendingWithdrawalsRows[0].total.toString())
                    : 0;
                pendingWithdrawals = Math.abs(Math.min(0, pendingWithdrawalsRaw));
                return [4 /*yield*/, db
                        .select({ total: sum(creditLedger.amount) })
                        .from(creditLedger)
                        .where(and(eq(creditLedger.userId, userId), eq(creditLedger.redeemedFor, "restaurant")))];
            case 7:
                totalSpentRows = _m.sent();
                totalSpentRaw = ((_e = totalSpentRows[0]) === null || _e === void 0 ? void 0 : _e.total)
                    ? parseFloat(totalSpentRows[0].total.toString())
                    : 0;
                totalSpent = Math.abs(Math.min(0, totalSpentRaw));
                return [4 /*yield*/, db
                        .select({ count: sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["count(*)"], ["count(*)"]))).mapWith(Number) })
                        .from(referralClicks)
                        .where(eq(referralClicks.affiliateUserId, userId))];
            case 8:
                referralClicksCount = _m.sent();
                return [4 /*yield*/, db
                        .select({ count: sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["count(*)"], ["count(*)"]))).mapWith(Number) })
                        .from(referrals)
                        .where(and(eq(referrals.affiliateUserId, userId), sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " in ('signed_up','activated','paid')"], ["", " in ('signed_up','activated','paid')"])), referrals.status)))];
            case 9:
                referralConversions = _m.sent();
                return [4 /*yield*/, db
                        .select({
                        count: sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["count(distinct ", ")"], ["count(distinct ", ")"])), affiliateShareEvents.sourcePath).mapWith(Number),
                    })
                        .from(affiliateShareEvents)
                        .where(eq(affiliateShareEvents.affiliateUserId, userId))];
            case 10:
                shareCountRows = _m.sent();
                shareCount = (_g = (_f = shareCountRows[0]) === null || _f === void 0 ? void 0 : _f.count) !== null && _g !== void 0 ? _g : 0;
                return [4 /*yield*/, db
                        .select({
                        id: affiliateShareEvents.id,
                        sourcePath: affiliateShareEvents.sourcePath,
                        createdAt: affiliateShareEvents.createdAt,
                    })
                        .from(affiliateShareEvents)
                        .where(eq(affiliateShareEvents.affiliateUserId, userId))
                        .orderBy(desc(affiliateShareEvents.createdAt))
                        .limit(5)];
            case 11:
                shareRows = _m.sent();
                shareLinks = shareRows.map(function (row) {
                    var path = row.sourcePath.startsWith("/")
                        ? row.sourcePath
                        : "/".concat(row.sourcePath);
                    var fullUrl = appendReferralParam("".concat(baseUrl_1).concat(path), affiliateTag_1);
                    return {
                        id: row.id,
                        code: row.sourcePath,
                        resourceType: "page",
                        resourceId: null,
                        sourceUrl: path,
                        fullUrl: fullUrl,
                        clickCount: 0,
                        conversions: 0,
                        createdAt: row.createdAt,
                    };
                });
                stats.wallet = {
                    totalEarned: totalEarned,
                    availableBalance: creditBalance,
                    pendingCommissions: pendingWithdrawals,
                    totalWithdrawn: totalWithdrawn,
                    totalSpent: totalSpent,
                };
                stats.stats.totalLinks = Math.max(stats.stats.totalLinks, shareCount);
                stats.stats.totalClicks = (_j = (_h = referralClicksCount[0]) === null || _h === void 0 ? void 0 : _h.count) !== null && _j !== void 0 ? _j : stats.stats.totalClicks;
                stats.stats.totalConversions = (_l = (_k = referralConversions[0]) === null || _k === void 0 ? void 0 : _k.count) !== null && _l !== void 0 ? _l : stats.stats.totalConversions;
                stats.stats.conversionRate =
                    stats.stats.totalClicks > 0
                        ? ((stats.stats.totalConversions / stats.stats.totalClicks) * 100).toFixed(2)
                        : "0";
                if (shareLinks.length > 0) {
                    stats.recentLinks = shareLinks;
                }
                res.json(stats);
                return [3 /*break*/, 13];
            case 12:
                error_5 = _m.sent();
                console.error('Failed to fetch affiliate stats:', error_5);
                res.status(500).json({ error: 'Failed to fetch stats' });
                return [3 /*break*/, 13];
            case 13: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/affiliate/withdrawals
 * Get withdrawal history for the logged-in affiliate
 */
router.get('/withdrawals', isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, limit, withdrawals, error_6;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({ error: 'Not authenticated' })];
                }
                limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
                return [4 /*yield*/, db
                        .select({
                        id: affiliateWithdrawals.id,
                        amount: affiliateWithdrawals.amount,
                        method: affiliateWithdrawals.method,
                        status: affiliateWithdrawals.status,
                        methodDetails: affiliateWithdrawals.methodDetails,
                        requestedAt: affiliateWithdrawals.requestedAt,
                        approvedAt: affiliateWithdrawals.approvedAt,
                        paidAt: affiliateWithdrawals.paidAt,
                        rejectedAt: affiliateWithdrawals.rejectedAt,
                        notes: affiliateWithdrawals.notes,
                    })
                        .from(affiliateWithdrawals)
                        .where(eq(affiliateWithdrawals.userId, userId))
                        .orderBy(desc(affiliateWithdrawals.requestedAt))
                        .limit(limit)];
            case 1:
                withdrawals = _b.sent();
                res.json({ withdrawals: withdrawals });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _b.sent();
                console.error('Failed to fetch affiliate withdrawals:', error_6);
                res.status(500).json({ error: 'Failed to fetch withdrawals' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/affiliate/commissions
 * Get commission history with pagination
 */
router.get('/commissions', isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, page, limit, offset, commissions, total, error_7;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 20;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({ error: 'Not authenticated' })];
                }
                offset = (page - 1) * limit;
                return [4 /*yield*/, db
                        .select()
                        .from(affiliateCommissions)
                        .where(eq(affiliateCommissions.affiliateUserId, userId))
                        .orderBy(desc(affiliateCommissions.createdAt))
                        .offset(offset)
                        .limit(limit)];
            case 1:
                commissions = _b.sent();
                return [4 /*yield*/, db
                        .select()
                        .from(affiliateCommissions)
                        .where(eq(affiliateCommissions.affiliateUserId, userId))];
            case 2:
                total = _b.sent();
                res.json({
                    commissions: commissions,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total.length,
                        pages: Math.ceil(total.length / limit),
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _b.sent();
                console.error('Failed to fetch commissions:', error_7);
                res.status(500).json({ error: 'Failed to fetch commissions' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/affiliate/withdraw
 * Request a withdrawal (cash out)
 */
router.post('/withdraw', isAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId_1, _a, amount, method_1, methodDetails_1, notes_1, amountNum_1, balance, withdrawal, error_8;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                userId_1 = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                _a = req.body, amount = _a.amount, method_1 = _a.method, methodDetails_1 = _a.methodDetails, notes_1 = _a.notes;
                if (!userId_1 || !amount || !method_1) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing required fields' })];
                }
                amountNum_1 = parseFloat(amount);
                if (amountNum_1 < 5) {
                    return [2 /*return*/, res.status(400).json({ error: 'Minimum withdrawal is $5' })];
                }
                if (!['paypal', 'ach', 'other'].includes(method_1)) {
                    return [2 /*return*/, res.status(400).json({ error: 'Invalid payout method' })];
                }
                if (!methodDetails_1 || typeof methodDetails_1 !== "object") {
                    return [2 /*return*/, res.status(400).json({ error: 'Payout method details required' })];
                }
                return [4 /*yield*/, getUserCreditBalance(userId_1)];
            case 1:
                balance = _c.sent();
                if (balance < amountNum_1) {
                    return [2 /*return*/, res.status(400).json({ error: 'Insufficient balance' })];
                }
                return [4 /*yield*/, db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var created, ledgerEntry;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, tx
                                        .insert(affiliateWithdrawals)
                                        .values({
                                        userId: userId_1,
                                        amount: amountNum_1.toString(),
                                        method: method_1,
                                        methodDetails: methodDetails_1,
                                        status: "pending",
                                        notes: notes_1 || null,
                                    })
                                        .returning()];
                                case 1:
                                    created = (_a.sent())[0];
                                    return [4 /*yield*/, tx
                                            .insert(creditLedger)
                                            .values({
                                            userId: userId_1,
                                            amount: (-amountNum_1).toString(),
                                            sourceType: "cash_payout",
                                            sourceId: created.id,
                                            redeemedAt: new Date(),
                                            redeemedFor: "cash_payout_request",
                                        })
                                            .returning()];
                                case 2:
                                    ledgerEntry = (_a.sent())[0];
                                    return [4 /*yield*/, tx
                                            .update(affiliateWithdrawals)
                                            .set({ creditLedgerId: ledgerEntry.id })
                                            .where(eq(affiliateWithdrawals.id, created.id))];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/, __assign(__assign({}, created), { creditLedgerId: ledgerEntry.id })];
                            }
                        });
                    }); })];
            case 2:
                withdrawal = _c.sent();
                return [4 /*yield*/, logAudit(userId_1, 'affiliate_withdrawal_requested', 'withdrawal', withdrawal.id, req.ip || 'unknown', req.get('user-agent') || 'unknown', { amount: amountNum_1, method: method_1 })];
            case 3:
                _c.sent();
                res.json(withdrawal);
                return [3 /*break*/, 5];
            case 4:
                error_8 = _c.sent();
                console.error('Failed to create withdrawal:', error_8);
                res.status(500).json({ error: 'Failed to create withdrawal' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/affiliate/submit-restaurant
 * Community submission for empty counties
 */
router.post('/submit-restaurant', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, restaurantName, address, county, state, website, phoneNumber, category, latitude, longitude, description, photoUrl, result, error_9;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                userId = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || null;
                _a = req.body, restaurantName = _a.restaurantName, address = _a.address, county = _a.county, state = _a.state, website = _a.website, phoneNumber = _a.phoneNumber, category = _a.category, latitude = _a.latitude, longitude = _a.longitude, description = _a.description, photoUrl = _a.photoUrl;
                if (!restaurantName || !county || !state) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing required fields' })];
                }
                return [4 /*yield*/, emptyCountyService.submitRestaurant(userId, restaurantName, address, county, state, {
                        website: website,
                        phoneNumber: phoneNumber,
                        category: category,
                        latitude: latitude,
                        longitude: longitude,
                        description: description,
                        photoUrl: photoUrl,
                    })];
            case 1:
                result = _c.sent();
                if (!userId) return [3 /*break*/, 3];
                return [4 /*yield*/, logAudit(userId, 'restaurant_submitted', 'submission', result.submission.id, req.ip || 'unknown', req.get('user-agent') || 'unknown', { restaurantName: restaurantName, county: county })];
            case 2:
                _c.sent();
                _c.label = 3;
            case 3:
                res.json(result);
                return [3 /*break*/, 5];
            case 4:
                error_9 = _c.sent();
                console.error('Failed to submit restaurant:', error_9);
                res.status(500).json({ error: 'Failed to submit restaurant' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/affiliate/county/empty-check
 * Check if a county has content (no affiliate auth needed)
 */
router.get('/county/empty-check', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, county, state, isEmpty, metrics, error_10;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.query, county = _a.county, state = _a.state;
                if (!county || !state) {
                    return [2 /*return*/, res.status(400).json({ error: 'County and state required' })];
                }
                return [4 /*yield*/, emptyCountyService.isCountyEmpty(county, state)];
            case 1:
                isEmpty = _b.sent();
                return [4 /*yield*/, emptyCountyService.getCountyEngagementMetrics(county, state)];
            case 2:
                metrics = _b.sent();
                res.json({
                    isEmpty: isEmpty,
                    metrics: metrics,
                });
                return [3 /*break*/, 4];
            case 3:
                error_10 = _b.sent();
                console.error('Failed to check county:', error_10);
                res.status(500).json({ error: 'Failed to check county' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/affiliate/county/fallback
 * Get content fallback chain for empty county
 */
router.get('/county/fallback', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, county, state, category, content, error_11;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, county = _a.county, state = _a.state, category = _a.category;
                if (!county || !state) {
                    return [2 /*return*/, res.status(400).json({ error: 'County and state required' })];
                }
                return [4 /*yield*/, emptyCountyService.getCountyContentFallback(county, state, category)];
            case 1:
                content = _b.sent();
                res.json(content);
                return [3 /*break*/, 3];
            case 2:
                error_11 = _b.sent();
                console.error('Failed to fetch fallback content:', error_11);
                res.status(500).json({ error: 'Failed to fetch content' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
export default router;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;

