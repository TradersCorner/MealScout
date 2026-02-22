import type { Request, Response, NextFunction } from "express";

/**
 * Middleware to verify TradeScout API token
 * Validates Bearer token from Authorization header
 */
export function verifyTradeScoutToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header. Use: Authorization: Bearer <token>",
    });
  }

  // Verify token matches expected token(s)
  // Rotation support:
  // - TRADESCOUT_API_TOKENS="tokenA,tokenB"
  // - TRADESCOUT_API_TOKEN="tokenA" (legacy / single-token)
  const tokenList = String(
    process.env.TRADESCOUT_API_TOKENS || process.env.TRADESCOUT_API_TOKEN || ""
  )
    .split(/[\n,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokenList.length === 0) {
    console.error(
      "⚠️  WARNING: TRADESCOUT_API_TOKEN(S) not configured in environment"
    );
    return res.status(500).json({
      error: "Server configuration error",
      message: "API token not configured",
    });
  }

  if (!tokenList.includes(String(token))) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid API token",
    });
  }

  // Token is valid, proceed
  next();
}

/**
 * Optional: Rate limiting middleware for action routes
 * Limits requests per IP to prevent abuse
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimitActions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 100; // 100 requests per minute

  const current = requestCounts.get(ip);

  if (!current || now > current.resetAt) {
    requestCounts.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
  } else {
    current.count++;

    if (current.count > maxRequests) {
      return res.status(429).json({
        error: "Too many requests",
        message: `Rate limit exceeded: ${maxRequests} requests per minute`,
        retryAfter: Math.ceil((current.resetAt - now) / 1000),
      });
    }
  }

  next();
}
