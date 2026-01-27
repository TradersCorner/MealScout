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
import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { sanitizeUser } from "./utils/sanitize.js";
import { isPasswordStrong, PASSWORD_REQUIREMENTS, } from "./utils/passwordPolicy.js";
export function setupRestaurantAuth(app) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            // Check for Google OAuth environment variables
            if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
                // Google Strategy for restaurant owners
                passport.use('google-restaurant', new GoogleStrategy({
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: "/api/auth/google/callback",
                }, function (accessToken, refreshToken, profile, done) { return __awaiter(_this, void 0, void 0, function () {
                    var userData, user, error_1;
                    var _a, _b, _c, _d, _e, _f;
                    return __generator(this, function (_g) {
                        switch (_g.label) {
                            case 0:
                                _g.trys.push([0, 2, , 3]);
                                userData = {
                                    googleId: profile.id,
                                    email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
                                    firstName: ((_c = profile.name) === null || _c === void 0 ? void 0 : _c.givenName) || null,
                                    lastName: ((_d = profile.name) === null || _d === void 0 ? void 0 : _d.familyName) || null,
                                    profileImageUrl: ((_f = (_e = profile.photos) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.value) || null,
                                    googleAccessToken: accessToken,
                                };
                                return [4 /*yield*/, storage.upsertUserByAuth('google', userData, 'restaurant_owner')];
                            case 1:
                                user = _g.sent();
                                return [2 /*return*/, done(null, user)];
                            case 2:
                                error_1 = _g.sent();
                                return [2 /*return*/, done(error_1, null)];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); }));
            }
            // Google OAuth routes for restaurant owners
            app.get("/api/auth/google", function (req, res, next) {
                passport.authenticate('google-restaurant', {
                    scope: ['profile', 'email']
                })(req, res, next);
            });
            app.get("/api/auth/google/callback", function (req, res, next) {
                passport.authenticate('google-restaurant', {
                    successRedirect: "/restaurant-signup",
                    failureRedirect: "/restaurant-signup?error=auth_failed",
                })(req, res, next);
            });
            // Email/password registration for restaurant owners
            app.post("/api/auth/restaurant/register", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, email, firstName, lastName, phone, password, existingUser, passwordHash, userData, user_1, error_2;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 4, , 5]);
                            _a = req.body, email = _a.email, firstName = _a.firstName, lastName = _a.lastName, phone = _a.phone, password = _a.password;
                            // Validate input
                            if (!email || !firstName || !lastName || !phone || !password) {
                                return [2 /*return*/, res.status(400).json({ error: "All fields are required" })];
                            }
                            if (!isPasswordStrong(password)) {
                                return [2 /*return*/, res.status(400).json({ error: PASSWORD_REQUIREMENTS })];
                            }
                            if (phone.length < 10) {
                                return [2 /*return*/, res.status(400).json({ error: "Valid phone number is required" })];
                            }
                            return [4 /*yield*/, storage.getUserByEmail(email)];
                        case 1:
                            existingUser = _b.sent();
                            if (existingUser) {
                                return [2 /*return*/, res.status(400).json({ error: "User with this email already exists" })];
                            }
                            return [4 /*yield*/, bcrypt.hash(password, 10)];
                        case 2:
                            passwordHash = _b.sent();
                            userData = {
                                email: email,
                                firstName: firstName,
                                lastName: lastName,
                                phone: phone,
                                passwordHash: passwordHash,
                            };
                            return [4 /*yield*/, storage.upsertUserByAuth('email', userData, 'restaurant_owner')];
                        case 3:
                            user_1 = _b.sent();
                            // Log in the user
                            req.login(user_1, function (err) {
                                if (err) {
                                    return res.status(500).json({ error: "Failed to log in after registration" });
                                }
                                res.json({ user: sanitizeUser(user_1), message: "Registration successful" });
                            });
                            return [3 /*break*/, 5];
                        case 4:
                            error_2 = _b.sent();
                            console.error("Restaurant registration error:", error_2);
                            res.status(500).json({ error: "Internal server error" });
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
            // Email/password login for restaurant owners
            app.post("/api/auth/restaurant/login", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, email, password, user_2, _b, error_3;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 4, , 5]);
                            _a = req.body, email = _a.email, password = _a.password;
                            if (!email || !password) {
                                return [2 /*return*/, res.status(400).json({ error: "Email and password are required" })];
                            }
                            return [4 /*yield*/, storage.getUserByEmail(email)];
                        case 1:
                            user_2 = _c.sent();
                            if (!user_2 || user_2.userType !== 'restaurant_owner') {
                                return [2 /*return*/, res.status(401).json({ error: "Invalid email or password" })];
                            }
                            _b = !user_2.passwordHash;
                            if (_b) return [3 /*break*/, 3];
                            return [4 /*yield*/, bcrypt.compare(password, user_2.passwordHash)];
                        case 2:
                            _b = !(_c.sent());
                            _c.label = 3;
                        case 3:
                            // Verify password
                            if (_b) {
                                return [2 /*return*/, res.status(401).json({ error: "Invalid email or password" })];
                            }
                            // Log in the user
                            req.login(user_2, function (err) {
                                if (err) {
                                    return res.status(500).json({ error: "Failed to log in" });
                                }
                                res.json({ user: sanitizeUser(user_2), message: "Login successful" });
                            });
                            return [3 /*break*/, 5];
                        case 4:
                            error_3 = _c.sent();
                            console.error("Restaurant login error:", error_3);
                            res.status(500).json({ error: "Internal server error" });
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
            // Logout route
            app.post("/api/auth/restaurant/logout", function (req, res) {
                req.logout(function (err) {
                    if (err) {
                        return res.status(500).json({ error: "Failed to logout" });
                    }
                    res.json({ message: "Logout successful" });
                });
            });
            return [2 /*return*/];
        });
    });
}
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

