import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { getApiMetricsSnapshot } from "../observability";
import { getOpsCleanupSnapshot, runOpsDataCleanup } from "../opsCleanup";
import { getJobQueueStats } from "../jobs/jobQueue";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: Date.now() });
});

healthRouter.get("/health/realtime", (_req, res) => {
  res.json({ status: "ok", realtime: "ready", ts: Date.now() });
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
    cleanup: getOpsCleanupSnapshot(),
    jobs: getJobQueueStats(),
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
