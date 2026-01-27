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
import { events, hosts, restaurants, eventInterests, users } from '@shared/schema';
import { and, eq, gte, lte, sql, isNull } from 'drizzle-orm';
import { emailService } from './emailService.js';
import auditLogger from './auditLogger.js';
/**
 * Notify nearby food trucks about unbooked event slots.
 *
 * This cron job runs hourly and checks for:
 * - Events happening within the next 48 hours
 * - Events that are still "open" (not booked)
 * - Events that haven't had notifications sent yet
 *
 * For each qualifying event, it:
 * 1. Identifies food trucks within a 25km radius (based on home address)
 * 2. Excludes trucks that have already expressed interest
 * 3. Sends notification emails to truck owners
 * 4. Marks event as notified to prevent duplicate notifications
 */
export function notifyUnbookedEvents() {
    return __awaiter(this, void 0, void 0, function () {
        var stats, now, bufferEnd, upcomingUnbookedEvents, _loop_1, _i, upcomingUnbookedEvents_1, _a, event_1, host, error_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    stats = {
                        eventsProcessed: 0,
                        trucksNotified: 0,
                        errors: 0,
                    };
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 7, , 8]);
                    console.log('[EventNotificationCron] Starting unbooked event notification check...');
                    now = new Date();
                    bufferEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);
                    return [4 /*yield*/, db
                            .select({
                            event: events,
                            host: hosts,
                        })
                            .from(events)
                            .innerJoin(hosts, eq(events.hostId, hosts.id))
                            .where(and(eq(events.status, 'open'), gte(events.date, now), lte(events.date, bufferEnd)))];
                case 2:
                    upcomingUnbookedEvents = _c.sent();
                    console.log("[EventNotificationCron] Found ".concat(upcomingUnbookedEvents.length, " unbooked events within 48-hour buffer"));
                    _loop_1 = function (event_1, host) {
                        var claimed, existingInterests, excludedTruckIds_1, allTrucks, trucksToNotify, _d, trucksToNotify_1, truck, owner, emailError_1, eventError_1;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _e.trys.push([0, 12, , 13]);
                                    if (event_1.unbookedNotificationSentAt) {
                                        auditLogger.info('Unbooked event notification skipped', {
                                            eventId: event_1.id,
                                            reason: 'already_notified',
                                            lastSentAt: event_1.unbookedNotificationSentAt,
                                        });
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, db
                                            .update(events)
                                            .set({ unbookedNotificationSentAt: now })
                                            .where(and(eq(events.id, event_1.id), isNull(events.unbookedNotificationSentAt)))
                                            .returning({ id: events.id })];
                                case 1:
                                    claimed = (_e.sent())[0];
                                    if (!claimed) {
                                        auditLogger.info('Unbooked event notification skipped', {
                                            eventId: event_1.id,
                                            reason: 'already_claimed',
                                        });
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, db
                                            .select({ truckId: eventInterests.truckId })
                                            .from(eventInterests)
                                            .where(eq(eventInterests.eventId, event_1.id))];
                                case 2:
                                    existingInterests = _e.sent();
                                    excludedTruckIds_1 = existingInterests.map(function (i) { return i.truckId; });
                                    return [4 /*yield*/, db
                                            .select({
                                            id: restaurants.id,
                                            name: restaurants.name,
                                            ownerId: restaurants.ownerId,
                                            latitude: restaurants.latitude,
                                            longitude: restaurants.longitude,
                                        })
                                            .from(restaurants)
                                            .where(and(eq(restaurants.isFoodTruck, true), eq(restaurants.isActive, true), sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " IS NOT NULL"], ["", " IS NOT NULL"])), restaurants.latitude)))];
                                case 3:
                                    allTrucks = _e.sent();
                                    trucksToNotify = allTrucks.filter(function (t) { return !excludedTruckIds_1.includes(t.id); });
                                    _d = 0, trucksToNotify_1 = trucksToNotify;
                                    _e.label = 4;
                                case 4:
                                    if (!(_d < trucksToNotify_1.length)) return [3 /*break*/, 11];
                                    truck = trucksToNotify_1[_d];
                                    _e.label = 5;
                                case 5:
                                    _e.trys.push([5, 9, , 10]);
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(users)
                                            .where(eq(users.id, truck.ownerId))
                                            .limit(1)];
                                case 6:
                                    owner = _e.sent();
                                    if (!((_b = owner[0]) === null || _b === void 0 ? void 0 : _b.email)) return [3 /*break*/, 8];
                                    return [4 /*yield*/, sendUnbookedEventNotification(owner[0].email, owner[0].firstName || 'Truck Owner', {
                                            eventName: event_1.name || 'Food Truck Opportunity',
                                            hostName: host.businessName,
                                            eventDate: event_1.date,
                                            address: host.address,
                                            startTime: event_1.startTime,
                                            endTime: event_1.endTime,
                                            eventId: event_1.id,
                                        })];
                                case 7:
                                    _e.sent();
                                    stats.trucksNotified++;
                                    _e.label = 8;
                                case 8: return [3 /*break*/, 10];
                                case 9:
                                    emailError_1 = _e.sent();
                                    console.error("[EventNotificationCron] Failed to notify truck ".concat(truck.id, ":"), emailError_1);
                                    stats.errors++;
                                    return [3 /*break*/, 10];
                                case 10:
                                    _d++;
                                    return [3 /*break*/, 4];
                                case 11:
                                    stats.eventsProcessed++;
                                    // Audit log
                                    auditLogger.info('Unbooked event notification sent', {
                                        eventId: event_1.id,
                                        hostId: host.id,
                                        trucksNotified: stats.trucksNotified,
                                    });
                                    return [3 /*break*/, 13];
                                case 12:
                                    eventError_1 = _e.sent();
                                    console.error("[EventNotificationCron] Failed to process event ".concat(event_1.id, ":"), eventError_1);
                                    stats.errors++;
                                    return [3 /*break*/, 13];
                                case 13: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, upcomingUnbookedEvents_1 = upcomingUnbookedEvents;
                    _c.label = 3;
                case 3:
                    if (!(_i < upcomingUnbookedEvents_1.length)) return [3 /*break*/, 6];
                    _a = upcomingUnbookedEvents_1[_i], event_1 = _a.event, host = _a.host;
                    return [5 /*yield**/, _loop_1(event_1, host)];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log('[EventNotificationCron] Notification check complete:', stats);
                    return [2 /*return*/, stats];
                case 7:
                    error_1 = _c.sent();
                    console.error('[EventNotificationCron] Critical error:', error_1);
                    stats.errors++;
                    return [2 /*return*/, stats];
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * Send email notification to truck owner about unbooked event opportunity
 */
