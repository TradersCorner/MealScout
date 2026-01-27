var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import "dotenv/config";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import passport from "passport";
import { registerRoutes } from "./routes.js";
import actionRoutes from "./routes/actionRoutes.js";
import { verifyTradeScoutToken, rateLimitActions, } from "./middleware/actionAuth.js";
import { storage } from "./storage.js";
import { setupWebSocketServer } from "./websocket.js";
import { antiScrape } from "./middleware/antiScrape.js";
import { getSession } from "./unifiedAuth.js";
import { db } from "./db.js";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { validateEnv } from "./utils/env.js";
import { healthRouter } from "./routes/health.js";
import { videoStories, restaurants } from "@shared/schema";
import { eq } from "drizzle-orm";
validateEnv();
var app = express();
// ---- CORS (required for www.mealscout.us -> mealscout.onrender.com) ----
var defaultOrigins = [
    "https://www.mealscout.us",
    "https://mealscout.us",
    "https://mealscout.onrender.com",
    "https://meal-scout.vercel.app",
    "http://localhost:5174",
    "http://localhost:5200",
    "http://localhost:5000",
];
var allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultOrigins.join(","))
    .split(",")
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
app.use(function (req, res, next) {
    var origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    }
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});
// Enhanced global error handlers to prevent server crashes during deployment
process.on("uncaughtException", function (error) {
    console.error("❌ Uncaught Exception:", error);
    console.error("Stack trace:", error.stack);
    if (process.env.NODE_ENV === "production") {
        console.warn("⚠️  Production mode: Server continuing despite uncaught exception to maintain service availability");
        console.log("🔍 Error details logged for debugging. Service remains operational.");
    }
    else {
        console.error("💥 Development mode: Exiting process due to uncaught exception");
        process.exit(1);
    }
});
process.on("unhandledRejection", function (reason, promise) {
    console.error("❌ Unhandled Promise Rejection at:", promise);
    console.error("Rejection reason:", reason);
    if (process.env.NODE_ENV === "production") {
        console.warn("⚠️  Production mode: Server continuing despite unhandled rejection");
        console.log("🔍 Rejection details logged for debugging. Service remains operational.");
    }
    else {
        console.warn("⚠️  Development mode: Unhandled rejection detected - consider adding proper error handling");
    }
});
// Enhanced graceful shutdown handling
var isShuttingDown = false;
var gracefulShutdown = function (signal) {
    if (isShuttingDown) {
        console.log("\uD83D\uDD04 ".concat(signal, " received again. Forcing immediate shutdown..."));
        process.exit(1);
    }
    isShuttingDown = true;
    console.log("\uD83D\uDD04 ".concat(signal, " received. Initiating graceful shutdown..."));
    // Give the server a few seconds to finish processing current requests
    setTimeout(function () {
        console.log("✅ Graceful shutdown completed");
        process.exit(0);
    }, 5000);
};
process.on("SIGTERM", function () { return gracefulShutdown("SIGTERM"); });
process.on("SIGINT", function () { return gracefulShutdown("SIGINT"); });
// Add warning handler for potential memory leaks
process.on("warning", function (warning) {
    if (warning.name === "MaxListenersExceededWarning") {
        console.warn("⚠️  Memory leak warning:", warning.message);
        console.warn("🔍 Consider investigating event listener usage");
    }
});
// Production security and performance middleware
if (process.env.NODE_ENV === "production") {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https:", "ws:", "wss:"],
                fontSrc: ["'self'", "https:", "data:"],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    app.use(compression({
        filter: function (req, res) {
            if (req.headers["x-no-compression"]) {
                return false;
            }
            return compression.filter(req, res);
        },
    }));
}
// Anti-scrape middleware: allow TradeScout crawler, block obvious scrapers
app.use(antiScrape);
// Basic health endpoints (no auth)
app.use(healthRouter);
// CSP for development - permissive to allow Vite HMR and inline scripts
if (process.env.NODE_ENV !== "production") {
    app.use(function (req, res, next) {
        if (req.path.startsWith("/api/")) {
            return next();
        }
        res.setHeader("Content-Security-Policy", "default-src 'self' data: https: http: blob:; " +
            "style-src 'self' 'unsafe-inline' https:; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; " +
            "connect-src 'self' https: http: wss: ws: " +
            "https://geocoding.census.gov " +
            "https://api.zippopotam.us " +
            "https://api.bigdatacloud.net " +
            "https://nominatim.openstreetmap.org " +
            "https://ipapi.co; " +
            "img-src 'self' data: https: blob:; " +
            "font-src 'self' https: data:; " +
            "worker-src 'self' blob:;");
        next();
    });
}
var rateLimitStore = {};
// Helper to create rate limit middleware
function createRateLimiter(options) {
    return function (req, res, next) {
        var key = options.keyGenerator
            ? options.keyGenerator(req)
            : req.ip || "unknown";
        var now = Date.now();
        if (!rateLimitStore[key]) {
            rateLimitStore[key] = { count: 0, resetTime: now + options.windowMs };
        }
        // Reset if window expired
        if (now > rateLimitStore[key].resetTime) {
            rateLimitStore[key] = { count: 0, resetTime: now + options.windowMs };
        }
        rateLimitStore[key].count++;
        res.setHeader("X-RateLimit-Limit", options.maxRequests);
        res.setHeader("X-RateLimit-Remaining", Math.max(0, options.maxRequests - rateLimitStore[key].count));
        res.setHeader("X-RateLimit-Reset", new Date(rateLimitStore[key].resetTime).toISOString());
        if (rateLimitStore[key].count > options.maxRequests) {
            return res.status(429).json({
                error: "Too many requests",
                message: "Rate limit exceeded. Please try again after ".concat(Math.ceil((rateLimitStore[key].resetTime - now) / 1000), " seconds."),
                retryAfter: Math.ceil((rateLimitStore[key].resetTime - now) / 1000),
            });
        }
        next();
    };
}
// RATE LIMIT POLICIES - Optimized per endpoint type
// Strategy: "Fast first click, slow spam" - generous for normal users, strict for attackers
// 1. Authentication endpoints - Very strict (prevent brute force)
var strictAuthLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 3, // 3 attempts max
    keyGenerator: function (req) { return "".concat(req.ip, ":").concat(req.path); },
});
// 2. General authentication (moderate)
var authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts
    keyGenerator: function (req) { return "".concat(req.ip, ":").concat(req.path); },
});
// 3. Search and discovery (generous for normal users)
var searchLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 searches per minute
    keyGenerator: function (req) { return req.ip || "unknown"; },
});
// 4. Deal views and engagement (very generous)
var viewLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 views per minute
    keyGenerator: function (req) { return req.ip || "unknown"; },
});
// 5. Content updates (strict for restaurant owners)
var updateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 edits per hour
    keyGenerator: function (req) { var _a; return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) ? "".concat(req.user.id, ":").concat(req.path) : "".concat(req.ip, ":").concat(req.path); }, // Per-user limit with IP fallback for anonymous traffic
});
// Wrap a limiter so it only applies to mutation methods
function onlyMutations(limiter) {
    return function (req, res, next) {
        if (req.method === "GET" ||
            req.method === "HEAD" ||
            req.method === "OPTIONS") {
            return next();
        }
        return limiter(req, res, next);
    };
}
// 6. General API (moderate baseline)
var apiLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per window
    keyGenerator: function (req) { return req.ip || "unknown"; },
});
// Body parsing with size limits (keep Stripe webhook raw for signature verification)
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(function (req, res, next) {
    if (req.path === "/api/stripe/webhook")
        return next();
    return express.json({ limit: "10mb" })(req, res, next);
});
app.use(function (req, res, next) {
    if (req.path === "/api/stripe/webhook")
        return next();
    return express.urlencoded({ extended: false, limit: "10mb" })(req, res, next);
});
var REDACTED_LOG_KEYS = new Set([
    "passwordHash",
    "googleAccessToken",
    "facebookAccessToken",
    "tradescoutId",
    "stripeCustomerId",
    "stripeSubscriptionId",
]);
var redactLogPayload = function (payload) {
    if (!payload)
        return "";
    try {
        return JSON.stringify(payload, function (key, value) {
            return REDACTED_LOG_KEYS.has(key) ? "[redacted]" : value;
        });
    }
    catch (_a) {
        return "[unserializable]";
    }
};
app.use(function (req, res, next) {
    var start = Date.now();
    var path = req.path;
    var capturedJsonResponse = undefined;
    var originalResJson = res.json;
    res.json = function (bodyJson) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, __spreadArray([bodyJson], args, true));
    };
    res.on("finish", function () {
        var duration = Date.now() - start;
        if (path.startsWith("/api")) {
            var logLine = "".concat(req.method, " ").concat(path, " ").concat(res.statusCode, " in ").concat(duration, "ms");
            var redactedPayload = redactLogPayload(capturedJsonResponse);
            if (redactedPayload) {
                logLine += " :: ".concat(redactedPayload);
            }
            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }
            console.log(logLine);
        }
    });
    next();
});
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_1, dbUrl, server, setupVite, distPath, serveStatic, port;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db.execute(sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1 as test"], ["SELECT 1 as test"]))))];
            case 1:
                _a.sent();
                console.log("✅ Database connection established successfully");
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.warn("⚠️  Warning: Could not connect to database during startup:", error_1 instanceof Error ? error_1.message : String(error_1));
                console.log("🚀 Server will continue starting, database initialization will be performed after startup");
                // Log connection details for debugging (without exposing credentials)
                if (process.env.DATABASE_URL) {
                    dbUrl = process.env.DATABASE_URL.replace(/\/\/.*@/, "//***:***@");
                    console.log("📋 Database URL format:", dbUrl);
                }
                else {
                    console.warn("⚠️  DATABASE_URL environment variable not set");
                }
                return [3 /*break*/, 3];
            case 3:
                // Setup session configuration before routes
                // Trust first proxy so req.secure is honored behind Vercel/Render and Secure cookies are set
                app.set("trust proxy", 1);
                app.use(function (req, _res, next) {
                    if (process.env.NODE_ENV === "production") {
                        console.log("🌐 trust proxy enabled -> req.secure:", req.secure);
                    }
                    next();
                });
                app.use(getSession());
                app.use(passport.initialize());
                app.use(passport.session());
                // Debug endpoint to verify session/cookie forwarding after redirects
                app.get("/api/debug/session", function (req, res) {
                    var _a;
                    res.json({
                        sessionID: req.sessionID || null,
                        user: req.user || null,
                        cookie: ((_a = req.headers) === null || _a === void 0 ? void 0 : _a.cookie) || null,
                        isAuthenticated: typeof req.isAuthenticated === "function"
                            ? req.isAuthenticated()
                            : false,
                    });
                });
                // Apply granular rate limiting - optimized per endpoint
                // 🔒 STRICT - Authentication (prevent brute force)
                app.use("/api/auth/forgot-password", strictAuthLimiter);
                app.use("/api/auth/reset-password", strictAuthLimiter);
                // 🔐 MODERATE - Auth attempts (login, signup)
                app.use("/api/auth/login", authLimiter);
                app.use("/api/auth/signup", authLimiter);
                app.use("/api/auth/tradescout/sso", authLimiter);
                // 🔍 GENEROUS - Search and discovery
                app.use("/api/restaurants/search", searchLimiter);
                app.use("/api/restaurants/nearby", searchLimiter);
                // 👀 VERY GENEROUS - Deal views (engagement tracking)
                app.use("/api/deals/:dealId/view", viewLimiter);
                app.use("/api/restaurants/:restaurantId/locations", viewLimiter);
                // ✏️  STRICT - Content updates (prevent spam editing)
                app.use("/api/deals", onlyMutations(updateLimiter));
                app.use("/api/restaurants/:restaurantId/location", updateLimiter);
                app.use("/api/restaurants/:restaurantId/operating-hours", updateLimiter);
                app.use("/api/restaurants/:restaurantId/mobile-settings", updateLimiter);
                // 📞 MODERATE - General API and reports
                app.use("/api/bug-report", apiLimiter);
                // OAuth normalization middleware - DISABLED because it breaks OAuth flow
                // The redirect was interfering with the Passport.js OAuth flow by redirecting before authentication
                // OAuth works correctly as long as callback URLs are properly configured in Google Cloud Console
                // app.use((req, res, next) => {
                //   const publicBaseUrl = process.env.PUBLIC_BASE_URL;
                //   if (publicBaseUrl && req.path.startsWith('/api/auth/google')) {
                //     const canonicalHost = new URL(publicBaseUrl).hostname;
                //     if (req.hostname !== canonicalHost) {
                //       const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
                //       const redirectUrl = `${publicBaseUrl}${req.path}${queryString}`;
                //       log(`Redirecting Google OAuth ${req.hostname} to canonical domain: ${redirectUrl}`);
                //       return res.redirect(307, redirectUrl);
                //     }
                //   }
                //   next();
                // });
                //       return res.redirect(302, redirectUrl);
                //     }
                //   }
                //   next();
                // });
                // Crawler-friendly static HTML routes for Facebook/Google compliance
                // MUST be registered before any SPA routing or Vite middleware
                app.get("/privacy-policy", function (_req, res) {
                    console.log("🔍 Privacy policy route HIT");
                    res.setHeader("Content-Type", "text/html; charset=utf-8");
                    res.send("\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Privacy Policy - MealScout</title>\n  <meta name=\"description\" content=\"Learn how MealScout collects, uses, and protects your personal information.\">\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }\n    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }\n    h2 { color: #1e40af; margin-top: 30px; }\n    h3 { color: #1e3a8a; }\n    .section { margin: 20px 0; }\n    ul { margin: 10px 0; padding-left: 25px; }\n    .highlight { background: #eff6ff; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; }\n    .contact { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }\n  </style>\n</head>\n<body>\n  <h1>Privacy Policy</h1>\n  <p><strong>Last updated: January 13, 2025</strong></p>\n  <p>How MealScout collects, uses, and protects your personal information.</p>\n\n  <div class=\"section\">\n    <h2>1. Information We Collect</h2>\n    <p>We collect information you provide directly to us, information we obtain automatically when you use our Service, and information from third parties.</p>\n\n    <div class=\"highlight\">\n      <h3>Personal Information:</h3>\n      <ul>\n        <li>Name and email address (from account registration)</li>\n        <li>Profile information from Google/Facebook OAuth</li>\n        <li>Business information (for restaurant owners)</li>\n        <li>Payment information (processed securely via Stripe)</li>\n      </ul>\n    </div>\n\n    <div class=\"highlight\">\n      <h3>Location Data:</h3>\n      <ul>\n        <li>GPS coordinates for deal discovery</li>\n        <li>Real-time location for food truck tracking</li>\n        <li>Address information for business verification</li>\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <h2>2. How We Use Your Information</h2>\n    <ul>\n      <li>Provide, maintain, and improve our Service</li>\n      <li>Provide location-based deal recommendations</li>\n      <li>Process subscription payments and billing</li>\n      <li>Enable real-time food truck tracking</li>\n      <li>Verify business credentials and documents</li>\n      <li>Send important service communications and updates</li>\n      <li>Monitor and analyze trends, usage, and activities</li>\n      <li>Detect, investigate, and prevent fraudulent activities</li>\n      <li>Personalize and improve your experience</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>3. Information Sharing</h2>\n    <p>We may share your information in the following situations:</p>\n    <ul>\n      <li><strong>With Business Partners:</strong> General location data with restaurants</li>\n      <li><strong>With Service Providers:</strong> Third-party payment processing and analytics</li>\n      <li><strong>For Legal Requirements:</strong> When required by law or legal process</li>\n      <li><strong>With Your Consent:</strong> When you explicitly agree</li>\n      <li><strong>Aggregated Data:</strong> De-identified data that cannot be linked to individuals</li>\n    </ul>\n    <p><strong>We do not sell, trade, or rent your personal information to third parties.</strong></p>\n  </div>\n\n  <div class=\"section\">\n    <h2>4. Third-Party Services</h2>\n    <p>Our Service integrates with:</p>\n    <ul>\n      <li><strong>Google OAuth:</strong> For secure authentication</li>\n      <li><strong>Facebook Login:</strong> For social authentication</li>\n      <li><strong>Stripe:</strong> For secure payment processing</li>\n      <li><strong>BigDataCloud:</strong> For location geocoding services</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>5. Data Security</h2>\n    <p>We implement appropriate technical and organizational measures including:</p>\n    <ul>\n      <li>Encryption of data in transit and at rest</li>\n      <li>Regular security assessments and updates</li>\n      <li>Access controls and authentication requirements</li>\n      <li>Secure payment processing through PCI-compliant providers</li>\n      <li>Regular backups and disaster recovery procedures</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>6. Your Rights</h2>\n    <ul>\n      <li>Access and update your personal information</li>\n      <li>Delete your account and associated data</li>\n      <li>Control location services through device settings</li>\n      <li>Unsubscribe from marketing communications</li>\n      <li>Request data portability (GDPR)</li>\n      <li>Opt-out of data sale/sharing (CCPA)</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>7. Data Retention</h2>\n    <ul>\n      <li><strong>Account Information:</strong> Until deletion, plus 30 days</li>\n      <li><strong>Payment Information:</strong> As required by law (typically 7 years)</li>\n      <li><strong>Location Data:</strong> Anonymized after 90 days</li>\n      <li><strong>Analytics Data:</strong> Aggregated data may be retained indefinitely</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>8. Contact Us</h2>\n    <div class=\"contact\">\n      <p><strong>Email:</strong> <a href=\"mailto:info.mealscout@gmail.com\">info.mealscout@gmail.com</a></p>\n      <p><strong>Phone:</strong> <a href=\"tel:+19856626247\">(985) 662-6247</a></p>\n      <p>We will respond to your inquiry within 30 days.</p>\n    </div>\n  </div>\n\n  <p style=\"margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280;\">\n    <small>This Privacy Policy is compliant with GDPR, CCPA/CPRA, and other major privacy regulations.</small>\n  </p>\n\n  <p style=\"text-align: center; margin-top: 30px;\">\n    <a href=\"https://mealscout.us\" style=\"color: #2563eb; text-decoration: none;\">\u2190 Back to MealScout</a>\n  </p>\n</body>\n</html>\n    ");
                });
                // Crawler-friendly SSR route for video transcripts
                // Serves initial HTML with transcript and VideoObject JSON-LD for /video/:id
                app.get("/video/:storyId", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    var escapeHtml, storyId, storyRows, story, restaurantRows, _a, restaurant, title, description, canonical, schema, transcriptHtml, err_1;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 5, , 6]);
                                escapeHtml = function (input) {
                                    return input
                                        .replace(/&/g, "&amp;")
                                        .replace(/</g, "&lt;")
                                        .replace(/>/g, "&gt;")
                                        .replace(/\"/g, "&quot;")
                                        .replace(/'/g, "&#39;");
                                };
                                storyId = req.params.storyId;
                                return [4 /*yield*/, db
                                        .select()
                                        .from(videoStories)
                                        .where(eq(videoStories.id, storyId))
                                        .limit(1)];
                            case 1:
                                storyRows = _b.sent();
                                if (!storyRows.length) {
                                    res.status(404).set("Content-Type", "text/html; charset=utf-8").send("\n          <!DOCTYPE html>\n          <html lang=\"en\">\n            <head>\n              <meta charset=\"UTF-8\">\n              <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n              <title>Video Not Found | MealScout</title>\n              <link rel=\"canonical\" href=\"https://mealscout.us/video/".concat(storyId, "\">\n            </head>\n            <body>\n              <h1>Video Not Found</h1>\n              <p>The requested video could not be found.</p>\n            </body>\n          </html>\n        "));
                                    return [2 /*return*/];
                                }
                                story = storyRows[0];
                                if (!story.restaurantId) return [3 /*break*/, 3];
                                return [4 /*yield*/, db
                                        .select()
                                        .from(restaurants)
                                        .where(eq(restaurants.id, story.restaurantId))
                                        .limit(1)];
                            case 2:
                                _a = _b.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                _a = [];
                                _b.label = 4;
                            case 4:
                                restaurantRows = _a;
                                restaurant = restaurantRows[0];
                                title = story.title || "Food Recommendation";
                                description = story.description ||
                                    "Watch ".concat(title, " - a local food recommendation on MealScout");
                                canonical = "https://mealscout.us/video/".concat(storyId);
                                schema = {
                                    "@context": "https://schema.org",
                                    "@type": "VideoObject",
                                    name: title,
                                    description: description,
                                    contentUrl: story.videoUrl || undefined,
                                    uploadDate: story.createdAt
                                        ? new Date(story.createdAt).toISOString()
                                        : undefined,
                                    transcript: story.transcript || undefined,
                                };
                                transcriptHtml = story.transcript
                                    ? "<details open>\n             <summary>Transcript</summary>\n             <div class=\"transcript\">".concat(escapeHtml(String(story.transcript)), "</div>\n           </details>")
                                    : "";
                                res.setHeader("Content-Type", "text/html; charset=utf-8");
                                res.send("\n        <!DOCTYPE html>\n        <html lang=\"en\">\n          <head>\n            <meta charset=\"UTF-8\">\n            <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n            <title>".concat(escapeHtml(title), " ").concat((restaurant === null || restaurant === void 0 ? void 0 : restaurant.name) ? "at ".concat(escapeHtml(restaurant.name)) : "", " - Video | MealScout</title>\n            <meta name=\"description\" content=\"").concat(escapeHtml(description), "\">\n            <link rel=\"canonical\" href=\"").concat(canonical, "\">\n            <script type=\"application/ld+json\">").concat(JSON.stringify(schema), "</script>\n            <style>\n              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 16px; }\n              .player { background: #000; aspect-ratio: 9/16; width: 100%; }\n              .transcript { white-space: pre-wrap; line-height: 1.6; margin-top: 8px; }\n            </style>\n          </head>\n          <body>\n            <h1>").concat(escapeHtml(title), "</h1>\n            ").concat(description ? "<p>".concat(escapeHtml(description), "</p>") : "", "\n            <div class=\"player\"></div>\n            ").concat(transcriptHtml, "\n          </body>\n        </html>\n      "));
                                return [3 /*break*/, 6];
                            case 5:
                                err_1 = _b.sent();
                                console.error("Error rendering video SSR route:", err_1);
                                res.status(500).set("Content-Type", "text/html; charset=utf-8").send("\n        <!DOCTYPE html>\n        <html lang=\"en\">\n          <head>\n            <meta charset=\"UTF-8\">\n            <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n            <title>Server Error | MealScout</title>\n          </head>\n          <body>\n            <h1>Server Error</h1>\n            <p>Unable to render video page.</p>\n          </body>\n        </html>\n      ");
                                return [3 /*break*/, 6];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); });
                app.get("/data-deletion", function (_req, res) {
                    console.log("🔍 Data deletion route HIT");
                    res.setHeader("Content-Type", "text/html; charset=utf-8");
                    res.send("\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Data Deletion Instructions - MealScout</title>\n  <meta name=\"description\" content=\"Learn how to request deletion of your personal data from MealScout.\">\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }\n    h1 { color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 10px; }\n    h2 { color: #b91c1c; margin-top: 30px; }\n    .section { margin: 20px 0; }\n    ul, ol { margin: 10px 0; padding-left: 25px; }\n    .highlight { background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0; }\n    .contact { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }\n    .warning { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }\n  </style>\n</head>\n<body>\n  <h1>Data Deletion Instructions</h1>\n  <p><strong>Last updated: January 13, 2025</strong></p>\n  <p>How to request deletion of your personal data from MealScout</p>\n\n  <div class=\"section\">\n    <h2>Quick Account Deletion</h2>\n    <p>You can delete your MealScout account directly from your profile settings:</p>\n\n    <div class=\"highlight\">\n      <h3>Self-Service Deletion:</h3>\n      <ol>\n        <li>Log into your MealScout account</li>\n        <li>Navigate to Profile \u2192 Settings</li>\n        <li>Scroll to \"Account Management\"</li>\n        <li>Click \"Delete Account\"</li>\n        <li>Confirm deletion by typing your email address</li>\n      </ol>\n      <p class=\"warning\">\u26A0\uFE0F This action is permanent and cannot be undone.</p>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <h2>Manual Deletion Request</h2>\n    <p>If you're unable to access your account, contact us directly:</p>\n\n    <div class=\"contact\">\n      <h3>Contact Information:</h3>\n      <p><strong>Email:</strong> <a href=\"mailto:privacy@mealscout.com\">privacy@mealscout.com</a></p>\n      <p><strong>General Support:</strong> <a href=\"mailto:info.mealscout@gmail.com\">info.mealscout@gmail.com</a></p>\n      <p><strong>Subject Line:</strong> \"Data Deletion Request\"</p>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <h2>Required Information</h2>\n    <p>To process your deletion request, please provide:</p>\n    <ul>\n      <li>Full name associated with your account</li>\n      <li>Email address used for registration</li>\n      <li>Phone number (if provided)</li>\n      <li>Reason for deletion (optional but helpful)</li>\n      <li>Any additional account identifiers</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>What Gets Deleted</h2>\n    <div class=\"highlight\">\n      <h3>Personal Data Removed:</h3>\n      <ul>\n        <li>Profile information and photos</li>\n        <li>Email address and contact details</li>\n        <li>Location data and preferences</li>\n        <li>Order history and favorites</li>\n        <li>Reviews and ratings</li>\n        <li>Payment information</li>\n        <li>Communication records</li>\n      </ul>\n    </div>\n\n    <div style=\"background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;\">\n      <h3>Data We May Retain:</h3>\n      <ul>\n        <li>Anonymous usage analytics</li>\n        <li>Financial records (tax requirements)</li>\n        <li>Legal compliance data</li>\n        <li>Fraud prevention records</li>\n      </ul>\n      <p><small>*Retained data is anonymized and cannot be linked back to you</small></p>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <h2>Deletion Timeline</h2>\n    <div class=\"highlight\">\n      <ol>\n        <li><strong>Immediate:</strong> Account access disabled</li>\n        <li><strong>Within 7 days:</strong> Personal data removed from active systems</li>\n        <li><strong>Within 30 days:</strong> Data purged from backups</li>\n        <li><strong>Confirmation:</strong> Email notification when deletion is complete</li>\n      </ol>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <h2>Facebook Login Data</h2>\n    <p>If you signed up using Facebook Login, deleting your MealScout account will:</p>\n    <ul>\n      <li>Remove all data MealScout obtained from Facebook</li>\n      <li>Revoke MealScout's access to your Facebook account</li>\n      <li>Delete any Facebook-sourced profile information</li>\n      <li>Remove integration with Facebook's sharing features</li>\n    </ul>\n    <p><small>Note: This does not affect your Facebook account itself. To fully disconnect, also revoke MealScout's permissions in your Facebook app settings.</small></p>\n  </div>\n\n  <div class=\"section\">\n    <h2>Need Help?</h2>\n    <div class=\"contact\">\n      <p><strong>Privacy Team:</strong> privacy@mealscout.com</p>\n      <p><strong>Support Team:</strong> info.mealscout@gmail.com</p>\n      <p>We typically respond to deletion requests within 1-2 business days.</p>\n    </div>\n  </div>\n\n  <p style=\"margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280;\">\n    <small>This page complies with GDPR, CCPA, and other privacy regulations. You have the right to request deletion of your personal data at any time.</small>\n  </p>\n\n  <p style=\"text-align: center; margin-top: 30px;\">\n    <a href=\"https://mealscout.us\" style=\"color: #dc2626; text-decoration: none;\">\u2190 Back to MealScout</a>\n  </p>\n</body>\n</html>\n    ");
                });
                // ==================== ACTION API FOR TRADESCOUT LLM ====================
                // Unified endpoint that TradeScout LLM calls to perform actions
                // Requires authentication via TRADESCOUT_API_TOKEN
                app.use("/api/actions", rateLimitActions, verifyTradeScoutToken, actionRoutes);
                return [4 /*yield*/, registerRoutes(app)];
            case 4:
                server = _a.sent();
                // Setup WebSocket server for food truck GPS tracking
                setupWebSocketServer(server);
                console.log("[express] WebSocket server initialized for food truck tracking");
                app.use(function (err, _req, res, next) {
                    var status = err.status || err.statusCode || 500;
                    var message = err.message || "Internal Server Error";
                    // Log error for debugging
                    console.error("❌ Express error middleware:", err);
                    // Send response if not already sent
                    if (!res.headersSent) {
                        res.status(status).json({ message: message });
                    }
                    // Don't throw after responding to avoid triggering uncaughtException
                    // In production, log and continue; in development, we can be more strict
                    if (process.env.NODE_ENV !== "production") {
                        console.error("💥 Development error - check logs above");
                    }
                });
                // Root endpoint health guard - handles health checks while preserving SPA functionality
                app.use("/", function (req, res, next) {
                    // Only handle root path, let other paths go through
                    if (req.path !== "/") {
                        return next();
                    }
                    // Handle HEAD requests (common for health checks) - always return 200
                    if (req.method === "HEAD") {
                        return res.status(200).end();
                    }
                    // Handle GET requests based on Accept header
                    if (req.method === "GET") {
                        var acceptHeader = req.get("Accept") || "";
                        // If not requesting HTML, return JSON status (for API health checks)
                        if (!acceptHeader.includes("text/html")) {
                            return res.status(200).json({
                                status: "ok",
                                service: "MealScout API",
                                timestamp: new Date().toISOString(),
                            });
                        }
                        // For HTML requests in development, always let Vite handle it
                        if (app.get("env") === "development") {
                            return next();
                        }
                        // For HTML requests in production, check if built frontend exists
                        // Use the same path logic as serveStatic function in vite.ts
                        var indexPath = path.resolve(process.cwd(), "dist", "public", "index.html");
                        if (fs.existsSync(indexPath)) {
                            // SPA build exists, let serveStatic handle it
                            return next();
                        }
                        else {
                            // No build available, return minimal HTML fallback with 200 status
                            res.status(200).set({
                                "Content-Type": "text/html; charset=utf-8",
                                "Cache-Control": "no-store, no-cache, must-revalidate",
                            }).send("\n          <!DOCTYPE html>\n          <html lang=\"en\">\n            <head>\n              <meta charset=\"UTF-8\">\n              <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n              <title>MealScout</title>\n            </head>\n            <body>\n              <h1>MealScout</h1>\n              <p>Service is running successfully.</p>\n              <p>Status: OK</p>\n              <p><a href=\"/health\">Health Check</a></p>\n            </body>\n          </html>\n        ");
                            return;
                        }
                    }
                    // For other methods, continue to next middleware
                    next();
                });
                if (!(app.get("env") === "development")) return [3 /*break*/, 7];
                return [4 /*yield*/, import("./vite.js")];
            case 5:
                setupVite = (_a.sent()).setupVite;
                return [4 /*yield*/, setupVite(app, server)];
            case 6:
                _a.sent();
                return [3 /*break*/, 10];
            case 7:
                distPath = path.resolve(process.cwd(), "dist", "public");
                if (!fs.existsSync(distPath)) return [3 /*break*/, 9];
                return [4 /*yield*/, import("./vite.js")];
            case 8:
                serveStatic = (_a.sent()).serveStatic;
                serveStatic(app);
                return [3 /*break*/, 10];
            case 9:
                console.warn("No frontend build detected at dist/public; serving API-only.");
                _a.label = 10;
            case 10:
                port = parseInt(process.env.PORT || "5200", 10);
                server.listen({
                    port: port,
                    host: "0.0.0.0",
                }, function () {
                    console.log("[express] serving on port ".concat(port));
                    // Initialize database data after server startup - truly non-blocking
                    setImmediate(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var error_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, storage.ensureAdminExists()];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, storage.seedDevelopmentData()];
                                case 2:
                                    _a.sent();
                                    console.log("✅ Database initialization completed successfully");
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_2 = _a.sent();
                                    console.warn("⚠️  Warning: Could not initialize storage after startup:", error_2 instanceof Error ? error_2.message : String(error_2));
                                    console.warn("⚠️  Some features may not work properly until database is initialized");
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Perform database validation after server startup - non-blocking
                    setTimeout(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var schemaCheck, error_3;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, db.execute(sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n          SELECT column_name, data_type\n          FROM information_schema.columns\n          WHERE table_name = 'users' AND column_name = 'phone'\n        "], ["\n          SELECT column_name, data_type\n          FROM information_schema.columns\n          WHERE table_name = 'users' AND column_name = 'phone'\n        "]))))];
                                case 1:
                                    schemaCheck = _b.sent();
                                    if (schemaCheck.rows.length === 0) {
                                        console.error("❌ CRITICAL: phone column missing from users table!");
                                        console.error("Database URL:", ((_a = process.env.DATABASE_URL) === null || _a === void 0 ? void 0 : _a.split("@")[0]) + "@...");
                                        // Don't exit process in production - log error and continue
                                        if (process.env.NODE_ENV === "production") {
                                            console.warn("⚠️  Server will continue running despite database schema issues");
                                        }
                                    }
                                    else {
                                        console.log("✅ Schema validation: phone column exists");
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_3 = _b.sent();
                                    console.error("❌ Schema validation failed:", error_3 instanceof Error ? error_3.message : String(error_3));
                                    console.warn("⚠️  Server will continue running despite database validation failure");
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }, 1000); // Delay 1 second to allow server to fully start
                });
                return [2 /*return*/];
        }
    });
}); })();
var templateObject_1, templateObject_2;

