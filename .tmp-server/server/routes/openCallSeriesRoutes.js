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
import { z } from "zod";
import { storage } from "../storage.js";
import { emailService } from "../emailService.js";
import { db } from "../db.js";
import { events, eventSeries, insertEventSeriesSchema } from "@shared/schema";
import { isAuthenticated } from "../unifiedAuth.js";
import { getHostByUserId } from "../services/hostOwnership.js";
import { assertMaxSpan180Days, generateOccurrences, filterFutureOccurrences } from "../services/openCallSeries.js";
import { eq } from "drizzle-orm";
export function registerOpenCallSeriesRoutes(app) {
    // EVENT SERIES (OPEN CALLS) ENDPOINTS
    var _this = this;
    // Create a new event series (draft)
    app.post('/api/hosts/event-series', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, host, parsed, _a, startHour, startMinute, _b, endHour, endMinute, startMinutes, endMinutes, series, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    userId = req.user.id;
                    return [4 /*yield*/, getHostByUserId(userId)];
                case 1:
                    host = _c.sent();
                    if (!host) {
                        return [2 /*return*/, res.status(404).json({ message: 'Host profile not found' })];
                    }
                    parsed = insertEventSeriesSchema.parse(__assign(__assign({}, req.body), { hostId: host.id }));
                    // Validation: End date must be after start date
                    if (new Date(parsed.endDate) <= new Date(parsed.startDate)) {
                        return [2 /*return*/, res.status(400).json({ message: 'End date must be after start date' })];
                    }
                    // Validation: Max 180 days recurrence span
                    assertMaxSpan180Days(new Date(parsed.startDate), new Date(parsed.endDate));
                    _a = parsed.defaultStartTime.split(':').map(Number), startHour = _a[0], startMinute = _a[1];
                    _b = parsed.defaultEndTime.split(':').map(Number), endHour = _b[0], endMinute = _b[1];
                    startMinutes = startHour * 60 + startMinute;
                    endMinutes = endHour * 60 + endMinute;
                    if (endMinutes <= startMinutes) {
                        return [2 /*return*/, res.status(400).json({ message: 'End time must be after start time' })];
                    }
                    return [4 /*yield*/, storage.createEventSeries(parsed)];
                case 2:
                    series = _c.sent();
                    // Telemetry
                    return [4 /*yield*/, storage.createTelemetryEvent({
                            eventName: 'event_series_created',
                            userId: req.user.id,
                            properties: {
                                seriesId: series.id,
                                startDate: series.startDate,
                                endDate: series.endDate,
                                recurrenceRule: series.recurrenceRule,
                            }
                        })];
                case 3:
                    // Telemetry
                    _c.sent();
                    res.status(201).json(series);
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _c.sent();
                    console.error('Error creating event series:', error_1);
                    if (error_1 instanceof z.ZodError) {
                        return [2 /*return*/, res.status(400).json({ message: 'Invalid series data', errors: error_1.errors })];
                    }
                    res.status(400).json({ message: error_1.message || 'Failed to create event series' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // Publish an event series (generate occurrences)
    app.post('/api/hosts/event-series/:seriesId/publish', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var seriesId, userId, series, host, startDate, endDate, occurrences, _i, occurrences_1, occurrence, publishedSeries, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    seriesId = req.params.seriesId;
                    userId = req.user.id;
                    return [4 /*yield*/, storage.getEventSeries(seriesId)];
                case 1:
                    series = _a.sent();
                    if (!series) {
                        return [2 /*return*/, res.status(404).json({ message: 'Event series not found' })];
                    }
                    return [4 /*yield*/, getHostByUserId(userId)];
                case 2:
                    host = _a.sent();
                    if (!host || host.id !== series.hostId) {
                        return [2 /*return*/, res.status(403).json({ message: 'Not authorized to publish this series' })];
                    }
                    if (series.status === 'published') {
                        return [2 /*return*/, res.status(400).json({ message: 'Series is already published' })];
                    }
                    startDate = new Date(series.startDate);
                    endDate = new Date(series.endDate);
                    occurrences = generateOccurrences({
                        startDate: startDate,
                        endDate: endDate,
                        recurrenceRule: series.recurrenceRule,
                        defaults: {
                            hostId: series.hostId,
                            seriesId: series.id,
                            name: series.name,
                            description: series.description,
                            startTime: series.defaultStartTime,
                            endTime: series.defaultEndTime,
                            maxTrucks: series.defaultMaxTrucks,
                            hardCapEnabled: series.defaultHardCapEnabled,
                        }
                    });
                    _i = 0, occurrences_1 = occurrences;
                    _a.label = 3;
                case 3:
                    if (!(_i < occurrences_1.length)) return [3 /*break*/, 6];
                    occurrence = occurrences_1[_i];
                    return [4 /*yield*/, storage.createEvent(occurrence)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, storage.publishEventSeries(seriesId)];
                case 7:
                    publishedSeries = _a.sent();
                    // Telemetry
                    return [4 /*yield*/, storage.createTelemetryEvent({
                            eventName: 'event_series_published',
                            userId: req.user.id,
                            properties: {
                                seriesId: publishedSeries.id,
                                occurrencesGenerated: occurrences.length,
                            }
                        })];
                case 8:
                    // Telemetry
                    _a.sent();
                    res.json({
                        series: publishedSeries,
                        occurrencesGenerated: occurrences.length,
                    });
                    return [3 /*break*/, 10];
                case 9:
                    error_2 = _a.sent();
                    console.error('Error publishing event series:', error_2);
                    res.status(500).json({ message: 'Failed to publish event series' });
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    }); });
    // List all event series for a host
    app.get('/api/hosts/event-series', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, host, seriesList, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    userId = req.user.id;
                    return [4 /*yield*/, getHostByUserId(userId)];
                case 1:
                    host = _a.sent();
                    if (!host) {
                        return [2 /*return*/, res.status(404).json({ message: 'Host profile not found' })];
                    }
                    return [4 /*yield*/, storage.getEventSeriesByHost(host.id)];
                case 2:
                    seriesList = _a.sent();
                    res.json(seriesList);
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.error('Error fetching event series:', error_3);
                    res.status(500).json({ message: 'Failed to fetch event series' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Get occurrences for a specific series
    app.get('/api/hosts/event-series/:seriesId/occurrences', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var seriesId, userId, series, host, occurrences, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    seriesId = req.params.seriesId;
                    userId = req.user.id;
                    return [4 /*yield*/, storage.getEventSeries(seriesId)];
                case 1:
                    series = _a.sent();
                    if (!series) {
                        return [2 /*return*/, res.status(404).json({ message: 'Event series not found' })];
                    }
                    return [4 /*yield*/, getHostByUserId(userId)];
                case 2:
                    host = _a.sent();
                    if (!host || host.id !== series.hostId) {
                        return [2 /*return*/, res.status(403).json({ message: 'Not authorized to view this series' })];
                    }
                    return [4 /*yield*/, storage.getEventsBySeriesId(seriesId)];
                case 3:
                    occurrences = _a.sent();
                    res.json(occurrences);
                    return [3 /*break*/, 5];
                case 4:
                    error_4 = _a.sent();
                    console.error('Error fetching series occurrences:', error_4);
                    res.status(500).json({ message: 'Failed to fetch occurrences' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // Cancel an event series (soft-close future occurrences)
    app.post('/api/hosts/event-series/:seriesId/cancel', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var seriesId, userId, series_1, host, allOccurrences, futureOccurrences, affectedTrucks_1, _i, futureOccurrences_1, occurrence, interests, _a, interests_1, interest, key, _b, futureOccurrences_2, occurrence, error_5;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 14, , 15]);
                    seriesId = req.params.seriesId;
                    userId = req.user.id;
                    return [4 /*yield*/, storage.getEventSeries(seriesId)];
                case 1:
                    series_1 = _c.sent();
                    if (!series_1) {
                        return [2 /*return*/, res.status(404).json({ message: 'Event series not found' })];
                    }
                    return [4 /*yield*/, getHostByUserId(userId)];
                case 2:
                    host = _c.sent();
                    if (!host || host.id !== series_1.hostId) {
                        return [2 /*return*/, res.status(403).json({ message: 'Not authorized to cancel this series' })];
                    }
                    if (series_1.status === 'closed') {
                        return [2 /*return*/, res.status(400).json({ message: 'Series is already cancelled' })];
                    }
                    return [4 /*yield*/, storage.getEventsBySeriesId(seriesId)];
                case 3:
                    allOccurrences = _c.sent();
                    futureOccurrences = filterFutureOccurrences(allOccurrences, new Date());
                    if (futureOccurrences.length === 0) {
                        return [2 /*return*/, res.status(400).json({ message: 'No future occurrences to cancel' })];
                    }
                    affectedTrucks_1 = new Map();
                    _i = 0, futureOccurrences_1 = futureOccurrences;
                    _c.label = 4;
                case 4:
                    if (!(_i < futureOccurrences_1.length)) return [3 /*break*/, 7];
                    occurrence = futureOccurrences_1[_i];
                    return [4 /*yield*/, storage.getEventInterestsByEventId(occurrence.id)];
                case 5:
                    interests = _c.sent();
                    for (_a = 0, interests_1 = interests; _a < interests_1.length; _a++) {
                        interest = interests_1[_a];
                        if (interest.status === 'pending' || interest.status === 'accepted') {
                            key = interest.truckId;
                            if (!affectedTrucks_1.has(key)) {
                                affectedTrucks_1.set(key, {
                                    truckId: interest.truckId,
                                    dates: []
                                });
                            }
                            affectedTrucks_1.get(key).dates.push(occurrence.date.toISOString().split('T')[0]);
                        }
                    }
                    _c.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    _b = 0, futureOccurrences_2 = futureOccurrences;
                    _c.label = 8;
                case 8:
                    if (!(_b < futureOccurrences_2.length)) return [3 /*break*/, 11];
                    occurrence = futureOccurrences_2[_b];
                    return [4 /*yield*/, db.update(events)
                            .set({ status: 'cancelled', updatedAt: new Date() })
                            .where(eq(events.id, occurrence.id))];
                case 9:
                    _c.sent();
                    _c.label = 10;
                case 10:
                    _b++;
                    return [3 /*break*/, 8];
                case 11: 
                // Mark series as closed
                return [4 /*yield*/, db.update(eventSeries)
                        .set({ status: 'closed', updatedAt: new Date() })
                        .where(eq(eventSeries.id, seriesId))];
                case 12:
                    // Mark series as closed
                    _c.sent();
                    // Send notifications (fire and forget)
                    (function () { return __awaiter(_this, void 0, void 0, function () {
                        var _i, _a, _b, _c, truckId, dates, truck, owner, err_1;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _d.trys.push([0, 7, , 8]);
                                    _i = 0, _a = Array.from(affectedTrucks_1);
                                    _d.label = 1;
                                case 1:
                                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                                    _b = _a[_i], _c = _b[1], truckId = _c.truckId, dates = _c.dates;
                                    return [4 /*yield*/, storage.getRestaurant(truckId)];
                                case 2:
                                    truck = _d.sent();
                                    if (!truck) return [3 /*break*/, 5];
                                    return [4 /*yield*/, storage.getUser(truck.ownerId)];
                                case 3:
                                    owner = _d.sent();
                                    if (!(owner && owner.email)) return [3 /*break*/, 5];
                                    return [4 /*yield*/, emailService.sendSeriesCancellationNotification(owner.email, truck.name, series_1.name, dates)];
                                case 4:
                                    _d.sent();
                                    _d.label = 5;
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 6: return [3 /*break*/, 8];
                                case 7:
                                    err_1 = _d.sent();
                                    console.error('Failed to send cancellation notifications:', err_1);
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); })();
                    // Telemetry
                    return [4 /*yield*/, storage.createTelemetryEvent({
                            eventName: 'series_cancelled',
                            userId: req.user.id,
                            properties: {
                                seriesId: seriesId,
                                futureOccurrencesCancelled: futureOccurrences.length,
                                trucksNotified: affectedTrucks_1.size,
                            }
                        })];
                case 13:
                    // Telemetry
                    _c.sent();
                    res.json({
                        message: 'Series cancelled successfully',
                        futureOccurrencesCancelled: futureOccurrences.length,
                        trucksNotified: affectedTrucks_1.size,
                    });
                    return [3 /*break*/, 15];
                case 14:
                    error_5 = _c.sent();
                    console.error('Error cancelling series:', error_5);
                    res.status(500).json({ message: 'Failed to cancel series' });
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    }); });
}

