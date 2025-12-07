# Incident Response Policy

---

## Internal (Plain-English)

### Definitions
- **Incident:** Any event that disrupts normal operations or threatens data integrity (e.g., suspicious logins, scraping, fraud).
- **Outage:** Service unavailable for >5 minutes.
- **Breach:** Unauthorized access to sensitive data or systems.

### Severity Scoring
| Level | Description | Example |
|-------|-------------|---------|
| Low   | Minor, no data risk | User locked out |
| Medium| Suspicious, possible risk | Multiple failed logins |
| High  | Confirmed risk, data exposed | API key leak |
| Critical | Systemic breach, regulatory impact | Credential stuffing, food safety risk |

### Response Timelines
- **Low:** 24 hours
- **Medium:** 12 hours
- **High:** 4 hours
- **Critical:** Immediate (within 1 hour)

### Chain of Responsibility
- **On-call rotation:** Security lead → CTO → CEO
- **Fallback:** If primary unavailable, escalate to next in chain

### Evidence Retention
- Preserve audit logs, notebook traces, API call records
- Hold freeze: No purge until incident closed

### Trigger Examples
- Credential stuffing detected in notebook logs
- Deal API called 10,000x (possible scraping)
- Restaurant location changed 8 times in 2 hours (fraud)
- API key used from new country (escalate)

---

## External (Legal/Regulatory)

### Definitions
- **Security Incident:** Any event that may compromise confidentiality, integrity, or availability of MealScout systems or data.
- **Data Breach:** Confirmed unauthorized access, disclosure, or loss of regulated data.

### Severity & Notification
- **Critical Breach:** Notify regulatory authorities and affected parties within 72 hours of discovery (not confirmation).
- **Evidence:** Retain all relevant logs and records for minimum 5 years (food safety).

### Chain of Responsibility
- Security Officer → Legal Counsel → CEO

### Required Actions
- Document incident, timeline, and response steps
- Provide breach notification as per regulatory template
- Maintain audit trail for all actions

---

## Templates & Playbook
- See `BREACH_NOTIFICATION_PROCEDURE.md` for notification templates
- See `DATA_PURGE_AND_RETENTION_POLICY.md` for retention and purge procedures
