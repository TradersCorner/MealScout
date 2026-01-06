import { createHash, createHmac } from 'crypto';
import { db } from './db';
import { incidents, oncallRotation } from '../shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import auditLogger, { logAudit } from './auditLogger';
import { emailService, isEmailConfigured } from './emailService';

// Environment variables for escalation timing
const ESCALATION_MINUTES = {
  initial: 0,
  noAcknowledgment: parseInt(process.env.INCIDENT_ESCALATION_NO_ACK_MINUTES || '15'),
  noResolution: parseInt(process.env.INCIDENT_ESCALATION_NO_RESOLUTION_MINUTES || '120'),
  possibleBreach: parseInt(process.env.INCIDENT_ESCALATION_BREACH_MINUTES || '1440'), // 24 hours
  hardEscalation: parseInt(process.env.INCIDENT_ESCALATION_HARD_MINUTES || '4320'), // 72 hours
};

// Notification channels configuration
const NOTIFICATION_CONFIG = {
  // Email is a required channel for incidents in production.
  email: {
    enabled: isEmailConfigured(),
    recipients: (process.env.INCIDENT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
  },
  slack: {
    enabled: !!process.env.SLACK_WEBHOOK_URL,
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  },
  sms: {
    enabled: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN,
    recipients: (process.env.INCIDENT_SMS_RECIPIENTS || '').split(',').filter(Boolean),
  },
};

// Severity levels
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'new' | 'acknowledged' | 'resolved' | 'closed';

// Anomaly detection rules
export const ANOMALY_RULES = {
  PASSWORD_RESET_ABUSE: {
    id: 'password_reset_abuse',
    name: 'Excessive Password Reset Attempts',
    severity: 'medium' as IncidentSeverity,
    threshold: { count: 3, windowMinutes: 60 },
    action: 'flag_and_soft_lock',
  },
  FAILED_LOGIN_SPIKE: {
    id: 'failed_login_spike',
    name: 'Failed Login Spike',
    severity: 'high' as IncidentSeverity,
    threshold: { count: 5, windowMinutes: 5 },
    action: 'lock_and_alert',
  },
  MENU_EDIT_ABUSE: {
    id: 'menu_edit_abuse',
    name: 'Excessive Menu/Allergy Edits',
    severity: 'medium' as IncidentSeverity,
    threshold: { count: 20, windowMinutes: 60 },
    action: 'alert_moderator',
  },
  DEAL_PRICE_MANIPULATION: {
    id: 'deal_price_manipulation',
    name: 'Deal Price Manipulation',
    severity: 'high' as IncidentSeverity,
    threshold: { count: 10, windowMinutes: 1440 }, // 24 hours
    action: 'freeze_and_alert',
  },
  LOCATION_MISMATCH: {
    id: 'location_mismatch',
    name: 'Suspicious Location Change',
    severity: 'high' as IncidentSeverity,
    threshold: { regionMismatch: true },
    action: 'challenge_and_alert',
  },
  API_KEY_ANOMALY: {
    id: 'api_key_anomaly',
    name: 'API Key Usage from New Location',
    severity: 'critical' as IncidentSeverity,
    threshold: { newCountry: true },
    action: 'challenge_and_alert',
  },
};

// Create cryptographic signature for incident record
function signIncident(incidentData: any): string {
  const secret = process.env.INCIDENT_SIGNATURE_SECRET || 'default-secret-change-in-production';
  const dataString = JSON.stringify(incidentData);
  return createHmac('sha256', secret).update(dataString).digest('hex');
}

// Verify incident signature
export function verifyIncidentSignature(incidentData: any, signature: string): boolean {
  const computedSignature = signIncident(incidentData);
  return computedSignature === signature;
}

// Create new incident
export async function createIncident({
  ruleId,
  severity,
  userId,
  metadata,
}: {
  ruleId: string;
  severity: IncidentSeverity;
  userId?: string;
  metadata?: any;
}) {
  const incidentData = {
    ruleId,
    severity,
    userId,
    metadata,
    createdAt: new Date(),
  };

  const signature = signIncident(incidentData);

  const [incident] = await db.insert(incidents).values({
    ruleId,
    severity,
    status: 'new',
    userId,
    metadata,
    signatureHash: signature,
  }).returning();

  // Log incident creation
  await logAudit(
    'system',
    'incident_created',
    'incident',
    incident.id,
    'system',
    'internal',
    { ruleId, severity }
  );

  // Send notifications
  await notifyIncident(incident, 'created');

  return incident;
}

// Get current on-call person
export async function getCurrentOnCall(): Promise<{ userId: string; isPrimary: boolean } | null> {
  const now = new Date();
  const rotations = await db
    .select()
    .from(oncallRotation)
    .where(and(lte(oncallRotation.startDate, now), gte(oncallRotation.endDate, now)))
    .orderBy(desc(oncallRotation.isPrimary))
    .limit(1);

  const rotation = rotations[0];
  return rotation ? { userId: rotation.userId, isPrimary: rotation.isPrimary === true } : null;
}

// Send notifications via configured channels
async function notifyIncident(incident: any, eventType: 'created' | 'acknowledged' | 'escalated') {
  const rule = Object.values(ANOMALY_RULES).find(r => r.id === incident.ruleId);
  const message = `[${incident.severity.toUpperCase()}] ${rule?.name || 'Incident'} - ${eventType}`;

  // Email notification
  if (NOTIFICATION_CONFIG.email.recipients.length === 0) {
    const error = new Error(
      'Incident email notification failed: INCIDENT_EMAIL_RECIPIENTS is not configured.',
    );
    auditLogger.error(error.message, { incidentId: incident.id, eventType });
    throw error;
  }

  if (!NOTIFICATION_CONFIG.email.enabled) {
    const error = new Error(
      'Incident email notification failed: email provider is not configured (BREVO_API_KEY missing or invalid).',
    );
    auditLogger.error(error.message, { incidentId: incident.id, eventType });
    throw error;
  }

  if (NOTIFICATION_CONFIG.email.enabled && NOTIFICATION_CONFIG.email.recipients.length > 0) {
    const subject = `[${incident.severity.toUpperCase()}] ${rule?.name || 'Incident'} - ${eventType}`;
    const html = `
      <h2>MealScout Incident Notification</h2>
      <p><strong>Event:</strong> ${eventType}</p>
      <p><strong>Rule:</strong> ${rule?.name || incident.ruleId}</p>
      <p><strong>Severity:</strong> ${incident.severity}</p>
      <p><strong>Incident ID:</strong> ${incident.id}</p>
      <pre style="background:#f3f4f6;padding:12px;border-radius:4px;white-space:pre-wrap;word-break:break-word;">
${JSON.stringify(incident.metadata || {}, null, 2)}
      </pre>
    `;

    const failures: string[] = [];

    for (const recipient of NOTIFICATION_CONFIG.email.recipients) {
      const ok = await emailService.sendBasicEmail(recipient, subject, html);
      if (!ok) {
        failures.push(recipient);
      }
    }

    if (failures.length > 0) {
      const error = new Error(
        `Incident email notification failed for recipients: ${failures.join(', ')}`,
      );
      auditLogger.error(error.message, { incidentId: incident.id, eventType });
      throw error;
    }

    auditLogger.info('Email notification sent', { incidentId: incident.id, eventType });
  }

  // Slack notification
  if (NOTIFICATION_CONFIG.slack.enabled) {
    try {
      await fetch(NOTIFICATION_CONFIG.slack.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          attachments: [{
            color: incident.severity === 'critical' ? 'danger' : 'warning',
            fields: [
              { title: 'Incident ID', value: incident.id, short: true },
              { title: 'Severity', value: incident.severity, short: true },
              { title: 'Rule', value: rule?.name || incident.ruleId, short: false },
            ],
          }],
        }),
      });
      auditLogger.info('Slack notification sent', { incidentId: incident.id, eventType });
    } catch (error) {
      auditLogger.error('Slack notification failed', { error, incidentId: incident.id });
    }
  }

  // SMS notification (SEV1 only - critical)
  if (NOTIFICATION_CONFIG.sms.enabled && incident.severity === 'critical' && NOTIFICATION_CONFIG.sms.recipients.length > 0) {
    // SMS notifications are currently not implemented. Do not log false success.
    auditLogger.warn(
      'SMS incident notification requested but Twilio integration is not implemented; no SMS was sent.',
      { incidentId: incident.id, eventType },
    );
  }
}

