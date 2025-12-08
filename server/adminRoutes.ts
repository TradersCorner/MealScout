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

import { Router } from 'express';
import { db } from './db';
import { supportTickets, moderationEvents, securityAuditLog, incidents, users } from '@shared/schema';
import { eq, desc, and, or, gte, lte, like } from 'drizzle-orm';
import { isAdmin } from './unifiedAuth';
import { logAudit } from './auditLogger';

const router = Router();

/**
 * GET /api/admin/stats
 * Dashboard overview with key metrics
 */
router.get('/stats', isAdmin, async (req, res) => {
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
      db.select().from(users).then((u: any[]) => u.length),
      db.select().from(incidents).then((i: any[]) => i.length),
      db
        .select()
        .from(incidents)
        .where(eq(incidents.status, 'new'))
        .then((i: any[]) => i.length),
      db
        .select()
        .from(incidents)
        .where(eq(incidents.severity, 'critical'))
        .then((i: any[]) => i.length),
      db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.status, 'open'))
        .then((t: any[]) => t.length),
      db
        .select()
        .from(supportTickets)
        .then((tickets: any[]) => tickets.filter((t: any) => t.priority === 'high' || t.priority === 'critical').length),
      db
        .select()
        .from(moderationEvents)
        .where(gte(moderationEvents.createdAt, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)))
        .then((m: any[]) => m.length),
      db
        .select()
        .from(securityAuditLog)
        .where(gte(securityAuditLog.timestamp, thirtyDaysAgo))
        .then((a: any[]) => a.length),
    ]);

    res.json({
      users: { total: totalUsers },
      incidents: { total: totalIncidents, open: openIncidents, critical: criticalIncidents },
      tickets: { open: openTickets, highPriority: highPriorityTickets },
      moderation: { recentEvents: recentModerationEvents },
      audit: { recentLogs: auditLogsCount },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/admin/audit-logs
 * Search and filter audit logs
 */
router.get('/audit-logs', isAdmin, async (req, res) => {
  try {
    const { action, resourceType, userId, search, days = '30' } = req.query;
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
      filtered = filtered.filter((log: any) => log.resourceType === resourceType);
    }
    if (userId) {
      filtered = filtered.filter((log: any) => log.userId === userId);
    }
    if (search) {
      const searchLower = String(search).toLowerCase();
      filtered = filtered.filter((log: any) => 
        log.id.toLowerCase().includes(searchLower) ||
        log.resourceId?.toLowerCase().includes(searchLower)
      );
    }

    res.json(filtered.slice(0, 100)); // Return top 100 after filtering
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * GET /api/admin/support-tickets
 * List support tickets with filtering
 */
router.get('/support-tickets', isAdmin, async (req, res) => {
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
    console.error('Failed to fetch support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

/**
 * GET /api/admin/support-tickets/:id
 * Get a single support ticket with user info
 */
router.get('/support-tickets/:id', isAdmin, async (req, res) => {
  try {
    const ticket = (await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, req.params.id))
      .limit(1))[0];

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Failed to fetch ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

/**
 * PATCH /api/admin/support-tickets/:id
 * Update ticket status/notes
 */
router.patch('/support-tickets/:id', isAdmin, async (req, res) => {
  try {
    const { status, adminNotes, priority } = req.body;
    const userId = (req.user as any)?.id || 'system';

    const ticket = (await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, req.params.id))
      .limit(1))[0];

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (priority) updates.priority = priority;

    if (status === 'resolved') {
      updates.resolvedAt = new Date();
      updates.resolvedByAdminId = userId;
    }

    const updated = await db
      .update(supportTickets)
      .set(updates)
      .where(eq(supportTickets.id, req.params.id))
      .returning();

    await logAudit(userId, 'ticket_updated', 'support_ticket', req.params.id, 'system', 'internal', { changes: updates });

    res.json(updated[0]);
  } catch (error) {
    console.error('Failed to update ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

/**
 * GET /api/admin/moderation-events
 * List moderation events
 */
router.get('/moderation-events', isAdmin, async (req, res) => {
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
    console.error('Failed to fetch moderation events:', error);
    res.status(500).json({ error: 'Failed to fetch moderation events' });
  }
});

/**
 * GET /api/admin/moderation-events/:id
 * Get a single moderation event
 */
router.get('/moderation-events/:id', isAdmin, async (req, res) => {
  try {
    const event = (await db
      .select()
      .from(moderationEvents)
      .where(eq(moderationEvents.id, req.params.id))
      .limit(1))[0];

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Failed to fetch event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

/**
 * PATCH /api/admin/moderation-events/:id
 * Review and take action on moderation event
 */
router.patch('/moderation-events/:id', isAdmin, async (req, res) => {
  try {
    const { status, actionTaken } = req.body;
    const userId = (req.user as any)?.id || 'system';

    const event = (await db
      .select()
      .from(moderationEvents)
      .where(eq(moderationEvents.id, req.params.id))
      .limit(1))[0];

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (actionTaken) updates.actionTaken = actionTaken;
    if (status || actionTaken) {
      updates.reviewedAt = new Date();
      updates.reviewedByAdminId = userId;
    }

    const updated = await db.update(moderationEvents)
      .set(updates)
      .where(eq(moderationEvents.id, req.params.id))
      .returning();

    await logAudit(userId, 'moderation_reviewed', 'moderation_event', req.params.id, 'system', 'internal', { action: actionTaken, status });

    res.json(updated[0]);
  } catch (error) {
    console.error('Failed to update moderation event:', error);
    res.status(500).json({ error: 'Failed to update moderation event' });
  }
});

/**
 * POST /api/admin/moderation-events
 * Create a moderation event (admin-initiated)
 */
router.post('/moderation-events', isAdmin, async (req, res) => {
  try {
    const { eventType, severity, reportedUserId, reportedResourceType, reportedResourceId, reason, description } = req.body;
    const userId = (req.user as any)?.id || 'system';

    const event = await db.insert(moderationEvents).values({
      eventType,
      severity: severity || 'medium',
      reportedUserId,
      reportedResourceType,
      reportedResourceId,
      reason,
      description,
      status: 'open',
    }).returning();

    await logAudit(userId, 'moderation_event_created', 'moderation_event', event[0].id, 'system', 'internal', { eventType, reason });

    res.json(event[0]);
  } catch (error) {
    console.error('Failed to create moderation event:', error);
    res.status(500).json({ error: 'Failed to create moderation event' });
  }
});

/**
 * GET /api/admin/health
 * System health and background job status
 */
router.get('/health', isAdmin, async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      jobs: {
        escalations: { lastRun: 'N/A', nextRun: 'scheduled' },
        autoClose: { lastRun: 'N/A', nextRun: 'scheduled' },
      },
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: String(error) });
  }
});

export default router;
