var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
import { createServer } from "http";
import cron from "node-cron";
import { DigestService } from "./digestService.js";
import { notifyUnbookedEvents } from "./eventNotificationCron.js";
import Stripe from "stripe";
import { storage } from "./storage.js";
import { getHostByUserId, getEventAndHostForUser, getInterestEventAndHostForUser, hostOwnsEvent, } from "./services/hostOwnership.js";
import { computeAcceptedCount, shouldBlockAcceptance, buildCapacityFullError, computeFillRate, } from "./services/interestDecision.js";
import { registerHostRoutes } from "./routes/hostRoutes.js";
import { registerOpenCallSeriesRoutes } from "./routes/openCallSeriesRoutes.js";
import { registerEventRoutes } from "./routes/eventRoutes.js";
import { registerEventCoordinatorRoutes } from "./routes/eventCoordinatorRoutes.js";
import { registerAdminManagementRoutes } from "./routes/adminManagementRoutes.js";
import { registerGeoAdRoutes } from "./routes/geoAdRoutes.js";
import { registerBookingRoutes } from "./routes/bookingRoutes.js";
import { registerStaffRoutes } from "./staffRoutes.js";
import { setupUnifiedAuth, isAuthenticated, isRestaurantOwner, isAdmin, verifyResourceOwnership, } from "./unifiedAuth.js";
import { emailService } from "./emailService.js";
import { insertRestaurantSchema, insertDealSchema, insertReviewSchema, insertVerificationRequestSchema, insertDealViewSchema, insertFoodTruckLocationSchema, updateRestaurantMobileSettingsSchema, insertRestaurantFavoriteSchema, insertRestaurantFollowSchema, insertRestaurantUserRecommendationSchema, insertUserAddressSchema, insertPasswordResetTokenSchema, updateRestaurantLocationSchema, updateRestaurantOperatingHoursSchema, insertDealFeedbackSchema, insertLocationRequestSchema, insertTruckInterestSchema, deals, hosts, imageUploads, passwordResetTokens, users, restaurants, truckImportListings, truckClaimRequests, awardHistory, } from "@shared/schema";
import { z } from "zod";
import { validateDocuments, checkRateLimit } from "./documentValidation.js";
import { randomBytes, createHash } from "crypto";
import { sanitizeUser } from "./utils/sanitize.js";
import { ensureAffiliateTag } from "./affiliateTagService.js";
import { isPasswordStrong, PASSWORD_REQUIREMENTS, } from "./utils/passwordPolicy.js";
import { upload, uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured, } from "./imageUpload.js";
import { calculateUserInfluenceScore, checkGoldenForkEligibility, awardGoldenFork, calculateRestaurantRankingScore, awardGoldenPlatesForArea, getAreaLeaderboard, getUserRecommendationCount, } from "./awardCalculations.js";
import { sendDealClaimedNotification, sendTruckInterestNotification, } from "./emailNotifications.js";
// SECURITY AUDIT STATUS
// ✅ All critical endpoints require authentication
// ✅ Rate limiting applied to sensitive endpoints (login, password reset, bug reports)
// ✅ Password reset tokens stored in database (persistent across restarts)
// ✅ Database-backed rate limiting prevents brute force attacks
// ✅ Drizzle ORM prevents SQL injection
// ⚠️  Recommendation: Add admin role checks for critical operations
// ⚠️  Recommendation: Add API key authentication for service-to-service communication
// Environment validation - ensures critical configuration is present at startup
function validateRequiredEnv() {
    var required = ["DATABASE_URL", "SESSION_SECRET"];
    var missing = required.filter(function (env) { return !process.env[env]; });
    if (missing.length > 0) {
        var errorMsg = "\u274C FATAL: Missing required environment variables: ".concat(missing.join(", "));
        console.error(errorMsg);
        if (process.env.NODE_ENV === "production") {
            throw new Error(errorMsg);
        }
    }
    // Validate ALLOWED_ORIGINS format if set
    if (process.env.ALLOWED_ORIGINS) {
        var origins = process.env.ALLOWED_ORIGINS.split(",").map(function (o) { return o.trim(); });
        if (origins.length === 0) {
            console.warn("⚠️  ALLOWED_ORIGINS is empty, using default: http://localhost:5000");
        }
        else {
            console.log("✅ ALLOWED_ORIGINS configured:", origins.join(", "));
        }
    }
    else {
        console.warn("⚠️  ALLOWED_ORIGINS not set, defaulting to: http://localhost:5000");
    }
}
// Validate environment at module load time
validateRequiredEnv();
import bcrypt from "bcryptjs";
import { logAudit } from "./auditLogger.js";
import { createIncident, ANOMALY_RULES, } from "./incidentManager.js";
import { vacEvaluateRestaurantSignup } from "./vacLite.js";
import { broadcastLocationUpdate, broadcastStatusUpdate } from "./websocket.js";
import { reverseGeocode } from "./utils/geocoding.js";
import { db } from "./db.js";
import { and, inArray, eq, sql, gte, desc, like, asc, isNotNull } from "drizzle-orm";
import { registerStoryCronJobs } from "./storiesCronJobs.js";
// Optional Stripe integration
var stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
// Pricing helpers: Stripe Price IDs
var PROMO_DEADLINE = new Date("2026-03-01T00:00:00Z");
function isTrialActive(user) {
    if (!(user === null || user === void 0 ? void 0 : user.trialEndsAt))
        return false;
    return user.trialEndsAt.getTime() > Date.now();
}
function ensureTrialForUser(user) {
    return __awaiter(this, void 0, void 0, function () {
        var eligibleTrialUserTypes, restaurantsForUser, hasBusiness, startedAt, endsAt, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isTrialActive(user) || user.trialUsed || user.stripeSubscriptionId) {
                        return [2 /*return*/, user];
                    }
                    eligibleTrialUserTypes = new Set(["restaurant_owner", "food_truck"]);
                    if (!eligibleTrialUserTypes.has(user.userType)) {
                        return [2 /*return*/, user];
                    }
                    return [4 /*yield*/, storage.getRestaurantsByOwner(user.id)];
                case 1:
                    restaurantsForUser = _a.sent();
                    hasBusiness = user.userType === "food_truck" ||
                        restaurantsForUser.some(function (restaurant) {
                            return restaurant.businessType === "restaurant" ||
                                restaurant.businessType === "bar" ||
                                restaurant.isFoodTruck;
                        });
                    if (!hasBusiness) {
                        return [2 /*return*/, user];
                    }
                    startedAt = new Date();
                    endsAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, storage.updateUser(user.id, {
                            trialStartedAt: startedAt,
                            trialEndsAt: endsAt,
                            trialUsed: true,
                            subscriptionBillingInterval: "trial",
                        })];
                case 2:
                    updated = _a.sent();
                    return [2 /*return*/, updated || user];
            }
        });
    });
}
function getLockedPriceForUser(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var price25, locked, priceId, label;
        return __generator(this, function (_a) {
            price25 = process.env.PRICE_MONTHLY_25;
            if (!price25) {
                throw new Error("Stripe Price IDs not configured (PRICE_MONTHLY_25)");
            }
            locked = true;
            priceId = price25;
            label = "$25 (was $50)";
            return [2 /*return*/, { locked: locked, priceId: priceId, label: label }];
        });
    });
}
// Password reset rate limiting - database-backed for persistence across server restarts
function checkPasswordResetRateLimit(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var fifteenMinutes, maxAttempts, cutoffTime, user, recentAttempts, oldestAttempt, nextAllowedTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fifteenMinutes = 15 * 60 * 1000;
                    maxAttempts = 3;
                    cutoffTime = new Date(Date.now() - fifteenMinutes);
                    // Clean up expired tokens
                    return [4 /*yield*/, storage.deleteExpiredResetTokens()];
                case 1:
                    // Clean up expired tokens
                    _a.sent();
                    return [4 /*yield*/, storage.getUser(userId)];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, { allowed: false, nextAllowedTime: undefined, remainingAttempts: 0 }];
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(passwordResetTokens)
                            .where(and(eq(passwordResetTokens.userId, userId), gte(passwordResetTokens.createdAt, cutoffTime)))];
                case 3:
                    recentAttempts = _a.sent();
                    if (!(recentAttempts.length >= maxAttempts)) return [3 /*break*/, 5];
                    oldestAttempt = recentAttempts[0].createdAt;
                    nextAllowedTime = new Date(oldestAttempt.getTime() + fifteenMinutes);
                    // Trigger anomaly detection incident
                    return [4 /*yield*/, createIncident({
                            ruleId: ANOMALY_RULES.PASSWORD_RESET_ABUSE.id,
                            severity: ANOMALY_RULES.PASSWORD_RESET_ABUSE.severity,
                            userId: userId,
                            metadata: { attempts: recentAttempts.length, cutoffTime: cutoffTime },
                        })];
                case 4:
                    // Trigger anomaly detection incident
                    _a.sent();
                    return [2 /*return*/, {
                            allowed: false,
                            nextAllowedTime: nextAllowedTime,
                            remainingAttempts: 0,
                        }];
                case 5: return [2 /*return*/, {
                        allowed: true,
                        remainingAttempts: maxAttempts - recentAttempts.length,
                    }];
            }
        });
    });
}
// Environment validation for production - BLOCKING to prevent startup with missing config
function validateEnvironment() {
    var required = ["DATABASE_URL", "SESSION_SECRET"];
    var missing = required.filter(function (env) { return !process.env[env]; });
    if (missing.length > 0) {
        var errorMsg = "\u274C FATAL: Missing required environment variables: ".concat(missing.join(", "));
        console.error(errorMsg);
        if (process.env.NODE_ENV === "production") {
            console.error("🛑 Production mode: Cannot start without required configuration");
            process.exit(1);
        }
        else {
            console.warn("⚠️  Development mode: Server starting with incomplete configuration. This may cause runtime errors.");
        }
        return false;
    }
    console.log("✅ All required environment variables present");
    return true;
}
function ensureAffiliateTagsForExistingUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var rows, _i, rows_1, row, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, db
                            .select({ id: users.id, userType: users.userType })
                            .from(users)
                            .where(sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " is null"], ["", " is null"])), users.affiliateTag))];
                case 1:
                    rows = _a.sent();
                    _i = 0, rows_1 = rows;
                    _a.label = 2;
                case 2:
                    if (!(_i < rows_1.length)) return [3 /*break*/, 5];
                    row = rows_1[_i];
                    if (row.userType === "admin" || row.userType === "super_admin") {
                        return [3 /*break*/, 4];
                    }
                    return [4 /*yield*/, ensureAffiliateTag(row.id)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error("[affiliate] Failed to backfill affiliate tags:", error_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Subscription validation function for analytics access
function validateAnalyticsAccess(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var user, hydratedUser, subscription, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, storage.getUser(userId)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, { hasAccess: false, error: "User not found" }];
                    }
                    return [4 /*yield*/, ensureTrialForUser(user)];
                case 2:
                    hydratedUser = _a.sent();
                    if (isTrialActive(hydratedUser)) {
                        return [2 /*return*/, { hasAccess: true, subscriptionTier: "trial" }];
                    }
                    // Check if user has active subscription
                    if (!stripe || !hydratedUser.stripeSubscriptionId) {
                        return [2 /*return*/, {
                                hasAccess: false,
                                error: "Premium subscription required to access analytics. Please upgrade your plan.",
                                subscriptionTier: "free",
                            }];
                    }
                    return [4 /*yield*/, stripe.subscriptions.retrieve(hydratedUser.stripeSubscriptionId)];
                case 3:
                    subscription = _a.sent();
                    if (!subscription || subscription.status !== "active") {
                        return [2 /*return*/, {
                                hasAccess: false,
                                error: "Your subscription is not active. Please check your payment method and try again.",
                                subscriptionTier: "inactive",
                            }];
                    }
                    // Return subscription tier (monthly only)
                    return [2 /*return*/, {
                            hasAccess: true,
                            subscriptionTier: "monthly",
                        }];
                case 4:
                    error_2 = _a.sent();
                    console.error("Analytics access validation error:", error_2);
                    return [2 /*return*/, {
                            hasAccess: false,
                            error: "Unable to verify subscription status. Please try again.",
                            subscriptionTier: "error",
                        }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Subscription validation function - Now allows unlimited deals for all paid subscriptions
function validateSubscriptionLimits(userId, excludeDealId) {
    return __awaiter(this, void 0, void 0, function () {
        var user, hydratedUser, subscriptionId, validIntervals, intervalCount, subscription, restaurants_2, activeDealsCount, _i, restaurants_1, restaurant, deals_1, activeDeals, maxDeals, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    return [4 /*yield*/, storage.getUser(userId)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, { isValid: false, error: "User not found" }];
                    }
                    return [4 /*yield*/, ensureTrialForUser(user)];
                case 2:
                    hydratedUser = _a.sent();
                    console.log("🔍 validateSubscriptionLimits - User ID:", userId);
                    if (isTrialActive(hydratedUser)) {
                        return [2 /*return*/, { isValid: true, currentCount: 0, maxDeals: 999 }];
                    }
                    // Check if user has active subscription
                    if (!stripe) {
                        return [2 /*return*/, {
                                isValid: false,
                                error: "Active subscription required to create deals. Please upgrade your plan.",
                                currentCount: 0,
                                maxDeals: 0,
                            }];
                    }
                    subscriptionId = hydratedUser.stripeSubscriptionId || hydratedUser.stripeCustomerId;
                    validIntervals = ["month"];
                    intervalCount = 1;
                    if (!subscriptionId) {
                        return [2 /*return*/, {
                                isValid: false,
                                error: "Active subscription required to create deals. Please upgrade your plan.",
                                currentCount: 0,
                                maxDeals: 0,
                            }];
                    }
                    return [4 /*yield*/, stripe.subscriptions.retrieve(subscriptionId)];
                case 3:
                    subscription = _a.sent();
                    if (!subscription || subscription.status !== "active") {
                        return [2 /*return*/, {
                                isValid: false,
                                error: "Your subscription is not active. Please check your payment method and try again.",
                                currentCount: 0,
                                maxDeals: 0,
                            }];
                    }
                    return [4 /*yield*/, storage.getRestaurantsByOwner(userId)];
                case 4:
                    restaurants_2 = _a.sent();
                    activeDealsCount = 0;
                    _i = 0, restaurants_1 = restaurants_2;
                    _a.label = 5;
                case 5:
                    if (!(_i < restaurants_1.length)) return [3 /*break*/, 8];
                    restaurant = restaurants_1[_i];
                    return [4 /*yield*/, storage.getDealsByRestaurant(restaurant.id)];
                case 6:
                    deals_1 = _a.sent();
                    activeDeals = deals_1.filter(function (d) { return d.isActive && (!excludeDealId || d.id !== excludeDealId); });
                    activeDealsCount += activeDeals.length;
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8:
                    maxDeals = 999;
                    return [2 /*return*/, {
                            isValid: true,
                            currentCount: activeDealsCount,
                            maxDeals: maxDeals,
                        }];
                case 9:
                    error_3 = _a.sent();
                    console.error("Subscription validation error:", error_3);
                    return [2 /*return*/, {
                            isValid: false,
                            error: "Unable to verify subscription status. Please try again.",
                            currentCount: 0,
                            maxDeals: 0,
                        }];
                case 10: return [2 /*return*/];
            }
        });
    });
}
export function registerRoutes(app) {
    return __awaiter(this, void 0, void 0, function () {
        var envValid, setupStoriesRoutes, incidentRoutes, adminRoutes, telemetryRoutes, evidenceExportRoutes, affiliateRoutes, setupPayoutRoutes, setupEmptyCountyRoutes, setupShareRoutes, userRoutes, redemptionRoutes, shareUrlMiddleware, httpServer;
        var _this = this;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // Health check endpoint - responds immediately with 200 for deployment health checks
                    app.get("/health", function (_req, res) {
                        res.status(200).json({
                            status: "ok",
                            timestamp: new Date().toISOString(),
                            uptime: process.uptime(),
                            service: "MealScout API",
                        });
                    });
                    // Static HTML routes for crawlers (Facebook, Google) - must come before SPA routes
                    // These serve crawler-friendly HTML with content embedded directly in the page
                    app.get("/privacy-policy", function (_req, res) {
                        console.log("🔍 Privacy policy route HIT");
                        res.setHeader("Content-Type", "text/html; charset=utf-8");
                        res.send("\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Privacy Policy - MealScout</title>\n  <meta name=\"description\" content=\"Learn how MealScout collects, uses, and protects your personal information.\">\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }\n    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }\n    h2 { color: #1e40af; margin-top: 30px; }\n    h3 { color: #1e3a8a; }\n    .section { margin: 20px 0; }\n    ul { margin: 10px 0; padding-left: 25px; }\n    .highlight { background: #eff6ff; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; }\n    .contact { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }\n  </style>\n</head>\n<body>\n  <h1>Privacy Policy</h1>\n  <p><strong>Last updated: January 13, 2025</strong></p>\n  <p>How MealScout collects, uses, and protects your personal information.</p>\n\n  <div class=\"section\">\n    <h2>1. Information We Collect</h2>\n    <p>We collect information you provide directly to us, information we obtain automatically when you use our Service, and information from third parties.</p>\n\n    <div class=\"highlight\">\n      <h3>Personal Information:</h3>\n      <ul>\n        <li>Name and email address (from account registration)</li>\n        <li>Profile information from Google/Facebook OAuth</li>\n        <li>Business information (for restaurant owners)</li>\n        <li>Payment information (processed securely via Stripe)</li>\n      </ul>\n    </div>\n\n    <div class=\"highlight\">\n      <h3>Location Data:</h3>\n      <ul>\n        <li>GPS coordinates for deal discovery</li>\n        <li>Real-time location for food truck tracking</li>\n        <li>Address information for business verification</li>\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <h2>2. How We Use Your Information</h2>\n    <ul>\n      <li>Provide, maintain, and improve our Service</li>\n      <li>Provide location-based deal recommendations</li>\n      <li>Process subscription payments and billing</li>\n      <li>Enable real-time food truck tracking</li>\n      <li>Verify business credentials and documents</li>\n      <li>Send important service communications and updates</li>\n      <li>Monitor and analyze trends, usage, and activities</li>\n      <li>Detect, investigate, and prevent fraudulent activities</li>\n      <li>Personalize and improve your experience</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>3. Information Sharing</h2>\n    <p>We may share your information in the following situations:</p>\n    <ul>\n      <li><strong>With Business Partners:</strong> General location data with restaurants</li>\n      <li><strong>With Service Providers:</strong> Third-party payment processing and analytics</li>\n      <li><strong>For Legal Requirements:</strong> When required by law or legal process</li>\n      <li><strong>With Your Consent:</strong> When you explicitly agree</li>\n      <li><strong>Aggregated Data:</strong> De-identified data that cannot be linked to individuals</li>\n    </ul>\n    <p><strong>We do not sell, trade, or rent your personal information to third parties.</strong></p>\n  </div>\n\n  <div class=\"section\">\n    <h2>4. Third-Party Services</h2>\n    <p>Our Service integrates with:</p>\n    <ul>\n      <li><strong>Google OAuth:</strong> For secure authentication</li>\n      <li><strong>Facebook Login:</strong> For social authentication</li>\n      <li><strong>Stripe:</strong> For secure payment processing</li>\n      <li><strong>BigDataCloud:</strong> For location geocoding services</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>5. Data Security</h2>\n    <p>We implement appropriate technical and organizational measures including:</p>\n    <ul>\n      <li>Encryption of data in transit and at rest</li>\n      <li>Regular security assessments and updates</li>\n      <li>Access controls and authentication requirements</li>\n      <li>Secure payment processing through PCI-compliant providers</li>\n      <li>Regular backups and disaster recovery procedures</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>6. Your Rights</h2>\n    <ul>\n      <li>Access and update your personal information</li>\n      <li>Delete your account and associated data</li>\n      <li>Control location services through device settings</li>\n      <li>Unsubscribe from marketing communications</li>\n      <li>Request data portability (GDPR)</li>\n      <li>Opt-out of data sale/sharing (CCPA)</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>7. Data Retention</h2>\n    <ul>\n      <li><strong>Account Information:</strong> Until deletion, plus 30 days</li>\n      <li><strong>Payment Information:</strong> As required by law (typically 7 years)</li>\n      <li><strong>Location Data:</strong> Anonymized after 90 days</li>\n      <li><strong>Analytics Data:</strong> Aggregated data may be retained indefinitely</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>8. Contact Us</h2>\n    <div class=\"contact\">\n      <p><strong>Email:</strong> <a href=\"mailto:info.mealscout@gmail.com\">info.mealscout@gmail.com</a></p>\n      <p><strong>Phone:</strong> <a href=\"tel:+19856626247\">(985) 662-6247</a></p>\n      <p>We will respond to your inquiry within 30 days.</p>\n    </div>\n  </div>\n\n  <p style=\"margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280;\">\n    <small>This Privacy Policy is compliant with GDPR, CCPA/CPRA, and other major privacy regulations.</small>\n  </p>\n\n  <p style=\"text-align: center; margin-top: 30px;\">\n    <a href=\"https://mealscout.us\" style=\"color: #2563eb; text-decoration: none;\">\u2190 Back to MealScout</a>\n  </p>\n</body>\n</html>\n    ");
                    });
                    app.get("/data-deletion", function (_req, res) {
                        console.log("🔍 Data deletion route HIT");
                        res.setHeader("Content-Type", "text/html; charset=utf-8");
                        res.send("\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Data Deletion Instructions - MealScout</title>\n  <meta name=\"description\" content=\"Learn how to request deletion of your personal data from MealScout.\">\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }\n    h1 { color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 10px; }\n    h2 { color: #b91c1c; margin-top: 30px; }\n    .section { margin: 20px 0; }\n    ul, ol { margin: 10px 0; padding-left: 25px; }\n    .highlight { background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0; }\n    .contact { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }\n    .warning { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }\n  </style>\n</head>\n<body>\n  <h1>Data Deletion Instructions</h1>\n  <p><strong>Last updated: January 13, 2025</strong></p>\n  <p>How to request deletion of your personal data from MealScout</p>\n\n  <div class=\"section\">\n    <h2>Quick Account Deletion</h2>\n    <p>You can delete your MealScout account directly from your profile settings:</p>\n\n    <div class=\"highlight\">\n      <h3>Self-Service Deletion:</h3>\n      <ol>\n        <li>Log into your MealScout account</li>\n        <li>Navigate to Profile \u2192 Settings</li>\n        <li>Scroll to \"Account Management\"</li>\n        <li>Click \"Delete Account\"</li>\n        <li>Confirm deletion by typing your email address</li>\n      </ol>\n      <p class=\"warning\">\u26A0\uFE0F This action is permanent and cannot be undone.</p>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <h2>Manual Deletion Request</h2>\n    <p>If you're unable to access your account, contact us directly:</p>\n\n    <div class=\"contact\">\n      <h3>Contact Information:</h3>\n      <p><strong>Email:</strong> <a href=\"mailto:privacy@mealscout.com\">privacy@mealscout.com</a></p>\n      <p><strong>General Support:</strong> <a href=\"mailto:info.mealscout@gmail.com\">info.mealscout@gmail.com</a></p>\n      <p><strong>Subject Line:</strong> \"Data Deletion Request\"</p>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <h2>Required Information</h2>\n    <p>To process your deletion request, please provide:</p>\n    <ul>\n      <li>Full name associated with your account</li>\n      <li>Email address used for registration</li>\n      <li>Phone number (if provided)</li>\n      <li>Reason for deletion (optional but helpful)</li>\n      <li>Any additional account identifiers</li>\n    </ul>\n  </div>\n\n  <div class=\"section\">\n    <h2>What Gets Deleted</h2>\n    <div class=\"highlight\">\n      <h3>Personal Data Removed:</h3>\n      <ul>\n        <li>Profile information and photos</li>\n        <li>Email address and contact details</li>\n        <li>Location data and preferences</li>\n        <li>Order history and favorites</li>\n        <li>Reviews and ratings</li>\n        <li>Payment information</li>\n        <li>Communication records</li>\n      </ul>\n    </div>\n\n    <div style=\"background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;\">\n      <h3>Data We May Retain:</h3>\n      <ul>\n        <li>Anonymous usage analytics</li>\n        <li>Financial records (tax requirements)</li>\n        <li>Legal compliance data</li>\n        <li>Fraud prevention records</li>\n      </ul>\n      <p><small>*Retained data is anonymized and cannot be linked back to you</small></p>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <h2>Deletion Timeline</h2>\n    <div class=\"highlight\">\n      <ol>\n        <li><strong>Immediate:</strong> Account access disabled</li>\n        <li><strong>Within 7 days:</strong> Personal data removed from active systems</li>\n        <li><strong>Within 30 days:</strong> Data purged from backups</li>\n        <li><strong>Confirmation:</strong> Email notification when deletion is complete</li>\n      </ol>\n    </div>\n  </div>\n\n  <div class=\"section\">\n    <h2>Facebook Login Data</h2>\n    <p>If you signed up using Facebook Login, deleting your MealScout account will:</p>\n    <ul>\n      <li>Remove all data MealScout obtained from Facebook</li>\n      <li>Revoke MealScout's access to your Facebook account</li>\n      <li>Delete any Facebook-sourced profile information</li>\n      <li>Remove integration with Facebook's sharing features</li>\n    </ul>\n    <p><small>Note: This does not affect your Facebook account itself. To fully disconnect, also revoke MealScout's permissions in your Facebook app settings.</small></p>\n  </div>\n\n  <div class=\"section\">\n    <h2>Need Help?</h2>\n    <div class=\"contact\">\n      <p><strong>Privacy Team:</strong> privacy@mealscout.com</p>\n      <p><strong>Support Team:</strong> info.mealscout@gmail.com</p>\n      <p>We typically respond to deletion requests within 1-2 business days.</p>\n    </div>\n  </div>\n\n  <p style=\"margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280;\">\n    <small>This page complies with GDPR, CCPA, and other privacy regulations. You have the right to request deletion of your personal data at any time.</small>\n  </p>\n\n  <p style=\"text-align: center; margin-top: 30px;\">\n    <a href=\"https://mealscout.us\" style=\"color: #dc2626; text-decoration: none;\">\u2190 Back to MealScout</a>\n  </p>\n</body>\n</html>\n    ");
                    });
                    // Validate environment in production - log issues but don't block startup
                    if (process.env.NODE_ENV === "production") {
                        envValid = validateEnvironment();
                        if (!envValid) {
                            console.log("🚀 Server starting despite environment validation issues to allow health checks");
                        }
                    }
                    // Auth middleware
                    return [4 /*yield*/, setupUnifiedAuth(app)];
                case 1:
                    // Auth middleware
                    _c.sent();
                    return [4 /*yield*/, ensureAffiliateTagsForExistingUsers()];
                case 2:
                    _c.sent();
                    // Auth routes
                    app.get("/api/auth/user", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, safeUser;
                        return __generator(this, function (_a) {
                            try {
                                console.log("📋 /api/auth/user called, isAuthenticated:", req.isAuthenticated());
                                console.log("📋 Session ID:", req.sessionID);
                                console.log("📋 Session data:", req.session);
                                if (!req.isAuthenticated()) {
                                    console.log("❌ User not authenticated");
                                    return [2 /*return*/, res.status(401).json({ error: "Not authenticated" })];
                                }
                                user = req.user;
                                console.log("✅ Returning user:", user.id, user.email, user.userType);
                                safeUser = sanitizeUser(user);
                                if (user.mustResetPassword) {
                                    return [2 /*return*/, res.json(__assign(__assign({}, safeUser), { requiresPasswordReset: true }))];
                                }
                                res.json(safeUser);
                            }
                            catch (error) {
                                console.error("❌ Error fetching user:", error);
                                res.status(500).json({ message: "Failed to fetch user" });
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    // Password reset endpoints
                    app.post("/api/auth/forgot-password", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var schema, email, user, rateLimit, resetTimeMinutes, tokenId, verifier, fullToken, tokenHash, expiresAt, clientIp, userAgent, tokenData, resetUrl, emailSent, error_4, error_5;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 11, , 12]);
                                    return [4 /*yield*/, logAudit(undefined, "password_reset_request", "user", req.body.email, req.ip, req.headers["user-agent"], { email: req.body.email })];
                                case 1:
                                    _a.sent();
                                    schema = z.object({
                                        email: z.string().email("Valid email is required").toLowerCase(),
                                    });
                                    email = schema.parse(req.body).email;
                                    return [4 /*yield*/, storage.getUserByEmail(email)];
                                case 2:
                                    user = _a.sent();
                                    if (!user) return [3 /*break*/, 4];
                                    return [4 /*yield*/, checkPasswordResetRateLimit(user.id)];
                                case 3:
                                    rateLimit = _a.sent();
                                    if (!rateLimit.allowed) {
                                        resetTimeMinutes = Math.ceil((rateLimit.nextAllowedTime.getTime() - Date.now()) / (1000 * 60));
                                        return [2 /*return*/, res.status(429).json({
                                                error: "Too many password reset attempts",
                                                message: "Please try again in ".concat(resetTimeMinutes, " minutes"),
                                                nextAllowedTime: rateLimit.nextAllowedTime,
                                            })];
                                    }
                                    _a.label = 4;
                                case 4:
                                    // Check if email service is available
                                    if (!emailService.isAvailable()) {
                                        console.error("Password reset failed: Email service not configured");
                                        // Still return success to prevent account enumeration
                                        return [2 /*return*/, res.json({
                                                success: true,
                                                message: "If an account with that email exists, a password reset link has been sent.",
                                            })];
                                    }
                                    if (!(user && user.passwordHash)) return [3 /*break*/, 10];
                                    _a.label = 5;
                                case 5:
                                    _a.trys.push([5, 9, , 10]);
                                    // Clean up existing tokens for this user
                                    return [4 /*yield*/, storage.deleteUserResetTokens(user.id)];
                                case 6:
                                    // Clean up existing tokens for this user
                                    _a.sent();
                                    tokenId = randomBytes(16).toString("hex");
                                    verifier = randomBytes(32).toString("hex");
                                    fullToken = "".concat(tokenId, ".").concat(verifier);
                                    tokenHash = createHash("sha256").update(verifier).digest("hex");
                                    expiresAt = new Date(Date.now() + 60 * 60 * 1000);
                                    clientIp = req.ip;
                                    userAgent = req.headers["user-agent"] || "";
                                    tokenData = insertPasswordResetTokenSchema.parse({
                                        userId: user.id,
                                        tokenHash: tokenHash,
                                        expiresAt: expiresAt,
                                        requestIp: clientIp,
                                        userAgent: userAgent.substring(0, 500), // Truncate to fit DB constraint
                                    });
                                    return [4 /*yield*/, storage.createPasswordResetToken(tokenData)];
                                case 7:
                                    _a.sent();
                                    resetUrl = "".concat(req.get("Origin") || req.protocol + "://" + req.get("host"), "/reset-password?token=").concat(encodeURIComponent(fullToken));
                                    return [4 /*yield*/, emailService.sendPasswordResetEmail(user, resetUrl)];
                                case 8:
                                    emailSent = _a.sent();
                                    if (!emailSent) {
                                        console.error("Failed to send password reset email for user:", user.email);
                                    }
                                    return [3 /*break*/, 10];
                                case 9:
                                    error_4 = _a.sent();
                                    console.error("Error processing password reset for user:", user.email, error_4);
                                    return [3 /*break*/, 10];
                                case 10:
                                    // Always return success to prevent account enumeration
                                    res.json({
                                        success: true,
                                        message: "If an account with that email exists, a password reset link has been sent.",
                                    });
                                    return [3 /*break*/, 12];
                                case 11:
                                    error_5 = _a.sent();
                                    console.error("Password reset request error:", error_5);
                                    if (error_5 instanceof z.ZodError) {
                                        res.status(400).json({
                                            error: "Invalid request",
                                            message: "Valid email is required",
                                            details: error_5.errors,
                                        });
                                    }
                                    else {
                                        res.status(500).json({
                                            error: "Internal server error",
                                            message: "Unable to process password reset request",
                                        });
                                    }
                                    return [3 /*break*/, 12];
                                case 12: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/auth/reset-password/validate", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var token, tokenParts, tokenId, verifier, verifierHash, tokenRecord, isValid, error_6, error_7;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    token = req.query.token;
                                    if (!token || typeof token !== "string") {
                                        return [2 /*return*/, res.status(400).json({
                                                valid: false,
                                                error: "Token is required",
                                            })];
                                    }
                                    tokenParts = token.split(".");
                                    if (tokenParts.length !== 2) {
                                        return [2 /*return*/, res.status(400).json({
                                                valid: false,
                                                error: "Invalid token format",
                                            })];
                                    }
                                    tokenId = tokenParts[0], verifier = tokenParts[1];
                                    if (!tokenId ||
                                        !verifier ||
                                        tokenId.length !== 32 ||
                                        verifier.length !== 64 ||
                                        !/^[a-f0-9]+$/.test(tokenId) ||
                                        !/^[a-f0-9]+$/.test(verifier)) {
                                        return [2 /*return*/, res.status(400).json({
                                                valid: false,
                                                error: "Invalid token format",
                                            })];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    verifierHash = createHash("sha256")
                                        .update(verifier)
                                        .digest("hex");
                                    return [4 /*yield*/, storage.getPasswordResetTokenByTokenHash(verifierHash)];
                                case 2:
                                    tokenRecord = _a.sent();
                                    isValid = !!tokenRecord;
                                    res.json({
                                        valid: isValid,
                                    });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_6 = _a.sent();
                                    console.error("Token validation error:", error_6);
                                    res.json({
                                        valid: false,
                                        error: "Invalid token",
                                    });
                                    return [3 /*break*/, 4];
                                case 4: return [3 /*break*/, 6];
                                case 5:
                                    error_7 = _a.sent();
                                    console.error("Reset password validation error:", error_7);
                                    res.status(500).json({
                                        valid: false,
                                        error: "Unable to validate token",
                                    });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/auth/reset-password", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var schema, _a, token, password, tokenParts, tokenId, verifier, verifierHash, tokenRecord, user, hashedPassword, error_8, error_9;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 10, , 11]);
                                    schema = z.object({
                                        token: z.string().min(1, "Token is required"),
                                        password: z
                                            .string()
                                            .min(1, PASSWORD_REQUIREMENTS)
                                            .refine(isPasswordStrong, PASSWORD_REQUIREMENTS),
                                    });
                                    _a = schema.parse(req.body), token = _a.token, password = _a.password;
                                    tokenParts = token.split(".");
                                    if (tokenParts.length !== 2) {
                                        return [2 /*return*/, res.status(400).json({
                                                success: false,
                                                error: "Invalid token format",
                                            })];
                                    }
                                    tokenId = tokenParts[0], verifier = tokenParts[1];
                                    if (!tokenId ||
                                        !verifier ||
                                        tokenId.length !== 32 ||
                                        verifier.length !== 64 ||
                                        !/^[a-f0-9]+$/.test(tokenId) ||
                                        !/^[a-f0-9]+$/.test(verifier)) {
                                        return [2 /*return*/, res.status(400).json({
                                                success: false,
                                                error: "Invalid token format",
                                            })];
                                    }
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 8, , 9]);
                                    verifierHash = createHash("sha256")
                                        .update(verifier)
                                        .digest("hex");
                                    return [4 /*yield*/, storage.getPasswordResetTokenByTokenHash(verifierHash)];
                                case 2:
                                    tokenRecord = _b.sent();
                                    if (!tokenRecord) {
                                        return [2 /*return*/, res.status(400).json({
                                                success: false,
                                                error: "Invalid or expired token",
                                            })];
                                    }
                                    return [4 /*yield*/, storage.getUser(tokenRecord.userId)];
                                case 3:
                                    user = _b.sent();
                                    if (!user || !user.passwordHash) {
                                        return [2 /*return*/, res.status(400).json({
                                                success: false,
                                                error: "Invalid user account or authentication method",
                                            })];
                                    }
                                    return [4 /*yield*/, bcrypt.hash(password, 12)];
                                case 4:
                                    hashedPassword = _b.sent();
                                    // Update the user's password - we need to use the updateUser method or create a new one
                                    // Since updateUser might not handle passwordHash, we'll need to use the upsertUser method
                                    return [4 /*yield*/, storage.upsertUser({
                                            id: user.id,
                                            userType: user.userType,
                                            email: user.email,
                                            firstName: user.firstName,
                                            lastName: user.lastName,
                                            profileImageUrl: user.profileImageUrl,
                                            passwordHash: hashedPassword,
                                            emailVerified: user.emailVerified,
                                            facebookId: user.facebookId,
                                            facebookAccessToken: user.facebookAccessToken,
                                            googleId: user.googleId,
                                            googleAccessToken: user.googleAccessToken,
                                            stripeCustomerId: user.stripeCustomerId,
                                            stripeSubscriptionId: user.stripeSubscriptionId,
                                            subscriptionBillingInterval: user.subscriptionBillingInterval,
                                            birthYear: user.birthYear,
                                            gender: user.gender,
                                            postalCode: user.postalCode,
                                            mustResetPassword: false, // Clear the flag after successful reset
                                        })];
                                case 5:
                                    // Update the user's password - we need to use the updateUser method or create a new one
                                    // Since updateUser might not handle passwordHash, we'll need to use the upsertUser method
                                    _b.sent();
                                    // Mark the token as used
                                    return [4 /*yield*/, storage.markPasswordResetTokenUsed(tokenRecord.id)];
                                case 6:
                                    // Mark the token as used
                                    _b.sent();
                                    // Clean up any other reset tokens for this user for security
                                    return [4 /*yield*/, storage.deleteUserResetTokens(user.id)];
                                case 7:
                                    // Clean up any other reset tokens for this user for security
                                    _b.sent();
                                    res.json({
                                        success: true,
                                        message: "Password has been successfully reset",
                                    });
                                    return [3 /*break*/, 9];
                                case 8:
                                    error_8 = _b.sent();
                                    console.error("Password reset error:", error_8);
                                    return [2 /*return*/, res.status(400).json({
                                            success: false,
                                            error: "Invalid or expired token",
                                        })];
                                case 9: return [3 /*break*/, 11];
                                case 10:
                                    error_9 = _b.sent();
                                    console.error("Reset password error:", error_9);
                                    if (error_9 instanceof z.ZodError) {
                                        res.status(400).json({
                                            success: false,
                                            error: "Invalid request",
                                            details: error_9.errors,
                                        });
                                    }
                                    else {
                                        res.status(500).json({
                                            success: false,
                                            error: "Unable to reset password",
                                        });
                                    }
                                    return [3 /*break*/, 11];
                                case 11: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Endpoint for authenticated users to change their temporary password
                    app.post("/api/auth/change-temp-password", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var schema, _a, currentPassword, newPassword, user, isValid, hashedPassword, error_10;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    schema = z.object({
                                        currentPassword: z.string().min(1, "Current password is required"),
                                        newPassword: z
                                            .string()
                                            .min(1, PASSWORD_REQUIREMENTS)
                                            .refine(isPasswordStrong, PASSWORD_REQUIREMENTS),
                                    });
                                    _a = schema.parse(req.body), currentPassword = _a.currentPassword, newPassword = _a.newPassword;
                                    user = req.user;
                                    if (!user.passwordHash) {
                                        return [2 /*return*/, res.status(400).json({
                                                success: false,
                                                error: "Account uses OAuth authentication",
                                            })];
                                    }
                                    return [4 /*yield*/, bcrypt.compare(currentPassword, user.passwordHash)];
                                case 1:
                                    isValid = _b.sent();
                                    if (!isValid) {
                                        return [2 /*return*/, res.status(400).json({
                                                success: false,
                                                error: "Current password is incorrect",
                                            })];
                                    }
                                    return [4 /*yield*/, bcrypt.hash(newPassword, 12)];
                                case 2:
                                    hashedPassword = _b.sent();
                                    // Update the user's password
                                    return [4 /*yield*/, storage.upsertUser({
                                            id: user.id,
                                            userType: user.userType,
                                            email: user.email,
                                            firstName: user.firstName,
                                            lastName: user.lastName,
                                            profileImageUrl: user.profileImageUrl,
                                            passwordHash: hashedPassword,
                                            emailVerified: user.emailVerified,
                                            facebookId: user.facebookId,
                                            facebookAccessToken: user.facebookAccessToken,
                                            googleId: user.googleId,
                                            googleAccessToken: user.googleAccessToken,
                                            stripeCustomerId: user.stripeCustomerId,
                                            stripeSubscriptionId: user.stripeSubscriptionId,
                                            subscriptionBillingInterval: user.subscriptionBillingInterval,
                                            birthYear: user.birthYear,
                                            gender: user.gender,
                                            postalCode: user.postalCode,
                                            mustResetPassword: false, // Clear the flag after successful reset
                                        })];
                                case 3:
                                    // Update the user's password
                                    _b.sent();
                                    res.json({
                                        success: true,
                                        message: "Password has been successfully changed",
                                    });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_10 = _b.sent();
                                    console.error("Password change error:", error_10);
                                    if (error_10 instanceof z.ZodError) {
                                        res.status(400).json({
                                            success: false,
                                            error: "Invalid request",
                                            details: error_10.errors,
                                        });
                                    }
                                    else {
                                        res.status(500).json({
                                            success: false,
                                            error: "Unable to change password",
                                        });
                                    }
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // User address routes
                    app.get("/api/user/addresses", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, addresses, error_11;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getUserAddresses(userId)];
                                case 1:
                                    addresses = _a.sent();
                                    res.json(addresses);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_11 = _a.sent();
                                    console.error("Error fetching user addresses:", error_11);
                                    res.status(500).json({ message: "Failed to fetch addresses" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/user/addresses", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, addressData, address, error_12;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.user.id;
                                    addressData = insertUserAddressSchema.parse(__assign(__assign({}, req.body), { userId: userId }));
                                    return [4 /*yield*/, storage.createUserAddress(addressData)];
                                case 1:
                                    address = _a.sent();
                                    res.status(201).json(address);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_12 = _a.sent();
                                    console.error("Error creating address:", error_12);
                                    if (error_12 instanceof z.ZodError) {
                                        res
                                            .status(400)
                                            .json({ message: "Invalid address data", errors: error_12.errors });
                                    }
                                    else {
                                        res.status(500).json({ message: "Failed to create address" });
                                    }
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.put("/api/user/addresses/:addressId", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var addressId, userId, existingAddress, updates, updatedAddress, error_13;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    addressId = req.params.addressId;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getUserAddress(addressId)];
                                case 1:
                                    existingAddress = _a.sent();
                                    if (!existingAddress || existingAddress.userId !== userId) {
                                        return [2 /*return*/, res.status(404).json({ message: "Address not found" })];
                                    }
                                    updates = insertUserAddressSchema.partial().parse(req.body);
                                    return [4 /*yield*/, storage.updateUserAddress(addressId, updates)];
                                case 2:
                                    updatedAddress = _a.sent();
                                    res.json(updatedAddress);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_13 = _a.sent();
                                    console.error("Error updating address:", error_13);
                                    if (error_13 instanceof z.ZodError) {
                                        res
                                            .status(400)
                                            .json({ message: "Invalid address data", errors: error_13.errors });
                                    }
                                    else {
                                        res.status(500).json({ message: "Failed to update address" });
                                    }
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/user/addresses/:addressId", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var addressId, userId, existingAddress, error_14;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    addressId = req.params.addressId;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getUserAddress(addressId)];
                                case 1:
                                    existingAddress = _a.sent();
                                    if (!existingAddress || existingAddress.userId !== userId) {
                                        return [2 /*return*/, res.status(404).json({ message: "Address not found" })];
                                    }
                                    return [4 /*yield*/, storage.deleteUserAddress(addressId)];
                                case 2:
                                    _a.sent();
                                    res.status(204).send();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_14 = _a.sent();
                                    console.error("Error deleting address:", error_14);
                                    res.status(500).json({ message: "Failed to delete address" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/user/addresses/:addressId/set-default", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var addressId, userId, existingAddress, error_15;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    addressId = req.params.addressId;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getUserAddress(addressId)];
                                case 1:
                                    existingAddress = _a.sent();
                                    if (!existingAddress || existingAddress.userId !== userId) {
                                        return [2 /*return*/, res.status(404).json({ message: "Address not found" })];
                                    }
                                    return [4 /*yield*/, storage.setDefaultAddress(userId, addressId)];
                                case 2:
                                    _a.sent();
                                    res.status(200).json({ message: "Default address updated" });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_15 = _a.sent();
                                    console.error("Error setting default address:", error_15);
                                    res.status(500).json({ message: "Failed to set default address" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Host location request routes
                    app.post("/api/location-requests", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, parsed, created, error_16;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.user.id;
                                    parsed = insertLocationRequestSchema.parse(__assign(__assign({}, req.body), { postedByUserId: userId }));
                                    return [4 /*yield*/, storage.createLocationRequest(parsed)];
                                case 1:
                                    created = _a.sent();
                                    res
                                        .status(201)
                                        .json({ message: "Location request submitted", request: created });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_16 = _a.sent();
                                    console.error("Error creating location request:", error_16);
                                    if (error_16 instanceof z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({
                                                message: "Invalid location request data",
                                                errors: error_16.errors,
                                            })];
                                    }
                                    res.status(400).json({
                                        message: error_16.message || "Failed to create location request",
                                    });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/location-requests/:id/interests", isRestaurantOwner, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var locationRequestId, _a, restaurantId, message, ownsRestaurant, parsed, result, error_17;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    locationRequestId = req.params.id;
                                    _a = req.body, restaurantId = _a.restaurantId, message = _a.message;
                                    if (!restaurantId) {
                                        return [2 /*return*/, res.status(400).json({ message: "Restaurant ID is required" })];
                                    }
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    ownsRestaurant = _b.sent();
                                    if (!ownsRestaurant) {
                                        return [2 /*return*/, res
                                                .status(403)
                                                .json({ message: "You can only respond for restaurants you own" })];
                                    }
                                    parsed = insertTruckInterestSchema.parse({
                                        locationRequestId: locationRequestId,
                                        restaurantId: restaurantId,
                                        message: message,
                                    });
                                    return [4 /*yield*/, storage.createTruckInterest(parsed)];
                                case 2:
                                    result = _b.sent();
                                    return [4 /*yield*/, sendTruckInterestNotification(result.locationRequest, restaurantId, message)];
                                case 3:
                                    _b.sent();
                                    res.status(201).json({
                                        message: "Interest sent to host",
                                        interestId: result.interestId,
                                    });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_17 = _b.sent();
                                    console.error("Error expressing truck interest:", error_17);
                                    if (error_17 instanceof z.ZodError) {
                                        return [2 /*return*/, res.status(400).json({
                                                message: "Invalid truck interest data",
                                                errors: error_17.errors,
                                            })];
                                    }
                                    if (error_17.message === "Location request not found") {
                                        return [2 /*return*/, res
                                                .status(404)
                                                .json({ message: "Location request not found" })];
                                    }
                                    if (error_17.message === "Location request is not open") {
                                        return [2 /*return*/, res.status(400).json({
                                                message: "Location request is not accepting new interest",
                                            })];
                                    }
                                    res.status(500).json({ message: "Failed to submit interest" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Public map feed: hosts (open location requests) + upcoming events (hosted slots)
                    app.get("/api/map/locations", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, openLocations, upcomingEvents, hostProfiles, publicEvents, hostLocations, eventLocations, error_18;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, Promise.all([
                                            storage.getOpenLocationRequests(),
                                            storage.getAllUpcomingEvents(),
                                            db
                                                .select()
                                                .from(hosts)
                                                .where(isNotNull(hosts.address)),
                                        ])];
                                case 1:
                                    _a = _b.sent(), openLocations = _a[0], upcomingEvents = _a[1], hostProfiles = _a[2];
                                    publicEvents = upcomingEvents.filter(function (event) { return !event.requiresPayment; });
                                    hostLocations = __spreadArray(__spreadArray([], openLocations.map(function (loc) { return ({
                                        id: loc.id,
                                        type: "host_location",
                                        name: loc.businessName,
                                        address: loc.address,
                                        city: null,
                                        state: null,
                                        locationType: loc.locationType,
                                        expectedFootTraffic: loc.expectedFootTraffic,
                                        notes: loc.notes,
                                        preferredDates: loc.preferredDates,
                                        status: loc.status,
                                        latitude: loc.latitude,
                                        longitude: loc.longitude,
                                    }); }), true), hostProfiles.map(function (host) { return ({
                                        id: host.id,
                                        type: "host_location",
                                        name: host.businessName,
                                        address: host.address,
                                        city: host.city,
                                        state: host.state,
                                        locationType: host.locationType,
                                        expectedFootTraffic: host.expectedFootTraffic,
                                        notes: host.notes,
                                        preferredDates: [],
                                        status: host.isVerified ? "verified" : "active",
                                        latitude: host.latitude,
                                        longitude: host.longitude,
                                    }); }), true);
                                    eventLocations = publicEvents.map(function (event) {
                                        var _a, _b, _c, _d, _e, _f, _g, _h;
                                        return ({
                                            id: event.id,
                                            type: "event",
                                            name: event.name || "Host Event",
                                            description: event.description,
                                            date: event.date,
                                            startTime: event.startTime,
                                            endTime: event.endTime,
                                            maxTrucks: event.maxTrucks,
                                            status: event.status,
                                            hostId: event.hostId,
                                            hostName: (_a = event.host) === null || _a === void 0 ? void 0 : _a.businessName,
                                            hostAddress: (_b = event.host) === null || _b === void 0 ? void 0 : _b.address,
                                            hostCity: (_d = (_c = event.host) === null || _c === void 0 ? void 0 : _c.city) !== null && _d !== void 0 ? _d : null,
                                            hostState: (_f = (_e = event.host) === null || _e === void 0 ? void 0 : _e.state) !== null && _f !== void 0 ? _f : null,
                                            hostLatitude: (_g = event.host) === null || _g === void 0 ? void 0 : _g.latitude,
                                            hostLongitude: (_h = event.host) === null || _h === void 0 ? void 0 : _h.longitude,
                                            hardCapEnabled: event.hardCapEnabled,
                                            seriesId: event.seriesId,
                                            bookedRestaurantId: event.bookedRestaurantId,
                                        });
                                    });
                                    res.json({ hostLocations: hostLocations, eventLocations: eventLocations });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_18 = _b.sent();
                                    console.error("Error building map locations feed:", error_18);
                                    res.status(500).json({ message: "Failed to load map data" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Host Profile & Events
                    registerHostRoutes(app);
                    // =====================================================================
                    // EVENT SERIES (OPEN CALLS) ENDPOINTS
                    // =====================================================================
                    registerOpenCallSeriesRoutes(app);
                    // =====================================================================
                    // END EVENT SERIES ENDPOINTS
                    // ====================================================================
                    // Truck Discovery
                    registerEventRoutes(app);
                    registerEventCoordinatorRoutes(app);
                    // Booking Management
                    registerBookingRoutes(app);
                    app.patch("/api/hosts/interests/:interestId/status", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var interestId, status_1, userId, _a, interest_1, event_1, host_1, currentInterests, acceptedCount, capacityError, updatedInterest, error_19;
                        var _this = this;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 6, , 7]);
                                    interestId = req.params.interestId;
                                    status_1 = req.body.status;
                                    userId = req.user.id;
                                    if (!["accepted", "declined"].includes(status_1)) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid status" })];
                                    }
                                    return [4 /*yield*/, getInterestEventAndHostForUser(interestId, userId)];
                                case 1:
                                    _a = _b.sent(), interest_1 = _a.interest, event_1 = _a.event, host_1 = _a.host;
                                    if (!interest_1) {
                                        return [2 /*return*/, res.status(404).json({ message: "Interest not found" })];
                                    }
                                    if (!event_1) {
                                        return [2 /*return*/, res.status(404).json({ message: "Event not found" })];
                                    }
                                    if (!hostOwnsEvent(host_1, event_1)) {
                                        return [2 /*return*/, res
                                                .status(403)
                                                .json({ message: "Not authorized to manage this event" })];
                                    }
                                    // Idempotency Check: If already in desired status, return success
                                    if (interest_1.status === status_1) {
                                        return [2 /*return*/, res.json(interest_1)];
                                    }
                                    if (!(status_1 === "accepted" && event_1.hardCapEnabled)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, storage.getEventInterestsByEventId(event_1.id)];
                                case 2:
                                    currentInterests = _b.sent();
                                    acceptedCount = computeAcceptedCount(currentInterests);
                                    if (!shouldBlockAcceptance({
                                        hardCapEnabled: event_1.hardCapEnabled,
                                        acceptedCount: acceptedCount,
                                        maxTrucks: event_1.maxTrucks,
                                    })) return [3 /*break*/, 4];
                                    // Telemetry: Blocked Attempt
                                    return [4 /*yield*/, storage.createTelemetryEvent({
                                            eventName: "interest_accept_blocked",
                                            userId: req.user.id,
                                            properties: {
                                                eventId: event_1.id,
                                                truckId: interest_1.truckId,
                                                reason: "capacity_guard_limit_reached",
                                                maxTrucks: event_1.maxTrucks,
                                                acceptedCount: acceptedCount,
                                            },
                                        })];
                                case 3:
                                    // Telemetry: Blocked Attempt
                                    _b.sent();
                                    capacityError = buildCapacityFullError();
                                    return [2 /*return*/, res.status(400).json(capacityError)];
                                case 4: return [4 /*yield*/, storage.updateEventInterestStatus(interestId, status_1)];
                                case 5:
                                    updatedInterest = _b.sent();
                                    // Send notification to truck (fire and forget)
                                    (function () { return __awaiter(_this, void 0, void 0, function () {
                                        var allInterests, acceptedCount, isOverCap, truck, owner, err_1;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    _a.trys.push([0, 7, , 8]);
                                                    return [4 /*yield*/, storage.getEventInterestsByEventId(event_1.id)];
                                                case 1:
                                                    allInterests = _a.sent();
                                                    acceptedCount = computeAcceptedCount(allInterests);
                                                    isOverCap = acceptedCount >= event_1.maxTrucks;
                                                    return [4 /*yield*/, storage.createTelemetryEvent({
                                                            eventName: status_1 === "accepted"
                                                                ? "interest_accepted"
                                                                : "interest_declined",
                                                            userId: req.user.id,
                                                            properties: {
                                                                eventId: event_1.id,
                                                                truckId: interest_1.truckId,
                                                                fillRate: computeFillRate({
                                                                    acceptedCount: acceptedCount,
                                                                    maxTrucks: event_1.maxTrucks,
                                                                }),
                                                                acceptedCount: acceptedCount,
                                                                maxTrucks: event_1.maxTrucks,
                                                                isOverCap: isOverCap,
                                                            },
                                                        })];
                                                case 2:
                                                    _a.sent();
                                                    return [4 /*yield*/, storage.getRestaurant(interest_1.truckId)];
                                                case 3:
                                                    truck = _a.sent();
                                                    if (!truck) return [3 /*break*/, 6];
                                                    return [4 /*yield*/, storage.getUser(truck.ownerId)];
                                                case 4:
                                                    owner = _a.sent();
                                                    if (!(owner && owner.email)) return [3 /*break*/, 6];
                                                    return [4 /*yield*/, emailService.sendInterestStatusUpdate(owner.email, truck.name, host_1.businessName, new Date(event_1.date).toLocaleDateString(), status_1)];
                                                case 5:
                                                    _a.sent();
                                                    _a.label = 6;
                                                case 6: return [3 /*break*/, 8];
                                                case 7:
                                                    err_1 = _a.sent();
                                                    console.error("Failed to send status update notification:", err_1);
                                                    return [3 /*break*/, 8];
                                                case 8: return [2 /*return*/];
                                            }
                                        });
                                    }); })();
                                    res.json(updatedInterest);
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_19 = _b.sent();
                                    console.error("Error updating interest status:", error_19);
                                    res.status(500).json({ message: "Failed to update status" });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/hosts/events/:eventId/interests", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var eventId, userId, host, event_2, interests, error_20;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    eventId = req.params.eventId;
                                    userId = req.user.id;
                                    return [4 /*yield*/, getHostByUserId(userId)];
                                case 1:
                                    host = _a.sent();
                                    if (!host) {
                                        return [2 /*return*/, res.status(403).json({ message: "Not a host" })];
                                    }
                                    return [4 /*yield*/, getEventAndHostForUser(eventId, userId)];
                                case 2:
                                    event_2 = (_a.sent()).event;
                                    if (!event_2 || !hostOwnsEvent(host, event_2)) {
                                        return [2 /*return*/, res.status(404).json({ message: "Event not found" })];
                                    }
                                    return [4 /*yield*/, storage.getEventInterestsByEventId(eventId)];
                                case 3:
                                    interests = _a.sent();
                                    res.json(interests);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_20 = _a.sent();
                                    console.error("Error fetching event interests:", error_20);
                                    res.status(500).json({ message: "Failed to fetch interests" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Restaurant routes
                    // Get subscribed restaurants (public endpoint)
                    app.get("/api/restaurants/subscribed/:lat/:lng", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, lat, lng, latitude, longitude, radius, restaurants_3, restaurantIds, dealCounts_1, allDeals, restaurantsWithDeals, error_21;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    _a = req.params, lat = _a.lat, lng = _a.lng;
                                    latitude = parseFloat(lat);
                                    longitude = parseFloat(lng);
                                    if (isNaN(latitude) ||
                                        isNaN(longitude) ||
                                        latitude < -90 ||
                                        latitude > 90 ||
                                        longitude < -180 ||
                                        longitude > 180) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid coordinates" })];
                                    }
                                    radius = req.query.radius
                                        ? Math.min(parseFloat(req.query.radius), 100)
                                        : 50;
                                    if (isNaN(radius) || radius <= 0) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid radius" })];
                                    }
                                    return [4 /*yield*/, storage.getSubscribedRestaurants(latitude, longitude, radius)];
                                case 1:
                                    restaurants_3 = _b.sent();
                                    restaurantIds = restaurants_3.map(function (r) { return r.id; });
                                    dealCounts_1 = {};
                                    if (!(restaurantIds.length > 0)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, db
                                            .select({
                                            restaurantId: deals.restaurantId,
                                            count: sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["count(*)::integer"], ["count(*)::integer"]))),
                                        })
                                            .from(deals)
                                            .where(and(inArray(deals.restaurantId, restaurantIds), eq(deals.isActive, true)))
                                            .groupBy(deals.restaurantId)];
                                case 2:
                                    allDeals = _b.sent();
                                    allDeals.forEach(function (_a) {
                                        var restaurantId = _a.restaurantId, count = _a.count;
                                        dealCounts_1[restaurantId] = count;
                                    });
                                    _b.label = 3;
                                case 3:
                                    restaurantsWithDeals = restaurants_3.map(function (restaurant) { return (__assign(__assign({}, restaurant), { activeDealsCount: dealCounts_1[restaurant.id] || 0 })); });
                                    res.json(restaurantsWithDeals);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_21 = _b.sent();
                                    console.error("Error fetching subscribed restaurants:", error_21);
                                    res
                                        .status(500)
                                        .json({ message: "Failed to fetch subscribed restaurants" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Restaurant owner routes
                    app.get("/api/restaurants/my-restaurants", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, restaurants_4, error_22;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getRestaurantsByOwner(userId)];
                                case 1:
                                    restaurants_4 = _a.sent();
                                    res.json(restaurants_4);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_22 = _a.sent();
                                    console.error("Error fetching user restaurants:", error_22);
                                    res.status(500).json({ message: "Failed to fetch restaurants" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/restaurants/:restaurantId/stats", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, deals_2, stats, error_23;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    restaurantId = req.params.restaurantId;
                                    return [4 /*yield*/, storage.getDealsByRestaurant(restaurantId)];
                                case 1:
                                    deals_2 = _b.sent();
                                    _a = {
                                        totalDeals: deals_2.length,
                                        activeDeals: deals_2.filter(function (d) { return d.isActive; }).length,
                                        totalViews: deals_2.reduce(function (sum, d) { return sum + (d.viewCount || 0); }, 0),
                                        totalClaims: deals_2.reduce(function (sum, d) { return sum + (d.currentUses || 0); }, 0),
                                        conversionRate: 0
                                    };
                                    return [4 /*yield*/, storage.getRestaurantAverageRating(restaurantId)];
                                case 2:
                                    stats = (_a.averageRating = (_b.sent()) || 0,
                                        _a);
                                    if (stats.totalViews > 0) {
                                        stats.conversionRate = (stats.totalClaims / stats.totalViews) * 100;
                                    }
                                    res.json(stats);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_23 = _b.sent();
                                    console.error("Error fetching restaurant stats:", error_23);
                                    res.status(500).json({ message: "Failed to fetch stats" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // 🔒 SECURITY: Update deal - requires ownership of restaurant
                    app.patch("/api/deals/:dealId", isAuthenticated, verifyResourceOwnership("deal"), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var dealId, updates, userId, currentDeal, subscriptionValidation, updatedDeal, error_24;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 6, , 7]);
                                    return [4 /*yield*/, logAudit(req.user.id, "deal_edit", "deal", req.params.dealId, req.ip, req.headers["user-agent"], req.body)];
                                case 1:
                                    _a.sent();
                                    dealId = req.params.dealId;
                                    updates = req.body;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getDeal(dealId)];
                                case 2:
                                    currentDeal = _a.sent();
                                    if (!currentDeal) {
                                        return [2 /*return*/, res.status(404).json({ message: "Deal not found" })];
                                    }
                                    if (!(updates.isActive === true && !currentDeal.isActive)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, validateSubscriptionLimits(userId, dealId)];
                                case 3:
                                    subscriptionValidation = _a.sent();
                                    if (!subscriptionValidation.isValid) {
                                        return [2 /*return*/, res.status(402).json({
                                                message: subscriptionValidation.error,
                                                currentCount: subscriptionValidation.currentCount,
                                                maxDeals: subscriptionValidation.maxDeals,
                                            })];
                                    }
                                    _a.label = 4;
                                case 4: return [4 /*yield*/, storage.updateDeal(dealId, updates)];
                                case 5:
                                    updatedDeal = _a.sent();
                                    res.json(updatedDeal);
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_24 = _a.sent();
                                    console.error("Error updating deal:", error_24);
                                    res.status(500).json({ message: "Failed to update deal" });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    // 🔒 SECURITY: Delete deal - requires ownership of restaurant
                    app.delete("/api/deals/:dealId", isAuthenticated, verifyResourceOwnership("deal"), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var dealId, error_25;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, logAudit(req.user.id, "deal_delete", "deal", req.params.dealId, req.ip, req.headers["user-agent"], {})];
                                case 1:
                                    _a.sent();
                                    dealId = req.params.dealId;
                                    // Ownership verified by middleware - safe to delete
                                    return [4 /*yield*/, storage.deleteDeal(dealId)];
                                case 2:
                                    // Ownership verified by middleware - safe to delete
                                    _a.sent();
                                    res.json({ success: true });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_25 = _a.sent();
                                    console.error("Error deleting deal:", error_25);
                                    res.status(500).json({ message: "Failed to delete deal" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Event ingestion endpoints
                    // Deal view tracking endpoint with proper per-identity rate limiting
                    app.post("/api/deals/:dealId/view", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var dealId, userId, sessionId, deal, hasRecentView, viewData, view, error_26;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    dealId = req.params.dealId;
                                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                                    sessionId = req.sessionID;
                                    return [4 /*yield*/, storage.getDeal(dealId)];
                                case 1:
                                    deal = _b.sent();
                                    if (!deal) {
                                        console.warn("[deals:view] deal not found for id ".concat(dealId, " - skipping view tracking"));
                                        return [2 /*return*/, res.json({
                                                success: true,
                                                message: "Deal not found; view skipped",
                                            })];
                                    }
                                    return [4 /*yield*/, storage.hasRecentDealView(dealId, userId, sessionId, 3600000)];
                                case 2:
                                    hasRecentView = _b.sent();
                                    if (hasRecentView) {
                                        return [2 /*return*/, res.json({
                                                success: true,
                                                message: "View already recorded recently",
                                            })];
                                    }
                                    viewData = insertDealViewSchema.parse({
                                        dealId: dealId,
                                        userId: userId,
                                        sessionId: sessionId,
                                    });
                                    return [4 /*yield*/, storage.recordDealView(viewData)];
                                case 3:
                                    view = _b.sent();
                                    res.json({ success: true, view: view });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_26 = _b.sent();
                                    console.error("Error recording deal view:", error_26);
                                    res.status(500).json({ message: "Failed to record view" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Mark deal claim as used with order amount
                    app.patch("/api/deal-claims/:claimId/use", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var claimId, amountSchema, orderAmount, isAuthorized, updatedClaim, error_27;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    claimId = req.params.claimId;
                                    amountSchema = z.object({
                                        orderAmount: z.number().positive().min(0.01).max(10000).optional(),
                                    });
                                    orderAmount = amountSchema.parse((_a = req.body) !== null && _a !== void 0 ? _a : {}).orderAmount;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnershipByClaim(claimId, req.user.id)];
                                case 1:
                                    isAuthorized = _b.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only mark claims as used for your own restaurants",
                                            })];
                                    }
                                    return [4 /*yield*/, storage.markClaimAsUsed(claimId, orderAmount !== null && orderAmount !== void 0 ? orderAmount : null)];
                                case 2:
                                    updatedClaim = _b.sent();
                                    if (!updatedClaim) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "Claim not found or already used" })];
                                    }
                                    res.json({ success: true, claim: updatedClaim });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_27 = _b.sent();
                                    console.error("Error marking claim as used:", error_27);
                                    res.status(400).json({
                                        message: error_27 instanceof Error
                                            ? error_27.message
                                            : "Failed to mark claim as used",
                                    });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Food truck endpoints
                    // Update restaurant mobile settings (owner only)
                    app.patch("/api/restaurants/:restaurantId/mobile-settings", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, isAuthorized, settings, updatedRestaurant, error_28;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    restaurantId = req.params.restaurantId;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _a.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only update settings for restaurants you own",
                                            })];
                                    }
                                    settings = updateRestaurantMobileSettingsSchema.parse(req.body);
                                    return [4 /*yield*/, storage.setRestaurantMobileSettings(restaurantId, settings)];
                                case 2:
                                    updatedRestaurant = _a.sent();
                                    // Broadcast status update via WebSocket if mobile status changed
                                    if (settings.mobileOnline !== undefined) {
                                        broadcastStatusUpdate(restaurantId, {
                                            isOnline: updatedRestaurant.mobileOnline || false,
                                            mobileOnline: updatedRestaurant.mobileOnline || false,
                                        });
                                    }
                                    res.json({ success: true, restaurant: updatedRestaurant });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_28 = _a.sent();
                                    console.error("Error updating mobile settings:", error_28);
                                    res.status(400).json({
                                        message: error_28 instanceof Error
                                            ? error_28.message
                                            : "Failed to update mobile settings",
                                    });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Update restaurant location (owner only)
                    app.patch("/api/restaurants/:restaurantId/location", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, isAuthorized, locationData, resolvedLocation, updatedRestaurant, error_29;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.restaurantId;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _a.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only update location for restaurants you own",
                                            })];
                                    }
                                    locationData = updateRestaurantLocationSchema.parse(req.body);
                                    return [4 /*yield*/, reverseGeocode(locationData.latitude, locationData.longitude)];
                                case 2:
                                    resolvedLocation = _a.sent();
                                    return [4 /*yield*/, storage.updateRestaurantLocation(restaurantId, __assign(__assign({}, locationData), { city: resolvedLocation.city, state: resolvedLocation.state }))];
                                case 3:
                                    updatedRestaurant = _a.sent();
                                    // Broadcast location update via WebSocket
                                    broadcastLocationUpdate(restaurantId, {
                                        latitude: updatedRestaurant.currentLatitude
                                            ? parseFloat(updatedRestaurant.currentLatitude)
                                            : 0,
                                        longitude: updatedRestaurant.currentLongitude
                                            ? parseFloat(updatedRestaurant.currentLongitude)
                                            : 0,
                                        mobileOnline: updatedRestaurant.mobileOnline || false,
                                        lastBroadcastAt: updatedRestaurant.lastBroadcastAt || new Date(),
                                    });
                                    res.json({ success: true, restaurant: updatedRestaurant });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_29 = _a.sent();
                                    console.error("Error updating restaurant location:", error_29);
                                    res.status(400).json({
                                        message: error_29 instanceof Error
                                            ? error_29.message
                                            : "Failed to update location",
                                    });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Update restaurant operating hours (owner only)
                    app.patch("/api/restaurants/:restaurantId/operating-hours", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, isAuthorized, hoursData, updatedRestaurant, error_30;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    restaurantId = req.params.restaurantId;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _a.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only update operating hours for restaurants you own",
                                            })];
                                    }
                                    hoursData = updateRestaurantOperatingHoursSchema.parse(req.body);
                                    return [4 /*yield*/, storage.setRestaurantOperatingHours(restaurantId, hoursData.operatingHours)];
                                case 2:
                                    updatedRestaurant = _a.sent();
                                    res.json({ success: true, restaurant: updatedRestaurant });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_30 = _a.sent();
                                    console.error("Error updating operating hours:", error_30);
                                    res.status(400).json({
                                        message: error_30 instanceof Error
                                            ? error_30.message
                                            : "Failed to update operating hours",
                                    });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Check if restaurant is currently open (public endpoint)
                    app.get("/api/restaurants/:restaurantId/is-open", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, isOpen, error_31;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    restaurantId = req.params.restaurantId;
                                    return [4 /*yield*/, storage.isRestaurantOpenNow(restaurantId)];
                                case 1:
                                    isOpen = _a.sent();
                                    res.json({ success: true, isOpen: isOpen });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_31 = _a.sent();
                                    console.error("Error checking restaurant hours:", error_31);
                                    res.status(400).json({
                                        message: error_31 instanceof Error
                                            ? error_31.message
                                            : "Failed to check restaurant hours",
                                    });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Start food truck session
                    app.post("/api/restaurants/:restaurantId/truck-session/start", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, deviceId, isAuthorized, session, error_32;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.restaurantId;
                                    deviceId = req.body.deviceId;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _a.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only start sessions for restaurants you own",
                                            })];
                                    }
                                    if (!deviceId) {
                                        return [2 /*return*/, res.status(400).json({ message: "deviceId is required" })];
                                    }
                                    return [4 /*yield*/, storage.startTruckSession(restaurantId, deviceId, req.user.id)];
                                case 2:
                                    session = _a.sent();
                                    return [4 /*yield*/, storage.setRestaurantMobileSettings(restaurantId, {
                                            mobileOnline: true,
                                        })];
                                case 3:
                                    _a.sent();
                                    res.json({ success: true, session: session });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_32 = _a.sent();
                                    console.error("Error starting truck session:", error_32);
                                    res.status(500).json({ message: "Failed to start truck session" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // End food truck session
                    app.post("/api/restaurants/:restaurantId/truck-session/end", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, isAuthorized, error_33;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.restaurantId;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _a.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only end sessions for restaurants you own",
                                            })];
                                    }
                                    return [4 /*yield*/, storage.endTruckSession(restaurantId, req.user.id)];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, storage.setRestaurantMobileSettings(restaurantId, {
                                            mobileOnline: false,
                                        })];
                                case 3:
                                    _a.sent();
                                    res.json({ success: true });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_33 = _a.sent();
                                    console.error("Error ending truck session:", error_33);
                                    res.status(500).json({ message: "Failed to end truck session" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Update food truck location with rate limiting
                    app.post("/api/restaurants/:restaurantId/location", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, isAuthorized, rateLimitResult, locationData, location_1, error_34;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    restaurantId = req.params.restaurantId;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _a.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only update location for restaurants you own",
                                            })];
                                    }
                                    rateLimitResult = checkRateLimit("location_update_".concat(req.user.id, "_").concat(restaurantId));
                                    if (!rateLimitResult.allowed) {
                                        return [2 /*return*/, res.status(429).json({
                                                message: "Too many location updates. Please wait before trying again.",
                                                nextAllowedTime: rateLimitResult.nextAllowedTime,
                                            })];
                                    }
                                    locationData = insertFoodTruckLocationSchema.parse(__assign(__assign({}, req.body), { restaurantId: restaurantId }));
                                    return [4 /*yield*/, storage.upsertLiveLocation(locationData)];
                                case 2:
                                    location_1 = _a.sent();
                                    // Broadcast location update via WebSocket
                                    broadcastLocationUpdate(restaurantId, location_1);
                                    res.json({ success: true, location: location_1 });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_34 = _a.sent();
                                    console.error("Error updating location:", error_34);
                                    res.status(400).json({
                                        message: error_34 instanceof Error
                                            ? error_34.message
                                            : "Failed to update location",
                                    });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Get live food trucks nearby (public endpoint)
                    app.get("/api/trucks/live", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, lat, lng, _b, radiusKm, latitude, longitude, radius, trucks, error_35;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 3]);
                                    _a = req.query, lat = _a.lat, lng = _a.lng, _b = _a.radiusKm, radiusKm = _b === void 0 ? 5 : _b;
                                    if (!lat || !lng) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "lat and lng query parameters are required" })];
                                    }
                                    latitude = parseFloat(lat);
                                    longitude = parseFloat(lng);
                                    radius = Math.min(parseFloat(radiusKm), 50);
                                    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "Invalid coordinates or radius" })];
                                    }
                                    if (latitude < -90 ||
                                        latitude > 90 ||
                                        longitude < -180 ||
                                        longitude > 180) {
                                        return [2 /*return*/, res.status(400).json({ message: "Invalid coordinates range" })];
                                    }
                                    return [4 /*yield*/, storage.getLiveTrucksNearby(latitude, longitude, radius)];
                                case 1:
                                    trucks = _c.sent();
                                    res.json({ trucks: trucks });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_35 = _c.sent();
                                    console.error("Error fetching live trucks:", error_35);
                                    res.status(500).json({ message: "Failed to fetch live trucks" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Get food truck location history (owner only)
                    app.get("/api/restaurants/:restaurantId/locations", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, _a, startDate, endDate, isAuthorized, dateRange, locations, error_36;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    restaurantId = req.params.restaurantId;
                                    _a = req.query, startDate = _a.startDate, endDate = _a.endDate;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _b.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only access location history for restaurants you own",
                                            })];
                                    }
                                    dateRange = void 0;
                                    if (startDate && endDate) {
                                        dateRange = {
                                            start: new Date(startDate),
                                            end: new Date(endDate),
                                        };
                                    }
                                    return [4 /*yield*/, storage.getTruckLocationHistory(restaurantId, dateRange)];
                                case 2:
                                    locations = _b.sent();
                                    res.json({ locations: locations });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_36 = _b.sent();
                                    console.error("Error fetching location history:", error_36);
                                    res.status(500).json({ message: "Failed to fetch location history" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Analytics API endpoints (require authentication to verify restaurant ownership)
                    app.get("/api/restaurants/:restaurantId/analytics/summary", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, _a, startDate, endDate, isAuthorized, analyticsAccess, dateRange, summary, error_37;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.restaurantId;
                                    _a = req.query, startDate = _a.startDate, endDate = _a.endDate;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _b.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only access analytics for restaurants you own",
                                            })];
                                    }
                                    return [4 /*yield*/, validateAnalyticsAccess(req.user.id)];
                                case 2:
                                    analyticsAccess = _b.sent();
                                    if (!analyticsAccess.hasAccess) {
                                        return [2 /*return*/, res.status(402).json({
                                                message: analyticsAccess.error,
                                                subscriptionTier: analyticsAccess.subscriptionTier,
                                            })];
                                    }
                                    dateRange = void 0;
                                    if (startDate && endDate) {
                                        dateRange = {
                                            start: new Date(startDate),
                                            end: new Date(endDate),
                                        };
                                    }
                                    return [4 /*yield*/, storage.getRestaurantAnalyticsSummary(restaurantId, dateRange)];
                                case 3:
                                    summary = _b.sent();
                                    res.json(summary);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_37 = _b.sent();
                                    console.error("Error fetching analytics summary:", error_37);
                                    res.status(500).json({ message: "Failed to fetch analytics summary" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/restaurants/:restaurantId/analytics/timeseries", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, _a, startDate, endDate, _b, interval, isAuthorized, analyticsAccess, dateRange, timeseries, error_38;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.restaurantId;
                                    _a = req.query, startDate = _a.startDate, endDate = _a.endDate, _b = _a.interval, interval = _b === void 0 ? "day" : _b;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _c.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only access analytics for restaurants you own",
                                            })];
                                    }
                                    return [4 /*yield*/, validateAnalyticsAccess(req.user.id)];
                                case 2:
                                    analyticsAccess = _c.sent();
                                    if (!analyticsAccess.hasAccess) {
                                        return [2 /*return*/, res.status(402).json({
                                                message: analyticsAccess.error,
                                                subscriptionTier: analyticsAccess.subscriptionTier,
                                            })];
                                    }
                                    if (!startDate || !endDate) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "startDate and endDate are required" })];
                                    }
                                    dateRange = {
                                        start: new Date(startDate),
                                        end: new Date(endDate),
                                    };
                                    return [4 /*yield*/, storage.getRestaurantAnalyticsTimeseries(restaurantId, dateRange, interval)];
                                case 3:
                                    timeseries = _c.sent();
                                    res.json(timeseries);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_38 = _c.sent();
                                    console.error("Error fetching analytics timeseries:", error_38);
                                    res
                                        .status(500)
                                        .json({ message: "Failed to fetch analytics timeseries" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/restaurants/:restaurantId/analytics/customers", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, _a, startDate, endDate, isAuthorized, analyticsAccess, dateRange, insights, error_39;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.restaurantId;
                                    _a = req.query, startDate = _a.startDate, endDate = _a.endDate;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _b.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only access analytics for restaurants you own",
                                            })];
                                    }
                                    return [4 /*yield*/, validateAnalyticsAccess(req.user.id)];
                                case 2:
                                    analyticsAccess = _b.sent();
                                    if (!analyticsAccess.hasAccess) {
                                        return [2 /*return*/, res.status(402).json({
                                                message: analyticsAccess.error,
                                                subscriptionTier: analyticsAccess.subscriptionTier,
                                            })];
                                    }
                                    dateRange = void 0;
                                    if (startDate && endDate) {
                                        dateRange = {
                                            start: new Date(startDate),
                                            end: new Date(endDate),
                                        };
                                    }
                                    return [4 /*yield*/, storage.getRestaurantCustomerInsights(restaurantId, dateRange)];
                                case 3:
                                    insights = _b.sent();
                                    res.json(insights);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_39 = _b.sent();
                                    console.error("Error fetching customer insights:", error_39);
                                    res.status(500).json({ message: "Failed to fetch customer insights" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/restaurants/:restaurantId/analytics/compare", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, _a, currentStart, currentEnd, previousStart, previousEnd, isAuthorized, analyticsAccess, _b, currentPeriod, previousPeriod, comparison, error_40;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.restaurantId;
                                    _a = req.query, currentStart = _a.currentStart, currentEnd = _a.currentEnd, previousStart = _a.previousStart, previousEnd = _a.previousEnd;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _c.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only access analytics for restaurants you own",
                                            })];
                                    }
                                    return [4 /*yield*/, validateAnalyticsAccess(req.user.id)];
                                case 2:
                                    analyticsAccess = _c.sent();
                                    if (!analyticsAccess.hasAccess) {
                                        return [2 /*return*/, res.status(402).json({
                                                message: analyticsAccess.error,
                                                subscriptionTier: analyticsAccess.subscriptionTier,
                                            })];
                                    }
                                    if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
                                        return [2 /*return*/, res.status(400).json({
                                                message: "currentStart, currentEnd, previousStart, and previousEnd are required",
                                            })];
                                    }
                                    return [4 /*yield*/, Promise.all([
                                            storage.getRestaurantAnalyticsSummary(restaurantId, {
                                                start: new Date(currentStart),
                                                end: new Date(currentEnd),
                                            }),
                                            storage.getRestaurantAnalyticsSummary(restaurantId, {
                                                start: new Date(previousStart),
                                                end: new Date(previousEnd),
                                            }),
                                        ])];
                                case 3:
                                    _b = _c.sent(), currentPeriod = _b[0], previousPeriod = _b[1];
                                    comparison = {
                                        current: currentPeriod,
                                        previous: previousPeriod,
                                        changes: {
                                            viewsChange: previousPeriod.totalViews > 0
                                                ? ((currentPeriod.totalViews - previousPeriod.totalViews) /
                                                    previousPeriod.totalViews) *
                                                    100
                                                : 0,
                                            claimsChange: previousPeriod.totalClaims > 0
                                                ? ((currentPeriod.totalClaims - previousPeriod.totalClaims) /
                                                    previousPeriod.totalClaims) *
                                                    100
                                                : 0,
                                            revenueChange: previousPeriod.totalRevenue > 0
                                                ? ((currentPeriod.totalRevenue - previousPeriod.totalRevenue) /
                                                    previousPeriod.totalRevenue) *
                                                    100
                                                : 0,
                                            conversionRateChange: currentPeriod.conversionRate - previousPeriod.conversionRate,
                                        },
                                    };
                                    res.json(comparison);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_40 = _c.sent();
                                    console.error("Error fetching analytics comparison:", error_40);
                                    res
                                        .status(500)
                                        .json({ message: "Failed to fetch analytics comparison" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/restaurants/:restaurantId/analytics/export", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, _a, startDate, endDate, _b, format, isAuthorized, analyticsAccess, dateRange, exportData, csvHeader, csvRows, csv, error_41;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.restaurantId;
                                    _a = req.query, startDate = _a.startDate, endDate = _a.endDate, _b = _a.format, format = _b === void 0 ? "csv" : _b;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _c.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only access analytics for restaurants you own",
                                            })];
                                    }
                                    return [4 /*yield*/, validateAnalyticsAccess(req.user.id)];
                                case 2:
                                    analyticsAccess = _c.sent();
                                    if (!analyticsAccess.hasAccess) {
                                        return [2 /*return*/, res.status(402).json({
                                                message: analyticsAccess.error,
                                                subscriptionTier: analyticsAccess.subscriptionTier,
                                            })];
                                    }
                                    if (!startDate || !endDate) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "startDate and endDate are required" })];
                                    }
                                    dateRange = {
                                        start: new Date(startDate),
                                        end: new Date(endDate),
                                    };
                                    return [4 /*yield*/, storage.getRestaurantAnalyticsExport(restaurantId, dateRange)];
                                case 3:
                                    exportData = _c.sent();
                                    if (format === "csv") {
                                        csvHeader = "Deal Title,Date,Views,Claims,Revenue\n";
                                        csvRows = exportData
                                            .map(function (row) {
                                            // Secure CSV sanitization to prevent injection attacks
                                            var sanitizeCSV = function (value) {
                                                if (value === null || value === undefined)
                                                    return "";
                                                var str = String(value);
                                                // If cell starts with dangerous characters, prefix with apostrophe to prevent formula execution
                                                if (/^[=+@-]/.test(str)) {
                                                    return "\"'".concat(str.replace(/"/g, '""'), "\"");
                                                }
                                                // Always quote strings and escape internal quotes
                                                return "\"".concat(str.replace(/"/g, '""'), "\"");
                                            };
                                            return [
                                                sanitizeCSV(row.dealTitle),
                                                sanitizeCSV(row.date),
                                                sanitizeCSV(row.views),
                                                sanitizeCSV(row.claims),
                                                sanitizeCSV(row.revenue),
                                            ].join(",");
                                        })
                                            .join("\n");
                                        csv = csvHeader + csvRows;
                                        // Secure headers with proper MIME type and safe filename
                                        res.setHeader("Content-Type", "text/csv; charset=utf-8");
                                        res.setHeader("Content-Disposition", "attachment; filename=\"analytics-".concat(encodeURIComponent(restaurantId), "-").concat(encodeURIComponent(startDate), "-").concat(encodeURIComponent(endDate), ".csv\""));
                                        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                                        res.send(csv);
                                    }
                                    else {
                                        res.json(exportData);
                                    }
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_41 = _c.sent();
                                    console.error("Error exporting analytics:", error_41);
                                    res.status(500).json({ message: "Failed to export analytics" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Restaurant owner signup endpoint (creates user account + restaurant in one flow)
                    app.post("/api/restaurants/signup", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, userData, restaurantData, subscriptionPlan, user_1, userValidation, validatedUserData, existingUser, passwordHash, restaurantValidation, validatedRestaurantData, restaurant, enabled, vac, hasPending, e_1, referralId, attachReferralToSignup, err_2, resolveAffiliateUserId, affiliateUserId, existingUser, err_3, error_42;
                        var _b, _c, _d;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _e.trys.push([0, 34, , 35]);
                                    _a = req.body, userData = _a.userData, restaurantData = _a.restaurantData, subscriptionPlan = _a.subscriptionPlan;
                                    if (!(req.isAuthenticated && req.isAuthenticated() && req.user)) return [3 /*break*/, 4];
                                    // User is already authenticated, use existing user
                                    user_1 = req.user;
                                    console.log("Using authenticated user for restaurant signup:", {
                                        userId: user_1.id,
                                        userType: user_1.userType,
                                    });
                                    if (!(user_1.userType === "customer")) return [3 /*break*/, 3];
                                    console.log("Converting customer account to restaurant owner:", user_1.id);
                                    return [4 /*yield*/, storage.updateUserType(user_1.id, "restaurant_owner")];
                                case 1:
                                    _e.sent();
                                    return [4 /*yield*/, storage.getUserById(user_1.id)];
                                case 2:
                                    // Update the user object to reflect the change
                                    user_1 = (_e.sent()) || user_1;
                                    _e.label = 3;
                                case 3: return [3 /*break*/, 9];
                                case 4:
                                    userValidation = z.object({
                                        email: z.string().email(),
                                        firstName: z.string().min(1),
                                        lastName: z.string().min(1),
                                        phone: z.string().min(10),
                                        password: z
                                            .string()
                                            .min(1, PASSWORD_REQUIREMENTS)
                                            .refine(isPasswordStrong, PASSWORD_REQUIREMENTS),
                                    });
                                    validatedUserData = userValidation.parse(userData);
                                    return [4 /*yield*/, storage.getUserByEmail(validatedUserData.email)];
                                case 5:
                                    existingUser = _e.sent();
                                    if (existingUser) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "User with this email already exists" })];
                                    }
                                    return [4 /*yield*/, bcrypt.hash(validatedUserData.password, 10)];
                                case 6:
                                    passwordHash = _e.sent();
                                    return [4 /*yield*/, storage.upsertUserByAuth("email", __assign(__assign({}, validatedUserData), { passwordHash: passwordHash }), "restaurant_owner")];
                                case 7:
                                    // Create restaurant owner user account using email auth
                                    user_1 = _e.sent();
                                    // Log the new user in by setting up session
                                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                                            req.login(user_1, function (err) {
                                                if (err)
                                                    reject(err);
                                                else
                                                    resolve(user_1);
                                            });
                                        })];
                                case 8:
                                    // Log the new user in by setting up session
                                    _e.sent();
                                    _e.label = 9;
                                case 9:
                                    restaurantValidation = insertRestaurantSchema.omit({
                                        ownerId: true,
                                    });
                                    validatedRestaurantData = restaurantValidation.parse(restaurantData);
                                    return [4 /*yield*/, storage.createRestaurant(__assign(__assign({}, validatedRestaurantData), { ownerId: user_1.id }))];
                                case 10:
                                    restaurant = _e.sent();
                                    _e.label = 11;
                                case 11:
                                    _e.trys.push([11, 19, , 20]);
                                    enabled = String(process.env.VAC_AUTO_VERIFY_ENABLED || "true").toLowerCase() !== "false";
                                    if (!enabled) return [3 /*break*/, 18];
                                    return [4 /*yield*/, vacEvaluateRestaurantSignup({
                                            user: user_1,
                                            restaurant: restaurant,
                                            req: req,
                                        })];
                                case 12:
                                    vac = _e.sent();
                                    console.log("🔍 VAC-lite evaluation:", {
                                        restaurantId: restaurant.id,
                                        restaurantName: restaurant.name,
                                        score: vac.score,
                                        threshold: vac.threshold,
                                        shouldAutoVerify: vac.shouldAutoVerify,
                                        signals: vac.signals,
                                    });
                                    if (!vac.shouldAutoVerify) return [3 /*break*/, 14];
                                    console.log("✅ Auto-verifying restaurant:", restaurant.id);
                                    return [4 /*yield*/, storage.setRestaurantVerified(restaurant.id, true)];
                                case 13:
                                    _e.sent();
                                    restaurant.isVerified = true;
                                    return [3 /*break*/, 18];
                                case 14:
                                    console.log("⚠️  Creating manual verification request for:", restaurant.id);
                                    return [4 /*yield*/, storage.hasPendingVerificationRequest(restaurant.id)];
                                case 15:
                                    hasPending = _e.sent();
                                    if (!!hasPending) return [3 /*break*/, 17];
                                    return [4 /*yield*/, storage.createVerificationRequest({
                                            restaurantId: restaurant.id,
                                            documents: [],
                                        })];
                                case 16:
                                    _e.sent();
                                    return [3 /*break*/, 18];
                                case 17:
                                    console.log("ℹ️  Pending verification request already exists");
                                    _e.label = 18;
                                case 18: return [3 /*break*/, 20];
                                case 19:
                                    e_1 = _e.sent();
                                    console.warn("VAC-lite failed", e_1);
                                    return [3 /*break*/, 20];
                                case 20:
                                    referralId = ((_b = req.body) === null || _b === void 0 ? void 0 : _b.referralId) ||
                                        ((_c = req.query) === null || _c === void 0 ? void 0 : _c.referralId) ||
                                        ((_d = req.cookies) === null || _d === void 0 ? void 0 : _d.referralId);
                                    if (!referralId) return [3 /*break*/, 25];
                                    _e.label = 21;
                                case 21:
                                    _e.trys.push([21, 24, , 25]);
                                    return [4 /*yield*/, import("./referralService.js")];
                                case 22:
                                    attachReferralToSignup = (_e.sent()).attachReferralToSignup;
                                    return [4 /*yield*/, attachReferralToSignup(referralId, restaurant.id)];
                                case 23:
                                    _e.sent();
                                    console.log("[Phase 2] Referral attached:", {
                                        referralId: referralId,
                                        restaurantId: restaurant.id,
                                    });
                                    return [3 /*break*/, 25];
                                case 24:
                                    err_2 = _e.sent();
                                    console.error("[Phase 2] Error attaching referral:", err_2);
                                    return [3 /*break*/, 25];
                                case 25:
                                    if (!(referralId && (user_1 === null || user_1 === void 0 ? void 0 : user_1.id))) return [3 /*break*/, 33];
                                    _e.label = 26;
                                case 26:
                                    _e.trys.push([26, 32, , 33]);
                                    return [4 /*yield*/, import("./affiliateTagService.js")];
                                case 27:
                                    resolveAffiliateUserId = (_e.sent()).resolveAffiliateUserId;
                                    return [4 /*yield*/, resolveAffiliateUserId(referralId)];
                                case 28:
                                    affiliateUserId = _e.sent();
                                    if (!(affiliateUserId && affiliateUserId !== user_1.id)) return [3 /*break*/, 31];
                                    return [4 /*yield*/, db
                                            .select({ affiliateCloserUserId: users.affiliateCloserUserId })
                                            .from(users)
                                            .where(eq(users.id, user_1.id))
                                            .limit(1)];
                                case 29:
                                    existingUser = (_e.sent())[0];
                                    if (!!(existingUser === null || existingUser === void 0 ? void 0 : existingUser.affiliateCloserUserId)) return [3 /*break*/, 31];
                                    return [4 /*yield*/, db
                                            .update(users)
                                            .set({
                                            affiliateCloserUserId: affiliateUserId,
                                            updatedAt: new Date(),
                                        })
                                            .where(eq(users.id, user_1.id))];
                                case 30:
                                    _e.sent();
                                    _e.label = 31;
                                case 31: return [3 /*break*/, 33];
                                case 32:
                                    err_3 = _e.sent();
                                    console.error("[Phase 2] Error attaching user referral:", err_3);
                                    return [3 /*break*/, 33];
                                case 33:
                                    res.json({
                                        user: user_1,
                                        restaurant: restaurant,
                                        message: "Restaurant owner account created successfully",
                                        subscriptionPlan: subscriptionPlan,
                                    });
                                    return [3 /*break*/, 35];
                                case 34:
                                    error_42 = _e.sent();
                                    console.error("Error in restaurant signup:", error_42);
                                    res.status(400).json({
                                        message: error_42.message || "Failed to create restaurant account",
                                    });
                                    return [3 /*break*/, 35];
                                case 35: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/truck-claims/search", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var query, externalMatch, searchValue, matches, error_43;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    query = String(((_a = req.query) === null || _a === void 0 ? void 0 : _a.q) || "").trim();
                                    if (!query) {
                                        return [2 /*return*/, res.json([])];
                                    }
                                    return [4 /*yield*/, db
                                            .select({
                                            id: truckImportListings.id,
                                            name: truckImportListings.name,
                                            address: truckImportListings.address,
                                            city: truckImportListings.city,
                                            state: truckImportListings.state,
                                            externalId: truckImportListings.externalId,
                                            confidenceScore: truckImportListings.confidenceScore,
                                        })
                                            .from(truckImportListings)
                                            .where(and(eq(truckImportListings.externalId, query), eq(truckImportListings.status, "unclaimed")))
                                            .limit(10)];
                                case 1:
                                    externalMatch = _b.sent();
                                    if (externalMatch.length > 0) {
                                        return [2 /*return*/, res.json(externalMatch)];
                                    }
                                    searchValue = "%".concat(query.toLowerCase(), "%");
                                    return [4 /*yield*/, db
                                            .select({
                                            id: truckImportListings.id,
                                            name: truckImportListings.name,
                                            address: truckImportListings.address,
                                            city: truckImportListings.city,
                                            state: truckImportListings.state,
                                            externalId: truckImportListings.externalId,
                                            confidenceScore: truckImportListings.confidenceScore,
                                        })
                                            .from(truckImportListings)
                                            .where(and(eq(truckImportListings.status, "unclaimed"), sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["lower(", ") like ", ""], ["lower(", ") like ", ""])), truckImportListings.name, searchValue)))
                                            .orderBy(desc(truckImportListings.confidenceScore))
                                            .limit(10)];
                                case 2:
                                    matches = _b.sent();
                                    res.json(matches);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_43 = _b.sent();
                                    console.error("Error searching truck listings:", error_43);
                                    res.status(500).json({ message: "Failed to search truck listings" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/truck-claims", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var payloadSchema, _a, listingId, restaurantData, listing, mergedRestaurant, restaurant, claimRequest, notificationEmail, error_44;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 6, , 7]);
                                    payloadSchema = z.object({
                                        listingId: z.string().min(1),
                                        restaurantData: insertRestaurantSchema
                                            .omit({ ownerId: true })
                                            .partial(),
                                    });
                                    _a = payloadSchema.parse(req.body), listingId = _a.listingId, restaurantData = _a.restaurantData;
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(truckImportListings)
                                            .where(eq(truckImportListings.id, listingId))
                                            .limit(1)];
                                case 1:
                                    listing = (_b.sent())[0];
                                    if (!listing || listing.status !== "unclaimed") {
                                        return [2 /*return*/, res
                                                .status(404)
                                                .json({ message: "Truck listing is not available to claim" })];
                                    }
                                    mergedRestaurant = {
                                        name: restaurantData.name || listing.name,
                                        address: restaurantData.address || listing.address,
                                        city: restaurantData.city || listing.city,
                                        state: restaurantData.state || listing.state,
                                        phone: restaurantData.phone || listing.phone,
                                        cuisineType: restaurantData.cuisineType || listing.cuisineType,
                                        websiteUrl: restaurantData.websiteUrl || listing.websiteUrl,
                                        instagramUrl: restaurantData.instagramUrl || listing.instagramUrl,
                                        facebookPageUrl: restaurantData.facebookPageUrl || listing.facebookPageUrl,
                                        latitude: restaurantData.latitude || listing.latitude,
                                        longitude: restaurantData.longitude || listing.longitude,
                                        description: restaurantData.description || null,
                                        amenities: restaurantData.amenities || null,
                                    };
                                    if (!mergedRestaurant.name || !mergedRestaurant.address) {
                                        return [2 /*return*/, res.status(400).json({
                                                message: "Name and address are required to claim this listing",
                                            })];
                                    }
                                    return [4 /*yield*/, storage.createRestaurant({
                                            ownerId: req.user.id,
                                            name: mergedRestaurant.name,
                                            address: mergedRestaurant.address,
                                            phone: mergedRestaurant.phone || null,
                                            businessType: "food_truck",
                                            cuisineType: mergedRestaurant.cuisineType || null,
                                            city: mergedRestaurant.city || null,
                                            state: mergedRestaurant.state || null,
                                            websiteUrl: mergedRestaurant.websiteUrl || null,
                                            instagramUrl: mergedRestaurant.instagramUrl || null,
                                            facebookPageUrl: mergedRestaurant.facebookPageUrl || null,
                                            latitude: mergedRestaurant.latitude || null,
                                            longitude: mergedRestaurant.longitude || null,
                                            description: mergedRestaurant.description || null,
                                            amenities: mergedRestaurant.amenities || null,
                                            isFoodTruck: true,
                                            isActive: false,
                                            isVerified: false,
                                            claimedFromImportId: listing.id,
                                        })];
                                case 2:
                                    restaurant = _b.sent();
                                    return [4 /*yield*/, db
                                            .insert(truckClaimRequests)
                                            .values({
                                            listingId: listing.id,
                                            restaurantId: restaurant.id,
                                            userId: req.user.id,
                                        })
                                            .returning()];
                                case 3:
                                    claimRequest = (_b.sent())[0];
                                    return [4 /*yield*/, db
                                            .update(truckImportListings)
                                            .set({
                                            status: "claim_requested",
                                            updatedAt: new Date(),
                                        })
                                            .where(eq(truckImportListings.id, listing.id))];
                                case 4:
                                    _b.sent();
                                    notificationEmail = "notifications@mealscout.us";
                                    return [4 /*yield*/, emailService.sendBasicEmail(notificationEmail, "Food Truck Claim Submitted", "\n          <p>A food truck claim was submitted.</p>\n          <p><strong>Truck:</strong> ".concat(restaurant.name, "</p>\n          <p><strong>Listing ID:</strong> ").concat(listing.id, "</p>\n          <p><strong>User ID:</strong> ").concat(req.user.id, "</p>\n          <p><strong>Email:</strong> ").concat(req.user.email || "Unknown", "</p>\n        "))];
                                case 5:
                                    _b.sent();
                                    res.json({
                                        restaurant: restaurant,
                                        claimRequestId: claimRequest === null || claimRequest === void 0 ? void 0 : claimRequest.id,
                                    });
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_44 = _b.sent();
                                    console.error("Error creating truck claim:", error_44);
                                    res.status(400).json({
                                        message: error_44.message || "Failed to claim truck listing",
                                    });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Restaurant routes (require restaurant owner authentication)
                    app.post("/api/restaurants", isRestaurantOwner, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, restaurantData, restaurant, enabled, vac, hasPending, e_2, error_45;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 12, , 13]);
                                    userId = req.user.id;
                                    restaurantData = insertRestaurantSchema.parse(__assign(__assign({}, req.body), { ownerId: userId }));
                                    return [4 /*yield*/, storage.createRestaurant(restaurantData)];
                                case 1:
                                    restaurant = _a.sent();
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 10, , 11]);
                                    enabled = String(process.env.VAC_AUTO_VERIFY_ENABLED || "true").toLowerCase() !== "false";
                                    if (!enabled) return [3 /*break*/, 9];
                                    return [4 /*yield*/, vacEvaluateRestaurantSignup({
                                            user: req.user,
                                            restaurant: restaurant,
                                            req: req,
                                        })];
                                case 3:
                                    vac = _a.sent();
                                    console.log("🔍 VAC-lite evaluation:", {
                                        restaurantId: restaurant.id,
                                        restaurantName: restaurant.name,
                                        score: vac.score,
                                        threshold: vac.threshold,
                                        shouldAutoVerify: vac.shouldAutoVerify,
                                        signals: vac.signals,
                                    });
                                    if (!vac.shouldAutoVerify) return [3 /*break*/, 5];
                                    console.log("✅ Auto-verifying restaurant:", restaurant.id);
                                    return [4 /*yield*/, storage.setRestaurantVerified(restaurant.id, true)];
                                case 4:
                                    _a.sent();
                                    restaurant.isVerified = true;
                                    return [3 /*break*/, 9];
                                case 5:
                                    console.log("⚠️  Creating manual verification request for:", restaurant.id);
                                    return [4 /*yield*/, storage.hasPendingVerificationRequest(restaurant.id)];
                                case 6:
                                    hasPending = _a.sent();
                                    if (!!hasPending) return [3 /*break*/, 8];
                                    return [4 /*yield*/, storage.createVerificationRequest({
                                            restaurantId: restaurant.id,
                                            documents: [],
                                        })];
                                case 7:
                                    _a.sent();
                                    return [3 /*break*/, 9];
                                case 8:
                                    console.log("ℹ️  Pending verification request already exists");
                                    _a.label = 9;
                                case 9: return [3 /*break*/, 11];
                                case 10:
                                    e_2 = _a.sent();
                                    console.warn("VAC-lite failed", e_2);
                                    return [3 /*break*/, 11];
                                case 11:
                                    res.json(restaurant);
                                    return [3 /*break*/, 13];
                                case 12:
                                    error_45 = _a.sent();
                                    console.error("Error creating restaurant:", error_45);
                                    res.status(400).json({ message: error_45.message });
                                    return [3 /*break*/, 13];
                                case 13: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/restaurants/my", isRestaurantOwner, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, restaurants_5, error_46;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getRestaurantsByOwner(userId)];
                                case 1:
                                    restaurants_5 = _a.sent();
                                    res.json(restaurants_5);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_46 = _a.sent();
                                    console.error("Error fetching restaurants:", error_46);
                                    res.status(500).json({ message: "Failed to fetch restaurants" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Restaurant owner authentication check endpoint
                    app.get("/api/auth/restaurant/user", isRestaurantOwner, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user;
                        return __generator(this, function (_a) {
                            try {
                                user = req.user;
                                res.json(sanitizeUser(user));
                            }
                            catch (error) {
                                console.error("Error fetching restaurant owner:", error);
                                res.status(500).json({ message: "Failed to fetch user" });
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    // Restaurant search endpoint (returns restaurants matching search query)
                    // Must come before /:id route to avoid matching "search" as an ID
                    app.get("/api/restaurants/search", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, query, lat, lng, _b, radius, searchTerm_1, restaurants_6, filteredRestaurants, userLat_1, userLng_1, radiusKm_1, error_47;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 3]);
                                    _a = req.query, query = _a.q, lat = _a.lat, lng = _a.lng, _b = _a.radius, radius = _b === void 0 ? 10 : _b;
                                    console.log("🔍 Restaurant search request:", { query: query, lat: lat, lng: lng, radius: radius });
                                    if (!query || typeof query !== "string" || query.length < 2) {
                                        console.log("⚠️  Empty or short query, returning empty array");
                                        return [2 /*return*/, res.json([])];
                                    }
                                    searchTerm_1 = query.toLowerCase();
                                    return [4 /*yield*/, storage.getAllRestaurants()];
                                case 1:
                                    restaurants_6 = _c.sent();
                                    filteredRestaurants = restaurants_6.filter(function (restaurant) {
                                        var _a, _b;
                                        return restaurant.isActive &&
                                            (restaurant.name.toLowerCase().includes(searchTerm_1) ||
                                                ((_a = restaurant.cuisineType) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchTerm_1)) ||
                                                ((_b = restaurant.address) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchTerm_1)));
                                    });
                                    // Filter by distance if coordinates provided
                                    if (lat && lng && typeof lat === "string" && typeof lng === "string") {
                                        userLat_1 = parseFloat(lat);
                                        userLng_1 = parseFloat(lng);
                                        radiusKm_1 = parseFloat(radius);
                                        filteredRestaurants = filteredRestaurants.filter(function (restaurant) {
                                            if (!restaurant.latitude || !restaurant.longitude)
                                                return false;
                                            // Calculate distance using Haversine formula
                                            var R = 6371; // Earth's radius in km
                                            var dLat = ((restaurant.latitude - userLat_1) * Math.PI) / 180;
                                            var dLng = ((restaurant.longitude - userLng_1) * Math.PI) / 180;
                                            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                                Math.cos((userLat_1 * Math.PI) / 180) *
                                                    Math.cos((restaurant.latitude * Math.PI) / 180) *
                                                    Math.sin(dLng / 2) *
                                                    Math.sin(dLng / 2);
                                            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                            var distance = R * c;
                                            return distance <= radiusKm_1;
                                        });
                                    }
                                    res.json(filteredRestaurants);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_47 = _c.sent();
                                    console.error("Error searching restaurants:", error_47);
                                    res.status(500).json({ message: "Failed to search restaurants" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/restaurants/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurant, error_48;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage.getRestaurant(req.params.id)];
                                case 1:
                                    restaurant = _a.sent();
                                    if (!restaurant) {
                                        return [2 /*return*/, res.status(404).json({ message: "Restaurant not found" })];
                                    }
                                    res.json(restaurant);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_48 = _a.sent();
                                    console.error("Error fetching restaurant:", error_48);
                                    res.status(500).json({ message: "Failed to fetch restaurant" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/restaurants/nearby/:lat/:lng", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var lat, lng, radius, restaurants_7, error_49;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    lat = parseFloat(req.params.lat);
                                    lng = parseFloat(req.params.lng);
                                    radius = parseFloat(req.query.radius) || 5;
                                    return [4 /*yield*/, storage.getNearbyRestaurants(lat, lng, radius)];
                                case 1:
                                    restaurants_7 = _a.sent();
                                    res.json(restaurants_7);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_49 = _a.sent();
                                    console.error("Error fetching nearby restaurants:", error_49);
                                    res.status(500).json({ message: "Failed to fetch nearby restaurants" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Restaurant favorites endpoints
                    app.post("/api/restaurants/:restaurantId/favorite", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, userId, MAX_FAVORITES, restaurant, favoriteCount, favoriteData, favorite, error_50;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.restaurantId;
                                    userId = req.user.id;
                                    MAX_FAVORITES = 3;
                                    return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                                case 1:
                                    restaurant = _a.sent();
                                    if (!restaurant) {
                                        return [2 /*return*/, res.status(404).json({ message: "Restaurant not found" })];
                                    }
                                    return [4 /*yield*/, storage.getUserRestaurantFavoritesCount(userId)];
                                case 2:
                                    favoriteCount = _a.sent();
                                    if (favoriteCount >= MAX_FAVORITES) {
                                        return [2 /*return*/, res.status(400).json({
                                                message: "You can favorite up to ".concat(MAX_FAVORITES, " restaurants."),
                                            })];
                                    }
                                    favoriteData = insertRestaurantFavoriteSchema.parse({
                                        restaurantId: restaurantId,
                                        userId: userId,
                                    });
                                    return [4 /*yield*/, storage.createRestaurantFavorite(favoriteData)];
                                case 3:
                                    favorite = _a.sent();
                                    res.json(favorite);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_50 = _a.sent();
                                    console.error("Error adding restaurant favorite:", error_50);
                                    if (error_50.code === "23505") {
                                        // Unique constraint violation
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "Restaurant already favorited" })];
                                    }
                                    res
                                        .status(400)
                                        .json({ message: error_50.message || "Failed to add favorite" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/restaurants/:restaurantId/favorite", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, userId, error_51;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    restaurantId = req.params.restaurantId;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.removeRestaurantFavorite(restaurantId, userId)];
                                case 1:
                                    _a.sent();
                                    res.json({ success: true });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_51 = _a.sent();
                                    console.error("Error removing restaurant favorite:", error_51);
                                    res.status(500).json({ message: "Failed to remove favorite" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/favorites/restaurants", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, favorites, error_52;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getUserRestaurantFavorites(userId)];
                                case 1:
                                    favorites = _a.sent();
                                    res.json(favorites);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_52 = _a.sent();
                                    console.error("Error fetching user restaurant favorites:", error_52);
                                    res.status(500).json({ message: "Failed to fetch favorites" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Restaurant follow endpoints
                    app.post("/api/restaurants/:restaurantId/follow", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, userId, restaurant, followData, follow, error_53;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    restaurantId = req.params.restaurantId;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                                case 1:
                                    restaurant = _a.sent();
                                    if (!restaurant) {
                                        return [2 /*return*/, res.status(404).json({ message: "Restaurant not found" })];
                                    }
                                    followData = insertRestaurantFollowSchema.parse({
                                        restaurantId: restaurantId,
                                        userId: userId,
                                    });
                                    return [4 /*yield*/, storage.createRestaurantFollow(followData)];
                                case 2:
                                    follow = _a.sent();
                                    res.json(follow);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_53 = _a.sent();
                                    console.error("Error adding restaurant follow:", error_53);
                                    if (error_53.code === "23505") {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "Restaurant already followed" })];
                                    }
                                    res
                                        .status(400)
                                        .json({ message: error_53.message || "Failed to follow restaurant" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.delete("/api/restaurants/:restaurantId/follow", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, userId, error_54;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    restaurantId = req.params.restaurantId;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.removeRestaurantFollow(restaurantId, userId)];
                                case 1:
                                    _a.sent();
                                    res.json({ success: true });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_54 = _a.sent();
                                    console.error("Error removing restaurant follow:", error_54);
                                    res.status(500).json({ message: "Failed to unfollow restaurant" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/following/restaurants", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, follows, error_55;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getUserRestaurantFollows(userId)];
                                case 1:
                                    follows = _a.sent();
                                    res.json(follows);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_55 = _a.sent();
                                    console.error("Error fetching user restaurant follows:", error_55);
                                    res.status(500).json({ message: "Failed to fetch follows" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Restaurant recommend endpoints (one per restaurant)
                    app.post("/api/restaurants/:restaurantId/recommend", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, userId, restaurant, recommendationData, recommendation, error_56;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    restaurantId = req.params.restaurantId;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                                case 1:
                                    restaurant = _a.sent();
                                    if (!restaurant) {
                                        return [2 /*return*/, res.status(404).json({ message: "Restaurant not found" })];
                                    }
                                    recommendationData = insertRestaurantUserRecommendationSchema.parse({
                                        restaurantId: restaurantId,
                                        userId: userId,
                                    });
                                    return [4 /*yield*/, storage.createRestaurantUserRecommendation(recommendationData)];
                                case 2:
                                    recommendation = _a.sent();
                                    res.json(recommendation);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_56 = _a.sent();
                                    console.error("Error adding restaurant recommendation:", error_56);
                                    if (error_56.code === "23505") {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "Restaurant already recommended" })];
                                    }
                                    res.status(400).json({
                                        message: error_56.message || "Failed to recommend restaurant",
                                    });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/recommendations/restaurants", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, recommendations, error_57;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getUserRestaurantRecommendations(userId)];
                                case 1:
                                    recommendations = _a.sent();
                                    res.json(recommendations);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_57 = _a.sent();
                                    console.error("Error fetching user restaurant recommendations:", error_57);
                                    res.status(500).json({ message: "Failed to fetch recommendations" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Analytics endpoint for restaurant owners to see favorites (paid feature)
                    app.get("/api/restaurants/:restaurantId/analytics/favorites", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, userId, isAuthorized, analyticsAccess, _a, startDate, endDate, dateRange, favoritesAnalytics, error_58;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.restaurantId;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, userId)];
                                case 1:
                                    isAuthorized = _b.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only access analytics for restaurants you own",
                                            })];
                                    }
                                    return [4 /*yield*/, validateAnalyticsAccess(userId)];
                                case 2:
                                    analyticsAccess = _b.sent();
                                    if (!analyticsAccess.hasAccess) {
                                        return [2 /*return*/, res.status(402).json({
                                                message: analyticsAccess.error,
                                                subscriptionTier: analyticsAccess.subscriptionTier,
                                            })];
                                    }
                                    _a = req.query, startDate = _a.startDate, endDate = _a.endDate;
                                    dateRange = void 0;
                                    if (startDate && endDate) {
                                        dateRange = {
                                            start: new Date(startDate),
                                            end: new Date(endDate),
                                        };
                                    }
                                    return [4 /*yield*/, storage.getRestaurantFavoritesAnalytics(restaurantId, dateRange)];
                                case 3:
                                    favoritesAnalytics = _b.sent();
                                    res.json(favoritesAnalytics);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_58 = _b.sent();
                                    console.error("Error fetching favorites analytics:", error_58);
                                    res
                                        .status(500)
                                        .json({ message: "Failed to fetch favorites analytics" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Analytics endpoint for restaurant owners to see recommendations (paid feature)
                    app.get("/api/restaurants/:restaurantId/analytics/recommendations", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, userId, isAuthorized, analyticsAccess, _a, startDate, endDate, dateRange, recommendationsAnalytics, error_59;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.restaurantId;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, userId)];
                                case 1:
                                    isAuthorized = _b.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only access analytics for restaurants you own",
                                            })];
                                    }
                                    return [4 /*yield*/, validateAnalyticsAccess(userId)];
                                case 2:
                                    analyticsAccess = _b.sent();
                                    if (!analyticsAccess.hasAccess) {
                                        return [2 /*return*/, res.status(402).json({
                                                message: analyticsAccess.error,
                                                subscriptionTier: analyticsAccess.subscriptionTier,
                                            })];
                                    }
                                    _a = req.query, startDate = _a.startDate, endDate = _a.endDate;
                                    dateRange = void 0;
                                    if (startDate && endDate) {
                                        dateRange = {
                                            start: new Date(startDate),
                                            end: new Date(endDate),
                                        };
                                    }
                                    return [4 /*yield*/, storage.getRestaurantRecommendationsAnalytics(restaurantId, dateRange)];
                                case 3:
                                    recommendationsAnalytics = _b.sent();
                                    res.json(recommendationsAnalytics);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_59 = _b.sent();
                                    console.error("Error fetching recommendations analytics:", error_59);
                                    res
                                        .status(500)
                                        .json({ message: "Failed to fetch recommendations analytics" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Track recommendation click-through (public endpoint for tracking)
                    app.post("/api/restaurants/:restaurantId/recommendation/click", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, recommendationId, error_60;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    restaurantId = req.params.restaurantId;
                                    recommendationId = req.body.recommendationId;
                                    if (!recommendationId) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage.markRecommendationClicked(recommendationId)];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2:
                                    res.json({ success: true });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_60 = _a.sent();
                                    console.error("Error tracking recommendation click:", error_60);
                                    res
                                        .status(500)
                                        .json({ message: "Failed to track recommendation click" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Verification routes for restaurant owners
                    app.post("/api/restaurants/:id/verification/request", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, userId, restaurant, rateLimit, hasPendingRequest, verificationData, documentValidation, verificationRequest, error_61;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    restaurantId = req.params.id;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                                case 1:
                                    restaurant = _a.sent();
                                    if (!restaurant || restaurant.ownerId !== userId) {
                                        return [2 /*return*/, res.status(403).json({ message: "Unauthorized" })];
                                    }
                                    rateLimit = checkRateLimit(restaurantId);
                                    if (!rateLimit.allowed) {
                                        return [2 /*return*/, res.status(429).json({
                                                message: "Rate limit exceeded. Only one verification request per restaurant per hour is allowed.",
                                                nextAllowedTime: rateLimit.nextAllowedTime,
                                            })];
                                    }
                                    return [4 /*yield*/, storage.hasPendingVerificationRequest(restaurantId)];
                                case 2:
                                    hasPendingRequest = _a.sent();
                                    if (hasPendingRequest) {
                                        return [2 /*return*/, res.status(409).json({
                                                message: "A verification request is already pending for this restaurant. Please wait for admin review.",
                                            })];
                                    }
                                    verificationData = insertVerificationRequestSchema.parse(__assign(__assign({}, req.body), { restaurantId: restaurantId }));
                                    documentValidation = validateDocuments(verificationData.documents);
                                    if (!documentValidation.valid) {
                                        return [2 /*return*/, res.status(400).json({
                                                message: "Document validation failed",
                                                errors: documentValidation.errors,
                                            })];
                                    }
                                    return [4 /*yield*/, storage.createVerificationRequest(verificationData)];
                                case 3:
                                    verificationRequest = _a.sent();
                                    res.json(verificationRequest);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_61 = _a.sent();
                                    console.error("Error creating verification request:", error_61);
                                    res.status(400).json({
                                        message: error_61.message || "Failed to create verification request",
                                    });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/restaurants/my/verifications", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, verifications, error_62;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getVerificationRequestsByOwner(userId)];
                                case 1:
                                    verifications = _a.sent();
                                    res.json(verifications);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_62 = _a.sent();
                                    console.error("Error fetching verification requests:", error_62);
                                    res
                                        .status(500)
                                        .json({ message: "Failed to fetch verification requests" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Deal routes
                    app.post("/api/deals", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, raw, normalized, dealData, restaurant, subscriptionValidation, deal, error_63;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 5, , 6]);
                                    console.log("🟢 POST /api/deals - incoming request", {
                                        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                                        ip: req.ip,
                                        ua: req.headers["user-agent"],
                                    });
                                    return [4 /*yield*/, logAudit(req.user.id, "deal_create", "deal", undefined, req.ip, req.headers["user-agent"], req.body)];
                                case 1:
                                    _b.sent();
                                    userId = req.user.id;
                                    raw = req.body || {};
                                    normalized = __assign(__assign({}, raw), { 
                                        // discountValue should remain as string for decimal type
                                        discountValue: typeof raw.discountValue === "number"
                                            ? raw.discountValue.toString()
                                            : raw.discountValue, minOrderAmount: raw.minOrderAmount === "" || raw.minOrderAmount == null
                                            ? null
                                            : typeof raw.minOrderAmount === "number"
                                                ? raw.minOrderAmount.toString()
                                                : raw.minOrderAmount, totalUsesLimit: raw.totalUsesLimit === "" || raw.totalUsesLimit == null
                                            ? null
                                            : typeof raw.totalUsesLimit === "string"
                                                ? parseInt(raw.totalUsesLimit)
                                                : raw.totalUsesLimit, perCustomerLimit: raw.perCustomerLimit === "" || raw.perCustomerLimit == null
                                            ? 1
                                            : typeof raw.perCustomerLimit === "string"
                                                ? parseInt(raw.perCustomerLimit)
                                                : raw.perCustomerLimit, 
                                        // Convert date strings to Date objects
                                        startDate: typeof raw.startDate === "string"
                                            ? new Date(raw.startDate)
                                            : raw.startDate, endDate: raw.isOngoing || raw.endDate === "" || raw.endDate == null
                                            ? null
                                            : typeof raw.endDate === "string"
                                                ? new Date(raw.endDate)
                                                : raw.endDate, 
                                        // Times nullable if business hours
                                        startTime: raw.availableDuringBusinessHours ? null : raw.startTime, endTime: raw.availableDuringBusinessHours ? null : raw.endTime });
                                    console.log("🧭 Normalized deal payload", {
                                        restaurantId: normalized.restaurantId,
                                        title: normalized.title,
                                        dealType: normalized.dealType,
                                        discountValue: normalized.discountValue,
                                        startDate: normalized.startDate,
                                        endDate: normalized.endDate,
                                    });
                                    dealData = insertDealSchema.parse(normalized);
                                    return [4 /*yield*/, storage.getRestaurant(dealData.restaurantId)];
                                case 2:
                                    restaurant = _b.sent();
                                    if (!restaurant || restaurant.ownerId !== userId) {
                                        console.warn("🚫 Deal creation rejected - unauthorized restaurant ownership", {
                                            userId: userId,
                                            restaurantId: dealData.restaurantId,
                                            ownerId: restaurant === null || restaurant === void 0 ? void 0 : restaurant.ownerId,
                                        });
                                        return [2 /*return*/, res.status(403).json({ message: "Unauthorized" })];
                                    }
                                    return [4 /*yield*/, validateSubscriptionLimits(userId)];
                                case 3:
                                    subscriptionValidation = _b.sent();
                                    console.log("📊 Subscription validation", subscriptionValidation);
                                    if (!subscriptionValidation.isValid) {
                                        return [2 /*return*/, res.status(402).json({
                                                message: subscriptionValidation.error,
                                                currentCount: subscriptionValidation.currentCount,
                                                maxDeals: subscriptionValidation.maxDeals,
                                            })];
                                    }
                                    return [4 /*yield*/, storage.createDeal(dealData)];
                                case 4:
                                    deal = _b.sent();
                                    console.log("✅ Deal created", {
                                        id: deal.id,
                                        restaurantId: deal.restaurantId,
                                        title: deal.title,
                                    });
                                    res.json(deal);
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_63 = _b.sent();
                                    console.error("❌ Error creating deal:", (error_63 === null || error_63 === void 0 ? void 0 : error_63.message) || error_63);
                                    if (error_63 === null || error_63 === void 0 ? void 0 : error_63.stack) {
                                        console.error(error_63.stack);
                                    }
                                    res
                                        .status(400)
                                        .json({ message: (error_63 === null || error_63 === void 0 ? void 0 : error_63.message) || "Failed to create deal" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/deals/active", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var deals_3, error_64;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage.getActiveDeals()];
                                case 1:
                                    deals_3 = _a.sent();
                                    res.json(deals_3);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_64 = _a.sent();
                                    console.error("Error fetching active deals:", error_64);
                                    res.status(500).json({ message: "Failed to fetch deals" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Get all active deals for the authenticated restaurant owner's restaurants
                    app.get("/api/deals/my-active", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, restaurants_8, allDeals, activeDeals, error_65;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getRestaurantsByOwner(userId)];
                                case 1:
                                    restaurants_8 = _a.sent();
                                    return [4 /*yield*/, Promise.all(restaurants_8.map(function (restaurant) { return __awaiter(_this, void 0, void 0, function () {
                                            var deals;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, storage.getDealsByRestaurant(restaurant.id)];
                                                    case 1:
                                                        deals = _a.sent();
                                                        return [2 /*return*/, deals.filter(function (deal) { return deal.isActive; })];
                                                }
                                            });
                                        }); }))];
                                case 2:
                                    allDeals = _a.sent();
                                    activeDeals = allDeals.flat();
                                    res.json(activeDeals);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_65 = _a.sent();
                                    console.error("Error fetching my active deals:", error_65);
                                    res.status(500).json({ message: "Failed to fetch active deals" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/deals/featured", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var filter, showLimitedTimeOnly, deals_4, error_66;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    filter = req.query.filter;
                                    showLimitedTimeOnly = filter === "limited-time";
                                    return [4 /*yield*/, storage.getFilteredDeals(showLimitedTimeOnly)];
                                case 1:
                                    deals_4 = _a.sent();
                                    // Add cache headers for client-side caching
                                    res.set({
                                        "Cache-Control": "public, max-age=300", // 5 minutes
                                        ETag: "\"deals-".concat(filter || "all", "-").concat(Date.now(), "\""),
                                    });
                                    res.json(deals_4);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_66 = _a.sent();
                                    console.error("Error fetching featured deals:", error_66);
                                    res.status(500).json({ message: "Failed to fetch featured deals" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // New endpoint: Get all active deals for a specific restaurant
                    app.get("/api/deals/restaurant/:restaurantId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantIdSchema, restaurantId, restaurant_1, allRestaurantDeals, activeDeals, error_67;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    restaurantIdSchema = z
                                        .string()
                                        .uuid("Invalid restaurant ID format");
                                    restaurantId = restaurantIdSchema.parse(req.params.restaurantId);
                                    return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                                case 1:
                                    restaurant_1 = _a.sent();
                                    if (!restaurant_1) {
                                        return [2 /*return*/, res.status(404).json({ message: "Restaurant not found" })];
                                    }
                                    return [4 /*yield*/, storage.getDealsByRestaurant(restaurantId)];
                                case 2:
                                    allRestaurantDeals = _a.sent();
                                    activeDeals = allRestaurantDeals
                                        .filter(function (deal) { return deal.isActive; })
                                        .map(function (deal) { return (__assign(__assign({}, deal), { restaurant: {
                                            name: restaurant_1.name,
                                            cuisineType: restaurant_1.cuisineType,
                                            phone: restaurant_1.phone,
                                        } })); });
                                    // Add cache headers
                                    res.set({
                                        "Cache-Control": "public, max-age=180", // 3 minutes
                                        ETag: "\"restaurant-deals-".concat(restaurantId, "-").concat(Date.now(), "\""),
                                    });
                                    res.json(activeDeals);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_67 = _a.sent();
                                    console.error("Error fetching restaurant deals:", error_67);
                                    if (error_67.name === "ZodError") {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "Invalid restaurant ID format" })];
                                    }
                                    res.status(500).json({ message: "Failed to fetch restaurant deals" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/deals/nearby/:lat/:lng", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var lat, lng, radius, deals_5, error_68;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    lat = parseFloat(req.params.lat);
                                    lng = parseFloat(req.params.lng);
                                    radius = parseFloat(req.query.radius) || 5;
                                    return [4 /*yield*/, storage.getNearbyDeals(lat, lng, radius)];
                                case 1:
                                    deals_5 = _a.sent();
                                    res.json(deals_5);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_68 = _a.sent();
                                    console.error("Error fetching nearby deals:", error_68);
                                    res.status(500).json({ message: "Failed to fetch nearby deals" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Advanced search endpoint with filters
                    app.get("/api/deals/search", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, query, cuisine, minPrice, maxPrice, _b, radius, lat, lng, _c, sortBy, deals_6, error_69;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _d.trys.push([0, 2, , 3]);
                                    _a = req.query, query = _a.q, cuisine = _a.cuisine, minPrice = _a.minPrice, maxPrice = _a.maxPrice, _b = _a.radius, radius = _b === void 0 ? 10 : _b, lat = _a.lat, lng = _a.lng, _c = _a.sortBy, sortBy = _c === void 0 ? "relevance" : _c;
                                    return [4 /*yield*/, storage.searchDeals({
                                            query: query,
                                            cuisineType: cuisine,
                                            minPrice: minPrice ? parseFloat(minPrice) : undefined,
                                            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                                            latitude: lat ? parseFloat(lat) : undefined,
                                            longitude: lng ? parseFloat(lng) : undefined,
                                            radius: parseFloat(radius),
                                            sortBy: sortBy,
                                        })];
                                case 1:
                                    deals_6 = _d.sent();
                                    res.json(deals_6);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_69 = _d.sent();
                                    console.error("Error searching deals:", error_69);
                                    res.status(500).json({ message: "Failed to search deals" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Deals recommendations endpoint (missing implementation)
                    app.get("/api/deals/recommended", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId_1, sessionId_1, recommendedDeals, error_70;
                        var _this = this;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    userId_1 = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                                    sessionId_1 = req.sessionID || "anonymous";
                                    return [4 /*yield*/, storage.getActiveDeals()];
                                case 1:
                                    recommendedDeals = _b.sent();
                                    // Track restaurant recommendations for analytics (background task)
                                    if (recommendedDeals.length > 0) {
                                        // Track recommendations for analytics (don't wait for completion)
                                        Promise.all(recommendedDeals.slice(0, 10).map(function (deal) { return __awaiter(_this, void 0, void 0, function () {
                                            var err_4;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        _a.trys.push([0, 2, , 3]);
                                                        return [4 /*yield*/, storage.trackRestaurantRecommendation({
                                                                restaurantId: deal.restaurantId,
                                                                userId: userId_1,
                                                                sessionId: sessionId_1,
                                                                recommendationType: "personalized",
                                                                recommendationContext: "deals_recommended_endpoint",
                                                            })];
                                                    case 1:
                                                        _a.sent();
                                                        return [3 /*break*/, 3];
                                                    case 2:
                                                        err_4 = _a.sent();
                                                        console.error("Error tracking recommendation:", err_4);
                                                        return [3 /*break*/, 3];
                                                    case 3: return [2 /*return*/];
                                                }
                                            });
                                        }); })).catch(function (err) {
                                            return console.error("Error tracking recommendations batch:", err);
                                        });
                                    }
                                    res.json(recommendedDeals);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_70 = _b.sent();
                                    console.error("Error fetching recommended deals:", error_70);
                                    res.status(500).json({ message: "Failed to fetch recommended deals" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/deals/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var deal, error_71;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage.getDeal(req.params.id)];
                                case 1:
                                    deal = _a.sent();
                                    if (!deal) {
                                        return [2 /*return*/, res.status(404).json({ message: "Deal not found" })];
                                    }
                                    res.json(deal);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_71 = _a.sent();
                                    console.error("Error fetching deal:", error_71);
                                    res.status(500).json({ message: "Failed to fetch deal" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Review routes
                    app.post("/api/reviews", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, reviewData, review, error_72;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.user.id;
                                    reviewData = insertReviewSchema.parse(__assign(__assign({}, req.body), { userId: userId }));
                                    return [4 /*yield*/, storage.createReview(reviewData)];
                                case 1:
                                    review = _a.sent();
                                    res.json(review);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_72 = _a.sent();
                                    console.error("Error creating review:", error_72);
                                    res.status(400).json({ message: error_72.message });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/reviews/restaurant/:restaurantId", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var reviews, error_73;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage.getRestaurantReviews(req.params.restaurantId)];
                                case 1:
                                    reviews = _a.sent();
                                    res.json(reviews);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_73 = _a.sent();
                                    console.error("Error fetching reviews:", error_73);
                                    res.status(500).json({ message: "Failed to fetch reviews" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/reviews/restaurant/:restaurantId/rating", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var rating, error_74;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, storage.getRestaurantAverageRating(req.params.restaurantId)];
                                case 1:
                                    rating = _a.sent();
                                    res.json({ rating: rating });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_74 = _a.sent();
                                    console.error("Error fetching rating:", error_74);
                                    res.status(500).json({ message: "Failed to fetch rating" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // New idempotent subscription initialization endpoint (read-only: no Stripe mutation)
                    app.post("/api/subscriptions/initialize", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, _a, _b, hasMultipleDealsAddon, _c, billingInterval, _d, promoCode, restaurantsByOwner, hasVerified, hydratedUser, _e, locked, priceId, label, error_75;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0:
                                    user = req.user;
                                    _a = req.body, _b = _a.hasMultipleDealsAddon, hasMultipleDealsAddon = _b === void 0 ? false : _b, _c = _a.billingInterval, billingInterval = _c === void 0 ? "month" : _c, _d = _a.promoCode, promoCode = _d === void 0 ? "" : _d;
                                    console.log("=== Subscription Initialize Request ===");
                                    console.log("User ID:", user === null || user === void 0 ? void 0 : user.id);
                                    console.log("User Email:", user === null || user === void 0 ? void 0 : user.email);
                                    console.log("Promo Code:", promoCode);
                                    console.log("Billing Interval:", billingInterval);
                                    if (!["restaurant_owner", "food_truck"].includes(user === null || user === void 0 ? void 0 : user.userType)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage.getRestaurantsByOwner(user.id)];
                                case 1:
                                    restaurantsByOwner = _f.sent();
                                    hasVerified = restaurantsByOwner.some(function (restaurant) { return restaurant.isVerified; });
                                    if (!hasVerified) {
                                        return [2 /*return*/, res.status(403).json({
                                                error: {
                                                    message: "Verification is required before enabling premium features.",
                                                },
                                            })];
                                    }
                                    _f.label = 2;
                                case 2: return [4 /*yield*/, ensureTrialForUser(user)];
                                case 3:
                                    hydratedUser = _f.sent();
                                    if (isTrialActive(hydratedUser)) {
                                        return [2 /*return*/, res.send({
                                                status: "active",
                                                subscriptionId: null,
                                                trialAccess: true,
                                                message: "Your 30-day premium trial is active. We'll prompt you to pay before it ends.",
                                            })];
                                    }
                                    if (!stripe) {
                                        return [2 /*return*/, res
                                                .status(503)
                                                .json({ error: { message: "Payment processing is not configured" } })];
                                    }
                                    // TEST1: read-only preview; actual subscription created in /api/create-subscription
                                    if (promoCode.toUpperCase() === "TEST1") {
                                        if (!user.email) {
                                            return [2 /*return*/, res
                                                    .status(400)
                                                    .json({ error: { message: "No user email on file" } })];
                                        }
                                        return [2 /*return*/, res.send({
                                                status: "quote",
                                                promo: "TEST1",
                                                testPricing: true,
                                                label: "$1 test plan",
                                                billingInterval: "month",
                                            })];
                                    }
                                    if (!user.email) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: { message: "No user email on file" } })];
                                    }
                                    _f.label = 4;
                                case 4:
                                    _f.trys.push([4, 6, , 7]);
                                    return [4 /*yield*/, getLockedPriceForUser(user.id)];
                                case 5:
                                    _e = _f.sent(), locked = _e.locked, priceId = _e.priceId, label = _e.label;
                                    return [2 /*return*/, res.send({
                                            status: "quote",
                                            priceId: priceId,
                                            locked: locked,
                                            label: label,
                                            billingInterval: "month",
                                        })];
                                case 6:
                                    error_75 = _f.sent();
                                    console.error("Initialize quote error:", error_75);
                                    return [2 /*return*/, res.status(503).json({
                                            error: {
                                                message: error_75.message || "Unable to provide pricing quote",
                                            },
                                        })];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Legacy Stripe subscription route for restaurant fees (kept for backward compatibility)
                    app.post("/api/create-subscription", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, _a, hasMultipleDealsAddon, promoCode, _b, billingInterval, applyCreditsCents, restaurantsByOwner, hasVerified, customerId, customer, subscription, _c, _d, latestInvoice, paymentIntent, error_76, validIntervals, interval, subscription, latestInvoice, paymentIntent, error_77, customerId, customer, creditAppliedCents, requestedCreditCents, _e, getUserCreditBalance, debitCredit, balance, availableCents, balanceTx, _f, locked, priceId, label, amount, subscription, planType, latestInvoice, paymentIntent, error_78;
                        var _g, _h, _j;
                        return __generator(this, function (_k) {
                            switch (_k.label) {
                                case 0:
                                    user = req.user;
                                    _a = req.body, hasMultipleDealsAddon = _a.hasMultipleDealsAddon, promoCode = _a.promoCode, _b = _a.billingInterval, billingInterval = _b === void 0 ? "month" : _b, applyCreditsCents = _a.applyCreditsCents;
                                    if (!["restaurant_owner", "food_truck"].includes(user === null || user === void 0 ? void 0 : user.userType)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, storage.getRestaurantsByOwner(user.id)];
                                case 1:
                                    restaurantsByOwner = _k.sent();
                                    hasVerified = restaurantsByOwner.some(function (restaurant) { return restaurant.isVerified; });
                                    if (!hasVerified) {
                                        return [2 /*return*/, res.status(403).json({
                                                error: {
                                                    message: "Verification is required before enabling premium features.",
                                                },
                                            })];
                                    }
                                    _k.label = 2;
                                case 2:
                                    if (!(promoCode && promoCode.toUpperCase() === "TEST1")) return [3 /*break*/, 10];
                                    if (!stripe) {
                                        return [2 /*return*/, res.status(503).json({
                                                error: { message: "Payment service temporarily unavailable" },
                                            })];
                                    }
                                    if (!user.email) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: { message: "No user email on file" } })];
                                    }
                                    _k.label = 3;
                                case 3:
                                    _k.trys.push([3, 9, , 10]);
                                    customerId = user.stripeCustomerId;
                                    if (!!customerId) return [3 /*break*/, 5];
                                    return [4 /*yield*/, stripe.customers.create({
                                            email: user.email,
                                            name: user.firstName && user.lastName
                                                ? "".concat(user.firstName, " ").concat(user.lastName)
                                                : user.email,
                                        })];
                                case 4:
                                    customer = _k.sent();
                                    customerId = customer.id;
                                    _k.label = 5;
                                case 5:
                                    _d = (_c = stripe.subscriptions).create;
                                    _g = {
                                        customer: customerId
                                    };
                                    _h = {};
                                    _j = {
                                        currency: "usd"
                                    };
                                    return [4 /*yield*/, stripe.products.create({ name: "MealScout Test $1" })];
                                case 6: return [4 /*yield*/, _d.apply(_c, [(_g.items = [
                                            (_h.price_data = (_j.product = (_k.sent()).id,
                                                _j.unit_amount = 100,
                                                _j.recurring = { interval: "month", interval_count: 1 },
                                                _j),
                                                _h)
                                        ],
                                            _g.payment_behavior = "default_incomplete",
                                            _g.expand = ["latest_invoice.payment_intent"],
                                            _g)])];
                                case 7:
                                    subscription = _k.sent();
                                    return [4 /*yield*/, storage.updateUserStripeInfo(user.id, customerId, subscription.id, "standard-".concat(billingInterval))];
                                case 8:
                                    _k.sent();
                                    latestInvoice = subscription.latest_invoice;
                                    paymentIntent = typeof latestInvoice === "object" && latestInvoice
                                        ? latestInvoice.payment_intent
                                        : null;
                                    return [2 /*return*/, res.send({
                                            subscriptionId: subscription.id,
                                            clientSecret: typeof paymentIntent === "object" && paymentIntent
                                                ? paymentIntent.client_secret
                                                : null,
                                            testPricing: true,
                                            message: "Test pricing applied - $1 charge",
                                        })];
                                case 9:
                                    error_76 = _k.sent();
                                    console.error("Error creating test subscription:", error_76);
                                    return [2 /*return*/, res.status(400).send({ error: { message: error_76.message } })];
                                case 10:
                                    if (!stripe) {
                                        return [2 /*return*/, res
                                                .status(503)
                                                .json({ error: { message: "Payment processing is not configured" } })];
                                    }
                                    validIntervals = ["month"];
                                    interval = validIntervals.includes(billingInterval)
                                        ? billingInterval
                                        : "month";
                                    if (!user.stripeSubscriptionId) return [3 /*break*/, 18];
                                    _k.label = 11;
                                case 11:
                                    _k.trys.push([11, 17, , 18]);
                                    return [4 /*yield*/, stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
                                            expand: ["latest_invoice.payment_intent"],
                                        })];
                                case 12:
                                    subscription = _k.sent();
                                    if (!(subscription.status === "incomplete" ||
                                        subscription.status === "incomplete_expired")) return [3 /*break*/, 15];
                                    console.log("Canceling incomplete subscription ".concat(subscription.id, " to create new one"));
                                    return [4 /*yield*/, stripe.subscriptions.cancel(subscription.id)];
                                case 13:
                                    _k.sent();
                                    // Clear the subscription ID so we create a new one below
                                    return [4 /*yield*/, storage.updateUser(user.id, { stripeSubscriptionId: null })];
                                case 14:
                                    // Clear the subscription ID so we create a new one below
                                    _k.sent();
                                    return [3 /*break*/, 16];
                                case 15:
                                    latestInvoice = subscription.latest_invoice;
                                    paymentIntent = typeof latestInvoice === "object" && latestInvoice
                                        ? latestInvoice.payment_intent
                                        : null;
                                    res.send({
                                        subscriptionId: subscription.id,
                                        clientSecret: typeof paymentIntent === "object" && paymentIntent
                                            ? paymentIntent.client_secret
                                            : null,
                                    });
                                    return [2 /*return*/];
                                case 16: return [3 /*break*/, 18];
                                case 17:
                                    error_77 = _k.sent();
                                    console.error("Error retrieving subscription:", error_77);
                                    return [3 /*break*/, 18];
                                case 18:
                                    if (!user.email) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: { message: "No user email on file" } })];
                                    }
                                    _k.label = 19;
                                case 19:
                                    _k.trys.push([19, 32, , 33]);
                                    customerId = user.stripeCustomerId;
                                    if (!!customerId) return [3 /*break*/, 21];
                                    return [4 /*yield*/, stripe.customers.create({
                                            email: user.email,
                                            name: user.firstName && user.lastName
                                                ? "".concat(user.firstName, " ").concat(user.lastName)
                                                : user.email,
                                        })];
                                case 20:
                                    customer = _k.sent();
                                    customerId = customer.id;
                                    _k.label = 21;
                                case 21:
                                    creditAppliedCents = 0;
                                    requestedCreditCents = Number(applyCreditsCents || 0);
                                    if (!(requestedCreditCents > 0)) return [3 /*break*/, 26];
                                    return [4 /*yield*/, import("./creditService.js")];
                                case 22:
                                    _e = _k.sent(), getUserCreditBalance = _e.getUserCreditBalance, debitCredit = _e.debitCredit;
                                    return [4 /*yield*/, getUserCreditBalance(user.id)];
                                case 23:
                                    balance = _k.sent();
                                    availableCents = Math.max(0, Math.floor(balance * 100));
                                    creditAppliedCents = Math.min(requestedCreditCents, availableCents);
                                    if (!(creditAppliedCents > 0)) return [3 /*break*/, 26];
                                    return [4 /*yield*/, stripe.customers.createBalanceTransaction(customerId, {
                                            amount: -creditAppliedCents,
                                            currency: "usd",
                                            description: "MealScout credits applied",
                                        })];
                                case 24:
                                    balanceTx = _k.sent();
                                    return [4 /*yield*/, debitCredit(user.id, creditAppliedCents / 100, "subscription_credit", balanceTx.id, "subscription")];
                                case 25:
                                    _k.sent();
                                    _k.label = 26;
                                case 26:
                                    if (!!user.subscriptionSignupDate) return [3 /*break*/, 28];
                                    return [4 /*yield*/, storage.updateUser(user.id, {
                                            subscriptionSignupDate: new Date(),
                                        })];
                                case 27:
                                    _k.sent();
                                    _k.label = 28;
                                case 28: return [4 /*yield*/, getLockedPriceForUser(user.id)];
                                case 29:
                                    _f = _k.sent(), locked = _f.locked, priceId = _f.priceId, label = _f.label;
                                    amount = 2500;
                                    return [4 /*yield*/, stripe.subscriptions.create({
                                            customer: customerId,
                                            items: [{ price: priceId }],
                                            payment_behavior: "default_incomplete",
                                            expand: ["latest_invoice.payment_intent"],
                                            metadata: creditAppliedCents > 0
                                                ? { creditAppliedCents: creditAppliedCents.toString() }
                                                : undefined,
                                        })];
                                case 30:
                                    subscription = _k.sent();
                                    return [4 /*yield*/, storage.updateUserStripeInfo(user.id, customerId, subscription.id, "standard-".concat(interval))];
                                case 31:
                                    _k.sent();
                                    planType = "standard-".concat(interval);
                                    emailService
                                        .sendPaymentConfirmation(user, amount, planType, subscription.id)
                                        .catch(function (err) {
                                        return console.error("Failed to send payment confirmation email:", err);
                                    });
                                    latestInvoice = subscription.latest_invoice;
                                    paymentIntent = typeof latestInvoice === "object" && latestInvoice
                                        ? latestInvoice.payment_intent
                                        : null;
                                    res.send({
                                        subscriptionId: subscription.id,
                                        clientSecret: typeof paymentIntent === "object" && paymentIntent
                                            ? paymentIntent.client_secret
                                            : null,
                                        priceId: priceId,
                                        locked: locked,
                                        label: label,
                                    });
                                    return [3 /*break*/, 33];
                                case 32:
                                    error_78 = _k.sent();
                                    console.error("Error creating subscription:", error_78);
                                    return [2 /*return*/, res.status(400).send({ error: { message: error_78.message } })];
                                case 33: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Check subscription status
                    app.get("/api/subscription/status", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, hydratedUser, subscription, latestInvoice, invoice, paidInvoice, refreshedSubscription, payError_1, error_79;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    // Disable caching for subscription status
                                    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                                    res.setHeader("Pragma", "no-cache");
                                    res.setHeader("Expires", "0");
                                    return [4 /*yield*/, storage.getUser(req.user.id)];
                                case 1:
                                    user = _a.sent();
                                    if (!user) {
                                        return [2 /*return*/, res.status(401).json({ status: "none", hasAccess: false })];
                                    }
                                    return [4 /*yield*/, ensureTrialForUser(user)];
                                case 2:
                                    hydratedUser = _a.sent();
                                    if (isTrialActive(hydratedUser)) {
                                        return [2 /*return*/, res.json({
                                                status: "active",
                                                hasAccess: true,
                                                trialAccess: true,
                                                trialEndsAt: hydratedUser.trialEndsAt,
                                                message: "30-day premium trial active",
                                            })];
                                    }
                                    if (!stripe) {
                                        return [2 /*return*/, res.status(503).json({ message: "Payment service unavailable" })];
                                    }
                                    _a.label = 3;
                                case 3:
                                    _a.trys.push([3, 10, , 11]);
                                    if (!hydratedUser.stripeSubscriptionId) {
                                        return [2 /*return*/, res.json({ status: "none", hasAccess: false })];
                                    }
                                    return [4 /*yield*/, stripe.subscriptions.retrieve(hydratedUser.stripeSubscriptionId, {
                                            expand: ["latest_invoice.payment_intent"],
                                        })];
                                case 4:
                                    subscription = _a.sent();
                                    if (!(subscription.status === "incomplete")) return [3 /*break*/, 9];
                                    latestInvoice = subscription.latest_invoice;
                                    if (!(latestInvoice && typeof latestInvoice === "object")) return [3 /*break*/, 9];
                                    invoice = latestInvoice;
                                    console.log("Force paying invoice ".concat(invoice.id, " to complete subscription..."));
                                    _a.label = 5;
                                case 5:
                                    _a.trys.push([5, 8, , 9]);
                                    return [4 /*yield*/, stripe.invoices.pay(invoice.id)];
                                case 6:
                                    paidInvoice = _a.sent();
                                    console.log("Successfully paid invoice ".concat(invoice.id, ", status: ").concat(paidInvoice.status));
                                    return [4 /*yield*/, stripe.subscriptions.retrieve(hydratedUser.stripeSubscriptionId)];
                                case 7:
                                    refreshedSubscription = _a.sent();
                                    console.log("After paying invoice, subscription status: ".concat(refreshedSubscription.status));
                                    res.json({
                                        status: refreshedSubscription.status,
                                        currentPeriodEnd: refreshedSubscription
                                            .current_period_end,
                                        cancelAtPeriodEnd: refreshedSubscription
                                            .cancel_at_period_end,
                                    });
                                    return [2 /*return*/];
                                case 8:
                                    payError_1 = _a.sent();
                                    console.log("Error paying invoice: ".concat(payError_1.message));
                                    return [3 /*break*/, 9];
                                case 9:
                                    res.json({
                                        status: subscription.status,
                                        currentPeriodEnd: subscription.current_period_end,
                                        cancelAtPeriodEnd: subscription.cancel_at_period_end,
                                    });
                                    return [3 /*break*/, 11];
                                case 10:
                                    error_79 = _a.sent();
                                    console.error("Subscription status error:", error_79);
                                    res.status(500).json({ message: error_79.message });
                                    return [3 /*break*/, 11];
                                case 11: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Pause subscription endpoint
                    app.post("/api/subscription/pause", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, subscription, error_80;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!stripe) {
                                        return [2 /*return*/, res.status(503).json({ message: "Payment service unavailable" })];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    user = req.user;
                                    if (!user.stripeSubscriptionId) {
                                        return [2 /*return*/, res.status(400).json({ message: "No active subscription" })];
                                    }
                                    return [4 /*yield*/, stripe.subscriptions.update(user.stripeSubscriptionId, {
                                            pause_collection: {
                                                behavior: "keep_as_draft",
                                            },
                                        })];
                                case 2:
                                    subscription = _a.sent();
                                    res.json({
                                        message: "Subscription paused successfully",
                                        status: subscription.status,
                                    });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_80 = _a.sent();
                                    console.error("Pause subscription error:", error_80);
                                    res.status(500).json({ message: error_80.message });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Stripe Webhook Handler
                    app.post("/api/stripe/webhook", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var sig, event, payload, endpointSecret, _a, invoice, subscription, user, createAffiliateCommissionsForSubscription, commissionError_1, paymentIntent, _b, eventBookings, events_1, restaurants_9, hosts_1, metadata, passId, truckId, existingByIntent, existingByTruck, amountCents, truck, addCredit, eventRow, host, slotTypes, hostPriceCents, platformFeeCents, confirmedBookings, truck, addCredit, usedSpotNumbers, _i, confirmedBookings_1, row, spotNumber, truck, addCredit, creditAppliedCents, truck, _c, debitCredit, getUserCreditBalance, balance, availableCents, debitCents, creditError_1, truckOwner, createAffiliateCommissionsForBooking, commissionError_2, totalConfirmed, newStatus, error_81, failedIntent, eventBookings, error_82, subscriptionUpdated, userForUpdate, subscriptionDeleted, userForDeletion, error_83;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    sig = req.headers["stripe-signature"];
                                    try {
                                        payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
                                        // For development, we'll accept any webhook without signature verification
                                        // In production, you should verify the webhook signature for security
                                        if (process.env.NODE_ENV === "development") {
                                            event = typeof payload === "string" ? JSON.parse(payload) : payload;
                                        }
                                        else {
                                            endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
                                            if (!stripe || !endpointSecret) {
                                                return [2 /*return*/, res.status(400).send("Webhook secret not configured")];
                                            }
                                            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
                                        }
                                    }
                                    catch (err) {
                                        console.error("Webhook signature verification failed:", err.message);
                                        return [2 /*return*/, res.status(400).send("Webhook Error: ".concat(err.message))];
                                    }
                                    console.log("[WEBHOOK] Received event: ".concat(event.type));
                                    _d.label = 1;
                                case 1:
                                    _d.trys.push([1, 73, , 74]);
                                    _a = event.type;
                                    switch (_a) {
                                        case "invoice.payment_succeeded": return [3 /*break*/, 2];
                                        case "payment_intent.succeeded": return [3 /*break*/, 15];
                                        case "payment_intent.payment_failed": return [3 /*break*/, 58];
                                        case "customer.subscription.updated": return [3 /*break*/, 64];
                                        case "customer.subscription.deleted": return [3 /*break*/, 66];
                                    }
                                    return [3 /*break*/, 71];
                                case 2:
                                    invoice = event.data.object;
                                    console.log("[WEBHOOK] Invoice ".concat(invoice.id, " payment succeeded"));
                                    if (!(invoice.subscription && stripe)) return [3 /*break*/, 14];
                                    return [4 /*yield*/, stripe.subscriptions.retrieve(invoice.subscription)];
                                case 3:
                                    subscription = _d.sent();
                                    if (!(subscription && subscription.status === "active")) return [3 /*break*/, 14];
                                    console.log("[WEBHOOK] Subscription ".concat(subscription.id, " is now active for customer ").concat(subscription.customer));
                                    return [4 /*yield*/, storage.getUserByStripeSubscriptionId(subscription.id)];
                                case 4:
                                    user = _d.sent();
                                    if (!user) return [3 /*break*/, 9];
                                    _d.label = 5;
                                case 5:
                                    _d.trys.push([5, 8, , 9]);
                                    return [4 /*yield*/, import("./affiliateCommissionService.js")];
                                case 6:
                                    createAffiliateCommissionsForSubscription = (_d.sent()).createAffiliateCommissionsForSubscription;
                                    return [4 /*yield*/, createAffiliateCommissionsForSubscription(user.id, invoice.total, invoice.id)];
                                case 7:
                                    _d.sent();
                                    return [3 /*break*/, 9];
                                case 8:
                                    commissionError_1 = _d.sent();
                                    console.error("[WEBHOOK] Error processing affiliate commissions:", commissionError_1);
                                    return [3 /*break*/, 9];
                                case 9:
                                    if (!user) return [3 /*break*/, 13];
                                    console.log("[WEBHOOK] Found user ".concat(user.id, " (").concat(user.email, ") - ensuring subscription is active"));
                                    if (!(!user.stripeSubscriptionId ||
                                        user.stripeSubscriptionId !== subscription.id)) return [3 /*break*/, 11];
                                    return [4 /*yield*/, storage.updateUser(user.id, {
                                            stripeSubscriptionId: subscription.id,
                                            stripeCustomerId: subscription.customer,
                                        })];
                                case 10:
                                    _d.sent();
                                    console.log("[WEBHOOK] Updated user ".concat(user.id, " with subscription ID ").concat(subscription.id));
                                    return [3 /*break*/, 12];
                                case 11:
                                    console.log("[WEBHOOK] User ".concat(user.id, " subscription already properly configured"));
                                    _d.label = 12;
                                case 12: return [3 /*break*/, 14];
                                case 13:
                                    console.log("[WEBHOOK] Warning: No user found for subscription ".concat(subscription.id));
                                    _d.label = 14;
                                case 14: return [3 /*break*/, 72];
                                case 15:
                                    paymentIntent = event.data.object;
                                    console.log("[WEBHOOK] PaymentIntent ".concat(paymentIntent.id, " succeeded"));
                                    _d.label = 16;
                                case 16:
                                    _d.trys.push([16, 56, , 57]);
                                    return [4 /*yield*/, import("@shared/schema")];
                                case 17:
                                    _b = _d.sent(), eventBookings = _b.eventBookings, events_1 = _b.events, restaurants_9 = _b.restaurants, hosts_1 = _b.hosts;
                                    metadata = paymentIntent.metadata || {};
                                    passId = metadata.passId;
                                    truckId = metadata.truckId;
                                    if (!passId || !truckId) {
                                        return [3 /*break*/, 72];
                                    }
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(eventBookings)
                                            .where(eq(eventBookings.stripePaymentIntentId, paymentIntent.id))
                                            .limit(1)];
                                case 18:
                                    existingByIntent = _d.sent();
                                    if (existingByIntent.length > 0) {
                                        return [3 /*break*/, 72];
                                    }
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(eventBookings)
                                            .where(eq(eventBookings.eventId, passId))
                                            .where(eq(eventBookings.truckId, truckId))
                                            .limit(1)];
                                case 19:
                                    existingByTruck = _d.sent();
                                    amountCents = Number(metadata.totalCents) || Number(paymentIntent.amount || 0);
                                    if (!(existingByTruck.length > 0)) return [3 /*break*/, 24];
                                    return [4 /*yield*/, db
                                            .select({ ownerId: restaurants_9.ownerId })
                                            .from(restaurants_9)
                                            .where(eq(restaurants_9.id, truckId))];
                                case 20:
                                    truck = (_d.sent())[0];
                                    if (!(truck === null || truck === void 0 ? void 0 : truck.ownerId)) return [3 /*break*/, 23];
                                    return [4 /*yield*/, import("./creditService.js")];
                                case 21:
                                    addCredit = (_d.sent()).addCredit;
                                    return [4 /*yield*/, addCredit(truck.ownerId, amountCents / 100, "parking_pass_duplicate", paymentIntent.id)];
                                case 22:
                                    _d.sent();
                                    _d.label = 23;
                                case 23: return [3 /*break*/, 72];
                                case 24: return [4 /*yield*/, db
                                        .select()
                                        .from(events_1)
                                        .where(eq(events_1.id, passId))];
                                case 25:
                                    eventRow = (_d.sent())[0];
                                    if (!eventRow || !eventRow.requiresPayment) {
                                        return [3 /*break*/, 72];
                                    }
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(hosts_1)
                                            .where(eq(hosts_1.id, eventRow.hostId))];
                                case 26:
                                    host = (_d.sent())[0];
                                    slotTypes = String(metadata.slotTypes || "")
                                        .split(",")
                                        .map(function (value) { return value.trim(); })
                                        .filter(function (value) { return value.length > 0; });
                                    hostPriceCents = Number(metadata.hostPriceCents || 0);
                                    platformFeeCents = Number(metadata.platformFeeCents || 0);
                                    return [4 /*yield*/, db
                                            .select({
                                            id: eventBookings.id,
                                            spotNumber: eventBookings.spotNumber,
                                            bookingConfirmedAt: eventBookings.bookingConfirmedAt,
                                        })
                                            .from(eventBookings)
                                            .where(eq(eventBookings.eventId, passId))
                                            .where(inArray(eventBookings.status, ["confirmed"]))
                                            .orderBy(asc(eventBookings.bookingConfirmedAt))];
                                case 27:
                                    confirmedBookings = _d.sent();
                                    if (!(confirmedBookings.length >= eventRow.maxTrucks)) return [3 /*break*/, 33];
                                    return [4 /*yield*/, db
                                            .select({ ownerId: restaurants_9.ownerId })
                                            .from(restaurants_9)
                                            .where(eq(restaurants_9.id, truckId))];
                                case 28:
                                    truck = (_d.sent())[0];
                                    if (!(truck === null || truck === void 0 ? void 0 : truck.ownerId)) return [3 /*break*/, 31];
                                    return [4 /*yield*/, import("./creditService.js")];
                                case 29:
                                    addCredit = (_d.sent()).addCredit;
                                    return [4 /*yield*/, addCredit(truck.ownerId, amountCents / 100, "parking_pass_overbook", paymentIntent.id)];
                                case 30:
                                    _d.sent();
                                    _d.label = 31;
                                case 31: return [4 /*yield*/, db.insert(eventBookings).values({
                                        eventId: passId,
                                        truckId: truckId,
                                        hostId: eventRow.hostId,
                                        hostPriceCents: hostPriceCents,
                                        platformFeeCents: platformFeeCents,
                                        totalCents: amountCents,
                                        status: "cancelled",
                                        stripePaymentIntentId: paymentIntent.id,
                                        stripePaymentStatus: "succeeded",
                                        stripeApplicationFeeAmount: platformFeeCents,
                                        stripeTransferDestination: (host === null || host === void 0 ? void 0 : host.stripeConnectAccountId) || null,
                                        slotType: slotTypes.join(","),
                                        refundStatus: "credit",
                                        refundAmountCents: amountCents,
                                        refundedAt: new Date(),
                                        refundReason: "Overbooked",
                                        cancelledAt: new Date(),
                                        cancellationReason: "Overbooked - credit issued",
                                    })];
                                case 32:
                                    _d.sent();
                                    return [3 /*break*/, 72];
                                case 33:
                                    usedSpotNumbers = new Set();
                                    for (_i = 0, confirmedBookings_1 = confirmedBookings; _i < confirmedBookings_1.length; _i++) {
                                        row = confirmedBookings_1[_i];
                                        if (row.spotNumber && row.spotNumber > 0) {
                                            usedSpotNumbers.add(row.spotNumber);
                                        }
                                    }
                                    spotNumber = 1;
                                    while (usedSpotNumbers.has(spotNumber)) {
                                        spotNumber += 1;
                                    }
                                    if (!(spotNumber > eventRow.maxTrucks)) return [3 /*break*/, 39];
                                    return [4 /*yield*/, db
                                            .select({ ownerId: restaurants_9.ownerId })
                                            .from(restaurants_9)
                                            .where(eq(restaurants_9.id, truckId))];
                                case 34:
                                    truck = (_d.sent())[0];
                                    if (!(truck === null || truck === void 0 ? void 0 : truck.ownerId)) return [3 /*break*/, 37];
                                    return [4 /*yield*/, import("./creditService.js")];
                                case 35:
                                    addCredit = (_d.sent()).addCredit;
                                    return [4 /*yield*/, addCredit(truck.ownerId, amountCents / 100, "parking_pass_overbook", paymentIntent.id)];
                                case 36:
                                    _d.sent();
                                    _d.label = 37;
                                case 37: return [4 /*yield*/, db.insert(eventBookings).values({
                                        eventId: passId,
                                        truckId: truckId,
                                        hostId: eventRow.hostId,
                                        hostPriceCents: hostPriceCents,
                                        platformFeeCents: platformFeeCents,
                                        totalCents: amountCents,
                                        status: "cancelled",
                                        stripePaymentIntentId: paymentIntent.id,
                                        stripePaymentStatus: "succeeded",
                                        stripeApplicationFeeAmount: platformFeeCents,
                                        stripeTransferDestination: (host === null || host === void 0 ? void 0 : host.stripeConnectAccountId) || null,
                                        slotType: slotTypes.join(","),
                                        refundStatus: "credit",
                                        refundAmountCents: amountCents,
                                        refundedAt: new Date(),
                                        refundReason: "Overbooked",
                                        cancelledAt: new Date(),
                                        cancellationReason: "Overbooked - credit issued",
                                    })];
                                case 38:
                                    _d.sent();
                                    return [3 /*break*/, 72];
                                case 39: return [4 /*yield*/, db.insert(eventBookings).values({
                                        eventId: passId,
                                        truckId: truckId,
                                        hostId: eventRow.hostId,
                                        hostPriceCents: hostPriceCents,
                                        platformFeeCents: platformFeeCents,
                                        totalCents: amountCents,
                                        status: "confirmed",
                                        stripePaymentIntentId: paymentIntent.id,
                                        stripePaymentStatus: "succeeded",
                                        stripeApplicationFeeAmount: platformFeeCents,
                                        stripeTransferDestination: (host === null || host === void 0 ? void 0 : host.stripeConnectAccountId) || null,
                                        slotType: slotTypes.join(","),
                                        paidAt: new Date(),
                                        bookingConfirmedAt: new Date(),
                                        spotNumber: spotNumber,
                                    })];
                                case 40:
                                    _d.sent();
                                    _d.label = 41;
                                case 41:
                                    _d.trys.push([41, 47, , 48]);
                                    creditAppliedCents = Number(metadata.creditAppliedCents || 0);
                                    if (!(creditAppliedCents > 0)) return [3 /*break*/, 46];
                                    return [4 /*yield*/, db
                                            .select({ ownerId: restaurants_9.ownerId })
                                            .from(restaurants_9)
                                            .where(eq(restaurants_9.id, truckId))];
                                case 42:
                                    truck = (_d.sent())[0];
                                    if (!(truck === null || truck === void 0 ? void 0 : truck.ownerId)) return [3 /*break*/, 46];
                                    return [4 /*yield*/, import("./creditService.js")];
                                case 43:
                                    _c = _d.sent(), debitCredit = _c.debitCredit, getUserCreditBalance = _c.getUserCreditBalance;
                                    return [4 /*yield*/, getUserCreditBalance(truck.ownerId)];
                                case 44:
                                    balance = _d.sent();
                                    availableCents = Math.max(0, Math.floor(balance * 100));
                                    debitCents = Math.min(creditAppliedCents, availableCents);
                                    if (!(debitCents > 0)) return [3 /*break*/, 46];
                                    return [4 /*yield*/, debitCredit(truck.ownerId, debitCents / 100, "booking_credit", paymentIntent.id, "booking")];
                                case 45:
                                    _d.sent();
                                    _d.label = 46;
                                case 46: return [3 /*break*/, 48];
                                case 47:
                                    creditError_1 = _d.sent();
                                    console.error("[WEBHOOK] Error debiting booking credits:", creditError_1);
                                    return [3 /*break*/, 48];
                                case 48:
                                    _d.trys.push([48, 53, , 54]);
                                    return [4 /*yield*/, db
                                            .select({ ownerId: restaurants_9.ownerId })
                                            .from(restaurants_9)
                                            .where(eq(restaurants_9.id, truckId))];
                                case 49:
                                    truckOwner = (_d.sent())[0];
                                    if (!((host === null || host === void 0 ? void 0 : host.userId) && (truckOwner === null || truckOwner === void 0 ? void 0 : truckOwner.ownerId))) return [3 /*break*/, 52];
                                    return [4 /*yield*/, import("./affiliateCommissionService.js")];
                                case 50:
                                    createAffiliateCommissionsForBooking = (_d.sent()).createAffiliateCommissionsForBooking;
                                    return [4 /*yield*/, createAffiliateCommissionsForBooking({
                                            hostOwnerId: host.userId,
                                            truckOwnerId: truckOwner.ownerId,
                                            platformFeeCents: platformFeeCents,
                                            paymentIntentId: paymentIntent.id,
                                            truckRestaurantId: truckId,
                                        })];
                                case 51:
                                    _d.sent();
                                    _d.label = 52;
                                case 52: return [3 /*break*/, 54];
                                case 53:
                                    commissionError_2 = _d.sent();
                                    console.error("[WEBHOOK] Error processing booking affiliate commissions:", commissionError_2);
                                    return [3 /*break*/, 54];
                                case 54:
                                    totalConfirmed = confirmedBookings.length + 1;
                                    newStatus = totalConfirmed >= eventRow.maxTrucks ? "filled" : "open";
                                    return [4 /*yield*/, db
                                            .update(events_1)
                                            .set({
                                            status: newStatus,
                                            bookedRestaurantId: null,
                                        })
                                            .where(eq(events_1.id, passId))];
                                case 55:
                                    _d.sent();
                                    return [3 /*break*/, 57];
                                case 56:
                                    error_81 = _d.sent();
                                    console.error("[WEBHOOK] Error confirming booking:", error_81);
                                    return [3 /*break*/, 57];
                                case 57: return [3 /*break*/, 72];
                                case 58:
                                    failedIntent = event.data.object;
                                    console.log("[WEBHOOK] PaymentIntent ".concat(failedIntent.id, " failed"));
                                    _d.label = 59;
                                case 59:
                                    _d.trys.push([59, 62, , 63]);
                                    return [4 /*yield*/, import("@shared/schema")];
                                case 60:
                                    eventBookings = (_d.sent()).eventBookings;
                                    return [4 /*yield*/, db
                                            .update(eventBookings)
                                            .set({
                                            status: "cancelled",
                                            stripePaymentStatus: "failed",
                                            cancellationReason: "Payment failed",
                                        })
                                            .where(eq(eventBookings.stripePaymentIntentId, failedIntent.id))];
                                case 61:
                                    _d.sent();
                                    return [3 /*break*/, 63];
                                case 62:
                                    error_82 = _d.sent();
                                    console.error("[WEBHOOK] Error updating failed booking:", error_82);
                                    return [3 /*break*/, 63];
                                case 63: return [3 /*break*/, 72];
                                case 64:
                                    subscriptionUpdated = event.data.object;
                                    console.log("[WEBHOOK] Subscription ".concat(subscriptionUpdated.id, " updated to status: ").concat(subscriptionUpdated.status));
                                    return [4 /*yield*/, storage.getUserByStripeSubscriptionId(subscriptionUpdated.id)];
                                case 65:
                                    userForUpdate = _d.sent();
                                    if (userForUpdate) {
                                        console.log("[WEBHOOK] Found user ".concat(userForUpdate.id, " for subscription ").concat(subscriptionUpdated.id));
                                        // If subscription becomes inactive or canceled, we might want to handle it
                                        // For now, we rely on real-time checks in validateSubscriptionLimits
                                        if (subscriptionUpdated.status === "canceled" ||
                                            subscriptionUpdated.status === "incomplete_expired") {
                                            console.log("[WEBHOOK] Subscription ".concat(subscriptionUpdated.id, " is now ").concat(subscriptionUpdated.status, " for user ").concat(userForUpdate.id));
                                            // The validateSubscriptionLimits function will catch this on next deal creation attempt
                                        }
                                        else if (subscriptionUpdated.status === "active") {
                                            console.log("[WEBHOOK] Subscription ".concat(subscriptionUpdated.id, " is active for user ").concat(userForUpdate.id));
                                        }
                                    }
                                    else {
                                        console.log("[WEBHOOK] Warning: No user found for subscription ".concat(subscriptionUpdated.id));
                                    }
                                    return [3 /*break*/, 72];
                                case 66:
                                    subscriptionDeleted = event.data.object;
                                    console.log("[WEBHOOK] Subscription ".concat(subscriptionDeleted.id, " was deleted"));
                                    return [4 /*yield*/, storage.getUserByStripeSubscriptionId(subscriptionDeleted.id)];
                                case 67:
                                    userForDeletion = _d.sent();
                                    if (!userForDeletion) return [3 /*break*/, 69];
                                    console.log("[WEBHOOK] Clearing subscription for user ".concat(userForDeletion.id));
                                    return [4 /*yield*/, storage.updateUser(userForDeletion.id, {
                                            stripeSubscriptionId: null,
                                        })];
                                case 68:
                                    _d.sent();
                                    console.log("[WEBHOOK] Subscription cleared for user ".concat(userForDeletion.id, " (").concat(userForDeletion.email, ")"));
                                    return [3 /*break*/, 70];
                                case 69:
                                    console.log("[WEBHOOK] Warning: No user found for deleted subscription ".concat(subscriptionDeleted.id));
                                    _d.label = 70;
                                case 70: return [3 /*break*/, 72];
                                case 71:
                                    console.log("[WEBHOOK] Unhandled event type: ".concat(event.type));
                                    _d.label = 72;
                                case 72:
                                    res.json({ received: true });
                                    return [3 /*break*/, 74];
                                case 73:
                                    error_83 = _d.sent();
                                    console.error("[WEBHOOK] Error processing webhook:", error_83);
                                    res.status(500).json({ error: "Webhook processing failed" });
                                    return [3 /*break*/, 74];
                                case 74: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Cancel subscription
                    app.post("/api/subscription/cancel", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var user, subscription, error_84;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!stripe) {
                                        return [2 /*return*/, res.status(503).json({ message: "Payment service unavailable" })];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 5, , 6]);
                                    user = req.user;
                                    if (!user.stripeSubscriptionId) {
                                        return [2 /*return*/, res.status(400).json({ message: "No active subscription" })];
                                    }
                                    return [4 /*yield*/, stripe.subscriptions.cancel(user.stripeSubscriptionId)];
                                case 2:
                                    subscription = _a.sent();
                                    return [4 /*yield*/, storage.updateUser(user.id, {
                                            stripeSubscriptionId: null,
                                            subscriptionBillingInterval: null,
                                        })];
                                case 3:
                                    _a.sent();
                                    return [4 /*yield*/, storage.deactivateUserDeals(user.id)];
                                case 4:
                                    _a.sent();
                                    res.json({
                                        message: "Subscription cancelled immediately.",
                                        cancelAt: subscription.cancel_at,
                                    });
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_84 = _a.sent();
                                    console.error("Cancel subscription error:", error_84);
                                    res.status(500).json({ message: error_84.message });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Deal claiming route with Facebook integration
                    app.post("/api/deals/:dealId/claim", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var dealId, userId, deal, restaurant, existingClaims, claim, emailError_1, facebookMessage, error_85;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 10, , 11]);
                                    dealId = req.params.dealId;
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getDeal(dealId)];
                                case 1:
                                    deal = _a.sent();
                                    if (!deal) {
                                        return [2 /*return*/, res.status(404).json({ message: "Deal not found" })];
                                    }
                                    return [4 /*yield*/, storage.getRestaurant(deal.restaurantId)];
                                case 2:
                                    restaurant = _a.sent();
                                    if (!restaurant) {
                                        return [2 /*return*/, res.status(404).json({ message: "Restaurant not found" })];
                                    }
                                    return [4 /*yield*/, storage.getDealClaimsCount(dealId, userId)];
                                case 3:
                                    existingClaims = _a.sent();
                                    if (existingClaims >= (deal.perCustomerLimit || 1)) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "Deal already claimed by user" })];
                                    }
                                    // Check if deal is still available
                                    if (deal.totalUsesLimit &&
                                        (deal.currentUses || 0) >= deal.totalUsesLimit) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "Deal is no longer available" })];
                                    }
                                    return [4 /*yield*/, storage.claimDeal({
                                            dealId: dealId,
                                            userId: userId,
                                        })];
                                case 4:
                                    claim = _a.sent();
                                    // Increment deal uses after successful claim write
                                    return [4 /*yield*/, storage.incrementDealUses(dealId)];
                                case 5:
                                    // Increment deal uses after successful claim write
                                    _a.sent();
                                    _a.label = 6;
                                case 6:
                                    _a.trys.push([6, 8, , 9]);
                                    return [4 /*yield*/, sendDealClaimedNotification(dealId, userId)];
                                case 7:
                                    _a.sent();
                                    return [3 /*break*/, 9];
                                case 8:
                                    emailError_1 = _a.sent();
                                    console.error("Failed to send deal claimed notification:", emailError_1);
                                    return [3 /*break*/, 9];
                                case 9:
                                    facebookMessage = "\uD83C\uDF7D\uFE0F Just claimed an amazing deal at ".concat(restaurant.name, "!\n\n").concat(deal.title, "\n").concat(deal.discountValue, "% OFF (Min order: $").concat(deal.minOrderAmount || "15", ")\n\nFound this through MealScout - check it out! #MealScout #FoodDeals");
                                    res.json({
                                        success: true,
                                        claimId: claim.id,
                                        dealTitle: deal.title,
                                        restaurantName: restaurant.name,
                                        restaurantAddress: restaurant.address,
                                        facebookPostData: {
                                            message: facebookMessage,
                                            place: restaurant.facebookPlaceId || undefined,
                                        },
                                    });
                                    return [3 /*break*/, 11];
                                case 10:
                                    error_85 = _a.sent();
                                    console.error("Error claiming deal:", error_85);
                                    res.status(500).json({ message: "Failed to claim deal" });
                                    return [3 /*break*/, 11];
                                case 11: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Get claimed deals for user
                    app.get("/api/deals/claimed", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, claimedDeals, error_86;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    userId = req.user.id;
                                    return [4 /*yield*/, storage.getUserDealClaimsWithDetails(userId)];
                                case 1:
                                    claimedDeals = _a.sent();
                                    res.json(claimedDeals);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_86 = _a.sent();
                                    console.error("Error fetching claimed deals:", error_86);
                                    res.status(500).json({ message: "Failed to fetch claimed deals" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Get claims for restaurant owner's deals
                    app.get("/api/restaurants/:restaurantId/claims", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, status_2, isAuthorized, claims, error_87;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    restaurantId = req.params.restaurantId;
                                    status_2 = req.query.status;
                                    return [4 /*yield*/, storage.verifyRestaurantOwnership(restaurantId, req.user.id)];
                                case 1:
                                    isAuthorized = _a.sent();
                                    if (!isAuthorized) {
                                        return [2 /*return*/, res.status(403).json({
                                                message: "Unauthorized: You can only access analytics for restaurants you own",
                                            })];
                                    }
                                    return [4 /*yield*/, storage.getRestaurantDealClaims(restaurantId, status_2)];
                                case 2:
                                    claims = _a.sent();
                                    res.json(claims);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_87 = _a.sent();
                                    console.error("Error fetching restaurant claims:", error_87);
                                    res.status(500).json({ message: "Failed to fetch restaurant claims" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Search suggestions endpoint
                    app.get("/api/search/suggestions/:query", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var query, searchTerm_2, deals_7, restaurants_10, suggestions_1, limitedSuggestions, error_88;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    query = req.params.query;
                                    if (!query || query.length < 2) {
                                        return [2 /*return*/, res.json([])];
                                    }
                                    searchTerm_2 = query.toLowerCase();
                                    return [4 /*yield*/, storage.getAllDeals()];
                                case 1:
                                    deals_7 = _a.sent();
                                    return [4 /*yield*/, storage.getAllRestaurants()];
                                case 2:
                                    restaurants_10 = _a.sent();
                                    suggestions_1 = [];
                                    // Restaurant suggestions
                                    restaurants_10.forEach(function (restaurant) {
                                        if (restaurant.name.toLowerCase().includes(searchTerm_2)) {
                                            suggestions_1.push({
                                                id: "restaurant-".concat(restaurant.id),
                                                text: restaurant.name,
                                                type: "restaurant",
                                                subtitle: "".concat(restaurant.cuisineType, " \u2022 ").concat(restaurant.address || "Restaurant"),
                                            });
                                        }
                                        // Cuisine type suggestions
                                        if (restaurant.cuisineType &&
                                            restaurant.cuisineType.toLowerCase().includes(searchTerm_2)) {
                                            var existing = suggestions_1.find(function (s) {
                                                return s.text.toLowerCase() === restaurant.cuisineType.toLowerCase();
                                            });
                                            if (!existing) {
                                                suggestions_1.push({
                                                    id: "cuisine-".concat(restaurant.cuisineType),
                                                    text: restaurant.cuisineType,
                                                    type: "cuisine",
                                                    subtitle: "Food category",
                                                });
                                            }
                                        }
                                    });
                                    // Deal suggestions
                                    deals_7.forEach(function (deal) {
                                        var _a;
                                        if (deal.title.toLowerCase().includes(searchTerm_2)) {
                                            suggestions_1.push({
                                                id: "deal-".concat(deal.id),
                                                text: deal.title,
                                                type: "deal",
                                                subtitle: "".concat(((_a = deal.restaurant) === null || _a === void 0 ? void 0 : _a.name) || "Restaurant", " \u2022 ").concat(deal.discountValue, "% off"),
                                            });
                                        }
                                    });
                                    limitedSuggestions = suggestions_1.slice(0, 8).sort(function (a, b) {
                                        // Prioritize exact matches
                                        var aExact = a.text.toLowerCase().startsWith(searchTerm_2) ? 1 : 0;
                                        var bExact = b.text.toLowerCase().startsWith(searchTerm_2) ? 1 : 0;
                                        return bExact - aExact;
                                    });
                                    res.json(limitedSuggestions);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_88 = _a.sent();
                                    console.error("Search suggestions error:", error_88);
                                    res.status(500).json({ message: "Failed to get search suggestions" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Admin API endpoints
                    registerAdminManagementRoutes(app);
                    registerGeoAdRoutes(app);
                    // Staff management and user creation endpoints
                    registerStaffRoutes(app);
                    // Bug report endpoint
                    app.post("/api/bug-report", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, screenshot, currentUrl, userAgent, user, userName, userEmail, bugReportData, success, error_89;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    _a = req.body, screenshot = _a.screenshot, currentUrl = _a.currentUrl, userAgent = _a.userAgent;
                                    if (!currentUrl || !userAgent) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "Missing required bug report data" })];
                                    }
                                    user = req.user;
                                    userName = user
                                        ? "".concat(user.firstName || "", " ").concat(user.lastName || "").trim()
                                        : undefined;
                                    userEmail = (user === null || user === void 0 ? void 0 : user.email) || undefined;
                                    bugReportData = {
                                        userEmail: userEmail,
                                        userName: userName,
                                        userAgent: userAgent,
                                        currentUrl: currentUrl,
                                        timestamp: new Date().toLocaleString(),
                                        screenshotUrl: screenshot || undefined,
                                    };
                                    // Log bug report to console if email service not configured
                                    console.log("🐛 Bug Report Received:");
                                    console.log("   User:", userName || "Anonymous");
                                    console.log("   Email:", userEmail || "N/A");
                                    console.log("   URL:", currentUrl);
                                    console.log("   User Agent:", userAgent);
                                    console.log("   Time:", bugReportData.timestamp);
                                    console.log("   Screenshot:", screenshot ? "".concat(screenshot.substring(0, 50), "...") : "None");
                                    return [4 /*yield*/, emailService.sendBugReport(bugReportData)];
                                case 1:
                                    success = _b.sent();
                                    // Always return success even if email fails (logged to console)
                                    res.json({
                                        success: true,
                                        message: success
                                            ? "Bug report sent successfully"
                                            : "Bug report logged (email service not configured)",
                                    });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_89 = _b.sent();
                                    console.error("Error submitting bug report:", error_89);
                                    res.status(500).json({ message: "Failed to submit bug report" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Deal feedback endpoints
                    app.post("/api/deals/:dealId/feedback", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var dealId, feedbackData, validatedData, feedback, error_90;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    dealId = req.params.dealId;
                                    feedbackData = req.body;
                                    validatedData = insertDealFeedbackSchema.parse(__assign(__assign({}, feedbackData), { dealId: dealId, userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || null }));
                                    return [4 /*yield*/, storage.createDealFeedback(validatedData)];
                                case 1:
                                    feedback = _b.sent();
                                    res.json(feedback);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_90 = _b.sent();
                                    if (error_90 instanceof z.ZodError) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ message: "Invalid feedback data", errors: error_90.errors })];
                                    }
                                    console.error("Error creating deal feedback:", error_90);
                                    res.status(500).json({ message: "Failed to submit feedback" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/deals/:dealId/feedback", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var dealId, feedback, error_91;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    dealId = req.params.dealId;
                                    return [4 /*yield*/, storage.getDealFeedback(dealId)];
                                case 1:
                                    feedback = _a.sent();
                                    res.json(feedback);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_91 = _a.sent();
                                    console.error("Error fetching deal feedback:", error_91);
                                    res.status(500).json({ message: "Failed to fetch feedback" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.get("/api/deals/:dealId/feedback/stats", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var dealId, stats, error_92;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    dealId = req.params.dealId;
                                    return [4 /*yield*/, storage.getDealFeedbackStats(dealId)];
                                case 1:
                                    stats = _a.sent();
                                    res.json(stats);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_92 = _a.sent();
                                    console.error("Error fetching feedback stats:", error_92);
                                    res.status(500).json({ message: "Failed to fetch feedback stats" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Handle frequent HEAD /api requests efficiently (likely from monitoring)
                    app.head("/api", function (req, res) {
                        res.status(200).end();
                    });
                    // OAuth configuration status check
                    app.get("/api/admin/oauth/status", isAuthenticated, isAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var baseUrl, status_3;
                        return __generator(this, function (_a) {
                            try {
                                baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5000";
                                status_3 = {
                                    google: {
                                        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
                                        clientIdPresent: !!process.env.GOOGLE_CLIENT_ID,
                                        clientSecretPresent: !!process.env.GOOGLE_CLIENT_SECRET,
                                        callbackUrls: {
                                            customer: "".concat(baseUrl, "/api/auth/google/customer/callback"),
                                            restaurant: "".concat(baseUrl, "/api/auth/google/restaurant/callback"),
                                        },
                                    },
                                    facebook: {
                                        configured: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
                                        appIdPresent: !!process.env.FACEBOOK_APP_ID,
                                        appSecretPresent: !!process.env.FACEBOOK_APP_SECRET,
                                        callbackUrl: "".concat(baseUrl, "/api/auth/facebook/callback"),
                                    },
                                    requiredUrls: {
                                        privacyPolicy: "".concat(baseUrl, "/privacy-policy"),
                                        dataDeletion: "".concat(baseUrl, "/data-deletion"),
                                        termsOfService: "".concat(baseUrl, "/terms-of-service"),
                                    },
                                    baseUrl: baseUrl,
                                    environment: process.env.NODE_ENV || "development",
                                };
                                res.json(status_3);
                            }
                            catch (error) {
                                console.error("Error checking OAuth status:", error);
                                res.status(500).json({ error: "Failed to check OAuth status" });
                            }
                            return [2 /*return*/];
                        });
                    }); });
                    // Health check endpoint for monitoring
                    app.get("/api/health", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var error_93;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    // Test database connectivity
                                    return [4 /*yield*/, storage.getUser("health-check")];
                                case 1:
                                    // Test database connectivity
                                    _a.sent();
                                    res.json({
                                        status: "healthy",
                                        timestamp: new Date().toISOString(),
                                        uptime: process.uptime(),
                                        environment: process.env.NODE_ENV || "development",
                                        version: "1.0.0",
                                    });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_93 = _a.sent();
                                    res.status(503).json({
                                        status: "unhealthy",
                                        error: "Database connection failed",
                                        timestamp: new Date().toISOString(),
                                    });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Dynamic sitemap.xml (proxied by Vercel)
                    app.get("/sitemap.xml", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var cities, rows, baseUrl_1, urls, xml, e_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, import("@shared/schema")];
                                case 1:
                                    cities = (_a.sent()).cities;
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(cities)
                                            .orderBy(desc(cities.createdAt))];
                                case 2:
                                    rows = _a.sent();
                                    baseUrl_1 = process.env.SERVICE_URL || "https://www.mealscout.us";
                                    urls = rows.map(function (c) { return "".concat(baseUrl_1, "/food-trucks/").concat(encodeURIComponent(c.slug)); });
                                    xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n".concat(urls
                                        .map(function (u) { return "  <url><loc>".concat(u, "</loc></url>"); })
                                        .join("\n"), "\n</urlset>");
                                    res.setHeader("Content-Type", "application/xml");
                                    res.send(xml);
                                    return [3 /*break*/, 4];
                                case 3:
                                    e_3 = _a.sent();
                                    console.error("sitemap failed", e_3);
                                    res.status(500).send("<error>failed</error>");
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // City landing page API: returns real data for a city slug
                    app.get("/api/cities/:slug", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var slug, _a, cities, restaurants_11, hosts_2, events_2, videoStories, city, cityRestaurants, trucks, restaurantsOnly, hostRows, hostIds_1, upcomingEvents, now_1, restaurantIds_1, stories, cuisineCounts, _i, cityRestaurants_1, r, c, error_94;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 9, , 10]);
                                    slug = req.params.slug;
                                    return [4 /*yield*/, import("@shared/schema")];
                                case 1:
                                    _a = _b.sent(), cities = _a.cities, restaurants_11 = _a.restaurants, hosts_2 = _a.hosts, events_2 = _a.events, videoStories = _a.videoStories;
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(cities)
                                            .where(eq(cities.slug, slug))];
                                case 2:
                                    city = (_b.sent())[0];
                                    if (!city) {
                                        return [2 /*return*/, res.status(404).json({ message: "City not found" })];
                                    }
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(restaurants_11)
                                            .where(eq(restaurants_11.city, city.name))];
                                case 3:
                                    cityRestaurants = _b.sent();
                                    trucks = cityRestaurants.filter(function (r) { return r.isFoodTruck; });
                                    restaurantsOnly = cityRestaurants.filter(function (r) { return !r.isFoodTruck; });
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(hosts_2)
                                            .where(eq(hosts_2.city, city.name))];
                                case 4:
                                    hostRows = _b.sent();
                                    hostIds_1 = hostRows.map(function (h) { return h.id; });
                                    upcomingEvents = [];
                                    if (!hostIds_1.length) return [3 /*break*/, 6];
                                    now_1 = new Date();
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(events_2)
                                            .where(eq(events_2.status, "open"))];
                                case 5:
                                    upcomingEvents = _b.sent();
                                    upcomingEvents = upcomingEvents.filter(function (e) { return new Date(e.date) >= now_1 && hostIds_1.includes(e.hostId); });
                                    _b.label = 6;
                                case 6:
                                    restaurantIds_1 = cityRestaurants.map(function (r) { return r.id; });
                                    stories = [];
                                    if (!restaurantIds_1.length) return [3 /*break*/, 8];
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(videoStories)
                                            .orderBy(desc(videoStories.createdAt))];
                                case 7:
                                    stories = _b.sent();
                                    stories = stories.filter(function (s) { return s.restaurantId && restaurantIds_1.includes(s.restaurantId); });
                                    stories = stories.slice(0, 8);
                                    _b.label = 8;
                                case 8:
                                    cuisineCounts = {};
                                    for (_i = 0, cityRestaurants_1 = cityRestaurants; _i < cityRestaurants_1.length; _i++) {
                                        r = cityRestaurants_1[_i];
                                        if (r.cuisineType) {
                                            c = String(r.cuisineType).toLowerCase();
                                            cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
                                        }
                                    }
                                    res.json({
                                        city: { name: city.name, slug: city.slug, state: city.state },
                                        stats: {
                                            restaurants: restaurantsOnly.length,
                                            trucks: trucks.length,
                                            events: upcomingEvents.length,
                                        },
                                        restaurants: restaurantsOnly,
                                        trucks: trucks,
                                        events: upcomingEvents,
                                        cuisines: Object.entries(cuisineCounts)
                                            .map(function (_a) {
                                            var name = _a[0], count = _a[1];
                                            return ({ name: name, count: count });
                                        })
                                            .sort(function (a, b) { return b.count - a.count; })
                                            .slice(0, 12),
                                        stories: stories,
                                        updatedAt: new Date().toISOString(),
                                    });
                                    return [3 /*break*/, 10];
                                case 9:
                                    error_94 = _b.sent();
                                    console.error("Error building city page:", error_94);
                                    res.status(500).json({ message: "Failed to load city" });
                                    return [3 /*break*/, 10];
                                case 10: return [2 /*return*/];
                            }
                        });
                    }); });
                    // ==================== IMAGE UPLOAD ROUTES ====================
                    // Upload restaurant logo
                    app.post("/api/upload/restaurant-logo", isAuthenticated, upload.single("image"), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, restaurant, result, imageUpload, error_95;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    if (!isCloudinaryConfigured()) {
                                        return [2 /*return*/, res
                                                .status(503)
                                                .json({ message: "Image upload service not configured" })];
                                    }
                                    if (!req.file) {
                                        return [2 /*return*/, res.status(400).json({ message: "No image file provided" })];
                                    }
                                    restaurantId = req.body.restaurantId;
                                    if (!restaurantId) {
                                        return [2 /*return*/, res.status(400).json({ message: "Restaurant ID required" })];
                                    }
                                    return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                                case 1:
                                    restaurant = _a.sent();
                                    if (!restaurant || restaurant.ownerId !== req.user.id) {
                                        return [2 /*return*/, res.status(403).json({ message: "Not authorized" })];
                                    }
                                    return [4 /*yield*/, uploadToCloudinary(req.file.buffer, "restaurant-logos", "restaurant-".concat(restaurantId, "-logo"))];
                                case 2:
                                    result = _a.sent();
                                    return [4 /*yield*/, db
                                            .insert(imageUploads)
                                            .values({
                                            uploadedByUserId: req.user.id,
                                            imageType: "restaurant_logo",
                                            entityId: restaurantId,
                                            entityType: "restaurant",
                                            cloudinaryPublicId: result.publicId,
                                            cloudinaryUrl: result.secureUrl,
                                            thumbnailUrl: result.thumbnailUrl,
                                            width: result.width,
                                            height: result.height,
                                            fileSize: result.bytes,
                                            mimeType: req.file.mimetype,
                                        })
                                            .returning()];
                                case 3:
                                    imageUpload = _a.sent();
                                    // Update restaurant with new logo URL
                                    return [4 /*yield*/, storage.updateRestaurant(restaurantId, {
                                            logoUrl: result.secureUrl,
                                        })];
                                case 4:
                                    // Update restaurant with new logo URL
                                    _a.sent();
                                    res.json({ imageUpload: imageUpload[0], url: result.secureUrl });
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_95 = _a.sent();
                                    console.error("Error uploading restaurant logo:", error_95);
                                    res.status(500).json({ message: "Failed to upload image" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Upload restaurant cover image
                    app.post("/api/upload/restaurant-cover", isAuthenticated, upload.single("image"), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, restaurant, result, imageUpload, error_96;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    if (!isCloudinaryConfigured()) {
                                        return [2 /*return*/, res
                                                .status(503)
                                                .json({ message: "Image upload service not configured" })];
                                    }
                                    if (!req.file) {
                                        return [2 /*return*/, res.status(400).json({ message: "No image file provided" })];
                                    }
                                    restaurantId = req.body.restaurantId;
                                    if (!restaurantId) {
                                        return [2 /*return*/, res.status(400).json({ message: "Restaurant ID required" })];
                                    }
                                    return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                                case 1:
                                    restaurant = _a.sent();
                                    if (!restaurant || restaurant.ownerId !== req.user.id) {
                                        return [2 /*return*/, res.status(403).json({ message: "Not authorized" })];
                                    }
                                    return [4 /*yield*/, uploadToCloudinary(req.file.buffer, "restaurant-covers", "restaurant-".concat(restaurantId, "-cover"))];
                                case 2:
                                    result = _a.sent();
                                    return [4 /*yield*/, db
                                            .insert(imageUploads)
                                            .values({
                                            uploadedByUserId: req.user.id,
                                            imageType: "restaurant_cover",
                                            entityId: restaurantId,
                                            entityType: "restaurant",
                                            cloudinaryPublicId: result.publicId,
                                            cloudinaryUrl: result.secureUrl,
                                            thumbnailUrl: result.thumbnailUrl,
                                            width: result.width,
                                            height: result.height,
                                            fileSize: result.bytes,
                                            mimeType: req.file.mimetype,
                                        })
                                            .returning()];
                                case 3:
                                    imageUpload = _a.sent();
                                    return [4 /*yield*/, storage.updateRestaurant(restaurantId, {
                                            coverImageUrl: result.secureUrl,
                                        })];
                                case 4:
                                    _a.sent();
                                    res.json({ imageUpload: imageUpload[0], url: result.secureUrl });
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_96 = _a.sent();
                                    console.error("Error uploading restaurant cover:", error_96);
                                    res.status(500).json({ message: "Failed to upload image" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Upload deal image
                    app.post("/api/upload/deal-image", isAuthenticated, upload.single("image"), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var dealId, deal, restaurant, result, imageUpload, error_97;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 6, , 7]);
                                    if (!isCloudinaryConfigured()) {
                                        return [2 /*return*/, res
                                                .status(503)
                                                .json({ message: "Image upload service not configured" })];
                                    }
                                    if (!req.file) {
                                        return [2 /*return*/, res.status(400).json({ message: "No image file provided" })];
                                    }
                                    dealId = req.body.dealId;
                                    if (!dealId) {
                                        return [2 /*return*/, res.status(400).json({ message: "Deal ID required" })];
                                    }
                                    return [4 /*yield*/, storage.getDeal(dealId)];
                                case 1:
                                    deal = _a.sent();
                                    if (!deal) {
                                        return [2 /*return*/, res.status(404).json({ message: "Deal not found" })];
                                    }
                                    return [4 /*yield*/, storage.getRestaurant(deal.restaurantId)];
                                case 2:
                                    restaurant = _a.sent();
                                    if (!restaurant || restaurant.ownerId !== req.user.id) {
                                        return [2 /*return*/, res.status(403).json({ message: "Not authorized" })];
                                    }
                                    return [4 /*yield*/, uploadToCloudinary(req.file.buffer, "deal-images", "deal-".concat(dealId))];
                                case 3:
                                    result = _a.sent();
                                    return [4 /*yield*/, db
                                            .insert(imageUploads)
                                            .values({
                                            uploadedByUserId: req.user.id,
                                            imageType: "deal",
                                            entityId: dealId,
                                            entityType: "deal",
                                            cloudinaryPublicId: result.publicId,
                                            cloudinaryUrl: result.secureUrl,
                                            thumbnailUrl: result.thumbnailUrl,
                                            width: result.width,
                                            height: result.height,
                                            fileSize: result.bytes,
                                            mimeType: req.file.mimetype,
                                        })
                                            .returning()];
                                case 4:
                                    imageUpload = _a.sent();
                                    // Update deal with image URL
                                    return [4 /*yield*/, storage.updateDeal(dealId, { imageUrl: result.secureUrl })];
                                case 5:
                                    // Update deal with image URL
                                    _a.sent();
                                    res.json({ imageUpload: imageUpload[0], url: result.secureUrl });
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_97 = _a.sent();
                                    console.error("Error uploading deal image:", error_97);
                                    res.status(500).json({ message: "Failed to upload image" });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Upload user profile image
                    app.post("/api/upload/user-profile", isAuthenticated, upload.single("image"), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var result, imageUpload, error_98;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    if (!isCloudinaryConfigured()) {
                                        return [2 /*return*/, res
                                                .status(503)
                                                .json({ message: "Image upload service not configured" })];
                                    }
                                    if (!req.file) {
                                        return [2 /*return*/, res.status(400).json({ message: "No image file provided" })];
                                    }
                                    return [4 /*yield*/, uploadToCloudinary(req.file.buffer, "user-profiles", "user-".concat(req.user.id))];
                                case 1:
                                    result = _a.sent();
                                    return [4 /*yield*/, db
                                            .insert(imageUploads)
                                            .values({
                                            uploadedByUserId: req.user.id,
                                            imageType: "user_profile",
                                            entityId: req.user.id,
                                            entityType: "user",
                                            cloudinaryPublicId: result.publicId,
                                            cloudinaryUrl: result.secureUrl,
                                            thumbnailUrl: result.thumbnailUrl,
                                            width: result.width,
                                            height: result.height,
                                            fileSize: result.bytes,
                                            mimeType: req.file.mimetype,
                                        })
                                            .returning()];
                                case 2:
                                    imageUpload = _a.sent();
                                    // Update user profile image
                                    return [4 /*yield*/, storage.upsertUser(__assign(__assign({}, req.user), { profileImageUrl: result.secureUrl }))];
                                case 3:
                                    // Update user profile image
                                    _a.sent();
                                    res.json({ imageUpload: imageUpload[0], url: result.secureUrl });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_98 = _a.sent();
                                    console.error("Error uploading user profile image:", error_98);
                                    res.status(500).json({ message: "Failed to upload image" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Delete uploaded image
                    app.delete("/api/upload/:imageId", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var imageId, images, image, error_99;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    imageId = req.params.imageId;
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(imageUploads)
                                            .where(eq(imageUploads.id, imageId))
                                            .limit(1)];
                                case 1:
                                    images = _a.sent();
                                    image = images[0];
                                    if (!image) {
                                        return [2 /*return*/, res.status(404).json({ message: "Image not found" })];
                                    }
                                    // Check authorization
                                    if (image.uploadedByUserId !== req.user.id &&
                                        req.user.userType !== "admin" &&
                                        req.user.userType !== "super_admin") {
                                        return [2 /*return*/, res.status(403).json({ message: "Not authorized" })];
                                    }
                                    if (!image.cloudinaryPublicId) return [3 /*break*/, 3];
                                    return [4 /*yield*/, deleteFromCloudinary(image.cloudinaryPublicId)];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3: 
                                // Delete from database
                                return [4 /*yield*/, db.delete(imageUploads).where({ id: imageId })];
                                case 4:
                                    // Delete from database
                                    _a.sent();
                                    res.json({ message: "Image deleted successfully" });
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_99 = _a.sent();
                                    console.error("Error deleting image:", error_99);
                                    res.status(500).json({ message: "Failed to delete image" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    // ==================== GOLDEN FORK AWARD ROUTES ====================
                    // Check Golden Fork eligibility
                    app.get("/api/awards/golden-fork/eligibility", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var eligibility, error_100;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, checkGoldenForkEligibility(req.user.id)];
                                case 1:
                                    eligibility = _a.sent();
                                    res.json(eligibility);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_100 = _a.sent();
                                    console.error("Error checking Golden Fork eligibility:", error_100);
                                    res.status(500).json({ message: "Failed to check eligibility" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Claim Golden Fork award
                    app.post("/api/awards/golden-fork/claim", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var awarded, error_101;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, awardGoldenFork(req.user.id)];
                                case 1:
                                    awarded = _a.sent();
                                    if (awarded) {
                                        res.json({ message: "Golden Fork awarded!", awarded: true });
                                    }
                                    else {
                                        res
                                            .status(400)
                                            .json({ message: "Not eligible for Golden Fork", awarded: false });
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_101 = _a.sent();
                                    console.error("Error claiming Golden Fork:", error_101);
                                    res.status(500).json({ message: "Failed to claim award" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Get all Golden Fork holders
                    app.get("/api/awards/golden-fork/holders", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var holders_1, holdersWithRecommendations, error_102;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, db
                                            .select({
                                            id: users.id,
                                            firstName: users.firstName,
                                            lastName: users.lastName,
                                            profileImageUrl: users.profileImageUrl,
                                            influenceScore: users.influenceScore,
                                            reviewCount: users.reviewCount,
                                            goldenForkEarnedAt: users.goldenForkEarnedAt,
                                        })
                                            .from(users)
                                            .where(eq(users.hasGoldenFork, true))];
                                case 1:
                                    holders_1 = _a.sent();
                                    return [4 /*yield*/, Promise.all(holders_1.map(function (holder) { return __awaiter(_this, void 0, void 0, function () {
                                            var recommendationCount;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, getUserRecommendationCount(holder.id)];
                                                    case 1:
                                                        recommendationCount = _a.sent();
                                                        return [2 /*return*/, __assign(__assign({}, holder), { recommendationCount: recommendationCount })];
                                                }
                                            });
                                        }); }))];
                                case 2:
                                    holdersWithRecommendations = _a.sent();
                                    res.json(holdersWithRecommendations);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_102 = _a.sent();
                                    console.error("Error fetching Golden Fork holders:", error_102);
                                    res.status(500).json({ message: "Failed to fetch holders" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Get user influence stats
                    app.get("/api/user/:userId/influence-stats", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var userId, user, influenceScore, recommendationCount, error_103;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 4, , 5]);
                                    userId = req.params.userId;
                                    return [4 /*yield*/, storage.getUser(userId)];
                                case 1:
                                    user = _a.sent();
                                    if (!user) {
                                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                                    }
                                    return [4 /*yield*/, calculateUserInfluenceScore(userId)];
                                case 2:
                                    influenceScore = _a.sent();
                                    return [4 /*yield*/, getUserRecommendationCount(userId)];
                                case 3:
                                    recommendationCount = _a.sent();
                                    res.json({
                                        userId: user.id,
                                        hasGoldenFork: user.hasGoldenFork,
                                        goldenForkEarnedAt: user.goldenForkEarnedAt,
                                        reviewCount: user.reviewCount || 0,
                                        recommendationCount: recommendationCount,
                                        influenceScore: influenceScore,
                                    });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_103 = _a.sent();
                                    console.error("Error fetching influence stats:", error_103);
                                    res.status(500).json({ message: "Failed to fetch stats" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // ==================== GOLDEN PLATE AWARD ROUTES ====================
                    // Get all Golden Plate winners
                    app.get("/api/awards/golden-plate/winners", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var winners, error_104;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(restaurants)
                                            .where(eq(restaurants.hasGoldenPlate, true))];
                                case 1:
                                    winners = _a.sent();
                                    res.json(winners);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_104 = _a.sent();
                                    console.error("Error fetching Golden Plate winners:", error_104);
                                    res.status(500).json({ message: "Failed to fetch winners" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Get Golden Plate winners by area
                    app.get("/api/awards/golden-plate/winners/:area", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var area, winners, error_105;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    area = req.params.area;
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(restaurants)
                                            .where(and(eq(restaurants.hasGoldenPlate, true), like(restaurants.address, "%".concat(area, "%"))))];
                                case 1:
                                    winners = _a.sent();
                                    res.json(winners);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_105 = _a.sent();
                                    console.error("Error fetching area Golden Plate winners:", error_105);
                                    res.status(500).json({ message: "Failed to fetch winners" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Get leaderboard for an area
                    app.get("/api/awards/golden-plate/leaderboard/:area", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var area, limit, leaderboard, error_106;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    area = req.params.area;
                                    limit = parseInt(req.query.limit) || 50;
                                    return [4 /*yield*/, getAreaLeaderboard(area, limit)];
                                case 1:
                                    leaderboard = _a.sent();
                                    res.json(leaderboard);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_106 = _a.sent();
                                    console.error("Error fetching leaderboard:", error_106);
                                    res.status(500).json({ message: "Failed to fetch leaderboard" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Get restaurant ranking stats
                    app.get("/api/restaurants/:restaurantId/ranking-stats", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var restaurantId, restaurant, rankingScore, error_107;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    restaurantId = req.params.restaurantId;
                                    return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                                case 1:
                                    restaurant = _a.sent();
                                    if (!restaurant) {
                                        return [2 /*return*/, res.status(404).json({ message: "Restaurant not found" })];
                                    }
                                    return [4 /*yield*/, calculateRestaurantRankingScore(restaurantId)];
                                case 2:
                                    rankingScore = _a.sent();
                                    res.json({
                                        restaurantId: restaurant.id,
                                        hasGoldenPlate: restaurant.hasGoldenPlate,
                                        goldenPlateCount: restaurant.goldenPlateCount || 0,
                                        goldenPlateEarnedAt: restaurant.goldenPlateEarnedAt,
                                        rankingScore: rankingScore,
                                    });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_107 = _a.sent();
                                    console.error("Error fetching ranking stats:", error_107);
                                    res.status(500).json({ message: "Failed to fetch stats" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Admin: Award Golden Plates for a specific area (manual trigger)
                    app.post("/api/admin/awards/golden-plate/:area", isAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var area, awardedCount, error_108;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    area = req.params.area;
                                    return [4 /*yield*/, awardGoldenPlatesForArea(area)];
                                case 1:
                                    awardedCount = _a.sent();
                                    res.json({
                                        message: "Awarded Golden Plates to ".concat(awardedCount, " restaurants in ").concat(area),
                                        awardedCount: awardedCount,
                                    });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_108 = _a.sent();
                                    console.error("Error awarding Golden Plates:", error_108);
                                    res.status(500).json({ message: "Failed to award Golden Plates" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Get award history
                    app.get("/api/awards/history", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var awardType, recipientId, query, error_109;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    awardType = req.query.awardType;
                                    recipientId = req.query.recipientId;
                                    return [4 /*yield*/, db
                                            .select()
                                            .from(awardHistory)
                                            .orderBy(desc(awardHistory.awardedAt))
                                            .limit(100)];
                                case 1:
                                    query = _a.sent();
                                    res.json(query);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_109 = _a.sent();
                                    console.error("Error fetching award history:", error_109);
                                    res.status(500).json({ message: "Failed to fetch award history" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, import("./storiesRoutes.js")];
                case 3:
                    setupStoriesRoutes = (_c.sent()).default;
                    setupStoriesRoutes(app);
                    // Register story cron jobs (cleanup and level recalculation)
                    registerStoryCronJobs(app);
                    // Schedule Weekly Digest (Monday 8:00 AM)
                    cron.schedule("0 8 * * 1", function () { return __awaiter(_this, void 0, void 0, function () {
                        var error_110;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log("⏰ Triggering Weekly Digest Cron Job");
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, DigestService.getInstance().sendWeeklyDigests()];
                                case 2:
                                    _a.sent();
                                    console.log("✅ Weekly Digest Cron Job Completed");
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_110 = _a.sent();
                                    console.error("❌ Weekly Digest Cron Job Failed:", error_110);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Schedule Unbooked Event Notifications (Every hour)
                    cron.schedule("0 * * * *", function () { return __awaiter(_this, void 0, void 0, function () {
                        var stats, error_111;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log("⏰ Triggering Unbooked Event Notification Check");
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, notifyUnbookedEvents()];
                                case 2:
                                    stats = _a.sent();
                                    console.log("✅ Unbooked Event Notification Check Completed:", stats);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_111 = _a.sent();
                                    console.error("❌ Unbooked Event Notification Check Failed:", error_111);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, import("./incidentRoutes.js")];
                case 4:
                    incidentRoutes = (_c.sent()).default;
                    app.use("/api/incidents", incidentRoutes);
                    return [4 /*yield*/, import("./adminRoutes.js")];
                case 5:
                    adminRoutes = (_c.sent()).default;
                    app.use("/api/admin", adminRoutes);
                    return [4 /*yield*/, import("./telemetryRoutes.js")];
                case 6:
                    telemetryRoutes = (_c.sent()).default;
                    app.use("/api/admin/telemetry", telemetryRoutes);
                    return [4 /*yield*/, import("./evidenceExportRoutes.js")];
                case 7:
                    evidenceExportRoutes = (_c.sent()).default;
                    app.use("/api/admin", evidenceExportRoutes);
                    return [4 /*yield*/, import("./affiliateRoutes.js")];
                case 8:
                    affiliateRoutes = (_c.sent()).default;
                    app.use("/api/affiliate", affiliateRoutes);
                    return [4 /*yield*/, import("./payoutRoutes.js")];
                case 9:
                    setupPayoutRoutes = (_c.sent()).default;
                    setupPayoutRoutes(app);
                    return [4 /*yield*/, import("./emptyCountyRoutes.js")];
                case 10:
                    setupEmptyCountyRoutes = (_c.sent()).default;
                    setupEmptyCountyRoutes(app);
                    return [4 /*yield*/, import("./shareRoutes.js")];
                case 11:
                    setupShareRoutes = (_c.sent()).default;
                    setupShareRoutes(app);
                    return [4 /*yield*/, import("./userRoutes.js")];
                case 12:
                    userRoutes = (_c.sent()).default;
                    app.use("/api/users", userRoutes);
                    return [4 /*yield*/, import("./redemptionRoutes.js")];
                case 13:
                    redemptionRoutes = (_c.sent()).default;
                    app.use("/api/restaurants", redemptionRoutes);
                    // Capture affiliate ref tags on any request and store for signup attribution
                    app.use(function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                        var ref, resolveAffiliateUserId, recordReferralClick, affiliateUserId, error_112;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    ref = typeof ((_a = req.query) === null || _a === void 0 ? void 0 : _a.ref) === "string" ? req.query.ref.trim() : "";
                                    if (!ref) {
                                        return [2 /*return*/, next()];
                                    }
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 7, , 8]);
                                    return [4 /*yield*/, import("./affiliateTagService.js")];
                                case 2:
                                    resolveAffiliateUserId = (_b.sent()).resolveAffiliateUserId;
                                    return [4 /*yield*/, import("./referralService.js")];
                                case 3:
                                    recordReferralClick = (_b.sent()).recordReferralClick;
                                    return [4 /*yield*/, resolveAffiliateUserId(ref)];
                                case 4:
                                    affiliateUserId = _b.sent();
                                    if (!affiliateUserId) return [3 /*break*/, 6];
                                    return [4 /*yield*/, recordReferralClick(affiliateUserId, req.originalUrl || "/", req.get("user-agent") || undefined, req.ip)];
                                case 5:
                                    _b.sent();
                                    _b.label = 6;
                                case 6: return [3 /*break*/, 8];
                                case 7:
                                    error_112 = _b.sent();
                                    console.error("[affiliate] Failed to record referral click:", error_112);
                                    return [3 /*break*/, 8];
                                case 8:
                                    res.cookie("referralId", ref, {
                                        maxAge: 1000 * 60 * 60 * 24 * 365,
                                        httpOnly: false,
                                        sameSite: "lax",
                                    });
                                    return [2 /*return*/, next()];
                            }
                        });
                    }); });
                    return [4 /*yield*/, import("./shareMiddleware.js")];
                case 14:
                    shareUrlMiddleware = (_c.sent()).shareUrlMiddleware;
                    app.use(shareUrlMiddleware);
                    // Register cron/scheduler endpoints
                    app.post("/api/cron/escalations", ((_a = incidentRoutes.stack.find(function (layer) { var _a; return ((_a = layer.route) === null || _a === void 0 ? void 0 : _a.path) === "/cron/escalations"; })) === null || _a === void 0 ? void 0 : _a.handle) || (function (_req, res) { return res.status(404).json({ error: "Not found" }); }));
                    // Clean affiliate links: /ref/<tag>
                    app.get("/ref/:tag", function (req, res) {
                        var _a;
                        var tag = ((_a = req.params) === null || _a === void 0 ? void 0 : _a.tag) || "";
                        var safeTag = encodeURIComponent(tag);
                        res.redirect("/?ref=".concat(safeTag));
                    });
                    app.post("/api/cron/auto-close", ((_b = incidentRoutes.stack.find(function (layer) { var _a; return ((_a = layer.route) === null || _a === void 0 ? void 0 : _a.path) === "/cron/auto-close"; })) === null || _b === void 0 ? void 0 : _b.handle) || (function (_req, res) { return res.status(404).json({ error: "Not found" }); }));
                    httpServer = createServer(app);
                    return [2 /*return*/, httpServer];
            }
        });
    });
}
var templateObject_1, templateObject_2, templateObject_3;

