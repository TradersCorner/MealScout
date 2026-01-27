/**
 * Rate Limiting Middleware
 *
 * Implements per-IP and per-user rate limiting for sensitive endpoints.
 * Uses in-memory store for development; use Redis for production.
 */
var store = {};
/**
 * Clean up expired entries (called periodically)
 */
function cleanup() {
    var now = Date.now();
    for (var key in store) {
        if (store[key].resetAt < now) {
            delete store[key];
        }
    }
}
// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);
/**
 * Create a rate limiter middleware
 * @param limit Max requests allowed
 * @param window Time window in milliseconds
 * @param keyGenerator Function to generate a unique key (default: IP)
 */
export function rateLimit(limit, window, // 1 minute default
keyGenerator) {
    if (window === void 0) { window = 60 * 1000; }
    return function (req, res, next) {
        var key = keyGenerator
            ? keyGenerator(req)
            : "ip:".concat(req.ip);
        var now = Date.now();
        var entry = store[key];
        if (!entry || entry.resetAt < now) {
            // New entry or expired
            store[key] = {
                count: 1,
                resetAt: now + window,
            };
            return next();
        }
        if (entry.count >= limit) {
            var resetIn = Math.ceil((entry.resetAt - now) / 1000);
            res.set('Retry-After', resetIn);
            res.set('X-RateLimit-Limit', limit);
            res.set('X-RateLimit-Remaining', '0');
            return res.status(429).json({
                error: 'Too many requests',
                message: "Rate limit exceeded. Try again in ".concat(resetIn, " seconds."),
                retryAfter: resetIn,
            });
        }
        entry.count++;
        res.set('X-RateLimit-Limit', limit);
        res.set('X-RateLimit-Remaining', limit - entry.count);
        next();
    };
}
/**
 * Create a per-user rate limiter
 */
export var rateLimitByUser = function (limit, window) {
    return rateLimit(limit, window, function (req) {
        var _a;
        var userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.ip;
        return "user:".concat(userId);
    });
};
/**
 * Create a per-IP rate limiter
 */
export var rateLimitByIp = function (limit, window) {
    return rateLimit(limit, window, function (req) { return "ip:".concat(req.ip); });
};
/**
 * Preset rate limiters for common endpoints
 */
export var rateLimiters = {
    // Authentication endpoints: 10 attempts per minute
    auth: rateLimit(10, 60 * 1000),
    // Password reset: 3 attempts per 15 minutes
    passwordReset: rateLimit(3, 15 * 60 * 1000),
    // API creation: 100 requests per minute per user
    apiCreate: rateLimitByUser(100, 60 * 1000),
    // Public search: 60 requests per minute per IP
    publicSearch: rateLimitByIp(60, 60 * 1000),
    // Sensitive operations: 30 requests per minute per user
    sensitive: rateLimitByUser(30, 60 * 1000),
};
