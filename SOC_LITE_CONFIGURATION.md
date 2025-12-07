# SOC-lite Configuration & Testing Guide

## Environment Variables Setup

Copy these to your `.env` or `.env.production` file:

```bash
# ===== INCIDENT MANAGEMENT (SOC-LITE) =====

# Cryptographic signing for incident integrity (ROTATE EVERY 6-12 MONTHS)
INCIDENT_SIGNATURE_SECRET=your_incident_hmac_secret_change_in_production_min_32_chars

# Email notifications
INCIDENT_EMAIL_RECIPIENTS=admin@mealscout.us,security@mealscout.us

# Email provider (choose one)
SENDGRID_API_KEY=SG.xxxxx
# OR use SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@mealscout.us
SMTP_PASS=your_smtp_password

# Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# SMS notifications (Twilio - CRITICAL incidents only)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+15551234567
INCIDENT_SMS_RECIPIENTS=+15551234567,+15557654321

# Escalation timing (in minutes)
INCIDENT_ESCALATION_NO_ACK_MINUTES=15
INCIDENT_ESCALATION_NO_RESOLUTION_MINUTES=120
INCIDENT_ESCALATION_BREACH_MINUTES=1440
INCIDENT_ESCALATION_HARD_MINUTES=4320

# On-call configuration
ONCALL_ROTATION_MODE=weekly
ONCALL_DEFAULT_CONTACT_EMAIL=security@mealscout.us
```

---

## Installation

Install required dependencies:

```bash
npm install winston
```

---

## Running Tests

### Automated Test Suite

Run the complete incident testing suite:

```bash
npm run test:incidents
```

This will:
1. Create 3 test incidents (LOW, HIGH, CRITICAL severity)
2. Test status transitions (new → acknowledged → resolved → closed)
3. Validate cryptographic signatures
4. Verify audit log creation
5. Send notifications to all configured channels

### Manual Testing

#### Test 1: Password Reset Abuse (LOW)
```bash
# Trigger via API endpoint (3+ password resets in 1 hour)
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Repeat 3+ times within 15 minutes to trigger incident
```

#### Test 2: Deal Price Manipulation (HIGH)
```bash
# Trigger by making 10+ deal price changes within 24 hours
curl -X PATCH http://localhost:5000/api/deals/:dealId \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{"price": 9.99}'

# Repeat 10+ times to trigger incident
```

#### Test 3: API Key Foreign IP (CRITICAL)
```bash
# Simulate API key usage from foreign country
# This requires actual API key and IP geolocation detection
# Use test script for simulation:
npm run test:incidents
```

---

## Validation Checklist

After running tests, verify the following:

### Database
- [ ] `incidents` table has new records
- [ ] `signatureHash` field is populated
- [ ] `security_audit_log` has corresponding entries
- [ ] Status transitions recorded correctly

### Notifications
- [ ] Email received at configured addresses
- [ ] Slack message posted to channel (if configured)
- [ ] SMS sent for CRITICAL incident only (if configured)

### Escalation
- [ ] Incident remains "new" until acknowledged
- [ ] Timer stops when acknowledged
- [ ] Auto-escalation occurs if no acknowledgment after 15 minutes

### Reports
- [ ] Incident report generated on closure
- [ ] Report contains complete timeline
- [ ] Signature verification passes

---

## Expected Test Output

