#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const checks = [
  {
    id: "config",
    title: "Validate incident configuration",
    command: "npm",
    args: ["run", "validate:config"],
  },
  {
    id: "incidents",
    title: "Execute incident workflow tests",
    command: "npm",
    args: ["run", "test:incidents"],
  },
];

const requireSms = ["1", "true", "yes", "on"].includes(
  String(process.env.CHECKLIST_REQUIRE_SMS || "").trim().toLowerCase(),
);

const requiredIncidentEnv = [
  "BREVO_API_KEY",
  "INCIDENT_EMAIL_RECIPIENTS",
  "SLACK_WEBHOOK_URL",
  "INCIDENT_SIGNATURE_SECRET",
];

if (requireSms) {
  requiredIncidentEnv.push("INCIDENT_SMS_RECIPIENTS");
}

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

const printMissingEnvSummary = () => {
  const missing = requiredIncidentEnv.filter((name) => {
    const value = process.env[name];
    return !value || !String(value).trim();
  });

  if (!missing.length) {
    console.log("\n✅ Required incident environment variables are present.");
    return;
  }

  console.log("\n⚠ Missing/empty incident environment variables:");
  for (const name of missing) {
    console.log(`   - ${name}`);
  }
};

const main = () => {
  console.log("=".repeat(64));
  console.log("MealScout Incident Staging Checklist");
  console.log("=".repeat(64));

  if (!requireSms) {
    console.log("SMS requirement is optional (set CHECKLIST_REQUIRE_SMS=true to enforce).");
  }

  printMissingEnvSummary();

  const results = checks.map(runCheck);
  const failed = results.filter((item) => !item.passed);

  console.log("\n" + "=".repeat(64));
  console.log("Checklist Summary");
  console.log("=".repeat(64));
  for (const result of results) {
    console.log(`- ${result.title}: ${result.passed ? "PASS" : "FAIL"}`);
  }

  if (!failed.length) {
    console.log("\n✅ Incident staging checklist passed.");
    process.exit(0);
  }

  console.log("\n❌ Incident staging checklist failed.");
  console.log("   Fix configuration/test failures above, then re-run:");
  console.log("   npm run checklist:incidents");
  process.exit(1);
};

main();
