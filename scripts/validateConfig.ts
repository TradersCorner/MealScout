/**
 * SOC-lite Configuration Validator
 *
 * Validates incident management configuration without requiring database access.
 * Use this to verify environment setup before running full tests.
 */

import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env.development", override: true });

const truthy = (value: string | undefined) =>
  ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());

const requireSms = truthy(process.env.CHECKLIST_REQUIRE_SMS);
const requireSlack = truthy(process.env.CHECKLIST_REQUIRE_SLACK);
const enforceIncidentEnv = truthy(process.env.CHECKLIST_ENFORCE_INCIDENT_ENV);

function configured(value: string | undefined): boolean {
  return Boolean(value && String(value).trim().length > 0);
}

function validateEnvironment() {
  console.log("\n" + "=".repeat(60));
  console.log("[SOC-lite] Configuration Validator");
  console.log("=".repeat(60) + "\n");

  const checks = {
    database: {
      configured: configured(process.env.DATABASE_URL),
      value: configured(process.env.DATABASE_URL) ? "OK: configured" : "MISSING",
    },
    session: {
      configured: configured(process.env.SESSION_SECRET),
      value: configured(process.env.SESSION_SECRET) ? "OK: configured" : "MISSING",
    },
    incidentSecret: {
      configured: configured(process.env.INCIDENT_SIGNATURE_SECRET),
      value: configured(process.env.INCIDENT_SIGNATURE_SECRET)
        ? "OK: configured"
        : "WARNING: using default fallback (insecure)",
    },
    email: {
      configured: configured(process.env.BREVO_API_KEY),
      value: configured(process.env.BREVO_API_KEY) ? "OK: configured" : "NOT CONFIGURED",
      recipients: process.env.INCIDENT_EMAIL_RECIPIENTS || "Not set",
    },
    slack: {
      configured: configured(process.env.SLACK_WEBHOOK_URL),
      value: configured(process.env.SLACK_WEBHOOK_URL) ? "OK: configured" : "NOT CONFIGURED",
    },
    sms: {
      configured: configured(process.env.BREVO_API_KEY),
      value: configured(process.env.BREVO_API_KEY) ? "OK: configured" : "NOT CONFIGURED",
      recipients: process.env.INCIDENT_SMS_RECIPIENTS || "Not set",
    },
    escalation: {
      noAck: process.env.INCIDENT_ESCALATION_NO_ACK_MINUTES || "15 (default)",
      noResolution: process.env.INCIDENT_ESCALATION_NO_RESOLUTION_MINUTES || "120 (default)",
      breach: process.env.INCIDENT_ESCALATION_BREACH_MINUTES || "1440 (default)",
      hard: process.env.INCIDENT_ESCALATION_HARD_MINUTES || "4320 (default)",
    },
    oncall: {
      mode: process.env.ONCALL_ROTATION_MODE || "Not set",
      contact: process.env.ONCALL_DEFAULT_CONTACT_EMAIL || "Not set",
    },
  };

  console.log("CRITICAL CONFIGURATION");
  console.log("-".repeat(60));
  console.log(`  Database:              ${checks.database.value}`);
  console.log(`  Session Secret:        ${checks.session.value}`);
  console.log(`  Incident Signing:      ${checks.incidentSecret.value}`);
  console.log();

  console.log("NOTIFICATION CHANNELS");
  console.log("-".repeat(60));
  console.log(`  Email:                 ${checks.email.value}`);
  if (checks.email.configured) {
    console.log(`    Recipients:          ${checks.email.recipients}`);
  }
  console.log(`  Slack:                 ${checks.slack.value}`);
  console.log(`  SMS:                   ${checks.sms.value}`);
  if (checks.sms.configured) {
    console.log(`    Recipients:          ${checks.sms.recipients}`);
  }
  console.log();

  console.log("ESCALATION TIMERS (minutes)");
  console.log("-".repeat(60));
  console.log(`  No acknowledgment:     ${checks.escalation.noAck}`);
  console.log(`  No resolution:         ${checks.escalation.noResolution}`);
  console.log(`  Possible breach:       ${checks.escalation.breach}`);
  console.log(`  Hard escalation:       ${checks.escalation.hard}`);
  console.log();

  console.log("ON-CALL CONFIGURATION");
  console.log("-".repeat(60));
  console.log(`  Rotation Mode:         ${checks.oncall.mode}`);
  console.log(`  Default Contact:       ${checks.oncall.contact}`);
  console.log();

  const criticalMissing = [
    !checks.database.configured && "DATABASE_URL",
    !checks.session.configured && "SESSION_SECRET",
  ].filter(Boolean);

  const incidentEnvMissing = [
    !configured(process.env.BREVO_API_KEY) && "BREVO_API_KEY",
    !configured(process.env.INCIDENT_EMAIL_RECIPIENTS) && "INCIDENT_EMAIL_RECIPIENTS",
    !configured(process.env.INCIDENT_SIGNATURE_SECRET) && "INCIDENT_SIGNATURE_SECRET",
    requireSms && !configured(process.env.INCIDENT_SMS_RECIPIENTS) && "INCIDENT_SMS_RECIPIENTS",
    requireSlack && !configured(process.env.SLACK_WEBHOOK_URL) && "SLACK_WEBHOOK_URL",
  ].filter(Boolean);

  const warnings = [
    !checks.incidentSecret.configured && "INCIDENT_SIGNATURE_SECRET (using default fallback)",
    !checks.email.configured && "Email notifications",
    !checks.slack.configured && "Slack notifications",
    !checks.sms.configured && "SMS notifications",
  ].filter(Boolean);

  console.log("=".repeat(60));
  console.log("VALIDATION SUMMARY");
  console.log("=".repeat(60));

  if (criticalMissing.length > 0) {
    console.log("\nCRITICAL ISSUES:");
    criticalMissing.forEach((item) => console.log(`  - ${item}`));
  } else {
    console.log("\nOK: baseline critical configuration present");
  }

  if (warnings.length > 0) {
    console.log("\nWARNINGS (recommended improvements):");
    warnings.forEach((item) => console.log(`  - ${item}`));
  }

  if (enforceIncidentEnv && incidentEnvMissing.length > 0) {
    console.log("\nINCIDENT CHECKLIST ENV GAPS (enforced mode):");
    incidentEnvMissing.forEach((item) => console.log(`  - ${item}`));
  }

  const hasFailure =
    criticalMissing.length > 0 ||
    (enforceIncidentEnv && incidentEnvMissing.length > 0);

  console.log("\n" + "=".repeat(60));
  if (!hasFailure) {
    console.log("OK: configuration ready for testing");
    console.log("Next: npm run test:incidents");
  } else {
    console.log("INCOMPLETE: configuration has blocking gaps");
  }
  console.log("=".repeat(60) + "\n");

  return {
    valid: !hasFailure,
    criticalMissing,
    incidentEnvMissing,
    warnings,
  };
}

const result = validateEnvironment();
if (!result.valid) {
  process.exit(1);
}
