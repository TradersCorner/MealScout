#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const truthy = (value) =>
  ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());

const requireSms = truthy(process.env.CHECKLIST_REQUIRE_SMS);
const requireSlack = truthy(process.env.CHECKLIST_REQUIRE_SLACK);

const checks = [
  {
    id: "config",
    title: "Validate incident configuration",
    command: "npm",
    args: ["run", "validate:config"],
    extraEnv: {
      CHECKLIST_ENFORCE_INCIDENT_ENV: "true",
    },
  },
  {
    id: "incidents",
    title: "Execute incident workflow tests",
    command: "npm",
    args: ["run", "test:incidents"],
    dependsOn: "config",
  },
];

const requiredIncidentEnv = [
  "BREVO_API_KEY",
  "INCIDENT_EMAIL_RECIPIENTS",
  "INCIDENT_SIGNATURE_SECRET",
  ...(requireSms ? ["INCIDENT_SMS_RECIPIENTS"] : []),
  ...(requireSlack ? ["SLACK_WEBHOOK_URL"] : []),
];

const getRerunCommand = () => {
  if (requireSms && requireSlack) {
    return "npm run checklist:incidents:strict";
  }
  if (requireSms) {
    return "cross-env CHECKLIST_REQUIRE_SMS=true npm run checklist:incidents";
  }
  if (requireSlack) {
    return "cross-env CHECKLIST_REQUIRE_SLACK=true npm run checklist:incidents";
  }
  return "npm run checklist:incidents";
};

const runCheck = (check) => {
  console.log(`\n> ${check.title}`);
  console.log(`  $ ${check.command} ${check.args.join(" ")}`);

  const result = spawnSync(check.command, check.args, {
    shell: process.platform === "win32",
    stdio: "inherit",
    env: {
      ...process.env,
      ...(check.extraEnv || {}),
    },
  });

  const passed = result.status === 0;
  console.log(`  ${passed ? "PASS" : "FAIL"}`);

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
    console.log("\nOK Required incident environment variables are present.");
    return;
  }

  console.log("\nMISSING/EMPTY incident environment variables:");
  for (const name of missing) {
    console.log(`  - ${name}`);
  }
};

const main = () => {
  console.log("=".repeat(64));
  console.log("MealScout Incident Staging Checklist");
  console.log("=".repeat(64));

  if (!requireSms) {
    console.log("Incident SMS requirement is optional (set CHECKLIST_REQUIRE_SMS=true to enforce).");
  }
  if (!requireSlack) {
    console.log("Incident Slack requirement is optional (set CHECKLIST_REQUIRE_SLACK=true to enforce).");
  }

  printMissingEnvSummary();

  const results = [];
  const byId = new Map();

  for (const check of checks) {
    if (check.dependsOn) {
      const dependency = byId.get(check.dependsOn);
      if (dependency && !dependency.passed) {
        console.log(`\n> ${check.title}`);
        console.log(`  Skipped because "${dependency.title}" failed.`);
        const skipped = {
          ...check,
          passed: false,
          skipped: true,
          exitCode: 1,
        };
        results.push(skipped);
        byId.set(check.id, skipped);
        continue;
      }
    }

    const result = runCheck(check);
    results.push(result);
    byId.set(check.id, result);
  }

  const failed = results.filter((item) => !item.passed);

  console.log("\n" + "=".repeat(64));
  console.log("Checklist Summary");
  console.log("=".repeat(64));
  for (const result of results) {
    const status = result.skipped
      ? "SKIPPED (blocked by failed dependency)"
      : result.passed
        ? "PASS"
        : "FAIL";
    console.log(`- ${result.title}: ${status}`);
  }

  if (!failed.length) {
    console.log("\nOK Incident staging checklist passed.");
    process.exit(0);
  }

  console.log("\nFAIL Incident staging checklist failed.");
  console.log("  Fix configuration/test failures above, then re-run:");
  console.log(`  ${getRerunCommand()}`);
  process.exit(1);
};

main();
