import type { NextFunction, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const localFallback = new Map<string, { count: number; resetAtMs: number }>();
const LOCAL_FALLBACK_MAX_KEYS = Math.max(
  1000,
  Number(process.env.RATE_LIMIT_FALLBACK_MAX_KEYS || 50000) || 50000
);
const LOCAL_FALLBACK_CLEANUP_INTERVAL_MS = Math.max(
  10000,
  Number(process.env.RATE_LIMIT_FALLBACK_CLEANUP_INTERVAL_MS || 5 * 60 * 1000) ||
    5 * 60 * 1000
);

type Options = {
  scope: string;
  limit: number;
  windowMs: number;
  key?: (req: Request) => string;
};

function pruneFallbackStore(nowMs: number) {
  for (const [key, value] of localFallback.entries()) {
    if (value.resetAtMs <= nowMs) {
      localFallback.delete(key);
    }
  }

  if (localFallback.size <= LOCAL_FALLBACK_MAX_KEYS) {
    return;
  }

  const overflow = localFallback.size - LOCAL_FALLBACK_MAX_KEYS;
  let removed = 0;
  for (const key of localFallback.keys()) {
    localFallback.delete(key);
    removed++;
    if (removed >= overflow) break;
  }
}

const fallbackCleanupTimer = setInterval(
  () => pruneFallbackStore(Date.now()),
  LOCAL_FALLBACK_CLEANUP_INTERVAL_MS
);
fallbackCleanupTimer.unref();

function fallbackCheck(key: string, windowMs: number, limit: number) {
  const now = Date.now();
  const current = localFallback.get(key);
  if (!current || current.resetAtMs <= now) {
    localFallback.set(key, { count: 1, resetAtMs: now + windowMs });
    if (localFallback.size > LOCAL_FALLBACK_MAX_KEYS) {
      pruneFallbackStore(now);
    }
    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterSec: Math.ceil(windowMs / 1000),
      resetAtMs: now + windowMs,
    };
  }
  current.count += 1;
  const remaining = Math.max(0, limit - current.count);
  const retryAfterSec = Math.max(1, Math.ceil((current.resetAtMs - now) / 1000));
  return {
    allowed: current.count <= limit,
    remaining,
    retryAfterSec,
    resetAtMs: current.resetAtMs,
  };
}

export function distributedRateLimit(opts: Options) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const windowMs = Math.max(1000, Number(opts.windowMs) || 60 * 1000);
    const limit = Math.max(1, Number(opts.limit) || 1);
    const identity =
      (opts.key ? opts.key(req) : "") ||
      String((req as any)?.user?.id || "").trim() ||
      String(req.ip || "unknown");

    const nowMs = Date.now();
    const windowStart = Math.floor(nowMs / windowMs);
    const windowEndMs = (windowStart + 1) * windowMs;
    const retryAfterSec = Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000));
    const scope = String(opts.scope || "global");

    try {
      const result: any = await db.execute(sql`
        INSERT INTO rate_limit_counters (scope, identity_key, window_start, count, updated_at)
        VALUES (${scope}, ${identity}, ${windowStart}, 1, now())
        ON CONFLICT (scope, identity_key, window_start)
        DO UPDATE SET count = rate_limit_counters.count + 1, updated_at = now()
        RETURNING count;
      `);
      const count = Number(result?.rows?.[0]?.count || 0);
      const remaining = Math.max(0, limit - count);

      res.setHeader("X-RateLimit-Limit", String(limit));
      res.setHeader("X-RateLimit-Remaining", String(remaining));
      res.setHeader("X-RateLimit-Reset", new Date(windowEndMs).toISOString());
      res.setHeader("Retry-After", String(retryAfterSec));

      if (count > limit) {
        return res.status(429).json({
          error: "Too many requests",
          message: "Rate limit exceeded. Please retry shortly.",
          retryAfter: retryAfterSec,
        });
      }

      next();
    } catch (error: any) {
      // Safe fallback while migration is rolling out.
      const fallbackKey = `${scope}:${identity}`;
      const fallback = fallbackCheck(fallbackKey, windowMs, limit);
      res.setHeader("X-RateLimit-Limit", String(limit));
      res.setHeader("X-RateLimit-Remaining", String(fallback.remaining));
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(fallback.resetAtMs).toISOString()
      );
      res.setHeader("Retry-After", String(fallback.retryAfterSec));
      if (!fallback.allowed) {
        return res.status(429).json({
          error: "Too many requests",
          message: "Rate limit exceeded. Please retry shortly.",
          retryAfter: fallback.retryAfterSec,
        });
      }
      next();
    }
  };
}
