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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
import { users, restaurants, deals, dealClaims, reviews, verificationRequests, dealViews, foodTruckSessions, foodTruckLocations, restaurantFavorites, restaurantFollows, restaurantUserRecommendations, restaurantRecommendations, locationRequests, truckInterests, userAddresses, passwordResetTokens, phoneVerificationTokens, accountSetupTokens, emailVerificationTokens, dealFeedback, apiKeys, hosts, events, eventSeries, parkingPassBlackoutDates, truckManualSchedules, eventInterests, telemetryEvents, lisaClaims, } from "@shared/schema";
import { db } from "./db.js";
import { eq, and, or, gte, lte, sql, desc, asc, inArray, isNull, isNotNull, ne, } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { syncUserToBrevo } from "./brevoCrm.js";
import { ensureAffiliateTag } from "./affiliateTagService.js";
var DatabaseStorage = /** @class */ (function () {
    function DatabaseStorage() {
    }
    DatabaseStorage.prototype.shouldAssignAffiliateTag = function (userType) {
        return userType !== "admin" && userType !== "super_admin";
    };
    DatabaseStorage.prototype.createDraftParkingPassForHost = function (host) {
        return __awaiter(this, void 0, void 0, function () {
            var today, horizon, existing, defaultStartTime, defaultEndTime, spotCount, series, newEvents, cursor;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        today = new Date();
                        today.setHours(0, 0, 0, 0);
                        horizon = new Date(today);
                        horizon.setDate(horizon.getDate() + 30);
                        return [4 /*yield*/, db
                                .select({ id: events.id })
                                .from(events)
                                .where(and(eq(events.hostId, host.id), eq(events.requiresPayment, true), gte(events.date, today)))
                                .limit(1)];
                    case 1:
                        existing = _c.sent();
                        if (existing.length > 0) {
                            return [2 /*return*/, false];
                        }
                        defaultStartTime = "09:00";
                        defaultEndTime = "17:00";
                        spotCount = (_a = host.spotCount) !== null && _a !== void 0 ? _a : 1;
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
                                defaultStartTime: defaultStartTime,
                                defaultEndTime: defaultEndTime,
                                defaultMaxTrucks: spotCount,
                                defaultHardCapEnabled: false,
                                status: "draft",
                            })
                                .returning()];
                    case 2:
                        series = (_c.sent())[0];
                        newEvents = [];
                        for (cursor = new Date(today); cursor < horizon; cursor.setDate(cursor.getDate() + 1)) {
                            newEvents.push({
                                hostId: host.id,
                                seriesId: (_b = series === null || series === void 0 ? void 0 : series.id) !== null && _b !== void 0 ? _b : null,
                                name: "Parking Pass - ".concat(host.businessName),
                                description: host.address,
                                date: new Date(cursor),
                                startTime: defaultStartTime,
                                endTime: defaultEndTime,
                                maxTrucks: spotCount,
                                hardCapEnabled: false,
                                requiresPayment: true,
                                hostPriceCents: 0,
                                breakfastPriceCents: 0,
                                lunchPriceCents: 0,
                                dinnerPriceCents: 0,
                                dailyPriceCents: 0,
                                weeklyPriceCents: 0,
                                monthlyPriceCents: 0,
                            });
                        }
                        if (!(newEvents.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, db.insert(events).values(newEvents)];
                    case 3:
                        _c.sent();
                        return [2 /*return*/, true];
                    case 4: return [2 /*return*/, false];
                }
            });
        });
    };
    DatabaseStorage.prototype.ensureDraftParkingPassesForHosts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var hostList, created, _i, hostList_1, host, didCreate, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.select().from(hosts)];
                    case 1:
                        hostList = _a.sent();
                        created = 0;
                        _i = 0, hostList_1 = hostList;
                        _a.label = 2;
                    case 2:
                        if (!(_i < hostList_1.length)) return [3 /*break*/, 7];
                        host = hostList_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.createDraftParkingPassForHost(host)];
                    case 4:
                        didCreate = _a.sent();
                        if (didCreate)
                            created += 1;
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.warn("ensureDraftParkingPassForHosts failed:", error_1);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, created];
                }
            });
        });
    };
    // Host operations
    DatabaseStorage.prototype.createHost = function (host) {
        return __awaiter(this, void 0, void 0, function () {
            var newHost, e_1, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.insert(hosts).values(host).returning()];
                    case 1:
                        newHost = (_a.sent())[0];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        if (!newHost.city) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.ensureCityExists(newHost.city, newHost.state || null)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        console.warn("ensureCityExists failed for host", e_1);
                        return [3 /*break*/, 6];
                    case 6:
                        _a.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this.createDraftParkingPassForHost(newHost)];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        e_2 = _a.sent();
                        console.warn("createDraftParkingPassForHost failed:", e_2);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/, newHost];
                }
            });
        });
    };
    DatabaseStorage.prototype.ensureDraftParkingPassForHost = function (hostId) {
        return __awaiter(this, void 0, void 0, function () {
            var host, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getHost(hostId)];
                    case 1:
                        host = _a.sent();
                        if (!host)
                            return [2 /*return*/, false];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.createDraftParkingPassForHost(host)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        e_3 = _a.sent();
                        console.warn("ensureDraftParkingPassForHost failed:", e_3);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHost = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var host;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.select().from(hosts).where(eq(hosts.id, id))];
                    case 1:
                        host = (_a.sent())[0];
                        return [2 /*return*/, host];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHostByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var host;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(hosts)
                            .where(eq(hosts.userId, userId))];
                    case 1:
                        host = (_a.sent())[0];
                        return [2 /*return*/, host];
                }
            });
        });
    };
    DatabaseStorage.prototype.getHostsByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(hosts)
                            .where(eq(hosts.userId, userId))
                            .orderBy(desc(hosts.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllHosts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.select().from(hosts).orderBy(desc(hosts.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateHostCoordinates = function (hostId, lat, lng) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(hosts)
                            .set({
                            latitude: lat.toString(),
                            longitude: lng.toString(),
                            updatedAt: new Date(),
                        })
                            .where(eq(hosts.id, hostId))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.getParkingPassBlackoutDates = function (seriesId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(parkingPassBlackoutDates)
                            .where(eq(parkingPassBlackoutDates.seriesId, seriesId))
                            .orderBy(asc(parkingPassBlackoutDates.date))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createParkingPassBlackoutDate = function (blackout) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(parkingPassBlackoutDates)
                            .values(blackout)
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteParkingPassBlackoutDate = function (seriesId, date) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .delete(parkingPassBlackoutDates)
                            .where(and(eq(parkingPassBlackoutDates.seriesId, seriesId), eq(parkingPassBlackoutDates.date, date)))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.createEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var newEvent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.insert(events).values(event).returning()];
                    case 1:
                        newEvent = (_a.sent())[0];
                        return [2 /*return*/, newEvent];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEvent = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var event;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.select().from(events).where(eq(events.id, id))];
                    case 1:
                        event = (_a.sent())[0];
                        return [2 /*return*/, event];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEventsByHost = function (hostId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.query.events.findMany({
                            where: eq(events.hostId, hostId),
                            orderBy: asc(events.date),
                            with: {
                                interests: true,
                            },
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllUpcomingEvents = function () {
        return __awaiter(this, void 0, void 0, function () {
            var today;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return [4 /*yield*/, db.query.events.findMany({
                                where: and(gte(events.date, today), ne(events.status, "cancelled")),
                                orderBy: asc(events.date),
                                with: {
                                    host: true,
                                    series: true,
                                },
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createEventInterest = function (interest) {
        return __awaiter(this, void 0, void 0, function () {
            var newInterest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(eventInterests)
                            .values(interest)
                            .returning()];
                    case 1:
                        newInterest = (_a.sent())[0];
                        return [2 /*return*/, newInterest];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateEventInterestStatus = function (id, status) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(eventInterests)
                            .set({ status: status })
                            .where(eq(eventInterests.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEventInterest = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var interest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(eventInterests)
                            .where(eq(eventInterests.id, id))];
                    case 1:
                        interest = (_a.sent())[0];
                        return [2 /*return*/, interest];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEventInterestByTruckId = function (eventId, truckId) {
        return __awaiter(this, void 0, void 0, function () {
            var interest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(eventInterests)
                            .where(and(eq(eventInterests.eventId, eventId), eq(eventInterests.truckId, truckId)))];
                    case 1:
                        interest = (_a.sent())[0];
                        return [2 /*return*/, interest];
                }
            });
        });
    };
    DatabaseStorage.prototype.getOpenLocationRequests = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.expireStaleLocationRequests()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, db
                                .select()
                                .from(locationRequests)
                                .where(eq(locationRequests.status, "open"))
                                .orderBy(desc(locationRequests.createdAt))];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEventInterestsByEventId = function (eventId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.query.eventInterests.findMany({
                            where: eq(eventInterests.eventId, eventId),
                            with: {
                                truck: true,
                            },
                            orderBy: desc(eventInterests.createdAt),
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Event Series (Open Calls)
    DatabaseStorage.prototype.createEventSeries = function (series) {
        return __awaiter(this, void 0, void 0, function () {
            var newSeries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.insert(eventSeries).values(series).returning()];
                    case 1:
                        newSeries = (_a.sent())[0];
                        return [2 /*return*/, newSeries];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEventSeries = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var series;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(eventSeries)
                            .where(eq(eventSeries.id, id))];
                    case 1:
                        series = (_a.sent())[0];
                        return [2 /*return*/, series];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEventSeriesByHost = function (hostId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(eventSeries)
                            .where(eq(eventSeries.hostId, hostId))
                            .orderBy(desc(eventSeries.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateEventSeries = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(eventSeries)
                            .set(__assign(__assign({}, updates), { updatedAt: new Date() }))
                            .where(eq(eventSeries.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.publishEventSeries = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var published;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(eventSeries)
                            .set({
                            status: "published",
                            publishedAt: new Date(),
                            updatedAt: new Date(),
                        })
                            .where(eq(eventSeries.id, id))
                            .returning()];
                    case 1:
                        published = (_a.sent())[0];
                        return [2 /*return*/, published];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEventsBySeriesId = function (seriesId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(events)
                            .where(eq(events.seriesId, seriesId))
                            .orderBy(asc(events.date))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createTelemetryEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.insert(telemetryEvents).values(event)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Stripe helpers
    DatabaseStorage.prototype.updateUserStripeCustomerId = function (userId, customerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(users)
                            .set({ stripeCustomerId: customerId })
                            .where(eq(users.id, userId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUserStripeInfo = function (id, stripeCustomerId, stripeSubscriptionId, subscriptionBillingInterval) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(users)
                            .set({
                            stripeCustomerId: stripeCustomerId,
                            stripeSubscriptionId: stripeSubscriptionId,
                            subscriptionBillingInterval: subscriptionBillingInterval,
                            updatedAt: new Date(),
                        })
                            .where(eq(users.id, id))
                            .returning()];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUser = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(users)
                            .set(__assign(__assign({}, updates), { updatedAt: new Date() }))
                            .where(eq(users.id, id))
                            .returning()];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    // User operations
    // (IMPORTANT) these user operations are mandatory for authentication.
    DatabaseStorage.prototype.getUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(users)
                            .where(and(eq(users.id, id), or(eq(users.isDisabled, false), isNull(users.isDisabled))))];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.upsertUser = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(users)
                            .values(userData)
                            .onConflictDoUpdate({
                            target: users.facebookId,
                            set: __assign(__assign({}, userData), { updatedAt: new Date() }),
                        })
                            .returning()];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(users)
                            .where(and(eq(users.email, email), or(eq(users.isDisabled, false), isNull(users.isDisabled))))];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserByPhone = function (phone) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(users)
                            .where(and(eq(users.phone, phone), or(eq(users.isDisabled, false), isNull(users.isDisabled))))];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(users)
                            .where(and(eq(users.id, id), or(eq(users.isDisabled, false), isNull(users.isDisabled))))];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUserType = function (id, userType) {
        return __awaiter(this, void 0, void 0, function () {
            var SUPER_ADMIN_EMAIL, user, affiliatePercent, shouldAutoVerify, updatedUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info.mealscout@gmail.com";
                        return [4 /*yield*/, this.getUser(id)];
                    case 1:
                        user = _a.sent();
                        if ((user === null || user === void 0 ? void 0 : user.email) === SUPER_ADMIN_EMAIL && userType !== "super_admin") {
                            throw new Error("Cannot modify super admin account");
                        }
                        affiliatePercent = userType === "staff"
                            ? 25
                            : userType === "admin" || userType === "super_admin"
                                ? 0
                                : undefined;
                        shouldAutoVerify = userType === "admin" || userType === "super_admin";
                        return [4 /*yield*/, db
                                .update(users)
                                .set(__assign(__assign(__assign({ userType: userType }, (affiliatePercent !== undefined ? { affiliatePercent: affiliatePercent } : {})), (shouldAutoVerify ? { emailVerified: true } : {})), { updatedAt: new Date() }))
                                .where(eq(users.id, id))
                                .returning()];
                    case 2:
                        updatedUser = (_a.sent())[0];
                        void syncUserToBrevo(updatedUser).catch(function () { });
                        return [2 /*return*/, updatedUser];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserByStripeCustomerId = function (stripeCustomerId) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(users)
                            .where(and(eq(users.stripeCustomerId, stripeCustomerId), or(eq(users.isDisabled, false), isNull(users.isDisabled))))];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserByStripeSubscriptionId = function (stripeSubscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(users)
                            .where(and(eq(users.stripeSubscriptionId, stripeSubscriptionId), or(eq(users.isDisabled, false), isNull(users.isDisabled))))];
                    case 1:
                        user = (_a.sent())[0];
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.upsertUserByAuth = function (authType_1, userData_1) {
        return __awaiter(this, arguments, void 0, function (authType, userData, userType, appContext) {
            var tsData, existingUser, current, newAppContext, user_1, current, newAppContext, user_2, user, googleData, existingUser, current, newAppContext, user_3, current, newAppContext, user_4, user, facebookData, existingUser, current, newAppContext, user_5, current, newAppContext, user_6, user, emailData, user, error_2, tsData, existingUser, current, user, googleData, existingUser, user, facebookData, existingUser, user;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            if (userType === void 0) { userType = "customer"; }
            if (appContext === void 0) { appContext = "mealscout"; }
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0:
                        _m.trys.push([0, 27, , 39]);
                        if (!(authType === "tradescout")) return [3 /*break*/, 8];
                        tsData = userData;
                        console.log("🔍 upsertUserByAuth - TradeScout:", {
                            tradescoutId: tsData.tradescoutId,
                            email: tsData.email,
                            userType: userType,
                            appContext: appContext,
                        });
                        return [4 /*yield*/, db
                                .select()
                                .from(users)
                                .where(eq(users.tradescoutId, tsData.tradescoutId))
                                .limit(1)];
                    case 1:
                        existingUser = _m.sent();
                        if (!(existingUser.length > 0)) return [3 /*break*/, 3];
                        console.log("✅ Found existing user by TradeScout ID, updating...");
                        current = existingUser[0];
                        newAppContext = current.appContext && current.appContext !== appContext
                            ? "both"
                            : appContext;
                        return [4 /*yield*/, db
                                .update(users)
                                .set({
                                email: (_a = tsData.email) !== null && _a !== void 0 ? _a : current.email,
                                firstName: (_b = tsData.firstName) !== null && _b !== void 0 ? _b : current.firstName,
                                lastName: (_c = tsData.lastName) !== null && _c !== void 0 ? _c : current.lastName,
                                appContext: newAppContext,
                                updatedAt: new Date(),
                            })
                                .where(eq(users.id, current.id))
                                .returning()];
                    case 2:
                        user_1 = (_m.sent())[0];
                        void syncUserToBrevo(user_1).catch(function () { });
                        return [2 /*return*/, user_1];
                    case 3:
                        if (!tsData.email) return [3 /*break*/, 6];
                        return [4 /*yield*/, db
                                .select()
                                .from(users)
                                .where(eq(users.email, tsData.email))
                                .limit(1)];
                    case 4:
                        existingUser = _m.sent();
                        if (!(existingUser.length > 0)) return [3 /*break*/, 6];
                        console.log("✅ Found existing user by email, linking TradeScout account...");
                        console.log("⚠️  Preserving existing userType:", existingUser[0].userType);
                        current = existingUser[0];
                        newAppContext = current.appContext && current.appContext !== appContext
                            ? "both"
                            : appContext;
                        return [4 /*yield*/, db
                                .update(users)
                                .set({
                                tradescoutId: tsData.tradescoutId,
                                firstName: (_d = tsData.firstName) !== null && _d !== void 0 ? _d : current.firstName,
                                lastName: (_e = tsData.lastName) !== null && _e !== void 0 ? _e : current.lastName,
                                appContext: newAppContext,
                                updatedAt: new Date(),
                            })
                                .where(eq(users.id, current.id))
                                .returning()];
                    case 5:
                        user_2 = (_m.sent())[0];
                        void syncUserToBrevo(user_2).catch(function () { });
                        return [2 /*return*/, user_2];
                    case 6:
                        // Step 3: Create new user linked to TradeScout
                        console.log("✅ Creating new TradeScout-linked user...");
                        return [4 /*yield*/, db
                                .insert(users)
                                .values({
                                userType: userType,
                                tradescoutId: tsData.tradescoutId,
                                email: (_f = tsData.email) !== null && _f !== void 0 ? _f : undefined,
                                firstName: (_g = tsData.firstName) !== null && _g !== void 0 ? _g : undefined,
                                lastName: (_h = tsData.lastName) !== null && _h !== void 0 ? _h : undefined,
                                appContext: appContext,
                            })
                                .returning()];
                    case 7:
                        user = (_m.sent())[0];
                        console.log("✅ TradeScout user created successfully:", {
                            userId: user.id,
                            email: user.email,
                            appContext: appContext,
                        });
                        void syncUserToBrevo(user).catch(function () { });
                        return [2 /*return*/, user];
                    case 8:
                        if (!(authType === "google")) return [3 /*break*/, 16];
                        googleData = userData;
                        console.log("🔍 upsertUserByAuth - Google:", {
                            googleId: googleData.googleId,
                            email: googleData.email,
                            userType: userType,
                            appContext: appContext,
                        });
                        return [4 /*yield*/, db
                                .select()
                                .from(users)
                                .where(eq(users.googleId, googleData.googleId))
                                .limit(1)];
                    case 9:
                        existingUser = _m.sent();
                        if (!(existingUser.length > 0)) return [3 /*break*/, 11];
                        console.log("✅ Found existing user by Google ID, updating...");
                        current = existingUser[0];
                        newAppContext = current.appContext && current.appContext !== appContext
                            ? "both"
                            : appContext;
                        return [4 /*yield*/, db
                                .update(users)
                                .set({
                                email: googleData.email,
                                firstName: googleData.firstName,
                                lastName: googleData.lastName,
                                profileImageUrl: googleData.profileImageUrl,
                                googleAccessToken: googleData.googleAccessToken,
                                appContext: newAppContext,
                                updatedAt: new Date(),
                            })
                                .where(eq(users.id, existingUser[0].id))
                                .returning()];
                    case 10:
                        user_3 = (_m.sent())[0];
                        void syncUserToBrevo(user_3).catch(function () { });
                        return [2 /*return*/, user_3];
                    case 11:
                        if (!googleData.email) return [3 /*break*/, 14];
                        return [4 /*yield*/, db
                                .select()
                                .from(users)
                                .where(eq(users.email, googleData.email))
                                .limit(1)];
                    case 12:
                        existingUser = _m.sent();
                        if (!(existingUser.length > 0)) return [3 /*break*/, 14];
                        console.log("✅ Found existing user by email, linking Google account...");
                        console.log("⚠️  Preserving existing userType:", existingUser[0].userType);
                        current = existingUser[0];
                        newAppContext = current.appContext && current.appContext !== appContext
                            ? "both"
                            : appContext;
                        return [4 /*yield*/, db
                                .update(users)
                                .set({
                                googleId: googleData.googleId,
                                firstName: googleData.firstName || existingUser[0].firstName,
                                lastName: googleData.lastName || existingUser[0].lastName,
                                profileImageUrl: googleData.profileImageUrl || existingUser[0].profileImageUrl,
                                googleAccessToken: googleData.googleAccessToken,
                                appContext: newAppContext,
                                // Preserve existing userType to prevent account type changes
                                updatedAt: new Date(),
                            })
                                .where(eq(users.id, existingUser[0].id))
                                .returning()];
                    case 13:
                        user_4 = (_m.sent())[0];
                        void syncUserToBrevo(user_4).catch(function () { });
                        return [2 /*return*/, user_4];
                    case 14:
                        // Step 3: Create new user
                        console.log("✅ Creating new Google user...");
                        return [4 /*yield*/, db
                                .insert(users)
                                .values({
                                userType: userType,
                                googleId: googleData.googleId,
                                email: googleData.email,
                                firstName: googleData.firstName,
                                lastName: googleData.lastName,
                                profileImageUrl: googleData.profileImageUrl,
                                googleAccessToken: googleData.googleAccessToken,
                                appContext: appContext,
                            })
                                .returning()];
                    case 15:
                        user = (_m.sent())[0];
                        console.log("✅ Google user created successfully:", {
                            userId: user.id,
                            email: user.email,
                            appContext: appContext,
                        });
                        void syncUserToBrevo(user).catch(function () { });
                        return [2 /*return*/, user];
                    case 16:
                        if (!(authType === "facebook")) return [3 /*break*/, 24];
                        facebookData = userData;
                        console.log("🔍 upsertUserByAuth - Facebook:", {
                            facebookId: facebookData.facebookId,
                            email: facebookData.email,
                            userType: userType,
                            appContext: appContext,
                        });
                        return [4 /*yield*/, db
                                .select()
                                .from(users)
                                .where(eq(users.facebookId, facebookData.facebookId))
                                .limit(1)];
                    case 17:
                        existingUser = _m.sent();
                        if (!(existingUser.length > 0)) return [3 /*break*/, 19];
                        console.log("✅ Found existing user by Facebook ID, updating...");
                        current = existingUser[0];
                        newAppContext = current.appContext && current.appContext !== appContext
                            ? "both"
                            : appContext;
                        return [4 /*yield*/, db
                                .update(users)
                                .set({
                                email: facebookData.email,
                                firstName: facebookData.firstName,
                                lastName: facebookData.lastName,
                                profileImageUrl: facebookData.profileImageUrl,
                                facebookAccessToken: facebookData.facebookAccessToken,
                                appContext: newAppContext,
                                updatedAt: new Date(),
                            })
                                .where(eq(users.id, existingUser[0].id))
                                .returning()];
                    case 18:
                        user_5 = (_m.sent())[0];
                        void syncUserToBrevo(user_5).catch(function () { });
                        return [2 /*return*/, user_5];
                    case 19:
                        if (!facebookData.email) return [3 /*break*/, 22];
                        return [4 /*yield*/, db
                                .select()
                                .from(users)
                                .where(eq(users.email, facebookData.email))
                                .limit(1)];
                    case 20:
                        existingUser = _m.sent();
                        if (!(existingUser.length > 0)) return [3 /*break*/, 22];
                        console.log("✅ Found existing user by email, linking Facebook account...");
                        console.log("⚠️  Preserving existing userType:", existingUser[0].userType);
                        current = existingUser[0];
                        newAppContext = current.appContext && current.appContext !== appContext
                            ? "both"
                            : appContext;
                        return [4 /*yield*/, db
                                .update(users)
                                .set({
                                facebookId: facebookData.facebookId,
                                firstName: facebookData.firstName || existingUser[0].firstName,
                                lastName: facebookData.lastName || existingUser[0].lastName,
                                profileImageUrl: facebookData.profileImageUrl ||
                                    existingUser[0].profileImageUrl,
                                facebookAccessToken: facebookData.facebookAccessToken,
                                appContext: newAppContext,
                                // Preserve existing userType to prevent account type changes
                                updatedAt: new Date(),
                            })
                                .where(eq(users.id, existingUser[0].id))
                                .returning()];
                    case 21:
                        user_6 = (_m.sent())[0];
                        void syncUserToBrevo(user_6).catch(function () { });
                        return [2 /*return*/, user_6];
                    case 22:
                        // Step 3: Create new user
                        console.log("✅ Creating new Facebook user...");
                        return [4 /*yield*/, db
                                .insert(users)
                                .values({
                                userType: userType,
                                facebookId: facebookData.facebookId,
                                email: facebookData.email,
                                firstName: facebookData.firstName,
                                lastName: facebookData.lastName,
                                profileImageUrl: facebookData.profileImageUrl,
                                facebookAccessToken: facebookData.facebookAccessToken,
                                appContext: appContext,
                            })
                                .returning()];
                    case 23:
                        user = (_m.sent())[0];
                        console.log("✅ Facebook user created successfully:", {
                            userId: user.id,
                            email: user.email,
                            appContext: appContext,
                        });
                        void syncUserToBrevo(user).catch(function () { });
                        return [2 /*return*/, user];
                    case 24:
                        emailData = userData;
                        console.log("🔍 upsertUserByAuth - Email:", {
                            email: emailData.email,
                            userType: userType,
                            appContext: appContext,
                        });
                        return [4 /*yield*/, db
                                .insert(users)
                                .values({
                                userType: userType,
                                email: emailData.email,
                                firstName: emailData.firstName,
                                lastName: emailData.lastName,
                                phone: emailData.phone,
                                passwordHash: emailData.passwordHash,
                                emailVerified: true,
                                appContext: appContext,
                            })
                                .returning()];
                    case 25:
                        user = (_m.sent())[0];
                        console.log("✅ Email user created successfully:", {
                            userId: user.id,
                            email: user.email,
                            appContext: appContext,
                        });
                        void syncUserToBrevo(user).catch(function () { });
                        return [2 /*return*/, user];
                    case 26: return [3 /*break*/, 39];
                    case 27:
                        error_2 = _m.sent();
                        console.error("❌ upsertUserByAuth error:", {
                            authType: authType,
                            userType: userType,
                            appContext: appContext,
                            errorCode: error_2.code,
                            errorMessage: error_2.message,
                            errorConstraint: error_2.constraint,
                            errorDetail: error_2.detail,
                        });
                        if (!(error_2.code === "23505")) return [3 /*break*/, 38];
                        console.log("🔄 Handling unique constraint violation, retrying with fetch-and-update...");
                        if (!(authType === "tradescout")) return [3 /*break*/, 31];
                        tsData = userData;
                        return [4 /*yield*/, db
                                .select()
                                .from(users)
                                .where(tsData.email
                                ? or(eq(users.tradescoutId, tsData.tradescoutId), eq(users.email, tsData.email))
                                : eq(users.tradescoutId, tsData.tradescoutId))
                                .limit(1)];
                    case 28:
                        existingUser = _m.sent();
                        if (!(existingUser.length > 0)) return [3 /*break*/, 30];
                        console.log("✅ Found existing user during TradeScout retry, updating...");
                        console.log("⚠️  Preserving existing userType:", existingUser[0].userType);
                        current = existingUser[0];
                        return [4 /*yield*/, db
                                .update(users)
                                .set({
                                tradescoutId: tsData.tradescoutId,
                                email: (_j = tsData.email) !== null && _j !== void 0 ? _j : current.email,
                                firstName: (_k = tsData.firstName) !== null && _k !== void 0 ? _k : current.firstName,
                                lastName: (_l = tsData.lastName) !== null && _l !== void 0 ? _l : current.lastName,
                                updatedAt: new Date(),
                            })
                                .where(eq(users.id, current.id))
                                .returning()];
                    case 29:
                        user = (_m.sent())[0];
                        void syncUserToBrevo(user).catch(function () { });
                        return [2 /*return*/, user];
                    case 30: return [3 /*break*/, 38];
                    case 31:
                        if (!(authType === "google")) return [3 /*break*/, 35];
                        googleData = userData;
                        return [4 /*yield*/, db
                                .select()
                                .from(users)
                                .where(googleData.email
                                ? or(eq(users.googleId, googleData.googleId), eq(users.email, googleData.email))
                                : eq(users.googleId, googleData.googleId))
                                .limit(1)];
                    case 32:
                        existingUser = _m.sent();
                        if (!(existingUser.length > 0)) return [3 /*break*/, 34];
                        console.log("✅ Found existing user during retry, updating...");
                        console.log("⚠️  Preserving existing userType:", existingUser[0].userType);
                        return [4 /*yield*/, db
                                .update(users)
                                .set({
                                googleId: googleData.googleId,
                                email: googleData.email,
                                firstName: googleData.firstName,
                                lastName: googleData.lastName,
                                profileImageUrl: googleData.profileImageUrl,
                                googleAccessToken: googleData.googleAccessToken,
                                // Preserve existing userType to prevent account type changes
                                updatedAt: new Date(),
                            })
                                .where(eq(users.id, existingUser[0].id))
                                .returning()];
                    case 33:
                        user = (_m.sent())[0];
                        void syncUserToBrevo(user).catch(function () { });
                        return [2 /*return*/, user];
                    case 34: return [3 /*break*/, 38];
                    case 35:
                        if (!(authType === "facebook")) return [3 /*break*/, 38];
                        facebookData = userData;
                        return [4 /*yield*/, db
                                .select()
                                .from(users)
                                .where(facebookData.email
                                ? or(eq(users.facebookId, facebookData.facebookId), eq(users.email, facebookData.email))
                                : eq(users.facebookId, facebookData.facebookId))
                                .limit(1)];
                    case 36:
                        existingUser = _m.sent();
                        if (!(existingUser.length > 0)) return [3 /*break*/, 38];
                        console.log("✅ Found existing user during retry, updating...");
                        console.log("⚠️  Preserving existing userType:", existingUser[0].userType);
                        return [4 /*yield*/, db
                                .update(users)
                                .set({
                                facebookId: facebookData.facebookId,
                                email: facebookData.email,
                                firstName: facebookData.firstName,
                                lastName: facebookData.lastName,
                                profileImageUrl: facebookData.profileImageUrl,
                                facebookAccessToken: facebookData.facebookAccessToken,
                                // Preserve existing userType to prevent account type changes
                                updatedAt: new Date(),
                            })
                                .where(eq(users.id, existingUser[0].id))
                                .returning()];
                    case 37:
                        user = (_m.sent())[0];
                        void syncUserToBrevo(user).catch(function () { });
                        return [2 /*return*/, user];
                    case 38: 
                    // Re-throw the error if we can't handle it
                    throw error_2;
                    case 39: return [2 /*return*/];
                }
            });
        });
    };
    // Restaurant operations
    DatabaseStorage.prototype.createRestaurant = function (restaurant) {
        return __awaiter(this, void 0, void 0, function () {
            var now, priceLockCutoff, isRestaurant, restaurantData, newRestaurant, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        priceLockCutoff = new Date("2026-03-01");
                        isRestaurant = !restaurant.isFoodTruck;
                        restaurantData = __assign({}, restaurant);
                        if (isRestaurant && now < priceLockCutoff && !restaurant.lockedPriceCents) {
                            // Apply the early rollout price lock: $25/month forever
                            restaurantData = __assign(__assign({}, restaurantData), { lockedPriceCents: 2500, priceLockDate: now, priceLockReason: "early_rollout" });
                        }
                        return [4 /*yield*/, db
                                .insert(restaurants)
                                .values(restaurantData)
                                .returning()];
                    case 1:
                        newRestaurant = (_a.sent())[0];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        if (!newRestaurant.city) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.ensureCityExists(newRestaurant.city, newRestaurant.state || null)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_4 = _a.sent();
                        console.warn("ensureCityExists failed for restaurant", e_4);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, newRestaurant];
                }
            });
        });
    };
    DatabaseStorage.prototype.ensureCityExists = function (name, state) {
        return __awaiter(this, void 0, void 0, function () {
            var cities, slug, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, import("@shared/schema")];
                    case 1:
                        cities = (_a.sent()).cities;
                        slug = name
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9\s-]/g, "")
                            .replace(/\s+/g, "-")
                            .replace(/-+/g, "-");
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, db
                                .insert(cities)
                                .values({ name: name, slug: slug, state: state || null })
                                .onConflictDoNothing()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_5 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRestaurant = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var restaurant;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(restaurants)
                            .where(eq(restaurants.id, id))];
                    case 1:
                        restaurant = (_a.sent())[0];
                        return [2 /*return*/, restaurant];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRestaurantsByOwner = function (ownerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(restaurants)
                            .where(eq(restaurants.ownerId, ownerId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateRestaurant = function (id, restaurant) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(restaurants)
                            .set(__assign(__assign({}, restaurant), { updatedAt: new Date() }))
                            .where(eq(restaurants.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllRestaurants = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.select().from(restaurants)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getNearbyRestaurants = function (lat, lng, radiusKm) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(restaurants)
                            .where(and(eq(restaurants.isActive, true), sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n            (6371 * acos(\n              cos(radians(", ")) *\n              cos(radians(", ")) *\n              cos(radians(", ") - radians(", ")) +\n              sin(radians(", ")) *\n              sin(radians(", "))\n            )) <= ", "\n          "], ["\n            (6371 * acos(\n              cos(radians(", ")) *\n              cos(radians(", ")) *\n              cos(radians(", ") - radians(", ")) +\n              sin(radians(", ")) *\n              sin(radians(", "))\n            )) <= ", "\n          "])), lat, restaurants.latitude, restaurants.longitude, lng, lat, restaurants.latitude, radiusKm)))];
                    case 1: 
                    // Using simple distance calculation - in production, consider PostGIS
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSubscribedRestaurants = function (lat, lng, radiusKm) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            id: restaurants.id,
                            name: restaurants.name,
                            address: restaurants.address,
                            phone: restaurants.phone,
                            businessType: restaurants.businessType,
                            latitude: restaurants.latitude,
                            longitude: restaurants.longitude,
                            cuisineType: restaurants.cuisineType,
                            promoCode: restaurants.promoCode,
                            isActive: restaurants.isActive,
                            isVerified: restaurants.isVerified,
                            ownerId: restaurants.ownerId,
                            createdAt: restaurants.createdAt,
                            updatedAt: restaurants.updatedAt,
                            isFoodTruck: restaurants.isFoodTruck,
                            mobileOnline: restaurants.mobileOnline,
                            currentLatitude: restaurants.currentLatitude,
                            currentLongitude: restaurants.currentLongitude,
                            lastBroadcastAt: restaurants.lastBroadcastAt,
                            operatingHours: restaurants.operatingHours,
                            subscriptionStatus: users.subscriptionBillingInterval,
                        })
                            .from(restaurants)
                            .innerJoin(users, eq(restaurants.ownerId, users.id))
                            .where(and(eq(restaurants.isActive, true), 
                        // Owner has subscription (either promo code or paid)
                        isNotNull(users.subscriptionBillingInterval), sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n            (6371 * acos(\n              cos(radians(", ")) *\n              cos(radians(", ")) *\n              cos(radians(", ") - radians(", ")) +\n              sin(radians(", ")) *\n              sin(radians(", "))\n            )) <= ", "\n          "], ["\n            (6371 * acos(\n              cos(radians(", ")) *\n              cos(radians(", ")) *\n              cos(radians(", ") - radians(", ")) +\n              sin(radians(", ")) *\n              sin(radians(", "))\n            )) <= ", "\n          "])), lat, restaurants.latitude, restaurants.longitude, lng, lat, restaurants.latitude, radiusKm)))];
                    case 1:
                        results = _a.sent();
                        // Map results back to Restaurant type (remove subscriptionStatus)
                        return [2 /*return*/, results.map(function (_a) {
                                var subscriptionStatus = _a.subscriptionStatus, restaurant = __rest(_a, ["subscriptionStatus"]);
                                return restaurant;
                            })];
                }
            });
        });
    };
    DatabaseStorage.prototype.verifyRestaurantOwnership = function (restaurantId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var restaurant;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({ ownerId: restaurants.ownerId })
                            .from(restaurants)
                            .where(eq(restaurants.id, restaurantId))
                            .limit(1)];
                    case 1:
                        restaurant = (_a.sent())[0];
                        return [2 /*return*/, (restaurant === null || restaurant === void 0 ? void 0 : restaurant.ownerId) === userId];
                }
            });
        });
    };
    DatabaseStorage.prototype.createTruckManualSchedule = function (schedule) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(truckManualSchedules)
                            .values(__assign(__assign({}, schedule), { updatedAt: new Date() }))
                            .returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTruckManualSchedules = function (truckId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(truckManualSchedules)
                            .where(eq(truckManualSchedules.truckId, truckId))
                            .orderBy(asc(truckManualSchedules.date))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteTruckManualSchedule = function (scheduleId, truckId) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        whereClause = truckId
                            ? and(eq(truckManualSchedules.id, scheduleId), eq(truckManualSchedules.truckId, truckId))
                            : eq(truckManualSchedules.id, scheduleId);
                        return [4 /*yield*/, db.delete(truckManualSchedules).where(whereClause)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Deal operations
    DatabaseStorage.prototype.createDeal = function (deal) {
        return __awaiter(this, void 0, void 0, function () {
            var newDeal;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.insert(deals).values(deal).returning()];
                    case 1:
                        newDeal = (_a.sent())[0];
                        return [2 /*return*/, newDeal];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDeal = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var deal;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.select().from(deals).where(eq(deals.id, id))];
                    case 1:
                        deal = (_a.sent())[0];
                        return [2 /*return*/, deal];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDealsByRestaurant = function (restaurantId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(deals)
                            .where(eq(deals.restaurantId, restaurantId))
                            .orderBy(desc(deals.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateDeal = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(deals)
                            .set(__assign(__assign({}, updates), { updatedAt: new Date() }))
                            .where(eq(deals.id, id))
                            .returning()];
                    case 1:
                        updated = (_a.sent())[0];
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteDeal = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx.delete(dealClaims).where(eq(dealClaims.dealId, id))];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, tx.delete(dealViews).where(eq(dealViews.dealId, id))];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, tx.delete(dealFeedback).where(eq(dealFeedback.dealId, id))];
                                    case 3:
                                        _a.sent();
                                        return [4 /*yield*/, tx.delete(deals).where(eq(deals.id, id))];
                                    case 4:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.duplicateDeal = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var originalDeal, _, __, ___, ____, dealData, clonedDeal;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDeal(id)];
                    case 1:
                        originalDeal = _a.sent();
                        if (!originalDeal) {
                            throw new Error("Deal not found");
                        }
                        _ = originalDeal.id, __ = originalDeal.createdAt, ___ = originalDeal.updatedAt, ____ = originalDeal.currentUses, dealData = __rest(originalDeal, ["id", "createdAt", "updatedAt", "currentUses"]);
                        return [4 /*yield*/, db
                                .insert(deals)
                                .values(__assign(__assign({}, dealData), { title: "".concat(dealData.title, " (Copy)"), currentUses: 0, isActive: false }))
                                .returning()];
                    case 2:
                        clonedDeal = (_a.sent())[0];
                        return [2 /*return*/, clonedDeal];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllDeals = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.select().from(deals)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getActiveDeals = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, currentTime, activeDealsResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        currentTime = now.toTimeString().slice(0, 5);
                        return [4 /*yield*/, db
                                .select()
                                .from(deals)
                                .where(and(eq(deals.isActive, true), lte(deals.startDate, now), gte(deals.endDate, now), 
                            // Time window logic: handles normal hours, overnight hours, and 24/7
                            sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["(\n            -- 24/7 deals (always active)\n            (", " = '00:00' AND ", " = '23:59')\n            OR\n            -- Normal time window (startTime <= endTime)\n            (", " <= ", " AND ", " <= ", " AND ", " <= ", ")\n            OR\n            -- Overnight time window (startTime > endTime)\n            (", " > ", " AND (", " >= ", " OR ", " <= ", "))\n          )"], ["(\n            -- 24/7 deals (always active)\n            (", " = '00:00' AND ", " = '23:59')\n            OR\n            -- Normal time window (startTime <= endTime)\n            (", " <= ", " AND ", " <= ", " AND ", " <= ", ")\n            OR\n            -- Overnight time window (startTime > endTime)\n            (", " > ", " AND (", " >= ", " OR ", " <= ", "))\n          )"])), deals.startTime, deals.endTime, deals.startTime, deals.endTime, deals.startTime, currentTime, currentTime, deals.endTime, deals.startTime, deals.endTime, currentTime, deals.startTime, currentTime, deals.endTime)))
                                .orderBy(desc(deals.createdAt))
                                .limit(50)];
                    case 1:
                        activeDealsResult = _a.sent();
                        return [4 /*yield*/, this.filterDealsByOperatingHours(activeDealsResult)];
                    case 2: // Limit results for better performance
                    // Filter by restaurant operating hours
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getFilteredDeals = function () {
        return __awaiter(this, arguments, void 0, function (showLimitedTimeOnly) {
            var now, currentTime, dealsQuery, filteredDeals;
            if (showLimitedTimeOnly === void 0) { showLimitedTimeOnly = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        currentTime = now.toTimeString().slice(0, 5);
                        if (!showLimitedTimeOnly) return [3 /*break*/, 2];
                        return [4 /*yield*/, db
                                .select()
                                .from(deals)
                                .where(and(eq(deals.isActive, true), lte(deals.startDate, now), gte(deals.endDate, now), 
                            // Time window logic: handles normal hours and overnight hours (excludes 24/7)
                            sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["(\n              -- Normal time window (startTime <= endTime)\n              (", " <= ", " AND ", " <= ", " AND ", " <= ", ")\n              OR\n              -- Overnight time window (startTime > endTime)\n              (", " > ", " AND (", " >= ", " OR ", " <= ", "))\n            )"], ["(\n              -- Normal time window (startTime <= endTime)\n              (", " <= ", " AND ", " <= ", " AND ", " <= ", ")\n              OR\n              -- Overnight time window (startTime > endTime)\n              (", " > ", " AND (", " >= ", " OR ", " <= ", "))\n            )"])), deals.startTime, deals.endTime, deals.startTime, currentTime, currentTime, deals.endTime, deals.startTime, deals.endTime, currentTime, deals.startTime, currentTime, deals.endTime), 
                            // Exclude 24/7 deals - be more robust in detection
                            sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["NOT (\n              (", " = '00:00' AND ", " = '23:59')\n              OR (", " = '00:00' AND ", " = '24:00')\n              OR (", " = ", ")\n            )"], ["NOT (\n              (", " = '00:00' AND ", " = '23:59')\n              OR (", " = '00:00' AND ", " = '24:00')\n              OR (", " = ", ")\n            )"])), deals.startTime, deals.endTime, deals.startTime, deals.endTime, deals.startTime, deals.endTime)))
                                .orderBy(desc(deals.createdAt))
                                .limit(200)];
                    case 1:
                        // Show only deals with specific time restrictions (not 24/7)
                        dealsQuery = _a.sent(); // Increase limit to get more deals for randomization
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, db
                            .select()
                            .from(deals)
                            .where(and(eq(deals.isActive, true), lte(deals.startDate, now), gte(deals.endDate, now), 
                        // Apply the same time window logic as getActiveDeals
                        sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["(\n              -- 24/7 deals (always active)\n              (", " = '00:00' AND ", " = '23:59')\n              OR\n              -- Normal time window (startTime <= endTime)\n              (", " <= ", " AND ", " <= ", " AND ", " <= ", ")\n              OR\n              -- Overnight time window (startTime > endTime)\n              (", " > ", " AND (", " >= ", " OR ", " <= ", "))\n            )"], ["(\n              -- 24/7 deals (always active)\n              (", " = '00:00' AND ", " = '23:59')\n              OR\n              -- Normal time window (startTime <= endTime)\n              (", " <= ", " AND ", " <= ", " AND ", " <= ", ")\n              OR\n              -- Overnight time window (startTime > endTime)\n              (", " > ", " AND (", " >= ", " OR ", " <= ", "))\n            )"])), deals.startTime, deals.endTime, deals.startTime, deals.endTime, deals.startTime, currentTime, currentTime, deals.endTime, deals.startTime, deals.endTime, currentTime, deals.startTime, currentTime, deals.endTime)))
                            .orderBy(desc(deals.createdAt))
                            .limit(200)];
                    case 3:
                        // Show all currently active deals (includes time-of-day filtering)
                        dealsQuery = _a.sent(); // Increase limit to get more deals for randomization
                        _a.label = 4;
                    case 4: return [4 /*yield*/, this.filterDealsByOperatingHours(dealsQuery)];
                    case 5:
                        filteredDeals = _a.sent();
                        // Group deals by restaurant and randomly select one deal per restaurant
                        return [2 /*return*/, this.randomizeDealsPerRestaurant(filteredDeals)];
                }
            });
        });
    };
    // New method to randomly select one deal per restaurant for diverse feed display
    DatabaseStorage.prototype.randomizeDealsPerRestaurant = function (deals) {
        var _a;
        var dealsByRestaurant = {};
        // Group deals by restaurant
        for (var _i = 0, deals_1 = deals; _i < deals_1.length; _i++) {
            var deal = deals_1[_i];
            var restaurantId = deal.restaurantId;
            if (!dealsByRestaurant[restaurantId]) {
                dealsByRestaurant[restaurantId] = [];
            }
            dealsByRestaurant[restaurantId].push(deal);
        }
        // Randomly select one deal per restaurant
        var randomizedDeals = [];
        for (var restaurantId in dealsByRestaurant) {
            var restaurantDeals = dealsByRestaurant[restaurantId];
            var randomIndex = Math.floor(Math.random() * restaurantDeals.length);
            randomizedDeals.push(restaurantDeals[randomIndex]);
        }
        // Shuffle the final array to randomize restaurant order too
        for (var i = randomizedDeals.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            _a = [
                randomizedDeals[j],
                randomizedDeals[i],
            ], randomizedDeals[i] = _a[0], randomizedDeals[j] = _a[1];
        }
        return randomizedDeals.slice(0, 50); // Limit to 50 restaurants max
    };
    // Admin specific methods
    DatabaseStorage.prototype.getAdminStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, totalUsers, totalRestaurants, totalDeals, activeDeals, totalClaims, todayClaims, newUsersToday, revenueResult, revenue;
            var _b, _c, _d, _e, _f, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            db.select({ count: sql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["cast(count(*) as integer)"], ["cast(count(*) as integer)"]))) }).from(users),
                            db
                                .select({ count: sql(templateObject_8 || (templateObject_8 = __makeTemplateObject(["cast(count(*) as integer)"], ["cast(count(*) as integer)"]))) })
                                .from(restaurants),
                            db.select({ count: sql(templateObject_9 || (templateObject_9 = __makeTemplateObject(["cast(count(*) as integer)"], ["cast(count(*) as integer)"]))) }).from(deals),
                            db
                                .select({ count: sql(templateObject_10 || (templateObject_10 = __makeTemplateObject(["cast(count(*) as integer)"], ["cast(count(*) as integer)"]))) })
                                .from(deals)
                                .where(eq(deals.isActive, true)),
                            db
                                .select({ count: sql(templateObject_11 || (templateObject_11 = __makeTemplateObject(["cast(count(*) as integer)"], ["cast(count(*) as integer)"]))) })
                                .from(dealClaims),
                            db
                                .select({ count: sql(templateObject_12 || (templateObject_12 = __makeTemplateObject(["cast(count(*) as integer)"], ["cast(count(*) as integer)"]))) })
                                .from(dealClaims)
                                .where(gte(dealClaims.claimedAt, new Date(new Date().setHours(0, 0, 0, 0)))),
                            db
                                .select({ count: sql(templateObject_13 || (templateObject_13 = __makeTemplateObject(["cast(count(*) as integer)"], ["cast(count(*) as integer)"]))) })
                                .from(users)
                                .where(gte(users.createdAt, new Date(new Date().setHours(0, 0, 0, 0)))),
                        ])];
                    case 1:
                        _a = _k.sent(), totalUsers = _a[0], totalRestaurants = _a[1], totalDeals = _a[2], activeDeals = _a[3], totalClaims = _a[4], todayClaims = _a[5], newUsersToday = _a[6];
                        return [4 /*yield*/, db
                                .select({
                                sum: sql(templateObject_14 || (templateObject_14 = __makeTemplateObject(["coalesce(cast(sum(", ") as numeric), 0)"], ["coalesce(cast(sum(", ") as numeric), 0)"])), dealClaims.orderAmount),
                            })
                                .from(dealClaims)
                                .where(eq(dealClaims.isUsed, true))];
                    case 2:
                        revenueResult = _k.sent();
                        revenue = ((_b = revenueResult[0]) === null || _b === void 0 ? void 0 : _b.sum) || 0;
                        return [2 /*return*/, {
                                totalUsers: ((_c = totalUsers[0]) === null || _c === void 0 ? void 0 : _c.count) || 0,
                                totalRestaurants: ((_d = totalRestaurants[0]) === null || _d === void 0 ? void 0 : _d.count) || 0,
                                totalDeals: ((_e = totalDeals[0]) === null || _e === void 0 ? void 0 : _e.count) || 0,
                                activeDeals: ((_f = activeDeals[0]) === null || _f === void 0 ? void 0 : _f.count) || 0,
                                totalClaims: ((_g = totalClaims[0]) === null || _g === void 0 ? void 0 : _g.count) || 0,
                                todayClaims: ((_h = todayClaims[0]) === null || _h === void 0 ? void 0 : _h.count) || 0,
                                newUsersToday: ((_j = newUsersToday[0]) === null || _j === void 0 ? void 0 : _j.count) || 0,
                                revenue: revenue,
                            }];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPendingRestaurants = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(restaurants)
                            .where(eq(restaurants.isActive, false))
                            .orderBy(desc(restaurants.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.approveRestaurant = function (restaurantId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(restaurants)
                            .set({ isActive: true })
                            .where(eq(restaurants.id, restaurantId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteRestaurant = function (restaurantId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.delete(restaurants).where(eq(restaurants.id, restaurantId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(users)
                            .where(or(eq(users.isDisabled, false), isNull(users.isDisabled)))
                            .orderBy(desc(users.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUserStatus = function (userId, isActive) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Use isDisabled flag on users to represent active status
                    return [4 /*yield*/, db
                            .update(users)
                            .set({ isDisabled: !isActive })
                            .where(eq(users.id, userId))];
                    case 1:
                        // Use isDisabled flag on users to represent active status
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.createUserManually = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var hashedPassword, affiliatePercent, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, bcrypt.hash(userData.tempPassword, 10)];
                    case 1:
                        hashedPassword = _a.sent();
                        affiliatePercent = userData.userType === "staff"
                            ? 25
                            : userData.userType === "admin" || userData.userType === "super_admin"
                                ? 0
                                : undefined;
                        return [4 /*yield*/, db
                                .insert(users)
                                .values(__assign({ email: userData.email, firstName: userData.firstName, lastName: userData.lastName, phone: userData.phone, userType: userData.userType, passwordHash: hashedPassword, mustResetPassword: true, emailVerified: true }, (affiliatePercent !== undefined ? { affiliatePercent: affiliatePercent } : {})))
                                .returning()];
                    case 2:
                        user = (_a.sent())[0];
                        if (this.shouldAssignAffiliateTag(user.userType)) {
                            ensureAffiliateTag(user.id).catch(function (error) {
                                return console.error("[affiliate] Failed to assign tag:", error);
                            });
                        }
                        void syncUserToBrevo(user).catch(function () { });
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.createUserInvite = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var affiliatePercent, shouldAutoVerify, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        affiliatePercent = data.userType === "staff"
                            ? 25
                            : data.userType === "admin" || data.userType === "super_admin"
                                ? 0
                                : undefined;
                        shouldAutoVerify = data.userType === "admin" || data.userType === "super_admin";
                        return [4 /*yield*/, db
                                .insert(users)
                                .values(__assign({ email: data.email, firstName: data.firstName, lastName: data.lastName, phone: data.phone, userType: data.userType, passwordHash: null, mustResetPassword: false, emailVerified: shouldAutoVerify }, (affiliatePercent !== undefined ? { affiliatePercent: affiliatePercent } : {})))
                                .returning()];
                    case 1:
                        user = (_a.sent())[0];
                        void syncUserToBrevo(user).catch(function () { });
                        return [2 /*return*/, user];
                }
            });
        });
    };
    DatabaseStorage.prototype.createRestaurantForUser = function (restaurantData) {
        return __awaiter(this, void 0, void 0, function () {
            var restaurant;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(restaurants)
                            .values({
                            ownerId: restaurantData.userId,
                            name: restaurantData.name,
                            address: restaurantData.address,
                            cuisineType: restaurantData.cuisineType,
                            isActive: true,
                            isVerified: true, // Admin-created restaurants are pre-verified
                        })
                            .returning()];
                    case 1:
                        restaurant = (_a.sent())[0];
                        return [2 /*return*/, restaurant];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllDealsWithRestaurants = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            id: deals.id,
                            title: deals.title,
                            discountValue: deals.discountValue,
                            isActive: deals.isActive,
                            restaurant: {
                                id: restaurants.id,
                                name: restaurants.name,
                            },
                        })
                            .from(deals)
                            .leftJoin(restaurants, eq(deals.restaurantId, restaurants.id))
                            .orderBy(desc(deals.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getNearbyDeals = function (lat, lng, radiusKm) {
        return __awaiter(this, void 0, void 0, function () {
            var now, currentTime, dealsQuery;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        currentTime = now.toTimeString().slice(0, 5);
                        return [4 /*yield*/, db
                                .select({
                                id: deals.id,
                                restaurantId: deals.restaurantId,
                                title: deals.title,
                                description: deals.description,
                                dealType: deals.dealType,
                                discountValue: deals.discountValue,
                                minOrderAmount: deals.minOrderAmount,
                                imageUrl: deals.imageUrl,
                                startDate: deals.startDate,
                                endDate: deals.endDate,
                                startTime: deals.startTime,
                                endTime: deals.endTime,
                                totalUsesLimit: deals.totalUsesLimit,
                                perCustomerLimit: deals.perCustomerLimit,
                                currentUses: deals.currentUses,
                                isActive: deals.isActive,
                                createdAt: deals.createdAt,
                                updatedAt: deals.updatedAt,
                                restaurant: {
                                    name: restaurants.name,
                                    cuisineType: restaurants.cuisineType,
                                    phone: restaurants.phone,
                                    latitude: restaurants.latitude,
                                    longitude: restaurants.longitude,
                                    isFoodTruck: restaurants.isFoodTruck,
                                    mobileOnline: restaurants.mobileOnline,
                                    currentLatitude: restaurants.currentLatitude,
                                    currentLongitude: restaurants.currentLongitude,
                                    lastBroadcastAt: restaurants.lastBroadcastAt,
                                },
                                distance: sql(templateObject_15 || (templateObject_15 = __makeTemplateObject(["\n          (6371 * acos(\n            cos(radians(", ")) *\n            cos(radians(", ")) *\n            cos(radians(", ") - radians(", ")) +\n            sin(radians(", ")) *\n            sin(radians(", "))\n          ))\n        "], ["\n          (6371 * acos(\n            cos(radians(", ")) *\n            cos(radians(", ")) *\n            cos(radians(", ") - radians(", ")) +\n            sin(radians(", ")) *\n            sin(radians(", "))\n          ))\n        "])), lat, restaurants.latitude, restaurants.longitude, lng, lat, restaurants.latitude).as("distance"),
                            })
                                .from(deals)
                                .innerJoin(restaurants, eq(deals.restaurantId, restaurants.id))
                                .where(and(eq(deals.isActive, true), eq(restaurants.isActive, true), lte(deals.startDate, now), gte(deals.endDate, now), 
                            // Time window logic: handles normal hours, overnight hours, and 24/7
                            sql(templateObject_16 || (templateObject_16 = __makeTemplateObject(["(\n            -- 24/7 deals (always active)\n            (", " = '00:00' AND ", " = '23:59')\n            OR\n            -- Normal time window (startTime <= endTime)\n            (", " <= ", " AND ", " <= ", " AND ", " <= ", ")\n            OR\n            -- Overnight time window (startTime > endTime)\n            (", " > ", " AND (", " >= ", " OR ", " <= ", "))\n          )"], ["(\n            -- 24/7 deals (always active)\n            (", " = '00:00' AND ", " = '23:59')\n            OR\n            -- Normal time window (startTime <= endTime)\n            (", " <= ", " AND ", " <= ", " AND ", " <= ", ")\n            OR\n            -- Overnight time window (startTime > endTime)\n            (", " > ", " AND (", " >= ", " OR ", " <= ", "))\n          )"])), deals.startTime, deals.endTime, deals.startTime, deals.endTime, deals.startTime, currentTime, currentTime, deals.endTime, deals.startTime, deals.endTime, currentTime, deals.startTime, currentTime, deals.endTime), sql(templateObject_17 || (templateObject_17 = __makeTemplateObject(["\n            (6371 * acos(\n              cos(radians(", ")) *\n              cos(radians(", ")) *\n              cos(radians(", ") - radians(", ")) +\n              sin(radians(", ")) *\n              sin(radians(", "))\n            )) <= ", "\n          "], ["\n            (6371 * acos(\n              cos(radians(", ")) *\n              cos(radians(", ")) *\n              cos(radians(", ") - radians(", ")) +\n              sin(radians(", ")) *\n              sin(radians(", "))\n            )) <= ", "\n          "])), lat, restaurants.latitude, restaurants.longitude, lng, lat, restaurants.latitude, radiusKm)))
                                .orderBy(sql(templateObject_18 || (templateObject_18 = __makeTemplateObject(["distance ASC, RANDOM()"], ["distance ASC, RANDOM()"]))))];
                    case 1:
                        dealsQuery = _a.sent();
                        return [4 /*yield*/, this.filterDealsByOperatingHours(dealsQuery)];
                    case 2: 
                    // Filter by restaurant operating hours
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.incrementDealUses = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(deals)
                            .set({
                            currentUses: sql(templateObject_19 || (templateObject_19 = __makeTemplateObject(["", " + 1"], ["", " + 1"])), deals.currentUses),
                            updatedAt: new Date(),
                        })
                            .where(eq(deals.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deactivateUserDeals = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userRestaurants, restaurantIds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({ id: restaurants.id })
                            .from(restaurants)
                            .where(eq(restaurants.ownerId, userId))];
                    case 1:
                        userRestaurants = _a.sent();
                        if (!(userRestaurants.length > 0)) return [3 /*break*/, 3];
                        restaurantIds = userRestaurants.map(function (r) { return r.id; });
                        return [4 /*yield*/, db
                                .update(deals)
                                .set({
                                isActive: false,
                                updatedAt: new Date(),
                            })
                                .where(inArray(deals.restaurantId, restaurantIds))];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.searchDeals = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var dealsResult, searchResults, needsRestaurantData, restaurantIds, restaurantData, restaurantMap_1, searchTerm_1, cuisineFilter_1, finalResults;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getActiveDeals()];
                    case 1:
                        dealsResult = _a.sent();
                        searchResults = dealsResult.map(function (deal) { return (__assign(__assign({}, deal), { 
                            // We'll need restaurant data for filtering, so let's fetch it
                            restaurantData: null })); });
                        needsRestaurantData = filters.query ||
                            filters.cuisineType ||
                            (filters.latitude && filters.longitude && filters.radius);
                        if (!(needsRestaurantData && searchResults.length > 0)) return [3 /*break*/, 3];
                        restaurantIds = Array.from(new Set(searchResults.map(function (deal) { return deal.restaurantId; })));
                        return [4 /*yield*/, db
                                .select({
                                id: restaurants.id,
                                name: restaurants.name,
                                address: restaurants.address,
                                latitude: restaurants.latitude,
                                longitude: restaurants.longitude,
                                cuisineType: restaurants.cuisineType,
                                isVerified: restaurants.isVerified,
                            })
                                .from(restaurants)
                                .where(inArray(restaurants.id, restaurantIds))];
                    case 2:
                        restaurantData = _a.sent();
                        restaurantMap_1 = new Map(restaurantData.map(function (r) { return [r.id, r]; }));
                        // Add restaurant data to results
                        searchResults = searchResults.map(function (deal) { return (__assign(__assign({}, deal), { restaurantData: restaurantMap_1.get(deal.restaurantId) })); });
                        _a.label = 3;
                    case 3:
                        // Apply search filters
                        if (filters.query && filters.query.trim()) {
                            searchTerm_1 = filters.query.trim().toLowerCase();
                            searchResults = searchResults.filter(function (deal) {
                                var _a, _b, _c, _d;
                                return deal.title.toLowerCase().includes(searchTerm_1) ||
                                    deal.description.toLowerCase().includes(searchTerm_1) ||
                                    ((_b = (_a = deal.restaurantData) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchTerm_1)) ||
                                    ((_d = (_c = deal.restaurantData) === null || _c === void 0 ? void 0 : _c.cuisineType) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(searchTerm_1));
                            });
                        }
                        // Apply cuisine type filter
                        if (filters.cuisineType && filters.cuisineType.trim()) {
                            cuisineFilter_1 = filters.cuisineType.toLowerCase();
                            searchResults = searchResults.filter(function (deal) { var _a, _b; return (_b = (_a = deal.restaurantData) === null || _a === void 0 ? void 0 : _a.cuisineType) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(cuisineFilter_1); });
                        }
                        // Apply price range filters
                        if (filters.minPrice !== undefined) {
                            searchResults = searchResults.filter(function (deal) { return deal.discountedPrice >= filters.minPrice; });
                        }
                        if (filters.maxPrice !== undefined) {
                            searchResults = searchResults.filter(function (deal) { return deal.discountedPrice <= filters.maxPrice; });
                        }
                        // Apply location filtering if coordinates provided
                        if (filters.latitude && filters.longitude && filters.radius) {
                            searchResults = searchResults.filter(function (deal) {
                                var _a, _b;
                                var lat1 = filters.latitude;
                                var lng1 = filters.longitude;
                                var lat2 = parseFloat(((_a = deal.restaurantData) === null || _a === void 0 ? void 0 : _a.latitude) || "0");
                                var lng2 = parseFloat(((_b = deal.restaurantData) === null || _b === void 0 ? void 0 : _b.longitude) || "0");
                                if (lat2 === 0 || lng2 === 0)
                                    return false;
                                // Calculate distance using Haversine formula
                                var R = 6371; // Earth's radius in kilometers
                                var dLat = ((lat2 - lat1) * Math.PI) / 180;
                                var dLng = ((lng2 - lng1) * Math.PI) / 180;
                                var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                    Math.cos((lat1 * Math.PI) / 180) *
                                        Math.cos((lat2 * Math.PI) / 180) *
                                        Math.sin(dLng / 2) *
                                        Math.sin(dLng / 2);
                                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                var distance = R * c;
                                return distance <= filters.radius;
                            });
                        }
                        // Apply sorting
                        if (filters.sortBy === "price-low") {
                            searchResults.sort(function (a, b) { return a.discountedPrice - b.discountedPrice; });
                        }
                        else if (filters.sortBy === "price-high") {
                            searchResults.sort(function (a, b) { return b.discountedPrice - a.discountedPrice; });
                        }
                        else if (filters.sortBy === "discount") {
                            searchResults.sort(function (a, b) { return (b.discountPercentage || 0) - (a.discountPercentage || 0); });
                        }
                        else if (filters.sortBy === "date") {
                            searchResults.sort(function (a, b) {
                                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            });
                        }
                        else {
                            // Default relevance sort (verified restaurants first, then by creation date)
                            searchResults.sort(function (a, b) {
                                var _a, _b;
                                var aVerified = ((_a = a.restaurantData) === null || _a === void 0 ? void 0 : _a.isVerified) ? 1 : 0;
                                var bVerified = ((_b = b.restaurantData) === null || _b === void 0 ? void 0 : _b.isVerified) ? 1 : 0;
                                if (aVerified !== bVerified)
                                    return bVerified - aVerified;
                                return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                            });
                        }
                        finalResults = searchResults.slice(0, 100).map(function (deal) {
                            var restaurantData = deal.restaurantData, dealWithoutRestaurantData = __rest(deal, ["restaurantData"]);
                            return dealWithoutRestaurantData;
                        });
                        return [2 /*return*/, finalResults];
                }
            });
        });
    };
    // Deal claim operations
    DatabaseStorage.prototype.claimDeal = function (claim) {
        return __awaiter(this, void 0, void 0, function () {
            var newClaim;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.insert(dealClaims).values(claim).returning()];
                    case 1:
                        newClaim = (_a.sent())[0];
                        return [2 /*return*/, newClaim];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserDealClaims = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(dealClaims)
                            .where(eq(dealClaims.userId, userId))
                            .orderBy(desc(dealClaims.claimedAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserDealClaimsWithDetails = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            id: dealClaims.id,
                            dealId: dealClaims.dealId,
                            claimedAt: dealClaims.claimedAt,
                            usedAt: dealClaims.usedAt,
                            isUsed: dealClaims.isUsed,
                            orderAmount: dealClaims.orderAmount,
                            dealTitle: deals.title,
                            dealType: deals.dealType,
                            discountValue: deals.discountValue,
                            restaurantId: deals.restaurantId,
                            restaurantName: restaurants.name,
                        })
                            .from(dealClaims)
                            .innerJoin(deals, eq(dealClaims.dealId, deals.id))
                            .innerJoin(restaurants, eq(deals.restaurantId, restaurants.id))
                            .where(eq(dealClaims.userId, userId))
                            .orderBy(desc(dealClaims.claimedAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDealClaimsCount = function (dealId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var conditions, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conditions = [eq(dealClaims.dealId, dealId)];
                        if (userId) {
                            conditions.push(eq(dealClaims.userId, userId));
                        }
                        return [4 /*yield*/, db
                                .select({ count: sql(templateObject_20 || (templateObject_20 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(dealClaims)
                                .where(and.apply(void 0, conditions))];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result.count];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRestaurantDealClaims = function (restaurantId, status) {
        return __awaiter(this, void 0, void 0, function () {
            var conditions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conditions = [eq(deals.restaurantId, restaurantId)];
                        if (status === "pending") {
                            conditions.push(isNull(dealClaims.usedAt));
                        }
                        else if (status === "used") {
                            conditions.push(isNotNull(dealClaims.usedAt));
                        }
                        return [4 /*yield*/, db
                                .select({
                                claimId: dealClaims.id,
                                dealId: dealClaims.dealId,
                                userId: dealClaims.userId,
                                claimedAt: dealClaims.claimedAt,
                                usedAt: dealClaims.usedAt,
                                orderAmount: dealClaims.orderAmount,
                                dealTitle: deals.title,
                                userName: sql(templateObject_21 || (templateObject_21 = __makeTemplateObject(["", " || ' ' || ", ""], ["", " || ' ' || ", ""])), users.firstName, users.lastName),
                                userEmail: users.email,
                            })
                                .from(dealClaims)
                                .innerJoin(deals, eq(dealClaims.dealId, deals.id))
                                .innerJoin(users, eq(dealClaims.userId, users.id))
                                .where(and.apply(void 0, conditions))
                                .orderBy(desc(dealClaims.claimedAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Review operations
    DatabaseStorage.prototype.createReview = function (review) {
        return __awaiter(this, void 0, void 0, function () {
            var newReview;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.insert(reviews).values(review).returning()];
                    case 1:
                        newReview = (_a.sent())[0];
                        return [2 /*return*/, newReview];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRestaurantReviews = function (restaurantId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            id: reviews.id,
                            restaurantId: reviews.restaurantId,
                            userId: reviews.userId,
                            rating: reviews.rating,
                            reviewText: reviews.comment,
                            createdAt: reviews.createdAt,
                            user: {
                                firstName: users.firstName,
                                lastName: users.lastName,
                                profileImageUrl: users.profileImageUrl,
                            },
                        })
                            .from(reviews)
                            .leftJoin(users, eq(reviews.userId, users.id))
                            .where(eq(reviews.restaurantId, restaurantId))
                            .orderBy(desc(reviews.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRestaurantAverageRating = function (restaurantId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({ avg: sql(templateObject_22 || (templateObject_22 = __makeTemplateObject(["avg(", ")"], ["avg(", ")"])), reviews.rating) })
                            .from(reviews)
                            .where(eq(reviews.restaurantId, restaurantId))];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result.avg || 0];
                }
            });
        });
    };
    // Admin operations
    DatabaseStorage.prototype.ensureAdminExists = function () {
        return __awaiter(this, void 0, void 0, function () {
            var adminEmail, adminPassword, existingAdmin, matches, newHash, newHash, passwordHash, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        adminEmail = process.env.ADMIN_EMAIL;
                        adminPassword = process.env.ADMIN_PASSWORD;
                        if (!adminEmail || !adminPassword) {
                            console.log("⚠️  Admin credentials not configured - skipping admin creation");
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 16, , 17]);
                        return [4 /*yield*/, this.getUserByEmail(adminEmail)];
                    case 2:
                        existingAdmin = _a.sent();
                        if (!existingAdmin) return [3 /*break*/, 13];
                        console.log("✅ Admin account already exists");
                        if (!existingAdmin.passwordHash) return [3 /*break*/, 9];
                        return [4 /*yield*/, bcrypt.compare(adminPassword, existingAdmin.passwordHash)];
                    case 3:
                        matches = _a.sent();
                        if (!!matches) return [3 /*break*/, 6];
                        console.log("🔄 Admin password differs from configured ADMIN_PASSWORD – updating hash");
                        return [4 /*yield*/, bcrypt.hash(adminPassword, 12)];
                    case 4:
                        newHash = _a.sent();
                        return [4 /*yield*/, db
                                .update(users)
                                .set({ passwordHash: newHash, userType: "super_admin" })
                                .where(eq(users.id, existingAdmin.id))];
                    case 5:
                        _a.sent();
                        console.log("✅ Admin password updated to match environment");
                        return [3 /*break*/, 8];
                    case 6:
                        if (!(existingAdmin.userType !== "super_admin")) return [3 /*break*/, 8];
                        // Ensure the admin is super_admin
                        return [4 /*yield*/, db
                                .update(users)
                                .set({ userType: "super_admin" })
                                .where(eq(users.id, existingAdmin.id))];
                    case 7:
                        // Ensure the admin is super_admin
                        _a.sent();
                        console.log("✅ Admin upgraded to super_admin");
                        _a.label = 8;
                    case 8: return [3 /*break*/, 12];
                    case 9: return [4 /*yield*/, bcrypt.hash(adminPassword, 12)];
                    case 10:
                        newHash = _a.sent();
                        return [4 /*yield*/, db
                                .update(users)
                                .set({ passwordHash: newHash, userType: "super_admin" })
                                .where(eq(users.id, existingAdmin.id))];
                    case 11:
                        _a.sent();
                        console.log("✅ Admin password initialized from environment");
                        _a.label = 12;
                    case 12: return [2 /*return*/];
                    case 13: return [4 /*yield*/, bcrypt.hash(adminPassword, 12)];
                    case 14:
                        passwordHash = _a.sent();
                        // Create admin user
                        return [4 /*yield*/, this.upsertUserByAuth("email", {
                                email: adminEmail,
                                firstName: "Admin",
                                lastName: "User",
                                phone: "+1 (555) 000-0000",
                                passwordHash: passwordHash,
                            }, "admin")];
                    case 15:
                        // Create admin user
                        _a.sent();
                        console.log("✅ Super Admin account created successfully");
                        return [3 /*break*/, 17];
                    case 16:
                        error_3 = _a.sent();
                        console.error("❌ Failed to create admin account:", error_3);
                        return [3 /*break*/, 17];
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    // Seed data for development and testing
    DatabaseStorage.prototype.seedDevelopmentData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var existingRestaurants, owner1, _a, _b, owner2, _c, _d, owner3, _e, _f, customer1, _g, _h, owner4, _j, _k, owner5, _l, _m, owner6, _o, _p, restaurant1, restaurant2, restaurant3, restaurant4, restaurant5, restaurant6, restaurant7, restaurant8, restaurant9, restaurant10, restaurant11, restaurant12, foodTruck1, foodTruck2, foodTruck3, deal1, deal2, deal3, deal4, deal5, deal6, deal7, deal8, deal9, deal10, deal11, deal12, deal13, deal14, deal15, error_4;
            var _q, _r, _s, _t, _u, _v, _w;
            return __generator(this, function (_x) {
                switch (_x.label) {
                    case 0:
                        _x.trys.push([0, 64, , 65]);
                        return [4 /*yield*/, db.select().from(restaurants).limit(1)];
                    case 1:
                        existingRestaurants = _x.sent();
                        if (existingRestaurants.length > 0) {
                            console.log("✅ Seed data already exists");
                            return [2 /*return*/];
                        }
                        console.log("🌱 Seeding development data...");
                        _a = this.upsertUserByAuth;
                        _b = ["email"];
                        _q = {
                            email: "owner1@example.com",
                            firstName: "Mario",
                            lastName: "Rossi",
                            phone: "+1 (985) 555-0001"
                        };
                        return [4 /*yield*/, bcrypt.hash("password123", 10)];
                    case 2: return [4 /*yield*/, _a.apply(this, _b.concat([(_q.passwordHash = _x.sent(),
                                _q), "restaurant_owner"]))];
                    case 3:
                        owner1 = _x.sent();
                        _c = this.upsertUserByAuth;
                        _d = ["email"];
                        _r = {
                            email: "owner2@example.com",
                            firstName: "Luigi",
                            lastName: "Verde",
                            phone: "+1 (985) 555-0002"
                        };
                        return [4 /*yield*/, bcrypt.hash("password123", 10)];
                    case 4: return [4 /*yield*/, _c.apply(this, _d.concat([(_r.passwordHash = _x.sent(),
                                _r), "restaurant_owner"]))];
                    case 5:
                        owner2 = _x.sent();
                        _e = this.upsertUserByAuth;
                        _f = ["email"];
                        _s = {
                            email: "owner3@example.com",
                            firstName: "Giuseppe",
                            lastName: "Bianchi",
                            phone: "+1 (985) 555-0003"
                        };
                        return [4 /*yield*/, bcrypt.hash("password123", 10)];
                    case 6: return [4 /*yield*/, _e.apply(this, _f.concat([(_s.passwordHash = _x.sent(),
                                _s), "restaurant_owner"]))];
                    case 7:
                        owner3 = _x.sent();
                        _g = this.upsertUserByAuth;
                        _h = ["email"];
                        _t = {
                            email: "customer@example.com",
                            firstName: "John",
                            lastName: "Doe",
                            phone: "+1 (985) 555-0100"
                        };
                        return [4 /*yield*/, bcrypt.hash("password123", 10)];
                    case 8: return [4 /*yield*/, _g.apply(this, _h.concat([(_t.passwordHash = _x.sent(),
                                _t), "customer"]))];
                    case 9:
                        customer1 = _x.sent();
                        _j = this.upsertUserByAuth;
                        _k = ["email"];
                        _u = {
                            email: "owner4@example.com",
                            firstName: "Maria",
                            lastName: "Garcia",
                            phone: "+1 (985) 555-0004"
                        };
                        return [4 /*yield*/, bcrypt.hash("password123", 10)];
                    case 10: return [4 /*yield*/, _j.apply(this, _k.concat([(_u.passwordHash = _x.sent(),
                                _u), "restaurant_owner"]))];
                    case 11:
                        owner4 = _x.sent();
                        _l = this.upsertUserByAuth;
                        _m = ["email"];
                        _v = {
                            email: "owner5@example.com",
                            firstName: "David",
                            lastName: "Chen",
                            phone: "+1 (985) 555-0005"
                        };
                        return [4 /*yield*/, bcrypt.hash("password123", 10)];
                    case 12: return [4 /*yield*/, _l.apply(this, _m.concat([(_v.passwordHash = _x.sent(),
                                _v), "restaurant_owner"]))];
                    case 13:
                        owner5 = _x.sent();
                        _o = this.upsertUserByAuth;
                        _p = ["email"];
                        _w = {
                            email: "owner6@example.com",
                            firstName: "Sarah",
                            lastName: "Johnson",
                            phone: "+1 (985) 555-0006"
                        };
                        return [4 /*yield*/, bcrypt.hash("password123", 10)];
                    case 14: return [4 /*yield*/, _o.apply(this, _p.concat([(_w.passwordHash = _x.sent(),
                                _w), "restaurant_owner"]))];
                    case 15:
                        owner6 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Café du Monde Hammond",
                                address: "315 W Thomas St, Hammond, LA 70401",
                                city: "Hammond",
                                state: "LA",
                                phone: "+1 (985) 345-2233",
                                cuisineType: "Cajun",
                                latitude: "30.5047",
                                longitude: "-90.4612",
                                ownerId: owner1.id,
                            })];
                    case 16:
                        restaurant1 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Red Lobster Hammond",
                                address: "1535 W Thomas St, Hammond, LA 70401",
                                city: "Hammond",
                                state: "LA",
                                phone: "+1 (985) 419-1235",
                                cuisineType: "Seafood",
                                latitude: "30.5125",
                                longitude: "-90.4897",
                                ownerId: owner2.id,
                            })];
                    case 17:
                        restaurant2 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Joe's Pizza NYC",
                                address: "7 Carmine St, New York, NY 10014",
                                city: "New York",
                                state: "NY",
                                phone: "+1 (212) 366-1182",
                                cuisineType: "Italian",
                                latitude: "40.7303",
                                longitude: "-74.0033",
                                ownerId: owner3.id,
                            })];
                    case 18:
                        restaurant3 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Katz's Delicatessen",
                                address: "205 E Houston St, New York, NY 10002",
                                city: "New York",
                                state: "NY",
                                phone: "+1 (212) 254-2246",
                                cuisineType: "Jewish",
                                latitude: "40.7222",
                                longitude: "-73.9876",
                                ownerId: owner4.id,
                            })];
                    case 19:
                        restaurant4 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "In-N-Out Burger",
                                address: "7009 Sunset Blvd, Hollywood, CA 90028",
                                city: "Los Angeles",
                                state: "CA",
                                phone: "+1 (800) 786-1000",
                                cuisineType: "American",
                                latitude: "34.0985",
                                longitude: "-118.3431",
                                ownerId: owner5.id,
                            })];
                    case 20:
                        restaurant5 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Guelaguetza",
                                address: "3014 W Olympic Blvd, Los Angeles, CA 90006",
                                city: "Los Angeles",
                                state: "CA",
                                phone: "+1 (213) 427-0608",
                                cuisineType: "Mexican",
                                latitude: "34.0579",
                                longitude: "-118.2951",
                                ownerId: owner6.id,
                            })];
                    case 21:
                        restaurant6 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Lou Malnati's Pizzeria",
                                address: "439 N Wells St, Chicago, IL 60654",
                                city: "Chicago",
                                state: "IL",
                                phone: "+1 (312) 828-9800",
                                cuisineType: "Italian",
                                latitude: "41.8906",
                                longitude: "-87.6342",
                                ownerId: owner1.id,
                            })];
                    case 22:
                        restaurant7 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Al's Beef",
                                address: "1079 W Taylor St, Chicago, IL 60607",
                                city: "Chicago",
                                state: "IL",
                                phone: "+1 (312) 226-4017",
                                cuisineType: "American",
                                latitude: "41.8690",
                                longitude: "-87.6544",
                                ownerId: owner2.id,
                            })];
                    case 23:
                        restaurant8 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "The Original Ninfa's",
                                address: "2704 Navigation Blvd, Houston, TX 77003",
                                city: "Houston",
                                state: "TX",
                                phone: "+1 (713) 228-1175",
                                cuisineType: "Mexican",
                                latitude: "29.7469",
                                longitude: "-95.3352",
                                ownerId: owner3.id,
                            })];
                    case 24:
                        restaurant9 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Franklin Barbecue",
                                address: "900 E 11th St, Austin, TX 78702",
                                city: "Austin",
                                state: "TX",
                                phone: "+1 (512) 653-1187",
                                cuisineType: "BBQ",
                                latitude: "30.2669",
                                longitude: "-97.7318",
                                ownerId: owner4.id,
                            })];
                    case 25:
                        restaurant10 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Versailles Restaurant",
                                address: "3555 SW 8th St, Miami, FL 33135",
                                city: "Miami",
                                state: "FL",
                                phone: "+1 (305) 444-0240",
                                cuisineType: "Cuban",
                                latitude: "25.7654",
                                longitude: "-80.2534",
                                ownerId: owner5.id,
                            })];
                    case 26:
                        restaurant11 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Pike Place Chowder",
                                address: "1530 Post Alley, Seattle, WA 98101",
                                city: "Seattle",
                                state: "WA",
                                phone: "+1 (206) 267-2537",
                                cuisineType: "Seafood",
                                latitude: "47.6089",
                                longitude: "-122.3403",
                                ownerId: owner6.id,
                            })];
                    case 27:
                        restaurant12 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Louisiana Po-Boy Express",
                                address: "Mobile - Hammond & Ponchatoula area",
                                city: "Hammond",
                                state: "LA",
                                phone: "+1 (985) 662-7823",
                                cuisineType: "Cajun",
                                isFoodTruck: true,
                                latitude: "30.5123",
                                longitude: "-90.4567",
                                ownerId: owner1.id,
                            })];
                    case 28:
                        foodTruck1 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "The Halal Guys NYC",
                                address: "Mobile - Manhattan area",
                                city: "New York",
                                state: "NY",
                                phone: "+1 (347) 527-1505",
                                cuisineType: "Middle Eastern",
                                isFoodTruck: true,
                                latitude: "40.7589",
                                longitude: "-73.9851",
                                ownerId: owner2.id,
                            })];
                    case 29:
                        foodTruck2 = _x.sent();
                        return [4 /*yield*/, this.createRestaurant({
                                name: "Kogi BBQ Truck",
                                address: "Mobile - Los Angeles area",
                                city: "Los Angeles",
                                state: "CA",
                                phone: "+1 (323) 582-8889",
                                cuisineType: "Korean",
                                isFoodTruck: true,
                                latitude: "34.0522",
                                longitude: "-118.2437",
                                ownerId: owner3.id,
                            })];
                    case 30:
                        foodTruck3 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant1.id,
                                title: "Free Beignets with Coffee Purchase",
                                description: "Get 3 fresh, hot beignets absolutely free when you purchase any coffee or café au lait. Served with powdered sugar!",
                                dealType: "percentage",
                                discountValue: "100.00",
                                minOrderAmount: "3.50",
                                imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                startTime: "06:00",
                                endTime: "11:00",
                                totalUsesLimit: 200,
                                perCustomerLimit: 1,
                                isActive: true,
                            })];
                    case 31:
                        deal1 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant2.id,
                                title: "$5 Off Endless Shrimp",
                                description: "Save $5 on our famous Endless Shrimp special! Choose from over 30 different shrimp preparations.",
                                dealType: "fixed",
                                discountValue: "5.00",
                                minOrderAmount: "19.99",
                                imageUrl: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                                startTime: "15:00",
                                endTime: "21:00",
                                totalUsesLimit: 100,
                                perCustomerLimit: 1,
                                isActive: true,
                            })];
                    case 32:
                        deal2 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant3.id,
                                title: "Buy 1 Get 1 Half Off Pizza Slices",
                                description: "Get the second pizza slice at 50% off! Valid on our famous NYC-style thin crust slices.",
                                dealType: "percentage",
                                discountValue: "25.00",
                                minOrderAmount: "6.00",
                                imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                                startTime: "11:00",
                                endTime: "23:00",
                                totalUsesLimit: 150,
                                perCustomerLimit: 2,
                                isActive: true,
                            })];
                    case 33:
                        deal3 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant4.id,
                                title: "Free Pickle with Pastrami Sandwich",
                                description: "Get a complimentary full sour pickle with any pastrami sandwich order. A NYC classic!",
                                dealType: "percentage",
                                discountValue: "100.00",
                                minOrderAmount: "18.00",
                                imageUrl: "https://images.unsplash.com/photo-1567129937968-cdad8f07e2f8?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                                startTime: "08:00",
                                endTime: "22:00",
                                totalUsesLimit: 300,
                                perCustomerLimit: 1,
                                isActive: true,
                            })];
                    case 34:
                        deal4 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant5.id,
                                title: "Animal Style Fries Upgrade",
                                description: "Free upgrade to Animal Style fries with any Double-Double burger purchase!",
                                dealType: "fixed",
                                discountValue: "2.50",
                                minOrderAmount: "8.00",
                                imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                startTime: "10:30",
                                endTime: "01:00",
                                totalUsesLimit: 200,
                                perCustomerLimit: 1,
                                isActive: true,
                            })];
                    case 35:
                        deal5 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant6.id,
                                title: "Free Mole Tasting",
                                description: "Try our seven traditional moles with any entree order over $20. Discover authentic Oaxacan flavors!",
                                dealType: "percentage",
                                discountValue: "100.00",
                                minOrderAmount: "20.00",
                                imageUrl: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                                startTime: "17:00",
                                endTime: "22:00",
                                totalUsesLimit: 75,
                                perCustomerLimit: 1,
                                isActive: true,
                            })];
                    case 36:
                        deal6 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant7.id,
                                title: "20% Off Deep Dish Pizza",
                                description: "Save 20% on our famous Chicago deep dish pizza! Made with our signature buttery crust.",
                                dealType: "percentage",
                                discountValue: "20.00",
                                minOrderAmount: "25.00",
                                imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                startTime: "11:00",
                                endTime: "23:00",
                                totalUsesLimit: 100,
                                perCustomerLimit: 2,
                                isActive: true,
                            })];
                    case 37:
                        deal7 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant8.id,
                                title: "Free Hot Peppers with Italian Beef",
                                description: "Get a side of our spicy giardiniera hot peppers free with any Italian beef sandwich!",
                                dealType: "percentage",
                                discountValue: "100.00",
                                minOrderAmount: "12.00",
                                imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                                startTime: "10:00",
                                endTime: "22:00",
                                totalUsesLimit: 250,
                                perCustomerLimit: 1,
                                isActive: true,
                            })];
                    case 38:
                        deal8 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant9.id,
                                title: "Happy Hour Margaritas",
                                description: "$3 off our famous frozen margaritas during happy hour! Made with fresh lime juice.",
                                dealType: "fixed",
                                discountValue: "3.00",
                                minOrderAmount: "8.00",
                                imageUrl: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                                startTime: "15:00",
                                endTime: "18:00",
                                totalUsesLimit: 500,
                                perCustomerLimit: 2,
                                isActive: true,
                            })];
                    case 39:
                        deal9 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant10.id,
                                title: "Free Sauce with Brisket Plate",
                                description: "Choose a complimentary sauce (Espresso BBQ, Hot, or Regular) with any brisket plate order.",
                                dealType: "percentage",
                                discountValue: "100.00",
                                minOrderAmount: "16.00",
                                imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                startTime: "11:00",
                                endTime: "21:00",
                                totalUsesLimit: 200,
                                perCustomerLimit: 1,
                                isActive: true,
                            })];
                    case 40:
                        deal10 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant11.id,
                                title: "Free Cuban Coffee with Breakfast",
                                description: "Complimentary café cubano with any breakfast order before 11 AM.",
                                dealType: "percentage",
                                discountValue: "100.00",
                                minOrderAmount: "12.00",
                                imageUrl: "https://images.unsplash.com/photo-1512481844049-fce44975de78?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                startTime: "07:00",
                                endTime: "11:00",
                                totalUsesLimit: 150,
                                perCustomerLimit: 1,
                                isActive: true,
                            })];
                    case 41:
                        deal11 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: restaurant12.id,
                                title: "25% Off Clam Chowder Friday",
                                description: "Every Friday, save 25% on our award-winning New England clam chowder!",
                                dealType: "percentage",
                                discountValue: "25.00",
                                minOrderAmount: "8.00",
                                imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                                startTime: "11:00",
                                endTime: "21:00",
                                totalUsesLimit: 100,
                                perCustomerLimit: 1,
                                isActive: true,
                            })];
                    case 42:
                        deal12 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: foodTruck1.id,
                                title: "Buy 2 Po-Boys, Get 1 Free",
                                description: "Purchase any two po-boys and get a third one free! Choose from our authentic New Orleans-style shrimp, oyster, or roast beef po-boys.",
                                dealType: "percentage",
                                discountValue: "33.00",
                                minOrderAmount: "16.00",
                                imageUrl: "https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                                startTime: "11:00",
                                endTime: "19:00",
                                totalUsesLimit: 75,
                                perCustomerLimit: 1,
                                isActive: true,
                            })];
                    case 43:
                        deal13 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: foodTruck2.id,
                                title: "Free White Sauce with Combo",
                                description: "Get our famous white sauce free with any combo platter! The secret recipe that made us famous.",
                                dealType: "percentage",
                                discountValue: "100.00",
                                minOrderAmount: "10.00",
                                imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                startTime: "11:00",
                                endTime: "23:00",
                                totalUsesLimit: 200,
                                perCustomerLimit: 1,
                                isActive: true,
                            })];
                    case 44:
                        deal14 = _x.sent();
                        return [4 /*yield*/, this.createDeal({
                                restaurantId: foodTruck3.id,
                                title: "$2 Off Korean BBQ Tacos",
                                description: "Save $2 on our fusion Korean BBQ tacos! Marinated bulgogi with Korean spices in warm tortillas.",
                                dealType: "fixed",
                                discountValue: "2.00",
                                minOrderAmount: "8.00",
                                imageUrl: "https://images.unsplash.com/photo-1565299585323-38174c4a6303?w=500",
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                                startTime: "11:30",
                                endTime: "22:00",
                                totalUsesLimit: 100,
                                perCustomerLimit: 2,
                                isActive: true,
                            })];
                    case 45:
                        deal15 = _x.sent();
                        // Create sample reviews across different cities
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant1.id,
                                rating: 5,
                                comment: "Best beignets in Hammond! Just like being in New Orleans. The coffee is strong and perfect with the powdered sugar treats.",
                            })];
                    case 46:
                        // Create sample reviews across different cities
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant2.id,
                                rating: 4,
                                comment: "Great seafood as always! The endless shrimp deal is amazing - so many varieties to try. Service was quick and friendly.",
                            })];
                    case 47:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant3.id,
                                rating: 5,
                                comment: "Authentic NYC pizza! Thin crust perfection. The deal makes it even better - great value in the city.",
                            })];
                    case 48:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant4.id,
                                rating: 5,
                                comment: "Iconic NYC deli! The pastrami sandwich is legendary. Worth the wait and every penny. A true New York experience.",
                            })];
                    case 49:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant5.id,
                                rating: 4,
                                comment: "Classic LA burger joint! Fresh ingredients and the Animal Style fries are addictive. Great California vibes.",
                            })];
                    case 50:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant6.id,
                                rating: 5,
                                comment: "Incredible authentic Oaxacan food! The mole varieties are amazing. Each one tells a story of traditional flavors.",
                            })];
                    case 51:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant7.id,
                                rating: 5,
                                comment: "Best deep dish in Chicago! The crust is buttery perfection and loaded with cheese. A Chicago must-have!",
                            })];
                    case 52:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant8.id,
                                rating: 4,
                                comment: "True Chicago Italian beef! Messy but delicious. The juice and hot peppers make it perfect. Pure Chicago tradition.",
                            })];
                    case 53:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant9.id,
                                rating: 4,
                                comment: "Great Tex-Mex in Houston! The margaritas are strong and the fajitas sizzle. Happy hour deals are fantastic.",
                            })];
                    case 54:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant10.id,
                                rating: 5,
                                comment: "BBQ perfection in Austin! The brisket melts in your mouth. Worth the line - Texas BBQ at its finest.",
                            })];
                    case 55:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant11.id,
                                rating: 4,
                                comment: "Authentic Cuban food in Miami! The café cubano is perfect and the breakfast is hearty. Real Cuban flavors.",
                            })];
                    case 56:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: restaurant12.id,
                                rating: 5,
                                comment: "Amazing chowder in Seattle! Creamy, rich, and full of fresh clams. Perfect for the Pacific Northwest weather.",
                            })];
                    case 57:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: foodTruck1.id,
                                rating: 5,
                                comment: "Best po-boys outside of New Orleans! The shrimp po-boy is massive and perfectly seasoned. Worth finding wherever they are!",
                            })];
                    case 58:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: foodTruck2.id,
                                rating: 5,
                                comment: "NYC street food legend! The white sauce is incredible and the chicken is perfectly seasoned. Late night favorite!",
                            })];
                    case 59:
                        _x.sent();
                        return [4 /*yield*/, this.createReview({
                                userId: customer1.id,
                                restaurantId: foodTruck3.id,
                                rating: 4,
                                comment: "Fusion done right in LA! Korean BBQ tacos are unique and delicious. Great mix of flavors and cultures.",
                            })];
                    case 60:
                        _x.sent();
                        // Start food truck sessions for demo
                        return [4 /*yield*/, this.startTruckSession(foodTruck1.id, "demo-device-123", owner1.id)];
                    case 61:
                        // Start food truck sessions for demo
                        _x.sent();
                        return [4 /*yield*/, this.startTruckSession(foodTruck2.id, "demo-device-456", owner2.id)];
                    case 62:
                        _x.sent();
                        return [4 /*yield*/, this.startTruckSession(foodTruck3.id, "demo-device-789", owner3.id)];
                    case 63:
                        _x.sent();
                        console.log("✅ Development seed data created successfully");
                        console.log("📊 Created:");
                        console.log("   - 6 restaurant owners (password: password123)");
                        console.log("   - 1 customer (customer@example.com, password: password123)");
                        console.log("   - 15 restaurants across 8+ US cities (Hammond, NYC, LA, Chicago, Houston, Austin, Miami, Seattle)");
                        console.log("   - 3 food trucks in different cities");
                        console.log("   - 15 diverse deals with regional cuisine specialties");
                        console.log("   - 15 authentic location-specific reviews");
                        console.log("   - 3 active food truck sessions");
                        return [3 /*break*/, 65];
                    case 64:
                        error_4 = _x.sent();
                        console.error("❌ Failed to seed development data:", error_4);
                        return [3 /*break*/, 65];
                    case 65: return [2 /*return*/];
                }
            });
        });
    };
    // Verification operations
    DatabaseStorage.prototype.createVerificationRequest = function (verificationRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var newRequest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(verificationRequests)
                            .values(verificationRequest)
                            .returning()];
                    case 1:
                        newRequest = (_a.sent())[0];
                        return [2 /*return*/, newRequest];
                }
            });
        });
    };
    DatabaseStorage.prototype.getVerificationRequestsByOwner = function (ownerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            id: verificationRequests.id,
                            restaurantId: verificationRequests.restaurantId,
                            status: verificationRequests.status,
                            documents: verificationRequests.documents,
                            submittedAt: verificationRequests.submittedAt,
                            reviewedAt: verificationRequests.reviewedAt,
                            reviewerId: verificationRequests.reviewerId,
                            rejectionReason: verificationRequests.rejectionReason,
                            createdAt: verificationRequests.createdAt,
                            updatedAt: verificationRequests.updatedAt,
                        })
                            .from(verificationRequests)
                            .innerJoin(restaurants, eq(verificationRequests.restaurantId, restaurants.id))
                            .where(eq(restaurants.ownerId, ownerId))
                            .orderBy(desc(verificationRequests.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getVerificationRequests = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            id: verificationRequests.id,
                            restaurantId: verificationRequests.restaurantId,
                            status: verificationRequests.status,
                            documents: verificationRequests.documents,
                            submittedAt: verificationRequests.submittedAt,
                            reviewedAt: verificationRequests.reviewedAt,
                            reviewerId: verificationRequests.reviewerId,
                            rejectionReason: verificationRequests.rejectionReason,
                            createdAt: verificationRequests.createdAt,
                            updatedAt: verificationRequests.updatedAt,
                            restaurant: {
                                id: restaurants.id,
                                name: restaurants.name,
                                address: restaurants.address,
                                ownerId: restaurants.ownerId,
                            },
                        })
                            .from(verificationRequests)
                            .innerJoin(restaurants, eq(verificationRequests.restaurantId, restaurants.id))
                            .orderBy(desc(verificationRequests.submittedAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.approveVerificationRequest = function (id, reviewerId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Start transaction to update both tables
                    return [4 /*yield*/, db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var request;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx
                                            .update(verificationRequests)
                                            .set({
                                            status: "approved",
                                            reviewedAt: new Date(),
                                            reviewerId: reviewerId,
                                            updatedAt: new Date(),
                                        })
                                            .where(eq(verificationRequests.id, id))
                                            .returning()];
                                    case 1:
                                        request = (_a.sent())[0];
                                        if (!request) {
                                            throw new Error("Verification request not found");
                                        }
                                        // Set restaurant as verified
                                        return [4 /*yield*/, tx
                                                .update(restaurants)
                                                .set({
                                                isVerified: true,
                                                updatedAt: new Date(),
                                            })
                                                .where(eq(restaurants.id, request.restaurantId))];
                                    case 2:
                                        // Set restaurant as verified
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        // Start transaction to update both tables
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.rejectVerificationRequest = function (id, reviewerId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Start transaction to update both tables atomically
                    return [4 /*yield*/, db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var request;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx
                                            .update(verificationRequests)
                                            .set({
                                            status: "rejected",
                                            reviewedAt: new Date(),
                                            reviewerId: reviewerId,
                                            rejectionReason: reason,
                                            updatedAt: new Date(),
                                        })
                                            .where(eq(verificationRequests.id, id))
                                            .returning()];
                                    case 1:
                                        request = (_a.sent())[0];
                                        if (!request) {
                                            throw new Error("Verification request not found");
                                        }
                                        // Ensure restaurant remains unverified on rejection
                                        return [4 /*yield*/, tx
                                                .update(restaurants)
                                                .set({
                                                isVerified: false,
                                                updatedAt: new Date(),
                                            })
                                                .where(eq(restaurants.id, request.restaurantId))];
                                    case 2:
                                        // Ensure restaurant remains unverified on rejection
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        // Start transaction to update both tables atomically
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.setRestaurantVerified = function (restaurantId, isVerified) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(restaurants)
                            .set({
                            isVerified: isVerified,
                            updatedAt: new Date(),
                        })
                            .where(eq(restaurants.id, restaurantId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.hasPendingVerificationRequest = function (restaurantId) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(verificationRequests)
                            .where(and(eq(verificationRequests.restaurantId, restaurantId), eq(verificationRequests.status, "pending")))
                            .limit(1)];
                    case 1:
                        request = (_a.sent())[0];
                        return [2 /*return*/, !!request];
                }
            });
        });
    };
    // Deal view tracking operations
    DatabaseStorage.prototype.recordDealView = function (view) {
        return __awaiter(this, void 0, void 0, function () {
            var newView;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.insert(dealViews).values(view).returning()];
                    case 1:
                        newView = (_a.sent())[0];
                        return [2 /*return*/, newView];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDealViewsCount = function (dealId, dateRange) {
        return __awaiter(this, void 0, void 0, function () {
            var conditions, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conditions = [eq(dealViews.dealId, dealId)];
                        if (dateRange) {
                            conditions.push(gte(dealViews.viewedAt, dateRange.start));
                            conditions.push(lte(dealViews.viewedAt, dateRange.end));
                        }
                        return [4 /*yield*/, db
                                .select({ count: sql(templateObject_23 || (templateObject_23 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(dealViews)
                                .where(and.apply(void 0, conditions))];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result.count];
                }
            });
        });
    };
    DatabaseStorage.prototype.hasRecentDealView = function (dealId_1, userId_1, sessionId_1) {
        return __awaiter(this, arguments, void 0, function (dealId, userId, sessionId, timeWindowMs) {
            var cutoffTime, conditions, result;
            if (timeWindowMs === void 0) { timeWindowMs = 3600000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cutoffTime = new Date(Date.now() - timeWindowMs);
                        conditions = [
                            eq(dealViews.dealId, dealId),
                            gte(dealViews.viewedAt, cutoffTime),
                        ];
                        // Check for either userId OR sessionId to handle both logged-in and anonymous users
                        if (userId) {
                            conditions.push(eq(dealViews.userId, userId));
                        }
                        else if (sessionId) {
                            conditions.push(eq(dealViews.sessionId, sessionId));
                        }
                        else {
                            // If no identity provided, can't rate limit properly - allow the view
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, db
                                .select({ count: sql(templateObject_24 || (templateObject_24 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(dealViews)
                                .where(and.apply(void 0, conditions))
                                .limit(1)];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result.count > 0];
                }
            });
        });
    };
    // Deal claim revenue operations
    DatabaseStorage.prototype.markClaimAsUsed = function (claimId, orderAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var claim;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(dealClaims)
                            .set({
                            isUsed: true,
                            usedAt: new Date(),
                            orderAmount: orderAmount == null ? null : orderAmount.toString(),
                        })
                            .where(and(eq(dealClaims.id, claimId), eq(dealClaims.isUsed, false)))
                            .returning()];
                    case 1:
                        claim = (_a.sent())[0];
                        return [2 /*return*/, claim || null];
                }
            });
        });
    };
    DatabaseStorage.prototype.verifyRestaurantOwnershipByClaim = function (claimId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({ ownerId: restaurants.ownerId })
                            .from(dealClaims)
                            .innerJoin(deals, eq(dealClaims.dealId, deals.id))
                            .innerJoin(restaurants, eq(deals.restaurantId, restaurants.id))
                            .where(eq(dealClaims.id, claimId))
                            .limit(1)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.length > 0 && result[0].ownerId === userId];
                }
            });
        });
    };
    // Advanced analytics operations
    DatabaseStorage.prototype.getRestaurantAnalyticsSummary = function (restaurantId, dateRange) {
        return __awaiter(this, void 0, void 0, function () {
            var dealIds, dealIdArray, viewConditions, claimConditions, viewsResult, claimsResult, totalViews, totalClaims, totalRevenue, conversionRate, topDeals;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({ id: deals.id })
                            .from(deals)
                            .where(eq(deals.restaurantId, restaurantId))];
                    case 1:
                        dealIds = _a.sent();
                        dealIdArray = dealIds.map(function (d) { return d.id; });
                        if (dealIdArray.length === 0) {
                            return [2 /*return*/, {
                                    totalViews: 0,
                                    totalClaims: 0,
                                    totalRevenue: 0,
                                    conversionRate: 0,
                                    topDeals: [],
                                }];
                        }
                        viewConditions = [inArray(dealViews.dealId, dealIdArray)];
                        claimConditions = [inArray(dealClaims.dealId, dealIdArray)];
                        if (dateRange) {
                            viewConditions.push(gte(dealViews.viewedAt, dateRange.start));
                            viewConditions.push(lte(dealViews.viewedAt, dateRange.end));
                            claimConditions.push(gte(dealClaims.claimedAt, dateRange.start));
                            claimConditions.push(lte(dealClaims.claimedAt, dateRange.end));
                        }
                        return [4 /*yield*/, db
                                .select({ count: sql(templateObject_25 || (templateObject_25 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                                .from(dealViews)
                                .where(and.apply(void 0, viewConditions))];
                    case 2:
                        viewsResult = (_a.sent())[0];
                        return [4 /*yield*/, db
                                .select({
                                count: sql(templateObject_26 || (templateObject_26 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                                revenue: sql(templateObject_27 || (templateObject_27 = __makeTemplateObject(["coalesce(sum(cast(order_amount as decimal)), 0)"], ["coalesce(sum(cast(order_amount as decimal)), 0)"]))),
                            })
                                .from(dealClaims)
                                .where(and.apply(void 0, __spreadArray(__spreadArray([], claimConditions, false), [eq(dealClaims.isUsed, true)], false)))];
                    case 3:
                        claimsResult = (_a.sent())[0];
                        totalViews = viewsResult.count || 0;
                        totalClaims = claimsResult.count || 0;
                        totalRevenue = claimsResult.revenue || 0;
                        conversionRate = totalViews > 0 ? (totalClaims / totalViews) * 100 : 0;
                        return [4 /*yield*/, db
                                .select({
                                dealId: deals.id,
                                title: deals.title,
                                views: sql(templateObject_28 || (templateObject_28 = __makeTemplateObject(["count(distinct ", ")"], ["count(distinct ", ")"])), dealViews.id),
                                claims: sql(templateObject_29 || (templateObject_29 = __makeTemplateObject(["count(distinct ", ")"], ["count(distinct ", ")"])), dealClaims.id),
                                revenue: sql(templateObject_30 || (templateObject_30 = __makeTemplateObject(["coalesce(sum(cast(", " as decimal)), 0)"], ["coalesce(sum(cast(", " as decimal)), 0)"])), dealClaims.orderAmount),
                            })
                                .from(deals)
                                .leftJoin(dealViews, eq(deals.id, dealViews.dealId))
                                .leftJoin(dealClaims, and(eq(deals.id, dealClaims.dealId), eq(dealClaims.isUsed, true)))
                                .where(eq(deals.restaurantId, restaurantId))
                                .groupBy(deals.id, deals.title)
                                .orderBy(desc(sql(templateObject_31 || (templateObject_31 = __makeTemplateObject(["count(distinct ", ")"], ["count(distinct ", ")"])), dealViews.id)))
                                .limit(5)];
                    case 4:
                        topDeals = _a.sent();
                        return [2 /*return*/, {
                                totalViews: totalViews,
                                totalClaims: totalClaims,
                                totalRevenue: totalRevenue,
                                conversionRate: conversionRate,
                                topDeals: topDeals,
                            }];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRestaurantAnalyticsTimeseries = function (restaurantId, dateRange, interval) {
        return __awaiter(this, void 0, void 0, function () {
            var dealIds, dealIdArray, dateFormat, timeseries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({ id: deals.id })
                            .from(deals)
                            .where(eq(deals.restaurantId, restaurantId))];
                    case 1:
                        dealIds = _a.sent();
                        dealIdArray = dealIds.map(function (d) { return d.id; });
                        if (dealIdArray.length === 0) {
                            return [2 /*return*/, []];
                        }
                        dateFormat = interval === "day" ? "YYYY-MM-DD" : 'YYYY-"W"WW';
                        return [4 /*yield*/, db
                                .select({
                                date: sql(templateObject_32 || (templateObject_32 = __makeTemplateObject(["to_char(", ", '", "')"], ["to_char(", ", '", "')"])), dealViews.viewedAt, dateFormat),
                                views: sql(templateObject_33 || (templateObject_33 = __makeTemplateObject(["count(distinct ", ")"], ["count(distinct ", ")"])), dealViews.id),
                                claims: sql(templateObject_34 || (templateObject_34 = __makeTemplateObject(["count(distinct ", ")"], ["count(distinct ", ")"])), dealClaims.id),
                                revenue: sql(templateObject_35 || (templateObject_35 = __makeTemplateObject(["coalesce(sum(cast(", " as decimal)), 0)"], ["coalesce(sum(cast(", " as decimal)), 0)"])), dealClaims.orderAmount),
                            })
                                .from(dealViews)
                                .leftJoin(dealClaims, and(eq(dealViews.dealId, dealClaims.dealId), eq(dealClaims.isUsed, true), gte(dealClaims.claimedAt, dateRange.start), lte(dealClaims.claimedAt, dateRange.end)))
                                .where(and(inArray(dealViews.dealId, dealIdArray), gte(dealViews.viewedAt, dateRange.start), lte(dealViews.viewedAt, dateRange.end)))
                                .groupBy(sql(templateObject_36 || (templateObject_36 = __makeTemplateObject(["to_char(", ", '", "')"], ["to_char(", ", '", "')"])), dealViews.viewedAt, dateFormat))
                                .orderBy(sql(templateObject_37 || (templateObject_37 = __makeTemplateObject(["to_char(", ", '", "')"], ["to_char(", ", '", "')"])), dealViews.viewedAt, dateFormat))];
                    case 2:
                        timeseries = _a.sent();
                        return [2 /*return*/, timeseries];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRestaurantCustomerInsights = function (restaurantId, dateRange) {
        return __awaiter(this, void 0, void 0, function () {
            var dealIds, dealIdArray, conditions, repeatResult, avgResult, peakHours, ageGroups, genderBreakdown;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({ id: deals.id })
                            .from(deals)
                            .where(eq(deals.restaurantId, restaurantId))];
                    case 1:
                        dealIds = _a.sent();
                        dealIdArray = dealIds.map(function (d) { return d.id; });
                        if (dealIdArray.length === 0) {
                            return [2 /*return*/, {
                                    repeatCustomers: 0,
                                    averageOrderValue: 0,
                                    peakHours: [],
                                    demographics: {
                                        ageGroups: [],
                                        genderBreakdown: [],
                                    },
                                }];
                        }
                        conditions = [
                            inArray(dealClaims.dealId, dealIdArray),
                            eq(dealClaims.isUsed, true),
                        ];
                        if (dateRange) {
                            conditions.push(gte(dealClaims.usedAt, dateRange.start));
                            conditions.push(lte(dealClaims.usedAt, dateRange.end));
                        }
                        return [4 /*yield*/, db.select({
                                count: sql(templateObject_38 || (templateObject_38 = __makeTemplateObject(["count(distinct user_id) filter (where claim_count > 1)"], ["count(distinct user_id) filter (where claim_count > 1)"]))),
                            }).from(sql(templateObject_39 || (templateObject_39 = __makeTemplateObject(["(\n        select user_id, count(*) as claim_count\n        from ", "\n        where ", "\n        group by user_id\n      ) as user_claims"], ["(\n        select user_id, count(*) as claim_count\n        from ", "\n        where ", "\n        group by user_id\n      ) as user_claims"])), dealClaims, and.apply(void 0, conditions)))];
                    case 2:
                        repeatResult = (_a.sent())[0];
                        return [4 /*yield*/, db
                                .select({
                                avg: sql(templateObject_40 || (templateObject_40 = __makeTemplateObject(["avg(cast(order_amount as decimal))"], ["avg(cast(order_amount as decimal))"]))),
                            })
                                .from(dealClaims)
                                .where(and.apply(void 0, conditions))];
                    case 3:
                        avgResult = (_a.sent())[0];
                        return [4 /*yield*/, db
                                .select({
                                hour: sql(templateObject_41 || (templateObject_41 = __makeTemplateObject(["extract(hour from used_at)"], ["extract(hour from used_at)"]))),
                                count: sql(templateObject_42 || (templateObject_42 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                            })
                                .from(dealClaims)
                                .where(and.apply(void 0, conditions))
                                .groupBy(sql(templateObject_43 || (templateObject_43 = __makeTemplateObject(["extract(hour from used_at)"], ["extract(hour from used_at)"]))))
                                .orderBy(desc(sql(templateObject_44 || (templateObject_44 = __makeTemplateObject(["count(*)"], ["count(*)"])))))
                                .limit(5)];
                    case 4:
                        peakHours = _a.sent();
                        return [4 /*yield*/, db
                                .select({
                                range: sql(templateObject_45 || (templateObject_45 = __makeTemplateObject(["\n          case\n            when extract(year from now()) - birth_year < 25 then '18-24'\n            when extract(year from now()) - birth_year < 35 then '25-34'\n            when extract(year from now()) - birth_year < 45 then '35-44'\n            when extract(year from now()) - birth_year < 55 then '45-54'\n            when extract(year from now()) - birth_year >= 55 then '55+'\n            else 'Unknown'\n          end\n        "], ["\n          case\n            when extract(year from now()) - birth_year < 25 then '18-24'\n            when extract(year from now()) - birth_year < 35 then '25-34'\n            when extract(year from now()) - birth_year < 45 then '35-44'\n            when extract(year from now()) - birth_year < 55 then '45-54'\n            when extract(year from now()) - birth_year >= 55 then '55+'\n            else 'Unknown'\n          end\n        "]))),
                                count: sql(templateObject_46 || (templateObject_46 = __makeTemplateObject(["count(distinct ", ")"], ["count(distinct ", ")"])), users.id),
                            })
                                .from(dealClaims)
                                .innerJoin(users, eq(dealClaims.userId, users.id))
                                .where(and.apply(void 0, conditions)).groupBy(sql(templateObject_47 || (templateObject_47 = __makeTemplateObject(["\n        case\n          when extract(year from now()) - birth_year < 25 then '18-24'\n          when extract(year from now()) - birth_year < 35 then '25-34'\n          when extract(year from now()) - birth_year < 45 then '35-44'\n          when extract(year from now()) - birth_year < 55 then '45-54'\n          when extract(year from now()) - birth_year >= 55 then '55+'\n          else 'Unknown'\n        end\n      "], ["\n        case\n          when extract(year from now()) - birth_year < 25 then '18-24'\n          when extract(year from now()) - birth_year < 35 then '25-34'\n          when extract(year from now()) - birth_year < 45 then '35-44'\n          when extract(year from now()) - birth_year < 55 then '45-54'\n          when extract(year from now()) - birth_year >= 55 then '55+'\n          else 'Unknown'\n        end\n      "]))))];
                    case 5:
                        ageGroups = _a.sent();
                        return [4 /*yield*/, db
                                .select({
                                gender: sql(templateObject_48 || (templateObject_48 = __makeTemplateObject(["coalesce(gender, 'Unknown')"], ["coalesce(gender, 'Unknown')"]))),
                                count: sql(templateObject_49 || (templateObject_49 = __makeTemplateObject(["count(distinct ", ")"], ["count(distinct ", ")"])), users.id),
                            })
                                .from(dealClaims)
                                .innerJoin(users, eq(dealClaims.userId, users.id))
                                .where(and.apply(void 0, conditions))
                                .groupBy(users.gender)];
                    case 6:
                        genderBreakdown = _a.sent();
                        return [2 /*return*/, {
                                repeatCustomers: repeatResult.count || 0,
                                averageOrderValue: avgResult.avg || 0,
                                peakHours: peakHours,
                                demographics: {
                                    ageGroups: ageGroups,
                                    genderBreakdown: genderBreakdown,
                                },
                            }];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRestaurantAnalyticsExport = function (restaurantId, dateRange) {
        return __awaiter(this, void 0, void 0, function () {
            var exportData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            dealTitle: deals.title,
                            date: sql(templateObject_50 || (templateObject_50 = __makeTemplateObject(["to_char(", ", 'YYYY-MM-DD')"], ["to_char(", ", 'YYYY-MM-DD')"])), dealViews.viewedAt),
                            views: sql(templateObject_51 || (templateObject_51 = __makeTemplateObject(["count(distinct ", ")"], ["count(distinct ", ")"])), dealViews.id),
                            claims: sql(templateObject_52 || (templateObject_52 = __makeTemplateObject(["count(distinct ", ")"], ["count(distinct ", ")"])), dealClaims.id),
                            revenue: sql(templateObject_53 || (templateObject_53 = __makeTemplateObject(["coalesce(sum(cast(", " as decimal)), 0)"], ["coalesce(sum(cast(", " as decimal)), 0)"])), dealClaims.orderAmount),
                        })
                            .from(deals)
                            .leftJoin(dealViews, and(eq(deals.id, dealViews.dealId), gte(dealViews.viewedAt, dateRange.start), lte(dealViews.viewedAt, dateRange.end)))
                            .leftJoin(dealClaims, and(eq(deals.id, dealClaims.dealId), eq(dealClaims.isUsed, true), gte(dealClaims.usedAt, dateRange.start), lte(dealClaims.usedAt, dateRange.end)))
                            .where(eq(deals.restaurantId, restaurantId))
                            .groupBy(deals.id, deals.title, sql(templateObject_54 || (templateObject_54 = __makeTemplateObject(["to_char(", ", 'YYYY-MM-DD')"], ["to_char(", ", 'YYYY-MM-DD')"])), dealViews.viewedAt))
                            .orderBy(deals.title, sql(templateObject_55 || (templateObject_55 = __makeTemplateObject(["to_char(", ", 'YYYY-MM-DD')"], ["to_char(", ", 'YYYY-MM-DD')"])), dealViews.viewedAt))];
                    case 1:
                        exportData = _a.sent();
                        return [2 /*return*/, exportData];
                }
            });
        });
    };
    // Food truck operations
    DatabaseStorage.prototype.setRestaurantMobileSettings = function (restaurantId, settings) {
        return __awaiter(this, void 0, void 0, function () {
            var restaurant;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(restaurants)
                            .set(__assign(__assign({}, settings), { updatedAt: new Date() }))
                            .where(eq(restaurants.id, restaurantId))
                            .returning()];
                    case 1:
                        restaurant = (_a.sent())[0];
                        return [2 /*return*/, restaurant];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateRestaurantLocation = function (restaurantId, location) {
        return __awaiter(this, void 0, void 0, function () {
            var updateData, restaurant;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updateData = {
                            currentLatitude: location.latitude.toString(),
                            currentLongitude: location.longitude.toString(),
                            lastBroadcastAt: new Date(),
                            updatedAt: new Date(),
                        };
                        if (location.mobileOnline !== undefined) {
                            updateData.mobileOnline = location.mobileOnline;
                        }
                        if (location.city) {
                            updateData.city = location.city;
                        }
                        if (location.state) {
                            updateData.state = location.state;
                        }
                        return [4 /*yield*/, db
                                .update(restaurants)
                                .set(updateData)
                                .where(eq(restaurants.id, restaurantId))
                                .returning()];
                    case 1:
                        restaurant = (_a.sent())[0];
                        return [2 /*return*/, restaurant];
                }
            });
        });
    };
    DatabaseStorage.prototype.setRestaurantOperatingHours = function (restaurantId, operatingHours) {
        return __awaiter(this, void 0, void 0, function () {
            var restaurant;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(restaurants)
                            .set({
                            operatingHours: operatingHours, // JSONB field
                            updatedAt: new Date(),
                        })
                            .where(eq(restaurants.id, restaurantId))
                            .returning()];
                    case 1:
                        restaurant = (_a.sent())[0];
                        return [2 /*return*/, restaurant];
                }
            });
        });
    };
    DatabaseStorage.prototype.isRestaurantOpenNow = function (restaurantId) {
        return __awaiter(this, void 0, void 0, function () {
            var restaurant, now, currentDay, currentTime, todayHours, _i, todayHours_1, timeSlot, _a, openHours, openMinutes, _b, closeHours, closeMinutes, openTime, closeTime;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.getRestaurant(restaurantId)];
                    case 1:
                        restaurant = _d.sent();
                        if (!restaurant || !restaurant.operatingHours) {
                            return [2 /*return*/, true]; // Default to open if no hours set
                        }
                        now = new Date();
                        currentDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()];
                        currentTime = now.getHours() * 60 + now.getMinutes();
                        todayHours = (_c = restaurant.operatingHours) === null || _c === void 0 ? void 0 : _c[currentDay];
                        if (!todayHours || !Array.isArray(todayHours) || todayHours.length === 0) {
                            return [2 /*return*/, false]; // Closed if no hours for today
                        }
                        // Check if current time falls within any of today's time slots
                        for (_i = 0, todayHours_1 = todayHours; _i < todayHours_1.length; _i++) {
                            timeSlot = todayHours_1[_i];
                            _a = timeSlot.open.split(":").map(Number), openHours = _a[0], openMinutes = _a[1];
                            _b = timeSlot.close.split(":").map(Number), closeHours = _b[0], closeMinutes = _b[1];
                            openTime = openHours * 60 + openMinutes;
                            closeTime = closeHours * 60 + closeMinutes;
                            // Handle overnight hours (close time is next day)
                            if (closeTime < openTime) {
                                // Overnight hours: open until midnight OR after midnight until close
                                if (currentTime >= openTime || currentTime < closeTime) {
                                    return [2 /*return*/, true];
                                }
                            }
                            else {
                                // Regular hours: within the same day
                                if (currentTime >= openTime && currentTime < closeTime) {
                                    return [2 /*return*/, true];
                                }
                            }
                        }
                        return [2 /*return*/, false]; // Not within any time slot
                }
            });
        });
    };
    // Helper method to filter deals by restaurant operating hours
    DatabaseStorage.prototype.filterDealsByOperatingHours = function (deals) {
        return __awaiter(this, void 0, void 0, function () {
            var restaurantIds, restaurantsWithHours, restaurantHoursMap, now, currentDay, currentTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (deals.length === 0)
                            return [2 /*return*/, deals];
                        restaurantIds = Array.from(new Set(deals.map(function (deal) { return deal.restaurantId; }))).filter(function (id) { return id != null; });
                        // Return early if no valid restaurant IDs
                        if (restaurantIds.length === 0)
                            return [2 /*return*/, deals];
                        return [4 /*yield*/, db
                                .select({
                                id: restaurants.id,
                                operatingHours: restaurants.operatingHours,
                            })
                                .from(restaurants)
                                .where(inArray(restaurants.id, restaurantIds))];
                    case 1:
                        restaurantsWithHours = _a.sent();
                        restaurantHoursMap = new Map(restaurantsWithHours.map(function (r) { return [r.id, r.operatingHours]; }));
                        now = new Date();
                        currentDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()];
                        currentTime = now.getHours() * 60 + now.getMinutes();
                        return [2 /*return*/, deals.filter(function (deal) {
                                var operatingHours = restaurantHoursMap.get(deal.restaurantId);
                                // Default to open if no hours set
                                if (!operatingHours)
                                    return true;
                                var todayHours = operatingHours === null || operatingHours === void 0 ? void 0 : operatingHours[currentDay];
                                if (!todayHours ||
                                    !Array.isArray(todayHours) ||
                                    todayHours.length === 0) {
                                    return false; // Closed if no hours for today
                                }
                                // Check if current time falls within any of today's time slots
                                for (var _i = 0, todayHours_2 = todayHours; _i < todayHours_2.length; _i++) {
                                    var timeSlot = todayHours_2[_i];
                                    var _a = timeSlot.open.split(":").map(Number), openHours = _a[0], openMinutes = _a[1];
                                    var _b = timeSlot.close
                                        .split(":")
                                        .map(Number), closeHours = _b[0], closeMinutes = _b[1];
                                    var openTime = openHours * 60 + openMinutes;
                                    var closeTime = closeHours * 60 + closeMinutes;
                                    // Handle overnight hours (close time is next day)
                                    if (closeTime < openTime) {
                                        if (currentTime >= openTime || currentTime < closeTime) {
                                            return true;
                                        }
                                    }
                                    else {
                                        // Regular hours: within the same day
                                        if (currentTime >= openTime && currentTime < closeTime) {
                                            return true;
                                        }
                                    }
                                }
                                return false; // Not within any time slot
                            })];
                }
            });
        });
    };
    DatabaseStorage.prototype.startTruckSession = function (restaurantId, deviceId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // End any existing active session first
                    return [4 /*yield*/, db
                            .update(foodTruckSessions)
                            .set({
                            isActive: false,
                            endedAt: new Date(),
                        })
                            .where(and(eq(foodTruckSessions.restaurantId, restaurantId), eq(foodTruckSessions.isActive, true)))];
                    case 1:
                        // End any existing active session first
                        _a.sent();
                        return [4 /*yield*/, db
                                .insert(foodTruckSessions)
                                .values({
                                restaurantId: restaurantId,
                                deviceId: deviceId,
                                startedByUserId: userId,
                            })
                                .returning()];
                    case 2:
                        session = (_a.sent())[0];
                        // Update restaurant mobile status
                        return [4 /*yield*/, db
                                .update(restaurants)
                                .set({
                                mobileOnline: true,
                                lastBroadcastAt: new Date(),
                                updatedAt: new Date(),
                            })
                                .where(eq(restaurants.id, restaurantId))];
                    case 3:
                        // Update restaurant mobile status
                        _a.sent();
                        return [2 /*return*/, session];
                }
            });
        });
    };
    DatabaseStorage.prototype.endTruckSession = function (restaurantId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(foodTruckSessions)
                            .set({
                            isActive: false,
                            endedAt: new Date(),
                        })
                            .where(and(eq(foodTruckSessions.restaurantId, restaurantId), eq(foodTruckSessions.startedByUserId, userId), eq(foodTruckSessions.isActive, true)))];
                    case 1:
                        _a.sent();
                        // Update restaurant mobile status
                        return [4 /*yield*/, db
                                .update(restaurants)
                                .set({
                                mobileOnline: false,
                                updatedAt: new Date(),
                            })
                                .where(eq(restaurants.id, restaurantId))];
                    case 2:
                        // Update restaurant mobile status
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getActiveTruckSession = function (restaurantId) {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(foodTruckSessions)
                            .where(and(eq(foodTruckSessions.restaurantId, restaurantId), eq(foodTruckSessions.isActive, true)))
                            .orderBy(desc(foodTruckSessions.startedAt))
                            .limit(1)];
                    case 1:
                        session = (_a.sent())[0];
                        return [2 /*return*/, session];
                }
            });
        });
    };
    DatabaseStorage.prototype.hasRecentLocationUpdate = function (restaurantId_1, lat_1, lng_1) {
        return __awaiter(this, arguments, void 0, function (restaurantId, lat, lng, timeWindowMs, // 10 seconds
        distanceThreshold // 10 meters
        ) {
            var cutoffTime, recentLocation, latDiff, lngDiff, distanceM;
            if (timeWindowMs === void 0) { timeWindowMs = 10000; }
            if (distanceThreshold === void 0) { distanceThreshold = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cutoffTime = new Date(Date.now() - timeWindowMs);
                        return [4 /*yield*/, db
                                .select({
                                latitude: foodTruckLocations.latitude,
                                longitude: foodTruckLocations.longitude,
                            })
                                .from(foodTruckLocations)
                                .where(and(eq(foodTruckLocations.restaurantId, restaurantId), gte(foodTruckLocations.recordedAt, cutoffTime)))
                                .orderBy(desc(foodTruckLocations.recordedAt))
                                .limit(1)];
                    case 1:
                        recentLocation = (_a.sent())[0];
                        if (!recentLocation)
                            return [2 /*return*/, false];
                        latDiff = Math.abs(parseFloat(recentLocation.latitude) - lat);
                        lngDiff = Math.abs(parseFloat(recentLocation.longitude) - lng);
                        distanceM = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111320;
                        return [2 /*return*/, distanceM < distanceThreshold];
                }
            });
        });
    };
    DatabaseStorage.prototype.upsertLiveLocation = function (location) {
        return __awaiter(this, void 0, void 0, function () {
            var hasRecent, recent, activeSession, newLocation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.hasRecentLocationUpdate(location.restaurantId, location.latitude, location.longitude)];
                    case 1:
                        hasRecent = _a.sent();
                        if (!hasRecent) return [3 /*break*/, 3];
                        return [4 /*yield*/, db
                                .select()
                                .from(foodTruckLocations)
                                .where(eq(foodTruckLocations.restaurantId, location.restaurantId))
                                .orderBy(desc(foodTruckLocations.recordedAt))
                                .limit(1)];
                    case 2:
                        recent = (_a.sent())[0];
                        return [2 /*return*/, recent];
                    case 3: return [4 /*yield*/, this.getActiveTruckSession(location.restaurantId)];
                    case 4:
                        activeSession = _a.sent();
                        return [4 /*yield*/, db
                                .insert(foodTruckLocations)
                                .values({
                                restaurantId: location.restaurantId,
                                latitude: location.latitude.toString(),
                                longitude: location.longitude.toString(),
                                sessionId: activeSession === null || activeSession === void 0 ? void 0 : activeSession.id,
                            })
                                .returning()];
                    case 5:
                        newLocation = (_a.sent())[0];
                        // Update restaurant's current location
                        return [4 /*yield*/, db
                                .update(restaurants)
                                .set({
                                currentLatitude: location.latitude.toString(),
                                currentLongitude: location.longitude.toString(),
                                lastBroadcastAt: new Date(),
                                updatedAt: new Date(),
                            })
                                .where(eq(restaurants.id, location.restaurantId))];
                    case 6:
                        // Update restaurant's current location
                        _a.sent();
                        return [2 /*return*/, newLocation];
                }
            });
        });
    };
    DatabaseStorage.prototype.getLiveTrucksNearby = function (lat, lng, radiusKm) {
        return __awaiter(this, void 0, void 0, function () {
            var results, trucksWithDistance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            id: restaurants.id,
                            ownerId: restaurants.ownerId,
                            name: restaurants.name,
                            address: restaurants.address,
                            phone: restaurants.phone,
                            businessType: restaurants.businessType,
                            cuisineType: restaurants.cuisineType,
                            promoCode: restaurants.promoCode,
                            latitude: restaurants.latitude,
                            longitude: restaurants.longitude,
                            isFoodTruck: restaurants.isFoodTruck,
                            mobileOnline: restaurants.mobileOnline,
                            currentLatitude: restaurants.currentLatitude,
                            currentLongitude: restaurants.currentLongitude,
                            lastBroadcastAt: restaurants.lastBroadcastAt,
                            operatingHours: restaurants.operatingHours,
                            isActive: restaurants.isActive,
                            isVerified: restaurants.isVerified,
                            createdAt: restaurants.createdAt,
                            updatedAt: restaurants.updatedAt,
                            sessionId: foodTruckSessions.id,
                        })
                            .from(restaurants)
                            .leftJoin(foodTruckSessions, and(eq(restaurants.id, foodTruckSessions.restaurantId), eq(foodTruckSessions.isActive, true)))
                            .where(and(eq(restaurants.isFoodTruck, true), eq(restaurants.mobileOnline, true), eq(restaurants.isActive, true), sql(templateObject_56 || (templateObject_56 = __makeTemplateObject(["current_latitude IS NOT NULL"], ["current_latitude IS NOT NULL"]))), sql(templateObject_57 || (templateObject_57 = __makeTemplateObject(["current_longitude IS NOT NULL"], ["current_longitude IS NOT NULL"])))))];
                    case 1:
                        results = _a.sent();
                        trucksWithDistance = results.map(function (truck) {
                            if (!truck.currentLatitude || !truck.currentLongitude) {
                                return __assign(__assign({}, truck), { distance: 999999, sessionId: truck.sessionId || undefined });
                            }
                            var truckLat = parseFloat(truck.currentLatitude);
                            var truckLng = parseFloat(truck.currentLongitude);
                            // Haversine formula for distance calculation
                            var R = 6371; // Earth's radius in kilometers
                            var dLat = ((truckLat - lat) * Math.PI) / 180;
                            var dLng = ((truckLng - lng) * Math.PI) / 180;
                            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                Math.cos((lat * Math.PI) / 180) *
                                    Math.cos((truckLat * Math.PI) / 180) *
                                    Math.sin(dLng / 2) *
                                    Math.sin(dLng / 2);
                            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                            var distance = R * c;
                            return __assign(__assign({}, truck), { distance: distance, sessionId: truck.sessionId || undefined });
                        });
                        // Filter by radius and sort by distance
                        return [2 /*return*/, trucksWithDistance
                                .filter(function (truck) { return truck.distance <= radiusKm; })
                                .sort(function (a, b) { return a.distance - b.distance; })];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTruckLocationHistory = function (restaurantId, dateRange) {
        return __awaiter(this, void 0, void 0, function () {
            var conditions, locations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conditions = [eq(foodTruckLocations.restaurantId, restaurantId)];
                        if (dateRange) {
                            conditions.push(gte(foodTruckLocations.recordedAt, dateRange.start));
                            conditions.push(lte(foodTruckLocations.recordedAt, dateRange.end));
                        }
                        return [4 /*yield*/, db
                                .select()
                                .from(foodTruckLocations)
                                .where(and.apply(void 0, conditions))
                                .orderBy(desc(foodTruckLocations.recordedAt))
                                .limit(1000)];
                    case 1:
                        locations = _a.sent();
                        return [2 /*return*/, locations];
                }
            });
        });
    };
    // Restaurant favorites operations
    DatabaseStorage.prototype.createRestaurantFavorite = function (favorite) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(restaurantFavorites)
                            .values(favorite)
                            .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.removeRestaurantFavorite = function (restaurantId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .delete(restaurantFavorites)
                            .where(and(eq(restaurantFavorites.restaurantId, restaurantId), eq(restaurantFavorites.userId, userId)))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserRestaurantFavorites = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            id: restaurantFavorites.id,
                            restaurantId: restaurantFavorites.restaurantId,
                            userId: restaurantFavorites.userId,
                            favoritedAt: restaurantFavorites.favoritedAt,
                            createdAt: restaurantFavorites.createdAt,
                            restaurant: restaurants,
                        })
                            .from(restaurantFavorites)
                            .innerJoin(restaurants, eq(restaurantFavorites.restaurantId, restaurants.id))
                            .where(eq(restaurantFavorites.userId, userId))
                            .orderBy(desc(restaurantFavorites.favoritedAt))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserRestaurantFavoritesCount = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, db
                            .select({ count: sql(templateObject_58 || (templateObject_58 = __makeTemplateObject(["COUNT(*)"], ["COUNT(*)"]))).mapWith(Number) })
                            .from(restaurantFavorites)
                            .where(eq(restaurantFavorites.userId, userId))];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, (_b = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0];
                }
            });
        });
    };
    DatabaseStorage.prototype.createRestaurantFollow = function (follow) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.insert(restaurantFollows).values(follow).returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.removeRestaurantFollow = function (restaurantId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .delete(restaurantFollows)
                            .where(and(eq(restaurantFollows.restaurantId, restaurantId), eq(restaurantFollows.userId, userId)))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserRestaurantFollows = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            id: restaurantFollows.id,
                            restaurantId: restaurantFollows.restaurantId,
                            userId: restaurantFollows.userId,
                            followedAt: restaurantFollows.followedAt,
                            createdAt: restaurantFollows.createdAt,
                            restaurant: restaurants,
                        })
                            .from(restaurantFollows)
                            .innerJoin(restaurants, eq(restaurantFollows.restaurantId, restaurants.id))
                            .where(eq(restaurantFollows.userId, userId))
                            .orderBy(desc(restaurantFollows.followedAt))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.createRestaurantUserRecommendation = function (recommendation) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(restaurantUserRecommendations)
                            .values(recommendation)
                            .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserRestaurantRecommendations = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            id: restaurantUserRecommendations.id,
                            restaurantId: restaurantUserRecommendations.restaurantId,
                            userId: restaurantUserRecommendations.userId,
                            recommendedAt: restaurantUserRecommendations.recommendedAt,
                            createdAt: restaurantUserRecommendations.createdAt,
                            restaurant: restaurants,
                        })
                            .from(restaurantUserRecommendations)
                            .innerJoin(restaurants, eq(restaurantUserRecommendations.restaurantId, restaurants.id))
                            .where(eq(restaurantUserRecommendations.userId, userId))
                            .orderBy(desc(restaurantUserRecommendations.recommendedAt))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRestaurantFavoritesAnalytics = function (restaurantId, dateRange) {
        return __awaiter(this, void 0, void 0, function () {
            var favorites, favoritesTrend;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!dateRange) return [3 /*break*/, 2];
                        return [4 /*yield*/, db
                                .select({
                                id: restaurantFavorites.id,
                                favoritedAt: restaurantFavorites.favoritedAt,
                                userId: restaurantFavorites.userId,
                            })
                                .from(restaurantFavorites)
                                .where(and(eq(restaurantFavorites.restaurantId, restaurantId), gte(restaurantFavorites.favoritedAt, dateRange.start), lte(restaurantFavorites.favoritedAt, dateRange.end)))];
                    case 1:
                        favorites = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, db
                            .select({
                            id: restaurantFavorites.id,
                            favoritedAt: restaurantFavorites.favoritedAt,
                            userId: restaurantFavorites.userId,
                        })
                            .from(restaurantFavorites)
                            .where(eq(restaurantFavorites.restaurantId, restaurantId))];
                    case 3:
                        favorites = _a.sent();
                        _a.label = 4;
                    case 4: return [4 /*yield*/, db
                            .select({
                            date: sql(templateObject_59 || (templateObject_59 = __makeTemplateObject(["DATE(", ")"], ["DATE(", ")"])), restaurantFavorites.favoritedAt),
                            count: sql(templateObject_60 || (templateObject_60 = __makeTemplateObject(["COUNT(*)"], ["COUNT(*)"]))),
                        })
                            .from(restaurantFavorites)
                            .where(dateRange
                            ? and(eq(restaurantFavorites.restaurantId, restaurantId), gte(restaurantFavorites.favoritedAt, dateRange.start), lte(restaurantFavorites.favoritedAt, dateRange.end))
                            : eq(restaurantFavorites.restaurantId, restaurantId))
                            .groupBy(sql(templateObject_61 || (templateObject_61 = __makeTemplateObject(["DATE(", ")"], ["DATE(", ")"])), restaurantFavorites.favoritedAt))
                            .orderBy(sql(templateObject_62 || (templateObject_62 = __makeTemplateObject(["DATE(", ")"], ["DATE(", ")"])), restaurantFavorites.favoritedAt))];
                    case 5:
                        favoritesTrend = _a.sent();
                        return [2 /*return*/, {
                                totalFavorites: favorites.length,
                                favoritesTrend: favoritesTrend,
                                recentFavorites: favorites
                                    .slice(0, 10)
                                    .map(function (f) { return ({
                                    userId: f.userId,
                                    favoritedAt: f.favoritedAt || new Date(),
                                }); }),
                            }];
                }
            });
        });
    };
    // Restaurant recommendations operations
    DatabaseStorage.prototype.trackRestaurantRecommendation = function (recommendation) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(restaurantRecommendations)
                            .values(recommendation)
                            .returning()];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DatabaseStorage.prototype.markRecommendationClicked = function (recommendationId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(restaurantRecommendations)
                            .set({
                            isClicked: true,
                            clickedAt: new Date(),
                        })
                            .where(eq(restaurantRecommendations.id, recommendationId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRestaurantRecommendationsAnalytics = function (restaurantId, dateRange) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations, totalClicks, clickThroughRate, recommendationsByType, recommendationsTrend;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!dateRange) return [3 /*break*/, 2];
                        return [4 /*yield*/, db
                                .select({
                                id: restaurantRecommendations.id,
                                recommendationType: restaurantRecommendations.recommendationType,
                                isClicked: restaurantRecommendations.isClicked,
                                showedAt: restaurantRecommendations.showedAt,
                                clickedAt: restaurantRecommendations.clickedAt,
                            })
                                .from(restaurantRecommendations)
                                .where(and(eq(restaurantRecommendations.restaurantId, restaurantId), gte(restaurantRecommendations.showedAt, dateRange.start), lte(restaurantRecommendations.showedAt, dateRange.end)))];
                    case 1:
                        recommendations = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, db
                            .select({
                            id: restaurantRecommendations.id,
                            recommendationType: restaurantRecommendations.recommendationType,
                            isClicked: restaurantRecommendations.isClicked,
                            showedAt: restaurantRecommendations.showedAt,
                            clickedAt: restaurantRecommendations.clickedAt,
                        })
                            .from(restaurantRecommendations)
                            .where(eq(restaurantRecommendations.restaurantId, restaurantId))];
                    case 3:
                        recommendations = _a.sent();
                        _a.label = 4;
                    case 4:
                        totalClicks = recommendations.filter(function (r) { return r.isClicked === true; }).length;
                        clickThroughRate = recommendations.length > 0
                            ? (totalClicks / recommendations.length) * 100
                            : 0;
                        recommendationsByType = recommendations.reduce(function (acc, rec) {
                            var existing = acc.find(function (item) { return item.type === rec.recommendationType; });
                            if (existing) {
                                existing.count++;
                                if (rec.isClicked === true)
                                    existing.clicks++;
                            }
                            else {
                                acc.push({
                                    type: rec.recommendationType,
                                    count: 1,
                                    clicks: rec.isClicked === true ? 1 : 0,
                                });
                            }
                            return acc;
                        }, []);
                        return [4 /*yield*/, db
                                .select({
                                date: sql(templateObject_63 || (templateObject_63 = __makeTemplateObject(["DATE(", ")"], ["DATE(", ")"])), restaurantRecommendations.showedAt),
                                count: sql(templateObject_64 || (templateObject_64 = __makeTemplateObject(["COUNT(*)"], ["COUNT(*)"]))),
                                clicks: sql(templateObject_65 || (templateObject_65 = __makeTemplateObject(["SUM(CASE WHEN ", " = true THEN 1 ELSE 0 END)"], ["SUM(CASE WHEN ", " = true THEN 1 ELSE 0 END)"])), restaurantRecommendations.isClicked),
                            })
                                .from(restaurantRecommendations)
                                .where(dateRange
                                ? and(eq(restaurantRecommendations.restaurantId, restaurantId), gte(restaurantRecommendations.showedAt, dateRange.start), lte(restaurantRecommendations.showedAt, dateRange.end))
                                : eq(restaurantRecommendations.restaurantId, restaurantId))
                                .groupBy(sql(templateObject_66 || (templateObject_66 = __makeTemplateObject(["DATE(", ")"], ["DATE(", ")"])), restaurantRecommendations.showedAt))
                                .orderBy(sql(templateObject_67 || (templateObject_67 = __makeTemplateObject(["DATE(", ")"], ["DATE(", ")"])), restaurantRecommendations.showedAt))];
                    case 5:
                        recommendationsTrend = _a.sent();
                        return [2 /*return*/, {
                                totalRecommendations: recommendations.length,
                                totalClicks: totalClicks,
                                clickThroughRate: Math.round(clickThroughRate * 100) / 100, // Round to 2 decimal places
                                recommendationsByType: recommendationsByType,
                                recommendationsTrend: recommendationsTrend,
                            }];
                }
            });
        });
    };
    // Host location request operations
    DatabaseStorage.prototype.createLocationRequest = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, created;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        payload = __assign(__assign({}, request), { status: "open", notes: ((_a = request.notes) === null || _a === void 0 ? void 0 : _a.trim()) || null });
                        return [4 /*yield*/, this.expireStaleLocationRequests()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, db
                                .insert(locationRequests)
                                .values(payload)
                                .returning()];
                    case 2:
                        created = (_b.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.getLocationRequestById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(locationRequests)
                            .where(eq(locationRequests.id, id))];
                    case 1:
                        request = (_a.sent())[0];
                        return [2 /*return*/, request];
                }
            });
        });
    };
    DatabaseStorage.prototype.expireStaleLocationRequests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cutoff, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        return [4 /*yield*/, db
                                .update(locationRequests)
                                .set({ status: "expired" })
                                .where(and(eq(locationRequests.status, "open"), lte(locationRequests.createdAt, cutoff)))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount || 0];
                }
            });
        });
    };
    DatabaseStorage.prototype.createTruckInterest = function (interest) {
        return __awaiter(this, void 0, void 0, function () {
            var locationRequest, created;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.expireStaleLocationRequests()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.getLocationRequestById(interest.locationRequestId)];
                    case 2:
                        locationRequest = _b.sent();
                        if (!locationRequest) {
                            throw new Error("Location request not found");
                        }
                        if (locationRequest.status !== "open") {
                            throw new Error("Location request is not open");
                        }
                        return [4 /*yield*/, db
                                .insert(truckInterests)
                                .values(__assign(__assign({}, interest), { message: ((_a = interest.message) === null || _a === void 0 ? void 0 : _a.trim()) || null }))
                                .returning({ id: truckInterests.id })];
                    case 3:
                        created = (_b.sent())[0];
                        return [2 /*return*/, { interestId: created.id, locationRequest: locationRequest }];
                }
            });
        });
    };
    // User address operations
    DatabaseStorage.prototype.createUserAddress = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var addressData, createdAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        addressData = __assign({}, address);
                        // Convert numeric latitude/longitude to strings if present
                        if (typeof addressData.latitude === "number") {
                            addressData.latitude = addressData.latitude.toString();
                        }
                        if (typeof addressData.longitude === "number") {
                            addressData.longitude = addressData.longitude.toString();
                        }
                        return [4 /*yield*/, db
                                .insert(userAddresses)
                                .values([addressData])
                                .returning()];
                    case 1:
                        createdAddress = (_a.sent())[0];
                        return [2 /*return*/, createdAddress];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserAddresses = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(userAddresses)
                            .where(eq(userAddresses.userId, userId))
                            .orderBy(desc(userAddresses.isDefault), asc(userAddresses.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserAddress = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var address;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(userAddresses)
                            .where(eq(userAddresses.id, id))];
                    case 1:
                        address = (_a.sent())[0];
                        return [2 /*return*/, address];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUserAddress = function (id, address) {
        return __awaiter(this, void 0, void 0, function () {
            var updateData, updatedAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updateData = __assign(__assign({}, address), { updatedAt: new Date() });
                        // Convert numeric latitude/longitude to strings if present
                        if (typeof updateData.latitude === "number") {
                            updateData.latitude = updateData.latitude.toString();
                        }
                        if (typeof updateData.longitude === "number") {
                            updateData.longitude = updateData.longitude.toString();
                        }
                        return [4 /*yield*/, db
                                .update(userAddresses)
                                .set(updateData)
                                .where(eq(userAddresses.id, id))
                                .returning()];
                    case 1:
                        updatedAddress = (_a.sent())[0];
                        return [2 /*return*/, updatedAddress];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteUserAddress = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.delete(userAddresses).where(eq(userAddresses.id, id))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.setDefaultAddress = function (userId, addressId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Use transaction to prevent race conditions where multiple addresses could be set as default
                    return [4 /*yield*/, db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: 
                                    // First, unset all default addresses for the user
                                    return [4 /*yield*/, tx
                                            .update(userAddresses)
                                            .set({ isDefault: false, updatedAt: new Date() })
                                            .where(eq(userAddresses.userId, userId))];
                                    case 1:
                                        // First, unset all default addresses for the user
                                        _a.sent();
                                        // Then set the specified address as default
                                        return [4 /*yield*/, tx
                                                .update(userAddresses)
                                                .set({ isDefault: true, updatedAt: new Date() })
                                                .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)))];
                                    case 2:
                                        // Then set the specified address as default
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        // Use transaction to prevent race conditions where multiple addresses could be set as default
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var SUPER_ADMIN_EMAIL, user, error_5, deletedEmail;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info.mealscout@gmail.com";
                        return [4 /*yield*/, this.getUser(userId)];
                    case 1:
                        user = _a.sent();
                        if ((user === null || user === void 0 ? void 0 : user.email) === SUPER_ADMIN_EMAIL) {
                            throw new Error("Cannot delete super admin account");
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, db.delete(users).where(eq(users.id, userId))];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        error_5 = _a.sent();
                        deletedEmail = "deleted+".concat(userId, "@mealscout.invalid");
                        return [4 /*yield*/, db
                                .update(users)
                                .set({
                                isDisabled: true,
                                email: deletedEmail,
                                firstName: null,
                                lastName: null,
                                phone: null,
                                passwordHash: null,
                                facebookId: null,
                                facebookAccessToken: null,
                                googleId: null,
                                googleAccessToken: null,
                                tradescoutId: null,
                                profileImageUrl: null,
                                updatedAt: new Date(),
                            })
                                .where(eq(users.id, userId))];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Password reset token operations
    DatabaseStorage.prototype.createPasswordResetToken = function (tokenData) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(passwordResetTokens)
                            .values(tokenData)
                            .returning()];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPasswordResetToken = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(passwordResetTokens)
                            .where(eq(passwordResetTokens.id, id))];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPasswordResetTokenByTokenHash = function (tokenHash) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(passwordResetTokens)
                            .where(and(eq(passwordResetTokens.tokenHash, tokenHash), gte(passwordResetTokens.expiresAt, new Date()), isNull(passwordResetTokens.usedAt)))];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.markPasswordResetTokenUsed = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(passwordResetTokens)
                            .set({ usedAt: new Date() })
                            .where(eq(passwordResetTokens.id, id))
                            .returning()];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteUserResetTokens = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        return [4 /*yield*/, db
                                .delete(passwordResetTokens)
                                .where(and(eq(passwordResetTokens.userId, userId), or(lte(passwordResetTokens.expiresAt, now), isNotNull(passwordResetTokens.usedAt))))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteExpiredResetTokens = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .delete(passwordResetTokens)
                            .where(lte(passwordResetTokens.expiresAt, new Date()))];
                    case 1:
                        result = _a.sent();
                        // Return the number of deleted rows
                        return [2 /*return*/, result.rowCount || 0];
                }
            });
        });
    };
    DatabaseStorage.prototype.createPhoneVerificationToken = function (tokenData) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(phoneVerificationTokens)
                            .values(tokenData)
                            .returning()];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPhoneVerificationTokenByHash = function (phone, tokenHash) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(phoneVerificationTokens)
                            .where(and(eq(phoneVerificationTokens.phone, phone), eq(phoneVerificationTokens.tokenHash, tokenHash), gte(phoneVerificationTokens.expiresAt, new Date()), isNull(phoneVerificationTokens.usedAt)))];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.markPhoneVerificationTokenUsed = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(phoneVerificationTokens)
                            .set({ usedAt: new Date() })
                            .where(eq(phoneVerificationTokens.id, id))
                            .returning()];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.deletePhoneVerificationTokens = function (phone) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .delete(phoneVerificationTokens)
                            .where(eq(phoneVerificationTokens.phone, phone))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteExpiredPhoneVerificationTokens = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .delete(phoneVerificationTokens)
                            .where(lte(phoneVerificationTokens.expiresAt, new Date()))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount || 0];
                }
            });
        });
    };
    // Account setup token operations
    DatabaseStorage.prototype.createAccountSetupToken = function (tokenData) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(accountSetupTokens)
                            .values(tokenData)
                            .returning()];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAccountSetupToken = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(accountSetupTokens)
                            .where(eq(accountSetupTokens.id, id))];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAccountSetupTokenByTokenHash = function (tokenHash) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(accountSetupTokens)
                            .where(and(eq(accountSetupTokens.tokenHash, tokenHash), gte(accountSetupTokens.expiresAt, new Date()), isNull(accountSetupTokens.usedAt)))];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.markAccountSetupTokenUsed = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(accountSetupTokens)
                            .set({ usedAt: new Date() })
                            .where(eq(accountSetupTokens.id, id))
                            .returning()];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteUserSetupTokens = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        return [4 /*yield*/, db
                                .delete(accountSetupTokens)
                                .where(and(eq(accountSetupTokens.userId, userId), or(lte(accountSetupTokens.expiresAt, now), isNotNull(accountSetupTokens.usedAt))))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteExpiredSetupTokens = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .delete(accountSetupTokens)
                            .where(lte(accountSetupTokens.expiresAt, new Date()))];
                    case 1:
                        result = _a.sent();
                        // Return the number of deleted rows
                        return [2 /*return*/, result.rowCount || 0];
                }
            });
        });
    };
    // Email verification token operations
    DatabaseStorage.prototype.createEmailVerificationToken = function (tokenData) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(emailVerificationTokens)
                            .values(tokenData)
                            .returning()];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.getEmailVerificationTokenByTokenHash = function (tokenHash) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(emailVerificationTokens)
                            .where(and(eq(emailVerificationTokens.tokenHash, tokenHash), gte(emailVerificationTokens.expiresAt, new Date()), isNull(emailVerificationTokens.usedAt)))];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    DatabaseStorage.prototype.markEmailVerificationTokenUsed = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(emailVerificationTokens)
                            .set({ usedAt: new Date() })
                            .where(eq(emailVerificationTokens.id, id))
                            .returning()];
                    case 1:
                        token = (_a.sent())[0];
                        return [2 /*return*/, token];
                }
            });
        });
    };
    // API Key operations
    DatabaseStorage.prototype.getActiveApiKeys = function () {
        return __awaiter(this, void 0, void 0, function () {
            var keys;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(apiKeys)
                            .where(and(eq(apiKeys.isActive, true), or(isNull(apiKeys.expiresAt), gte(apiKeys.expiresAt, new Date()))))];
                    case 1:
                        keys = _a.sent();
                        return [2 /*return*/, keys];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateApiKeyLastUsed = function (keyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(apiKeys)
                            .set({ lastUsedAt: new Date() })
                            .where(eq(apiKeys.id, keyId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Deal feedback operations
    DatabaseStorage.prototype.createDealFeedback = function (feedback) {
        return __awaiter(this, void 0, void 0, function () {
            var createdFeedback;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(dealFeedback)
                            .values(feedback)
                            .returning()];
                    case 1:
                        createdFeedback = (_a.sent())[0];
                        return [2 /*return*/, createdFeedback];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDealFeedback = function (dealId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(dealFeedback)
                            .where(eq(dealFeedback.dealId, dealId))
                            .orderBy(desc(dealFeedback.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserDealFeedback = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(dealFeedback)
                            .where(eq(dealFeedback.userId, userId))
                            .orderBy(desc(dealFeedback.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDealAverageRating = function (dealId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, db
                            .select({
                            avgRating: sql(templateObject_68 || (templateObject_68 = __makeTemplateObject(["AVG(", ")"], ["AVG(", ")"])), dealFeedback.rating),
                        })
                            .from(dealFeedback)
                            .where(eq(dealFeedback.dealId, dealId))];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.avgRating) || 0];
                }
            });
        });
    };
    DatabaseStorage.prototype.getDealFeedbackStats = function (dealId) {
        return __awaiter(this, void 0, void 0, function () {
            var feedback, totalFeedback, averageRating, ratingDistribution;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(dealFeedback)
                            .where(eq(dealFeedback.dealId, dealId))];
                    case 1:
                        feedback = _a.sent();
                        totalFeedback = feedback.length;
                        averageRating = totalFeedback > 0
                            ? feedback.reduce(function (sum, f) { return sum + f.rating; }, 0) /
                                totalFeedback
                            : 0;
                        ratingDistribution = {
                            1: 0,
                            2: 0,
                            3: 0,
                            4: 0,
                            5: 0,
                        };
                        feedback.forEach(function (f) {
                            if (f.rating >= 1 && f.rating <= 5) {
                                ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
                            }
                        });
                        return [2 /*return*/, {
                                averageRating: Math.round(averageRating * 10) / 10,
                                totalFeedback: totalFeedback,
                                ratingDistribution: ratingDistribution,
                            }];
                }
            });
        });
    };
    // ============================================
    // Staff Management Functions
    // ============================================
    DatabaseStorage.prototype.getUsersByRole = function (role) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .select()
                            .from(users)
                            .where(eq(users.userType, role))
                            .orderBy(desc(users.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createUserWithPassword = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .insert(users)
                            .values({
                            email: data.email,
                            firstName: data.firstName,
                            lastName: data.lastName,
                            phone: data.phone,
                            userType: data.userType,
                            passwordHash: data.passwordHash,
                            mustResetPassword: data.mustResetPassword,
                            emailVerified: false,
                        })
                            .returning()];
                    case 1:
                        user = (_a.sent())[0];
                        void syncUserToBrevo(user).catch(function () { });
                        return [2 /*return*/, { userId: user.id }];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUserPassword = function (userId, passwordHash, mustResetPassword) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(users)
                            .set({
                            passwordHash: passwordHash,
                            mustResetPassword: mustResetPassword,
                            updatedAt: new Date(),
                        })
                            .where(eq(users.id, userId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.disableUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var SUPER_ADMIN_EMAIL, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info.mealscout@gmail.com";
                        return [4 /*yield*/, this.getUser(userId)];
                    case 1:
                        user = _a.sent();
                        if ((user === null || user === void 0 ? void 0 : user.email) === SUPER_ADMIN_EMAIL) {
                            throw new Error("Cannot disable super admin account");
                        }
                        return [4 /*yield*/, db
                                .update(users)
                                .set({
                                isDisabled: true,
                                updatedAt: new Date(),
                            })
                                .where(eq(users.id, userId))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.enableUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .update(users)
                            .set({
                            isDisabled: false,
                            updatedAt: new Date(),
                        })
                            .where(eq(users.id, userId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // LISA Phase 4A: Claim Persistence
    // ============================================
    /**
     * emitClaim - Write-only fact recording
     *
     * Records an immutable observation about what happened in the system.
     * NO scoring, NO ranking, NO automation.
     *
     * Claims are facts, not conclusions.
     * Claims never mutate authority or user state.
     */
    DatabaseStorage.prototype.emitClaim = function (claim) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, db.insert(lisaClaims).values({
                                subjectType: claim.subjectType,
                                subjectId: claim.subjectId,
                                actorType: claim.actorType || null,
                                actorId: claim.actorId || null,
                                app: claim.app,
                                claimType: claim.claimType,
                                claimValue: claim.claimValue,
                                source: claim.source,
                                confidence: ((_a = claim.confidence) === null || _a === void 0 ? void 0 : _a.toString()) || "1.0",
                            })];
                    case 1:
                        _b.sent();
                        console.log("✅ LISA claim emitted:", {
                            claimType: claim.claimType,
                            app: claim.app,
                            subjectType: claim.subjectType,
                            subjectId: claim.subjectId,
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _b.sent();
                        // Claim recording failures should NOT block business operations
                        console.error("❌ LISA claim emission failed (non-blocking):", error_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * getClaims - Read-only claim retrieval
     *
     * Filters claims by subject, actor, app, type, or time window.
     * Used for debugging and future deterministic resolution (Phase 4B+).
     *
     * NOT used for runtime decision-making yet.
     */
    DatabaseStorage.prototype.getClaims = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var query, conditions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = db.select().from(lisaClaims);
                        conditions = [];
                        if (filters.subjectType) {
                            conditions.push(eq(lisaClaims.subjectType, filters.subjectType));
                        }
                        if (filters.subjectId) {
                            conditions.push(eq(lisaClaims.subjectId, filters.subjectId));
                        }
                        if (filters.actorType) {
                            conditions.push(eq(lisaClaims.actorType, filters.actorType));
                        }
                        if (filters.actorId) {
                            conditions.push(eq(lisaClaims.actorId, filters.actorId));
                        }
                        if (filters.app) {
                            conditions.push(eq(lisaClaims.app, filters.app));
                        }
                        if (filters.claimType) {
                            conditions.push(eq(lisaClaims.claimType, filters.claimType));
                        }
                        if (filters.startDate) {
                            conditions.push(gte(lisaClaims.createdAt, filters.startDate));
                        }
                        if (filters.endDate) {
                            conditions.push(lte(lisaClaims.createdAt, filters.endDate));
                        }
                        if (conditions.length > 0) {
                            query = query.where(and.apply(void 0, conditions));
                        }
                        query = query.orderBy(desc(lisaClaims.createdAt));
                        if (filters.limit) {
                            query = query.limit(filters.limit);
                        }
                        return [4 /*yield*/, query];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return DatabaseStorage;
}());
export { DatabaseStorage };
export var storage = new DatabaseStorage();
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33, templateObject_34, templateObject_35, templateObject_36, templateObject_37, templateObject_38, templateObject_39, templateObject_40, templateObject_41, templateObject_42, templateObject_43, templateObject_44, templateObject_45, templateObject_46, templateObject_47, templateObject_48, templateObject_49, templateObject_50, templateObject_51, templateObject_52, templateObject_53, templateObject_54, templateObject_55, templateObject_56, templateObject_57, templateObject_58, templateObject_59, templateObject_60, templateObject_61, templateObject_62, templateObject_63, templateObject_64, templateObject_65, templateObject_66, templateObject_67, templateObject_68;