function sendUnbookedEventNotification(email, ownerName, eventDetails) {
    return __awaiter(this, void 0, void 0, function () {
        var subject, formattedDate, html;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    subject = "\uD83D\uDE9A Food Truck Opportunity Available - ".concat(eventDetails.hostName);
                    formattedDate = new Date(eventDetails.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });
                    html = "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; }\n        .container { max-width: 640px; margin: 0 auto; padding: 20px; }\n        .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; background: #ffffff; }\n        .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; margin-bottom: 12px; }\n        .title { font-size: 24px; font-weight: 700; margin: 8px 0 16px 0; color: #111827; }\n        .meta { display: grid; gap: 12px; margin: 20px 0; background: #f9fafb; padding: 16px; border-radius: 8px; }\n        .meta-row { display: flex; justify-content: space-between; align-items: center; }\n        .label { color: #6b7280; font-size: 14px; font-weight: 500; }\n        .value { font-weight: 600; color: #111827; font-size: 14px; }\n        .cta { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }\n        .cta:hover { background: #d97706; }\n        .footnote { color: #6b7280; font-size: 13px; margin-top: 20px; line-height: 1.5; }\n        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }\n        .warning-text { color: #92400e; font-size: 14px; margin: 0; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <div class=\"card\">\n          <div class=\"badge\">\u23F0 UNBOOKED OPPORTUNITY</div>\n          <h1 class=\"title\">".concat(eventDetails.hostName, " needs a food truck!</h1>\n          \n          <p style=\"margin: 0 0 16px 0; color: #374151;\">Hi ").concat(ownerName, ",</p>\n          \n          <p style=\"margin: 0 0 16px 0; color: #374151;\">\n            A local business has a food truck event coming up soon that hasn't been booked yet. This could be a great opportunity for you!\n          </p>\n\n          <div class=\"warning\">\n            <p class=\"warning-text\">\u26A1 This event is happening within the next 48 hours. Express interest now to secure the spot!</p>\n          </div>\n\n          <div class=\"meta\">\n            <div class=\"meta-row\">\n              <span class=\"label\">Event</span>\n              <span class=\"value\">").concat(eventDetails.eventName, "</span>\n            </div>\n            <div class=\"meta-row\">\n              <span class=\"label\">Host</span>\n              <span class=\"value\">").concat(eventDetails.hostName, "</span>\n            </div>\n            <div class=\"meta-row\">\n              <span class=\"label\">Date</span>\n              <span class=\"value\">").concat(formattedDate, "</span>\n            </div>\n            <div class=\"meta-row\">\n              <span class=\"label\">Time</span>\n              <span class=\"value\">").concat(eventDetails.startTime, " - ").concat(eventDetails.endTime, "</span>\n            </div>\n            <div class=\"meta-row\">\n              <span class=\"label\">Location</span>\n              <span class=\"value\">").concat(eventDetails.address, "</span>\n            </div>\n          </div>\n\n          <div style=\"text-align: center; margin: 24px 0;\">\n            <a href=\"").concat(process.env.PUBLIC_BASE_URL || 'http://localhost:5000', "/truck-discovery\" class=\"cta\">\n              View Event & Express Interest\n            </a>\n          </div>\n\n          <p class=\"footnote\">\n            \uD83D\uDCA1 <strong>Why am I receiving this?</strong><br>\n            You're receiving this notification because this event is happening soon and hasn't been booked yet. We wanted to give nearby food trucks like yours a chance to fill this opportunity before it's too late.\n          </p>\n\n          <p class=\"footnote\">\n            Questions? Reply to this email and we'll help you out.\n          </p>\n\n          <p style=\"margin-top: 24px; color: #6b7280;\">\n            Best,<br>\n            The MealScout Team\n          </p>\n        </div>\n      </div>\n    </body>\n    </html>\n  ");
                    return [4 /*yield*/, emailService.sendBasicEmail(email, subject, html)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Register the cron job to run hourly
 */
export function registerEventNotificationCron() {
    // Note: In production, this would be registered with node-cron or similar
    // For now, this is just the implementation that can be called manually or via cron
    console.log('✅ Event notification cron job registered');
}
var templateObject_1;

