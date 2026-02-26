/**
 * SOC-lite Configuration Validator
 * 
 * Validates incident management configuration without requiring database access.
 * Use this to verify environment setup before running full tests.
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });
dotenv.config({ path: '.env.development', override: true });

// Check environment configuration
function validateEnvironment() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 SOC-lite Configuration Validator');
  console.log('='.repeat(60) + '\n');

  const checks = {
    database: {
      name: 'Database Connection',
      configured: !!process.env.DATABASE_URL,
      required: true,
      value: process.env.DATABASE_URL ? '✓ Configured' : '✗ Missing',
    },
    session: {
      name: 'Session Secret',
      configured: !!process.env.SESSION_SECRET,
      required: true,
      value: process.env.SESSION_SECRET ? '✓ Configured' : '✗ Missing',
    },
    incidentSecret: {
      name: 'Incident Signature Secret',
      configured: !!process.env.INCIDENT_SIGNATURE_SECRET,
      required: true,
      value: process.env.INCIDENT_SIGNATURE_SECRET ? '✓ Configured' : '⚠ Using default (insecure)',
    },
    email: {
      name: 'Email Notifications',
      configured: !!process.env.BREVO_API_KEY,
      required: false,
      value: process.env.BREVO_API_KEY ? '✓ Brevo configured' : '✗ Not configured',
      recipients: process.env.INCIDENT_EMAIL_RECIPIENTS || 'Not set',
    },
    slack: {
      name: 'Slack Notifications',
      configured: !!process.env.SLACK_WEBHOOK_URL,
      required: false,
      value: process.env.SLACK_WEBHOOK_URL ? '✓ Configured' : '✗ Not configured',
    },
    sms: {
      name: 'SMS Notifications (Critical only)',
      configured: !!process.env.BREVO_API_KEY,
      required: false,
      value: process.env.BREVO_API_KEY ? '✓ Brevo configured' : '✗ Not configured',
      recipients: process.env.INCIDENT_SMS_RECIPIENTS || 'Not set',
    },
    escalation: {
      name: 'Escalation Timers',
      configured: true,
      required: false,
      noAck: process.env.INCIDENT_ESCALATION_NO_ACK_MINUTES || '15 (default)',
      noResolution: process.env.INCIDENT_ESCALATION_NO_RESOLUTION_MINUTES || '120 (default)',
      breach: process.env.INCIDENT_ESCALATION_BREACH_MINUTES || '1440 (default)',
      hard: process.env.INCIDENT_ESCALATION_HARD_MINUTES || '4320 (default)',
    },
    oncall: {
      name: 'On-call Configuration',
      configured: !!process.env.ONCALL_DEFAULT_CONTACT_EMAIL,
      required: false,
      mode: process.env.ONCALL_ROTATION_MODE || 'Not set',
      contact: process.env.ONCALL_DEFAULT_CONTACT_EMAIL || 'Not set',
    },
  };

  // Critical checks
  console.log('📋 CRITICAL CONFIGURATION (Required for operation)');
  console.log('─'.repeat(60));
  console.log(`  Database:              ${checks.database.value}`);
  console.log(`  Session Secret:        ${checks.session.value}`);
  console.log(`  Incident Signing:      ${checks.incidentSecret.value}`);
  console.log();

  // Notification channels
  console.log('📢 NOTIFICATION CHANNELS (Optional but recommended)');
  console.log('─'.repeat(60));
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

  // Escalation timers
  console.log('⏱️  ESCALATION TIMERS (Minutes)');
  console.log('─'.repeat(60));
  console.log(`  No Acknowledgment:     ${checks.escalation.noAck}`);
  console.log(`  No Resolution:         ${checks.escalation.noResolution}`);
  console.log(`  Possible Breach:       ${checks.escalation.breach}`);
  console.log(`  Hard Escalation:       ${checks.escalation.hard}`);
  console.log();

  // On-call config
  console.log('👤 ON-CALL CONFIGURATION');
  console.log('─'.repeat(60));
  console.log(`  Rotation Mode:         ${checks.oncall.mode}`);
  console.log(`  Default Contact:       ${checks.oncall.contact}`);
  console.log();

  // Anomaly rules
  console.log('🚨 ANOMALY DETECTION RULES');
  console.log('─'.repeat(60));
  console.log('  1. Password Reset Abuse        (Severity: MEDIUM)');
  console.log('     Threshold: >3 attempts in 60 minutes');
  console.log();
  console.log('  2. Failed Login Spike          (Severity: HIGH)');
  console.log('     Threshold: 5+ failed logins in 5 minutes');
  console.log();
  console.log('  3. Menu/Allergy Edit Abuse     (Severity: MEDIUM)');
  console.log('     Threshold: >20 edits in 60 minutes');
  console.log();
  console.log('  4. Deal Price Manipulation     (Severity: HIGH)');
  console.log('     Threshold: >10 changes in 24 hours');
  console.log();
  console.log('  5. Location Mismatch           (Severity: HIGH)');
  console.log('     Threshold: Region mismatch detected');
  console.log();
  console.log('  6. API Key Anomaly             (Severity: CRITICAL)');
  console.log('     Threshold: New country usage detected');
  console.log();

  // Summary
  const criticalMissing = [
    !checks.database.configured && 'DATABASE_URL',
    !checks.session.configured && 'SESSION_SECRET',
  ].filter(Boolean);

  const warnings = [
    !checks.incidentSecret.configured && 'INCIDENT_SIGNATURE_SECRET (using default - not secure)',
    !checks.email.configured && 'Email notifications',
    !checks.slack.configured && 'Slack notifications',
    !checks.sms.configured && 'SMS notifications',
  ].filter(Boolean);

  console.log('='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));

  if (criticalMissing.length > 0) {
    console.log('\n❌ CRITICAL ISSUES (Must fix before running):');
    criticalMissing.forEach(item => console.log(`   - ${item}`));
    console.log('\n💡 Add these to your .env file to proceed.');
  } else {
    console.log('\n✅ All critical configuration present');
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (Optional but recommended):');
    warnings.forEach(item => console.log(`   - ${item}`));
    console.log('\n💡 Configure these for full SOC-lite functionality.');
  }

  console.log('\n' + '='.repeat(60));
  
  if (criticalMissing.length === 0) {
    console.log('✅ Configuration ready for testing!');
    console.log('\nNext step: Run incident tests');
    console.log('  npm run test:incidents');
  } else {
    console.log('⚠️  Configuration incomplete');
    console.log('\nNext step: Complete required configuration in .env file');
  }
  
  console.log('='.repeat(60) + '\n');

  return {
    valid: criticalMissing.length === 0,
    criticalMissing,
    warnings,
  };
}

// Run validation
validateEnvironment();
