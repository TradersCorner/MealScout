import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

type HistogramBucket = {
  le: number;
  count: number;
};

const LATENCY_BUCKETS_MS = [25, 50, 100, 200, 300, 500, 1000, 2000, 5000];
const latencyHistogram: HistogramBucket[] = LATENCY_BUCKETS_MS.map((le) => ({
  le,
  count: 0,
}));

const counters = {
  total: 0,
  error4xx: 0,
  error5xx: 0,
  apiTotal: 0,
  api4xx: 0,
  api5xx: 0,
};

const requestDurationsMs: number[] = [];
const MAX_SAMPLES = 20_000;
const startedAt = Date.now();

function pushDuration(durationMs: number) {
  requestDurationsMs.push(durationMs);
  if (requestDurationsMs.length > MAX_SAMPLES) {
    requestDurationsMs.splice(0, requestDurationsMs.length - MAX_SAMPLES);
  }
}

function observeLatency(durationMs: number) {
  for (const bucket of latencyHistogram) {
    if (durationMs <= bucket.le) {
      bucket.count += 1;
    }
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const incoming = String(req.headers["x-request-id"] || "").trim();
    const requestId = incoming || crypto.randomUUID();
    (req as any).requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
  };
}

export function apiMetricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const durationMs = Date.now() - start;
      const status = Number(res.statusCode || 0);
      const isApi = String(req.path || "").startsWith("/api/");

      counters.total += 1;
      if (status >= 400 && status < 500) counters.error4xx += 1;
      if (status >= 500) counters.error5xx += 1;

      if (isApi) {
        counters.apiTotal += 1;
        if (status >= 400 && status < 500) counters.api4xx += 1;
        if (status >= 500) counters.api5xx += 1;
        observeLatency(durationMs);
        pushDuration(durationMs);
      }
    });
    next();
  };
}

export function getApiMetricsSnapshot() {
  const uptimeSec = Math.floor((Date.now() - startedAt) / 1000);
  const apiCount = counters.apiTotal;
  const p95Ms = percentile(requestDurationsMs, 95);
  const p99Ms = percentile(requestDurationsMs, 99);
  const apiErrorRate =
    apiCount > 0 ? Number((((counters.api4xx + counters.api5xx) / apiCount) * 100).toFixed(3)) : 0;
  const apiServerErrorRate =
    apiCount > 0 ? Number(((counters.api5xx / apiCount) * 100).toFixed(3)) : 0;

  return {
    uptimeSec,
    counters: { ...counters },
    api: {
      p95Ms,
      p99Ms,
      errorRatePct: apiErrorRate,
      serverErrorRatePct: apiServerErrorRate,
      sampleSize: requestDurationsMs.length,
      latencyBucketsMs: latencyHistogram.map((b) => ({ le: b.le, count: b.count })),
    },
  };
}

