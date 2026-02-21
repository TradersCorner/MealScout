import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { getApiMetricsSnapshot } from "../observability";
import { getOpsCleanupSnapshot, runOpsDataCleanup } from "../opsCleanup";
import { getJobQueueStats } from "../jobs/jobQueue";
import { getMapEndpointWatchdogSnapshot } from "../mapEndpointWatchdog";

export const healthRouter = Router();

function envPresent(name: string) {
  return Boolean(String(process.env[name] || "").trim());
}

function getConfigSnapshot() {
  return {
    nodeEnv: String(process.env.NODE_ENV || "development"),
    required: {
      databaseUrl: envPresent("DATABASE_URL"),
      sessionSecret: envPresent("SESSION_SECRET"),
      clientOrigin: envPresent("CLIENT_ORIGIN"),
    },
    payments: {
      stripeSecretKey: envPresent("STRIPE_SECRET_KEY"),
      mealscoutBypassStripe: String(process.env.MEALSCOUT_BYPASS_STRIPE || "").toLowerCase() === "true",
      mealscoutTestMode: String(process.env.MEALSCOUT_TEST_MODE || "").toLowerCase() === "true",
    },
    observability: {
      healthMetricsToken: envPresent("HEALTH_METRICS_TOKEN"),
      sentryDsn: envPresent("SENTRY_DSN"),
    },
    queue: {
      concurrency: Number(process.env.JOB_QUEUE_CONCURRENCY || 2) || 2,
      maxSize: Number(process.env.JOB_QUEUE_MAX_SIZE || 5000) || 5000,
      maxAttempts: Number(process.env.JOB_QUEUE_MAX_ATTEMPTS || 3) || 3,
      timeoutMs: Number(process.env.JOB_QUEUE_TIMEOUT_MS || 30000) || 30000,
    },
  };
}

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: Date.now() });
});

healthRouter.get("/health/realtime", (_req, res) => {
  res.json({ status: "ok", realtime: "ready", ts: Date.now() });
});

healthRouter.get("/health/map-endpoints", (_req, res) => {
  const snapshot = getMapEndpointWatchdogSnapshot();
  const status = snapshot.ok ? "ok" : "degraded";
  res.status(snapshot.ok ? 200 : 503).json({
    status,
    ts: Date.now(),
    watchdog: snapshot,
  });
});

healthRouter.get("/health/ready", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ready", db: "ok", ts: Date.now() });
  } catch (error: any) {
    res.status(503).json({
      status: "not_ready",
      db: "error",
      message: error?.message || "Database check failed",
      ts: Date.now(),
    });
  }
});

healthRouter.get("/health/metrics", (req, res) => {
  const expected = String(process.env.HEALTH_METRICS_TOKEN || "").trim();
  const provided = String(req.headers["x-health-token"] || "").trim();
  if (expected && provided !== expected) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({
    status: "ok",
    ts: Date.now(),
    metrics: getApiMetricsSnapshot(),
    mapEndpoints: getMapEndpointWatchdogSnapshot(),
    cleanup: getOpsCleanupSnapshot(),
    jobs: getJobQueueStats(),
    config: getConfigSnapshot(),
  });
});

healthRouter.post("/health/maintenance/cleanup", async (req, res) => {
  const expected = String(process.env.HEALTH_METRICS_TOKEN || "").trim();
  const provided = String(req.headers["x-health-token"] || "").trim();
  if (!expected || provided !== expected) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await runOpsDataCleanup();
  if (!result.ok) {
    return res.status(500).json({ status: "error", cleanup: result });
  }
  return res.json({ status: "ok", cleanup: result });
});
