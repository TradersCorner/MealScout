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
import { z } from "zod";
import { and, desc, eq, gte, isNull, lte, or, sql, } from "drizzle-orm";
import { db } from "../db.js";
import { isAdmin } from "../unifiedAuth.js";
import { geoAds, geoAdEvents, geoLocationPings } from "@shared/schema";
var placementSchema = z.enum(["map", "home", "deals"]);
var statusSchema = z.enum(["draft", "active", "paused", "archived"]);
var isValidUrl = function (value) {
    try {
        new URL(value);
        return true;
    }
    catch (_a) {
        return false;
    }
};
var urlOrPathSchema = z
    .string()
    .min(1)
    .refine(function (value) { return value.startsWith("/") || isValidUrl(value); }, {
    message: "Invalid URL",
});
var geoAdSchema = z.object({
    name: z.string().min(1),
    status: statusSchema.optional(),
    placements: z.array(placementSchema).min(1),
    title: z.string().min(1),
    body: z.string().optional().nullable(),
    mediaUrl: urlOrPathSchema.optional().nullable(),
    targetUrl: urlOrPathSchema,
    ctaText: z.string().optional().nullable(),
    pinLat: z.coerce.number().optional().nullable(),
    pinLng: z.coerce.number().optional().nullable(),
    geofenceLat: z.coerce.number(),
    geofenceLng: z.coerce.number(),
    geofenceRadiusM: z.coerce.number().int().min(50).max(200000),
    targetUserTypes: z.array(z.string()).optional().nullable(),
    minDailyFootTraffic: z.coerce.number().int().min(0).optional().nullable(),
    maxDailyFootTraffic: z.coerce.number().int().min(0).optional().nullable(),
    priority: z.coerce.number().int().optional().nullable(),
    startAt: z.string().optional().nullable(),
    endAt: z.string().optional().nullable(),
});
var geoAdUpdateSchema = geoAdSchema.partial();
var adEventSchema = z.object({
    adId: z.string().min(1),
    eventType: z.enum(["impression", "click"]),
    placement: placementSchema,
});
var pingSchema = z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    source: placementSchema.optional(),
});
var toDecimalString = function (value, scale) {
    if (scale === void 0) { scale = 8; }
    return Number.isFinite(value) ? value.toFixed(scale) : null;
};
var haversineKm = function (aLat, aLng, bLat, bLng) {
    var toRad = function (deg) { return (deg * Math.PI) / 180; };
    var earthRadiusKm = 6371;
    var dLat = toRad(bLat - aLat);
    var dLng = toRad(bLng - aLng);
    var lat1 = toRad(aLat);
    var lat2 = toRad(bLat);
    var sinLat = Math.sin(dLat / 2);
    var sinLng = Math.sin(dLng / 2);
    var h = sinLat * sinLat +
        Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
    return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};
