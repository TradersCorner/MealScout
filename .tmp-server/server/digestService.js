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
import { db } from "./db.js";
import { events, telemetryEvents } from "@shared/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { emailService } from "./emailService.js";
var DigestService = /** @class */ (function () {
    function DigestService() {
    }
    DigestService.getInstance = function () {
        if (!DigestService.instance) {
            DigestService.instance = new DigestService();
        }
        return DigestService.instance;
    };
    DigestService.prototype.sendWeeklyDigests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, nextWeek, weekNumber, idempotencyKey, allHosts, sentCount, skippedCount, duplicateCount, _i, allHosts_1, host, alreadySent, upcomingEvents, pendingInterestCount, capacityAlerts, eventSummaries, _a, upcomingEvents_1, event_1, interests, pending, accepted, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('📧 Starting weekly digest generation...');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        now = new Date();
                        nextWeek = new Date(now);
                        nextWeek.setDate(now.getDate() + 7);
                        weekNumber = this.getWeekNumber(now);
                        idempotencyKey = "".concat(now.getFullYear(), "-W").concat(weekNumber);
                        return [4 /*yield*/, db.query.hosts.findMany({
                                with: {
                                    user: true
                                }
                            })];
                    case 2:
                        allHosts = _b.sent();
                        sentCount = 0;
                        skippedCount = 0;
                        duplicateCount = 0;
                        _i = 0, allHosts_1 = allHosts;
                        _b.label = 3;
                    case 3:
                        if (!(_i < allHosts_1.length)) return [3 /*break*/, 9];
                        host = allHosts_1[_i];
                        if (!host.user.email)
                            return [3 /*break*/, 8];
                        return [4 /*yield*/, db.query.telemetryEvents.findFirst({
                                where: and(eq(telemetryEvents.eventName, 'weekly_digest_sent'), eq(telemetryEvents.userId, host.userId), sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["properties->>'week' = ", ""], ["properties->>'week' = ", ""])), idempotencyKey))
                            })];
                    case 4:
                        alreadySent = _b.sent();
                        if (alreadySent) {
                            duplicateCount++;
                            return [3 /*break*/, 8];
                        }
                        return [4 /*yield*/, db.query.events.findMany({
                                where: and(eq(events.hostId, host.id), gte(events.date, now), lt(events.date, nextWeek)),
                                with: {
                                    interests: true
                                },
                                orderBy: function (events, _a) {
                                    var asc = _a.asc;
                                    return [asc(events.date)];
                                }
                            })];
                    case 5:
                        upcomingEvents = _b.sent();
                        // Skip if no events (per spec: "Empty digest behavior: skip send")
                        if (upcomingEvents.length === 0) {
                            skippedCount++;
                            return [3 /*break*/, 8];
                        }
                        pendingInterestCount = 0;
                        capacityAlerts = [];
                        eventSummaries = [];
                        for (_a = 0, upcomingEvents_1 = upcomingEvents; _a < upcomingEvents_1.length; _a++) {
                            event_1 = upcomingEvents_1[_a];
                            interests = event_1.interests || [];
                            pending = interests.filter(function (i) { return i.status === 'pending'; }).length;
                            accepted = interests.filter(function (i) { return i.status === 'accepted'; }).length;
                            pendingInterestCount += pending;
                            eventSummaries.push({
                                name: event_1.name || 'Event',
                                date: new Date(event_1.date).toLocaleDateString(),
                                accepted: accepted,
                                max: event_1.maxTrucks
                            });
                            if (accepted >= event_1.maxTrucks) {
                                capacityAlerts.push({
                                    eventName: event_1.name || 'Event',
                                    date: new Date(event_1.date).toLocaleDateString(),
                                    accepted: accepted,
                                    max: event_1.maxTrucks
                                });
                            }
                        }
                        // 5. Send Email
                        return [4 /*yield*/, emailService.sendWeeklyDigest(host.user.email, {
                                hostName: host.businessName,
                                weekStart: now.toLocaleDateString(),
                                weekEnd: nextWeek.toLocaleDateString(),
                                events: eventSummaries,
                                pendingCount: pendingInterestCount,
                                capacityAlerts: capacityAlerts
                            })];
                    case 6:
                        // 5. Send Email
                        _b.sent();
                        // Log Telemetry (Idempotency)
                        return [4 /*yield*/, db.insert(telemetryEvents).values({
                                eventName: 'weekly_digest_sent',
                                userId: host.userId,
                                properties: {
                                    week: idempotencyKey,
                                    hostId: host.id,
                                    eventCount: upcomingEvents.length,
                                    pendingCount: pendingInterestCount,
                                    alertCount: capacityAlerts.length
                                }
                            })];
                    case 7:
                        // Log Telemetry (Idempotency)
                        _b.sent();
                        sentCount++;
                        _b.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 3];
                    case 9:
                        console.log("\u2705 Weekly digest complete. Sent: ".concat(sentCount, ", Skipped: ").concat(skippedCount, ", Duplicates: ").concat(duplicateCount));
                        return [3 /*break*/, 11];
                    case 10:
                        error_1 = _b.sent();
                        console.error('❌ Error generating weekly digests:', error_1);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    DigestService.prototype.getWeekNumber = function (d) {
        var date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        var dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };
    return DigestService;
}());
export { DigestService };
export var digestService = DigestService.getInstance();
var templateObject_1;

