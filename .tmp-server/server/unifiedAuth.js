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
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage.js";
import { emailService } from "./emailService.js";
import { sendSms } from "./smsService.js";
import crypto from "crypto";
import { sanitizeUser } from "./utils/sanitize.js";
import { isPasswordStrong, PASSWORD_REQUIREMENTS, } from "./utils/passwordPolicy.js";
import { db } from "./db.js";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { resolveAffiliateUserId } from "./affiliateTagService.js";
// Session configuration (moved from facebookAuth.ts)
export function getSession() {
    var sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    var pgStore = connectPg(session);
    var sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        ttl: sessionTtl,
        tableName: "sessions",
    });
    return session({
        name: "tradescout.sid",
        secret: process.env.SESSION_SECRET,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        // Trust reverse proxy for secure cookies (Render/Vercel)
        proxy: true,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: sessionTtl,
        },
    });
}
export function setupUnifiedAuth(app) {
    return __awaiter(this, void 0, void 0, function () {
        var getBaseUrl, baseUrl, createEmailVerificationUrl, sendWelcomeOrVerification, oauthUserTypeAllowList, getOauthUserType, superAdminEmail, existing, normalizePhone, requirePhoneVerification, verifyPhoneCode;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    getBaseUrl = function () {
                        if (process.env.PUBLIC_BASE_URL) {
                            return process.env.PUBLIC_BASE_URL;
                        }
                        // Fallback for local development
                        if (process.env.NODE_ENV === "development") {
                            return "http://localhost:5000";
                        }
                        throw new Error("PUBLIC_BASE_URL must be set for OAuth to work with multiple users");
                    };
                    baseUrl = getBaseUrl().replace(/\/+$/, "");
                    createEmailVerificationUrl = function (user, req) { return __awaiter(_this, void 0, void 0, function () {
                        var token, tokenHash, expiresAt, apiBaseUrl, verifyUrl;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!user.email)
                                        return [2 /*return*/, null];
                                    token = crypto.randomBytes(32).toString("hex");
                                    tokenHash = crypto.createHash("sha256").update(token).digest("hex");
                                    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                                    return [4 /*yield*/, storage.createEmailVerificationToken({
                                            userId: user.id,
                                            tokenHash: tokenHash,
                                            expiresAt: expiresAt,
                                            requestIp: req.ip || req.connection.remoteAddress || undefined,
                                            userAgent: req.get("User-Agent") || undefined,
                                        })];
                                case 1:
                                    _a.sent();
                                    apiBaseUrl = "".concat(req.protocol, "://").concat(req.get("host")) ||
                                        process.env.PUBLIC_BASE_URL ||
                                        "http://localhost:5000";
                                    verifyUrl = "".concat(apiBaseUrl, "/api/auth/verify-email?token=").concat(encodeURIComponent(token));
                                    return [2 /*return*/, verifyUrl];
                            }
                        });
                    }); };
                    sendWelcomeOrVerification = function (user, req, welcomeLabel) { return __awaiter(_this, void 0, void 0, function () {
                        var verifyUrl, _a, supportsWelcome, error_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    if (!(user.email && !user.emailVerified)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, createEmailVerificationUrl(user, req)];
                                case 1:
                                    _a = _b.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    _a = null;
                                    _b.label = 3;
                                case 3:
                                    verifyUrl = _a;
                                    supportsWelcome = user.userType === "customer" ||
                                        user.userType === "restaurant_owner" ||
                                        user.userType === "admin";
                                    if (supportsWelcome) {
                                        emailService
                                            .sendWelcomeEmail(user, verifyUrl !== null && verifyUrl !== void 0 ? verifyUrl : undefined)
                                            .catch(function (err) {
                                            return console.error("Failed to send ".concat(welcomeLabel, " welcome email:"), err);
                                        });
                                        return [2 /*return*/];
                                    }
                                    if (verifyUrl) {
                                        emailService
                                            .sendEmailVerificationEmail(user, verifyUrl)
                                            .catch(function (err) {
                                            return console.error("Failed to send email verification:", err);
                                        });
                                    }
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_1 = _b.sent();
                                    console.error("Failed to prepare ".concat(welcomeLabel, " welcome email:"), error_1);
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); };
                    oauthUserTypeAllowList = new Set([
                        "customer",
                        "restaurant_owner",
                        "food_truck",
                        "host",
                        "event_coordinator",
                    ]);
                    getOauthUserType = function (req, fallback) {
                        var _a;
                        var desired = (_a = req === null || req === void 0 ? void 0 : req.session) === null || _a === void 0 ? void 0 : _a.oauthUserType;
                        if (desired && oauthUserTypeAllowList.has(desired)) {
                            return desired;
                        }
                        return fallback;
                    };
                    superAdminEmail = process.env.ADMIN_EMAIL || "info.mealscout@gmail.com";
                    if (!superAdminEmail) return [3 /*break*/, 3];
                    return [4 /*yield*/, storage.getUserByEmail(superAdminEmail)];
                case 1:
                    existing = _a.sent();
                    if (!(existing && existing.userType !== "super_admin")) return [3 /*break*/, 3];
                    return [4 /*yield*/, storage.updateUserType(existing.id, "super_admin")];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    // Set up passport serialization for email/password auth
                    passport.serializeUser(function (user, done) {
                        done(null, user.id);
                    });
                    passport.deserializeUser(function (id, done) { return __awaiter(_this, void 0, void 0, function () {
                        var user, SUPER_ADMIN_EMAIL, err_1, err_2, error_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 10, , 11]);
                                    // Handle cases where id might not be a string (old session format)
                                    if (!id || typeof id !== "string") {
                                        return [2 /*return*/, done(null, false)];
                                    }
                                    return [4 /*yield*/, storage.getUser(id)];
                                case 1:
                                    user = _a.sent();
                                    if (!user) {
                                        return [2 /*return*/, done(null, false)];
                                    }
                                    SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info.mealscout@gmail.com";
                                    if (!(user &&
                                        user.email === SUPER_ADMIN_EMAIL &&
                                        user.userType !== "super_admin")) return [3 /*break*/, 5];
                                    _a.label = 2;
                                case 2:
                                    _a.trys.push([2, 4, , 5]);
                                    return [4 /*yield*/, storage.updateUserType(user.id, "super_admin")];
                                case 3:
                                    user = _a.sent();
                                    return [3 /*break*/, 5];
                                case 4:
                                    err_1 = _a.sent();
                                    console.warn("⚠️  Failed to auto-upgrade super admin role:", err_1);
                                    return [3 /*break*/, 5];
                                case 5:
                                    if (!(user &&
                                        !user.emailVerified &&
                                        (user.userType === "admin" || user.userType === "super_admin"))) return [3 /*break*/, 9];
                                    _a.label = 6;
                                case 6:
                                    _a.trys.push([6, 8, , 9]);
                                    return [4 /*yield*/, storage.updateUser(user.id, { emailVerified: true })];
                                case 7:
                                    user = _a.sent();
                                    return [3 /*break*/, 9];
                                case 8:
                                    err_2 = _a.sent();
                                    console.warn("⚠️  Failed to auto-verify admin account email:", err_2);
                                    return [3 /*break*/, 9];
                                case 9:
                                    done(null, user);
                                    return [3 /*break*/, 11];
                                case 10:
                                    error_2 = _a.sent();
                                    // For user not found or other errors, return false to clear the session
                                    done(null, false);
                                    return [3 /*break*/, 11];
                                case 11: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Google Strategy and routes for all users (only enabled if credentials are configured)
                    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
                        console.log("Setting up Google OAuth strategies...");
                        console.log("🔵 Google OAuth customer callback URL:", "".concat(baseUrl, "/api/auth/google/customer/callback"));
                        console.log("🔵 Google OAuth restaurant callback URL:", "".concat(baseUrl, "/api/auth/google/restaurant/callback"));
                        passport.use("google-customer", new GoogleStrategy({
                            clientID: process.env.GOOGLE_CLIENT_ID,
                            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                            callbackURL: "".concat(baseUrl, "/api/auth/google/customer/callback"),
                            passReqToCallback: true,
                        }, function (req, accessToken, refreshToken, profile, done) { return __awaiter(_this, void 0, void 0, function () {
                            var userData, user, error_3;
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                            return __generator(this, function (_o) {
                                switch (_o.label) {
                                    case 0:
                                        _o.trys.push([0, 3, , 4]);
                                        console.log("🔍 Google customer profile data received:", {
                                            id: profile.id,
                                            displayName: profile.displayName,
                                            emails: profile.emails,
                                            name: profile.name,
                                            photos: profile.photos,
                                            _json: profile._json
                                                ? {
                                                    given_name: profile._json.given_name,
                                                    family_name: profile._json.family_name,
                                                    email: profile._json.email,
                                                    picture: profile._json.picture,
                                                }
                                                : null,
                                        });
                                        userData = {
                                            googleId: profile.id,
                                            email: ((_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || ((_c = profile._json) === null || _c === void 0 ? void 0 : _c.email) || null,
                                            firstName: ((_d = profile.name) === null || _d === void 0 ? void 0 : _d.givenName) ||
                                                ((_e = profile._json) === null || _e === void 0 ? void 0 : _e.given_name) ||
                                                ((_f = profile.displayName) === null || _f === void 0 ? void 0 : _f.split(" ")[0]) ||
                                                "Google",
                                            lastName: ((_g = profile.name) === null || _g === void 0 ? void 0 : _g.familyName) ||
                                                ((_h = profile._json) === null || _h === void 0 ? void 0 : _h.family_name) ||
                                                ((_j = profile.displayName) === null || _j === void 0 ? void 0 : _j.split(" ").slice(1).join(" ")) ||
                                                "User",
                                            profileImageUrl: ((_l = (_k = profile.photos) === null || _k === void 0 ? void 0 : _k[0]) === null || _l === void 0 ? void 0 : _l.value) || ((_m = profile._json) === null || _m === void 0 ? void 0 : _m.picture) || null,
                                            googleAccessToken: accessToken,
                                        };
                                        console.log("🔍 Processed Google customer user data:", {
                                            googleId: userData.googleId,
                                            email: userData.email,
                                            firstName: userData.firstName,
                                            lastName: userData.lastName,
                                            hasProfileImage: !!userData.profileImageUrl,
                                        });
                                        return [4 /*yield*/, storage.upsertUserByAuth("google", userData, "customer")];
                                    case 1:
                                        user = _o.sent();
                                        return [4 /*yield*/, applyAffiliateReferral(req, user)];
                                    case 2:
                                        _o.sent();
                                        req.session.oauthUserType = undefined;
                                        console.log("✅ Google customer user created/updated successfully:", { userId: user.id, email: user.email });
                                        // LISA Phase 4A: Emit claim for OAuth login
                                        storage
                                            .emitClaim({
                                            subjectType: "user",
                                            subjectId: user.id,
                                            app: "mealscout",
                                            claimType: "oauth_provider_used",
                                            claimValue: { provider: "google", email: userData.email },
                                            source: "oauth",
                                        })
                                            .catch(function (err) { return console.error("Failed to emit LISA claim:", err); });
                                        // Send welcome email with verification link (don't block auth flow)
                                        void sendWelcomeOrVerification(user, req, "customer");
                                        // Send admin signup notification with context asynchronously
                                        emailService
                                            .sendAdminSignupNotification(user, {
                                            signupMethod: "google",
                                        })
                                            .catch(function (err) {
                                            return console.error("Failed to send admin signup notification:", err);
                                        });
                                        return [2 /*return*/, done(null, user)];
                                    case 3:
                                        error_3 = _o.sent();
                                        console.error("❌ Google customer authentication error:", error_3);
                                        console.error("❌ Profile data that caused error:", profile);
                                        return [2 /*return*/, done(error_3, null)];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }));
                        passport.use("google-restaurant", new GoogleStrategy({
                            clientID: process.env.GOOGLE_CLIENT_ID,
                            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                            callbackURL: "".concat(baseUrl, "/api/auth/google/restaurant/callback"),
                            passReqToCallback: true,
                        }, function (req, accessToken, refreshToken, profile, done) { return __awaiter(_this, void 0, void 0, function () {
                            var userData, userType, user, error_4;
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                            return __generator(this, function (_o) {
                                switch (_o.label) {
                                    case 0:
                                        _o.trys.push([0, 3, , 4]);
                                        console.log("🔍 Google restaurant profile data received:", {
                                            id: profile.id,
                                            displayName: profile.displayName,
                                            emails: profile.emails,
                                            name: profile.name,
                                            photos: profile.photos,
                                            _json: profile._json
                                                ? {
                                                    given_name: profile._json.given_name,
                                                    family_name: profile._json.family_name,
                                                    email: profile._json.email,
                                                    picture: profile._json.picture,
                                                }
                                                : null,
                                        });
                                        userData = {
                                            googleId: profile.id,
                                            email: ((_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || ((_c = profile._json) === null || _c === void 0 ? void 0 : _c.email) || null,
                                            firstName: ((_d = profile.name) === null || _d === void 0 ? void 0 : _d.givenName) ||
                                                ((_e = profile._json) === null || _e === void 0 ? void 0 : _e.given_name) ||
                                                ((_f = profile.displayName) === null || _f === void 0 ? void 0 : _f.split(" ")[0]) ||
                                                "Google",
                                            lastName: ((_g = profile.name) === null || _g === void 0 ? void 0 : _g.familyName) ||
                                                ((_h = profile._json) === null || _h === void 0 ? void 0 : _h.family_name) ||
                                                ((_j = profile.displayName) === null || _j === void 0 ? void 0 : _j.split(" ").slice(1).join(" ")) ||
                                                "User",
                                            profileImageUrl: ((_l = (_k = profile.photos) === null || _k === void 0 ? void 0 : _k[0]) === null || _l === void 0 ? void 0 : _l.value) || ((_m = profile._json) === null || _m === void 0 ? void 0 : _m.picture) || null,
                                            googleAccessToken: accessToken,
                                        };
                                        console.log("🔍 Processed Google restaurant user data:", {
                                            googleId: userData.googleId,
                                            email: userData.email,
                                            firstName: userData.firstName,
                                            lastName: userData.lastName,
                                            hasProfileImage: !!userData.profileImageUrl,
                                        });
                                        userType = getOauthUserType(req, "restaurant_owner");
                                        return [4 /*yield*/, storage.upsertUserByAuth("google", userData, userType === "customer" ? "restaurant_owner" : userType)];
                                    case 1:
                                        user = _o.sent();
                                        return [4 /*yield*/, applyAffiliateReferral(req, user)];
                                    case 2:
                                        _o.sent();
                                        req.session.oauthUserType = undefined;
                                        console.log("✅ Google restaurant user created/updated successfully:", { userId: user.id, email: user.email });
                                        // LISA Phase 4A: Emit claim for OAuth login
                                        storage
                                            .emitClaim({
                                            subjectType: "user",
                                            subjectId: user.id,
                                            app: "mealscout",
                                            claimType: "oauth_provider_used",
                                            claimValue: {
                                                provider: "google",
                                                email: userData.email,
                                                userType: "restaurant_owner",
                                            },
                                            source: "oauth",
                                        })
                                            .catch(function (err) { return console.error("Failed to emit LISA claim:", err); });
                                        // Send welcome email with verification link (don't block auth flow)
                                        void sendWelcomeOrVerification(user, req, "restaurant owner");
                                        // Send admin signup notification with context asynchronously
                                        emailService
                                            .sendAdminSignupNotification(user, {
                                            signupMethod: "google",
                                        })
                                            .catch(function (err) {
                                            return console.error("Failed to send admin signup notification:", err);
                                        });
                                        return [2 /*return*/, done(null, user)];
                                    case 3:
                                        error_4 = _o.sent();
                                        console.error("❌ Google restaurant authentication error:", error_4);
                                        console.error("❌ Profile data that caused error:", profile);
                                        return [2 /*return*/, done(error_4, null)];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }));
                        // Google OAuth routes for customers
                        app.get("/api/auth/google/customer", function (req, res, next) {
                            req.session.oauthUserType = "customer";
                            passport.authenticate("google-customer", {
                                scope: ["profile", "email"],
                            })(req, res, next);
                        });
                        app.get("/api/auth/google/customer/callback", function (req, res, next) {
                            console.log("🔍 Google customer OAuth callback reached:", {
                                query: req.query,
                                hasError: !!req.query.error,
                                errorDescription: req.query.error_description,
                            });
                            next();
                        }, passport.authenticate("google-customer", {
                            failureRedirect: "/?error=auth_failed",
                        }), function (req, res) {
                            // Ensure session is saved before redirecting
                            req.session.save(function (err) {
                                if (err) {
                                    console.error("❌ Session save error:", err);
                                    return res.redirect("/?error=session_error");
                                }
                                console.log("✅ Google customer OAuth success, session saved, redirecting...");
                                res.redirect("".concat(baseUrl, "/"));
                            });
                        });
                        // Google OAuth routes for restaurant owners
                        app.get("/api/auth/google/restaurant", function (req, res, next) {
                            var desiredType = typeof req.query.userType === "string"
                                ? req.query.userType
                                : "restaurant_owner";
                            req.session.oauthUserType = oauthUserTypeAllowList.has(desiredType)
                                ? desiredType
                                : "restaurant_owner";
                            passport.authenticate("google-restaurant", {
                                scope: ["profile", "email"],
                            })(req, res, next);
                        });
                        app.get("/api/auth/google/restaurant/callback", function (req, res, next) {
                            console.log("🔍 Google restaurant OAuth callback reached:", {
                                query: req.query,
                                hasError: !!req.query.error,
                                errorDescription: req.query.error_description,
                            });
                            next();
                        }, passport.authenticate("google-restaurant", {
                            failureRedirect: "/restaurant-signup?error=auth_failed",
                        }), function (req, res) {
                            // Ensure session is saved before redirecting
                            req.session.save(function (err) {
                                if (err) {
                                    console.error("❌ Session save error:", err);
                                    return res.redirect("/restaurant-signup?error=session_error");
                                }
                                console.log("✅ Google restaurant OAuth success, session saved, redirecting...");
                                res.redirect("".concat(baseUrl, "/restaurant-signup"));
                            });
                        });
                    }
                    else {
                        console.log("Google OAuth not configured: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are missing");
                        // Add error handling routes for when Google OAuth is not configured
                        app.get("/api/auth/google/customer", function (req, res) {
                            res.status(503).json({
                                error: "Google OAuth not configured",
                                message: "Google authentication is not available at this time",
                            });
                        });
                        app.get("/api/auth/google/restaurant", function (req, res) {
                            res.status(503).json({
                                error: "Google OAuth not configured",
                                message: "Google authentication is not available at this time",
                            });
                        });
                        app.get("/api/auth/google/customer/callback", function (req, res) {
                            res.redirect("/?error=google_not_configured");
                        });
                        app.get("/api/auth/google/restaurant/callback", function (req, res) {
                            res.redirect("/restaurant-signup?error=google_not_configured");
                        });
                    }
                    // Facebook Strategy (shared with TradeScout)
                    if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
                        console.log("Setting up Facebook OAuth strategy (shared with TradeScout)...");
                        passport.use(new FacebookStrategy({
                            clientID: process.env.FACEBOOK_APP_ID,
                            clientSecret: process.env.FACEBOOK_APP_SECRET,
                            callbackURL: (function () {
                                var callbackUrl = "".concat(baseUrl, "/api/auth/facebook/callback");
                                console.log("🔵 Facebook OAuth callback URL:", callbackUrl);
                                return callbackUrl;
                            })(),
                            profileFields: [
                                "id",
                                "displayName",
                                "emails",
                                "photos",
                                "first_name",
                                "last_name",
                            ],
                            passReqToCallback: true, // Enable req access to retrieve app param from session
                        }, function (req, accessToken, refreshToken, profile, done) { return __awaiter(_this, void 0, void 0, function () {
                            var userData, appContext, userType, user, error_5;
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
                            return __generator(this, function (_q) {
                                switch (_q.label) {
                                    case 0:
                                        _q.trys.push([0, 3, , 4]);
                                        console.log("🔍 Facebook profile data received:", {
                                            id: profile.id,
                                            displayName: profile.displayName,
                                            emails: profile.emails,
                                            name: profile.name,
                                            photos: profile.photos,
                                            appContext: ((_a = req.session) === null || _a === void 0 ? void 0 : _a.fbAppContext) || "mealscout",
                                            _json: profile._json
                                                ? {
                                                    first_name: profile._json.first_name,
                                                    last_name: profile._json.last_name,
                                                    email: profile._json.email,
                                                }
                                                : null,
                                        });
                                        userData = {
                                            facebookId: profile.id,
                                            email: ((_c = (_b = profile.emails) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.value) || ((_d = profile._json) === null || _d === void 0 ? void 0 : _d.email) || null,
                                            firstName: ((_e = profile.name) === null || _e === void 0 ? void 0 : _e.givenName) ||
                                                ((_f = profile._json) === null || _f === void 0 ? void 0 : _f.first_name) ||
                                                ((_g = profile.displayName) === null || _g === void 0 ? void 0 : _g.split(" ")[0]) ||
                                                "Facebook",
                                            lastName: ((_h = profile.name) === null || _h === void 0 ? void 0 : _h.familyName) ||
                                                ((_j = profile._json) === null || _j === void 0 ? void 0 : _j.last_name) ||
                                                ((_k = profile.displayName) === null || _k === void 0 ? void 0 : _k.split(" ").slice(1).join(" ")) ||
                                                "User",
                                            profileImageUrl: ((_m = (_l = profile.photos) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.value) || null,
                                            facebookAccessToken: accessToken,
                                        };
                                        console.log("🔍 Processed Facebook user data:", {
                                            facebookId: userData.facebookId,
                                            email: userData.email,
                                            firstName: userData.firstName,
                                            lastName: userData.lastName,
                                            appContext: ((_o = req.session) === null || _o === void 0 ? void 0 : _o.fbAppContext) || "mealscout",
                                            hasProfileImage: !!userData.profileImageUrl,
                                        });
                                        appContext = (((_p = req.session) === null || _p === void 0 ? void 0 : _p.fbAppContext) || "mealscout");
                                        userType = getOauthUserType(req, "customer");
                                        return [4 /*yield*/, storage.upsertUserByAuth("facebook", userData, userType, appContext)];
                                    case 1:
                                        user = _q.sent();
                                        return [4 /*yield*/, applyAffiliateReferral(req, user)];
                                    case 2:
                                        _q.sent();
                                        req.session.oauthUserType = undefined;
                                        console.log("✅ Facebook user created/updated successfully:", {
                                            userId: user.id,
                                            email: user.email,
                                            appContext: appContext,
                                        });
                                        // LISA Phase 4A: Emit claim for OAuth login
                                        storage
                                            .emitClaim({
                                            subjectType: "user",
                                            subjectId: user.id,
                                            app: appContext,
                                            claimType: "oauth_provider_used",
                                            claimValue: { provider: "facebook", email: userData.email },
                                            source: "oauth",
                                        })
                                            .catch(function (err) { return console.error("Failed to emit LISA claim:", err); });
                                        // Send welcome email with verification link (don't block auth flow)
                                        void sendWelcomeOrVerification(user, req, "customer");
                                        // Send admin signup notification with context asynchronously
                                        emailService
                                            .sendAdminSignupNotification(user, {
                                            signupMethod: "facebook",
                                        })
                                            .catch(function (err) {
                                            return console.error("Failed to send admin signup notification:", err);
                                        });
                                        return [2 /*return*/, done(null, user)];
                                    case 3:
                                        error_5 = _q.sent();
                                        console.error("❌ Facebook authentication error:", error_5);
                                        console.error("❌ Profile data that caused error:", profile);
                                        return [2 /*return*/, done(error_5, null)];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }));
                        // Facebook auth routes with multi-app support
                        app.get("/api/auth/facebook", function (req, res, next) {
                            // Capture app parameter from query string (default: mealscout)
                            var appContext = req.query.app || "mealscout";
                            // Validate app context
                            if (appContext !== "mealscout" && appContext !== "tradescout") {
                                return res.status(400).json({
                                    error: 'Invalid app parameter. Must be "mealscout" or "tradescout"',
                                });
                            }
                            // Store app context in session for callback retrieval
                            req.session.fbAppContext = appContext;
                            var desiredUserType = typeof req.query.userType === "string"
                                ? req.query.userType
                                : "customer";
                            req.session.oauthUserType = oauthUserTypeAllowList.has(desiredUserType)
                                ? desiredUserType
                                : "customer";
                            console.log("\uD83D\uDD35 Starting Facebook OAuth flow with app context: ".concat(appContext));
                            next();
                        }, passport.authenticate("facebook", {
                            scope: ["email", "public_profile"],
                        }));
                        app.get("/api/auth/facebook/callback", function (req, res, next) {
                            console.log("🔍 Facebook OAuth callback reached:", {
                                query: req.query,
                                hasError: !!req.query.error,
                                errorDescription: req.query.error_description,
                                sessionAppContext: req.session.fbAppContext,
                            });
                            next();
                        }, passport.authenticate("facebook", {
                            failureRedirect: "/?error=auth_failed&source=facebook",
                        }), function (req, res) {
                            var user = req.user;
                            var appContext = req.session.fbAppContext || "mealscout";
                            console.log("✅ Facebook OAuth callback success:", {
                                userId: user === null || user === void 0 ? void 0 : user.id,
                                appContext: appContext,
                                userAppContext: user === null || user === void 0 ? void 0 : user.appContext,
                            });
                            // Save session
                            req.session.save(function (err) {
                                if (err) {
                                    console.error("❌ Session save error:", err);
                                    return res.redirect("/?error=session_error");
                                }
                                // Redirect to appropriate domain
                                var frontendBase = process.env.PUBLIC_BASE_URL || "http://localhost:5000";
                                var redirectUrls = {
                                    mealscout: "".concat(frontendBase, "/?auth=success&t=") + Date.now(),
                                    tradescout: "https://www.thetradescout.com/?auth=success&t=" + Date.now(),
                                };
                                var redirectUrl = redirectUrls[appContext];
                                console.log("\u2705 Redirecting to: ".concat(redirectUrl));
                                res.redirect(redirectUrl);
                            });
                        });
                        console.log("✅ Facebook OAuth strategy configured successfully (multi-app enabled)");
                    }
                    else {
                        console.log("Facebook OAuth not configured: FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables are missing");
                    }
                    normalizePhone = function (phone) { return phone.replace(/\D/g, ""); };
                    requirePhoneVerification = false;
                    verifyPhoneCode = function (phone, code) { return __awaiter(_this, void 0, void 0, function () {
                        var tokenHash, token;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    tokenHash = crypto.createHash("sha256").update(code).digest("hex");
                                    return [4 /*yield*/, storage.getPhoneVerificationTokenByHash(phone, tokenHash)];
                                case 1:
                                    token = _a.sent();
                                    if (!token) {
                                        return [2 /*return*/, false];
                                    }
                                    return [4 /*yield*/, storage.markPhoneVerificationTokenUsed(token.id)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/, true];
                            }
                        });
                    }); };
                    app.post("/api/auth/phone/send-code", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var phone, normalizedPhone, existingUser, code, tokenHash, expiresAt, smsSent, error_6;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 6, , 7]);
                                    phone = req.body.phone;
                                    if (!phone || typeof phone !== "string") {
                                        return [2 /*return*/, res.status(400).json({ error: "Phone number is required" })];
                                    }
                                    normalizedPhone = normalizePhone(phone);
                                    if (normalizedPhone.length < 10) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Valid phone number is required" })];
                                    }
                                    return [4 /*yield*/, storage.getUserByPhone(normalizedPhone)];
                                case 1:
                                    existingUser = _a.sent();
                                    if (existingUser) {
                                        return [2 /*return*/, res.status(400).json({ error: "Phone number already in use" })];
                                    }
                                    return [4 /*yield*/, storage.deleteExpiredPhoneVerificationTokens()];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, storage.deletePhoneVerificationTokens(normalizedPhone)];
                                case 3:
                                    _a.sent();
                                    code = String(Math.floor(100000 + Math.random() * 900000));
                                    tokenHash = crypto.createHash("sha256").update(code).digest("hex");
                                    expiresAt = new Date(Date.now() + 10 * 60 * 1000);
                                    return [4 /*yield*/, storage.createPhoneVerificationToken({
                                            phone: normalizedPhone,
                                            tokenHash: tokenHash,
                                            expiresAt: expiresAt,
                                            requestIp: req.ip || req.connection.remoteAddress || undefined,
                                            userAgent: req.get("User-Agent") || undefined,
                                        })];
                                case 4:
                                    _a.sent();
                                    return [4 /*yield*/, sendSms(normalizedPhone, "Your MealScout verification code is ".concat(code, ". It expires in 10 minutes."))];
                                case 5:
                                    smsSent = _a.sent();
                                    if (!smsSent) {
                                        return [2 /*return*/, res
                                                .status(500)
                                                .json({ error: "Failed to send verification code" })];
                                    }
                                    res.json({ success: true });
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_6 = _a.sent();
                                    console.error("Phone verification send error:", error_6);
                                    res.status(500).json({ error: "Unable to send verification code" });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    app.post("/api/auth/phone/verify-code", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, phone, code, normalizedPhone, ok, error_7;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    _a = req.body, phone = _a.phone, code = _a.code;
                                    if (!phone || !code) {
                                        return [2 /*return*/, res.status(400).json({ error: "Phone and code are required" })];
                                    }
                                    normalizedPhone = normalizePhone(phone);
                                    return [4 /*yield*/, verifyPhoneCode(normalizedPhone, String(code))];
                                case 1:
                                    ok = _b.sent();
                                    if (!ok) {
                                        return [2 /*return*/, res.status(400).json({ error: "Invalid or expired code" })];
                                    }
                                    res.json({ success: true });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_7 = _b.sent();
                                    console.error("Phone verification error:", error_7);
                                    res.status(500).json({ error: "Unable to verify code" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Email/password registration for customers
                    app.post("/api/auth/customer/register", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, email, firstName, lastName, phone, password, otpCode, normalizedPhone, existingUser, existingPhone, phoneVerified, passwordHash, userData, user_1, error_8;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 8, , 9]);
                                    _a = req.body, email = _a.email, firstName = _a.firstName, lastName = _a.lastName, phone = _a.phone, password = _a.password, otpCode = _a.otpCode;
                                    if (!email || !firstName || !lastName || !phone || !password) {
                                        return [2 /*return*/, res.status(400).json({ error: "All fields are required" })];
                                    }
                                    if (!isPasswordStrong(password)) {
                                        return [2 /*return*/, res.status(400).json({ error: PASSWORD_REQUIREMENTS })];
                                    }
                                    normalizedPhone = normalizePhone(phone);
                                    if (normalizedPhone.length < 10) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Valid phone number is required" })];
                                    }
                                    return [4 /*yield*/, storage.getUserByEmail(email)];
                                case 1:
                                    existingUser = _b.sent();
                                    if (existingUser) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "User with this email already exists" })];
                                    }
                                    return [4 /*yield*/, storage.getUserByPhone(normalizedPhone)];
                                case 2:
                                    existingPhone = _b.sent();
                                    if (existingPhone) {
                                        return [2 /*return*/, res.status(400).json({ error: "Phone number already in use" })];
                                    }
                                    if (!requirePhoneVerification) return [3 /*break*/, 4];
                                    if (!otpCode) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Verification code is required" })];
                                    }
                                    return [4 /*yield*/, verifyPhoneCode(normalizedPhone, String(otpCode))];
                                case 3:
                                    phoneVerified = _b.sent();
                                    if (!phoneVerified) {
                                        return [2 /*return*/, res.status(400).json({ error: "Phone verification failed" })];
                                    }
                                    _b.label = 4;
                                case 4: return [4 /*yield*/, bcrypt.hash(password, 10)];
                                case 5:
                                    passwordHash = _b.sent();
                                    userData = {
                                        email: email,
                                        firstName: firstName,
                                        lastName: lastName,
                                        phone: normalizedPhone,
                                        passwordHash: passwordHash,
                                    };
                                    return [4 /*yield*/, storage.upsertUserByAuth("email", userData, "customer")];
                                case 6:
                                    user_1 = _b.sent();
                                    return [4 /*yield*/, applyAffiliateReferral(req, user_1)];
                                case 7:
                                    _b.sent();
                                    // Send welcome email with verification link (don't block auth flow)
                                    void sendWelcomeOrVerification(user_1, req, "customer");
                                    // Send admin signup notification with context asynchronously
                                    emailService
                                        .sendAdminSignupNotification(user_1, {
                                        signupMethod: "email",
                                    })
                                        .catch(function (err) {
                                        return console.error("Failed to send admin signup notification:", err);
                                    });
                                    req.login(user_1, function (err) {
                                        if (err) {
                                            return res
                                                .status(500)
                                                .json({ error: "Failed to log in after registration" });
                                        }
                                        req.session.save(function (saveErr) {
                                            if (saveErr) {
                                                return res
                                                    .status(500)
                                                    .json({ error: "Failed to persist session" });
                                            }
                                            res.json({
                                                user: sanitizeUser(user_1),
                                                message: "Registration successful",
                                            });
                                        });
                                    });
                                    return [3 /*break*/, 9];
                                case 8:
                                    error_8 = _b.sent();
                                    console.error("Customer registration error:", error_8);
                                    res.status(500).json({ error: "Internal server error" });
                                    return [3 /*break*/, 9];
                                case 9: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Email/password registration for restaurant owners
                    app.post("/api/auth/restaurant/register", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, email, firstName, lastName, phone, password, otpCode, normalizedPhone, existingUser, existingPhone, phoneVerified, passwordHash, userData, user_2, error_9;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 8, , 9]);
                                    _a = req.body, email = _a.email, firstName = _a.firstName, lastName = _a.lastName, phone = _a.phone, password = _a.password, otpCode = _a.otpCode;
                                    if (!email || !firstName || !lastName || !phone || !password) {
                                        return [2 /*return*/, res.status(400).json({ error: "All fields are required" })];
                                    }
                                    if (!isPasswordStrong(password)) {
                                        return [2 /*return*/, res.status(400).json({ error: PASSWORD_REQUIREMENTS })];
                                    }
                                    normalizedPhone = normalizePhone(phone);
                                    if (normalizedPhone.length < 10) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Valid phone number is required" })];
                                    }
                                    return [4 /*yield*/, storage.getUserByEmail(email)];
                                case 1:
                                    existingUser = _b.sent();
                                    if (existingUser) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "User with this email already exists" })];
                                    }
                                    return [4 /*yield*/, storage.getUserByPhone(normalizedPhone)];
                                case 2:
                                    existingPhone = _b.sent();
                                    if (existingPhone) {
                                        return [2 /*return*/, res.status(400).json({ error: "Phone number already in use" })];
                                    }
                                    if (!requirePhoneVerification) return [3 /*break*/, 4];
                                    if (!otpCode) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Verification code is required" })];
                                    }
                                    return [4 /*yield*/, verifyPhoneCode(normalizedPhone, String(otpCode))];
                                case 3:
                                    phoneVerified = _b.sent();
                                    if (!phoneVerified) {
                                        return [2 /*return*/, res.status(400).json({ error: "Phone verification failed" })];
                                    }
                                    _b.label = 4;
                                case 4: return [4 /*yield*/, bcrypt.hash(password, 10)];
                                case 5:
                                    passwordHash = _b.sent();
                                    userData = {
                                        email: email,
                                        firstName: firstName,
                                        lastName: lastName,
                                        phone: normalizedPhone,
                                        passwordHash: passwordHash,
                                    };
                                    return [4 /*yield*/, storage.upsertUserByAuth("email", userData, "restaurant_owner")];
                                case 6:
                                    user_2 = _b.sent();
                                    return [4 /*yield*/, applyAffiliateReferral(req, user_2)];
                                case 7:
                                    _b.sent();
                                    // Send welcome email with verification link (don't block auth flow)
                                    void sendWelcomeOrVerification(user_2, req, "restaurant owner");
                                    // Send admin signup notification with context asynchronously
                                    emailService
                                        .sendAdminSignupNotification(user_2, {
                                        signupMethod: "email",
                                    })
                                        .catch(function (err) {
                                        return console.error("Failed to send admin signup notification:", err);
                                    });
                                    req.login(user_2, function (err) {
                                        if (err) {
                                            return res
                                                .status(500)
                                                .json({ error: "Failed to log in after registration" });
                                        }
                                        req.session.save(function (saveErr) {
                                            if (saveErr) {
                                                return res
                                                    .status(500)
                                                    .json({ error: "Failed to persist session" });
                                            }
                                            res.json({
                                                user: sanitizeUser(user_2),
                                                message: "Registration successful",
                                            });
                                        });
                                    });
                                    return [3 /*break*/, 9];
                                case 8:
                                    error_9 = _b.sent();
                                    console.error("Restaurant registration error:", error_9);
                                    res.status(500).json({ error: "Internal server error" });
                                    return [3 /*break*/, 9];
                                case 9: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Email/password login for restaurant owners
                    app.post("/api/auth/restaurant/login", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, email, password, user_3, _b, error_10;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 4, , 5]);
                                    _a = req.body, email = _a.email, password = _a.password;
                                    if (!email || !password) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Email and password are required" })];
                                    }
                                    return [4 /*yield*/, storage.getUserByEmail(email)];
                                case 1:
                                    user_3 = _c.sent();
                                    if (!user_3 || user_3.userType !== "restaurant_owner") {
                                        return [2 /*return*/, res.status(401).json({ error: "Invalid email or password" })];
                                    }
                                    _b = !user_3.passwordHash;
                                    if (_b) return [3 /*break*/, 3];
                                    return [4 /*yield*/, bcrypt.compare(password, user_3.passwordHash)];
                                case 2:
                                    _b = !(_c.sent());
                                    _c.label = 3;
                                case 3:
                                    if (_b) {
                                        return [2 /*return*/, res.status(401).json({ error: "Invalid email or password" })];
                                    }
                                    req.login(user_3, function (err) {
                                        if (err) {
                                            return res.status(500).json({ error: "Failed to log in" });
                                        }
                                        req.session.save(function (saveErr) {
                                            if (saveErr) {
                                                return res
                                                    .status(500)
                                                    .json({ error: "Failed to persist session" });
                                            }
                                            res.json({ user: sanitizeUser(user_3), message: "Login successful" });
                                        });
                                    });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_10 = _c.sent();
                                    console.error("Restaurant login error:", error_10);
                                    res.status(500).json({ error: "Internal server error" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Email/password login for all users
                    app.post("/api/auth/login", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, email_1, password, user_4, passwordMatch, error_11;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    _a = req.body, email_1 = _a.email, password = _a.password;
                                    console.log("\uD83D\uDD10 Login attempt for: ".concat(email_1));
                                    if (!email_1 || !password) {
                                        console.log("❌ Missing email or password");
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Email and password are required" })];
                                    }
                                    return [4 /*yield*/, storage.getUserByEmail(email_1)];
                                case 1:
                                    user_4 = _b.sent();
                                    if (!user_4) {
                                        console.log("\u274C User not found: ".concat(email_1));
                                        return [2 /*return*/, res.status(401).json({ error: "Invalid email or password" })];
                                    }
                                    console.log("\u2705 User found: ".concat(user_4.id, ", userType: ").concat(user_4.userType, ", hasPassword: ").concat(!!user_4.passwordHash));
                                    if (!user_4.passwordHash) {
                                        console.log("❌ User has no password hash");
                                        return [2 /*return*/, res.status(401).json({ error: "Invalid email or password" })];
                                    }
                                    return [4 /*yield*/, bcrypt.compare(password, user_4.passwordHash)];
                                case 2:
                                    passwordMatch = _b.sent();
                                    console.log("\uD83D\uDD11 Password match: ".concat(passwordMatch));
                                    if (!passwordMatch) {
                                        console.log("❌ Password does not match");
                                        return [2 /*return*/, res.status(401).json({ error: "Invalid email or password" })];
                                    }
                                    // Use req.login to properly establish the session
                                    console.log("🔄 Attempting to establish session...");
                                    req.login(user_4, function (err) {
                                        if (err) {
                                            console.error("❌ Session login error:", err);
                                            return res.status(500).json({ error: "Failed to establish session" });
                                        }
                                        req.session.save(function (saveErr) {
                                            if (saveErr) {
                                                return res
                                                    .status(500)
                                                    .json({ error: "Failed to persist session" });
                                            }
                                            console.log("\u2705 Login successful for: ".concat(email_1));
                                            res.json({ user: sanitizeUser(user_4), message: "Login successful" });
                                        });
                                    });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_11 = _b.sent();
                                    console.error("❌ Login error:", error_11);
                                    res.status(500).json({ error: "Internal server error" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // TradeScout SSO endpoint - accepts a signed JWT from TradeScout and
                    // creates/links a MealScout user, then establishes a session.
                    app.post("/api/auth/tradescout/sso", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var secret, authHeader, bearerToken, token, decoded, roles, mapRolesToUserType, userType, tsUserData, user_5, error_12;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    secret = process.env.TRADESCOUT_JWT_SECRET;
                                    if (!secret) {
                                        return [2 /*return*/, res.status(503).json({
                                                error: "TradeScout SSO not configured",
                                                message: "TRADESCOUT_JWT_SECRET is not set on the MealScout server",
                                            })];
                                    }
                                    authHeader = req.headers["authorization"];
                                    bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
                                        ? authHeader.slice("Bearer ".length)
                                        : undefined;
                                    token = (req.body && req.body.token) || bearerToken;
                                    if (!token || typeof token !== "string") {
                                        return [2 /*return*/, res.status(400).json({ error: "SSO token is required" })];
                                    }
                                    decoded = void 0;
                                    try {
                                        decoded = jwt.verify(token, secret);
                                    }
                                    catch (err) {
                                        console.error("TradeScout SSO token verification failed:", err);
                                        return [2 /*return*/, res.status(401).json({ error: "Invalid SSO token" })];
                                    }
                                    roles = Array.isArray(decoded.roles)
                                        ? decoded.roles
                                        : typeof decoded.role === "string"
                                            ? [decoded.role]
                                            : undefined;
                                    mapRolesToUserType = function (r) {
                                        if (!r || r.length === 0)
                                            return "customer";
                                        if (r.includes("mealscout_super_admin"))
                                            return "super_admin";
                                        if (r.includes("mealscout_admin") || r.includes("admin"))
                                            return "admin";
                                        if (r.includes("restaurant_owner") ||
                                            r.includes("merchant") ||
                                            r.includes("vendor"))
                                            return "restaurant_owner";
                                        return "customer";
                                    };
                                    userType = mapRolesToUserType(roles);
                                    tsUserData = {
                                        tradescoutId: String(decoded.sub || decoded.id || decoded.userId),
                                        email: (_a = decoded.email) !== null && _a !== void 0 ? _a : null,
                                        firstName: decoded.given_name ||
                                            decoded.firstName ||
                                            (decoded.name ? String(decoded.name).split(" ")[0] : null),
                                        lastName: decoded.family_name ||
                                            decoded.lastName ||
                                            (decoded.name
                                                ? String(decoded.name).split(" ").slice(1).join(" ") || null
                                                : null),
                                        roles: roles !== null && roles !== void 0 ? roles : null,
                                    };
                                    if (!tsUserData.tradescoutId) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "SSO token missing subject (sub)" })];
                                    }
                                    return [4 /*yield*/, storage.upsertUserByAuth("tradescout", tsUserData, userType === "super_admin"
                                            ? "admin"
                                            : userType)];
                                case 1:
                                    user_5 = _b.sent();
                                    return [4 /*yield*/, applyAffiliateReferral(req, user_5)];
                                case 2:
                                    _b.sent();
                                    // Establish a standard Passport session using req.login
                                    req.login(user_5, function (err) {
                                        if (err) {
                                            console.error("TradeScout SSO session error:", err);
                                            return res
                                                .status(500)
                                                .json({ error: "Failed to establish SSO session" });
                                        }
                                        res.json({
                                            user: sanitizeUser(user_5),
                                            message: "TradeScout SSO login successful",
                                        });
                                    });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_12 = _b.sent();
                                    console.error("TradeScout SSO error:", error_12);
                                    res.status(500).json({ error: "Unable to complete SSO login" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Unified logout route
                    app.post("/api/auth/logout", function (req, res) {
                        req.logout(function (err) {
                            if (err) {
                                return res.status(500).json({ error: "Failed to logout" });
                            }
                            res.json({ message: "Logout successful" });
                        });
                    });
                    // Change password (for users with temp passwords or general password change)
                    app.post("/api/auth/change-password", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, oldPassword, newPassword, user, passwordMatch, newPasswordHash, error_13;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    if (!req.isAuthenticated()) {
                                        return [2 /*return*/, res.status(401).json({ error: "Not authenticated" })];
                                    }
                                    _a = req.body, oldPassword = _a.oldPassword, newPassword = _a.newPassword;
                                    if (!oldPassword || !newPassword) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Old and new passwords are required" })];
                                    }
                                    if (!isPasswordStrong(newPassword)) {
                                        return [2 /*return*/, res.status(400).json({ error: PASSWORD_REQUIREMENTS })];
                                    }
                                    user = req.user;
                                    if (!user.passwordHash) {
                                        return [2 /*return*/, res.status(400).json({ error: "User has no password set" })];
                                    }
                                    return [4 /*yield*/, bcrypt.compare(oldPassword, user.passwordHash)];
                                case 1:
                                    passwordMatch = _b.sent();
                                    if (!passwordMatch) {
                                        return [2 /*return*/, res.status(401).json({ error: "Current password is incorrect" })];
                                    }
                                    return [4 /*yield*/, bcrypt.hash(newPassword, 12)];
                                case 2:
                                    newPasswordHash = _b.sent();
                                    return [4 /*yield*/, storage.updateUserPassword(user.id, newPasswordHash, false)];
                                case 3:
                                    _b.sent();
                                    res.json({ message: "Password changed successfully" });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_13 = _b.sent();
                                    console.error("Change password error:", error_13);
                                    res.status(500).json({ error: "Failed to change password" });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Password reset routes
                    app.post("/api/auth/forgot-password", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var email, user, resetToken, tokenHash, expiresAt, baseUrl_1, resetUrl, error_14;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    email = req.body.email;
                                    if (!email) {
                                        return [2 /*return*/, res.status(400).json({ error: "Email is required" })];
                                    }
                                    return [4 /*yield*/, storage.getUserByEmail(email)];
                                case 1:
                                    user = _a.sent();
                                    if (!user) {
                                        // Don't reveal whether email exists - always return success
                                        return [2 /*return*/, res.json({
                                                message: "If an account with that email exists, a password reset link has been sent.",
                                            })];
                                    }
                                    resetToken = crypto.randomBytes(32).toString("hex");
                                    tokenHash = crypto
                                        .createHash("sha256")
                                        .update(resetToken)
                                        .digest("hex");
                                    expiresAt = new Date(Date.now() + 60 * 60 * 1000);
                                    // Clean up existing tokens for this user
                                    return [4 /*yield*/, storage.deleteUserResetTokens(user.id)];
                                case 2:
                                    // Clean up existing tokens for this user
                                    _a.sent();
                                    // Create new reset token
                                    return [4 /*yield*/, storage.createPasswordResetToken({
                                            userId: user.id,
                                            tokenHash: tokenHash,
                                            expiresAt: expiresAt,
                                            requestIp: req.ip || req.connection.remoteAddress || undefined,
                                            userAgent: req.get("User-Agent") || undefined,
                                        })];
                                case 3:
                                    // Create new reset token
                                    _a.sent();
                                    baseUrl_1 = process.env.PUBLIC_BASE_URL || "http://localhost:5000";
                                    resetUrl = "".concat(baseUrl_1, "/reset-password?token=").concat(resetToken);
                                    // Send reset email
                                    return [4 /*yield*/, emailService.sendPasswordResetEmail(user, resetUrl)];
                                case 4:
                                    // Send reset email
                                    _a.sent();
                                    res.json({
                                        message: "If an account with that email exists, a password reset link has been sent.",
                                    });
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_14 = _a.sent();
                                    console.error("Forgot password error:", error_14);
                                    res
                                        .status(500)
                                        .json({ error: "Unable to process password reset request" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Validate reset token
                    app.get("/api/auth/reset-password/validate", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var token, tokenHash, resetToken, error_15;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    token = req.query.token;
                                    if (!token || typeof token !== "string") {
                                        return [2 /*return*/, res.json({ valid: false, error: "Invalid token" })];
                                    }
                                    tokenHash = crypto.createHash("sha256").update(token).digest("hex");
                                    return [4 /*yield*/, storage.getPasswordResetTokenByTokenHash(tokenHash)];
                                case 1:
                                    resetToken = _a.sent();
                                    if (!resetToken) {
                                        return [2 /*return*/, res.json({
                                                valid: false,
                                                error: "Token not found or already used",
                                            })];
                                    }
                                    // Check if token has expired
                                    if (new Date() > resetToken.expiresAt) {
                                        return [2 /*return*/, res.json({ valid: false, error: "Token has expired" })];
                                    }
                                    res.json({ valid: true });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_15 = _a.sent();
                                    console.error("Token validation error:", error_15);
                                    res.json({ valid: false, error: "Unable to validate token" });
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Reset password with token
                    app.post("/api/auth/reset-password", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, token, password, tokenHash, resetToken, user, passwordHash, error_16;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 6, , 7]);
                                    _a = req.body, token = _a.token, password = _a.password;
                                    if (!token || !password) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Token and password are required" })];
                                    }
                                    if (!isPasswordStrong(password)) {
                                        return [2 /*return*/, res.status(400).json({ error: PASSWORD_REQUIREMENTS })];
                                    }
                                    tokenHash = crypto.createHash("sha256").update(token).digest("hex");
                                    return [4 /*yield*/, storage.getPasswordResetTokenByTokenHash(tokenHash)];
                                case 1:
                                    resetToken = _b.sent();
                                    if (!resetToken) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Invalid or expired reset token" })];
                                    }
                                    // Check if token has expired
                                    if (new Date() > resetToken.expiresAt) {
                                        return [2 /*return*/, res.status(400).json({ error: "Reset token has expired" })];
                                    }
                                    return [4 /*yield*/, storage.getUser(resetToken.userId)];
                                case 2:
                                    user = _b.sent();
                                    if (!user) {
                                        return [2 /*return*/, res.status(400).json({ error: "User not found" })];
                                    }
                                    return [4 /*yield*/, bcrypt.hash(password, 12)];
                                case 3:
                                    passwordHash = _b.sent();
                                    // Update user password
                                    return [4 /*yield*/, storage.updateUser(user.id, { passwordHash: passwordHash })];
                                case 4:
                                    // Update user password
                                    _b.sent();
                                    // Mark token as used
                                    return [4 /*yield*/, storage.markPasswordResetTokenUsed(resetToken.id)];
                                case 5:
                                    // Mark token as used
                                    _b.sent();
                                    res.json({ message: "Password updated successfully" });
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_16 = _b.sent();
                                    console.error("Reset password error:", error_16);
                                    res.status(500).json({ error: "Unable to reset password" });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Validate account setup token
                    app.get("/api/auth/validate-setup-token", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var token, tokenHash, setupToken, user, error_17;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    token = req.query.token;
                                    if (!token || typeof token !== "string") {
                                        return [2 /*return*/, res.json({ valid: false, error: "Invalid token" })];
                                    }
                                    tokenHash = crypto.createHash("sha256").update(token).digest("hex");
                                    return [4 /*yield*/, storage.getAccountSetupTokenByTokenHash(tokenHash)];
                                case 1:
                                    setupToken = _a.sent();
                                    if (!setupToken) {
                                        return [2 /*return*/, res.json({
                                                valid: false,
                                                error: "Token not found or already used",
                                            })];
                                    }
                                    // Check if token has expired
                                    if (new Date() > setupToken.expiresAt) {
                                        return [2 /*return*/, res.json({ valid: false, error: "Token has expired" })];
                                    }
                                    return [4 /*yield*/, storage.getUser(setupToken.userId)];
                                case 2:
                                    user = _a.sent();
                                    if (!user) {
                                        return [2 /*return*/, res.json({ valid: false, error: "User not found" })];
                                    }
                                    res.json({
                                        valid: true,
                                        userEmail: user.email,
                                        firstName: user.firstName,
                                        lastName: user.lastName,
                                        phone: user.phone,
                                    });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_17 = _a.sent();
                                    console.error("Token validation error:", error_17);
                                    res.json({ valid: false, error: "Unable to validate token" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Complete account setup with token
                    app.post("/api/auth/complete-setup", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, token, password, firstName, lastName, phone, tokenHash, setupToken, user, passwordHash, updateData, error_18;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 6, , 7]);
                                    _a = req.body, token = _a.token, password = _a.password, firstName = _a.firstName, lastName = _a.lastName, phone = _a.phone;
                                    if (!token || !password || !phone || !firstName || !lastName) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Profile details and password are required" })];
                                    }
                                    if (!isPasswordStrong(password)) {
                                        return [2 /*return*/, res.status(400).json({ error: PASSWORD_REQUIREMENTS })];
                                    }
                                    tokenHash = crypto.createHash("sha256").update(token).digest("hex");
                                    return [4 /*yield*/, storage.getAccountSetupTokenByTokenHash(tokenHash)];
                                case 1:
                                    setupToken = _b.sent();
                                    if (!setupToken) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Invalid or expired setup token" })];
                                    }
                                    // Check if token has expired
                                    if (new Date() > setupToken.expiresAt) {
                                        return [2 /*return*/, res.status(400).json({ error: "Setup token has expired" })];
                                    }
                                    return [4 /*yield*/, storage.getUser(setupToken.userId)];
                                case 2:
                                    user = _b.sent();
                                    if (!user) {
                                        return [2 /*return*/, res.status(400).json({ error: "User not found" })];
                                    }
                                    // Check if user already has a password
                                    if (user.passwordHash) {
                                        return [2 /*return*/, res
                                                .status(400)
                                                .json({ error: "Account has already been set up" })];
                                    }
                                    return [4 /*yield*/, bcrypt.hash(password, 12)];
                                case 3:
                                    passwordHash = _b.sent();
                                    updateData = {
                                        passwordHash: passwordHash,
                                        firstName: firstName,
                                        lastName: lastName,
                                        phone: phone,
                                    };
                                    return [4 /*yield*/, storage.updateUser(user.id, updateData)];
                                case 4:
                                    _b.sent();
                                    // Mark token as used
                                    return [4 /*yield*/, storage.markAccountSetupTokenUsed(setupToken.id)];
                                case 5:
                                    // Mark token as used
                                    _b.sent();
                                    // Send welcome email with verification link after profile completion
                                    void sendWelcomeOrVerification(user, req, "account setup");
                                    res.json({ message: "Account setup completed successfully" });
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_18 = _b.sent();
                                    console.error("Account setup error:", error_18);
                                    res.status(500).json({ error: "Unable to complete account setup" });
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Verify email address
                    app.get("/api/auth/verify-email", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var token, tokenHash, verificationToken, user, redirectBase, redirectUrl, error_19;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    token = req.query.token;
                                    if (!token || typeof token !== "string") {
                                        return [2 /*return*/, res.status(400).json({ error: "Invalid token" })];
                                    }
                                    tokenHash = crypto.createHash("sha256").update(token).digest("hex");
                                    return [4 /*yield*/, storage.getEmailVerificationTokenByTokenHash(tokenHash)];
                                case 1:
                                    verificationToken = _a.sent();
                                    if (!verificationToken) {
                                        return [2 /*return*/, res.status(400).json({ error: "Invalid or expired token" })];
                                    }
                                    return [4 /*yield*/, storage.getUser(verificationToken.userId)];
                                case 2:
                                    user = _a.sent();
                                    if (!user) {
                                        return [2 /*return*/, res.status(400).json({ error: "User not found" })];
                                    }
                                    return [4 /*yield*/, storage.updateUser(user.id, { emailVerified: true })];
                                case 3:
                                    _a.sent();
                                    return [4 /*yield*/, storage.markEmailVerificationTokenUsed(verificationToken.id)];
                                case 4:
                                    _a.sent();
                                    redirectBase = process.env.CLIENT_ORIGIN ||
                                        process.env.PUBLIC_BASE_URL ||
                                        "http://localhost:5000";
                                    redirectUrl = "".concat(redirectBase, "/login?verified=1");
                                    res.redirect(redirectUrl);
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_19 = _a.sent();
                                    console.error("Email verification error:", error_19);
                                    res.status(500).json({ error: "Unable to verify email" });
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
function applyAffiliateReferral(req, user) {
    return __awaiter(this, void 0, void 0, function () {
        var ref, affiliateUserId, error_20;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    ref = typeof ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.referralId) === "string"
                        ? req.cookies.referralId.trim()
                        : "";
                    if (!ref)
                        return [2 /*return*/];
                    if (user.affiliateCloserUserId)
                        return [2 /*return*/];
                    return [4 /*yield*/, resolveAffiliateUserId(ref)];
                case 1:
                    affiliateUserId = _b.sent();
                    if (!affiliateUserId || affiliateUserId === user.id)
                        return [2 /*return*/];
                    return [4 /*yield*/, db
                            .update(users)
                            .set({
                            affiliateCloserUserId: affiliateUserId,
                            updatedAt: new Date(),
                        })
                            .where(eq(users.id, user.id))];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_20 = _b.sent();
                    console.error("[affiliate] Failed to apply referral:", error_20);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Middleware to check if user is authenticated
export var isAuthenticated = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
    }
    next();
};
// Middleware to check if user is authenticated restaurant owner
export var isRestaurantOwner = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
    }
    if (!["restaurant_owner", "admin", "super_admin"].includes(req.user.userType)) {
        return res.status(403).json({ error: "Restaurant owner access required" });
    }
    next();
};
export var requireRole = function (allowedRoles) { return function (req, res, next) {
    var _a, _b;
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
    }
    // Block disabled accounts
    if ((_a = req.user) === null || _a === void 0 ? void 0 : _a.isDisabled) {
        return res.status(403).json({ error: "Account disabled" });
    }
    var userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
    if (userRole === "super_admin") {
        return next();
    }
    if (userRole === "admin" &&
        allowedRoles.some(function (role) { return role !== "super_admin"; })) {
        return next();
    }
    if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
            error: "Forbidden",
            message: "This action requires one of the following roles: ".concat(allowedRoles.join(", ")),
            userRole: userRole,
        });
    }
    next();
}; };
// Convenience middleware for admin-only endpoints
export var isAdmin = requireRole(["admin", "super_admin"]);
// Convenience middleware for super admin only
export var isSuperAdmin = requireRole(["super_admin"]);
// Convenience middleware for staff or admin
export var isStaffOrAdmin = requireRole(["staff", "admin", "super_admin"]);
// Convenience middleware for restaurant owner or admin
export var isRestaurantOwnerOrAdmin = requireRole([
    "restaurant_owner",
    "admin",
    "super_admin",
]);
// API Key authentication middleware
export var apiKeyAuth = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var apiKey, apiKeys, validKey, _i, apiKeys_1, key, user, error_21;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                apiKey = req.headers["x-api-key"];
                if (!apiKey) {
                    return [2 /*return*/, res
                            .status(401)
                            .json({ error: "API key required", header: "X-API-Key" })];
                }
                if (typeof apiKey !== "string") {
                    return [2 /*return*/, res.status(400).json({ error: "Invalid API key format" })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 8, , 9]);
                return [4 /*yield*/, storage.getActiveApiKeys()];
            case 2:
                apiKeys = _a.sent();
                validKey = null;
                _i = 0, apiKeys_1 = apiKeys;
                _a.label = 3;
            case 3:
                if (!(_i < apiKeys_1.length)) return [3 /*break*/, 6];
                key = apiKeys_1[_i];
                return [4 /*yield*/, bcrypt.compare(apiKey, key.keyHash)];
            case 4:
                // Compare hashed key
                if (_a.sent()) {
                    validKey = key;
                    return [3 /*break*/, 6];
                }
                _a.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6:
                if (!validKey) {
                    return [2 /*return*/, res.status(401).json({ error: "Invalid API key" })];
                }
                if (validKey.expiresAt && new Date(validKey.expiresAt) < new Date()) {
                    return [2 /*return*/, res.status(401).json({ error: "API key expired" })];
                }
                return [4 /*yield*/, storage.getUser(validKey.userId)];
            case 7:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ error: "API key user not found" })];
                }
                req.user = user;
                req.apiKey = validKey;
                // Update last used time (async, don't await)
                storage
                    .updateApiKeyLastUsed(validKey.id)
                    .catch(function (err) { return console.error("Failed to update API key usage:", err); });
                next();
                return [3 /*break*/, 9];
            case 8:
                error_21 = _a.sent();
                console.error("API key authentication error:", error_21);
                res.status(500).json({ error: "Authentication error" });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
