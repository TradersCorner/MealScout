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
import { Router } from "express";
import { db } from "./db.js";
import { telemetryEvents, eventInterests, hosts } from "@shared/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { isAdmin } from "./unifiedAuth.js";
var router = Router();
// Helper to get date ranges
var getRange = function (days) {
    var date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};
/**
 * GET /api/admin/telemetry/velocity
 * Interest creation velocity (last 7/30/90 days)
 */
router.get("/velocity", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var days, startDate, velocity, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                days = parseInt(req.query.days) || 30;
                startDate = getRange(days);
                return [4 /*yield*/, db
                        .select({
                        date: sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["DATE(created_at)"], ["DATE(created_at)"]))),
                        count: sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                    })
                        .from(eventInterests)
                        .where(gte(eventInterests.createdAt, startDate))
                        .groupBy(sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["DATE(created_at)"], ["DATE(created_at)"]))))
                        .orderBy(sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["DATE(created_at)"], ["DATE(created_at)"]))))];
            case 1:
                velocity = _a.sent();
                res.json(velocity);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error("Error fetching telemetry velocity:", error_1);
                res.status(500).json({ error: "Failed to fetch velocity data" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/telemetry/fill-rates
 * Fill rate distribution and over-capacity events
 */
router.get("/fill-rates", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var allEvents, fillRates, overCapacityCount, totalEvents, _i, allEvents_1, event_1, acceptedCount, max, rate, buckets_1, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db.query.events.findMany({
                        with: {
                            interests: true,
                        },
                    })];
            case 1:
                allEvents = _a.sent();
                fillRates = [];
                overCapacityCount = 0;
                totalEvents = 0;
                for (_i = 0, allEvents_1 = allEvents; _i < allEvents_1.length; _i++) {
                    event_1 = allEvents_1[_i];
                    acceptedCount = event_1.interests.filter(function (i) { return i.status === "accepted"; }).length;
                    max = event_1.maxTrucks || 1;
                    if (max > 0) {
                        rate = Math.min(acceptedCount / max, 1.5);
                        fillRates.push(rate);
                        totalEvents++;
                        if (acceptedCount >= max) {
                            overCapacityCount++;
                        }
                    }
                }
                buckets_1 = new Array(11).fill(0);
                fillRates.forEach(function (rate) {
                    var index = Math.min(Math.floor(rate * 10), 10);
                    buckets_1[index]++;
                });
                res.json({
                    buckets: buckets_1.map(function (count, i) { return ({
                        range: i === 10 ? "100%+" : "".concat(i * 10, "-").concat((i + 1) * 10, "%"),
                        count: count,
                    }); }),
                    overCapacityPercentage: totalEvents > 0 ? (overCapacityCount / totalEvents) * 100 : 0,
                    totalEvents: totalEvents,
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error("Error fetching fill rates:", error_2);
                res.status(500).json({ error: "Failed to fetch fill rate data" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/telemetry/decision-time
 * Time from interest creation to decision (accepted/declined)
 */
router.get("/decision-time", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var decisions, decisionEvents, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, db
                        .select({
                        created: eventInterests.createdAt,
                        // We don't have a separate decidedAt, so we assume updatedAt is the decision time for non-pending
                        decided: sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["CASE WHEN status != 'pending' THEN created_at ELSE NULL END"], ["CASE WHEN status != 'pending' THEN created_at ELSE NULL END"]))), // Wait, schema has no updatedAt for interests?
                    })
                        .from(eventInterests)
                        .where(sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["status != 'pending'"], ["status != 'pending'"]))))];
            case 1:
                decisions = _a.sent();
                return [4 /*yield*/, db
                        .select({
                        eventName: telemetryEvents.eventName,
                        createdAt: telemetryEvents.createdAt,
                        properties: telemetryEvents.properties,
                    })
                        .from(telemetryEvents)
                        .where(and(sql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["event_name IN ('interest_accepted', 'interest_declined')"], ["event_name IN ('interest_accepted', 'interest_declined')"]))), gte(telemetryEvents.createdAt, getRange(90))))];
            case 2:
                decisionEvents = _a.sent();
                // This requires us to match these events back to the creation time of the interest.
                // If telemetry doesn't have the creation time, we might be stuck.
                // Alternative: For v1, if we can't calculate it accurately, we return a placeholder or
                // we add 'updatedAt' to eventInterests in a future migration.
                // CHECK: Does telemetry event have 'interestId'?
                // If so, we can fetch the interest creation time.
                // For now, let's return a "Not Available" state or simplified metric if data is missing.
                res.json({
                    medianHours: 0,
                    p75Hours: 0,
                    note: "Requires 'updatedAt' on event_interests or correlation with creation logs.",
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error("Error fetching decision time:", error_3);
                res.status(500).json({ error: "Failed to fetch decision time data" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/telemetry/digest-coverage
 * Weekly digests sent vs eligible hosts
 */
router.get("/digest-coverage", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sentCounts, totalHosts, eligibleCount_1, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, db
                        .select({
                        week: sql(templateObject_8 || (templateObject_8 = __makeTemplateObject(["properties->>'week'"], ["properties->>'week'"]))),
                        count: sql(templateObject_9 || (templateObject_9 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                    })
                        .from(telemetryEvents)
                        .where(eq(telemetryEvents.eventName, "weekly_digest_sent"))
                        .groupBy(sql(templateObject_10 || (templateObject_10 = __makeTemplateObject(["properties->>'week'"], ["properties->>'week'"]))))
                        .orderBy(desc(sql(templateObject_11 || (templateObject_11 = __makeTemplateObject(["properties->>'week'"], ["properties->>'week'"])))))
                        .limit(12)];
            case 1:
                sentCounts = _a.sent();
                return [4 /*yield*/, db
                        .select({ count: sql(templateObject_12 || (templateObject_12 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                        .from(hosts)];
            case 2:
                totalHosts = _a.sent();
                eligibleCount_1 = totalHosts[0].count;
                res.json({
                    history: sentCounts.map(function (row) { return ({
                        week: row.week,
                        sent: Number(row.count),
                        eligible: Number(eligibleCount_1), // simplified: assuming constant host count for history
                        coverage: eligibleCount_1 > 0
                            ? Math.round((Number(row.count) / Number(eligibleCount_1)) * 100)
                            : 0,
                    }); }),
                });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                console.error("Error fetching digest coverage:", error_4);
                res.status(500).json({ error: "Failed to fetch digest coverage" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
export default router;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12;