// Acknowledge incident
export async function acknowledgeIncident(incidentId: string, acknowledgedBy: string) {
  const [incident] = await db.update(incidents)
    .set({
      status: 'acknowledged',
      acknowledgedAt: new Date(),
      acknowledgedBy,
    })
    .where(eq(incidents.id, incidentId))
    .returning();

  await logAudit(
    acknowledgedBy,
    'incident_acknowledged',
    'incident',
    incidentId,
    'system',
    'internal',
    {}
  );

  await notifyIncident(incident, 'acknowledged');

  return incident;
}

// Resolve incident
export async function resolveIncident(incidentId: string, resolvedBy: string, resolutionNotes?: string) {
  const [incident] = await db.update(incidents)
    .set({
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy,
      metadata: { resolutionNotes },
    })
    .where(eq(incidents.id, incidentId))
    .returning();

  await logAudit(
    resolvedBy,
    'incident_resolved',
    'incident',
    incidentId,
    'system',
    'internal',
    { resolutionNotes }
  );

  return incident;
}

// Close incident and generate report
export async function closeIncident(incidentId: string, closedBy: string) {
  const [incident] = await db.update(incidents)
    .set({
      status: 'closed',
      closedAt: new Date(),
      closedBy,
    })
    .where(eq(incidents.id, incidentId))
    .returning();

  await logAudit(
    closedBy,
    'incident_closed',
    'incident',
    incidentId,
    'system',
    'internal',
    {}
  );

  // Generate incident report
  await generateIncidentReport(incident);

  return incident;
}