// Resource ownership verification middleware
// Ensures user can only modify their own restaurant or data
export var verifyResourceOwnership = function (resourceType) {
    return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, restaurantId, dealId, restaurant, deal, restaurant, error_22;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!req.user) {
                        return [2 /*return*/, res.status(401).json({ error: "Authentication required" })];
                    }
                    _a = req.params, restaurantId = _a.restaurantId, dealId = _a.dealId;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    if (!(resourceType === "restaurant" && restaurantId)) return [3 /*break*/, 3];
                    return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                case 2:
                    restaurant = _b.sent();
                    if (!restaurant) {
                        return [2 /*return*/, res.status(404).json({ error: "Restaurant not found" })];
                    }
                    // Allow if user is owner or admin
                    if (restaurant.ownerId !== req.user.id &&
                        req.user.userType !== "admin" &&
                        req.user.userType !== "super_admin") {
                        return [2 /*return*/, res
                                .status(403)
                                .json({ error: "You do not own this restaurant" })];
                    }
                    return [3 /*break*/, 6];
                case 3:
                    if (!(resourceType === "deal" && dealId)) return [3 /*break*/, 6];
                    return [4 /*yield*/, storage.getDeal(dealId)];
                case 4:
                    deal = _b.sent();
                    if (!deal) {
                        return [2 /*return*/, res.status(404).json({ error: "Deal not found" })];
                    }
                    return [4 /*yield*/, storage.getRestaurant(deal.restaurantId)];
                case 5:
                    restaurant = _b.sent();
                    if (!restaurant) {
                        return [2 /*return*/, res.status(404).json({ error: "Deal's restaurant not found" })];
                    }
                    // Allow if user is restaurant owner or admin
                    if (restaurant.ownerId !== req.user.id &&
                        req.user.userType !== "admin" &&
                        req.user.userType !== "super_admin") {
                        return [2 /*return*/, res.status(403).json({ error: "You do not own this deal" })];
                    }
                    _b.label = 6;
                case 6:
                    next();
                    return [3 /*break*/, 8];
                case 7:
                    error_22 = _b.sent();
                    console.error("Resource ownership verification error:", error_22);
                    res.status(500).json({ error: "Authorization error" });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
};

