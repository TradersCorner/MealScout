import type { NextFunction, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const localFallback = new Map<string, { count: number; resetAtMs: number }>();

type Options = {
  scope: string;
  limit: number;
  windowMs: number;
  key?: (req: Request) => string;
};

function fallbackCheck(key: string, windowMs: number, limit: number) {
  const now = Date.now();
  const current = localFallback.get(key);
  if (!current || current.resetAtMs <= now) {
    localFallback.set(key, { count: 1, resetAtMs: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  current.count += 1;
  const remaining = Math.max(0, limit - current.count);
  const retryAfterSec = Math.max(1, Math.ceil((current.resetAtMs - now) / 1000));
  return { allowed: current.count <= limit, remaining, retryAfterSec };
}

export function distributedRateLimit(opts: Options) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identity =
      (opts.key ? opts.key(req) : "") ||
      String((req as any)?.user?.id || "").trim() ||
      String(req.ip || "unknown");

    const nowMs = Date.now();
    const windowStart = Math.floor(nowMs / opts.windowMs);
    const retryAfterSec = Math.max(1, Math.ceil(opts.windowMs / 1000));
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
      const remaining = Math.max(0, opts.limit - count);

      res.setHeader("X-RateLimit-Limit", String(opts.limit));
      res.setHeader("X-RateLimit-Remaining", String(remaining));
      res.setHeader("Retry-After", String(retryAfterSec));

      if (count > opts.limit) {
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
      const fallback = fallbackCheck(fallbackKey, opts.windowMs, opts.limit);
      res.setHeader("X-RateLimit-Limit", String(opts.limit));
      res.setHeader("X-RateLimit-Remaining", String(fallback.remaining));
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

