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
import { storage } from "./storage.js";
import { isAuthenticated, isAdmin, isStaffOrAdmin } from "./unifiedAuth.js";
import { logAudit } from "./auditLogger.js";
import { sendAccountSetupInvite } from "./utils/accountSetup.js";
import bcrypt from "bcryptjs";
/**
 * Staff Management & User Creation Routes
 *
 * Admin-only routes:
 * - List staff members
 * - Promote user to staff
 * - Demote/disable staff
 *
 * Staff-or-Admin routes:
 * - Create user accounts with email invite links
 */
export function registerStaffRoutes(app) {
    // ============================================
    // ADMIN-ONLY: Staff Management
    // ============================================
    var _this = this;
    /**
     * GET /api/admin/staff
     * List all staff members
     */
    app.get("/api/admin/staff", isAuthenticated, isAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var staffMembers, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, storage.getUsersByRole("staff")];
                case 1:
                    staffMembers = _a.sent();
                    res.json(staffMembers);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error fetching staff:", error_1);
                    res.status(500).json({ error: "Failed to fetch staff members" });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    /**
     * POST /api/admin/staff/:userId/promote
     * Promote a user to staff role
     */
    app.post("/api/admin/staff/:userId/promote", isAuthenticated, isAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, adminUser, user, SUPER_ADMIN_EMAIL, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    userId = req.params.userId;
                    adminUser = req.user;
                    // Prevent self-promotion edge cases
                    if (userId === adminUser.id) {
                        return [2 /*return*/, res.status(400).json({ error: "Cannot modify your own role" })];
                    }
                    return [4 /*yield*/, storage.getUser(userId)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).json({ error: "User not found" })];
                    }
                    SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info.mealscout@gmail.com";
                    if (user.email === SUPER_ADMIN_EMAIL) {
                        return [2 /*return*/, res
                                .status(403)
                                .json({ error: "Cannot modify super admin account" })];
                    }
                    // Cannot promote admin/staff to staff (no-op or error)
                    if (user.userType === "admin" || user.userType === "staff") {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ error: "User is already staff or admin" })];
                    }
                    return [4 /*yield*/, storage.updateUserType(userId, "staff")];
                case 2:
                    _a.sent();
                    // Audit log
                    return [4 /*yield*/, logAudit(adminUser.id, "staff_promoted", "user", userId, req.ip || "unknown", req.get("User-Agent") || "unknown", { previousRole: user.userType, newRole: "staff" })];
                case 3:
                    // Audit log
                    _a.sent();
                    res.json({ success: true, message: "User promoted to staff" });
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error("Error promoting staff:", error_2);
                    res.status(500).json({ error: "Failed to promote user to staff" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    /**
     * POST /api/admin/staff/:userId/demote
     * Demote staff to customer (or disable)
     */
    app.post("/api/admin/staff/:userId/demote", isAuthenticated, isAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, _a, disable, adminUser, user, SUPER_ADMIN_EMAIL, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 8, , 9]);
                    userId = req.params.userId;
                    _a = req.body.disable, disable = _a === void 0 ? false : _a;
                    adminUser = req.user;
                    if (userId === adminUser.id) {
                        return [2 /*return*/, res.status(400).json({ error: "Cannot modify your own role" })];
                    }
                    return [4 /*yield*/, storage.getUser(userId)];
                case 1:
                    user = _b.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).json({ error: "User not found" })];
                    }
                    SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info.mealscout@gmail.com";
                    if (user.email === SUPER_ADMIN_EMAIL) {
                        return [2 /*return*/, res
                                .status(403)
                                .json({ error: "Cannot modify super admin account" })];
                    }
                    if (user.userType !== "staff") {
                        return [2 /*return*/, res.status(400).json({ error: "User is not staff" })];
                    }
                    if (!disable) return [3 /*break*/, 4];
                    return [4 /*yield*/, storage.disableUser(userId)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, logAudit(adminUser.id, "staff_disabled", "user", userId, req.ip || "unknown", req.get("User-Agent") || "unknown", { reason: "admin_action" })];
                case 3:
                    _b.sent();
                    res.json({ success: true, message: "Staff account disabled" });
                    return [3 /*break*/, 7];
                case 4: return [4 /*yield*/, storage.updateUserType(userId, "customer")];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, logAudit(adminUser.id, "staff_demoted", "user", userId, req.ip || "unknown", req.get("User-Agent") || "unknown", { previousRole: "staff", newRole: "customer" })];
                case 6:
                    _b.sent();
                    res.json({ success: true, message: "Staff demoted to customer" });
                    _b.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    error_3 = _b.sent();
                    console.error("Error demoting staff:", error_3);
                    res.status(500).json({ error: "Failed to demote staff" });
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    }); });
    // ============================================
    // STAFF-OR-ADMIN: User Creation
    // ============================================
    /**
     * POST /api/staff/users
     * Create a user account (staff or admin)
     * Accepts optional userType parameter (customer, restaurant_owner, staff, admin)
     * Sends email with account setup link
     */
    app.post("/api/staff/users", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, email, firstName, lastName, phone, userType, businessName, address, cuisineType, latitude, longitude, locationType, footTraffic, amenities, staffUser, validUserTypes, targetUserType, normalizedEmail, existingUser, user, footTrafficMap, amenitiesObj_1, resolvedLocationType, hostData, emailSent, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    _a = req.body, email = _a.email, firstName = _a.firstName, lastName = _a.lastName, phone = _a.phone, userType = _a.userType, businessName = _a.businessName, address = _a.address, cuisineType = _a.cuisineType, latitude = _a.latitude, longitude = _a.longitude, locationType = _a.locationType, footTraffic = _a.footTraffic, amenities = _a.amenities;
                    staffUser = req.user;
                    if (!email || typeof email !== "string") {
                        return [2 /*return*/, res.status(400).json({ error: "Valid email is required" })];
                    }
                    validUserTypes = [
                        "customer",
                        "restaurant_owner",
                        "food_truck",
                        "host",
                        "event_coordinator",
                        "staff",
                        "admin",
                    ];
                    targetUserType = userType && validUserTypes.includes(userType) ? userType : "customer";
                    // Only admins can create staff or admin accounts
                    if ((targetUserType === "staff" || targetUserType === "admin") &&
                        staffUser.userType !== "admin" &&
                        staffUser.userType !== "super_admin") {
                        return [2 /*return*/, res
                                .status(403)
                                .json({ error: "Only admins can create staff or admin accounts" })];
                    }
                    normalizedEmail = email.trim().toLowerCase();
                    return [4 /*yield*/, storage.getUserByEmail(normalizedEmail)];
                case 1:
                    existingUser = _b.sent();
                    if (existingUser) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ error: "User with this email already exists" })];
                    }
                    return [4 /*yield*/, storage.createUserInvite({
                            email: normalizedEmail,
                            firstName: (firstName === null || firstName === void 0 ? void 0 : firstName.trim()) || null,
                            lastName: (lastName === null || lastName === void 0 ? void 0 : lastName.trim()) || null,
                            phone: (phone === null || phone === void 0 ? void 0 : phone.trim()) || null,
                            userType: targetUserType,
                        })];
                case 2:
                    user = _b.sent();
                    if (!((targetUserType === "restaurant_owner" ||
                        targetUserType === "food_truck") &&
                        businessName &&
                        address)) return [3 /*break*/, 4];
                    return [4 /*yield*/, storage.createRestaurantForUser({
                            userId: user.id,
                            name: businessName,
                            address: address,
                            cuisineType: cuisineType || "Various",
                        })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    if (!((targetUserType === "host" ||
                        targetUserType === "event_coordinator") &&
                        businessName &&
                        address)) return [3 /*break*/, 6];
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
                    resolvedLocationType = targetUserType === "event_coordinator"
                        ? "event_coordinator"
                        : locationType || "other";
                    hostData = {
                        userId: user.id,
                        businessName: businessName,
                        address: address,
                        locationType: resolvedLocationType,
                        expectedFootTraffic: footTrafficMap[footTraffic] || 100,
                        amenities: Object.keys(amenitiesObj_1).length > 0 ? amenitiesObj_1 : null,
                        isVerified: true,
                        adminCreated: true,
                    };
                    if (latitude && longitude) {
                        hostData.latitude = latitude.toString();
                        hostData.longitude = longitude.toString();
                    }
                    return [4 /*yield*/, storage.createHost(hostData)];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6: return [4 /*yield*/, sendAccountSetupInvite({
                        user: user,
                        createdBy: staffUser,
                        req: req,
                    })];
                case 7:
                    emailSent = _b.sent();
                    // Audit log
                    return [4 /*yield*/, logAudit(staffUser.id, "user_created_by_staff", "user", user.id, req.ip || "unknown", req.get("User-Agent") || "unknown", {
                            createdUserType: targetUserType,
                            createdByRole: staffUser.userType,
                        })];
                case 8:
                    // Audit log
                    _b.sent();
                    res.json({
                        success: true,
                        userId: user.id,
                        email: normalizedEmail,
                        setupEmailSent: emailSent,
                        message: "".concat(targetUserType.replace("_", " "), " account created. Setup instructions sent to ").concat(normalizedEmail, "."),
                    });
                    return [3 /*break*/, 10];
                case 9:
                    error_4 = _b.sent();
                    console.error("Error creating user:", error_4);
                    res.status(500).json({ error: "Failed to create user account" });
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    }); });
    /**
     * POST /api/staff/restaurant-owners
     * Create restaurant owner + optional restaurant shell (staff or admin)
     * Returns temp password that must be reset on first login
     */
    app.post("/api/staff/restaurant-owners", isAuthenticated, isStaffOrAdmin, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var _a, email, firstName, lastName, phone, restaurantName, restaurantAddress, restaurantPhone, staffUser, normalizedEmail, existingUser, user, restaurantId, restaurant, emailSent, error_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 7, , 8]);
                    _a = req.body, email = _a.email, firstName = _a.firstName, lastName = _a.lastName, phone = _a.phone, restaurantName = _a.restaurantName, restaurantAddress = _a.restaurantAddress, restaurantPhone = _a.restaurantPhone;
                    staffUser = req.user;
                    if (!email || typeof email !== "string") {
                        return [2 /*return*/, res.status(400).json({ error: "Valid email is required" })];
                    }
                    normalizedEmail = email.trim().toLowerCase();
                    return [4 /*yield*/, storage.getUserByEmail(normalizedEmail)];
                case 1:
                    existingUser = _b.sent();
                    if (existingUser) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ error: "User with this email already exists" })];
                    }
                    return [4 /*yield*/, storage.createUserInvite({
                            email: normalizedEmail,
                            firstName: (firstName === null || firstName === void 0 ? void 0 : firstName.trim()) || null,
                            lastName: (lastName === null || lastName === void 0 ? void 0 : lastName.trim()) || null,
                            phone: (phone === null || phone === void 0 ? void 0 : phone.trim()) || null,
                            userType: "restaurant_owner",
                        })];
                case 2:
                    user = _b.sent();
                    restaurantId = null;
                    if (!(restaurantName && restaurantName.trim())) return [3 /*break*/, 4];
                    return [4 /*yield*/, storage.createRestaurant({
                            ownerId: user.id,
                            name: restaurantName.trim(),
                            address: (restaurantAddress === null || restaurantAddress === void 0 ? void 0 : restaurantAddress.trim()) || "Address pending",
                            city: "Pending",
                            state: "Pending",
                            phone: (restaurantPhone === null || restaurantPhone === void 0 ? void 0 : restaurantPhone.trim()) || null,
                            businessType: "restaurant",
                            cuisineType: "Cuisine pending",
                            isActive: false, // Inactive until owner completes setup
                        })];
                case 3:
                    restaurant = _b.sent();
                    restaurantId = restaurant.id;
                    _b.label = 4;
                case 4: return [4 /*yield*/, sendAccountSetupInvite({
                        user: user,
                        createdBy: staffUser,
                        req: req,
                    })];
                case 5:
                    emailSent = _b.sent();
                    return [4 /*yield*/, logAudit(staffUser.id, "restaurant_owner_created_by_staff", "user", user.id, req.ip || "unknown", req.get("User-Agent") || "unknown", {
                            createdUserType: "restaurant_owner",
                            createdByRole: staffUser.userType,
                            restaurantCreated: !!restaurantId,
                            restaurantId: restaurantId,
                        })];
                case 6:
                    _b.sent();
                    res.json({
                        success: true,
                        userId: user.id,
                        email: normalizedEmail,
                        setupEmailSent: emailSent,
                        restaurantId: restaurantId,
                        message: restaurantId
                            ? "Restaurant owner and restaurant shell created. Setup instructions sent by email."
                            : "Restaurant owner created. Setup instructions sent by email.",
                    });
                    return [3 /*break*/, 8];
                case 7:
                    error_5 = _b.sent();
                    console.error("Error creating restaurant owner:", error_5);
                    res
                        .status(500)
                        .json({ error: "Failed to create restaurant owner account" });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    /**
     * POST /api/account/force-password-reset
     * User forced to set new password after first login with temp password
     */
    app.post("/api/account/force-password-reset", isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var user, newPassword, _a, isPasswordStrong, PASSWORD_REQUIREMENTS, passwordHash, error_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    user = req.user;
                    newPassword = req.body.newPassword;
                    if (!user.mustResetPassword) {
                        return [2 /*return*/, res.status(400).json({ error: "Password reset not required" })];
                    }
                    if (!newPassword || typeof newPassword !== "string") {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ error: "Password is required" })];
                    }
                    return [4 /*yield*/, import("./utils/passwordPolicy.js")];
                case 1:
                    _a = _b.sent(), isPasswordStrong = _a.isPasswordStrong, PASSWORD_REQUIREMENTS = _a.PASSWORD_REQUIREMENTS;
                    if (!isPasswordStrong(newPassword)) {
                        return [2 /*return*/, res.status(400).json({ error: PASSWORD_REQUIREMENTS })];
                    }
                    return [4 /*yield*/, bcrypt.hash(newPassword, 12)];
                case 2:
                    passwordHash = _b.sent();
                    return [4 /*yield*/, storage.updateUserPassword(user.id, passwordHash, false)];
                case 3:
                    _b.sent(); // clear mustResetPassword flag
                    // Audit log
                    return [4 /*yield*/, logAudit(user.id, "password_reset_completed", "user", user.id, req.ip || "unknown", req.get("User-Agent") || "unknown", { forced: true })];
                case 4:
                    // Audit log
                    _b.sent();
                    res.json({ success: true, message: "Password updated successfully" });
                    return [3 /*break*/, 6];
                case 5:
                    error_6 = _b.sent();
                    console.error("Error resetting password:", error_6);
                    res.status(500).json({ error: "Failed to reset password" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
}

