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
import { affiliateCommissionLedger, users } from "@shared/schema";
import { and, eq, inArray } from "drizzle-orm";
function getAffiliateRecipientsForUser(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var owner, affiliateIds, uniqueIds, affiliates, typedAffiliates, map;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .select({
                        affiliateCloserUserId: users.affiliateCloserUserId,
                        affiliateBookerUserId: users.affiliateBookerUserId,
                    })
                        .from(users)
                        .where(eq(users.id, userId))
                        .limit(1)];
                case 1:
                    owner = (_a.sent())[0];
                    if (!owner)
                        return [2 /*return*/, []];
                    affiliateIds = [owner.affiliateCloserUserId, owner.affiliateBookerUserId]
                        .filter(function (id) { return Boolean(id); });
                    uniqueIds = Array.from(new Set(affiliateIds));
                    if (uniqueIds.length === 0)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, db
                            .select({
                            id: users.id,
                            userType: users.userType,
                            affiliatePercent: users.affiliatePercent,
                        })
                            .from(users)
                            .where(uniqueIds.length === 1
                            ? eq(users.id, uniqueIds[0])
                            : inArray(users.id, uniqueIds))];
                case 2:
                    affiliates = _a.sent();
                    typedAffiliates = affiliates;
                    map = new Map(typedAffiliates.map(function (row) { return [row.id, row]; }));
                    return [2 /*return*/, uniqueIds
                            .map(function (id) { return map.get(id); })
                            .filter(function (row) { return Boolean(row); })
                            .filter(function (row) { return row.userType !== "admin" && row.userType !== "super_admin"; })
                            .map(function (row) {
                            var _a;
                            return ({
                                affiliateUserId: row.id,
                                percent: Math.max(Number((_a = row.affiliatePercent) !== null && _a !== void 0 ? _a : 5), 0),
                            });
                        })
                            .filter(function (row) { return row.percent > 0; })];
            }
        });
    });
}
function createCommissionEntry(affiliateUserId, amountCents, percent, commissionSource, referenceId, restaurantId) {
    return __awaiter(this, void 0, void 0, function () {
        var amount, existing, commission, createCreditFromCommission, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    amount = (amountCents / 100) * (percent / 100);
                    if (amount <= 0)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, db
                            .select({ id: affiliateCommissionLedger.id })
                            .from(affiliateCommissionLedger)
                            .where(and(eq(affiliateCommissionLedger.affiliateUserId, affiliateUserId), eq(affiliateCommissionLedger.commissionSource, commissionSource), eq(affiliateCommissionLedger.stripeInvoiceId, referenceId)))
                            .limit(1)];
                case 1:
                    existing = _a.sent();
                    if (existing.length > 0)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, db
                            .insert(affiliateCommissionLedger)
                            .values({
                            affiliateUserId: affiliateUserId,
                            restaurantId: restaurantId || null,
                            amount: amount.toString(),
                            commissionPercent: percent,
                            sourceAmountCents: amountCents,
                            commissionSource: commissionSource,
                            stripeInvoiceId: referenceId,
                        })
                            .returning()];
                case 2:
                    commission = (_a.sent())[0];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 6, , 7]);
                    return [4 /*yield*/, import("./creditService.js")];
                case 4:
                    createCreditFromCommission = (_a.sent()).createCreditFromCommission;
                    return [4 /*yield*/, createCreditFromCommission(affiliateUserId, commission.id, amount)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error("[affiliate] Failed to create credit:", error_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, commission];
            }
        });
    });
}
export function createAffiliateCommissionsForSubscription(userId, invoiceTotalCents, invoiceId) {
    return __awaiter(this, void 0, void 0, function () {
        var recipients, results, _i, recipients_1, recipient, commission;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getAffiliateRecipientsForUser(userId)];
                case 1:
                    recipients = _a.sent();
                    if (recipients.length === 0)
                        return [2 /*return*/, []];
                    results = [];
                    _i = 0, recipients_1 = recipients;
                    _a.label = 2;
                case 2:
                    if (!(_i < recipients_1.length)) return [3 /*break*/, 5];
                    recipient = recipients_1[_i];
                    return [4 /*yield*/, createCommissionEntry(recipient.affiliateUserId, invoiceTotalCents, recipient.percent, "subscription_payment", invoiceId)];
                case 3:
                    commission = _a.sent();
                    if (commission)
                        results.push(commission);
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, results];
            }
        });
    });
}
export function createAffiliateCommissionsForBooking(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var results, hostRecipients, _i, hostRecipients_1, recipient, commission, truckRecipients, _c, truckRecipients_1, recipient, commission;
        var hostOwnerId = _b.hostOwnerId, truckOwnerId = _b.truckOwnerId, platformFeeCents = _b.platformFeeCents, paymentIntentId = _b.paymentIntentId, truckRestaurantId = _b.truckRestaurantId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    results = [];
                    return [4 /*yield*/, getAffiliateRecipientsForUser(hostOwnerId)];
                case 1:
                    hostRecipients = _d.sent();
                    _i = 0, hostRecipients_1 = hostRecipients;
                    _d.label = 2;
                case 2:
                    if (!(_i < hostRecipients_1.length)) return [3 /*break*/, 5];
                    recipient = hostRecipients_1[_i];
                    return [4 /*yield*/, createCommissionEntry(recipient.affiliateUserId, platformFeeCents, recipient.percent, "booking_fee_host", paymentIntentId, truckRestaurantId)];
                case 3:
                    commission = _d.sent();
                    if (commission)
                        results.push(commission);
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, getAffiliateRecipientsForUser(truckOwnerId)];
                case 6:
                    truckRecipients = _d.sent();
                    _c = 0, truckRecipients_1 = truckRecipients;
                    _d.label = 7;
                case 7:
                    if (!(_c < truckRecipients_1.length)) return [3 /*break*/, 10];
                    recipient = truckRecipients_1[_c];
                    return [4 /*yield*/, createCommissionEntry(recipient.affiliateUserId, platformFeeCents, recipient.percent, "booking_fee_truck", paymentIntentId, truckRestaurantId)];
                case 8:
                    commission = _d.sent();
                    if (commission)
                        results.push(commission);
                    _d.label = 9;
                case 9:
                    _c++;
                    return [3 /*break*/, 7];
                case 10: return [2 /*return*/, results];
            }
        });
    });
}

