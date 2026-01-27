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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { z } from "zod";
import { db } from "../db.js";
import { eventBookings, eventInterests, events, hosts, restaurants, } from "@shared/schema";
import { eq, and, or, desc, gte, inArray } from "drizzle-orm";
import { isAuthenticated } from "../unifiedAuth.js";
import { storage } from "../storage.js";
import { emailService } from "../emailService.js";
/**
 * Booking Management Routes
 * - GET /api/bookings/my-truck - Get all bookings for user's food truck
 * - GET /api/bookings/my-host - Get all bookings for user's host locations
 * - POST /api/bookings/:bookingId/cancel - Cancel a booking (non-refundable)
 */
export function registerBookingRoutes(app) {
    var _this = this;
    // Get all bookings for the user's food truck
    app.get("/api/bookings/my-truck", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, userTrucks_1, truckIds, bookings_1, formattedBookings, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    userId = req.user.id;
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurants)
                            .where(eq(restaurants.ownerId, userId))];
                case 1:
                    userTrucks_1 = _a.sent();
                    if (userTrucks_1.length === 0) {
                        return [2 /*return*/, res.json([])];
                    }
                    truckIds = userTrucks_1.map(function (t) { return t.id; });
                    return [4 /*yield*/, db
                            .select({
                            id: eventBookings.id,
                            eventId: eventBookings.eventId,
                            truckId: eventBookings.truckId,
                            hostId: eventBookings.hostId,
                            status: eventBookings.status,
                            totalCents: eventBookings.totalCents,
                            hostPriceCents: eventBookings.hostPriceCents,
                            platformFeeCents: eventBookings.platformFeeCents,
                            stripePaymentIntentId: eventBookings.stripePaymentIntentId,
                            bookingConfirmedAt: eventBookings.bookingConfirmedAt,
                            cancelledAt: eventBookings.cancelledAt,
                            createdAt: eventBookings.createdAt,
                            event: events,
                            host: hosts,
                        })
                            .from(eventBookings)
                            .innerJoin(events, eq(eventBookings.eventId, events.id))
                            .innerJoin(hosts, eq(eventBookings.hostId, hosts.id))
                            .where(or.apply(void 0, truckIds.map(function (id) { return eq(eventBookings.truckId, id); })))
                            .orderBy(desc(events.date))];
                case 2:
                    bookings_1 = _a.sent();
                    formattedBookings = bookings_1.map(function (b) { return ({
                        id: b.id,
                        eventId: b.eventId,
                        truckId: b.truckId,
                        hostId: b.hostId,
                        status: b.status,
                        totalCents: b.totalCents,
                        hostPriceCents: b.hostPriceCents,
                        platformFeeCents: b.platformFeeCents,
                        stripePaymentIntentId: b.stripePaymentIntentId,
                        bookingConfirmedAt: b.bookingConfirmedAt,
                        cancelledAt: b.cancelledAt,
                        createdAt: b.createdAt,
                        event: {
                            id: b.event.id,
                            date: b.event.date,
                            startTime: b.event.startTime,
                            endTime: b.event.endTime,
                            status: b.event.status,
                            host: {
                                businessName: b.host.businessName,
                                address: b.host.address,
                                locationType: b.host.locationType,
                            },
                        },
                    }); });
                    res.json(formattedBookings);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error fetching truck bookings:", error_1);
                    res.status(500).json({ message: "Failed to fetch bookings" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Get all bookings for the user's host locations
    app.get("/api/bookings/my-host", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, userHosts_1, hostIds, bookings_2, formattedBookings, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    userId = req.user.id;
                    return [4 /*yield*/, db
                            .select()
                            .from(hosts)
                            .where(eq(hosts.userId, userId))];
                case 1:
                    userHosts_1 = _a.sent();
                    if (userHosts_1.length === 0) {
                        return [2 /*return*/, res.json([])];
                    }
                    hostIds = userHosts_1.map(function (h) { return h.id; });
                    return [4 /*yield*/, db
                            .select({
                            id: eventBookings.id,
                            eventId: eventBookings.eventId,
                            truckId: eventBookings.truckId,
                            hostId: eventBookings.hostId,
                            status: eventBookings.status,
                            totalCents: eventBookings.totalCents,
                            hostPriceCents: eventBookings.hostPriceCents,
                            platformFeeCents: eventBookings.platformFeeCents,
                            stripePaymentIntentId: eventBookings.stripePaymentIntentId,
                            bookingConfirmedAt: eventBookings.bookingConfirmedAt,
                            cancelledAt: eventBookings.cancelledAt,
                            createdAt: eventBookings.createdAt,
                            event: events,
                            host: hosts,
                            truck: restaurants,
                        })
                            .from(eventBookings)
                            .innerJoin(events, eq(eventBookings.eventId, events.id))
                            .innerJoin(hosts, eq(eventBookings.hostId, hosts.id))
                            .innerJoin(restaurants, eq(eventBookings.truckId, restaurants.id))
                            .where(or.apply(void 0, hostIds.map(function (id) { return eq(eventBookings.hostId, id); })))
                            .orderBy(desc(events.date))];
                case 2:
                    bookings_2 = _a.sent();
                    formattedBookings = bookings_2.map(function (b) { return ({
                        id: b.id,
                        eventId: b.eventId,
                        truckId: b.truckId,
                        hostId: b.hostId,
                        status: b.status,
                        totalCents: b.totalCents,
                        hostPriceCents: b.hostPriceCents,
                        platformFeeCents: b.platformFeeCents,
                        stripePaymentIntentId: b.stripePaymentIntentId,
                        bookingConfirmedAt: b.bookingConfirmedAt,
                        cancelledAt: b.cancelledAt,
                        createdAt: b.createdAt,
                        event: {
                            id: b.event.id,
                            date: b.event.date,
                            startTime: b.event.startTime,
                            endTime: b.event.endTime,
                            status: b.event.status,
                            host: {
                                businessName: b.host.businessName,
                                address: b.host.address,
                                locationType: b.host.locationType,
                            },
                        },
                        truck: {
                            id: b.truck.id,
                            name: b.truck.name,
                            cuisineType: b.truck.cuisineType,
                            imageUrl: b.truck.imageUrl,
                        },
                    }); });
                    res.json(formattedBookings);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error("Error fetching host bookings:", error_2);
                    res.status(500).json({ message: "Failed to fetch bookings" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Cancel a booking (with refund if paid)
    app.post("/api/bookings/:bookingId/cancel", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var bookingId, userId, booking, truck, remainingBookings, newStatus, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    bookingId = req.params.bookingId;
                    userId = req.user.id;
                    return [4 /*yield*/, db
                            .select()
                            .from(eventBookings)
                            .where(eq(eventBookings.id, bookingId))];
                case 1:
                    booking = (_a.sent())[0];
                    if (!booking) {
                        return [2 /*return*/, res.status(404).json({ message: "Booking not found" })];
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurants)
                            .where(eq(restaurants.id, booking.truckId))];
                case 2:
                    truck = _a.sent();
                    if (!truck.length || truck[0].ownerId !== userId) {
                        return [2 /*return*/, res
                                .status(403)
                                .json({ message: "Not authorized to cancel this booking" })];
                    }
                    // Check if already cancelled
                    if (booking.status === "cancelled") {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Booking is already cancelled" })];
                    }
                    // No refunds for cancellations.
                    // Update booking status
                    return [4 /*yield*/, db
                            .update(eventBookings)
                            .set({
                            status: "cancelled",
                            cancelledAt: new Date(),
                            cancellationReason: "Cancelled by food truck owner",
                            updatedAt: new Date(),
                        })
                            .where(eq(eventBookings.id, bookingId))];
                case 3:
                    // No refunds for cancellations.
                    // Update booking status
                    _a.sent();
                    return [4 /*yield*/, db
                            .select({ id: eventBookings.id })
                            .from(eventBookings)
                            .where(eq(eventBookings.eventId, booking.eventId))
                            .where(inArray(eventBookings.status, ["pending", "confirmed"]))];
                case 4:
                    remainingBookings = _a.sent();
                    newStatus = remainingBookings.length > 0 ? "open" : "open";
                    return [4 /*yield*/, db
                            .update(events)
                            .set({
                            status: newStatus,
                            bookedRestaurantId: null,
                        })
                            .where(eq(events.id, booking.eventId))];
                case 5:
                    _a.sent();
                    res.json({
                        message: "Booking cancelled successfully",
                        refundProcessed: false,
                    });
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _a.sent();
                    console.error("Error cancelling booking:", error_3);
                    res.status(500).json({ message: "Failed to cancel booking" });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    // Truck manual schedule (public or owner view)
    app.get("/api/trucks/:truckId/manual-schedule", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var truckId, truck, includePrivate, entries, filtered, error_4;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    truckId = req.params.truckId;
                    return [4 /*yield*/, db
                            .select({ id: restaurants.id })
                            .from(restaurants)
                            .where(eq(restaurants.id, truckId))];
                case 1:
                    truck = (_b.sent())[0];
                    if (!truck) {
                        return [2 /*return*/, res.status(404).json({ message: "Truck not found" })];
                    }
                    includePrivate = false;
                    if (!((_a = req.isAuthenticated) === null || _a === void 0 ? void 0 : _a.call(req))) return [3 /*break*/, 3];
                    return [4 /*yield*/, storage.verifyRestaurantOwnership(truckId, req.user.id)];
                case 2:
                    includePrivate = _b.sent();
                    _b.label = 3;
                case 3: return [4 /*yield*/, storage.getTruckManualSchedules(truckId)];
                case 4:
                    entries = _b.sent();
                    filtered = includePrivate
                        ? entries
                        : entries.filter(function (entry) { return entry.isPublic; });
                    res.json(filtered);
                    return [3 /*break*/, 6];
                case 5:
                    error_4 = _b.sent();
                    console.error("Error fetching manual schedule:", error_4);
                    res.status(500).json({ message: "Failed to fetch schedule" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    // Create manual schedule entry (owner only)
    app.post("/api/trucks/:truckId/manual-schedule", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var truckId, isAuthorized, schema, parsed, parsedDate, created, error_5;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    truckId = req.params.truckId;
                    return [4 /*yield*/, storage.verifyRestaurantOwnership(truckId, req.user.id)];
                case 1:
                    isAuthorized = _b.sent();
                    if (!isAuthorized) {
                        return [2 /*return*/, res.status(403).json({
                                message: "Unauthorized: You can only update schedules for trucks you own",
                            })];
                    }
                    schema = z.object({
                        date: z.string().min(1),
                        startTime: z.string().min(1),
                        endTime: z.string().min(1),
                        address: z.string().min(1),
                        locationName: z.string().optional(),
                        city: z.string().optional(),
                        state: z.string().optional(),
                        notes: z.string().optional(),
                        isPublic: z.boolean().optional(),
                    });
                    parsed = schema.parse(req.body);
                    parsedDate = new Date("".concat(parsed.date, "T00:00:00"));
                    if (Number.isNaN(parsedDate.getTime())) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid date" })];
                    }
                    return [4 /*yield*/, storage.createTruckManualSchedule({
                            truckId: truckId,
                            date: parsedDate,
                            startTime: parsed.startTime,
                            endTime: parsed.endTime,
                            locationName: parsed.locationName || null,
                            address: parsed.address,
                            city: parsed.city || null,
                            state: parsed.state || null,
                            notes: parsed.notes || null,
                            isPublic: (_a = parsed.isPublic) !== null && _a !== void 0 ? _a : true,
                        })];
                case 2:
                    created = _b.sent();
                    res.json(created);
                    return [3 /*break*/, 4];
                case 3:
                    error_5 = _b.sent();
                    console.error("Error creating manual schedule:", error_5);
                    res.status(500).json({ message: "Failed to create schedule entry" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Delete manual schedule entry (owner only)
    app.delete("/api/trucks/:truckId/manual-schedule/:scheduleId", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, truckId, scheduleId, isAuthorized, error_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    _a = req.params, truckId = _a.truckId, scheduleId = _a.scheduleId;
                    return [4 /*yield*/, storage.verifyRestaurantOwnership(truckId, req.user.id)];
                case 1:
                    isAuthorized = _b.sent();
                    if (!isAuthorized) {
                        return [2 /*return*/, res.status(403).json({
                                message: "Unauthorized: You can only update schedules for trucks you own",
                            })];
                    }
                    return [4 /*yield*/, storage.deleteTruckManualSchedule(scheduleId, truckId)];
                case 2:
                    _b.sent();
                    res.json({ message: "Schedule entry deleted" });
                    return [3 /*break*/, 4];
                case 3:
                    error_6 = _b.sent();
                    console.error("Error deleting manual schedule:", error_6);
                    res.status(500).json({ message: "Failed to delete schedule entry" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Public profile schedule (booked + accepted events + manual)
    app.get("/api/bookings/truck/:truckId/schedule", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var truckId, truck, today_1, bookingRows_1, acceptedInterestRows_1, bookingEventIds_1, schedule, manualEntries, manualSchedule, combined, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    truckId = req.params.truckId;
                    return [4 /*yield*/, db
                            .select({ id: restaurants.id, name: restaurants.name })
                            .from(restaurants)
                            .where(eq(restaurants.id, truckId))];
                case 1:
                    truck = (_a.sent())[0];
                    if (!truck) {
                        return [2 /*return*/, res.status(404).json({ message: "Truck not found" })];
                    }
                    today_1 = new Date();
                    today_1.setHours(0, 0, 0, 0);
                    return [4 /*yield*/, db
                            .select({
                            eventId: eventBookings.eventId,
                            status: eventBookings.status,
                            bookingConfirmedAt: eventBookings.bookingConfirmedAt,
                            createdAt: eventBookings.createdAt,
                            slotType: eventBookings.slotType,
                            event: events,
                            host: hosts,
                        })
                            .from(eventBookings)
                            .innerJoin(events, eq(eventBookings.eventId, events.id))
                            .innerJoin(hosts, eq(eventBookings.hostId, hosts.id))
                            .where(and(eq(eventBookings.truckId, truckId), or(eq(eventBookings.status, "confirmed"), eq(eventBookings.status, "pending")), or(eq(events.status, "open"), eq(events.status, "booked")), gte(events.date, today_1)))
                            .orderBy(desc(events.date))];
                case 2:
                    bookingRows_1 = _a.sent();
                    return [4 /*yield*/, db
                            .select({
                            eventId: eventInterests.eventId,
                            status: eventInterests.status,
                            createdAt: eventInterests.createdAt,
                            event: events,
                            host: hosts,
                        })
                            .from(eventInterests)
                            .innerJoin(events, eq(eventInterests.eventId, events.id))
                            .innerJoin(hosts, eq(events.hostId, hosts.id))
                            .where(and(eq(eventInterests.truckId, truckId), eq(eventInterests.status, "accepted"), or(eq(events.status, "open"), eq(events.status, "booked")), gte(events.date, today_1)))
                            .orderBy(desc(events.date))];
                case 3:
                    acceptedInterestRows_1 = _a.sent();
                    bookingEventIds_1 = new Set(bookingRows_1.map(function (row) { return row.eventId; }));
                    schedule = __spreadArray(__spreadArray([], bookingRows_1.map(function (row) { return ({
                        type: "booking",
                        status: row.status,
                        createdAt: row.createdAt,
                        bookingConfirmedAt: row.bookingConfirmedAt,
                        slotType: row.slotType,
                        event: {
                            id: row.event.id,
                            date: row.event.date,
                            startTime: row.event.startTime,
                            endTime: row.event.endTime,
                            status: row.event.status,
                            hostPriceCents: row.event.hostPriceCents,
                            requiresPayment: row.event.requiresPayment,
                        },
                        host: {
                            businessName: row.host.businessName,
                            address: row.host.address,
                            locationType: row.host.locationType,
                        },
                    }); }), true), acceptedInterestRows_1
                        .filter(function (row) {
                        return !bookingEventIds_1.has(row.eventId);
                    })
                        .map(function (row) { return ({
                        type: "accepted_interest",
                        status: row.status,
                        createdAt: row.createdAt,
                        event: {
                            id: row.event.id,
                            date: row.event.date,
                            startTime: row.event.startTime,
                            endTime: row.event.endTime,
                            status: row.event.status,
                            hostPriceCents: row.event.hostPriceCents,
                            requiresPayment: row.event.requiresPayment,
                        },
                        host: {
                            businessName: row.host.businessName,
                            address: row.host.address,
                            locationType: row.host.locationType,
                        },
                    }); }), true);
                    return [4 /*yield*/, storage.getTruckManualSchedules(truckId)];
                case 4:
                    manualEntries = _a.sent();
                    manualSchedule = manualEntries
                        .filter(function (entry) { return entry.isPublic; })
                        .filter(function (entry) { return entry.date >= today_1; })
                        .map(function (entry) { return ({
                        type: "manual",
                        status: "manual",
                        createdAt: entry.createdAt,
                        manual: {
                            id: entry.id,
                            date: entry.date,
                            startTime: entry.startTime,
                            endTime: entry.endTime,
                            locationName: entry.locationName,
                            address: entry.address,
                            city: entry.city,
                            state: entry.state,
                            notes: entry.notes,
                        },
                    }); });
                    combined = __spreadArray(__spreadArray([], schedule, true), manualSchedule, true).sort(function (a, b) {
                        var dateA = a.type === "manual"
                            ? new Date(a.manual.date).getTime()
                            : new Date(a.event.date).getTime();
                        var dateB = b.type === "manual"
                            ? new Date(b.manual.date).getTime()
                            : new Date(b.event.date).getTime();
                        return dateB - dateA;
                    });
                    res.json({
                        truck: { id: truck.id, name: truck.name },
                        schedule: combined,
                    });
                    return [3 /*break*/, 6];
                case 5:
                    error_7 = _a.sent();
                    console.error("Error fetching truck schedule:", error_7);
                    res.status(500).json({ message: "Failed to fetch schedule" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    // Admin/staff-only: booking request from public profile
    app.post("/api/trucks/:truckId/booking-request", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var truckId, schema, parsed, truck, owner, subject, html, error_8;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    truckId = req.params.truckId;
                    schema = z.object({
                        name: z.string().min(1),
                        email: z.string().email(),
                        phone: z.string().min(5),
                        expectedGuests: z.string().min(1),
                        date: z.string().min(1),
                        startTime: z.string().min(1),
                        endTime: z.string().min(1),
                        location: z.string().min(1),
                        notes: z.string().optional(),
                    });
                    parsed = schema.parse(req.body);
                    return [4 /*yield*/, storage.getRestaurant(truckId)];
                case 1:
                    truck = _b.sent();
                    if (!truck) {
                        return [2 /*return*/, res.status(404).json({ message: "Truck not found" })];
                    }
                    return [4 /*yield*/, storage.getUser(truck.ownerId)];
                case 2:
                    owner = _b.sent();
                    if (!owner || !owner.email) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Truck owner email not available" })];
                    }
                    subject = "New booking request for ".concat(truck.name);
                    html = "\n          <h2>New booking request for ".concat(truck.name, "</h2>\n          <p><strong>Requester:</strong> ").concat(parsed.name, "</p>\n          <p><strong>Email:</strong> ").concat(parsed.email, "</p>\n          <p><strong>Phone:</strong> ").concat(parsed.phone, "</p>\n          <p><strong>Expected Guests:</strong> ").concat(parsed.expectedGuests, "</p>\n          <p><strong>Date:</strong> ").concat(parsed.date, "</p>\n          <p><strong>Time:</strong> ").concat(parsed.startTime, " - ").concat(parsed.endTime, "</p>\n          <p><strong>Location:</strong> ").concat(parsed.location, "</p>\n          ").concat(parsed.notes ? "<p><strong>Notes:</strong> ".concat(parsed.notes, "</p>") : "", "\n        ");
                    return [4 /*yield*/, emailService.sendBasicEmail(owner.email, subject, html)];
                case 3:
                    _b.sent();
                    if (!process.env.TWILIO_ACCOUNT_SID) {
                        console.warn("SMS not configured for booking requests (missing TWILIO_ACCOUNT_SID).");
                    }
                    return [4 /*yield*/, storage.createTelemetryEvent({
                            eventName: "truck_booking_request_created",
                            userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null,
                            properties: {
                                truckId: truckId,
                                requesterEmail: parsed.email,
                                expectedGuests: parsed.expectedGuests,
                            },
                        })];
                case 4:
                    _b.sent();
                    res.json({ message: "Request sent" });
                    return [3 /*break*/, 6];
                case 5:
                    error_8 = _b.sent();
                    console.error("Error sending booking request:", error_8);
                    if (error_8 instanceof z.ZodError) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Invalid request data", errors: error_8.errors })];
                    }
                    res.status(500).json({ message: "Failed to send request" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
}

