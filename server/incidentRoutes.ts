/**
 * Incident Management API Endpoints
 * 
 * Provides full CRUD and lifecycle management for incidents.
 * All endpoints require admin authentication.
 */

import { Router } from 'express';
import { db } from './db';
import { incidents, securityAuditLog } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { isAdmin } from './unifiedAuth';
import { generateIncidentReport, verifyIncidentSignature, signIncident, acknowledgeIncident, resolveIncident, closeIncident } from './incidentManager';
import { logAudit } from './auditLogger';

const router = Router();

/**
 * GET /api/incidents
 * List all incidents with optional filtering
 */
router.get('/', isAdmin, async (req, res) => {
  try {
    const allIncidents = await db.query.incidents.findMany({
      orderBy: (table) => desc(table.createdAt),
      limit: 100, // Recent 100 incidents
    });

    res.json(allIncidents);
  } catch (error) {
    console.error('Failed to fetch incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

/**
 * GET /api/incidents/:id
 * Get a single incident by ID
 */
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const incident = await db.query.incidents.findFirst({
      where: eq(incidents.id, req.params.id),
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json(incident);
  } catch (error) {
    console.error('Failed to fetch incident:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

/**
 * GET /api/incidents/:id/audit-logs
 * Get audit logs related to an incident
 */
router.get('/:id/audit-logs', isAdmin, async (req, res) => {
  try {
    const logs = await db.query.securityAuditLog.findMany({
      where: eq(securityAuditLog.resourceId, req.params.id),
      orderBy: (table) => desc(table.timestamp),
    });

    res.json(logs);
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * PATCH /api/incidents/:id/status
 * Update incident status (new → acknowledged → resolved → closed)
 */
router.patch('/:id/status', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'acknowledged', 'resolved', 'closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const incident = await db.query.incidents.findFirst({
      where: eq(incidents.id, req.params.id),
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const userId = req.user?.id || 'system';
    let updated;

    if (status === 'acknowledged' && incident.status === 'new') {
      updated = await acknowledgeIncident(req.params.id, userId);
    } else if (status === 'resolved' && incident.status === 'acknowledged') {
      updated = await resolveIncident(req.params.id, userId);
    } else if (status === 'closed' && incident.status === 'resolved') {
      updated = await closeIncident(req.params.id, userId);
    } else {
      return res.status(400).json({ error: `Cannot transition from ${incident.status} to ${status}` });
    }

    // Log the status change
    await logAudit(
      userId,
      `incident_${status}`,
      'incident',
      req.params.id,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      { previousStatus: incident.status, newStatus: status }
    );

    res.json(updated);
  } catch (error) {
    console.error('Failed to update incident status:', error);
    res.status(500).json({ error: 'Failed to update incident status' });
  }
});

/**
 * GET /api/incidents/:id/report
 * Download incident report as markdown
 */
router.get('/:id/report', isAdmin, async (req, res) => {
  try {
    const incident = await db.query.incidents.findFirst({
      where: eq(incidents.id, req.params.id),
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Get related audit logs
    const auditLogs = await db.query.securityAuditLog.findMany({
      where: eq(securityAuditLog.resourceId, req.params.id),
    });

    const report = await generateIncidentReport(incident, auditLogs);

    res.set('Content-Type', 'text/markdown');
    res.set('Content-Disposition', `attachment; filename="incident-${incident.id}.md"`);
    res.send(report);
  } catch (error) {
    console.error('Failed to generate report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/incidents/:id/verify-signature
 * Verify the cryptographic signature of an incident
 */
router.get('/:id/verify-signature', isAdmin, async (req, res) => {
  try {
    const incident = await db.query.incidents.findFirst({
      where: eq(incidents.id, req.params.id),
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const valid = verifyIncidentSignature(incident);

    res.json({
      valid,
      incidentId: incident.id,
      signature: incident.signatureHash,
      message: valid
        ? '✅ Signature verified - no tampering detected'
        : '❌ Signature invalid - incident may have been modified',
    });
  } catch (error) {
    console.error('Failed to verify signature:', error);
    res.status(500).json({ error: 'Failed to verify signature' });
  }
});

/**
 * POST /api/cron/escalations
 * Run escalation checks (can be triggered manually or by cron)
 * Returns the number of escalated incidents
 */
router.post('/cron/escalations', async (req, res) => {
  try {
    // Verify the request is coming from a trusted source (Vercel cron, localhost, or valid auth)
    const fromVercelCron = req.headers['x-vercel-cron'];
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === 'localhost';
    const isAdmin = req.user?.role?.includes('admin');

    if (!fromVercelCron && !isLocalhost && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Import escalation runner
    const { checkEscalations } = await import('../incidentManager');

    const escalatedCount = await checkEscalations();

    res.json({
      success: true,
      escalatedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to run escalations:', error);
    res.status(500).json({ error: 'Failed to run escalations' });
  }
});

/**
 * POST /api/cron/auto-close
 * Run auto-close for low-severity incidents (can be triggered manually or by cron)
 * Returns the number of closed incidents
 */
router.post('/cron/auto-close', async (req, res) => {
  try {
    // Same auth checks as escalations
    const fromVercelCron = req.headers['x-vercel-cron'];
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === 'localhost';
    const isAdmin = req.user?.role?.includes('admin');

    if (!fromVercelCron && !isLocalhost && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Import auto-close runner
    const { autoCloseLowSeverityIncidents } = await import('../incidentManager');

    const closedCount = await autoCloseLowSeverityIncidents();

    res.json({
      success: true,
      closedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to run auto-close:', error);
    res.status(500).json({ error: 'Failed to run auto-close' });
  }
});

export default router;
