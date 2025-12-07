# MealScout Anomaly Detection Rules

**Compliance Target:** D) Food-service vendor compliance (FDA/restaurant records retention)

## Retention Matrix (Reference)
| Data Type                   | Retention | Reason                  |
|----------------------------|-----------|------------------------|
| Password reset & auth logs  | 90 days   | Breach/incident        |
| Restaurant menu/allergy edits | 5 years | Liability / injury claims |
| Deal pricing / offer details | 2 years  | Consumer rights        |
| API key logs                | 1 year    | Security traceability  |
| Moderator/admin actions     | 3 years   | Internal accountability|

## Field-Level Redaction
- Never log: full emails, phone numbers, tokens, fingerprints, payment info
- Acceptable: email hash, last 4 digits, token prefix

## Minimum Access Policy
| Role             | Access Scope         |
|------------------|---------------------|
| restaurant_owner | Own audit logs      |
| moderator        | Local region logs   |
| admin            | Non-PII logs        |
| super_admin      | Full                |

---

## Anomaly Detection Rules (Initial 6)

### 1. Excessive Password Reset Attempts
- **Rule:** >3 password reset requests from same IP in 1 hour
- **Action:** Flag for review, soft lock user for 1 hour
- **Retention:** 90 days

### 2. Failed Login Spike
- **Rule:** 5+ failed logins for same user or IP in 5 minutes
- **Action:** Soft lock account, alert admin
- **Retention:** 90 days

### 3. Restaurant Menu/Allergy Edits
- **Rule:** >20 menu/allergy edits for same restaurant in 1 hour
- **Action:** Alert moderator, log for 5 years
- **Retention:** 5 years

### 4. Deal Abuse / Price Manipulation
- **Rule:** >10 deal price changes for same deal in 24 hours
- **Action:** Alert admin, freeze deal
- **Retention:** 2 years

### 5. Location Mismatch
- **Rule:** Restaurant location updated from IP outside expected region
- **Action:** Challenge user, alert moderator
- **Retention:** 5 years

### 6. API Key Usage Anomaly
- **Rule:** API key used from new country or IP range
- **Action:** Challenge, alert admin, log for 1 year
- **Retention:** 1 year

---

## Fail-Safes
| Issue           | Mitigation                |
|-----------------|--------------------------|
| False positives | Severity scoring          |
| Log tampering   | Append-only DB            |
| Data request    | Automated export          |

---

## Implementation Notes
- All anomaly triggers write to `security_audit_log` with redacted fields
- Severity scoring used to prioritize alerts
- Automated export for compliance requests
- Append-only DB for audit integrity
- Alerts routed to appropriate role per Minimum Access Policy

---

**Last Updated:** December 6, 2025
