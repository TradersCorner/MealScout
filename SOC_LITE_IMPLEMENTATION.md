# SOC-lite Incident Automation - Implementation Guide

## Overview
Full SOC-lite workflow with on-call rotation, severity-based escalation, cryptographically signed incident records, and multi-channel notifications.

---

## Database Schema

### `incidents` Table
| Field | Type | Description |
|-------|------|-------------|
| id | varchar | Primary key (UUID) |
| ruleId | varchar | Anomaly rule identifier |
| severity | varchar | low, medium, high, critical |
| status | varchar | new, acknowledged, resolved, closed |
| userId | varchar | Affected user (optional) |
| metadata | jsonb | Additional context |
| createdAt | timestamp | Incident creation time |
| acknowledgedAt | timestamp | When acknowledged |
| acknowledgedBy | varchar | Who acknowledged |
| resolvedAt | timestamp | When resolved |
| resolvedBy | varchar | Who resolved |
| closedAt | timestamp | When closed |
| closedBy | varchar | Who closed |
| signatureHash | varchar | Cryptographic signature |

### `oncallRotation` Table
| Field | Type | Description |
|-------|------|-------------|
| id | varchar | Primary key (UUID) |
| userId | varchar | On-call user ID |
| startDate | timestamp | Rotation start |
| endDate | timestamp | Rotation end |
| isPrimary | boolean | Primary vs backup |
| createdAt | timestamp | Record creation time |

---

## Anomaly Rules

### 1. Password Reset Abuse
- **Severity:** Medium
- **Threshold:** >3 attempts in 1 hour from same IP
- **Action:** Flag and soft lock user

### 2. Failed Login Spike
- **Severity:** High
- **Threshold:** 5+ failed logins in 5 minutes
- **Action:** Lock account and alert admin

### 3. Menu/Allergy Edit Abuse
- **Severity:** Medium
- **Threshold:** >20 edits in 1 hour
- **Action:** Alert moderator

### 4. Deal Price Manipulation
- **Severity:** High
- **Threshold:** >10 price changes in 24 hours
- **Action:** Freeze deal and alert admin

### 5. Location Mismatch
- **Severity:** High
- **Threshold:** Location update from unexpected region
- **Action:** Challenge user and alert moderator

### 6. API Key Anomaly
- **Severity:** Critical
- **Threshold:** API key used from new country
- **Action:** Challenge and alert admin immediately

---

## Notification Channels

### Email
- **Tool:** Nodemailer / SendGrid
- **Recipients:** Configured via `INCIDENT_EMAIL_RECIPIENTS` env var
- **All severities**

### Slack
- **Tool:** Slack Webhook
- **Recipients:** Configured channel
- **All severities**

### SMS
- **Tool:** Twilio
- **Recipients:** Configured via `INCIDENT_SMS_RECIPIENTS` env var
- **Critical severity only (SEV1)**

---

## Escalation Timeline

| Stage | Time | Action |
|-------|------|--------|
| Initial trigger | Immediate | Create incident, notify on-call |
| No acknowledgment | 15 minutes | Escalate to backup |
| No resolution | 2 hours | Escalate to CTO |
| Possible breach | 24 hours | Escalate to legal/CEO |
| Hard escalation | 72 hours | Full incident review |

**Configurable via environment variables:**
- `INCIDENT_ESCALATION_NO_ACK_MINUTES` (default: 15)
- `INCIDENT_ESCALATION_NO_RESOLUTION_MINUTES` (default: 120)
- `INCIDENT_ESCALATION_BREACH_MINUTES` (default: 1440)
- `INCIDENT_ESCALATION_HARD_MINUTES` (default: 4320)

---

## Cryptographic Signing

### Purpose
- Tamper detection for incident records
- Integrity verification for compliance audits

### Implementation
- HMAC-SHA256 signature computed on incident data
- Signature stored in `signatureHash` field
- Verification function available for audits

### Configuration
- Set `INCIDENT_SIGNATURE_SECRET` environment variable (required in production)

---

## Auto-generated Incident Reports

