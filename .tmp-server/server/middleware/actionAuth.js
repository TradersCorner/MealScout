/**
 * Middleware to verify TradeScout API token
 * Validates Bearer token from Authorization header
 */
export function verifyTradeScoutToken(req, res, next) {
    // Extract token from Authorization header
    var authHeader = req.headers.authorization;
    var token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.replace("Bearer ", "");
    // Check if token exists
    if (!token) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Missing or invalid Authorization header. Use: Authorization: Bearer <token>",
        });
    }
    // Verify token matches expected token
    var expectedToken = process.env.TRADESCOUT_API_TOKEN;
    if (!expectedToken) {
        console.error("⚠️  WARNING: TRADESCOUT_API_TOKEN not configured in environment");
        return res.status(500).json({
            error: "Server configuration error",
            message: "API token not configured",
        });
    }
    if (token !== expectedToken) {
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
var requestCounts = new Map();
export function rateLimitActions(req, res, next) {
    var ip = req.ip || "unknown";
    var now = Date.now();
    var windowMs = 60 * 1000; // 1 minute window
    var maxRequests = 100; // 100 requests per minute
    var current = requestCounts.get(ip);
    if (!current || now > current.resetAt) {
        requestCounts.set(ip, {
            count: 1,
            resetAt: now + windowMs,
        });
    }
    else {
        current.count++;
        if (current.count > maxRequests) {
            return res.status(429).json({
                error: "Too many requests",
                message: "Rate limit exceeded: ".concat(maxRequests, " requests per minute"),
                retryAfter: Math.ceil((current.resetAt - now) / 1000),
            });
        }
    }
    next();
}