```
============================================================
🚀 MealScout SOC-lite Incident Testing Suite
============================================================

🧪 TEST 1: Password Reset Abuse (LOW severity)
────────────────────────────────────────────────────────────
✅ Incident created: abc123...
   Severity: medium
   Status: new
   Signature: 5f3a8b2c...
✅ Incident stored in database
✅ Notifications sent (check email/Slack)

🧪 TEST 2: Deal Price Manipulation (HIGH severity)
────────────────────────────────────────────────────────────
✅ Incident created: def456...
   Severity: high
   Status: new
   Signature: 9c2e1f4b...
✅ Audit log created: incident_created
✅ Notifications sent (check email/Slack)

🧪 TEST 3: API Key Foreign IP Usage (CRITICAL severity)
────────────────────────────────────────────────────────────
✅ Incident created: ghi789...
   Severity: critical
   Status: new
   Signature: 2d7a6c5e...
📱 SMS notification should be sent (CRITICAL only)

🧪 TEST 4: Status Transitions
────────────────────────────────────────────────────────────
📌 Acknowledging incident...
✅ Status: acknowledged
   Acknowledged by: test-admin-001
   Acknowledged at: 2025-12-06T12:34:56.789Z
📌 Resolving incident...
✅ Status: resolved
   Resolved by: test-admin-001
   Resolved at: 2025-12-06T12:35:01.234Z
📌 Closing incident...
✅ Status: closed
   Closed by: test-admin-001
   Closed at: 2025-12-06T12:35:05.678Z
📄 Incident report generated (check logs)

🧪 TEST 5: Incident Integrity Validation
────────────────────────────────────────────────────────────
Found 3 recent incidents
  ✅ Incident abc12345...
     Severity: medium, Status: closed
     Signature: 5f3a8b2c...
  ✅ Incident def45678...
     Severity: high, Status: new
     Signature: 9c2e1f4b...
  ✅ Incident ghi78901...
     Severity: critical, Status: new
     Signature: 2d7a6c5e...

🧪 TEST 6: Notification Channel Configuration
────────────────────────────────────────────────────────────
Email notifications: ✅ Enabled
Slack notifications: ✅ Enabled
SMS notifications: ✅ Enabled
Incident signing: ✅ Enabled

============================================================
✅ ALL TESTS PASSED
============================================================

📊 Summary:
  - 3 incidents created (LOW, HIGH, CRITICAL)
  - Status transitions verified
  - Cryptographic signatures validated
  - Audit logs created
  - Notifications sent (check your channels)

💡 Next Steps:
  1. Check your email for incident alerts
  2. Check Slack workspace for notifications
  3. Check SMS for critical alert (if configured)
  4. Review incident dashboard for new incidents
  5. Verify incident reports were generated

============================================================
```

---

## Troubleshooting

### No notifications received
- Check environment variables are set correctly
- Verify email/Slack/SMS credentials are valid
- Check application logs for errors

### Incidents not created
- Verify database migrations ran successfully
- Check `incidents` table exists
- Review application logs for errors

### Signature validation fails
- Ensure `INCIDENT_SIGNATURE_SECRET` hasn't changed
- Don't modify incident records after creation
- Verify timestamp consistency

### Escalation not triggering
- Check escalation timers are configured
- Verify scheduled job is running
- Review application logs for timing issues

---

## Production Deployment

Before deploying to production:

1. **Rotate secrets**
   - Generate new `INCIDENT_SIGNATURE_SECRET` (32+ characters)
   - Update all notification credentials

2. **Configure on-call rotation**
   - Set up on-call schedule in database
   - Verify contact information

3. **Test notification channels**
   - Send test email
   - Send test Slack message
   - Send test SMS (if enabled)

4. **Set up monitoring**
   - Monitor incident creation rate
   - Track notification delivery
   - Alert on escalation triggers

5. **Document procedures**
   - Train team on incident response
   - Document escalation paths
   - Create runbooks for common scenarios

---

## Maintenance

### Secret Rotation Schedule
- **INCIDENT_SIGNATURE_SECRET**: Every 6-12 months
- **Email credentials**: Annually or on breach
- **SMS credentials**: Annually or on breach
- **Slack webhook**: When rotating team access

### Regular Tasks
- Weekly: Review open incidents
- Monthly: Audit closed incidents
- Quarterly: Review escalation timers
- Annually: Full SOC-lite system audit

---

**Last Updated:** December 6, 2025  
**Status:** Ready for testing
