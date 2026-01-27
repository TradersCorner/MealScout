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
import { insertHostSchema, insertEventSchema, events, eventSeries, hosts, eventBookings, parkingPassBlackoutDates, } from "@shared/schema";
import { and, asc, eq, gte, inArray, isNotNull, lt } from "drizzle-orm";
import { isAuthenticated } from "../unifiedAuth.js";
import Stripe from "stripe";
import { getHostByUserId, getEventAndHostForUser, getInterestEventAndHostForUser, hostOwnsEvent, } from "../services/hostOwnership.js";
import { computeAcceptedCount, shouldBlockAcceptance, buildCapacityFullError, computeFillRate, } from "../services/interestDecision.js";
var stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
export function registerHostRoutes(app) {
    var _this = this;
    var normalizeLocationValue = function (value) {
        return (value !== null && value !== void 0 ? value : "").trim().toLowerCase();
    };
    var buildLocationKey = function (address, city, state) {
        return [
            normalizeLocationValue(address),
            normalizeLocationValue(city),
            normalizeLocationValue(state),
        ].join("|");
    };
    var getActiveParkingPassSeriesId = function (hostId) { return __awaiter(_this, void 0, void 0, function () {
        var today, rows, hasActivePricing, activeRow;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return [4 /*yield*/, db
                            .select({
                            seriesId: events.seriesId,
                            date: events.date,
                            breakfastPriceCents: events.breakfastPriceCents,
                            lunchPriceCents: events.lunchPriceCents,
                            dinnerPriceCents: events.dinnerPriceCents,
                            dailyPriceCents: events.dailyPriceCents,
                            weeklyPriceCents: events.weeklyPriceCents,
                            monthlyPriceCents: events.monthlyPriceCents,
                        })
                            .from(events)
                            .where(and(eq(events.hostId, hostId), eq(events.requiresPayment, true), gte(events.date, today), isNotNull(events.seriesId)))
                            .orderBy(asc(events.date))
                            .limit(14)];
                case 1:
                    rows = _b.sent();
                    hasActivePricing = function (row) {
                        var _a, _b, _c, _d, _e, _f;
                        return ((_a = row.breakfastPriceCents) !== null && _a !== void 0 ? _a : 0) > 0 ||
                            ((_b = row.lunchPriceCents) !== null && _b !== void 0 ? _b : 0) > 0 ||
                            ((_c = row.dinnerPriceCents) !== null && _c !== void 0 ? _c : 0) > 0 ||
                            ((_d = row.dailyPriceCents) !== null && _d !== void 0 ? _d : 0) > 0 ||
                            ((_e = row.weeklyPriceCents) !== null && _e !== void 0 ? _e : 0) > 0 ||
                            ((_f = row.monthlyPriceCents) !== null && _f !== void 0 ? _f : 0) > 0;
                    };
                    activeRow = rows.find(function (row) {
                        return hasActivePricing(row);
                    });
                    return [2 /*return*/, (_a = activeRow === null || activeRow === void 0 ? void 0 : activeRow.seriesId) !== null && _a !== void 0 ? _a : null];
            }
        });
    }); };
    // Host Profile & Events
    app.post("/api/hosts", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, existing, parsed, existingHosts_1, newKey_1, hasDuplicate, host, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    userId = req.user.id;
                    return [4 /*yield*/, getHostByUserId(userId)];
                case 1:
                    existing = _c.sent();
                    if (existing) {
                        return [2 /*return*/, res.status(400).json({ message: "Host profile already exists" })];
                    }
                    parsed = insertHostSchema.parse(__assign(__assign({}, req.body), { userId: userId }));
                    return [4 /*yield*/, db
                            .select({
                            id: hosts.id,
                            address: hosts.address,
                            city: hosts.city,
                            state: hosts.state,
                        })
                            .from(hosts)
                            .where(eq(hosts.userId, userId))];
                case 2:
                    existingHosts_1 = _c.sent();
                    newKey_1 = buildLocationKey(parsed.address, (_a = parsed.city) !== null && _a !== void 0 ? _a : null, (_b = parsed.state) !== null && _b !== void 0 ? _b : null);
                    hasDuplicate = existingHosts_1.some(function (host) {
                        return buildLocationKey(host.address, host.city, host.state) === newKey_1;
                    });
                    if (hasDuplicate) {
                        return [2 /*return*/, res.status(409).json({
                                message: "You already have a location for this address. Edit the existing location instead.",
                            })];
                    }
                    return [4 /*yield*/, storage.createHost(parsed)];
                case 3:
                    host = _c.sent();
                    // Hosts should keep their existing user type (typically "customer").
                    // We no longer auto-upgrade hosts into restaurant_owner accounts so
                    // they don't see restaurant dashboards or deal creation flows.
                    res.status(201).json(host);
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _c.sent();
                    console.error("Error creating host:", error_1);
                    if (error_1 instanceof z.ZodError) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Invalid host data", errors: error_1.errors })];
                    }
                    res
                        .status(400)
                        .json({ message: error_1.message || "Failed to create host profile" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/hosts/me", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, host, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    userId = req.user.id;
                    return [4 /*yield*/, getHostByUserId(userId)];
                case 1:
                    host = _a.sent();
                    if (!host) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    res.json(host);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error fetching host profile:", error_2);
                    res.status(500).json({ message: "Failed to fetch host profile" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/hosts", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, hostProfiles, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    userId = req.user.id;
                    return [4 /*yield*/, storage.getHostsByUserId(userId)];
                case 1:
                    hostProfiles = _a.sent();
                    res.json(hostProfiles);
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error fetching host profiles:", error_3);
                    res.status(500).json({ message: "Failed to fetch host profiles" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/hosts/:hostId", isAuthenticated, function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var reserved, hostId, userId, host, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    reserved = new Set(["events", "event-series"]);
                    if (reserved.has(req.params.hostId)) {
                        return [2 /*return*/, next()];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    hostId = req.params.hostId;
                    userId = req.user.id;
                    return [4 /*yield*/, storage.getHost(hostId)];
                case 2:
                    host = _a.sent();
                    if (!host || host.userId !== userId) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    res.json(host);
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.error("Error fetching host profile:", error_4);
                    res.status(500).json({ message: "Failed to fetch host profile" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/hosts/me", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, host, amenitiesSchema, parsedAmenities, updated, error_5;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    userId = req.user.id;
                    return [4 /*yield*/, getHostByUserId(userId)];
                case 1:
                    host = _b.sent();
                    if (!host) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    amenitiesSchema = z.record(z.boolean()).optional().nullable();
                    parsedAmenities = amenitiesSchema.parse((_a = req.body) === null || _a === void 0 ? void 0 : _a.amenities);
                    return [4 /*yield*/, db
                            .update(hosts)
                            .set({
                            amenities: parsedAmenities !== null && parsedAmenities !== void 0 ? parsedAmenities : null,
                            updatedAt: new Date(),
                        })
                            .where(eq(hosts.id, host.id))
                            .returning()];
                case 2:
                    updated = (_b.sent())[0];
                    res.json(updated);
                    return [3 /*break*/, 4];
                case 3:
                    error_5 = _b.sent();
                    console.error("Error updating host profile:", error_5);
                    if (error_5 instanceof z.ZodError) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Invalid amenities data", errors: error_5.errors })];
                    }
                    res.status(500).json({ message: "Failed to update host profile" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/hosts/:hostId", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var hostId, userId, host_1, updateSchema, parsed, nextAddress, nextCity, nextState, nextKey_1, siblingHosts_1, hasDuplicate, updated, error_6;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    _m.trys.push([0, 5, , 6]);
                    hostId = req.params.hostId;
                    userId = req.user.id;
                    return [4 /*yield*/, storage.getHost(hostId)];
                case 1:
                    host_1 = _m.sent();
                    if (!host_1 || host_1.userId !== userId) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    updateSchema = z.object({
                        businessName: z.string().min(1).optional(),
                        address: z.string().min(1).optional(),
                        city: z.string().min(1).optional(),
                        state: z.string().min(2).optional(),
                        locationType: z.string().min(1).optional(),
                        contactPhone: z.string().min(5).optional(),
                        notes: z.string().optional().nullable(),
                        amenities: z.record(z.boolean()).optional().nullable(),
                        spotCount: z.number().int().min(1).optional(),
                    });
                    parsed = updateSchema.parse(req.body || {});
                    nextAddress = (_a = parsed.address) !== null && _a !== void 0 ? _a : host_1.address;
                    nextCity = (_b = parsed.city) !== null && _b !== void 0 ? _b : host_1.city;
                    nextState = (_c = parsed.state) !== null && _c !== void 0 ? _c : host_1.state;
                    nextKey_1 = buildLocationKey(nextAddress, nextCity, nextState);
                    return [4 /*yield*/, db
                            .select({
                            id: hosts.id,
                            address: hosts.address,
                            city: hosts.city,
                            state: hosts.state,
                        })
                            .from(hosts)
                            .where(eq(hosts.userId, userId))];
                case 2:
                    siblingHosts_1 = _m.sent();
                    hasDuplicate = siblingHosts_1.some(function (item) {
                        return item.id !== host_1.id &&
                            buildLocationKey(item.address, item.city, item.state) === nextKey_1;
                    });
                    if (hasDuplicate) {
                        return [2 /*return*/, res.status(409).json({
                                message: "Another location already uses this address. Edit that location instead.",
                            })];
                    }
                    return [4 /*yield*/, db
                            .update(hosts)
                            .set({
                            businessName: (_d = parsed.businessName) !== null && _d !== void 0 ? _d : host_1.businessName,
                            address: nextAddress,
                            city: nextCity,
                            state: nextState,
                            locationType: (_e = parsed.locationType) !== null && _e !== void 0 ? _e : host_1.locationType,
                            contactPhone: (_f = parsed.contactPhone) !== null && _f !== void 0 ? _f : host_1.contactPhone,
                            notes: (_g = parsed.notes) !== null && _g !== void 0 ? _g : host_1.notes,
                            amenities: (_j = (_h = parsed.amenities) !== null && _h !== void 0 ? _h : host_1.amenities) !== null && _j !== void 0 ? _j : null,
                            spotCount: (_l = (_k = parsed.spotCount) !== null && _k !== void 0 ? _k : host_1.spotCount) !== null && _l !== void 0 ? _l : 1,
                            updatedAt: new Date(),
                        })
                            .where(eq(hosts.id, host_1.id))
                            .returning()];
                case 3:
                    updated = (_m.sent())[0];
                    return [4 /*yield*/, storage.ensureDraftParkingPassForHost(updated.id)];
                case 4:
                    _m.sent();
                    res.json(updated);
                    return [3 /*break*/, 6];
                case 5:
                    error_6 = _m.sent();
                    console.error("Error updating host profile:", error_6);
                    if (error_6 instanceof z.ZodError) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Invalid amenities data", errors: error_6.errors })];
                    }
                    res.status(500).json({ message: "Failed to update host profile" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/hosts/:hostId/blackout-dates", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var hostId, userId, host, seriesId, blackoutDates, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    hostId = req.params.hostId;
                    userId = req.user.id;
                    return [4 /*yield*/, storage.getHost(hostId)];
                case 1:
                    host = _a.sent();
                    if (!host || host.userId !== userId) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    return [4 /*yield*/, getActiveParkingPassSeriesId(hostId)];
                case 2:
                    seriesId = _a.sent();
                    if (!seriesId) {
                        return [2 /*return*/, res.json([])];
                    }
                    return [4 /*yield*/, storage.getParkingPassBlackoutDates(seriesId)];
                case 3:
                    blackoutDates = _a.sent();
                    res.json(blackoutDates);
                    return [3 /*break*/, 5];
                case 4:
                    error_7 = _a.sent();
                    console.error("Error fetching blackout dates:", error_7);
                    res.status(500).json({ message: "Failed to fetch blackout dates" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/hosts/:hostId/blackout-dates", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var hostId, userId, host, seriesId, date, created, error_8;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    hostId = req.params.hostId;
                    userId = req.user.id;
                    return [4 /*yield*/, storage.getHost(hostId)];
                case 1:
                    host = _b.sent();
                    if (!host || host.userId !== userId) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    return [4 /*yield*/, getActiveParkingPassSeriesId(hostId)];
                case 2:
                    seriesId = _b.sent();
                    if (!seriesId) {
                        return [2 /*return*/, res
                                .status(404)
                                .json({ message: "No active parking pass found." })];
                    }
                    date = new Date((_a = req.body) === null || _a === void 0 ? void 0 : _a.date);
                    if (Number.isNaN(date.getTime())) {
                        return [2 /*return*/, res.status(400).json({ message: "Valid date required" })];
                    }
                    return [4 /*yield*/, storage.createParkingPassBlackoutDate({
                            seriesId: seriesId,
                            date: date,
                        })];
                case 3:
                    created = _b.sent();
                    res.status(201).json(created);
                    return [3 /*break*/, 5];
                case 4:
                    error_8 = _b.sent();
                    console.error("Error creating blackout date:", error_8);
                    res.status(500).json({ message: "Failed to create blackout date" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.delete("/api/hosts/:hostId/blackout-dates", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var hostId, userId, host, date, today, seriesId, error_9;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    hostId = req.params.hostId;
                    userId = req.user.id;
                    return [4 /*yield*/, storage.getHost(hostId)];
                case 1:
                    host = _b.sent();
                    if (!host || host.userId !== userId) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    date = new Date((_a = req.body) === null || _a === void 0 ? void 0 : _a.date);
                    if (Number.isNaN(date.getTime())) {
                        return [2 /*return*/, res.status(400).json({ message: "Valid date required" })];
                    }
                    today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (date <= today) {
                        return [2 /*return*/, res.status(400).json({
                                message: "Same-day blackout dates cannot be removed.",
                            })];
                    }
                    return [4 /*yield*/, getActiveParkingPassSeriesId(hostId)];
                case 2:
                    seriesId = _b.sent();
                    if (!seriesId) {
                        return [2 /*return*/, res
                                .status(404)
                                .json({ message: "No active parking pass found." })];
                    }
                    return [4 /*yield*/, storage.deleteParkingPassBlackoutDate(seriesId, date)];
                case 3:
                    _b.sent();
                    res.json({ message: "Blackout date removed" });
                    return [3 /*break*/, 5];
                case 4:
                    error_9 = _b.sent();
                    console.error("Error deleting blackout date:", error_9);
                    res.status(500).json({ message: "Failed to delete blackout date" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.delete("/api/hosts/:hostId", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var hostId, userId, host, existingBookings, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    hostId = req.params.hostId;
                    userId = req.user.id;
                    return [4 /*yield*/, storage.getHost(hostId)];
                case 1:
                    host = _a.sent();
                    if (!host || host.userId !== userId) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    return [4 /*yield*/, db
                            .select({ id: eventBookings.id })
                            .from(eventBookings)
                            .where(eq(eventBookings.hostId, host.id))
                            .limit(1)];
                case 2:
                    existingBookings = _a.sent();
                    if (existingBookings.length > 0) {
                        return [2 /*return*/, res.status(409).json({
                                message: "This location has bookings and cannot be deleted. Contact support if you need help.",
                            })];
                    }
                    return [4 /*yield*/, db.delete(hosts).where(eq(hosts.id, host.id))];
                case 3:
                    _a.sent();
                    res.json({ message: "Location deleted" });
                    return [3 /*break*/, 5];
                case 4:
                    error_10 = _a.sent();
                    console.error("Error deleting host profile:", error_10);
                    res.status(500).json({ message: "Failed to delete host profile" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/hosts/events", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, hostId, host, breakfastPriceCents, lunchPriceCents, dinnerPriceCents, hasAnySlotPrice, parseOverrideCents, slotSum, dailyPriceCents, weeklyOverrideCents, monthlyOverrideCents, weeklyPriceCents, monthlyPriceCents, daysOfWeekSchema, daysOfWeek, spotCount, parsed, _a, startHour, startMinute, _b, endHour, endMinute, startMinutes, endMinutes, today, existingPaidEvents_1, hasActivePricing, activePaidEvents, draftEventIds, draftSeriesIds, horizon, hardCapEnabled, series, seriesId, existingEvents_1, blackoutRows_1, _c, blackoutSet, existingKeys, newEvents, cursor, dateKey, key, eventPayload, createdEvents, error_11;
        var _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    _o.trys.push([0, 14, , 15]);
                    userId = req.user.id;
                    hostId = (_d = req.body) === null || _d === void 0 ? void 0 : _d.hostId;
                    if (!hostId) {
                        return [2 /*return*/, res.status(400).json({ message: "Host ID required" })];
                    }
                    return [4 /*yield*/, storage.getHost(hostId)];
                case 1:
                    host = _o.sent();
                    if (!host || host.userId !== userId) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    if (req.user.userType === "event_coordinator" || host.locationType === "event_coordinator") {
                        return [2 /*return*/, res.status(403).json({
                                message: "Event coordinators can only post events, not Parking Pass listings.",
                            })];
                    }
                    if (!((_e = req.body) === null || _e === void 0 ? void 0 : _e.requiresPayment)) {
                        return [2 /*return*/, res.status(400).json({
                                message: "Hosts can only create Parking Pass listings.",
                            })];
                    }
                    breakfastPriceCents = Number(req.body.breakfastPriceCents || 0);
                    lunchPriceCents = Number(req.body.lunchPriceCents || 0);
                    dinnerPriceCents = Number(req.body.dinnerPriceCents || 0);
                    hasAnySlotPrice = breakfastPriceCents > 0 || lunchPriceCents > 0 || dinnerPriceCents > 0;
                    if (!hasAnySlotPrice) {
                        return [2 /*return*/, res.status(400).json({
                                message: "At least one slot price is required.",
                            })];
                    }
                    parseOverrideCents = function (value) {
                        if (value === null || value === undefined || value === "")
                            return null;
                        var parsed = Number(value);
                        if (!Number.isFinite(parsed))
                            return null;
                        return Math.max(0, Math.round(parsed));
                    };
                    slotSum = breakfastPriceCents + lunchPriceCents + dinnerPriceCents;
                    dailyPriceCents = slotSum;
                    weeklyOverrideCents = parseOverrideCents((_f = req.body) === null || _f === void 0 ? void 0 : _f.weeklyPriceCents);
                    monthlyOverrideCents = parseOverrideCents((_g = req.body) === null || _g === void 0 ? void 0 : _g.monthlyPriceCents);
                    weeklyPriceCents = weeklyOverrideCents !== null && weeklyOverrideCents !== void 0 ? weeklyOverrideCents : slotSum * 7;
                    monthlyPriceCents = monthlyOverrideCents !== null && monthlyOverrideCents !== void 0 ? monthlyOverrideCents : slotSum * 30;
                    daysOfWeekSchema = z.array(z.number().int().min(0).max(6));
                    daysOfWeek = daysOfWeekSchema.parse(((_h = req.body) === null || _h === void 0 ? void 0 : _h.daysOfWeek) || []);
                    if (daysOfWeek.length === 0) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "At least one day of week is required." })];
                    }
                    spotCount = Number((_k = (_j = req.body.maxTrucks) !== null && _j !== void 0 ? _j : host.spotCount) !== null && _k !== void 0 ? _k : 1);
                    if (!Number.isFinite(spotCount) || spotCount < 1) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Number of spots must be at least 1" })];
                    }
                    if (!(host.spotCount !== spotCount)) return [3 /*break*/, 3];
                    return [4 /*yield*/, db
                            .update(hosts)
                            .set({ spotCount: spotCount, updatedAt: new Date() })
                            .where(eq(hosts.id, host.id))];
                case 2:
                    _o.sent();
                    _o.label = 3;
                case 3:
                    parsed = insertEventSchema.parse(__assign(__assign({}, req.body), { date: new Date(), requiresPayment: true, hostId: host.id, maxTrucks: spotCount, breakfastPriceCents: breakfastPriceCents || null, lunchPriceCents: lunchPriceCents || null, dinnerPriceCents: dinnerPriceCents || null, dailyPriceCents: dailyPriceCents, weeklyPriceCents: weeklyPriceCents, monthlyPriceCents: monthlyPriceCents, hostPriceCents: slotSum }));
                    _a = parsed.startTime.split(":").map(Number), startHour = _a[0], startMinute = _a[1];
                    _b = parsed.endTime.split(":").map(Number), endHour = _b[0], endMinute = _b[1];
                    startMinutes = startHour * 60 + startMinute;
                    endMinutes = endHour * 60 + endMinute;
                    if (endMinutes <= startMinutes) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "End time must be after start time" })];
                    }
                    // Validation: Spots >= 1
                    if (parsed.maxTrucks !== undefined && parsed.maxTrucks < 1) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Number of spots must be at least 1" })];
                    }
                    today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return [4 /*yield*/, db
                            .select({
                            id: events.id,
                            seriesId: events.seriesId,
                            breakfastPriceCents: events.breakfastPriceCents,
                            lunchPriceCents: events.lunchPriceCents,
                            dinnerPriceCents: events.dinnerPriceCents,
                            dailyPriceCents: events.dailyPriceCents,
                            weeklyPriceCents: events.weeklyPriceCents,
                            monthlyPriceCents: events.monthlyPriceCents,
                        })
                            .from(events)
                            .where(and(eq(events.hostId, host.id), gte(events.date, today), eq(events.requiresPayment, true)))];
                case 4:
                    existingPaidEvents_1 = _o.sent();
                    hasActivePricing = function (row) {
                        var _a, _b, _c, _d, _e, _f;
                        return ((_a = row.breakfastPriceCents) !== null && _a !== void 0 ? _a : 0) > 0 ||
                            ((_b = row.lunchPriceCents) !== null && _b !== void 0 ? _b : 0) > 0 ||
                            ((_c = row.dinnerPriceCents) !== null && _c !== void 0 ? _c : 0) > 0 ||
                            ((_d = row.dailyPriceCents) !== null && _d !== void 0 ? _d : 0) > 0 ||
                            ((_e = row.weeklyPriceCents) !== null && _e !== void 0 ? _e : 0) > 0 ||
                            ((_f = row.monthlyPriceCents) !== null && _f !== void 0 ? _f : 0) > 0;
                    };
                    activePaidEvents = existingPaidEvents_1.filter(hasActivePricing);
                    if (activePaidEvents.length > 0) {
                        return [2 /*return*/, res.status(409).json({
                                message: "You already have a parking pass for this address. Edit your existing listing.",
                            })];
                    }
                    if (!(existingPaidEvents_1.length > 0)) return [3 /*break*/, 7];
                    draftEventIds = existingPaidEvents_1.map(function (row) { return row.id; });
                    draftSeriesIds = Array.from(new Set(existingPaidEvents_1
                        .map(function (row) { return row.seriesId; })
                        .filter(function (id) { return Boolean(id); })));
                    return [4 /*yield*/, db.delete(events).where(inArray(events.id, draftEventIds))];
                case 5:
                    _o.sent();
                    if (!(draftSeriesIds.length > 0)) return [3 /*break*/, 7];
                    return [4 /*yield*/, db
                            .delete(eventSeries)
                            .where(inArray(eventSeries.id, draftSeriesIds))];
                case 6:
                    _o.sent();
                    _o.label = 7;
                case 7:
                    horizon = new Date(today);
                    horizon.setDate(horizon.getDate() + 30);
                    hardCapEnabled = Boolean((_l = req.body) === null || _l === void 0 ? void 0 : _l.hardCapEnabled);
                    return [4 /*yield*/, db
                            .insert(eventSeries)
                            .values({
                            hostId: host.id,
                            name: "Parking Pass - ".concat(host.businessName),
                            description: host.address,
                            timezone: "America/New_York",
                            recurrenceRule: null,
                            startDate: today,
                            endDate: horizon,
                            defaultStartTime: parsed.startTime,
                            defaultEndTime: parsed.endTime,
                            defaultMaxTrucks: spotCount,
                            defaultHardCapEnabled: hardCapEnabled,
                            status: "published",
                            publishedAt: new Date(),
                        })
                            .returning()];
                case 8:
                    series = (_o.sent())[0];
                    seriesId = (_m = series === null || series === void 0 ? void 0 : series.id) !== null && _m !== void 0 ? _m : null;
                    return [4 /*yield*/, db
                            .select({
                            date: events.date,
                            startTime: events.startTime,
                            endTime: events.endTime,
                        })
                            .from(events)
                            .where(and(eq(events.hostId, host.id), gte(events.date, today), lt(events.date, horizon), eq(events.requiresPayment, true)))];
                case 9:
                    existingEvents_1 = _o.sent();
                    if (!seriesId) return [3 /*break*/, 11];
                    return [4 /*yield*/, db
                            .select({ date: parkingPassBlackoutDates.date })
                            .from(parkingPassBlackoutDates)
                            .where(and(eq(parkingPassBlackoutDates.seriesId, seriesId), gte(parkingPassBlackoutDates.date, today), lt(parkingPassBlackoutDates.date, horizon)))];
                case 10:
                    _c = _o.sent();
                    return [3 /*break*/, 12];
                case 11:
                    _c = [];
                    _o.label = 12;
                case 12:
                    blackoutRows_1 = _c;
                    blackoutSet = new Set(blackoutRows_1.map(function (row) {
                        return new Date(row.date).toISOString().split("T")[0];
                    }));
                    existingKeys = new Set(existingEvents_1.map(function (item) {
                        var dateKey = new Date(item.date).toISOString().split("T")[0];
                        return "".concat(dateKey, "-").concat(item.startTime, "-").concat(item.endTime);
                    }));
                    newEvents = [];
                    for (cursor = new Date(today); cursor < horizon; cursor.setDate(cursor.getDate() + 1)) {
                        if (!daysOfWeek.includes(cursor.getDay())) {
                            continue;
                        }
                        dateKey = cursor.toISOString().split("T")[0];
                        if (blackoutSet.has(dateKey)) {
                            continue;
                        }
                        key = "".concat(dateKey, "-").concat(parsed.startTime, "-").concat(parsed.endTime);
                        if (existingKeys.has(key)) {
                            continue;
                        }
                        eventPayload = __assign(__assign({}, parsed), { date: new Date(dateKey), seriesId: seriesId });
                        newEvents.push(eventPayload);
                    }
                    if (newEvents.length === 0) {
                        return [2 /*return*/, res.status(200).json([])];
                    }
                    return [4 /*yield*/, db.insert(events).values(newEvents).returning()];
                case 13:
                    createdEvents = _o.sent();
                    res.status(201).json(createdEvents);
                    return [3 /*break*/, 15];
                case 14:
                    error_11 = _o.sent();
                    console.error("Error creating event:", error_11);
                    if (error_11 instanceof z.ZodError) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Invalid event data", errors: error_11.errors })];
                    }
                    res
                        .status(400)
                        .json({ message: error_11.message || "Failed to create event" });
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/hosts/events", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, hostId, host, eventsByHost, error_12;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    userId = req.user.id;
                    hostId = (_a = req.query) === null || _a === void 0 ? void 0 : _a.hostId;
                    if (!hostId) {
                        return [2 /*return*/, res.status(400).json({ message: "Host ID required" })];
                    }
                    return [4 /*yield*/, storage.getHost(hostId)];
                case 1:
                    host = _b.sent();
                    if (!host || host.userId !== userId) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    return [4 /*yield*/, storage.getEventsByHost(host.id)];
                case 2:
                    eventsByHost = _b.sent();
                    res.json(eventsByHost);
                    return [3 /*break*/, 4];
                case 3:
                    error_12 = _b.sent();
                    console.error("Error fetching host events:", error_12);
                    res.status(500).json({ message: "Failed to fetch events" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // PATCH: Override a single event occurrence (time window, capacity, hard cap)
    app.patch("/api/hosts/events/:eventId", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var eventId, userId, _a, event_1, host, eventDate, today, _b, startTime, endTime, maxTrucks, hardCapEnabled, updates, shouldSyncSpotCount, spotCount, finalStartTime, finalEndTime, _c, startHour, startMinute, _d, endHour, endMinute, startMinutes, endMinutes, finalMaxTrucks, beforeState, updatedEvent, error_13;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 7, , 8]);
                    eventId = req.params.eventId;
                    userId = req.user.id;
                    return [4 /*yield*/, getEventAndHostForUser(eventId, userId)];
                case 1:
                    _a = _e.sent(), event_1 = _a.event, host = _a.host;
                    if (!event_1) {
                        return [2 /*return*/, res.status(404).json({ message: "Event not found" })];
                    }
                    if (!host) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    // Verify host owns the event
                    if (!hostOwnsEvent(host, event_1)) {
                        return [2 /*return*/, res
                                .status(403)
                                .json({ message: "Not authorized to edit this event" })];
                    }
                    eventDate = new Date(event_1.date);
                    today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (eventDate < today) {
                        return [2 /*return*/, res.status(400).json({ message: "Cannot edit past events" })];
                    }
                    _b = req.body, startTime = _b.startTime, endTime = _b.endTime, maxTrucks = _b.maxTrucks, hardCapEnabled = _b.hardCapEnabled;
                    updates = {};
                    if (startTime !== undefined)
                        updates.startTime = startTime;
                    if (endTime !== undefined)
                        updates.endTime = endTime;
                    shouldSyncSpotCount = false;
                    if (maxTrucks !== undefined) {
                        spotCount = Number(maxTrucks);
                        if (!Number.isFinite(spotCount) || spotCount < 1) {
                            return [2 /*return*/, res
                                    .status(400)
                                    .json({ message: "Number of spots must be at least 1" })];
                        }
                        updates.maxTrucks = spotCount;
                        if (event_1.requiresPayment) {
                            shouldSyncSpotCount = true;
                        }
                    }
                    if (hardCapEnabled !== undefined)
                        updates.hardCapEnabled = hardCapEnabled;
                    finalStartTime = updates.startTime || event_1.startTime;
                    finalEndTime = updates.endTime || event_1.endTime;
                    _c = finalStartTime.split(":").map(Number), startHour = _c[0], startMinute = _c[1];
                    _d = finalEndTime.split(":").map(Number), endHour = _d[0], endMinute = _d[1];
                    startMinutes = startHour * 60 + startMinute;
                    endMinutes = endHour * 60 + endMinute;
                    if (endMinutes <= startMinutes) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "End time must be after start time" })];
                    }
                    finalMaxTrucks = updates.maxTrucks !== undefined ? updates.maxTrucks : event_1.maxTrucks;
                    if (finalMaxTrucks < 1) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Max trucks must be at least 1" })];
                    }
                    beforeState = {
                        startTime: event_1.startTime,
                        endTime: event_1.endTime,
                        maxTrucks: event_1.maxTrucks,
                        hardCapEnabled: event_1.hardCapEnabled,
                    };
                    // Apply updates
                    updates.updatedAt = new Date();
                    return [4 /*yield*/, db
                            .update(events)
                            .set(updates)
                            .where(eq(events.id, eventId))
                            .returning()];
                case 2:
                    updatedEvent = (_e.sent())[0];
                    if (!(shouldSyncSpotCount && updates.maxTrucks !== undefined)) return [3 /*break*/, 5];
                    return [4 /*yield*/, db
                            .update(hosts)
                            .set({ spotCount: updates.maxTrucks, updatedAt: new Date() })
                            .where(eq(hosts.id, host.id))];
                case 3:
                    _e.sent();
                    return [4 /*yield*/, db
                            .update(events)
                            .set({ maxTrucks: updates.maxTrucks, updatedAt: new Date() })
                            .where(and(eq(events.hostId, host.id), eq(events.requiresPayment, true), gte(events.date, today)))];
                case 4:
                    _e.sent();
                    _e.label = 5;
                case 5: 
                // Telemetry
                return [4 /*yield*/, storage.createTelemetryEvent({
                        eventName: "occurrence_overridden",
                        userId: req.user.id,
                        properties: {
                            eventId: eventId,
                            seriesId: event_1.seriesId,
                            before: beforeState,
                            after: {
                                startTime: updatedEvent.startTime,
                                endTime: updatedEvent.endTime,
                                maxTrucks: updatedEvent.maxTrucks,
                                hardCapEnabled: updatedEvent.hardCapEnabled,
                            },
                            changedFields: Object.keys(updates).filter(function (k) { return k !== "updatedAt"; }),
                        },
                    })];
                case 6:
                    // Telemetry
                    _e.sent();
                    res.json(updatedEvent);
                    return [3 /*break*/, 8];
                case 7:
                    error_13 = _e.sent();
                    console.error("Error updating event:", error_13);
                    res.status(500).json({ message: "Failed to update event" });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/hosts/interests/:interestId/status", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var interestId, status_1, userId, _a, interest_1, event_2, host_2, currentInterests, acceptedCount, capacityError, updatedInterest, error_14;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    interestId = req.params.interestId;
                    status_1 = req.body.status;
                    userId = req.user.id;
                    if (!["accepted", "declined"].includes(status_1)) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid status" })];
                    }
                    return [4 /*yield*/, getInterestEventAndHostForUser(interestId, userId)];
                case 1:
                    _a = _b.sent(), interest_1 = _a.interest, event_2 = _a.event, host_2 = _a.host;
                    if (!interest_1) {
                        return [2 /*return*/, res.status(404).json({ message: "Interest not found" })];
                    }
                    if (!event_2) {
                        return [2 /*return*/, res.status(404).json({ message: "Event not found" })];
                    }
                    if (!hostOwnsEvent(host_2, event_2)) {
                        return [2 /*return*/, res
                                .status(403)
                                .json({ message: "Not authorized to manage this event" })];
                    }
                    // Idempotency Check: If already in desired status, return success
                    if (interest_1.status === status_1) {
                        return [2 /*return*/, res.json(interest_1)];
                    }
                    if (!(status_1 === "accepted" && event_2.hardCapEnabled)) return [3 /*break*/, 4];
                    return [4 /*yield*/, storage.getEventInterestsByEventId(event_2.id)];
                case 2:
                    currentInterests = _b.sent();
                    acceptedCount = computeAcceptedCount(currentInterests);
                    if (!shouldBlockAcceptance({
                        hardCapEnabled: event_2.hardCapEnabled,
                        acceptedCount: acceptedCount,
                        maxTrucks: event_2.maxTrucks,
                    })) return [3 /*break*/, 4];
                    // Telemetry: Blocked Attempt
                    return [4 /*yield*/, storage.createTelemetryEvent({
                            eventName: "interest_accept_blocked",
                            userId: req.user.id,
                            properties: {
                                eventId: event_2.id,
                                truckId: interest_1.truckId,
                                reason: "capacity_guard_limit_reached",
                                maxTrucks: event_2.maxTrucks,
                                acceptedCount: acceptedCount,
                            },
                        })];
                case 3:
                    // Telemetry: Blocked Attempt
                    _b.sent();
                    capacityError = buildCapacityFullError();
                    return [2 /*return*/, res.status(400).json(capacityError)];
                case 4: return [4 /*yield*/, storage.updateEventInterestStatus(interestId, status_1)];
                case 5:
                    updatedInterest = _b.sent();
                    // Send notification to truck (fire and forget)
                    (function () { return __awaiter(_this, void 0, void 0, function () {
                        var allInterests, acceptedCount, isOverCap, truck, owner, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 7, , 8]);
                                    return [4 /*yield*/, storage.getEventInterestsByEventId(event_2.id)];
                                case 1:
                                    allInterests = _a.sent();
                                    acceptedCount = computeAcceptedCount(allInterests);
                                    isOverCap = acceptedCount >= event_2.maxTrucks;
                                    return [4 /*yield*/, storage.createTelemetryEvent({
                                            eventName: status_1 === "accepted"
                                                ? "interest_accepted"
                                                : "interest_declined",
                                            userId: req.user.id,
                                            properties: {
                                                eventId: event_2.id,
                                                truckId: interest_1.truckId,
                                                fillRate: computeFillRate({
                                                    acceptedCount: acceptedCount,
                                                    maxTrucks: event_2.maxTrucks,
                                                }),
                                                acceptedCount: acceptedCount,
                                                maxTrucks: event_2.maxTrucks,
                                                isOverCap: isOverCap,
                                            },
                                        })];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, storage.getRestaurant(interest_1.truckId)];
                                case 3:
                                    truck = _a.sent();
                                    if (!truck) return [3 /*break*/, 6];
                                    return [4 /*yield*/, storage.getUser(truck.ownerId)];
                                case 4:
                                    owner = _a.sent();
                                    if (!(owner && owner.email)) return [3 /*break*/, 6];
                                    return [4 /*yield*/, emailService.sendInterestStatusUpdate(owner.email, truck.name, host_2.businessName, new Date(event_2.date).toLocaleDateString(), status_1)];
                                case 5:
                                    _a.sent();
                                    _a.label = 6;
                                case 6: return [3 /*break*/, 8];
                                case 7:
                                    err_1 = _a.sent();
                                    console.error("Failed to send status update notification:", err_1);
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); })();
                    res.json(updatedInterest);
                    return [3 /*break*/, 7];
                case 6:
                    error_14 = _b.sent();
                    console.error("Error updating interest status:", error_14);
                    res.status(500).json({ message: "Failed to update status" });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/hosts/events/:eventId/interests", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var eventId, userId, host, event_3, interests, error_15;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    eventId = req.params.eventId;
                    userId = req.user.id;
                    return [4 /*yield*/, getHostByUserId(userId)];
                case 1:
                    host = _a.sent();
                    if (!host) {
                        return [2 /*return*/, res.status(403).json({ message: "Not a host" })];
                    }
                    return [4 /*yield*/, getEventAndHostForUser(eventId, userId)];
                case 2:
                    event_3 = (_a.sent()).event;
                    if (!event_3 || !hostOwnsEvent(host, event_3)) {
                        return [2 /*return*/, res.status(404).json({ message: "Event not found" })];
                    }
                    return [4 /*yield*/, storage.getEventInterestsByEventId(eventId)];
                case 3:
                    interests = _a.sent();
                    res.json(interests);
                    return [3 /*break*/, 5];
                case 4:
                    error_15 = _a.sent();
                    console.error("Error fetching event interests:", error_15);
                    res.status(500).json({ message: "Failed to fetch interests" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // =====================================================================
    // STRIPE CONNECT & PAYMENT ENDPOINTS
    // =====================================================================
    // Stripe Connect Onboarding: Host enables payments
    app.post("/api/hosts/stripe/onboard", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, host, accountId, account, baseUrl, accountLink, error_16;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    if (!stripe) {
                        return [2 /*return*/, res.status(500).json({ message: "Stripe not configured" })];
                    }
                    userId = req.user.id;
                    return [4 /*yield*/, getHostByUserId(userId)];
                case 1:
                    host = _a.sent();
                    if (!host) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    accountId = host.stripeConnectAccountId;
                    if (!!accountId) return [3 /*break*/, 4];
                    return [4 /*yield*/, stripe.accounts.create({
                            type: "express",
                            country: "US",
                            email: req.user.email,
                            capabilities: {
                                card_payments: { requested: true },
                                transfers: { requested: true },
                            },
                            business_type: "individual",
                            metadata: {
                                hostId: host.id,
                                businessName: host.businessName,
                            },
                        })];
                case 2:
                    account = _a.sent();
                    accountId = account.id;
                    // Save to database
                    return [4 /*yield*/, db
                            .update(hosts)
                            .set({ stripeConnectAccountId: accountId })
                            .where(eq(hosts.id, host.id))];
                case 3:
                    // Save to database
                    _a.sent();
                    _a.label = 4;
                case 4:
                    baseUrl = "".concat(req.protocol, "://").concat(req.get("host"));
                    return [4 /*yield*/, stripe.accountLinks.create({
                            account: accountId,
                            refresh_url: "".concat(baseUrl, "/host/dashboard?setup=refresh"),
                            return_url: "".concat(baseUrl, "/host/dashboard?setup=complete"),
                            type: "account_onboarding",
                        })];
                case 5:
                    accountLink = _a.sent();
                    res.json({ onboardingUrl: accountLink.url });
                    return [3 /*break*/, 7];
                case 6:
                    error_16 = _a.sent();
                    console.error("Error creating Stripe Connect account:", error_16);
                    res
                        .status(500)
                        .json({ message: "Failed to initiate Stripe onboarding" });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    // Check Stripe Connect account status
    app.get("/api/hosts/stripe/status", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, host, account, error_17;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    if (!stripe) {
                        return [2 /*return*/, res.status(500).json({ message: "Stripe not configured" })];
                    }
                    userId = req.user.id;
                    return [4 /*yield*/, getHostByUserId(userId)];
                case 1:
                    host = _a.sent();
                    if (!host) {
                        return [2 /*return*/, res.status(404).json({ message: "Host profile not found" })];
                    }
                    if (!host.stripeConnectAccountId) {
                        return [2 /*return*/, res.json({
                                connected: false,
                                chargesEnabled: false,
                                payoutsEnabled: false,
                            })];
                    }
                    return [4 /*yield*/, stripe.accounts.retrieve(host.stripeConnectAccountId)];
                case 2:
                    account = _a.sent();
                    // Update database with current status
                    return [4 /*yield*/, db
                            .update(hosts)
                            .set({
                            stripeChargesEnabled: account.charges_enabled,
                            stripePayoutsEnabled: account.payouts_enabled,
                            stripeOnboardingCompleted: account.details_submitted,
                            stripeConnectStatus: account.charges_enabled ? "active" : "pending",
                        })
                            .where(eq(hosts.id, host.id))];
                case 3:
                    // Update database with current status
                    _a.sent();
                    res.json({
                        connected: true,
                        chargesEnabled: account.charges_enabled,
                        payoutsEnabled: account.payouts_enabled,
                        onboardingCompleted: account.details_submitted,
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_17 = _a.sent();
                    console.error("Error checking Stripe status:", error_17);
                    res.status(500).json({ message: "Failed to check Stripe status" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // Book a Parking Pass (creates payment intent with $10 platform fee auto-added)
    app.post("/api/parking-pass/:passId/book", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var passId, _a, truckId, slotType, slotTypes, applyCreditsCents, userId, allowedSlotTypes_1, requestedSlots, normalizedSlots, truck, event_4, host, existingBooking, currentBookings, eventDate, dayStart, dayEnd, existingDayBooking, slotPriceMap_1, selectedPrices, hostPriceCents, bookingDays, platformFeeCents, creditAppliedCents, requestedCreditCents, getUserCreditBalance, creditBalance, availableCents, adjustedPlatformFeeCents, totalCents, paymentIntent, error_18;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 11, , 12]);
                    if (!stripe) {
                        return [2 /*return*/, res.status(500).json({ message: "Stripe not configured" })];
                    }
                    passId = req.params.passId;
                    _a = req.body, truckId = _a.truckId, slotType = _a.slotType, slotTypes = _a.slotTypes, applyCreditsCents = _a.applyCreditsCents;
                    userId = req.user.id;
                    if (!truckId) {
                        return [2 /*return*/, res.status(400).json({ message: "Truck ID required" })];
                    }
                    allowedSlotTypes_1 = new Set([
                        "breakfast",
                        "lunch",
                        "dinner",
                        "daily",
                        "weekly",
                        "monthly",
                    ]);
                    requestedSlots = Array.isArray(slotTypes)
                        ? slotTypes
                        : slotType
                            ? [slotType]
                            : [];
                    normalizedSlots = Array.from(new Set(requestedSlots
                        .filter(function (value) { return typeof value === "string"; })
                        .map(function (value) { return value.trim(); })
                        .filter(function (value) { return value.length > 0; })));
                    if (normalizedSlots.length === 0 ||
                        normalizedSlots.some(function (value) { return !allowedSlotTypes_1.has(value); })) {
                        return [2 /*return*/, res.status(400).json({ message: "Valid slotTypes required" })];
                    }
                    return [4 /*yield*/, storage.getRestaurant(truckId)];
                case 1:
                    truck = _d.sent();
                    if (!truck || truck.ownerId !== userId) {
                        return [2 /*return*/, res.status(403).json({ message: "Not authorized" })];
                    }
                    if (!truck.isFoodTruck) {
                        return [2 /*return*/, res.status(403).json({
                                message: "Parking Pass bookings are only available for food trucks.",
                            })];
                    }
                    if (!truck.isVerified &&
                        !["admin", "super_admin", "staff"].includes((_b = req.user) === null || _b === void 0 ? void 0 : _b.userType)) {
                        return [2 /*return*/, res.status(403).json({
                                message: "Your truck must be verified before booking parking pass slots.",
                            })];
                    }
                    if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.userType) &&
                        !["food_truck", "admin", "super_admin", "staff"].includes(req.user.userType)) {
                        return [2 /*return*/, res.status(403).json({
                                message: "Only food truck accounts can book Parking Pass slots.",
                            })];
                    }
                    return [4 /*yield*/, storage.getEvent(passId)];
                case 2:
                    event_4 = _d.sent();
                    if (!event_4) {
                        return [2 /*return*/, res.status(404).json({ message: "Parking pass not found" })];
                    }
                    if (event_4.status !== "open") {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Parking pass not available for booking" })];
                    }
                    if (!event_4.requiresPayment) {
                        return [2 /*return*/, res.status(400).json({
                                message: "Payments are only available for Parking Pass listings, not events.",
                            })];
                    }
                    return [4 /*yield*/, storage.getHost(event_4.hostId)];
                case 3:
                    host = _d.sent();
                    if (!host) {
                        return [2 /*return*/, res.status(404).json({ message: "Host not found" })];
                    }
                    // Verify host has Stripe Connect setup
                    if (!host.stripeConnectAccountId || !host.stripeChargesEnabled) {
                        return [2 /*return*/, res.status(400).json({
                                message: "Host payment setup incomplete. Contact host to enable payments.",
                            })];
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(eventBookings)
                            .where(eq(eventBookings.eventId, passId))
                            .where(eq(eventBookings.truckId, truckId))
                            .where(inArray(eventBookings.status, ["confirmed"]))
                            .limit(1)];
                case 4:
                    existingBooking = _d.sent();
                    if (existingBooking.length > 0) {
                        return [2 /*return*/, res.status(400).json({
                                message: "You already have a booking for this parking pass",
                                bookingId: existingBooking[0].id,
                            })];
                    }
                    return [4 /*yield*/, db
                            .select({ id: eventBookings.id })
                            .from(eventBookings)
                            .where(eq(eventBookings.eventId, passId))
                            .where(inArray(eventBookings.status, ["confirmed"]))];
                case 5:
                    currentBookings = _d.sent();
                    if (currentBookings.length >= event_4.maxTrucks) {
                        return [2 /*return*/, res.status(400).json({
                                message: "This parking pass is fully booked.",
                            })];
                    }
                    eventDate = new Date(event_4.date);
                    dayStart = new Date(eventDate);
                    dayStart.setHours(0, 0, 0, 0);
                    dayEnd = new Date(dayStart);
                    dayEnd.setDate(dayEnd.getDate() + 1);
                    return [4 /*yield*/, db
                            .select({ id: eventBookings.id })
                            .from(eventBookings)
                            .innerJoin(events, eq(eventBookings.eventId, events.id))
                            .where(and(eq(eventBookings.truckId, truckId), eq(eventBookings.hostId, event_4.hostId), gte(events.date, dayStart), lt(events.date, dayEnd), inArray(eventBookings.status, ["confirmed"])))
                            .limit(1)];
                case 6:
                    existingDayBooking = _d.sent();
                    if (existingDayBooking.length > 0) {
                        return [2 /*return*/, res.status(400).json({
                                message: "You already have a parking pass for this host on that date.",
                                bookingId: existingDayBooking[0].id,
                            })];
                    }
                    slotPriceMap_1 = {
                        breakfast: event_4.breakfastPriceCents,
                        lunch: event_4.lunchPriceCents,
                        dinner: event_4.dinnerPriceCents,
                        daily: event_4.dailyPriceCents,
                        weekly: event_4.weeklyPriceCents,
                        monthly: event_4.monthlyPriceCents,
                    };
                    selectedPrices = normalizedSlots.map(function (slot) { return ({
                        slot: slot,
                        price: slotPriceMap_1[slot] || 0,
                    }); });
                    if (selectedPrices.some(function (item) { return item.price <= 0; })) {
                        return [2 /*return*/, res.status(400).json({
                                message: "One or more selected slots are not available.",
                            })];
                    }
                    hostPriceCents = selectedPrices.reduce(function (sum, item) { return sum + item.price; }, 0);
                    bookingDays = normalizedSlots.includes("monthly")
                        ? 30
                        : normalizedSlots.includes("weekly")
                            ? 7
                            : 1;
                    platformFeeCents = Math.min(1000 * bookingDays, 15000);
                    creditAppliedCents = 0;
                    requestedCreditCents = Number(applyCreditsCents || 0);
                    if (!(requestedCreditCents > 0)) return [3 /*break*/, 9];
                    return [4 /*yield*/, import("../creditService.js")];
                case 7:
                    getUserCreditBalance = (_d.sent()).getUserCreditBalance;
                    return [4 /*yield*/, getUserCreditBalance(userId)];
                case 8:
                    creditBalance = _d.sent();
                    availableCents = Math.max(0, Math.floor(creditBalance * 100));
                    creditAppliedCents = Math.min(requestedCreditCents, platformFeeCents, availableCents);
                    _d.label = 9;
                case 9:
                    adjustedPlatformFeeCents = Math.max(platformFeeCents - creditAppliedCents, 0);
                    totalCents = hostPriceCents + adjustedPlatformFeeCents;
                    return [4 /*yield*/, stripe.paymentIntents.create({
                            amount: totalCents,
                            currency: "usd",
                            application_fee_amount: platformFeeCents, // $10 to MealScout (platform)
                            metadata: {
                                passId: event_4.id,
                                hostId: host.id,
                                truckId: truckId,
                                slotTypes: normalizedSlots.join(","),
                                hostPriceCents: hostPriceCents.toString(),
                                platformFeeCents: adjustedPlatformFeeCents.toString(),
                                totalCents: totalCents.toString(),
                                creditAppliedCents: creditAppliedCents.toString(),
                            },
                        }, {
                            stripeAccount: host.stripeConnectAccountId, // Direct charge: fees come from host, app fee to platform
                        })];
                case 10:
                    paymentIntent = _d.sent();
                    res.json({
                        clientSecret: paymentIntent.client_secret,
                        totalCents: totalCents,
                        breakdown: {
                            hostPrice: hostPriceCents,
                            platformFee: adjustedPlatformFeeCents,
                            creditsApplied: creditAppliedCents,
                        },
                    });
                    return [3 /*break*/, 12];
                case 11:
                    error_18 = _d.sent();
                    console.error("Error creating booking:", error_18);
                    res.status(500).json({ message: "Failed to create booking" });
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    }); });
}