### Generated On
- Incident closure

### Format
- Markdown file: `INCIDENT_REPORT_YYYY-MM-DD_<incident-id>.md`

### Contents
- Timeline (created, acknowledged, resolved, closed)
- Affected resources
- Actions taken
- User notifications
- Retention/purge hold status
- Signature verification

### Storage
- File system (local development)
- S3 bucket (production - TODO)

---

## Fail-Safes

### Alert Fatigue
- **Risk:** Too many alerts overwhelm team
- **Mitigation:** Severity scoring, configurable thresholds

### Ghost Incidents
- **Risk:** Incidents never closed
- **Mitigation:** Auto-close low severity after 7 days

### Sensitive Log Leakage
- **Risk:** PII exposed in logs
- **Mitigation:** Only show redacted metadata in dashboards

---

## Environment Variables

```bash
# Escalation timing
INCIDENT_ESCALATION_NO_ACK_MINUTES=15
INCIDENT_ESCALATION_NO_RESOLUTION_MINUTES=120
INCIDENT_ESCALATION_BREACH_MINUTES=1440
INCIDENT_ESCALATION_HARD_MINUTES=4320

# Notification channels
INCIDENT_EMAIL_RECIPIENTS=admin@mealscout.us,security@mealscout.us
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
INCIDENT_SMS_RECIPIENTS=+15551234567,+15557654321

# Email (choose one)
SENDGRID_API_KEY=SG.xxxxx
# OR
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@mealscout.us
SMTP_PASS=xxxxx

# SMS
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+15551234567

# Cryptographic signing
INCIDENT_SIGNATURE_SECRET=your-secret-key-change-in-production
```

---

## API Endpoints (TODO)

### Create Incident
```typescript
POST /api/incidents
{
  "ruleId": "password_reset_abuse",
  "severity": "medium",
  "userId": "user-123",
  "metadata": { ... }
}
```

### Acknowledge Incident
```typescript
PATCH /api/incidents/:id/acknowledge
Authorization: Bearer [admin-session]
```

### Resolve Incident
```typescript
PATCH /api/incidents/:id/resolve
Authorization: Bearer [admin-session]
{
  "resolutionNotes": "Investigated and confirmed false positive"
}
```

### Close Incident
```typescript
PATCH /api/incidents/:id/close
Authorization: Bearer [admin-session]
```

### List Incidents
```typescript
GET /api/incidents?status=new&severity=critical
Authorization: Bearer [admin-session]
```

---

## Scheduled Jobs

### Escalation Checker
- **Frequency:** Every 5 minutes
- **Action:** Check for unacknowledged/unresolved incidents and escalate

### Auto-close Job
- **Frequency:** Daily (midnight)
- **Action:** Auto-close low severity incidents resolved >7 days ago

### Implementation
```typescript
// In server/index.ts or separate cron job
import { checkEscalations, autoCloseLowSeverityIncidents } from './incidentManager';

setInterval(async () => {
  await checkEscalations();
}, 5 * 60 * 1000); // Every 5 minutes

setInterval(async () => {
  await autoCloseLowSeverityIncidents();
}, 24 * 60 * 60 * 1000); // Every 24 hours
```

---

## Dashboard Requirements (Frontend)

### Incident List View
- Filter by status, severity, rule
- Sort by creation date
- Badge count for new incidents

### Incident Detail View
- Full timeline
- Affected resources
- Actions/notes
- Acknowledge/Resolve/Close buttons

### On-call Calendar
- View current on-call
- Manage rotation schedule

---

## Testing Checklist

- [ ] Create incident via API
- [ ] Verify signature generation
- [ ] Test email notification
- [ ] Test Slack notification
- [ ] Test SMS notification (critical only)
- [ ] Acknowledge incident
- [ ] Verify escalation logic (15 min)
- [ ] Resolve incident
- [ ] Close incident and verify report generation
- [ ] Verify auto-close for low severity
- [ ] Test signature verification

---

**Status:** Implementation complete, ready for integration  
**Last Updated:** December 6, 2025
