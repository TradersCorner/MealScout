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
import { isAuthenticated, isRestaurantOwner, } from "../unifiedAuth.js";
import { eventBookings, insertEventInterestSchema, restaurants, } from "@shared/schema";
import { asc, eq, inArray } from "drizzle-orm";
export function registerEventRoutes(app) {
    var _this = this;
    // Get all upcoming events (public)
    app.get("/api/events/upcoming", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var events, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.getAllUpcomingEvents()];
                case 1:
                    events = _a.sent();
                    res.json(events.filter(function (event) { return !event.requiresPayment; }));
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error fetching upcoming events:", error_1);
                    res.status(500).json({ message: "Failed to fetch events" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Truck Discovery (authenticated)
    app.get("/api/events", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var events, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.getAllUpcomingEvents()];
                case 1:
                    events = _a.sent();
                    res.json(events.filter(function (event) { return !event.requiresPayment; }));
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error fetching all events:", error_2);
                    res.status(500).json({ message: "Failed to fetch events" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Parking Pass listings (truck-paid slots only)
    app.get("/api/parking-pass", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var events_1, hasPricing_1, parkingEvents, eventIds, bookingRows, _a, bookingsByEvent_1, _i, bookingRows_1, row, list, enhancedEvents, error_3;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, storage.ensureDraftParkingPassesForHosts()];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, storage.getAllUpcomingEvents()];
                case 2:
                    events_1 = _c.sent();
                    hasPricing_1 = function (event) {
                        var _a, _b, _c, _d, _e, _f;
                        return ((_a = event.breakfastPriceCents) !== null && _a !== void 0 ? _a : 0) > 0 ||
                            ((_b = event.lunchPriceCents) !== null && _b !== void 0 ? _b : 0) > 0 ||
                            ((_c = event.dinnerPriceCents) !== null && _c !== void 0 ? _c : 0) > 0 ||
                            ((_d = event.dailyPriceCents) !== null && _d !== void 0 ? _d : 0) > 0 ||
                            ((_e = event.weeklyPriceCents) !== null && _e !== void 0 ? _e : 0) > 0 ||
                            ((_f = event.monthlyPriceCents) !== null && _f !== void 0 ? _f : 0) > 0;
                    };
                    parkingEvents = events_1.filter(function (event) { return event.requiresPayment && hasPricing_1(event); });
                    eventIds = parkingEvents.map(function (event) { return event.id; });
                    if (!(eventIds.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, db
                            .select({
                            eventId: eventBookings.eventId,
                            spotNumber: eventBookings.spotNumber,
                            bookingConfirmedAt: eventBookings.bookingConfirmedAt,
                            slotType: eventBookings.slotType,
                            truckId: eventBookings.truckId,
                            truckName: restaurants.name,
                        })
                            .from(eventBookings)
                            .innerJoin(restaurants, eq(eventBookings.truckId, restaurants.id))
                            .where(inArray(eventBookings.eventId, eventIds))
                            .where(inArray(eventBookings.status, ["confirmed"]))
                            .orderBy(asc(eventBookings.bookingConfirmedAt))];
                case 3:
                    _a = _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = [];
                    _c.label = 5;
                case 5:
                    bookingRows = _a;
                    bookingsByEvent_1 = new Map();
                    for (_i = 0, bookingRows_1 = bookingRows; _i < bookingRows_1.length; _i++) {
                        row = bookingRows_1[_i];
                        list = (_b = bookingsByEvent_1.get(row.eventId)) !== null && _b !== void 0 ? _b : [];
                        list.push(row);
                        bookingsByEvent_1.set(row.eventId, list);
                    }
                    enhancedEvents = parkingEvents.map(function (event) {
                        var _a, _b;
                        var rows = (_a = bookingsByEvent_1.get(event.id)) !== null && _a !== void 0 ? _a : [];
                        var maxSpots = (_b = event.maxTrucks) !== null && _b !== void 0 ? _b : 1;
                        var usedSpotNumbers = new Set();
                        for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                            var row = rows_1[_i];
                            if (row.spotNumber && row.spotNumber > 0) {
                                usedSpotNumbers.add(row.spotNumber);
                            }
                        }
                        var nextSpot = 1;
                        for (var _c = 0, rows_2 = rows; _c < rows_2.length; _c++) {
                            var row = rows_2[_c];
                            if (row.spotNumber && row.spotNumber > 0) {
                                continue;
                            }
                            while (usedSpotNumbers.has(nextSpot) && nextSpot <= maxSpots) {
                                nextSpot += 1;
                            }
                            if (nextSpot <= maxSpots) {
                                usedSpotNumbers.add(nextSpot);
                                nextSpot += 1;
                            }
                        }
                        var availableSpotNumbers = [];
                        for (var spot = 1; spot <= maxSpots; spot += 1) {
                            if (!usedSpotNumbers.has(spot)) {
                                availableSpotNumbers.push(spot);
                            }
                        }
                        return __assign(__assign({}, event), { spotCount: maxSpots, bookedSpots: Math.min(rows.length, maxSpots), availableSpotNumbers: availableSpotNumbers, bookings: rows.map(function (row) { return ({
                                truckId: row.truckId,
                                truckName: row.truckName,
                                slotType: row.slotType,
                                spotNumber: row.spotNumber,
                                bookingConfirmedAt: row.bookingConfirmedAt,
                            }); }) });
                    });
                    res.json(enhancedEvents);
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _c.sent();
                    console.error("Error fetching parking pass listings:", error_3);
                    res.status(500).json({ message: "Failed to fetch parking pass listings" });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/events/:eventId/interests", isRestaurantOwner, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var eventId_1, _a, restaurantId_1, message, ownsRestaurant, event_1, today, existing, parsed, interest, error_4;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    eventId_1 = req.params.eventId;
                    _a = req.body, restaurantId_1 = _a.restaurantId, message = _a.message;
                    if (!restaurantId_1) {
                        return [2 /*return*/, res.status(400).json({ message: "Restaurant ID is required" })];
                    }
                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId_1, req.user.id)];
                case 1:
                    ownsRestaurant = _b.sent();
                    if (!ownsRestaurant) {
                        return [2 /*return*/, res
                                .status(403)
                                .json({
                                message: "You can only express interest for restaurants you own",
                            })];
                    }
                    return [4 /*yield*/, storage.getEvent(eventId_1)];
                case 2:
                    event_1 = _b.sent();
                    if (!event_1) {
                        return [2 /*return*/, res.status(404).json({ message: "Event not found" })];
                    }
                    if (event_1.requiresPayment) {
                        return [2 /*return*/, res.status(400).json({
                                message: "This listing uses Parking Pass. Events do not accept payments.",
                            })];
                    }
                    today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (new Date(event_1.date) < today) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Cannot express interest in past events" })];
                    }
                    return [4 /*yield*/, storage.getEventInterestByTruckId(eventId_1, restaurantId_1)];
                case 3:
                    existing = _b.sent();
                    if (existing) {
                        return [2 /*return*/, res
                                .status(200)
                                .json({
                                message: "Interest already expressed",
                                interest: existing,
                            })];
                    }
                    parsed = insertEventInterestSchema.parse({
                        eventId: eventId_1,
                        truckId: restaurantId_1,
                        message: message,
                    });
                    return [4 /*yield*/, storage.createEventInterest(parsed)];
                case 4:
                    interest = _b.sent();
                    // Send notification to host (fire and forget)
                    (function () { return __awaiter(_this, void 0, void 0, function () {
                        var event_2, host, truck, hostUser, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 8, , 9]);
                                    return [4 /*yield*/, storage.getEvent(eventId_1)];
                                case 1:
                                    event_2 = _a.sent();
                                    if (!event_2) return [3 /*break*/, 7];
                                    // Telemetry: Interest Created
                                    return [4 /*yield*/, storage.createTelemetryEvent({
                                            eventName: "interest_created",
                                            userId: req.user.id,
                                            properties: {
                                                eventId: eventId_1,
                                                truckId: restaurantId_1,
                                                eventDate: event_2.date,
                                            },
                                        })];
                                case 2:
                                    // Telemetry: Interest Created
                                    _a.sent();
                                    return [4 /*yield*/, storage.getHost(event_2.hostId)];
                                case 3:
                                    host = _a.sent();
                                    return [4 /*yield*/, storage.getRestaurant(restaurantId_1)];
                                case 4:
                                    truck = _a.sent();
                                    if (!(host && truck)) return [3 /*break*/, 7];
                                    return [4 /*yield*/, storage.getUser(host.userId)];
                                case 5:
                                    hostUser = _a.sent();
                                    if (!(hostUser && hostUser.email)) return [3 /*break*/, 7];
                                    return [4 /*yield*/, emailService.sendInterestNotification(hostUser.email, host.businessName, truck.name, new Date(event_2.date).toLocaleDateString())];
                                case 6:
                                    _a.sent();
                                    _a.label = 7;
                                case 7: return [3 /*break*/, 9];
                                case 8:
                                    err_1 = _a.sent();
                                    console.error("Failed to send interest notification:", err_1);
                                    return [3 /*break*/, 9];
                                case 9: return [2 /*return*/];
                            }
                        });
                    }); })();
                    res.status(201).json({ message: "Interest sent", interest: interest });
                    return [3 /*break*/, 6];
                case 5:
                    error_4 = _b.sent();
                    console.error("Error creating event interest:", error_4);
                    if (error_4 instanceof z.ZodError) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Invalid data", errors: error_4.errors })];
                    }
                    res.status(500).json({ message: "Failed to submit interest" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/events/signup", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var schema, parsed, updatedUserType, updatedUser, adminEmail, subject, html, error_5;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    schema = z.object({
                        eventName: z.string().min(1),
                        date: z.string().min(1),
                        city: z.string().min(1),
                        expectedCrowd: z.string().min(1),
                        contactEmail: z.string().email(),
                        contactPhone: z.string().optional(),
                        notes: z.string().optional(),
                    });
                    parsed = schema.parse(req.body);
                    updatedUserType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
                    if (!(((_b = req.user) === null || _b === void 0 ? void 0 : _b.userType) === "customer")) return [3 /*break*/, 2];
                    return [4 /*yield*/, storage.updateUserType(req.user.id, "event_coordinator")];
                case 1:
                    updatedUser = _c.sent();
                    updatedUserType = updatedUser.userType;
                    _c.label = 2;
                case 2:
                    adminEmail = process.env.ADMIN_ALERT_EMAIL || "info.mealscout@gmail.com";
                    subject = "New event coordinator request: ".concat(parsed.eventName);
                    html = "\n        <h2>New event coordinator request</h2>\n        <p><strong>Event:</strong> ".concat(parsed.eventName, "</p>\n        <p><strong>Date:</strong> ").concat(parsed.date, "</p>\n        <p><strong>City:</strong> ").concat(parsed.city, "</p>\n        <p><strong>Expected Crowd:</strong> ").concat(parsed.expectedCrowd, "</p>\n        <p><strong>Contact Email:</strong> ").concat(parsed.contactEmail, "</p>\n        ").concat(parsed.contactPhone ? "<p><strong>Phone:</strong> ".concat(parsed.contactPhone, "</p>") : "", "\n        ").concat(parsed.notes ? "<p><strong>Notes:</strong> ".concat(parsed.notes, "</p>") : "", "\n      ");
                    return [4 /*yield*/, emailService.sendBasicEmail(adminEmail, subject, html)];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, storage.createTelemetryEvent({
                            eventName: "event_coordinator_request_created",
                            userId: req.user.id,
                            properties: {
                                eventName: parsed.eventName,
                                city: parsed.city,
                                expectedCrowd: parsed.expectedCrowd,
                            },
                        })];
                case 4:
                    _c.sent();
                    res.json({ message: "Request submitted", userType: updatedUserType });
                    return [3 /*break*/, 6];
                case 5:
                    error_5 = _c.sent();
                    console.error("Error submitting event coordinator request:", error_5);
                    if (error_5 instanceof z.ZodError) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Invalid data", errors: error_5.errors })];
                    }
                    res.status(500).json({ message: "Failed to submit request" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
}