// Generate incident report
async function generateIncidentReport(incident: any) {
  const rule = Object.values(ANOMALY_RULES).find(r => r.id === incident.ruleId);
  const timestamp = new Date().toISOString().split('T')[0];
  const reportFilename = `INCIDENT_REPORT_${timestamp}_${incident.id}.md`;

  const report = `# Incident Report

**Incident ID:** ${incident.id}
**Rule:** ${rule?.name || incident.ruleId}
**Severity:** ${incident.severity}
**Status:** ${incident.status}

## Timeline
- **Created:** ${incident.createdAt}
- **Acknowledged:** ${incident.acknowledgedAt || 'N/A'} (by: ${incident.acknowledgedBy || 'N/A'})
- **Resolved:** ${incident.resolvedAt || 'N/A'} (by: ${incident.resolvedBy || 'N/A'})
- **Closed:** ${incident.closedAt || 'N/A'} (by: ${incident.closedBy || 'N/A'})

## Affected Resources
- **User ID:** ${incident.userId || 'N/A'}
- **Resource Type:** ${incident.metadata?.resourceType || 'N/A'}
- **Resource ID:** ${incident.metadata?.resourceId || 'N/A'}

## Actions Taken
${incident.metadata?.resolutionNotes || 'No resolution notes provided'}

## User Notifications
${incident.metadata?.userNotifications || 'No user notifications sent'}

## Retention & Purge
- Purge/retention hold: ${incident.metadata?.retentionHold ? 'YES' : 'NO'}

## Signature
- **Signature Hash:** ${incident.signatureHash}
- **Verification:** ${verifyIncidentSignature(incident, incident.signatureHash) ? 'VALID' : 'INVALID'}

---
*Generated: ${new Date().toISOString()}*
`;

  auditLogger.info('Incident report generated', { incidentId: incident.id, filename: reportFilename });

  // TODO: Save report to file system or S3
  return report;
}

// Check for escalation
export async function checkEscalations() {
  const now = new Date();

  // Get all open incidents
  const openIncidents = await db
    .select()
    .from(incidents)
    .where(eq(incidents.status, 'new'));

  for (const incident of openIncidents) {
    if (!incident.createdAt) continue; // Skip if no created date
    const minutesOpen = (now.getTime() - incident.createdAt.getTime()) / (1000 * 60);

    // Check if escalation is needed
    if (minutesOpen > ESCALATION_MINUTES.noAcknowledgment) {
      await notifyIncident(incident, 'escalated');
      auditLogger.warn('Incident escalated - no acknowledgment', { 
        incidentId: incident.id, 
        minutesOpen 
      });
    }
  }

  // Get acknowledged but not resolved incidents
  const acknowledgedIncidents = await db
    .select()
    .from(incidents)
    .where(eq(incidents.status, 'acknowledged'));

  for (const incident of acknowledgedIncidents) {
    const minutesSinceAck = (now.getTime() - new Date(incident.acknowledgedAt!).getTime()) / (1000 * 60);

    if (minutesSinceAck > ESCALATION_MINUTES.noResolution) {
      await notifyIncident(incident, 'escalated');
      auditLogger.warn('Incident escalated - no resolution', { 
        incidentId: incident.id, 
        minutesSinceAck 
      });
    }
  }
}

// Auto-close low severity incidents after 7 days
export async function autoCloseLowSeverityIncidents() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const oldLowIncidents = await db
    .select()
    .from(incidents)
    .where(
      and(
        eq(incidents.severity, 'low'),
        eq(incidents.status, 'resolved'),
        lte(incidents.resolvedAt, sevenDaysAgo),
      ),
    );

  for (const incident of oldLowIncidents) {
    await closeIncident(incident.id, 'system');
    auditLogger.info('Auto-closed low severity incident', { incidentId: incident.id });
  }
}

export default {
  createIncident,
  acknowledgeIncident,
  resolveIncident,
  closeIncident,
  getCurrentOnCall,
  checkEscalations,
  autoCloseLowSeverityIncidents,
  ANOMALY_RULES,
  ESCALATION_MINUTES,
};
