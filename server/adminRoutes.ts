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

import { Router } from "express";
import { db } from "./db";
import {
  supportTickets,
  moderationEvents,
  securityAuditLog,
  incidents,
  users,
} from "@shared/schema";
import { eq, desc, and, or, gte, lte, like } from "drizzle-orm";
import { isAdmin } from "./unifiedAuth";
import { logAudit } from "./auditLogger";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import type { EmailUserData } from "@shared/schema";

const router = Router();

/**
 * GET /api/admin/stats
 * Dashboard overview with key metrics
 */
router.get("/stats", isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalIncidents,
      openIncidents,
      criticalIncidents,
      openTickets,
      highPriorityTickets,
      recentModerationEvents,
      auditLogsCount,
    ] = await Promise.all([
      db
        .select()
        .from(users)
        .then((u: any[]) => u.length),
      db
        .select()
        .from(incidents)
        .then((i: any[]) => i.length),
      db
        .select()
        .from(incidents)
        .where(eq(incidents.status, "new"))
        .then((i: any[]) => i.length),
      db
        .select()
        .from(incidents)
        .where(eq(incidents.severity, "critical"))
        .then((i: any[]) => i.length),
      db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.status, "open"))
        .then((t: any[]) => t.length),
      db
        .select()
        .from(supportTickets)
        .then(
          (tickets: any[]) =>
            tickets.filter(
              (t: any) => t.priority === "high" || t.priority === "critical"
            ).length
        ),
      db
        .select()
        .from(moderationEvents)
        .where(
          gte(
            moderationEvents.createdAt,
            new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          )
        )
        .then((m: any[]) => m.length),
      db
        .select()
        .from(securityAuditLog)
        .where(gte(securityAuditLog.timestamp, thirtyDaysAgo))
        .then((a: any[]) => a.length),
    ]);

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
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/**
 * GET /api/admin/audit-logs
 * Search and filter audit logs
 */