var isMissingRelationError = function (error, relationName) {
    var _a, _b;
    var err = error;
    if (!err || err.code !== "42P01")
        return false;
    if (!relationName)
        return true;
    return (_b = (_a = err.message) === null || _a === void 0 ? void 0 : _a.includes("\"".concat(relationName, "\""))) !== null && _b !== void 0 ? _b : false;
};
var getFootTrafficCount = function (params) { return __awaiter(void 0, void 0, void 0, function () {
    var lat, lng, radiusM, hours, radiusKm, latDelta, lngDelta, since, minLat, maxLat, minLng, maxLng, rows, error_1, unique, _i, rows_1, row, rowLat, rowLng, distanceKm, key;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lat = params.lat, lng = params.lng, radiusM = params.radiusM, hours = params.hours;
                radiusKm = radiusM / 1000;
                latDelta = radiusKm / 111;
                lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);
                since = new Date(Date.now() - hours * 60 * 60 * 1000);
                minLat = toDecimalString(lat - latDelta);
                maxLat = toDecimalString(lat + latDelta);
                minLng = toDecimalString(lng - lngDelta);
                maxLng = toDecimalString(lng + lngDelta);
                rows = [];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, db
                        .select({
                        lat: geoLocationPings.lat,
                        lng: geoLocationPings.lng,
                        userId: geoLocationPings.userId,
                        visitorId: geoLocationPings.visitorId,
                    })
                        .from(geoLocationPings)
                        .where(and(gte(geoLocationPings.createdAt, since), gte(geoLocationPings.lat, minLat !== null && minLat !== void 0 ? minLat : "0"), lte(geoLocationPings.lat, maxLat !== null && maxLat !== void 0 ? maxLat : "0"), gte(geoLocationPings.lng, minLng !== null && minLng !== void 0 ? minLng : "0"), lte(geoLocationPings.lng, maxLng !== null && maxLng !== void 0 ? maxLng : "0")))];
            case 2:
                rows = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                if (isMissingRelationError(error_1, "geo_location_pings")) {
                    console.warn("geo_location_pings missing; skipping foot traffic calculation.");
                    return [2 /*return*/, 0];
                }
                throw error_1;
            case 4:
                unique = new Set();
                for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                    row = rows_1[_i];
                    rowLat = Number(row.lat);
                    rowLng = Number(row.lng);
                    if (!Number.isFinite(rowLat) || !Number.isFinite(rowLng))
                        continue;
                    distanceKm = haversineKm(lat, lng, rowLat, rowLng);
                    if (distanceKm * 1000 > radiusM)
                        continue;
                    key = row.userId || row.visitorId || "".concat(rowLat.toFixed(3), ":").concat(rowLng.toFixed(3));
                    unique.add(key);
                }
                return [2 /*return*/, unique.size];
        }
    });
}); };
export function registerGeoAdRoutes(app) {
    var _this = this;
    app.get("/api/geo-ads", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var placementParse, lat, lng, limitParam, limit, placement, userType, nowSql, candidates, results, _i, candidates_1, ad, placements, targetUserTypes, adLat, adLng, radiusM, distanceKm, traffic;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    placementParse = placementSchema.safeParse(req.query.placement);
                    if (!placementParse.success) {
                        return [2 /*return*/, res.status(400).json({ message: "placement is required" })];
                    }
                    lat = Number(req.query.lat);
                    lng = Number(req.query.lng);
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        return [2 /*return*/, res.json([])];
                    }
                    limitParam = Number(req.query.limit);
                    limit = Number.isFinite(limitParam)
                        ? Math.min(Math.max(limitParam, 1), 20)
                        : 3;
                    placement = placementParse.data;
                    userType = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userType) || "guest";
                    nowSql = sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["NOW()"], ["NOW()"])));
                    return [4 /*yield*/, db
                            .select()
                            .from(geoAds)
                            .where(and(eq(geoAds.status, "active"), or(isNull(geoAds.startAt), lte(geoAds.startAt, nowSql)), or(isNull(geoAds.endAt), gte(geoAds.endAt, nowSql))))
                            .orderBy(desc(geoAds.priority), desc(geoAds.createdAt))];
                case 1:
                    candidates = _d.sent();
                    results = [];
                    _i = 0, candidates_1 = candidates;
                    _d.label = 2;
                case 2:
                    if (!(_i < candidates_1.length)) return [3 /*break*/, 6];
                    ad = candidates_1[_i];
                    placements = Array.isArray(ad.placements) ? ad.placements : [];
                    if (!placements.includes(placement))
                        return [3 /*break*/, 5];
                    targetUserTypes = Array.isArray(ad.targetUserTypes)
                        ? ad.targetUserTypes
                        : [];
                    if (targetUserTypes.length > 0 && !targetUserTypes.includes(userType)) {
                        return [3 /*break*/, 5];
                    }
                    adLat = Number(ad.geofenceLat);
                    adLng = Number(ad.geofenceLng);
                    radiusM = Number(ad.geofenceRadiusM || 0);
                    if (!Number.isFinite(adLat) || !Number.isFinite(adLng) || radiusM <= 0) {
                        return [3 /*break*/, 5];
                    }
                    distanceKm = haversineKm(lat, lng, adLat, adLng);
                    if (distanceKm * 1000 > radiusM)
                        return [3 /*break*/, 5];
                    if (!(ad.minDailyFootTraffic || ad.maxDailyFootTraffic)) return [3 /*break*/, 4];
                    return [4 /*yield*/, getFootTrafficCount({
                            lat: adLat,
                            lng: adLng,
                            radiusM: radiusM,
                            hours: 24,
                        })];
                case 3:
                    traffic = _d.sent();
                    if (ad.minDailyFootTraffic && traffic < ad.minDailyFootTraffic) {
                        return [3 /*break*/, 5];
                    }
                    if (ad.maxDailyFootTraffic && traffic > ad.maxDailyFootTraffic) {
                        return [3 /*break*/, 5];
                    }
                    _d.label = 4;
                case 4:
                    results.push({
                        id: ad.id,
                        name: ad.name,
                        title: ad.title,
                        body: ad.body,
                        mediaUrl: ad.mediaUrl,
                        targetUrl: ad.targetUrl,
                        ctaText: ad.ctaText,
                        placements: placements,
                        pinLat: Number((_b = ad.pinLat) !== null && _b !== void 0 ? _b : ad.geofenceLat),
                        pinLng: Number((_c = ad.pinLng) !== null && _c !== void 0 ? _c : ad.geofenceLng),
                        geofenceLat: adLat,
                        geofenceLng: adLng,
                        geofenceRadiusM: radiusM,
                    });
                    if (results.length >= limit)
                        return [3 /*break*/, 6];
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6:
                    res.json(results);
                    return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/geo-ads/track", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var parsed, session, visitorId, userId;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    parsed = adEventSchema.safeParse(req.body);
                    if (!parsed.success) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid event payload" })];
                    }
                    session = req.session;
                    visitorId = req.sessionID || (session === null || session === void 0 ? void 0 : session.id) || null;
                    userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null;
                    return [4 /*yield*/, db.insert(geoAdEvents).values({
                            adId: parsed.data.adId,
                            eventType: parsed.data.eventType,
                            placement: parsed.data.placement,
                            userId: userId,
                            visitorId: visitorId,
                        })];
                case 1:
                    _b.sent();
                    res.json({ ok: true });
                    return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/geo/ping", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var parsed, session, now, lastPing, roundedLat, roundedLng, visitorId, userId, userType, error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    parsed = pingSchema.safeParse(req.body);
                    if (!parsed.success) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid location payload" })];
                    }
                    session = req.session;
                    now = Date.now();
                    lastPing = (session === null || session === void 0 ? void 0 : session.lastGeoPingAt) || 0;
                    if (now - lastPing < 2 * 60 * 1000) {
                        return [2 /*return*/, res.json({ ok: true, skipped: true })];
                    }
                    session.lastGeoPingAt = now;
                    roundedLat = Math.round(parsed.data.lat * 1000) / 1000;
                    roundedLng = Math.round(parsed.data.lng * 1000) / 1000;
                    visitorId = req.sessionID || (session === null || session === void 0 ? void 0 : session.id) || null;
                    userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null;
                    userType = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userType) || "guest";
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db.insert(geoLocationPings).values({
                            userId: userId,
                            visitorId: visitorId,
                            userType: userType,
                            lat: toDecimalString(roundedLat, 3) || "0",
                            lng: toDecimalString(roundedLng, 3) || "0",
                            source: parsed.data.source || null,
                        })];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _c.sent();
                    if (isMissingRelationError(error_2, "geo_location_pings")) {
                        console.warn("geo_location_pings missing; skipping geo ping insert.");
                        return [2 /*return*/, res.json({ ok: true, skipped: true })];
                    }
                    throw error_2;
                case 4:
                    res.json({ ok: true });
                    return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/geo-ads", isAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var status, filters, query, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    status = req.query.status;
                    filters = [];
                    if (statusSchema.safeParse(status).success) {
                        filters.push(eq(geoAds.status, status));
                    }
                    query = db.select().from(geoAds);
                    if (filters.length) {
                        query.where(and.apply(void 0, filters));
                    }
                    return [4 /*yield*/, query.orderBy(desc(geoAds.createdAt))];
                case 1:
                    rows = _a.sent();
                    res.json(rows);
                    return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/geo-ads", isAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var parsed, payload, now, startAt, endAt, created;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    parsed = geoAdSchema.safeParse(req.body);
                    if (!parsed.success) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid ad payload" })];
                    }
                    payload = parsed.data;
                    now = new Date();
                    startAt = payload.startAt ? new Date(payload.startAt) : null;
                    endAt = payload.endAt ? new Date(payload.endAt) : null;
                    return [4 /*yield*/, db
                            .insert(geoAds)
                            .values({
                            name: payload.name.trim(),
                            status: payload.status || "draft",
                            placements: payload.placements,
                            title: payload.title.trim(),
                            body: ((_a = payload.body) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                            mediaUrl: payload.mediaUrl || null,
                            targetUrl: payload.targetUrl,
                            ctaText: payload.ctaText || "Learn more",
                            pinLat: payload.pinLat ? toDecimalString(payload.pinLat) : null,
                            pinLng: payload.pinLng ? toDecimalString(payload.pinLng) : null,
                            geofenceLat: toDecimalString(payload.geofenceLat) || "0",
                            geofenceLng: toDecimalString(payload.geofenceLng) || "0",
                            geofenceRadiusM: payload.geofenceRadiusM,
                            targetUserTypes: payload.targetUserTypes || [],
                            minDailyFootTraffic: (_b = payload.minDailyFootTraffic) !== null && _b !== void 0 ? _b : null,
                            maxDailyFootTraffic: (_c = payload.maxDailyFootTraffic) !== null && _c !== void 0 ? _c : null,
                            priority: (_d = payload.priority) !== null && _d !== void 0 ? _d : 0,
                            startAt: startAt && !Number.isNaN(startAt.valueOf()) ? startAt : null,
                            endAt: endAt && !Number.isNaN(endAt.valueOf()) ? endAt : null,
                            createdByUserId: ((_e = req.user) === null || _e === void 0 ? void 0 : _e.id) || null,
                            createdAt: now,
                            updatedAt: now,
                        })
                            .returning()];
                case 1:
                    created = _f.sent();
                    res.json(created[0]);
                    return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/geo-ads/:id", isAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var parsed, payload, updates, startAt, endAt, updated;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    parsed = geoAdUpdateSchema.safeParse(req.body);
                    if (!parsed.success) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid ad payload" })];
                    }
                    payload = parsed.data;
                    updates = {
                        updatedAt: new Date(),
                    };
                    if (payload.name !== undefined)
                        updates.name = payload.name.trim();
                    if (payload.status !== undefined)
                        updates.status = payload.status;
                    if (payload.placements !== undefined)
                        updates.placements = payload.placements;
                    if (payload.title !== undefined)
                        updates.title = payload.title.trim();
                    if (payload.body !== undefined)
                        updates.body = ((_a = payload.body) === null || _a === void 0 ? void 0 : _a.trim()) || null;
                    if (payload.mediaUrl !== undefined)
                        updates.mediaUrl = payload.mediaUrl;
                    if (payload.targetUrl !== undefined)
                        updates.targetUrl = payload.targetUrl;
                    if (payload.ctaText !== undefined)
                        updates.ctaText = payload.ctaText;
                    if (payload.pinLat !== undefined)
                        updates.pinLat = payload.pinLat ? toDecimalString(payload.pinLat) : null;
                    if (payload.pinLng !== undefined)
                        updates.pinLng = payload.pinLng ? toDecimalString(payload.pinLng) : null;
                    if (payload.geofenceLat !== undefined)
                        updates.geofenceLat = toDecimalString(payload.geofenceLat) || "0";
                    if (payload.geofenceLng !== undefined)
                        updates.geofenceLng = toDecimalString(payload.geofenceLng) || "0";
                    if (payload.geofenceRadiusM !== undefined)
                        updates.geofenceRadiusM = payload.geofenceRadiusM;
                    if (payload.targetUserTypes !== undefined)
                        updates.targetUserTypes = payload.targetUserTypes;
                    if (payload.minDailyFootTraffic !== undefined)
                        updates.minDailyFootTraffic = payload.minDailyFootTraffic;
                    if (payload.maxDailyFootTraffic !== undefined)
                        updates.maxDailyFootTraffic = payload.maxDailyFootTraffic;
                    if (payload.priority !== undefined)
                        updates.priority = payload.priority;
                    if (payload.startAt !== undefined) {
                        startAt = payload.startAt ? new Date(payload.startAt) : null;
                        updates.startAt = startAt && !Number.isNaN(startAt.valueOf()) ? startAt : null;
                    }
                    if (payload.endAt !== undefined) {
                        endAt = payload.endAt ? new Date(payload.endAt) : null;
                        updates.endAt = endAt && !Number.isNaN(endAt.valueOf()) ? endAt : null;
                    }
                    return [4 /*yield*/, db
                            .update(geoAds)
                            .set(updates)
                            .where(eq(geoAds.id, req.params.id))
                            .returning()];
                case 1:
                    updated = _b.sent();
                    res.json(updated[0] || null);
                    return [2 /*return*/];
            }
        });
    }); });
    app.delete("/api/admin/geo-ads/:id", isAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .update(geoAds)
                        .set({ status: "archived", updatedAt: new Date() })
                        .where(eq(geoAds.id, req.params.id))
                        .returning()];
                case 1:
                    updated = _a.sent();
                    res.json(updated[0] || null);
                    return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/geo-ads/:id/metrics", isAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var days, since, ad, impressions, clicks, impressionsCount, clicksCount, ctr, adLat, adLng, radiusM, footTraffic24h, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    days = Number(req.query.days) || 7;
                    since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, db.query.geoAds.findFirst({
                            where: eq(geoAds.id, req.params.id),
                        })];
                case 1:
                    ad = _b.sent();
                    if (!ad) {
                        return [2 /*return*/, res.status(404).json({ message: "Ad not found" })];
                    }
                    return [4 /*yield*/, db
                            .select({ count: sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                            .from(geoAdEvents)
                            .where(and(eq(geoAdEvents.adId, ad.id), eq(geoAdEvents.eventType, "impression"), gte(geoAdEvents.createdAt, since)))];
                case 2:
                    impressions = (_b.sent())[0];
                    return [4 /*yield*/, db
                            .select({ count: sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                            .from(geoAdEvents)
                            .where(and(eq(geoAdEvents.adId, ad.id), eq(geoAdEvents.eventType, "click"), gte(geoAdEvents.createdAt, since)))];
                case 3:
                    clicks = (_b.sent())[0];
                    impressionsCount = Number((impressions === null || impressions === void 0 ? void 0 : impressions.count) || 0);
                    clicksCount = Number((clicks === null || clicks === void 0 ? void 0 : clicks.count) || 0);
                    ctr = impressionsCount > 0 ? clicksCount / impressionsCount : 0;
                    adLat = Number(ad.geofenceLat);
                    adLng = Number(ad.geofenceLng);
                    radiusM = Number(ad.geofenceRadiusM || 0);
                    if (!(Number.isFinite(adLat) && Number.isFinite(adLng) && radiusM > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, getFootTrafficCount({
                            lat: adLat,
                            lng: adLng,
                            radiusM: radiusM,
                            hours: 24,
                        })];
                case 4:
                    _a = _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _a = 0;
                    _b.label = 6;
                case 6:
                    footTraffic24h = _a;
                    res.json({
                        impressions: impressionsCount,
                        clicks: clicksCount,
                        ctr: ctr,
                        footTraffic24h: footTraffic24h,
                        windowDays: days,
                    });
                    return [2 /*return*/];
            }
        });
    }); });
}
var templateObject_1, templateObject_2, templateObject_3;

