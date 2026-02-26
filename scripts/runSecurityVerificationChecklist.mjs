#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const checks = [
  {
    id: "incidents",
    title: "Incident tri-channel checklist",
    command: "npm",
    args: ["run", "checklist:incidents"],
  },
  {
    id: "rbac",
    title: "Staff RBAC runtime verification",
    command: "npm",
    args: ["run", "test:staff-rbac"],
  },
];

const requiredEnvByCheck = {
  incidents: [
    "BREVO_API_KEY",
    "INCIDENT_EMAIL_RECIPIENTS",
    "INCIDENT_SMS_RECIPIENTS",
    "SLACK_WEBHOOK_URL",
    "INCIDENT_SIGNATURE_SECRET",
  ],
  rbac: [
    "RBAC_COOKIE_CUSTOMER",
    "RBAC_COOKIE_STAFF",
    "RBAC_COOKIE_ADMIN",
    "RBAC_BASE_URL",
  ],
};

const getMissing = (names) =>
  names.filter((name) => {
    const value = process.env[name];
    return !value || String(value).trim().length === 0;
  });

const printEnvSummary = () => {
  console.log("Environment readiness snapshot:");

  for (const check of checks) {
    const required = requiredEnvByCheck[check.id] || [];
    const missing = getMissing(required);

    if (!missing.length) {
      console.log(`- ${check.title}: ✅ env ready`);
      continue;
    }

    console.log(`- ${check.title}: ⚠ missing env (${missing.length})`);
    for (const name of missing) {
      console.log(`  - ${name}`);
    }
  }
};

const runCheck = (check) => {
  console.log(`\n▶ ${check.title}`);
  console.log(`   $ ${check.command} ${check.args.join(" ")}`);

  const result = spawnSync(check.command, check.args, {
    shell: process.platform === "win32",
    stdio: "inherit",
    env: process.env,
  });

  const passed = result.status === 0;
  console.log(`   ${passed ? "✅ PASS" : "❌ FAIL"}`);

  return {
    ...check,
    passed,
    exitCode: result.status ?? 1,
  };
};

const main = () => {
  console.log("=".repeat(66));
  console.log("MealScout Security Verification Checklist");
  console.log("=".repeat(66));

  printEnvSummary();

  const results = checks.map(runCheck);

  console.log("\n" + "=".repeat(66));
  console.log("Checklist Summary");
  console.log("=".repeat(66));

  let hasFailure = false;
  for (const result of results) {
    console.log(`- ${result.title}: ${result.passed ? "PASS" : "FAIL"}`);
    if (!result.passed) {
      hasFailure = true;
    }
  }

  if (!hasFailure) {
    console.log("\n✅ Security verification checklist passed.");
    process.exit(0);
  }

  console.log("\n❌ Security verification checklist failed.");
  console.log(
    "   Populate missing env/secrets, then rerun: npm run checklist:security",
  );
  process.exit(1);
};

main();