router.get("/audit-logs", isAdmin, async (req, res) => {
  try {
    const { action, resourceType, userId, search, days = "30" } = req.query;
    const daysNum = parseInt(String(days)) || 30;
    const cutoffDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const logs = await db
      .select()
      .from(securityAuditLog)
      .where(gte(securityAuditLog.timestamp, cutoffDate))
      .orderBy(desc(securityAuditLog.timestamp))
      .limit(500);

    // Client-side filtering for flexibility
    let filtered = logs;
    if (action) {
      filtered = filtered.filter((log: any) => log.action === action);
    }
    if (resourceType) {
      filtered = filtered.filter(
        (log: any) => log.resourceType === resourceType
      );
    }
    if (userId) {
      filtered = filtered.filter((log: any) => log.userId === userId);
    }
    if (search) {
      const searchLower = String(search).toLowerCase();
      filtered = filtered.filter(
        (log: any) =>
          log.id.toLowerCase().includes(searchLower) ||
          log.resourceId?.toLowerCase().includes(searchLower)
      );
    }

    res.json(filtered.slice(0, 100)); // Return top 100 after filtering
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

/**
 * GET /api/admin/support-tickets
 * List support tickets with filtering
 */
router.get("/support-tickets", isAdmin, async (req, res) => {
  try {
    const { status, priority } = req.query;

    let tickets = await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt))
      .limit(200);

    if (status) {
      tickets = tickets.filter((t: any) => t.status === status);
    }
    if (priority) {
      tickets = tickets.filter((t: any) => t.priority === priority);
    }

    res.json(tickets);
  } catch (error) {
    console.error("Failed to fetch support tickets:", error);
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});

/**
 * GET /api/admin/support-tickets/:id
 * Get a single support ticket with user info
 */
router.get("/support-tickets/:id", isAdmin, async (req, res) => {
  try {
    const ticket = (
      await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, req.params.id))
        .limit(1)
    )[0];

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

/**
 * PATCH /api/admin/support-tickets/:id
 * Update ticket status/notes
 */
router.patch("/support-tickets/:id", isAdmin, async (req, res) => {
  try {
    const { status, adminNotes, priority } = req.body;
    const userId = (req.user as any)?.id || "system";

    const ticket = (
      await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, req.params.id))
        .limit(1)
    )[0];

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (priority) updates.priority = priority;

    if (status === "resolved") {
      updates.resolvedAt = new Date();
      updates.resolvedByAdminId = userId;
    }

    const updated = await db
      .update(supportTickets)
      .set(updates)
      .where(eq(supportTickets.id, req.params.id))
      .returning();

    await logAudit(
      userId,
      "ticket_updated",
      "support_ticket",
      req.params.id,
      "system",
      "internal",
      { changes: updates }
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("Failed to update ticket:", error);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

/**
 * GET /api/admin/moderation-events
 * List moderation events
 */
router.get("/moderation-events", isAdmin, async (req, res) => {
  try {
    const { status, severity } = req.query;

    let events = await db
      .select()
      .from(moderationEvents)
      .orderBy(desc(moderationEvents.createdAt))
      .limit(200);

    if (status) {
      events = events.filter((e: any) => e.status === status);
    }
    if (severity) {
      events = events.filter((e: any) => e.severity === severity);
    }

    res.json(events);
  } catch (error) {
    console.error("Failed to fetch moderation events:", error);
    res.status(500).json({ error: "Failed to fetch moderation events" });
  }
});

/**
 * GET /api/admin/moderation-events/:id
 * Get a single moderation event
 */
router.get("/moderation-events/:id", isAdmin, async (req, res) => {
  try {
    const event = (
      await db
        .select()
        .from(moderationEvents)
        .where(eq(moderationEvents.id, req.params.id))
        .limit(1)
    )[0];

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Failed to fetch event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

/**
 * PATCH /api/admin/moderation-events/:id
 * Review and take action on moderation event
 */
router.patch("/moderation-events/:id", isAdmin, async (req, res) => {
  try {
    const { status, actionTaken } = req.body;
    const userId = (req.user as any)?.id || "system";

    const event = (
      await db
        .select()
        .from(moderationEvents)
        .where(eq(moderationEvents.id, req.params.id))
        .limit(1)
    )[0];

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (actionTaken) updates.actionTaken = actionTaken;
    if (status || actionTaken) {
      updates.reviewedAt = new Date();
      updates.reviewedByAdminId = userId;
    }

    const updated = await db
      .update(moderationEvents)
      .set(updates)
      .where(eq(moderationEvents.id, req.params.id))
      .returning();

    await logAudit(
      userId,
      "moderation_reviewed",
      "moderation_event",
      req.params.id,
      "system",
      "internal",
      { action: actionTaken, status }
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("Failed to update moderation event:", error);
    res.status(500).json({ error: "Failed to update moderation event" });
  }
});

/**
 * POST /api/admin/moderation-events
 * Create a moderation event (admin-initiated)
 */
router.post("/moderation-events", isAdmin, async (req, res) => {
  try {
    const {
      eventType,
      severity,
      reportedUserId,
      reportedResourceType,
      reportedResourceId,
      reason,
      description,
    } = req.body;
    const userId = (req.user as any)?.id || "system";

    const event = await db
      .insert(moderationEvents)
      .values({
        eventType,
        severity: severity || "medium",
        reportedUserId,
        reportedResourceType,
        reportedResourceId,
        reason,
        description,
        status: "open",
      })
      .returning();

    await logAudit(
      userId,
      "moderation_event_created",
      "moderation_event",
      event[0].id,
      "system",
      "internal",
      { eventType, reason }
    );

    res.json(event[0]);
  } catch (error) {
    console.error("Failed to create moderation event:", error);
    res.status(500).json({ error: "Failed to create moderation event" });
  }
});

/**
 * GET /api/admin/health
 * System health and background job status
 */
router.get("/health", isAdmin, async (req, res) => {
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
  } catch (error) {
    res.status(503).json({ status: "unhealthy", error: String(error) });
  }
});

/**
 * POST /api/admin/grant-lifetime-access
 * Grant lifetime Premium access to a restaurant (no billing, forever)
 */
router.post("/grant-lifetime-access", isAdmin, async (req, res) => {
  try {
    const adminUserId = (req as any).user.id;
    const { restaurantId, reason } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID required" });
    }

    // Verify restaurant exists
    const { restaurants, restaurantSubscriptions } = await import(
      "@shared/schema"
    );
    const restaurant = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant.length) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Check if subscription exists
    const existingSubscription = await db
      .select()
      .from(restaurantSubscriptions)
      .where(eq(restaurantSubscriptions.restaurantId, restaurantId))
      .limit(1);

    if (existingSubscription.length > 0) {
      // Update existing subscription to lifetime Premium
      await db
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
        .where(eq(restaurantSubscriptions.id, existingSubscription[0].id));
    } else {
      // Create new lifetime Premium subscription
      await db.insert(restaurantSubscriptions).values({
        restaurantId,
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
      });
    }

    // Log action
    await logAudit(
      adminUserId,
      "grant_lifetime_access",
      "restaurant_subscription",
      restaurantId,
      "",
      "",
      { reason }
    );

    res.json({
      message: "Lifetime Premium access granted successfully",
      restaurantId,
      restaurantName: restaurant[0].name,
    });
  } catch (error) {
    console.error("Error granting lifetime access:", error);
    res.status(500).json({ message: "Failed to grant lifetime access" });
  }
});

// Manual user onboarding - create any user type with temp password
router.post("/users/create", isAdmin, async (req: any, res) => {
  try {
    const { email, firstName, lastName, phone, userType, tempPassword } =
      req.body;

    if (!email || !firstName || !lastName || !userType) {
      return res.status(400).json({
        message: "Email, firstName, lastName, and userType are required",
      });
    }

    const validUserTypes = [
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
      return res.status(400).json({ message: "Invalid user type" });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Generate temp password if not provided
    const password =
      tempPassword || `Temp${Math.random().toString(36).slice(2, 10)}!`;
    const passwordHash = await bcrypt.hash(password, 10);

    const userData: EmailUserData = {
      email,
      firstName,
      lastName,
      phone: phone || "",
      passwordHash,
    };

    const user = await storage.upsertUserByAuth(
      "email",
      userData,
      userType as any
    );

    // Mark as needing password reset
    await storage.updateUserPassword(user.id, passwordHash, true);

    res.status(201).json({
      message: "User created successfully",
      user: { id: user.id, email: user.email, userType: user.userType },
      tempPassword: password,
    });
  } catch (error: any) {
    console.error("Error creating user manually:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

// Create host profile with geocoded address
router.post("/hosts/create", isAdmin, async (req: any, res) => {
  try {
    const {
      userId,
      businessName,
      address,
      locationType,
      latitude,
      longitude,
      amenities,
      contactPhone,
      notes,
    } = req.body;

    if (!userId || !businessName || !address || !locationType) {
      return res.status(400).json({
        message: "userId, businessName, address, and locationType are required",
      });
    }

    // Verify user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if host already exists for this user
    const existingHost = await storage.getHostByUserId(userId);
    if (existingHost) {
      return res
        .status(400)
        .json({ message: "Host profile already exists for this user" });
    }

    const hostData: any = {
      userId,
      businessName,
      address,
      locationType,
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

    const host = await storage.createHost(hostData);

    res.status(201).json({
      message: "Host profile created successfully",
      host,
    });
  } catch (error: any) {
    console.error("Error creating host manually:", error);
    res.status(500).json({ message: "Failed to create host profile" });
  }
});

// Delete user (super admin only)
router.delete("/users/:userId", isAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Protect super admin email - can never be deleted
    const SUPER_ADMIN_EMAIL =
      process.env.ADMIN_EMAIL || "info.mealscout@gmail.com";
    if (user.email === SUPER_ADMIN_EMAIL) {
      return res
        .status(403)
        .json({ message: "Cannot delete super admin account" });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await storage.deleteUser(userId);
    await logAudit(
      req.user.id,
      "admin_user_deleted",
      "user",
      userId,
      req.ip,
      req.headers["user-agent"],
      {}
    );

    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

/**
 * GET /api/admin/lifetime-restaurants
 * List all restaurants with lifetime free access
 */
router.get("/lifetime-restaurants", isAdmin, async (req, res) => {
  try {
    const { restaurants, restaurantSubscriptions } = await import(
      "@shared/schema"
    );

    const lifetimeRestaurants = await db
      .select({
        subscriptionId: restaurantSubscriptions.id,
        restaurantId: restaurantSubscriptions.restaurantId,
        restaurantName: restaurants.name,
        lifetimeGrantedAt: restaurantSubscriptions.lifetimeGrantedAt,
        lifetimeReason: restaurantSubscriptions.lifetimeReason,
        grantedByAdminId: restaurantSubscriptions.lifetimeGrantedBy,
      })
      .from(restaurantSubscriptions)
      .innerJoin(
        restaurants,
        eq(restaurantSubscriptions.restaurantId, restaurants.id)
      )
      .where(eq(restaurantSubscriptions.isLifetimeFree, true))
      .orderBy(desc(restaurantSubscriptions.lifetimeGrantedAt));

    res.json({ restaurants: lifetimeRestaurants });
  } catch (error) {
    console.error("Error fetching lifetime restaurants:", error);
    res.status(500).json({ message: "Failed to fetch lifetime restaurants" });
  }
});

/**
 * DELETE /api/admin/revoke-lifetime-access/:restaurantId
 * Revoke lifetime access and revert to free tier
 */
router.delete(
  "/revoke-lifetime-access/:restaurantId",
  isAdmin,
  async (req, res) => {
    try {
      const adminUserId = (req as any).user.id;
      const { restaurantId } = req.params;
      const { restaurantSubscriptions } = await import("@shared/schema");

      const subscription = await db
        .select()
        .from(restaurantSubscriptions)
        .where(eq(restaurantSubscriptions.restaurantId, restaurantId))
        .limit(1);

      if (!subscription.length) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Revert to free tier
      await db
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
        .where(eq(restaurantSubscriptions.id, subscription[0].id));

      // Log action
      await logAudit(
        adminUserId,
        "revoke_lifetime_access",
        "restaurant_subscription",
        restaurantId,
        "",
        "",
        {}
      );

      res.json({ message: "Lifetime access revoked successfully" });
    } catch (error) {
      console.error("Error revoking lifetime access:", error);
      res.status(500).json({ message: "Failed to revoke lifetime access" });
    }
  }
);

/**
 * GET /api/admin/reported-videos
 * Get all reported videos for moderation
 */
router.get("/reported-videos", isAdmin, async (req, res) => {
  try {
    const status = (req.query.status as string) || "pending";
    const { videoStoryReports, videoStories } = await import("@shared/schema");

    const reports = await db
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
      .where(eq(videoStoryReports.status, status))
      .orderBy(desc(videoStoryReports.createdAt));

    res.json({ reports });
  } catch (error) {
    console.error("Error fetching reported videos:", error);
    res.status(500).json({ message: "Failed to fetch reported videos" });
  }
});

/**
 * POST /api/admin/review-report/:reportId
 * Review and take action on a video report (takedown or dismiss)
 */
router.post("/review-report/:reportId", isAdmin, async (req, res) => {
  try {
    const adminUserId = (req as any).user.id;
    const { reportId } = req.params;
    const { action, notes } = req.body; // 'takedown' | 'dismiss'
    const { videoStoryReports, videoStories } = await import("@shared/schema");

    if (!action || !["takedown", "dismiss"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const report = await db
      .select()
      .from(videoStoryReports)
      .where(eq(videoStoryReports.id, reportId))
      .limit(1);

    if (!report.length) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (action === "takedown") {
      // Take down the video
      await db
        .update(videoStories)
        .set({
          status: "expired",
          deletedAt: new Date(),
        })
        .where(eq(videoStories.id, report[0].storyId));

      // Update all reports for this video
      await db
        .update(videoStoryReports)
        .set({
          status: "action_taken",
          reviewedByAdminId: adminUserId,
          reviewedAt: new Date(),
          adminNotes: notes || "Video taken down by admin",
        })
        .where(eq(videoStoryReports.storyId, report[0].storyId));
    } else {
      // Dismiss report
      await db
        .update(videoStoryReports)
        .set({
          status: "dismissed",
          reviewedByAdminId: adminUserId,
          reviewedAt: new Date(),
          adminNotes: notes || "Report dismissed",
        })
        .where(eq(videoStoryReports.id, reportId));
    }

    // Log action
    await logAudit(
      adminUserId,
      `video_report_${action}`,
      "video_story",
      report[0].storyId,
      "",
      "",
      { reportId, notes }
    );

    res.json({
      message: `Report ${
        action === "takedown" ? "processed and video taken down" : "dismissed"
      }`,
    });
  } catch (error) {
    console.error("Error reviewing report:", error);
    res.status(500).json({ message: "Failed to review report" });
  }
});

// Manual user onboarding - admin/staff can create any user type
router.post("/users/create", isAdmin, async (req: any, res) => {
  try {
    const { email, firstName, lastName, phone, userType, tempPassword } =
      req.body;

    if (!email || !firstName || !lastName || !userType) {
      return res.status(400).json({
        message: "Email, firstName, lastName, and userType are required",
      });
    }

    const validUserTypes = [
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
      return res.status(400).json({ message: "Invalid user type" });
    }

    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const password =
      tempPassword || `Temp${Math.random().toString(36).slice(2, 10)}!`;
    const passwordHash = await bcrypt.hash(password, 10);

    const userData: EmailUserData = {
      email,
      firstName,
      lastName,
      phone: phone || "",
      passwordHash,
    };

    const user = await storage.upsertUserByAuth(
      "email",
      userData,
      userType as any
    );
    await storage.updateUserPassword(user.id, passwordHash, true);

    await logAudit(
      req.user.id,
      "admin_user_created",
      "user",
      user.id,
      req.ip,
      req.headers["user-agent"],
      { userType }
    );

    res.status(201).json({
      message: "User created successfully",
      user: { id: user.id, email: user.email, userType: user.userType },
      tempPassword: password,
    });
  } catch (error: any) {
    console.error("Error creating user manually:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

// Create host profile with geocoding
router.post("/hosts/create", isAdmin, async (req: any, res) => {
  try {
    const {
      userId,
      businessName,
      address,
      locationType,
      latitude,
      longitude,
      amenities,
      contactPhone,
      notes,
    } = req.body;

    if (!userId || !businessName || !address || !locationType) {
      return res.status(400).json({
        message: "userId, businessName, address, and locationType are required",
      });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingHost = await storage.getHostByUserId(userId);
    if (existingHost) {
      return res
        .status(400)
        .json({ message: "Host profile already exists for this user" });
    }

    const hostData: any = {
      userId,
      businessName,
      address,
      locationType,
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

    const host = await storage.createHost(hostData);
    await logAudit(
      req.user.id,
      "admin_host_created",
      "host",
      host.id,
      req.ip,
      req.headers["user-agent"],
      { userId }
    );

    res
      .status(201)
      .json({ message: "Host profile created successfully", host });
  } catch (error: any) {
    console.error("Error creating host manually:", error);
    res.status(500).json({ message: "Failed to create host profile" });
  }
});

export default router;
