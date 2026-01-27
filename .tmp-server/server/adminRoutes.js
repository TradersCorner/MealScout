/**
 * Admin Control Center API Endpoints
 *
 * Provides comprehensive admin tools for:
 * - Incident management
 * - Audit log viewing
 * - Support ticket management
 * - Moderation event review
 * - System health monitoring
 *
 * All endpoints require admin authentication.
 */
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
import { supportTickets, moderationEvents, securityAuditLog, incidents, users, } from "@shared/schema";
import { eq, desc, or, gte, isNull } from "drizzle-orm";
import { isAdmin } from "./unifiedAuth.js";
import { logAudit } from "./auditLogger.js";
import { storage } from "./storage.js";
import bcrypt from "bcryptjs";
var router = Router();
/**
 * GET /api/admin/stats
 * Dashboard overview with key metrics
 */
router.get("/stats", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var now, thirtyDaysAgo, _a, totalUsers, totalIncidents, openIncidents, criticalIncidents, openTickets, highPriorityTickets, recentModerationEvents, auditLogsCount, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                now = new Date();
                thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return [4 /*yield*/, Promise.all([
                        db
                            .select()
                            .from(users)
                            .where(or(eq(users.isDisabled, false), isNull(users.isDisabled)))
                            .then(function (u) { return u.length; }),
                        db
                            .select()
                            .from(incidents)
                            .then(function (i) { return i.length; }),
                        db
                            .select()
                            .from(incidents)
                            .where(eq(incidents.status, "new"))
                            .then(function (i) { return i.length; }),
                        db
                            .select()
                            .from(incidents)
                            .where(eq(incidents.severity, "critical"))
                            .then(function (i) { return i.length; }),
                        db
                            .select()
                            .from(supportTickets)
                            .where(eq(supportTickets.status, "open"))
                            .then(function (t) { return t.length; }),
                        db
                            .select()
                            .from(supportTickets)
                            .then(function (tickets) {
                            return tickets.filter(function (t) { return t.priority === "high" || t.priority === "critical"; }).length;
                        }),
                        db
                            .select()
                            .from(moderationEvents)
                            .where(gte(moderationEvents.createdAt, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)))
                            .then(function (m) { return m.length; }),
                        db
                            .select()
                            .from(securityAuditLog)
                            .where(gte(securityAuditLog.timestamp, thirtyDaysAgo))
                            .then(function (a) { return a.length; }),
                    ])];
            case 1:
                _a = _b.sent(), totalUsers = _a[0], totalIncidents = _a[1], openIncidents = _a[2], criticalIncidents = _a[3], openTickets = _a[4], highPriorityTickets = _a[5], recentModerationEvents = _a[6], auditLogsCount = _a[7];
                res.json({
                    users: { total: totalUsers },
                    incidents: {
                        total: totalIncidents,
                        open: openIncidents,
                        critical: criticalIncidents,
                    },
                    tickets: { open: openTickets, highPriority: highPriorityTickets },
                    moderation: { recentEvents: recentModerationEvents },
                    audit: { recentLogs: auditLogsCount },
                    timestamp: new Date().toISOString(),
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error("Failed to fetch stats:", error_1);
                res.status(500).json({ error: "Failed to fetch stats" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/audit-logs
 * Search and filter audit logs
 */
router.get("/audit-logs", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, action_1, resourceType_1, userId_1, search, _b, days, daysNum, cutoffDate, logs, filtered, searchLower_1, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.query, action_1 = _a.action, resourceType_1 = _a.resourceType, userId_1 = _a.userId, search = _a.search, _b = _a.days, days = _b === void 0 ? "30" : _b;
                daysNum = parseInt(String(days)) || 30;
                cutoffDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);
                return [4 /*yield*/, db
                        .select()
                        .from(securityAuditLog)
                        .where(gte(securityAuditLog.timestamp, cutoffDate))
                        .orderBy(desc(securityAuditLog.timestamp))
                        .limit(500)];
            case 1:
                logs = _c.sent();
                filtered = logs;
                if (action_1) {
                    filtered = filtered.filter(function (log) { return log.action === action_1; });
                }
                if (resourceType_1) {
                    filtered = filtered.filter(function (log) { return log.resourceType === resourceType_1; });
                }
                if (userId_1) {
                    filtered = filtered.filter(function (log) { return log.userId === userId_1; });
                }
                if (search) {
                    searchLower_1 = String(search).toLowerCase();
                    filtered = filtered.filter(function (log) {
                        var _a;
                        return log.id.toLowerCase().includes(searchLower_1) ||
                            ((_a = log.resourceId) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchLower_1));
                    });
                }
                res.json(filtered.slice(0, 100)); // Return top 100 after filtering
                return [3 /*break*/, 3];
            case 2:
                error_2 = _c.sent();
                console.error("Failed to fetch audit logs:", error_2);
                res.status(500).json({ error: "Failed to fetch audit logs" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/support-tickets
 * List support tickets with filtering
 */
router.get("/support-tickets", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status_1, priority_1, tickets, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, status_1 = _a.status, priority_1 = _a.priority;
                return [4 /*yield*/, db
                        .select()
                        .from(supportTickets)
                        .orderBy(desc(supportTickets.createdAt))
                        .limit(200)];
            case 1:
                tickets = _b.sent();
                if (status_1) {
                    tickets = tickets.filter(function (t) { return t.status === status_1; });
                }
                if (priority_1) {
                    tickets = tickets.filter(function (t) { return t.priority === priority_1; });
                }
                res.json(tickets);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                console.error("Failed to fetch support tickets:", error_3);
                res.status(500).json({ error: "Failed to fetch support tickets" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/support-tickets/:id
 * Get a single support ticket with user info
 */
router.get("/support-tickets/:id", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var ticket, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db
                        .select()
                        .from(supportTickets)
                        .where(eq(supportTickets.id, req.params.id))
                        .limit(1)];
            case 1:
                ticket = (_a.sent())[0];
                if (!ticket) {
                    return [2 /*return*/, res.status(404).json({ error: "Ticket not found" })];
                }
                res.json(ticket);
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error("Failed to fetch ticket:", error_4);
                res.status(500).json({ error: "Failed to fetch ticket" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * PATCH /api/admin/support-tickets/:id
 * Update ticket status/notes
 */
router.patch("/support-tickets/:id", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status_2, adminNotes, priority, userId, ticket, updates, updated, error_5;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                _a = req.body, status_2 = _a.status, adminNotes = _a.adminNotes, priority = _a.priority;
                userId = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || "system";
                return [4 /*yield*/, db
                        .select()
                        .from(supportTickets)
                        .where(eq(supportTickets.id, req.params.id))
                        .limit(1)];
            case 1:
                ticket = (_c.sent())[0];
                if (!ticket) {
                    return [2 /*return*/, res.status(404).json({ error: "Ticket not found" })];
                }
                updates = {
                    updatedAt: new Date(),
                };
                if (status_2)
                    updates.status = status_2;
                if (adminNotes !== undefined)
                    updates.adminNotes = adminNotes;
                if (priority)
                    updates.priority = priority;
                if (status_2 === "resolved") {
                    updates.resolvedAt = new Date();
                    updates.resolvedByAdminId = userId;
                }
                return [4 /*yield*/, db
                        .update(supportTickets)
                        .set(updates)
                        .where(eq(supportTickets.id, req.params.id))
                        .returning()];
            case 2:
                updated = _c.sent();
                return [4 /*yield*/, logAudit(userId, "ticket_updated", "support_ticket", req.params.id, "system", "internal", { changes: updates })];
            case 3:
                _c.sent();
                res.json(updated[0]);
                return [3 /*break*/, 5];
            case 4:
                error_5 = _c.sent();
                console.error("Failed to update ticket:", error_5);
                res.status(500).json({ error: "Failed to update ticket" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/moderation-events
 * List moderation events
 */
router.get("/moderation-events", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status_3, severity_1, events, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, status_3 = _a.status, severity_1 = _a.severity;
                return [4 /*yield*/, db
                        .select()
                        .from(moderationEvents)
                        .orderBy(desc(moderationEvents.createdAt))
                        .limit(200)];
            case 1:
                events = _b.sent();
                if (status_3) {
                    events = events.filter(function (e) { return e.status === status_3; });
                }
                if (severity_1) {
                    events = events.filter(function (e) { return e.severity === severity_1; });
                }
                res.json(events);
                return [3 /*break*/, 3];
            case 2:
                error_6 = _b.sent();
                console.error("Failed to fetch moderation events:", error_6);
                res.status(500).json({ error: "Failed to fetch moderation events" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/moderation-events/:id
 * Get a single moderation event
 */
router.get("/moderation-events/:id", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var event_1, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db
                        .select()
                        .from(moderationEvents)
                        .where(eq(moderationEvents.id, req.params.id))
                        .limit(1)];
            case 1:
                event_1 = (_a.sent())[0];
                if (!event_1) {
                    return [2 /*return*/, res.status(404).json({ error: "Event not found" })];
                }
                res.json(event_1);
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                console.error("Failed to fetch event:", error_7);
                res.status(500).json({ error: "Failed to fetch event" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/moderation-appeals
 * Read-only appeals registry (empty until appeals are stored)
 */
router.get("/moderation-appeals", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status_4;
    return __generator(this, function (_a) {
        try {
            status_4 = req.query.status;
            if (status_4 && !["all", "received", "reviewed"].includes(String(status_4))) {
                return [2 /*return*/, res.status(400).json({ error: "Invalid status filter" })];
            }
            res.json([]);
        }
        catch (error) {
            console.error("Failed to fetch moderation appeals:", error);
            res.status(500).json({ error: "Failed to fetch moderation appeals" });
        }
        return [2 /*return*/];
    });
}); });
/**
 * PATCH /api/admin/moderation-events/:id
 * Review and take action on moderation event
 */
router.patch("/moderation-events/:id", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status_5, actionTaken, userId, event_2, updates, updated, error_8;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                _a = req.body, status_5 = _a.status, actionTaken = _a.actionTaken;
                userId = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || "system";
                return [4 /*yield*/, db
                        .select()
                        .from(moderationEvents)
                        .where(eq(moderationEvents.id, req.params.id))
                        .limit(1)];
            case 1:
                event_2 = (_c.sent())[0];
                if (!event_2) {
                    return [2 /*return*/, res.status(404).json({ error: "Event not found" })];
                }
                updates = {};
                if (status_5)
                    updates.status = status_5;
                if (actionTaken)
                    updates.actionTaken = actionTaken;
                if (status_5 || actionTaken) {
                    updates.reviewedAt = new Date();
                    updates.reviewedByAdminId = userId;
                }
                return [4 /*yield*/, db
                        .update(moderationEvents)
                        .set(updates)
                        .where(eq(moderationEvents.id, req.params.id))
                        .returning()];
            case 2:
                updated = _c.sent();
                return [4 /*yield*/, logAudit(userId, "moderation_reviewed", "moderation_event", req.params.id, "system", "internal", { action: actionTaken, status: status_5 })];
            case 3:
                _c.sent();
                res.json(updated[0]);
                return [3 /*break*/, 5];
            case 4:
                error_8 = _c.sent();
                console.error("Failed to update moderation event:", error_8);
                res.status(500).json({ error: "Failed to update moderation event" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/admin/moderation-events
 * Create a moderation event (admin-initiated)
 */
router.post("/moderation-events", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, eventType, severity, reportedUserId, reportedResourceType, reportedResourceId, reason, description, userId, event_3, error_9;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                _a = req.body, eventType = _a.eventType, severity = _a.severity, reportedUserId = _a.reportedUserId, reportedResourceType = _a.reportedResourceType, reportedResourceId = _a.reportedResourceId, reason = _a.reason, description = _a.description;
                userId = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || "system";
                return [4 /*yield*/, db
                        .insert(moderationEvents)
                        .values({
                        eventType: eventType,
                        severity: severity || "medium",
                        reportedUserId: reportedUserId,
                        reportedResourceType: reportedResourceType,
                        reportedResourceId: reportedResourceId,
                        reason: reason,
                        description: description,
                        status: "open",
                    })
                        .returning()];
            case 1:
                event_3 = _c.sent();
                return [4 /*yield*/, logAudit(userId, "moderation_event_created", "moderation_event", event_3[0].id, "system", "internal", { eventType: eventType, reason: reason })];
            case 2:
                _c.sent();
                res.json(event_3[0]);
                return [3 /*break*/, 4];
            case 3:
                error_9 = _c.sent();
                console.error("Failed to create moderation event:", error_9);
                res.status(500).json({ error: "Failed to create moderation event" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/health
 * System health and background job status
 */
router.get("/health", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            res.json({
                status: "healthy",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: "connected",
                jobs: {
                    escalations: { lastRun: "N/A", nextRun: "scheduled" },
                    autoClose: { lastRun: "N/A", nextRun: "scheduled" },
                },
            });
        }
        catch (error) {
            res.status(503).json({ status: "unhealthy", error: String(error) });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/admin/grant-lifetime-access
 * Grant lifetime Premium access to a restaurant (no billing, forever)
 */
router.post("/grant-lifetime-access", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var adminUserId, _a, restaurantId, reason, _b, restaurants, restaurantSubscriptions, restaurant, existingSubscription, error_10;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 9, , 10]);
                adminUserId = req.user.id;
                _a = req.body, restaurantId = _a.restaurantId, reason = _a.reason;
                if (!restaurantId) {
                    return [2 /*return*/, res.status(400).json({ message: "Restaurant ID required" })];
                }
                return [4 /*yield*/, import("@shared/schema")];
            case 1:
                _b = _c.sent(), restaurants = _b.restaurants, restaurantSubscriptions = _b.restaurantSubscriptions;
                return [4 /*yield*/, db
                        .select()
                        .from(restaurants)
                        .where(eq(restaurants.id, restaurantId))
                        .limit(1)];
            case 2:
                restaurant = _c.sent();
                if (!restaurant.length) {
                    return [2 /*return*/, res.status(404).json({ message: "Restaurant not found" })];
                }
                return [4 /*yield*/, db
                        .select()
                        .from(restaurantSubscriptions)
                        .where(eq(restaurantSubscriptions.restaurantId, restaurantId))
                        .limit(1)];
            case 3:
                existingSubscription = _c.sent();
                if (!(existingSubscription.length > 0)) return [3 /*break*/, 5];
                // Update existing subscription to lifetime Premium
                return [4 /*yield*/, db
                        .update(restaurantSubscriptions)
                        .set({
                        tier: "premium",
                        status: "active",
                        isLifetimeFree: true,
                        lifetimeGrantedBy: adminUserId,
                        lifetimeGrantedAt: new Date(),
                        lifetimeReason: reason || "Admin granted lifetime access",
                        canPostVideos: true,
                        canPostDeals: true,
                        canUseFeaturedSlots: true,
                        maxFeaturedSlots: 3,
                        hasAnalytics: true,
                        hasDealScheduling: true,
                        canceledAt: null,
                        updatedAt: new Date(),
                    })
                        .where(eq(restaurantSubscriptions.id, existingSubscription[0].id))];
            case 4:
                // Update existing subscription to lifetime Premium
                _c.sent();
                return [3 /*break*/, 7];
            case 5: 
            // Create new lifetime Premium subscription
            return [4 /*yield*/, db.insert(restaurantSubscriptions).values({
                    restaurantId: restaurantId,
                    tier: "premium",
                    status: "active",
                    isLifetimeFree: true,
                    lifetimeGrantedBy: adminUserId,
                    lifetimeGrantedAt: new Date(),
                    lifetimeReason: reason || "Admin granted lifetime access",
                    canPostVideos: true,
                    canPostDeals: true,
                    canUseFeaturedSlots: true,
                    maxFeaturedSlots: 3,
                    hasAnalytics: true,
                    hasDealScheduling: true,
                })];
            case 6:
                // Create new lifetime Premium subscription
                _c.sent();
                _c.label = 7;
            case 7: 
            // Log action
            return [4 /*yield*/, logAudit(adminUserId, "grant_lifetime_access", "restaurant_subscription", restaurantId, "", "", { reason: reason })];
            case 8:
                // Log action
                _c.sent();
                res.json({
                    message: "Lifetime Premium access granted successfully",
                    restaurantId: restaurantId,
                    restaurantName: restaurant[0].name,
                });
                return [3 /*break*/, 10];
            case 9:
                error_10 = _c.sent();
                console.error("Error granting lifetime access:", error_10);
                res.status(500).json({ message: "Failed to grant lifetime access" });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
// Manual user onboarding - create any user type with temp password
router.post("/users/create", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, firstName, lastName, phone, userType, tempPassword, validUserTypes, existingUser, password, passwordHash, userData, user, error_11;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, email = _a.email, firstName = _a.firstName, lastName = _a.lastName, phone = _a.phone, userType = _a.userType, tempPassword = _a.tempPassword;
                if (!email || !userType) {
                    return [2 /*return*/, res.status(400).json({
                            message: "Email and userType are required",
                        })];
                }
                validUserTypes = [
                    "customer",
                    "restaurant_owner",
                    "food_truck",
                    "host",
                    "event_coordinator",
                    "staff",
                    "admin",
                    "super_admin",
                ];
                if (!validUserTypes.includes(userType)) {
                    return [2 /*return*/, res.status(400).json({ message: "Invalid user type" })];
                }
                return [4 /*yield*/, storage.getUserByEmail(email)];
            case 1:
                existingUser = _b.sent();
                if (existingUser) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "User with this email already exists" })];
                }
                password = tempPassword || "Temp".concat(Math.random().toString(36).slice(2, 10), "!");
                return [4 /*yield*/, bcrypt.hash(password, 10)];
            case 2:
                passwordHash = _b.sent();
                userData = {
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone || "",
                    passwordHash: passwordHash,
                };
                return [4 /*yield*/, storage.upsertUserByAuth("email", userData, userType)];
            case 3:
                user = _b.sent();
                // Mark as needing password reset
                return [4 /*yield*/, storage.updateUserPassword(user.id, passwordHash, true)];
            case 4:
                // Mark as needing password reset
                _b.sent();
                res.status(201).json({
                    message: "User created successfully",
                    user: { id: user.id, email: user.email, userType: user.userType },
                    tempPassword: password,
                });
                return [3 /*break*/, 6];
            case 5:
                error_11 = _b.sent();
                console.error("Error creating user manually:", error_11);
                res.status(500).json({ message: "Failed to create user" });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Create host profile with geocoded address
router.post("/hosts/create", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, businessName, address, locationType, latitude, longitude, amenities, contactPhone, notes, user, existingHost, hostData, host, error_12;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, userId = _a.userId, businessName = _a.businessName, address = _a.address, locationType = _a.locationType, latitude = _a.latitude, longitude = _a.longitude, amenities = _a.amenities, contactPhone = _a.contactPhone, notes = _a.notes;
                if (!userId || !businessName || !address || !locationType) {
                    return [2 /*return*/, res.status(400).json({
                            message: "userId, businessName, address, and locationType are required",
                        })];
                }
                return [4 /*yield*/, storage.getUser(userId)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                }
                return [4 /*yield*/, storage.getHostByUserId(userId)];
            case 2:
                existingHost = _b.sent();
                if (existingHost) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "Host profile already exists for this user" })];
                }
                hostData = {
                    userId: userId,
                    businessName: businessName,
                    address: address,
                    locationType: locationType,
                    amenities: amenities || null,
                    contactPhone: contactPhone || null,
                    notes: notes || null,
                    isVerified: true,
                    adminCreated: true,
                };
                // Add geocoding if provided
                if (latitude !== undefined && longitude !== undefined) {
                    hostData.latitude = latitude.toString();
                    hostData.longitude = longitude.toString();
                }
                return [4 /*yield*/, storage.createHost(hostData)];
            case 3:
                host = _b.sent();
                res.status(201).json({
                    message: "Host profile created successfully",
                    host: host,
                });
                return [3 /*break*/, 5];
            case 4:
                error_12 = _b.sent();
                console.error("Error creating host manually:", error_12);
                res.status(500).json({ message: "Failed to create host profile" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Delete user (super admin only)
router.delete("/users/:userId", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, user, SUPER_ADMIN_EMAIL, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId = req.params.userId;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ message: "User ID is required" })];
                }
                return [4 /*yield*/, storage.getUser(userId)];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                }
                SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info.mealscout@gmail.com";
                if (user.email === SUPER_ADMIN_EMAIL) {
                    return [2 /*return*/, res
                            .status(403)
                            .json({ message: "Cannot delete super admin account" })];
                }
                // Prevent deleting yourself
                if (user.id === req.user.id) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "Cannot delete your own account" })];
                }
                return [4 /*yield*/, storage.deleteUser(userId)];
            case 2:
                _a.sent();
                return [4 /*yield*/, logAudit(req.user.id, "admin_user_deleted", "user", userId, req.ip, req.headers["user-agent"], {})];
            case 3:
                _a.sent();
                res.json({ message: "User deleted successfully" });
                return [3 /*break*/, 5];
            case 4:
                error_13 = _a.sent();
                console.error("Error deleting user:", error_13);
                res.status(500).json({ message: "Failed to delete user" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/lifetime-restaurants
 * List all restaurants with lifetime free access
 */
router.get("/lifetime-restaurants", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, restaurants, restaurantSubscriptions, lifetimeRestaurants, error_14;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, import("@shared/schema")];
            case 1:
                _a = _b.sent(), restaurants = _a.restaurants, restaurantSubscriptions = _a.restaurantSubscriptions;
                return [4 /*yield*/, db
                        .select({
                        subscriptionId: restaurantSubscriptions.id,
                        restaurantId: restaurantSubscriptions.restaurantId,
                        restaurantName: restaurants.name,
                        lifetimeGrantedAt: restaurantSubscriptions.lifetimeGrantedAt,
                        lifetimeReason: restaurantSubscriptions.lifetimeReason,
                        grantedByAdminId: restaurantSubscriptions.lifetimeGrantedBy,
                    })
                        .from(restaurantSubscriptions)
                        .innerJoin(restaurants, eq(restaurantSubscriptions.restaurantId, restaurants.id))
                        .where(eq(restaurantSubscriptions.isLifetimeFree, true))
                        .orderBy(desc(restaurantSubscriptions.lifetimeGrantedAt))];
            case 2:
                lifetimeRestaurants = _b.sent();
                res.json({ restaurants: lifetimeRestaurants });
                return [3 /*break*/, 4];
            case 3:
                error_14 = _b.sent();
                console.error("Error fetching lifetime restaurants:", error_14);
                res.status(500).json({ message: "Failed to fetch lifetime restaurants" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * DELETE /api/admin/revoke-lifetime-access/:restaurantId
 * Revoke lifetime access and revert to free tier
 */
router.delete("/revoke-lifetime-access/:restaurantId", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var adminUserId, restaurantId, restaurantSubscriptions, subscription, error_15;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                adminUserId = req.user.id;
                restaurantId = req.params.restaurantId;
                return [4 /*yield*/, import("@shared/schema")];
            case 1:
                restaurantSubscriptions = (_a.sent()).restaurantSubscriptions;
                return [4 /*yield*/, db
                        .select()
                        .from(restaurantSubscriptions)
                        .where(eq(restaurantSubscriptions.restaurantId, restaurantId))
                        .limit(1)];
            case 2:
                subscription = _a.sent();
                if (!subscription.length) {
                    return [2 /*return*/, res.status(404).json({ message: "Subscription not found" })];
                }
                // Revert to free tier
                return [4 /*yield*/, db
                        .update(restaurantSubscriptions)
                        .set({
                        tier: "free",
                        isLifetimeFree: false,
                        lifetimeGrantedBy: null,
                        lifetimeGrantedAt: null,
                        lifetimeReason: null,
                        canPostDeals: false,
                        canUseFeaturedSlots: false,
                        maxFeaturedSlots: 0,
                        hasAnalytics: false,
                        hasDealScheduling: false,
                        updatedAt: new Date(),
                    })
                        .where(eq(restaurantSubscriptions.id, subscription[0].id))];
            case 3:
                // Revert to free tier
                _a.sent();
                // Log action
                return [4 /*yield*/, logAudit(adminUserId, "revoke_lifetime_access", "restaurant_subscription", restaurantId, "", "", {})];
            case 4:
                // Log action
                _a.sent();
                res.json({ message: "Lifetime access revoked successfully" });
                return [3 /*break*/, 6];
            case 5:
                error_15 = _a.sent();
                console.error("Error revoking lifetime access:", error_15);
                res.status(500).json({ message: "Failed to revoke lifetime access" });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/admin/reported-videos
 * Get all reported videos for moderation
 */
router.get("/reported-videos", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status_6, _a, videoStoryReports, videoStories, reports, error_16;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                status_6 = req.query.status || "pending";
                return [4 /*yield*/, import("@shared/schema")];
            case 1:
                _a = _b.sent(), videoStoryReports = _a.videoStoryReports, videoStories = _a.videoStories;
                return [4 /*yield*/, db
                        .select({
                        reportId: videoStoryReports.id,
                        storyId: videoStoryReports.storyId,
                        storyTitle: videoStories.title,
                        storyUrl: videoStories.videoUrl,
                        reportedBy: users.email,
                        reason: videoStoryReports.reason,
                        description: videoStoryReports.description,
                        status: videoStoryReports.status,
                        createdAt: videoStoryReports.createdAt,
                    })
                        .from(videoStoryReports)
                        .innerJoin(videoStories, eq(videoStoryReports.storyId, videoStories.id))
                        .innerJoin(users, eq(videoStoryReports.reportedByUserId, users.id))
                        .where(eq(videoStoryReports.status, status_6))
                        .orderBy(desc(videoStoryReports.createdAt))];
            case 2:
                reports = _b.sent();
                res.json({ reports: reports });
                return [3 /*break*/, 4];
            case 3:
                error_16 = _b.sent();
                console.error("Error fetching reported videos:", error_16);
                res.status(500).json({ message: "Failed to fetch reported videos" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/admin/review-report/:reportId
 * Review and take action on a video report (takedown or dismiss)
 */
router.post("/review-report/:reportId", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var adminUserId, reportId, _a, action, notes, _b, videoStoryReports, videoStories, report, error_17;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 9, , 10]);
                adminUserId = req.user.id;
                reportId = req.params.reportId;
                _a = req.body, action = _a.action, notes = _a.notes;
                return [4 /*yield*/, import("@shared/schema")];
            case 1:
                _b = _c.sent(), videoStoryReports = _b.videoStoryReports, videoStories = _b.videoStories;
                if (!action || !["takedown", "dismiss"].includes(action)) {
                    return [2 /*return*/, res.status(400).json({ message: "Invalid action" })];
                }
                return [4 /*yield*/, db
                        .select()
                        .from(videoStoryReports)
                        .where(eq(videoStoryReports.id, reportId))
                        .limit(1)];
            case 2:
                report = _c.sent();
                if (!report.length) {
                    return [2 /*return*/, res.status(404).json({ message: "Report not found" })];
                }
                if (!(action === "takedown")) return [3 /*break*/, 5];
                // Take down the video
                return [4 /*yield*/, db
                        .update(videoStories)
                        .set({
                        status: "expired",
                        deletedAt: new Date(),
                    })
                        .where(eq(videoStories.id, report[0].storyId))];
            case 3:
                // Take down the video
                _c.sent();
                // Update all reports for this video
                return [4 /*yield*/, db
                        .update(videoStoryReports)
                        .set({
                        status: "action_taken",
                        reviewedByAdminId: adminUserId,
                        reviewedAt: new Date(),
                        adminNotes: notes || "Video taken down by admin",
                    })
                        .where(eq(videoStoryReports.storyId, report[0].storyId))];
            case 4:
                // Update all reports for this video
                _c.sent();
                return [3 /*break*/, 7];
            case 5: 
            // Dismiss report
            return [4 /*yield*/, db
                    .update(videoStoryReports)
                    .set({
                    status: "dismissed",
                    reviewedByAdminId: adminUserId,
                    reviewedAt: new Date(),
                    adminNotes: notes || "Report dismissed",
                })
                    .where(eq(videoStoryReports.id, reportId))];
            case 6:
                // Dismiss report
                _c.sent();
                _c.label = 7;
            case 7: 
            // Log action
            return [4 /*yield*/, logAudit(adminUserId, "video_report_".concat(action), "video_story", report[0].storyId, "", "", { reportId: reportId, notes: notes })];
            case 8:
                // Log action
                _c.sent();
                res.json({
                    message: "Report ".concat(action === "takedown" ? "processed and video taken down" : "dismissed"),
                });
                return [3 /*break*/, 10];
            case 9:
                error_17 = _c.sent();
                console.error("Error reviewing report:", error_17);
                res.status(500).json({ message: "Failed to review report" });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
// Manual user onboarding - admin/staff can create any user type
router.post("/users/create", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, firstName, lastName, phone, userType, tempPassword, validUserTypes, existingUser, password, passwordHash, userData, user, error_18;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, email = _a.email, firstName = _a.firstName, lastName = _a.lastName, phone = _a.phone, userType = _a.userType, tempPassword = _a.tempPassword;
                if (!email || !userType) {
                    return [2 /*return*/, res.status(400).json({
                            message: "Email and userType are required",
                        })];
                }
                validUserTypes = [
                    "customer",
                    "restaurant_owner",
                    "food_truck",
                    "host",
                    "event_coordinator",
                    "staff",
                    "admin",
                    "super_admin",
                ];
                if (!validUserTypes.includes(userType)) {
                    return [2 /*return*/, res.status(400).json({ message: "Invalid user type" })];
                }
                return [4 /*yield*/, storage.getUserByEmail(email)];
            case 1:
                existingUser = _b.sent();
                if (existingUser) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "User with this email already exists" })];
                }
                password = tempPassword || "Temp".concat(Math.random().toString(36).slice(2, 10), "!");
                return [4 /*yield*/, bcrypt.hash(password, 10)];
            case 2:
                passwordHash = _b.sent();
                userData = {
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone || "",
                    passwordHash: passwordHash,
                };
                return [4 /*yield*/, storage.upsertUserByAuth("email", userData, userType)];
            case 3:
                user = _b.sent();
                return [4 /*yield*/, storage.updateUserPassword(user.id, passwordHash, true)];
            case 4:
                _b.sent();
                return [4 /*yield*/, logAudit(req.user.id, "admin_user_created", "user", user.id, req.ip, req.headers["user-agent"], { userType: userType })];
            case 5:
                _b.sent();
                res.status(201).json({
                    message: "User created successfully",
                    user: { id: user.id, email: user.email, userType: user.userType },
                    tempPassword: password,
                });
                return [3 /*break*/, 7];
            case 6:
                error_18 = _b.sent();
                console.error("Error creating user manually:", error_18);
                res.status(500).json({ message: "Failed to create user" });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Create host profile with geocoding
router.post("/hosts/create", isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, businessName, address, locationType, latitude, longitude, amenities, contactPhone, notes, user, existingHost, hostData, host, error_19;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, userId = _a.userId, businessName = _a.businessName, address = _a.address, locationType = _a.locationType, latitude = _a.latitude, longitude = _a.longitude, amenities = _a.amenities, contactPhone = _a.contactPhone, notes = _a.notes;
                if (!userId || !businessName || !address || !locationType) {
                    return [2 /*return*/, res.status(400).json({
                            message: "userId, businessName, address, and locationType are required",
                        })];
                }
                return [4 /*yield*/, storage.getUser(userId)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                }
                return [4 /*yield*/, storage.getHostByUserId(userId)];
            case 2:
                existingHost = _b.sent();
                if (existingHost) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "Host profile already exists for this user" })];
                }
                hostData = {
                    userId: userId,
                    businessName: businessName,
                    address: address,
                    locationType: locationType,
                    amenities: amenities || null,
                    contactPhone: contactPhone || null,
                    notes: notes || null,
                    isVerified: true,
                    adminCreated: true,
                };
                if (latitude !== undefined && longitude !== undefined) {
                    hostData.latitude = latitude.toString();
                    hostData.longitude = longitude.toString();
                }
                return [4 /*yield*/, storage.createHost(hostData)];
            case 3:
                host = _b.sent();
                return [4 /*yield*/, logAudit(req.user.id, "admin_host_created", "host", host.id, req.ip, req.headers["user-agent"], { userId: userId })];
            case 4:
                _b.sent();
                res
                    .status(201)
                    .json({ message: "Host profile created successfully", host: host });
                return [3 /*break*/, 6];
            case 5:
                error_19 = _b.sent();
                console.error("Error creating host manually:", error_19);
                res.status(500).json({ message: "Failed to create host profile" });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
export default router;

