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
import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage.js";
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
        secret: process.env.SESSION_SECRET,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            maxAge: sessionTtl,
        },
    });
}
export function setupAuth(app) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            app.set("trust proxy", 1);
            app.use(getSession());
            app.use(passport.initialize());
            app.use(passport.session());
            // Check for required Facebook environment variables
            if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
                // Facebook auth is optional - app functions without it
                return [2 /*return*/];
            }
            // Facebook Strategy
            passport.use(new FacebookStrategy({
                clientID: process.env.FACEBOOK_APP_ID,
                clientSecret: process.env.FACEBOOK_APP_SECRET,
                callbackURL: "/api/auth/facebook/callback",
                profileFields: ['id', 'displayName', 'emails', 'photos', 'first_name', 'last_name']
            }, function (accessToken, refreshToken, profile, done) { return __awaiter(_this, void 0, void 0, function () {
                var userData, user, error_1;
                var _a, _b, _c, _d, _e, _f, _g, _h;
                return __generator(this, function (_j) {
                    switch (_j.label) {
                        case 0:
                            _j.trys.push([0, 2, , 3]);
                            userData = {
                                facebookId: profile.id,
                                email: ((_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || null,
                                firstName: ((_c = profile.name) === null || _c === void 0 ? void 0 : _c.givenName) || ((_d = profile._json) === null || _d === void 0 ? void 0 : _d.first_name) || null,
                                lastName: ((_e = profile.name) === null || _e === void 0 ? void 0 : _e.familyName) || ((_f = profile._json) === null || _f === void 0 ? void 0 : _f.last_name) || null,
                                profileImageUrl: ((_h = (_g = profile.photos) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.value) || null,
                                facebookAccessToken: accessToken,
                            };
                            return [4 /*yield*/, storage.upsertUserByAuth('facebook', userData, 'customer')];
                        case 1:
                            user = _j.sent();
                            return [2 /*return*/, done(null, __assign(__assign({}, user), { accessToken: accessToken }))];
                        case 2:
                            error_1 = _j.sent();
                            return [2 /*return*/, done(error_1, null)];
                        case 3: return [2 /*return*/];
                    }
                });
            }); }));
            // Serialize user for session
            passport.serializeUser(function (user, done) {
                done(null, user.id);
            });
            // Deserialize user from session
            passport.deserializeUser(function (id, done) { return __awaiter(_this, void 0, void 0, function () {
                var user, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, storage.getUser(id)];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                return [2 /*return*/, done(null, false)];
                            }
                            done(null, user);
                            return [3 /*break*/, 3];
                        case 2:
                            error_2 = _a.sent();
                            done(null, false);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // Facebook auth routes
            app.get('/api/auth/facebook', passport.authenticate('facebook', {
                scope: ['email', 'public_profile', 'user_posts']
            }));
            app.get('/api/auth/facebook/callback', passport.authenticate('facebook', {
                failureRedirect: '/?error=auth_failed'
            }), function (req, res) {
                // Successful authentication, redirect to app
                res.redirect('/');
            });
            app.get('/api/logout', function (req, res) {
                req.logout(function (err) {
                    if (err) {
                        console.error('Logout error:', err);
                    }
                    res.redirect('/');
                });
            });
            return [2 /*return*/];
        });
    });
}
export var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Unauthorized" });
};

