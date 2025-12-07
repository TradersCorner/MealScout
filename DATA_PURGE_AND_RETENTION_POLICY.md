# Data Purge and Retention Policy

---

## Internal (Plain-English)

### Retention Matrix
| Data Type                   | Retention | Reason                  |
|----------------------------|-----------|------------------------|
| Password reset & auth logs  | 90 days   | Breach/incident        |
| Restaurant menu/allergy edits | 5 years | Liability / injury claims |
| Deal pricing / offer details | 2 years  | Consumer rights        |
| API key logs                | 1 year    | Security traceability  |
| Moderator/admin actions     | 3 years   | Internal accountability|

### Purge Job Schedule
- Automated purge jobs run monthly
- "Hold freeze" if incident in progress (no purge)

### Redacted Export Format
- Exports in .jsonl or CSV
- Redact: full emails, phone numbers, tokens, payment info
- Accept: email hash, last 4 digits, token prefix

---

## External (Legal/Regulatory)

### Retention Requirements
- Auth logs: 90 days
- Menu/allergen edits: 5 years
- Deals: 2 years
- API keys: 1 year
- Admin actions: 3 years

### Purge Procedures
- Automated purge jobs
- "Hold freeze" if incident in progress
- Redacted exports for compliance requests

### Fail Safes
- "No breach" confirmation template
- Secure messaging channel
- Non-technical summary for brand protection
