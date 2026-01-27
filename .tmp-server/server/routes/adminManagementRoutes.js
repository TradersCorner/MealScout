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
import Stripe from "stripe";
import crypto from "crypto";
import { eq, and, inArray, or, sql, desc, isNull, gte } from "drizzle-orm";
import { storage } from "../storage.js";
import { isAuthenticated, isStaffOrAdmin } from "../unifiedAuth.js";
import { sanitizeUser, sanitizeUsers } from "../utils/sanitize.js";
import { sendAccountSetupInvite } from "../utils/accountSetup.js";
import { emailService } from "../emailService.js";
import { db } from "../db.js";
import multer from "multer";
import { parseTruckImportFile } from "../utils/truckImport.js";
import { deals, eventBookings, eventSeries, events, hosts, insertHostSchema, restaurants, verificationRequests, truckImportBatches, truckImportListings, truckClaimRequests, users, affiliateShareEvents, affiliateCommissionLedger, affiliateWithdrawals, creditLedger, } from "@shared/schema";
// Optional Stripe integration (mirrors server/routes.ts)
var stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
var buildLocationKey = function (address, city, state) {
    return "".concat((address || "").trim().toLowerCase(), "|").concat((city || "")
        .trim()
        .toLowerCase(), "|").concat((state || "").trim().toLowerCase());
};
var truckImportUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
});
export function registerAdminManagementRoutes(app) {
    var _this = this;
    var denyStaffEdits = function (req, res) {
        var _a;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.userType) === "staff") {
            res.status(403).json({ message: "Staff cannot modify existing data" });
            return true;
        }
        return false;
    };
    var requireAdminUser = function (req, res) {
        var _a, _b;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.userType) !== "admin" &&
            ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userType) !== "super_admin") {
            res.status(403).json({ message: "Admin access required" });
            return false;
        }
        return true;
    };
    // Manual User/Host Creation
    app.post("/api/admin/users/create", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, email, firstName, lastName, phone, businessName, address, cuisineType, latitude, longitude, locationType, footTraffic, amenities, userType, normalizedEmail, user, footTrafficMap, amenitiesObj_1, hostData, emailSent, error_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 7, , 8]);
                    _a = req.body, email = _a.email, firstName = _a.firstName, lastName = _a.lastName, phone = _a.phone, businessName = _a.businessName, address = _a.address, cuisineType = _a.cuisineType, latitude = _a.latitude, longitude = _a.longitude, locationType = _a.locationType, footTraffic = _a.footTraffic, amenities = _a.amenities, userType = _a.userType;
                    if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.userType) === "staff") {
                        if (userType === "admin" || userType === "super_admin") {
                            return [2 /*return*/, res.status(403).json({
                                    message: "Staff cannot create admin or super admin accounts",
                                })];
                        }
                    }
                    normalizedEmail = email === null || email === void 0 ? void 0 : email.trim().toLowerCase();
                    if (!normalizedEmail || !userType) {
                        return [2 /*return*/, res.status(400).json({
                                message: "Email and userType are required",
                            })];
                    }
                    return [4 /*yield*/, storage.createUserInvite({
                            email: normalizedEmail,
                            firstName: (firstName === null || firstName === void 0 ? void 0 : firstName.trim()) || null,
                            lastName: (lastName === null || lastName === void 0 ? void 0 : lastName.trim()) || null,
                            phone: (phone === null || phone === void 0 ? void 0 : phone.trim()) || null,
                            userType: userType,
                        })];
                case 1:
                    user = _c.sent();
                    if (!((userType === "restaurant_owner" || userType === "food_truck") &&
                        businessName &&
                        address)) return [3 /*break*/, 3];
                    return [4 /*yield*/, storage.createRestaurantForUser({
                            userId: user.id,
                            name: businessName,
                            address: address,
                            cuisineType: cuisineType || "Various",
                        })];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    if (!((userType === "host" || userType === "event_coordinator") &&
                        businessName &&
                        address)) return [3 /*break*/, 5];
                    footTrafficMap = {
                        low: 50,
                        medium: 150,
                        high: 300,
                    };
                    amenitiesObj_1 = {};
                    if (Array.isArray(amenities)) {
                        amenities.forEach(function (amenity) {
                            amenitiesObj_1[amenity] = true;
                        });
                    }
                    hostData = {
                        userId: user.id,
                        businessName: businessName,
                        address: address,
                        locationType: locationType || "other",
                        expectedFootTraffic: footTrafficMap[footTraffic] || 100,
                        amenities: Object.keys(amenitiesObj_1).length > 0 ? amenitiesObj_1 : null,
                        isVerified: true, // Admin-created hosts are pre-verified
                        adminCreated: true,
                    };
                    if (latitude && longitude) {
                        hostData.latitude = latitude.toString();
                        hostData.longitude = longitude.toString();
                    }
                    return [4 /*yield*/, storage.createHost(hostData)];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5: return [4 /*yield*/, sendAccountSetupInvite({
                        user: user,
                        createdBy: req.user,
                        req: req,
                    })];
                case 6:
                    emailSent = _c.sent();
                    res.json({
                        success: true,
                        setupEmailSent: emailSent,
                        message: "".concat(userType, " account created successfully. Setup link emailed to ").concat(email, "."),
                    });
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _c.sent();
                    console.error("Error creating user manually:", error_1);
                    res.status(500).json({
                        message: error_1.message || "Failed to create user",
                    });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    // Admin API endpoints
    app.get("/api/auth/admin/verify", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            try {
                user = req.user;
                if (user.userType === "admin" ||
                    user.userType === "super_admin" ||
                    user.userType === "staff") {
                    res.json(sanitizeUser(user, { includeStripe: true }));
                }
                else {
                    res.status(403).json({ message: "Admin access required" });
                }
            }
            catch (error) {
                res.status(500).json({ message: "Failed to verify admin" });
            }
            return [2 /*return*/];
        });
    }); });
    app.get("/api/admin/stats", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var stats, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.getAdminStats()];
                case 1:
                    stats = _a.sent();
                    res.json(stats);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error fetching admin stats:", error_2);
                    res.status(500).json({ message: "Failed to fetch stats" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Admin endpoint to sync subscriptions from Stripe to database
    app.post("/api/admin/subscriptions/sync", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var results, allUsers, usersWithStripe, _i, usersWithStripe_1, user, subscriptions, subscription, interval, intervalCount, billingInterval, error_3, error_4;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 11, , 12]);
                    if (!stripe) {
                        return [2 /*return*/, res.status(500).json({ message: "Stripe not configured" })];
                    }
                    results = {
                        synced: 0,
                        skipped: 0,
                        errors: 0,
                        details: [],
                    };
                    return [4 /*yield*/, storage.getAllUsers()];
                case 1:
                    allUsers = _g.sent();
                    usersWithStripe = allUsers.filter(function (u) { return u.stripeCustomerId; });
                    console.log("[ADMIN SYNC] Found ".concat(usersWithStripe.length, " users with Stripe customer IDs"));
                    _i = 0, usersWithStripe_1 = usersWithStripe;
                    _g.label = 2;
                case 2:
                    if (!(_i < usersWithStripe_1.length)) return [3 /*break*/, 10];
                    user = usersWithStripe_1[_i];
                    _g.label = 3;
                case 3:
                    _g.trys.push([3, 8, , 9]);
                    // Skip if user already has subscription ID
                    if (user.stripeSubscriptionId) {
                        results.skipped++;
                        return [3 /*break*/, 9];
                    }
                    return [4 /*yield*/, stripe.subscriptions.list({
                            customer: user.stripeCustomerId,
                            status: "active",
                            limit: 1,
                        })];
                case 4:
                    subscriptions = _g.sent();
                    if (!(subscriptions.data.length > 0)) return [3 /*break*/, 6];
                    subscription = subscriptions.data[0];
                    interval = (_c = (_b = (_a = subscription.items.data[0]) === null || _a === void 0 ? void 0 : _a.price) === null || _b === void 0 ? void 0 : _b.recurring) === null || _c === void 0 ? void 0 : _c.interval;
                    intervalCount = ((_f = (_e = (_d = subscription.items.data[0]) === null || _d === void 0 ? void 0 : _d.price) === null || _e === void 0 ? void 0 : _e.recurring) === null || _f === void 0 ? void 0 : _f.interval_count) ||
                        1;
                    billingInterval = "month";
                    if (interval === "month" && intervalCount === 3) {
                        billingInterval = "quarter";
                    }
                    else if (interval === "year") {
                        billingInterval = "year";
                    }
                    return [4 /*yield*/, storage.updateUserStripeInfo(user.id, user.stripeCustomerId, subscription.id, "standard-".concat(billingInterval))];
                case 5:
                    _g.sent();
                    results.synced++;
                    results.details.push({
                        userId: user.id,
                        email: user.email,
                        subscriptionId: subscription.id,
                        billingInterval: "standard-".concat(billingInterval),
                        status: "synced",
                    });
                    console.log("[ADMIN SYNC] \u2705 Synced subscription ".concat(subscription.id, " for user ").concat(user.email));
                    return [3 /*break*/, 7];
                case 6:
                    results.skipped++;
                    _g.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    error_3 = _g.sent();
                    results.errors++;
                    results.details.push({
                        userId: user.id,
                        email: user.email,
                        error: error_3.message,
                        status: "error",
                    });
                    console.error("[ADMIN SYNC] \u274C Error syncing user ".concat(user.email, ":"), error_3);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 2];
                case 10:
                    console.log("[ADMIN SYNC] Complete: ".concat(results.synced, " synced, ").concat(results.skipped, " skipped, ").concat(results.errors, " errors"));
                    res.json(results);
                    return [3 /*break*/, 12];
                case 11:
                    error_4 = _g.sent();
                    console.error("Error syncing subscriptions:", error_4);
                    res.status(500).json({ message: "Failed to sync subscriptions" });
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/restaurants/pending", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var restaurants_1, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.getPendingRestaurants()];
                case 1:
                    restaurants_1 = _a.sent();
                    res.json(restaurants_1);
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    console.error("Error fetching pending restaurants:", error_5);
                    res
                        .status(500)
                        .json({ message: "Failed to fetch pending restaurants" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/restaurants/:id/approve", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.approveRestaurant(req.params.id)];
                case 1:
                    _a.sent();
                    res.json({ message: "Restaurant approved successfully" });
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    console.error("Error approving restaurant:", error_6);
                    res.status(500).json({ message: "Failed to approve restaurant" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.delete("/api/admin/restaurants/:id", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.deleteRestaurant(req.params.id)];
                case 1:
                    _a.sent();
                    res.json({ message: "Restaurant deleted successfully" });
                    return [3 /*break*/, 3];
                case 2:
                    error_7 = _a.sent();
                    console.error("Error deleting restaurant:", error_7);
                    res.status(500).json({ message: "Failed to delete restaurant" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/users", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var users_1, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.getAllUsers()];
                case 1:
                    users_1 = _a.sent();
                    res.json(sanitizeUsers(users_1, { includeStripe: true }));
                    return [3 /*break*/, 3];
                case 2:
                    error_8 = _a.sent();
                    console.error("Error fetching users:", error_8);
                    res.status(500).json({ message: "Failed to fetch users" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/truck-imports", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var batches, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!requireAdminUser(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db
                            .select()
                            .from(truckImportBatches)
                            .orderBy(desc(truckImportBatches.createdAt))
                            .limit(50)];
                case 2:
                    batches = _a.sent();
                    res.json(batches);
                    return [3 /*break*/, 4];
                case 3:
                    error_9 = _a.sent();
                    console.error("Error fetching truck import batches:", error_9);
                    res.status(500).json({ message: "Failed to fetch import batches" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/truck-imports", isAuthenticated, isStaffOrAdmin, truckImportUpload.single("file"), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var file, source, rows, batch, importedRows, missingRows, duplicateRows, listingsToInsert, _i, rows_1, row, name_1, address, externalId, duplicate, existing, existing, chunkSize, i, chunk, skippedRows, error_10;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (!requireAdminUser(req, res))
                        return [2 /*return*/];
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 16, , 17]);
                    file = req.file;
                    if (!file) {
                        return [2 /*return*/, res.status(400).json({ message: "File is required" })];
                    }
                    source = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.source) || "").trim() || null;
                    return [4 /*yield*/, parseTruckImportFile(file.buffer, file.originalname || "import.csv")];
                case 2:
                    rows = (_f.sent()).rows;
                    return [4 /*yield*/, db
                            .insert(truckImportBatches)
                            .values({
                            source: source,
                            fileName: file.originalname,
                            uploadedBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
                            totalRows: rows.length,
                        })
                            .returning()];
                case 3:
                    batch = (_f.sent())[0];
                    importedRows = 0;
                    missingRows = 0;
                    duplicateRows = 0;
                    listingsToInsert = [];
                    _i = 0, rows_1 = rows;
                    _f.label = 4;
                case 4:
                    if (!(_i < rows_1.length)) return [3 /*break*/, 10];
                    row = rows_1[_i];
                    name_1 = (_c = row.name) === null || _c === void 0 ? void 0 : _c.trim();
                    address = (_d = row.address) === null || _d === void 0 ? void 0 : _d.trim();
                    if (!name_1 || !address) {
                        missingRows += 1;
                        return [3 /*break*/, 9];
                    }
                    externalId = ((_e = row.externalId) === null || _e === void 0 ? void 0 : _e.trim()) || null;
                    duplicate = false;
                    if (!externalId) return [3 /*break*/, 6];
                    return [4 /*yield*/, db
                            .select({ id: truckImportListings.id })
                            .from(truckImportListings)
                            .where(eq(truckImportListings.externalId, externalId))
                            .limit(1)];
                case 5:
                    existing = _f.sent();
                    duplicate = existing.length > 0;
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, db
                        .select({ id: truckImportListings.id })
                        .from(truckImportListings)
                        .where(and(eq(truckImportListings.name, name_1), eq(truckImportListings.address, address), row.state
                        ? eq(truckImportListings.state, row.state)
                        : sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " is null"], ["", " is null"])), truckImportListings.state)))
                        .limit(1)];
                case 7:
                    existing = _f.sent();
                    duplicate = existing.length > 0;
                    _f.label = 8;
                case 8:
                    if (duplicate) {
                        duplicateRows += 1;
                        return [3 /*break*/, 9];
                    }
                    listingsToInsert.push({
                        batchId: batch === null || batch === void 0 ? void 0 : batch.id,
                        source: source || null,
                        externalId: externalId,
                        name: name_1,
                        address: address,
                        city: row.city || null,
                        state: row.state || null,
                        phone: row.phone || null,
                        cuisineType: row.cuisineType || null,
                        websiteUrl: row.websiteUrl || null,
                        instagramUrl: row.instagramUrl || null,
                        facebookPageUrl: row.facebookPageUrl || null,
                        latitude: row.latitude || null,
                        longitude: row.longitude || null,
                        confidenceScore: row.confidenceScore || 0,
                        status: "unclaimed",
                        rawData: row.rawData || null,
                    });
                    _f.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 4];
                case 10:
                    chunkSize = 250;
                    i = 0;
                    _f.label = 11;
                case 11:
                    if (!(i < listingsToInsert.length)) return [3 /*break*/, 14];
                    chunk = listingsToInsert.slice(i, i + chunkSize);
                    if (chunk.length === 0)
                        return [3 /*break*/, 13];
                    return [4 /*yield*/, db.insert(truckImportListings).values(chunk)];
                case 12:
                    _f.sent();
                    importedRows += chunk.length;
                    _f.label = 13;
                case 13:
                    i += chunkSize;
                    return [3 /*break*/, 11];
                case 14:
                    skippedRows = Math.max(0, rows.length - importedRows - duplicateRows - missingRows);
                    return [4 /*yield*/, db
                            .update(truckImportBatches)
                            .set({
                            importedRows: importedRows,
                            skippedRows: skippedRows,
                            updatedAt: new Date(),
                        })
                            .where(eq(truckImportBatches.id, batch.id))];
                case 15:
                    _f.sent();
                    res.json({
                        batchId: batch.id,
                        totalRows: rows.length,
                        importedRows: importedRows,
                        skippedRows: skippedRows,
                        missingRows: missingRows,
                        duplicateRows: duplicateRows,
                    });
                    return [3 /*break*/, 17];
                case 16:
                    error_10 = _f.sent();
                    console.error("Error importing truck listings:", error_10);
                    res.status(500).json({
                        message: error_10.message || "Failed to import truck listings",
                    });
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/affiliates/users", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var allUsers_1, shareCounts, shareCountMap_1, commissionSums, commissionMap_1, referralRows, truckOwnerRows, hostOwnerRows, bookingOwnerIds, _i, truckOwnerRows_1, row, _a, hostOwnerRows_1, row, referredMap_1, paidMap_1, _b, referralRows_1, row, referrerIds, _c, referrerIds_1, referrerId, isPaid, payload, error_11;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, db
                            .select({
                            id: users.id,
                            email: users.email,
                            firstName: users.firstName,
                            lastName: users.lastName,
                            userType: users.userType,
                            affiliateTag: users.affiliateTag,
                            affiliatePercent: users.affiliatePercent,
                            affiliateCloserUserId: users.affiliateCloserUserId,
                            affiliateBookerUserId: users.affiliateBookerUserId,
                            stripeSubscriptionId: users.stripeSubscriptionId,
                        })
                            .from(users)
                            .where(or(eq(users.isDisabled, false), isNull(users.isDisabled)))
                            .orderBy(users.createdAt)];
                case 1:
                    allUsers_1 = _f.sent();
                    return [4 /*yield*/, db
                            .select({
                            affiliateUserId: affiliateShareEvents.affiliateUserId,
                            count: sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["count(*)"], ["count(*)"]))),
                        })
                            .from(affiliateShareEvents)
                            .groupBy(affiliateShareEvents.affiliateUserId)];
                case 2:
                    shareCounts = _f.sent();
                    shareCountMap_1 = new Map(shareCounts.map(function (row) {
                        var _a;
                        return [
                            row.affiliateUserId,
                            Number((_a = row.count) !== null && _a !== void 0 ? _a : 0),
                        ];
                    }));
                    return [4 /*yield*/, db
                            .select({
                            affiliateUserId: affiliateCommissionLedger.affiliateUserId,
                            earnedCents: sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["coalesce(sum(", "), 0)"], ["coalesce(sum(", "), 0)"])), affiliateCommissionLedger.amount),
                            revenueCents: sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["coalesce(sum(", "), 0)"], ["coalesce(sum(", "), 0)"])), affiliateCommissionLedger.sourceAmountCents),
                            subscriptionRevenueCents: sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["coalesce(sum(case when ", " = 'subscription_payment' then ", " else 0 end), 0)"], ["coalesce(sum(case when ", " = 'subscription_payment' then ", " else 0 end), 0)"])), affiliateCommissionLedger.commissionSource, affiliateCommissionLedger.sourceAmountCents),
                            bookingRevenueCents: sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["coalesce(sum(case when ", " in ('booking_fee_host', 'booking_fee_truck') then ", " else 0 end), 0)"], ["coalesce(sum(case when ", " in ('booking_fee_host', 'booking_fee_truck') then ", " else 0 end), 0)"])), affiliateCommissionLedger.commissionSource, affiliateCommissionLedger.sourceAmountCents),
                        })
                            .from(affiliateCommissionLedger)
                            .groupBy(affiliateCommissionLedger.affiliateUserId)];
                case 3:
                    commissionSums = _f.sent();
                    commissionMap_1 = new Map(commissionSums.map(function (row) { return [
                        row.affiliateUserId,
                        row,
                    ]; }));
                    return [4 /*yield*/, db
                            .select({
                            id: users.id,
                            affiliateCloserUserId: users.affiliateCloserUserId,
                            affiliateBookerUserId: users.affiliateBookerUserId,
                            stripeSubscriptionId: users.stripeSubscriptionId,
                        })
                            .from(users)
                            .where(and(or(eq(users.isDisabled, false), isNull(users.isDisabled)), or(sql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", " is not null"], ["", " is not null"])), users.affiliateCloserUserId), sql(templateObject_8 || (templateObject_8 = __makeTemplateObject(["", " is not null"], ["", " is not null"])), users.affiliateBookerUserId))))];
                case 4:
                    referralRows = _f.sent();
                    return [4 /*yield*/, db
                            .select({ ownerId: restaurants.ownerId })
                            .from(eventBookings)
                            .innerJoin(restaurants, eq(eventBookings.truckId, restaurants.id))];
                case 5:
                    truckOwnerRows = _f.sent();
                    return [4 /*yield*/, db
                            .select({ ownerId: hosts.userId })
                            .from(eventBookings)
                            .innerJoin(hosts, eq(eventBookings.hostId, hosts.id))];
                case 6:
                    hostOwnerRows = _f.sent();
                    bookingOwnerIds = new Set();
                    for (_i = 0, truckOwnerRows_1 = truckOwnerRows; _i < truckOwnerRows_1.length; _i++) {
                        row = truckOwnerRows_1[_i];
                        if (row.ownerId)
                            bookingOwnerIds.add(row.ownerId);
                    }
                    for (_a = 0, hostOwnerRows_1 = hostOwnerRows; _a < hostOwnerRows_1.length; _a++) {
                        row = hostOwnerRows_1[_a];
                        if (row.ownerId)
                            bookingOwnerIds.add(row.ownerId);
                    }
                    referredMap_1 = new Map();
                    paidMap_1 = new Map();
                    for (_b = 0, referralRows_1 = referralRows; _b < referralRows_1.length; _b++) {
                        row = referralRows_1[_b];
                        referrerIds = [row.affiliateCloserUserId, row.affiliateBookerUserId]
                            .filter(function (value) { return Boolean(value); });
                        if (referrerIds.length === 0)
                            continue;
                        for (_c = 0, referrerIds_1 = referrerIds; _c < referrerIds_1.length; _c++) {
                            referrerId = referrerIds_1[_c];
                            if (!referredMap_1.has(referrerId)) {
                                referredMap_1.set(referrerId, new Set());
                            }
                            (_d = referredMap_1.get(referrerId)) === null || _d === void 0 ? void 0 : _d.add(row.id);
                            isPaid = Boolean(row.stripeSubscriptionId) || bookingOwnerIds.has(row.id);
                            if (isPaid) {
                                if (!paidMap_1.has(referrerId)) {
                                    paidMap_1.set(referrerId, new Set());
                                }
                                (_e = paidMap_1.get(referrerId)) === null || _e === void 0 ? void 0 : _e.add(row.id);
                            }
                        }
                    }
                    payload = allUsers_1.map(function (user) {
                        var _a, _b, _c, _d, _e, _f, _g;
                        var commissions = commissionMap_1.get(user.id);
                        var referred = referredMap_1.get(user.id);
                        var paid = paidMap_1.get(user.id);
                        return __assign(__assign({}, user), { linksShared: (_a = shareCountMap_1.get(user.id)) !== null && _a !== void 0 ? _a : 0, peopleReferred: (_b = referred === null || referred === void 0 ? void 0 : referred.size) !== null && _b !== void 0 ? _b : 0, paidReferrals: (_c = paid === null || paid === void 0 ? void 0 : paid.size) !== null && _c !== void 0 ? _c : 0, affiliateEarningsCents: Number((_d = commissions === null || commissions === void 0 ? void 0 : commissions.earnedCents) !== null && _d !== void 0 ? _d : 0), mealScoutRevenueCents: Number((_e = commissions === null || commissions === void 0 ? void 0 : commissions.revenueCents) !== null && _e !== void 0 ? _e : 0), subscriptionRevenueCents: Number((_f = commissions === null || commissions === void 0 ? void 0 : commissions.subscriptionRevenueCents) !== null && _f !== void 0 ? _f : 0), bookingRevenueCents: Number((_g = commissions === null || commissions === void 0 ? void 0 : commissions.bookingRevenueCents) !== null && _g !== void 0 ? _g : 0) });
                    });
                    res.json(payload);
                    return [3 /*break*/, 8];
                case 7:
                    error_11 = _f.sent();
                    console.error("Error fetching affiliate users:", error_11);
                    res.status(500).json({ message: "Failed to fetch affiliate users" });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/affiliates/users/:id", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var targetUserId, _a, affiliatePercent, affiliateCloserUserId, affiliateBookerUserId, updates, parsed, updated, error_12;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!requireAdminUser(req, res))
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    targetUserId = req.params.id;
                    _a = req.body || {}, affiliatePercent = _a.affiliatePercent, affiliateCloserUserId = _a.affiliateCloserUserId, affiliateBookerUserId = _a.affiliateBookerUserId;
                    updates = {};
                    if (affiliatePercent !== undefined) {
                        parsed = Number(affiliatePercent);
                        if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
                            return [2 /*return*/, res
                                    .status(400)
                                    .json({ message: "affiliatePercent must be 0-100" })];
                        }
                        updates.affiliatePercent = parsed;
                    }
                    if (affiliateCloserUserId !== undefined) {
                        updates.affiliateCloserUserId =
                            affiliateCloserUserId === null || affiliateCloserUserId === ""
                                ? null
                                : String(affiliateCloserUserId);
                    }
                    if (affiliateBookerUserId !== undefined) {
                        updates.affiliateBookerUserId =
                            affiliateBookerUserId === null || affiliateBookerUserId === ""
                                ? null
                                : String(affiliateBookerUserId);
                    }
                    if (Object.keys(updates).length === 0) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "No affiliate fields to update" })];
                    }
                    updates.updatedAt = new Date();
                    return [4 /*yield*/, db
                            .update(users)
                            .set(updates)
                            .where(eq(users.id, targetUserId))
                            .returning()];
                case 2:
                    updated = (_b.sent())[0];
                    if (!updated) {
                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                    }
                    res.json({
                        id: updated.id,
                        affiliatePercent: updated.affiliatePercent,
                        affiliateCloserUserId: updated.affiliateCloserUserId,
                        affiliateBookerUserId: updated.affiliateBookerUserId,
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_12 = _b.sent();
                    console.error("Error updating affiliate settings:", error_12);
                    res.status(500).json({ message: "Failed to update affiliate settings" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Affiliate payout queue (manual payouts)
    app.get("/api/admin/affiliate-payouts", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var status_1, baseQuery, rows, _a, error_13;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!requireAdminUser(req, res))
                        return [2 /*return*/];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, , 7]);
                    status_1 = typeof ((_b = req.query) === null || _b === void 0 ? void 0 : _b.status) === "string" ? req.query.status : null;
                    baseQuery = db
                        .select({
                        id: affiliateWithdrawals.id,
                        userId: affiliateWithdrawals.userId,
                        amount: affiliateWithdrawals.amount,
                        method: affiliateWithdrawals.method,
                        status: affiliateWithdrawals.status,
                        methodDetails: affiliateWithdrawals.methodDetails,
                        creditLedgerId: affiliateWithdrawals.creditLedgerId,
                        requestedAt: affiliateWithdrawals.requestedAt,
                        processedAt: affiliateWithdrawals.processedAt,
                        approvedAt: affiliateWithdrawals.approvedAt,
                        approvedBy: affiliateWithdrawals.approvedBy,
                        paidAt: affiliateWithdrawals.paidAt,
                        rejectedAt: affiliateWithdrawals.rejectedAt,
                        notes: affiliateWithdrawals.notes,
                        userEmail: users.email,
                        userFirstName: users.firstName,
                        userLastName: users.lastName,
                    })
                        .from(affiliateWithdrawals)
                        .innerJoin(users, eq(affiliateWithdrawals.userId, users.id));
                    if (!status_1) return [3 /*break*/, 3];
                    return [4 /*yield*/, baseQuery.where(eq(affiliateWithdrawals.status, status_1)).orderBy(desc(affiliateWithdrawals.requestedAt))];
                case 2:
                    _a = _c.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, baseQuery.orderBy(desc(affiliateWithdrawals.requestedAt))];
                case 4:
                    _a = _c.sent();
                    _c.label = 5;
                case 5:
                    rows = _a;
                    res.json(rows);
                    return [3 /*break*/, 7];
                case 6:
                    error_13 = _c.sent();
                    console.error("Error fetching affiliate payouts:", error_13);
                    res.status(500).json({ message: "Failed to fetch payout requests" });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/affiliate-payouts/:id/approve", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var payoutId, existing, updated, error_14;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!requireAdminUser(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    payoutId = req.params.id;
                    return [4 /*yield*/, db
                            .select()
                            .from(affiliateWithdrawals)
                            .where(eq(affiliateWithdrawals.id, payoutId))
                            .limit(1)];
                case 2:
                    existing = (_a.sent())[0];
                    if (!existing) {
                        return [2 /*return*/, res.status(404).json({ message: "Payout request not found" })];
                    }
                    if (existing.status !== "pending") {
                        return [2 /*return*/, res.status(409).json({ message: "Payout is not pending" })];
                    }
                    return [4 /*yield*/, db
                            .update(affiliateWithdrawals)
                            .set({
                            status: "approved",
                            approvedAt: new Date(),
                            approvedBy: req.user.id,
                        })
                            .where(eq(affiliateWithdrawals.id, payoutId))
                            .returning()];
                case 3:
                    updated = (_a.sent())[0];
                    res.json(updated);
                    return [3 /*break*/, 5];
                case 4:
                    error_14 = _a.sent();
                    console.error("Error approving affiliate payout:", error_14);
                    res.status(500).json({ message: "Failed to approve payout" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/affiliate-payouts/:id/mark-paid", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var payoutId, existing, updated, error_15;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!requireAdminUser(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    payoutId = req.params.id;
                    return [4 /*yield*/, db
                            .select()
                            .from(affiliateWithdrawals)
                            .where(eq(affiliateWithdrawals.id, payoutId))
                            .limit(1)];
                case 2:
                    existing = (_a.sent())[0];
                    if (!existing) {
                        return [2 /*return*/, res.status(404).json({ message: "Payout request not found" })];
                    }
                    if (existing.status === "paid") {
                        return [2 /*return*/, res.status(409).json({ message: "Payout already marked paid" })];
                    }
                    if (existing.status === "rejected") {
                        return [2 /*return*/, res.status(409).json({ message: "Payout was rejected" })];
                    }
                    return [4 /*yield*/, db
                            .update(affiliateWithdrawals)
                            .set({
                            status: "paid",
                            paidAt: new Date(),
                            processedAt: new Date(),
                        })
                            .where(eq(affiliateWithdrawals.id, payoutId))
                            .returning()];
                case 3:
                    updated = (_a.sent())[0];
                    if (!existing.creditLedgerId) return [3 /*break*/, 5];
                    return [4 /*yield*/, db
                            .update(creditLedger)
                            .set({
                            redeemedFor: "cash_payout",
                            redeemedAt: new Date(),
                        })
                            .where(eq(creditLedger.id, existing.creditLedgerId))];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    res.json(updated);
                    return [3 /*break*/, 7];
                case 6:
                    error_15 = _a.sent();
                    console.error("Error marking affiliate payout paid:", error_15);
                    res.status(500).json({ message: "Failed to mark payout paid" });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/affiliate-payouts/:id/reject", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var payoutId_1, reason_1, existing_1, amountNum_1, error_16;
        var _this = this;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!requireAdminUser(req, res))
                        return [2 /*return*/];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    payoutId_1 = req.params.id;
                    reason_1 = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.reason) === "string" ? req.body.reason : null;
                    return [4 /*yield*/, db
                            .select()
                            .from(affiliateWithdrawals)
                            .where(eq(affiliateWithdrawals.id, payoutId_1))
                            .limit(1)];
                case 2:
                    existing_1 = (_c.sent())[0];
                    if (!existing_1) {
                        return [2 /*return*/, res.status(404).json({ message: "Payout request not found" })];
                    }
                    if (existing_1.status === "paid") {
                        return [2 /*return*/, res.status(409).json({ message: "Payout already paid" })];
                    }
                    if (existing_1.status === "rejected") {
                        return [2 /*return*/, res.status(409).json({ message: "Payout already rejected" })];
                    }
                    amountNum_1 = parseFloat(((_b = existing_1.amount) === null || _b === void 0 ? void 0 : _b.toString()) || "0");
                    return [4 /*yield*/, db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var reversalExists;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx
                                            .update(affiliateWithdrawals)
                                            .set({
                                            status: "rejected",
                                            rejectedAt: new Date(),
                                            notes: reason_1 || existing_1.notes,
                                        })
                                            .where(eq(affiliateWithdrawals.id, payoutId_1))];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, tx
                                                .select({ id: creditLedger.id })
                                                .from(creditLedger)
                                                .where(and(eq(creditLedger.userId, existing_1.userId), eq(creditLedger.sourceType, "cash_payout_reversal"), eq(creditLedger.sourceId, payoutId_1)))
                                                .limit(1)];
                                    case 2:
                                        reversalExists = (_a.sent())[0];
                                        if (!(!reversalExists && amountNum_1 > 0)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, tx.insert(creditLedger).values({
                                                userId: existing_1.userId,
                                                amount: amountNum_1.toString(),
                                                sourceType: "cash_payout_reversal",
                                                sourceId: payoutId_1,
                                            })];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4:
                                        if (!existing_1.creditLedgerId) return [3 /*break*/, 6];
                                        return [4 /*yield*/, tx
                                                .update(creditLedger)
                                                .set({ redeemedFor: "cash_payout_rejected" })
                                                .where(eq(creditLedger.id, existing_1.creditLedgerId))];
                                    case 5:
                                        _a.sent();
                                        _a.label = 6;
                                    case 6: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 3:
                    _c.sent();
                    res.json({ success: true });
                    return [3 /*break*/, 5];
                case 4:
                    error_16 = _c.sent();
                    console.error("Error rejecting affiliate payout:", error_16);
                    res.status(500).json({ message: "Failed to reject payout" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/users/:id/resend-verification", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var user, token, tokenHash, expiresAt, apiBaseUrl, verifyUrl, error_17;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, storage.getUser(req.params.id)];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                    }
                    if (!user.email) {
                        return [2 /*return*/, res.status(400).json({ message: "User has no email address" })];
                    }
                    if (user.emailVerified) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Email is already verified" })];
                    }
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
                case 3:
                    _a.sent();
                    apiBaseUrl = "".concat(req.protocol, "://").concat(req.get("host")) ||
                        process.env.PUBLIC_BASE_URL ||
                        "http://localhost:5000";
                    verifyUrl = "".concat(apiBaseUrl, "/api/auth/verify-email?token=").concat(encodeURIComponent(token));
                    return [4 /*yield*/, emailService.sendEmailVerificationEmail(user, verifyUrl)];
                case 4:
                    _a.sent();
                    res.json({ message: "Verification email sent" });
                    return [3 /*break*/, 6];
                case 5:
                    error_17 = _a.sent();
                    console.error("Error resending verification email:", error_17);
                    res.status(500).json({
                        message: error_17.message || "Failed to resend verification email",
                    });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/users/:id/verify", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var user, updated, error_18;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!requireAdminUser(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, storage.getUser(req.params.id)];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                    }
                    return [4 /*yield*/, storage.updateUser(user.id, {
                            emailVerified: true,
                        })];
                case 3:
                    updated = _a.sent();
                    res.json(sanitizeUser(updated, { includeStripe: true }));
                    return [3 /*break*/, 5];
                case 4:
                    error_18 = _a.sent();
                    console.error("Error verifying user:", error_18);
                    res.status(500).json({
                        message: error_18.message || "Failed to verify user",
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/users/:id/send-subscription-link", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var user, baseUrl, subscribeUrl, subject, html, text, error_19;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, storage.getUser(req.params.id)];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                    }
                    if (!user.email) {
                        return [2 /*return*/, res.status(400).json({ message: "User has no email address" })];
                    }
                    baseUrl = process.env.CLIENT_ORIGIN ||
                        process.env.PUBLIC_BASE_URL ||
                        "http://localhost:5000";
                    subscribeUrl = "".concat(baseUrl, "/subscribe");
                    subject = "MealScout Monthly Subscription";
                    html = "\n          <p>Hi ".concat(user.firstName || "there", ",</p>\n          <p>Use the link below to sign up for MealScout monthly subscriptions:</p>\n          <p><a href=\"").concat(subscribeUrl, "\">Subscribe now</a></p>\n          <p>If the link doesn't work, copy and paste this URL:</p>\n          <p>").concat(subscribeUrl, "</p>\n        ");
                    text = "Use this link to sign up for MealScout monthly subscriptions: ".concat(subscribeUrl);
                    return [4 /*yield*/, emailService.sendBasicEmail(user.email, subject, html, text)];
                case 3:
                    _a.sent();
                    res.json({ message: "Subscription link sent" });
                    return [3 /*break*/, 5];
                case 4:
                    error_19 = _a.sent();
                    console.error("Error sending subscription link:", error_19);
                    res.status(500).json({
                        message: error_19.message || "Failed to send subscription link",
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/users/:id", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, _a, email, firstName, lastName, phone, postalCode, birthYear, gender, isActive, emailVerified, userType, updates, allowedTypes, updated, _b, error_20;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 8, , 9]);
                    userId = req.params.id;
                    _a = req.body || {}, email = _a.email, firstName = _a.firstName, lastName = _a.lastName, phone = _a.phone, postalCode = _a.postalCode, birthYear = _a.birthYear, gender = _a.gender, isActive = _a.isActive, emailVerified = _a.emailVerified, userType = _a.userType;
                    updates = {};
                    if (email !== undefined) {
                        updates.email = String(email).trim().toLowerCase();
                    }
                    if (firstName !== undefined) {
                        updates.firstName = String(firstName).trim();
                    }
                    if (lastName !== undefined) {
                        updates.lastName = String(lastName).trim();
                    }
                    if (phone !== undefined) {
                        updates.phone = String(phone).trim();
                    }
                    if (postalCode !== undefined) {
                        updates.postalCode = String(postalCode).trim();
                    }
                    if (birthYear !== undefined && birthYear !== null && birthYear !== "") {
                        updates.birthYear = Number(birthYear);
                    }
                    if (gender !== undefined) {
                        updates.gender = String(gender).trim() || null;
                    }
                    if (isActive !== undefined) {
                        updates.isActive = Boolean(isActive);
                    }
                    if (emailVerified !== undefined) {
                        updates.emailVerified = Boolean(emailVerified);
                    }
                    if (!userType) return [3 /*break*/, 3];
                    allowedTypes = [
                        "customer",
                        "restaurant_owner",
                        "food_truck",
                        "host",
                        "event_coordinator",
                        "staff",
                        "admin",
                        "super_admin",
                    ];
                    if (!allowedTypes.includes(userType)) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid user type" })];
                    }
                    if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.userType) === "staff") {
                        if (userType === "admin" || userType === "super_admin") {
                            return [2 /*return*/, res.status(403).json({
                                    message: "Staff cannot assign admin roles",
                                })];
                        }
                    }
                    return [4 /*yield*/, storage.updateUserType(userId, userType)];
                case 2:
                    _d.sent();
                    _d.label = 3;
                case 3:
                    if (!Object.keys(updates).length) return [3 /*break*/, 5];
                    return [4 /*yield*/, storage.updateUser(userId, updates)];
                case 4:
                    _b = _d.sent();
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, storage.getUser(userId)];
                case 6:
                    _b = _d.sent();
                    _d.label = 7;
                case 7:
                    updated = _b;
                    if (!updated) {
                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                    }
                    res.json(sanitizeUser(updated, { includeStripe: true }));
                    return [3 /*break*/, 9];
                case 8:
                    error_20 = _d.sent();
                    console.error("Error updating user info:", error_20);
                    if ((error_20 === null || error_20 === void 0 ? void 0 : error_20.code) === "23505") {
                        return [2 /*return*/, res.status(409).json({
                                message: "Email or phone already in use",
                            })];
                    }
                    res.status(500).json({
                        message: error_20.message || "Failed to update user",
                    });
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/users/:id/parking-pass", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var hosts_1, allEvents, parkingPassEvents, eventsByHost_1, _i, parkingPassEvents_1, event_1, list, today_1, listings, error_21;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, storage.getHostsByUserId(req.params.id)];
                case 1:
                    hosts_1 = _b.sent();
                    if (!hosts_1.length) {
                        return [2 /*return*/, res.json([])];
                    }
                    return [4 /*yield*/, Promise.all(hosts_1.map(function (host) { return storage.getEventsByHost(host.id); }))];
                case 2:
                    allEvents = _b.sent();
                    parkingPassEvents = allEvents
                        .flat()
                        .filter(function (event) { return event.requiresPayment; });
                    eventsByHost_1 = new Map();
                    for (_i = 0, parkingPassEvents_1 = parkingPassEvents; _i < parkingPassEvents_1.length; _i++) {
                        event_1 = parkingPassEvents_1[_i];
                        list = (_a = eventsByHost_1.get(event_1.hostId)) !== null && _a !== void 0 ? _a : [];
                        list.push(event_1);
                        eventsByHost_1.set(event_1.hostId, list);
                    }
                    today_1 = new Date();
                    today_1.setHours(0, 0, 0, 0);
                    listings = hosts_1.flatMap(function (host) {
                        var _a, _b;
                        var hostEvents = (_a = eventsByHost_1.get(host.id)) !== null && _a !== void 0 ? _a : [];
                        if (!hostEvents.length)
                            return [];
                        var sorted = __spreadArray([], hostEvents, true).sort(function (a, b) { return new Date(a.date).getTime() - new Date(b.date).getTime(); });
                        var upcoming = sorted.find(function (event) { return new Date(event.date) >= today_1; });
                        var representative = upcoming !== null && upcoming !== void 0 ? upcoming : sorted[sorted.length - 1];
                        return [
                            __assign(__assign({}, representative), { host: host, nextDate: (_b = upcoming === null || upcoming === void 0 ? void 0 : upcoming.date) !== null && _b !== void 0 ? _b : representative.date, occurrenceCount: hostEvents.length }),
                        ];
                    });
                    res.json(listings);
                    return [3 /*break*/, 4];
                case 3:
                    error_21 = _b.sent();
                    console.error("Error fetching parking pass listings:", error_21);
                    res.status(500).json({ message: "Failed to fetch parking pass listings" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/parking-pass/:id", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var eventId, event_2, updates, fields, _i, fields_1, field, _a, startHour, startMinute, _b, endHour, endMinute, startMinutes, endMinutes, breakfast, lunch, dinner, slotSum, dailyOverride, weeklyOverride, monthlyOverride, baseDaily, pricingUpdates, seriesUpdates, today, scope, updatedEvents, updated, singleUpdated, error_22;
        var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _o.label = 1;
                case 1:
                    _o.trys.push([1, 8, , 9]);
                    eventId = req.params.id;
                    return [4 /*yield*/, storage.getEvent(eventId)];
                case 2:
                    event_2 = _o.sent();
                    if (!event_2) {
                        return [2 /*return*/, res.status(404).json({ message: "Parking pass not found" })];
                    }
                    updates = {};
                    fields = [
                        "startTime",
                        "endTime",
                        "maxTrucks",
                        "status",
                        "breakfastPriceCents",
                        "lunchPriceCents",
                        "dinnerPriceCents",
                        "dailyPriceCents",
                        "weeklyPriceCents",
                        "monthlyPriceCents",
                    ];
                    for (_i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
                        field = fields_1[_i];
                        if (((_c = req.body) === null || _c === void 0 ? void 0 : _c[field]) === undefined)
                            continue;
                        if (field === "startTime" || field === "endTime" || field === "status") {
                            updates[field] = req.body[field];
                        }
                        else {
                            updates[field] = Number(req.body[field]);
                        }
                    }
                    if (updates.startTime && updates.endTime) {
                        _a = String(updates.startTime)
                            .split(":")
                            .map(Number), startHour = _a[0], startMinute = _a[1];
                        _b = String(updates.endTime)
                            .split(":")
                            .map(Number), endHour = _b[0], endMinute = _b[1];
                        startMinutes = startHour * 60 + startMinute;
                        endMinutes = endHour * 60 + endMinute;
                        if (endMinutes <= startMinutes) {
                            return [2 /*return*/, res
                                    .status(400)
                                    .json({ message: "End time must be after start time" })];
                        }
                    }
                    if (updates.maxTrucks !== undefined && updates.maxTrucks < 1) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Max trucks must be at least 1" })];
                    }
                    breakfast = Number((_e = (_d = updates.breakfastPriceCents) !== null && _d !== void 0 ? _d : event_2.breakfastPriceCents) !== null && _e !== void 0 ? _e : 0);
                    lunch = Number((_g = (_f = updates.lunchPriceCents) !== null && _f !== void 0 ? _f : event_2.lunchPriceCents) !== null && _g !== void 0 ? _g : 0);
                    dinner = Number((_j = (_h = updates.dinnerPriceCents) !== null && _h !== void 0 ? _h : event_2.dinnerPriceCents) !== null && _j !== void 0 ? _j : 0);
                    slotSum = breakfast + lunch + dinner;
                    dailyOverride = updates.dailyPriceCents !== undefined
                        ? Number(updates.dailyPriceCents)
                        : null;
                    weeklyOverride = updates.weeklyPriceCents !== undefined
                        ? Number(updates.weeklyPriceCents)
                        : null;
                    monthlyOverride = updates.monthlyPriceCents !== undefined
                        ? Number(updates.monthlyPriceCents)
                        : null;
                    baseDaily = dailyOverride !== null && dailyOverride !== void 0 ? dailyOverride : (slotSum > 0 ? slotSum : (_k = event_2.dailyPriceCents) !== null && _k !== void 0 ? _k : 0);
                    pricingUpdates = {
                        hostPriceCents: slotSum || event_2.hostPriceCents || 0,
                        dailyPriceCents: baseDaily,
                        weeklyPriceCents: weeklyOverride !== null && weeklyOverride !== void 0 ? weeklyOverride : (baseDaily > 0 ? baseDaily * 7 : (_l = event_2.weeklyPriceCents) !== null && _l !== void 0 ? _l : 0),
                        monthlyPriceCents: monthlyOverride !== null && monthlyOverride !== void 0 ? monthlyOverride : (baseDaily > 0 ? baseDaily * 30 : (_m = event_2.monthlyPriceCents) !== null && _m !== void 0 ? _m : 0),
                        requiresPayment: true,
                        updatedAt: new Date(),
                    };
                    if (!event_2.seriesId) return [3 /*break*/, 4];
                    seriesUpdates = { updatedAt: new Date() };
                    if (updates.startTime !== undefined) {
                        seriesUpdates.defaultStartTime = String(updates.startTime);
                    }
                    if (updates.endTime !== undefined) {
                        seriesUpdates.defaultEndTime = String(updates.endTime);
                    }
                    if (updates.maxTrucks !== undefined) {
                        seriesUpdates.defaultMaxTrucks = Number(updates.maxTrucks);
                    }
                    if (!(Object.keys(seriesUpdates).length > 1)) return [3 /*break*/, 4];
                    return [4 /*yield*/, db
                            .update(eventSeries)
                            .set(seriesUpdates)
                            .where(eq(eventSeries.id, event_2.seriesId))];
                case 3:
                    _o.sent();
                    _o.label = 4;
                case 4:
                    today = new Date();
                    today.setHours(0, 0, 0, 0);
                    scope = event_2.seriesId
                        ? eq(events.seriesId, event_2.seriesId)
                        : eq(events.hostId, event_2.hostId);
                    return [4 /*yield*/, db
                            .update(events)
                            .set(__assign(__assign({}, updates), pricingUpdates))
                            .where(and(scope, gte(events.date, today), eq(events.requiresPayment, true)))
                            .returning()];
                case 5:
                    updatedEvents = _o.sent();
                    updated = updatedEvents[0];
                    if (!!updated) return [3 /*break*/, 7];
                    return [4 /*yield*/, db
                            .update(events)
                            .set(__assign(__assign({}, updates), pricingUpdates))
                            .where(eq(events.id, eventId))
                            .returning()];
                case 6:
                    singleUpdated = (_o.sent())[0];
                    updated = singleUpdated;
                    _o.label = 7;
                case 7:
                    res.json(updated !== null && updated !== void 0 ? updated : event_2);
                    return [3 /*break*/, 9];
                case 8:
                    error_22 = _o.sent();
                    console.error("Error updating parking pass:", error_22);
                    res.status(500).json({
                        message: error_22.message || "Failed to update parking pass",
                    });
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/users/:id/status", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var isActive, error_23;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    isActive = req.body.isActive;
                    return [4 /*yield*/, storage.updateUserStatus(req.params.id, isActive)];
                case 2:
                    _a.sent();
                    res.json({ message: "User status updated successfully" });
                    return [3 /*break*/, 4];
                case 3:
                    error_23 = _a.sent();
                    console.error("Error updating user status:", error_23);
                    res.status(500).json({ message: "Failed to update user status" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/users/:id/type", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userType, allowedTypes, error_24;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    userType = req.body.userType;
                    allowedTypes = [
                        "customer",
                        "restaurant_owner",
                        "food_truck",
                        "host",
                        "event_coordinator",
                        "staff",
                        "admin",
                        "super_admin",
                    ];
                    if (!allowedTypes.includes(userType)) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid user type" })];
                    }
                    return [4 /*yield*/, storage.updateUserType(req.params.id, userType)];
                case 2:
                    _a.sent();
                    res.json({ message: "User type updated successfully" });
                    return [3 /*break*/, 4];
                case 3:
                    error_24 = _a.sent();
                    console.error("Error updating user type:", error_24);
                    res.status(500).json({ message: "Failed to update user type" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.delete("/api/admin/users/:id", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var error_25;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, storage.deleteUser(req.params.id)];
                case 2:
                    _a.sent();
                    res.json({ message: "User deleted successfully" });
                    return [3 /*break*/, 4];
                case 3:
                    error_25 = _a.sent();
                    console.error("Error deleting user:", error_25);
                    res.status(500).json({ message: "Failed to delete user" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/users/:userId/addresses", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var addresses, error_26;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.getUserAddresses(req.params.userId)];
                case 1:
                    addresses = _a.sent();
                    res.json(addresses);
                    return [3 /*break*/, 3];
                case 2:
                    error_26 = _a.sent();
                    console.error("Error fetching user addresses:", error_26);
                    res.status(500).json({ message: "Failed to fetch user addresses" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/users/:userId/addresses", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var address, error_27;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _l.label = 1;
                case 1:
                    _l.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, storage.createUserAddress({
                            userId: req.params.userId,
                            label: ((_a = req.body) === null || _a === void 0 ? void 0 : _a.label) || "Address",
                            address: (_b = req.body) === null || _b === void 0 ? void 0 : _b.address,
                            city: (_c = req.body) === null || _c === void 0 ? void 0 : _c.city,
                            state: (_d = req.body) === null || _d === void 0 ? void 0 : _d.state,
                            postalCode: (_e = req.body) === null || _e === void 0 ? void 0 : _e.postalCode,
                            latitude: (_f = req.body) === null || _f === void 0 ? void 0 : _f.latitude,
                            longitude: (_g = req.body) === null || _g === void 0 ? void 0 : _g.longitude,
                            type: ((_h = req.body) === null || _h === void 0 ? void 0 : _h.type) || "other",
                            isDefault: !!((_j = req.body) === null || _j === void 0 ? void 0 : _j.isDefault),
                        })];
                case 2:
                    address = _l.sent();
                    if (!((_k = req.body) === null || _k === void 0 ? void 0 : _k.isDefault)) return [3 /*break*/, 4];
                    return [4 /*yield*/, storage.setDefaultAddress(req.params.userId, address.id)];
                case 3:
                    _l.sent();
                    _l.label = 4;
                case 4:
                    res.json(address);
                    return [3 /*break*/, 6];
                case 5:
                    error_27 = _l.sent();
                    console.error("Error creating user address:", error_27);
                    res.status(500).json({ message: "Failed to create address" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/users/:userId/addresses/:addressId", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var updated, error_28;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _k.label = 1;
                case 1:
                    _k.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, storage.updateUserAddress(req.params.addressId, {
                            label: (_a = req.body) === null || _a === void 0 ? void 0 : _a.label,
                            address: (_b = req.body) === null || _b === void 0 ? void 0 : _b.address,
                            city: (_c = req.body) === null || _c === void 0 ? void 0 : _c.city,
                            state: (_d = req.body) === null || _d === void 0 ? void 0 : _d.state,
                            postalCode: (_e = req.body) === null || _e === void 0 ? void 0 : _e.postalCode,
                            latitude: (_f = req.body) === null || _f === void 0 ? void 0 : _f.latitude,
                            longitude: (_g = req.body) === null || _g === void 0 ? void 0 : _g.longitude,
                            type: (_h = req.body) === null || _h === void 0 ? void 0 : _h.type,
                        })];
                case 2:
                    updated = _k.sent();
                    if (!((_j = req.body) === null || _j === void 0 ? void 0 : _j.isDefault)) return [3 /*break*/, 4];
                    return [4 /*yield*/, storage.setDefaultAddress(req.params.userId, updated.id)];
                case 3:
                    _k.sent();
                    _k.label = 4;
                case 4:
                    res.json(updated);
                    return [3 /*break*/, 6];
                case 5:
                    error_28 = _k.sent();
                    console.error("Error updating user address:", error_28);
                    res.status(500).json({ message: "Failed to update address" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/users/:userId/addresses/:addressId/default", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var error_29;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, storage.setDefaultAddress(req.params.userId, req.params.addressId)];
                case 2:
                    _a.sent();
                    res.json({ message: "Default address updated" });
                    return [3 /*break*/, 4];
                case 3:
                    error_29 = _a.sent();
                    console.error("Error setting default address:", error_29);
                    res.status(500).json({ message: "Failed to set default address" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.delete("/api/admin/users/:userId/addresses/:addressId", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var error_30;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, storage.deleteUserAddress(req.params.addressId)];
                case 2:
                    _a.sent();
                    res.json({ message: "Address deleted" });
                    return [3 /*break*/, 4];
                case 3:
                    error_30 = _a.sent();
                    console.error("Error deleting user address:", error_30);
                    res.status(500).json({ message: "Failed to delete address" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/users/:userId/hosts", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, address, businessName, city, state, newKey_1, existingHosts_1, hasDuplicate, expectedFootTraffic, spotCount, parsed, host, error_31;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
        return __generator(this, function (_y) {
            switch (_y.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _y.label = 1;
                case 1:
                    _y.trys.push([1, 4, , 5]);
                    userId = req.params.userId;
                    address = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.address) === null || _b === void 0 ? void 0 : _b.trim();
                    businessName = (_d = (_c = req.body) === null || _c === void 0 ? void 0 : _c.businessName) === null || _d === void 0 ? void 0 : _d.trim();
                    if (!businessName || !address) {
                        return [2 /*return*/, res.status(400).json({
                                message: "Business name and address are required.",
                            })];
                    }
                    city = ((_f = (_e = req.body) === null || _e === void 0 ? void 0 : _e.city) === null || _f === void 0 ? void 0 : _f.trim()) || null;
                    state = ((_h = (_g = req.body) === null || _g === void 0 ? void 0 : _g.state) === null || _h === void 0 ? void 0 : _h.trim()) || null;
                    newKey_1 = buildLocationKey(address, city, state);
                    return [4 /*yield*/, db
                            .select({
                            address: hosts.address,
                            city: hosts.city,
                            state: hosts.state,
                        })
                            .from(hosts)
                            .where(eq(hosts.userId, userId))];
                case 2:
                    existingHosts_1 = _y.sent();
                    hasDuplicate = existingHosts_1.some(function (host) {
                        return buildLocationKey(host.address, host.city, host.state) === newKey_1;
                    });
                    if (hasDuplicate) {
                        return [2 /*return*/, res.status(409).json({
                                message: "This user already has a host location for that address.",
                            })];
                    }
                    expectedFootTraffic = ((_j = req.body) === null || _j === void 0 ? void 0 : _j.expectedFootTraffic) !== undefined &&
                        ((_k = req.body) === null || _k === void 0 ? void 0 : _k.expectedFootTraffic) !== null &&
                        ((_l = req.body) === null || _l === void 0 ? void 0 : _l.expectedFootTraffic) !== ""
                        ? Number(req.body.expectedFootTraffic)
                        : undefined;
                    spotCount = ((_m = req.body) === null || _m === void 0 ? void 0 : _m.spotCount) !== undefined &&
                        ((_o = req.body) === null || _o === void 0 ? void 0 : _o.spotCount) !== null &&
                        ((_p = req.body) === null || _p === void 0 ? void 0 : _p.spotCount) !== ""
                        ? Number(req.body.spotCount)
                        : undefined;
                    parsed = insertHostSchema.parse({
                        userId: userId,
                        businessName: businessName,
                        address: address,
                        city: city,
                        state: state,
                        locationType: ((_q = req.body) === null || _q === void 0 ? void 0 : _q.locationType) || "other",
                        expectedFootTraffic: Number.isFinite(expectedFootTraffic)
                            ? expectedFootTraffic
                            : undefined,
                        contactPhone: ((_r = req.body) === null || _r === void 0 ? void 0 : _r.contactPhone) || null,
                        notes: ((_s = req.body) === null || _s === void 0 ? void 0 : _s.notes) || null,
                        amenities: (_t = req.body) === null || _t === void 0 ? void 0 : _t.amenities,
                        spotCount: Number.isFinite(spotCount) ? spotCount : undefined,
                        isVerified: true,
                        adminCreated: true,
                        latitude: ((_u = req.body) === null || _u === void 0 ? void 0 : _u.latitude) !== undefined && ((_v = req.body) === null || _v === void 0 ? void 0 : _v.latitude) !== null
                            ? req.body.latitude.toString()
                            : undefined,
                        longitude: ((_w = req.body) === null || _w === void 0 ? void 0 : _w.longitude) !== undefined && ((_x = req.body) === null || _x === void 0 ? void 0 : _x.longitude) !== null
                            ? req.body.longitude.toString()
                            : undefined,
                    });
                    return [4 /*yield*/, storage.createHost(parsed)];
                case 3:
                    host = _y.sent();
                    res.status(201).json(host);
                    return [3 /*break*/, 5];
                case 4:
                    error_31 = _y.sent();
                    console.error("Error creating host location:", error_31);
                    res.status(500).json({ message: "Failed to create host location" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/users/:id/hosts", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var hostsForUser, error_32;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.getHostsByUserId(req.params.id)];
                case 1:
                    hostsForUser = _a.sent();
                    res.json(hostsForUser);
                    return [3 /*break*/, 3];
                case 2:
                    error_32 = _a.sent();
                    console.error("Error fetching user hosts:", error_32);
                    res.status(500).json({ message: "Failed to fetch hosts" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/users/:id/restaurants", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var restaurantsForUser, error_33;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.getRestaurantsByOwner(req.params.id)];
                case 1:
                    restaurantsForUser = _a.sent();
                    res.json(restaurantsForUser);
                    return [3 /*break*/, 3];
                case 2:
                    error_33 = _a.sent();
                    console.error("Error fetching user restaurants:", error_33);
                    res.status(500).json({ message: "Failed to fetch restaurants" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/users/:id/deals", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var ownedRestaurants, restaurantIds, userDeals, error_34;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, storage.getRestaurantsByOwner(req.params.id)];
                case 1:
                    ownedRestaurants = _a.sent();
                    if (!ownedRestaurants.length) {
                        return [2 /*return*/, res.json([])];
                    }
                    restaurantIds = ownedRestaurants.map(function (r) { return r.id; });
                    return [4 /*yield*/, db
                            .select()
                            .from(deals)
                            .where(inArray(deals.restaurantId, restaurantIds))
                            .orderBy(deals.createdAt)];
                case 2:
                    userDeals = _a.sent();
                    res.json(userDeals);
                    return [3 /*break*/, 4];
                case 3:
                    error_34 = _a.sent();
                    console.error("Error fetching user deals:", error_34);
                    res.status(500).json({ message: "Failed to fetch deals" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/users/:id/events", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var hostsForUser, hostIds, userEvents, error_35;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, storage.getHostsByUserId(req.params.id)];
                case 1:
                    hostsForUser = _a.sent();
                    if (!hostsForUser.length) {
                        return [2 /*return*/, res.json([])];
                    }
                    hostIds = hostsForUser.map(function (h) { return h.id; });
                    return [4 /*yield*/, db
                            .select()
                            .from(events)
                            .where(inArray(events.hostId, hostIds))
                            .orderBy(events.date)];
                case 2:
                    userEvents = _a.sent();
                    res.json(userEvents);
                    return [3 /*break*/, 4];
                case 3:
                    error_35 = _a.sent();
                    console.error("Error fetching user events:", error_35);
                    res.status(500).json({ message: "Failed to fetch events" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/users/:id/event-series", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var hostsForUser, hostIds, userSeries, error_36;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, storage.getHostsByUserId(req.params.id)];
                case 1:
                    hostsForUser = _a.sent();
                    if (!hostsForUser.length) {
                        return [2 /*return*/, res.json([])];
                    }
                    hostIds = hostsForUser.map(function (h) { return h.id; });
                    return [4 /*yield*/, db
                            .select()
                            .from(eventSeries)
                            .where(inArray(eventSeries.hostId, hostIds))
                            .orderBy(eventSeries.createdAt)];
                case 2:
                    userSeries = _a.sent();
                    res.json(userSeries);
                    return [3 /*break*/, 4];
                case 3:
                    error_36 = _a.sent();
                    console.error("Error fetching event series:", error_36);
                    res.status(500).json({ message: "Failed to fetch event series" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/users/:id/parking-pass-bookings", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, bookingsAsTruck, hostRows_1, hostIds, bookingsAsHost, _a, error_37;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    userId = req.params.id;
                    return [4 /*yield*/, db
                            .select()
                            .from(eventBookings)
                            .innerJoin(restaurants, eq(eventBookings.truckId, restaurants.id))
                            .where(eq(restaurants.ownerId, userId))];
                case 1:
                    bookingsAsTruck = _b.sent();
                    return [4 /*yield*/, db
                            .select({ id: hosts.id })
                            .from(hosts)
                            .where(eq(hosts.userId, userId))];
                case 2:
                    hostRows_1 = _b.sent();
                    hostIds = hostRows_1.map(function (row) { return row.id; });
                    if (!hostIds.length) return [3 /*break*/, 4];
                    return [4 /*yield*/, db
                            .select()
                            .from(eventBookings)
                            .where(inArray(eventBookings.hostId, hostIds))];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = [];
                    _b.label = 5;
                case 5:
                    bookingsAsHost = _a;
                    res.json({ bookingsAsTruck: bookingsAsTruck, bookingsAsHost: bookingsAsHost });
                    return [3 /*break*/, 7];
                case 6:
                    error_37 = _b.sent();
                    console.error("Error fetching parking pass bookings:", error_37);
                    res.status(500).json({ message: "Failed to fetch bookings" });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/hosts/:id", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var updates_1, updated, error_38;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _o.label = 1;
                case 1:
                    _o.trys.push([1, 4, , 5]);
                    updates_1 = {
                        businessName: (_a = req.body) === null || _a === void 0 ? void 0 : _a.businessName,
                        address: (_b = req.body) === null || _b === void 0 ? void 0 : _b.address,
                        city: (_c = req.body) === null || _c === void 0 ? void 0 : _c.city,
                        state: (_d = req.body) === null || _d === void 0 ? void 0 : _d.state,
                        latitude: (_e = req.body) === null || _e === void 0 ? void 0 : _e.latitude,
                        longitude: (_f = req.body) === null || _f === void 0 ? void 0 : _f.longitude,
                        locationType: (_g = req.body) === null || _g === void 0 ? void 0 : _g.locationType,
                        expectedFootTraffic: (_h = req.body) === null || _h === void 0 ? void 0 : _h.expectedFootTraffic,
                        amenities: (_j = req.body) === null || _j === void 0 ? void 0 : _j.amenities,
                        contactPhone: (_k = req.body) === null || _k === void 0 ? void 0 : _k.contactPhone,
                        notes: (_l = req.body) === null || _l === void 0 ? void 0 : _l.notes,
                        isVerified: (_m = req.body) === null || _m === void 0 ? void 0 : _m.isVerified,
                    };
                    Object.keys(updates_1).forEach(function (key) {
                        if (updates_1[key] === undefined) {
                            delete updates_1[key];
                        }
                    });
                    return [4 /*yield*/, db
                            .update(hosts)
                            .set(__assign(__assign({}, updates_1), { updatedAt: new Date() }))
                            .where(eq(hosts.id, req.params.id))
                            .returning()];
                case 2:
                    updated = (_o.sent())[0];
                    return [4 /*yield*/, storage.ensureDraftParkingPassForHost(updated.id)];
                case 3:
                    _o.sent();
                    res.json(updated);
                    return [3 /*break*/, 5];
                case 4:
                    error_38 = _o.sent();
                    console.error("Error updating host:", error_38);
                    res.status(500).json({ message: "Failed to update host" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.delete("/api/admin/hosts/:hostId", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var hostId, host, existingBookings, error_39;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    hostId = req.params.hostId;
                    return [4 /*yield*/, storage.getHost(hostId)];
                case 2:
                    host = _a.sent();
                    if (!host) {
                        return [2 /*return*/, res.status(404).json({ message: "Host location not found" })];
                    }
                    return [4 /*yield*/, db
                            .select({ id: eventBookings.id })
                            .from(eventBookings)
                            .where(eq(eventBookings.hostId, hostId))
                            .limit(1)];
                case 3:
                    existingBookings = _a.sent();
                    if (existingBookings.length > 0) {
                        return [2 /*return*/, res.status(409).json({
                                message: "This location has bookings and cannot be deleted.",
                            })];
                    }
                    return [4 /*yield*/, db.delete(hosts).where(eq(hosts.id, hostId))];
                case 4:
                    _a.sent();
                    res.json({ message: "Host location deleted" });
                    return [3 /*break*/, 6];
                case 5:
                    error_39 = _a.sent();
                    console.error("Error deleting host location:", error_39);
                    res.status(500).json({ message: "Failed to delete host location" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/restaurants/:id", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var updates_2, updated, error_40;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        return __generator(this, function (_t) {
            switch (_t.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _t.label = 1;
                case 1:
                    _t.trys.push([1, 3, , 4]);
                    updates_2 = {
                        name: (_a = req.body) === null || _a === void 0 ? void 0 : _a.name,
                        address: (_b = req.body) === null || _b === void 0 ? void 0 : _b.address,
                        phone: (_c = req.body) === null || _c === void 0 ? void 0 : _c.phone,
                        businessType: (_d = req.body) === null || _d === void 0 ? void 0 : _d.businessType,
                        cuisineType: (_e = req.body) === null || _e === void 0 ? void 0 : _e.cuisineType,
                        promoCode: (_f = req.body) === null || _f === void 0 ? void 0 : _f.promoCode,
                        city: (_g = req.body) === null || _g === void 0 ? void 0 : _g.city,
                        state: (_h = req.body) === null || _h === void 0 ? void 0 : _h.state,
                        latitude: (_j = req.body) === null || _j === void 0 ? void 0 : _j.latitude,
                        longitude: (_k = req.body) === null || _k === void 0 ? void 0 : _k.longitude,
                        isActive: (_l = req.body) === null || _l === void 0 ? void 0 : _l.isActive,
                        isVerified: (_m = req.body) === null || _m === void 0 ? void 0 : _m.isVerified,
                        description: (_o = req.body) === null || _o === void 0 ? void 0 : _o.description,
                        websiteUrl: (_p = req.body) === null || _p === void 0 ? void 0 : _p.websiteUrl,
                        instagramUrl: (_q = req.body) === null || _q === void 0 ? void 0 : _q.instagramUrl,
                        facebookPageUrl: (_r = req.body) === null || _r === void 0 ? void 0 : _r.facebookPageUrl,
                        amenities: (_s = req.body) === null || _s === void 0 ? void 0 : _s.amenities,
                    };
                    Object.keys(updates_2).forEach(function (key) {
                        if (updates_2[key] === undefined) {
                            delete updates_2[key];
                        }
                    });
                    return [4 /*yield*/, storage.updateRestaurant(req.params.id, updates_2)];
                case 2:
                    updated = _t.sent();
                    res.json(updated);
                    return [3 /*break*/, 4];
                case 3:
                    error_40 = _t.sent();
                    console.error("Error updating restaurant:", error_40);
                    res.status(500).json({ message: "Failed to update restaurant" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/restaurants/:id/deals", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var restaurantDeals, error_41;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.getDealsByRestaurant(req.params.id)];
                case 1:
                    restaurantDeals = _a.sent();
                    res.json(restaurantDeals);
                    return [3 /*break*/, 3];
                case 2:
                    error_41 = _a.sent();
                    console.error("Error fetching restaurant deals:", error_41);
                    res.status(500).json({ message: "Failed to fetch deals" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/deals/:id", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var updates_3, updated, error_42;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _r.label = 1;
                case 1:
                    _r.trys.push([1, 3, , 4]);
                    updates_3 = {
                        title: (_a = req.body) === null || _a === void 0 ? void 0 : _a.title,
                        description: (_b = req.body) === null || _b === void 0 ? void 0 : _b.description,
                        dealType: (_c = req.body) === null || _c === void 0 ? void 0 : _c.dealType,
                        discountValue: ((_d = req.body) === null || _d === void 0 ? void 0 : _d.discountValue) !== undefined
                            ? Number(req.body.discountValue)
                            : undefined,
                        minOrderAmount: ((_e = req.body) === null || _e === void 0 ? void 0 : _e.minOrderAmount) !== undefined
                            ? Number(req.body.minOrderAmount)
                            : undefined,
                        imageUrl: (_f = req.body) === null || _f === void 0 ? void 0 : _f.imageUrl,
                        startDate: ((_g = req.body) === null || _g === void 0 ? void 0 : _g.startDate)
                            ? new Date(req.body.startDate)
                            : undefined,
                        endDate: ((_h = req.body) === null || _h === void 0 ? void 0 : _h.endDate) ? new Date(req.body.endDate) : undefined,
                        startTime: (_j = req.body) === null || _j === void 0 ? void 0 : _j.startTime,
                        endTime: (_k = req.body) === null || _k === void 0 ? void 0 : _k.endTime,
                        availableDuringBusinessHours: (_l = req.body) === null || _l === void 0 ? void 0 : _l.availableDuringBusinessHours,
                        isOngoing: (_m = req.body) === null || _m === void 0 ? void 0 : _m.isOngoing,
                        totalUsesLimit: ((_o = req.body) === null || _o === void 0 ? void 0 : _o.totalUsesLimit) !== undefined
                            ? Number(req.body.totalUsesLimit)
                            : undefined,
                        perCustomerLimit: ((_p = req.body) === null || _p === void 0 ? void 0 : _p.perCustomerLimit) !== undefined
                            ? Number(req.body.perCustomerLimit)
                            : undefined,
                        isActive: (_q = req.body) === null || _q === void 0 ? void 0 : _q.isActive,
                    };
                    Object.keys(updates_3).forEach(function (key) {
                        if (updates_3[key] === undefined) {
                            delete updates_3[key];
                        }
                    });
                    return [4 /*yield*/, storage.updateDeal(req.params.id, updates_3)];
                case 2:
                    updated = _r.sent();
                    res.json(updated);
                    return [3 /*break*/, 4];
                case 3:
                    error_42 = _r.sent();
                    console.error("Error updating deal:", error_42);
                    res.status(500).json({ message: "Failed to update deal" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/events/:id", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var eventId, event_3, updates_4, _a, startHour, startMinute, _b, endHour, endMinute, startMinutes, endMinutes, breakfast, lunch, dinner, slotSum, updated, error_43;
        var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
        return __generator(this, function (_w) {
            switch (_w.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _w.label = 1;
                case 1:
                    _w.trys.push([1, 4, , 5]);
                    eventId = req.params.id;
                    return [4 /*yield*/, storage.getEvent(eventId)];
                case 2:
                    event_3 = _w.sent();
                    if (!event_3) {
                        return [2 /*return*/, res.status(404).json({ message: "Event not found" })];
                    }
                    updates_4 = {
                        name: (_c = req.body) === null || _c === void 0 ? void 0 : _c.name,
                        description: (_d = req.body) === null || _d === void 0 ? void 0 : _d.description,
                        date: ((_e = req.body) === null || _e === void 0 ? void 0 : _e.date) ? new Date(req.body.date) : undefined,
                        startTime: (_f = req.body) === null || _f === void 0 ? void 0 : _f.startTime,
                        endTime: (_g = req.body) === null || _g === void 0 ? void 0 : _g.endTime,
                        maxTrucks: ((_h = req.body) === null || _h === void 0 ? void 0 : _h.maxTrucks) !== undefined
                            ? Number(req.body.maxTrucks)
                            : undefined,
                        status: (_j = req.body) === null || _j === void 0 ? void 0 : _j.status,
                        hardCapEnabled: (_k = req.body) === null || _k === void 0 ? void 0 : _k.hardCapEnabled,
                        requiresPayment: (_l = req.body) === null || _l === void 0 ? void 0 : _l.requiresPayment,
                        breakfastPriceCents: ((_m = req.body) === null || _m === void 0 ? void 0 : _m.breakfastPriceCents) !== undefined
                            ? Number(req.body.breakfastPriceCents)
                            : undefined,
                        lunchPriceCents: ((_o = req.body) === null || _o === void 0 ? void 0 : _o.lunchPriceCents) !== undefined
                            ? Number(req.body.lunchPriceCents)
                            : undefined,
                        dinnerPriceCents: ((_p = req.body) === null || _p === void 0 ? void 0 : _p.dinnerPriceCents) !== undefined
                            ? Number(req.body.dinnerPriceCents)
                            : undefined,
                    };
                    Object.keys(updates_4).forEach(function (key) {
                        if (updates_4[key] === undefined) {
                            delete updates_4[key];
                        }
                    });
                    if (updates_4.startTime && updates_4.endTime) {
                        _a = String(updates_4.startTime)
                            .split(":")
                            .map(Number), startHour = _a[0], startMinute = _a[1];
                        _b = String(updates_4.endTime)
                            .split(":")
                            .map(Number), endHour = _b[0], endMinute = _b[1];
                        startMinutes = startHour * 60 + startMinute;
                        endMinutes = endHour * 60 + endMinute;
                        if (endMinutes <= startMinutes) {
                            return [2 /*return*/, res
                                    .status(400)
                                    .json({ message: "End time must be after start time" })];
                        }
                    }
                    breakfast = Number((_r = (_q = updates_4.breakfastPriceCents) !== null && _q !== void 0 ? _q : event_3.breakfastPriceCents) !== null && _r !== void 0 ? _r : 0);
                    lunch = Number((_t = (_s = updates_4.lunchPriceCents) !== null && _s !== void 0 ? _s : event_3.lunchPriceCents) !== null && _t !== void 0 ? _t : 0);
                    dinner = Number((_v = (_u = updates_4.dinnerPriceCents) !== null && _u !== void 0 ? _u : event_3.dinnerPriceCents) !== null && _v !== void 0 ? _v : 0);
                    slotSum = breakfast + lunch + dinner;
                    updates_4.hostPriceCents = slotSum;
                    updates_4.dailyPriceCents = slotSum;
                    updates_4.weeklyPriceCents = slotSum * 7;
                    updates_4.monthlyPriceCents = slotSum * 30;
                    updates_4.updatedAt = new Date();
                    return [4 /*yield*/, db
                            .update(events)
                            .set(updates_4)
                            .where(eq(events.id, eventId))
                            .returning()];
                case 3:
                    updated = (_w.sent())[0];
                    res.json(updated);
                    return [3 /*break*/, 5];
                case 4:
                    error_43 = _w.sent();
                    console.error("Error updating event:", error_43);
                    res.status(500).json({ message: "Failed to update event" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/event-series/:id", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var updates_5, updated, error_44;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _m.label = 1;
                case 1:
                    _m.trys.push([1, 3, , 4]);
                    updates_5 = {
                        name: (_a = req.body) === null || _a === void 0 ? void 0 : _a.name,
                        description: (_b = req.body) === null || _b === void 0 ? void 0 : _b.description,
                        timezone: (_c = req.body) === null || _c === void 0 ? void 0 : _c.timezone,
                        recurrenceRule: (_d = req.body) === null || _d === void 0 ? void 0 : _d.recurrenceRule,
                        startDate: ((_e = req.body) === null || _e === void 0 ? void 0 : _e.startDate)
                            ? new Date(req.body.startDate)
                            : undefined,
                        endDate: ((_f = req.body) === null || _f === void 0 ? void 0 : _f.endDate) ? new Date(req.body.endDate) : undefined,
                        defaultStartTime: (_g = req.body) === null || _g === void 0 ? void 0 : _g.defaultStartTime,
                        defaultEndTime: (_h = req.body) === null || _h === void 0 ? void 0 : _h.defaultEndTime,
                        defaultMaxTrucks: ((_j = req.body) === null || _j === void 0 ? void 0 : _j.defaultMaxTrucks) !== undefined
                            ? Number(req.body.defaultMaxTrucks)
                            : undefined,
                        defaultHardCapEnabled: (_k = req.body) === null || _k === void 0 ? void 0 : _k.defaultHardCapEnabled,
                        status: (_l = req.body) === null || _l === void 0 ? void 0 : _l.status,
                    };
                    Object.keys(updates_5).forEach(function (key) {
                        if (updates_5[key] === undefined) {
                            delete updates_5[key];
                        }
                    });
                    return [4 /*yield*/, db
                            .update(eventSeries)
                            .set(__assign(__assign({}, updates_5), { updatedAt: new Date() }))
                            .where(eq(eventSeries.id, req.params.id))
                            .returning()];
                case 2:
                    updated = (_m.sent())[0];
                    res.json(updated);
                    return [3 /*break*/, 4];
                case 3:
                    error_44 = _m.sent();
                    console.error("Error updating event series:", error_44);
                    res.status(500).json({ message: "Failed to update event series" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/parking-pass-bookings/:id", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var updates_6, updated, error_45;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (denyStaffEdits(req, res))
                        return [2 /*return*/];
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, , 4]);
                    updates_6 = {
                        status: (_a = req.body) === null || _a === void 0 ? void 0 : _a.status,
                        refundStatus: (_b = req.body) === null || _b === void 0 ? void 0 : _b.refundStatus,
                        refundAmountCents: ((_c = req.body) === null || _c === void 0 ? void 0 : _c.refundAmountCents) !== undefined
                            ? Number(req.body.refundAmountCents)
                            : undefined,
                        cancellationReason: (_d = req.body) === null || _d === void 0 ? void 0 : _d.cancellationReason,
                        refundReason: (_e = req.body) === null || _e === void 0 ? void 0 : _e.refundReason,
                    };
                    Object.keys(updates_6).forEach(function (key) {
                        if (updates_6[key] === undefined) {
                            delete updates_6[key];
                        }
                    });
                    return [4 /*yield*/, db
                            .update(eventBookings)
                            .set(__assign(__assign({}, updates_6), { updatedAt: new Date() }))
                            .where(eq(eventBookings.id, req.params.id))
                            .returning()];
                case 2:
                    updated = (_f.sent())[0];
                    res.json(updated);
                    return [3 /*break*/, 4];
                case 3:
                    error_45 = _f.sent();
                    console.error("Error updating booking:", error_45);
                    res.status(500).json({ message: "Failed to update booking" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/deals", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var deals_1, error_46;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.getAllDealsWithRestaurants()];
                case 1:
                    deals_1 = _a.sent();
                    res.json(deals_1);
                    return [3 /*break*/, 3];
                case 2:
                    error_46 = _a.sent();
                    console.error("Error fetching deals:", error_46);
                    res.status(500).json({ message: "Failed to fetch deals" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.get("/api/admin/deals/:dealId/stats", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var dealId, _a, viewsCount, claimsCount, feedbackStats, error_47;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    dealId = req.params.dealId;
                    return [4 /*yield*/, Promise.all([
                            storage.getDealViewsCount(dealId),
                            storage.getDealClaimsCount(dealId),
                            storage.getDealFeedbackStats(dealId),
                        ])];
                case 1:
                    _a = _b.sent(), viewsCount = _a[0], claimsCount = _a[1], feedbackStats = _a[2];
                    res.json({
                        views: viewsCount,
                        claims: claimsCount,
                        averageRating: feedbackStats.averageRating,
                        totalFeedback: feedbackStats.totalFeedback,
                        ratingDistribution: feedbackStats.ratingDistribution,
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_47 = _b.sent();
                    console.error("Error fetching deal stats:", error_47);
                    res.status(500).json({ message: "Failed to fetch deal statistics" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.delete("/api/admin/deals/:dealId", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var error_48;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.deleteDeal(req.params.dealId)];
                case 1:
                    _a.sent();
                    res.json({ message: "Deal deleted successfully" });
                    return [3 /*break*/, 3];
                case 2:
                    error_48 = _a.sent();
                    console.error("Error deleting deal:", error_48);
                    res.status(500).json({ message: "Failed to delete deal" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/deals/:dealId/clone", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var clonedDeal, error_49;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.duplicateDeal(req.params.dealId)];
                case 1:
                    clonedDeal = _a.sent();
                    res.json(clonedDeal);
                    return [3 /*break*/, 3];
                case 2:
                    error_49 = _a.sent();
                    console.error("Error cloning deal:", error_49);
                    res.status(500).json({ message: "Failed to clone deal" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/deals/:dealId/status", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var isActive, error_50;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    isActive = req.body.isActive;
                    return [4 /*yield*/, storage.updateDeal(req.params.dealId, { isActive: isActive })];
                case 1:
                    _a.sent();
                    res.json({ message: "Deal status updated successfully" });
                    return [3 /*break*/, 3];
                case 2:
                    error_50 = _a.sent();
                    console.error("Error updating deal status:", error_50);
                    res.status(500).json({ message: "Failed to update deal status" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.patch("/api/admin/deals/:dealId/extend", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var days, deal, newEndDate, error_51;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    days = req.body.days;
                    if (!days || days < 1) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid number of days" })];
                    }
                    return [4 /*yield*/, storage.getDeal(req.params.dealId)];
                case 1:
                    deal = _a.sent();
                    if (!deal) {
                        return [2 /*return*/, res.status(404).json({ message: "Deal not found" })];
                    }
                    if (!deal.endDate) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Cannot extend ongoing deals (no end date)" })];
                    }
                    newEndDate = new Date(deal.endDate);
                    newEndDate.setDate(newEndDate.getDate() + days);
                    return [4 /*yield*/, storage.updateDeal(req.params.dealId, { endDate: newEndDate })];
                case 2:
                    _a.sent();
                    res.json({ message: "Deal extended by ".concat(days, " days"), newEndDate: newEndDate });
                    return [3 /*break*/, 4];
                case 3:
                    error_51 = _a.sent();
                    console.error("Error extending deal:", error_51);
                    res.status(500).json({ message: "Failed to extend deal" });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    // Admin verification routes
    app.get("/api/admin/verifications", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var status_2, verifications, error_52;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    status_2 = req.query.status;
                    return [4 /*yield*/, storage.getVerificationRequests()];
                case 1:
                    verifications = _a.sent();
                    // Filter by status if provided
                    if (status_2 &&
                        ["pending", "approved", "rejected"].includes(status_2)) {
                        verifications = verifications.filter(function (v) { return v.status === status_2; });
                    }
                    res.json(verifications);
                    return [3 /*break*/, 3];
                case 2:
                    error_52 = _a.sent();
                    console.error("Error fetching verification requests:", error_52);
                    res
                        .status(500)
                        .json({ message: "Failed to fetch verification requests" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/verifications/:id/approve", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var user, id, claimContext, notificationEmail, error_53;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, , 11]);
                    user = req.user;
                    id = req.params.id;
                    return [4 /*yield*/, storage.approveVerificationRequest(id, user.id)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, db
                            .select({
                            restaurantId: restaurants.id,
                            claimedFromImportId: restaurants.claimedFromImportId,
                            ownerId: restaurants.ownerId,
                            ownerEmail: users.email,
                        })
                            .from(verificationRequests)
                            .innerJoin(restaurants, eq(verificationRequests.restaurantId, restaurants.id))
                            .innerJoin(users, eq(restaurants.ownerId, users.id))
                            .where(eq(verificationRequests.id, id))
                            .limit(1)];
                case 2:
                    claimContext = (_a.sent())[0];
                    if (!(claimContext === null || claimContext === void 0 ? void 0 : claimContext.claimedFromImportId)) return [3 /*break*/, 9];
                    return [4 /*yield*/, db
                            .update(truckImportListings)
                            .set({
                            status: "claimed",
                            updatedAt: new Date(),
                        })
                            .where(eq(truckImportListings.id, claimContext.claimedFromImportId))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, db
                            .update(truckClaimRequests)
                            .set({
                            status: "approved",
                            reviewerId: user.id,
                            reviewedAt: new Date(),
                            updatedAt: new Date(),
                        })
                            .where(eq(truckClaimRequests.restaurantId, claimContext.restaurantId))];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, db
                            .update(restaurants)
                            .set({
                            isActive: true,
                            updatedAt: new Date(),
                        })
                            .where(eq(restaurants.id, claimContext.restaurantId))];
                case 5:
                    _a.sent();
                    notificationEmail = "notifications@mealscout.us";
                    if (!claimContext.ownerEmail) return [3 /*break*/, 7];
                    return [4 /*yield*/, emailService.sendBasicEmail(claimContext.ownerEmail, "Your food truck claim was approved", "\n                <p>Your food truck claim has been approved.</p>\n                <p><strong>Restaurant ID:</strong> ".concat(claimContext.restaurantId, "</p>\n              "))];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [4 /*yield*/, emailService.sendBasicEmail(notificationEmail, "Food Truck Claim Approved", "\n              <p>A food truck claim was approved.</p>\n              <p><strong>Restaurant ID:</strong> ".concat(claimContext.restaurantId, "</p>\n              <p><strong>Owner ID:</strong> ").concat(claimContext.ownerId, "</p>\n            "))];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    res.json({ success: true, message: "Verification request approved" });
                    return [3 /*break*/, 11];
                case 10:
                    error_53 = _a.sent();
                    console.error("Error approving verification request:", error_53);
                    res
                        .status(500)
                        .json({ message: "Failed to approve verification request" });
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    }); });
    app.post("/api/admin/verifications/:id/reject", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var user, id, reason, claimContext, notificationEmail, error_54;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    user = req.user;
                    id = req.params.id;
                    reason = req.body.reason;
                    if (!reason || reason.trim().length === 0) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: "Rejection reason is required" })];
                    }
                    return [4 /*yield*/, storage.rejectVerificationRequest(id, user.id, reason)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, db
                            .select({
                            restaurantId: restaurants.id,
                            claimedFromImportId: restaurants.claimedFromImportId,
                            ownerId: restaurants.ownerId,
                            ownerEmail: users.email,
                        })
                            .from(verificationRequests)
                            .innerJoin(restaurants, eq(verificationRequests.restaurantId, restaurants.id))
                            .innerJoin(users, eq(restaurants.ownerId, users.id))
                            .where(eq(verificationRequests.id, id))
                            .limit(1)];
                case 2:
                    claimContext = (_a.sent())[0];
                    if (!(claimContext === null || claimContext === void 0 ? void 0 : claimContext.claimedFromImportId)) return [3 /*break*/, 8];
                    return [4 /*yield*/, db
                            .update(truckImportListings)
                            .set({
                            status: "rejected",
                            updatedAt: new Date(),
                        })
                            .where(eq(truckImportListings.id, claimContext.claimedFromImportId))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, db
                            .update(truckClaimRequests)
                            .set({
                            status: "rejected",
                            reviewerId: user.id,
                            reviewedAt: new Date(),
                            rejectionReason: reason,
                            updatedAt: new Date(),
                        })
                            .where(eq(truckClaimRequests.restaurantId, claimContext.restaurantId))];
                case 4:
                    _a.sent();
                    notificationEmail = "notifications@mealscout.us";
                    if (!claimContext.ownerEmail) return [3 /*break*/, 6];
                    return [4 /*yield*/, emailService.sendBasicEmail(claimContext.ownerEmail, "Your food truck claim was rejected", "\n                <p>Your food truck claim was rejected.</p>\n                <p><strong>Reason:</strong> ".concat(reason, "</p>\n                <p><strong>Restaurant ID:</strong> ").concat(claimContext.restaurantId, "</p>\n              "))];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [4 /*yield*/, emailService.sendBasicEmail(notificationEmail, "Food Truck Claim Rejected", "\n              <p>A food truck claim was rejected.</p>\n              <p><strong>Restaurant ID:</strong> ".concat(claimContext.restaurantId, "</p>\n              <p><strong>Owner ID:</strong> ").concat(claimContext.ownerId, "</p>\n              <p><strong>Reason:</strong> ").concat(reason, "</p>\n            "))];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    res.json({ success: true, message: "Verification request rejected" });
                    return [3 /*break*/, 10];
                case 9:
                    error_54 = _a.sent();
                    console.error("Error rejecting verification request:", error_54);
                    res
                        .status(500)
                        .json({ message: "Failed to reject verification request" });
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    }); });
    // OAuth configuration status check
    app.get("/api/admin/oauth/status", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
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
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;

