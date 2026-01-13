import type { Express } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "./storage";
import { isAuthenticated, isAdmin, isStaffOrAdmin } from "./unifiedAuth";
import { logAudit } from "./auditLogger";

/**
 * Staff Management & User Creation Routes
 *
 * Admin-only routes:
 * - List staff members
 * - Promote user to staff
 * - Demote/disable staff
 *
 * Staff-or-Admin routes:
 * - Create customer accounts (with temp password + must reset)
 * - Create restaurant owner accounts (with optional restaurant shell)
 */

// Utility: generate secure temporary password
function generateTempPassword(): string {
  return crypto.randomBytes(12).toString("base64url"); // ~16 chars URL-safe
}

export function registerStaffRoutes(app: Express) {
  // ============================================
  // ADMIN-ONLY: Staff Management
  // ============================================

  /**
   * GET /api/admin/staff
   * List all staff members
   */
  app.get(
    "/api/admin/staff",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const staffMembers = await storage.getUsersByRole("staff");
        res.json(staffMembers);
      } catch (error) {
        console.error("Error fetching staff:", error);
        res.status(500).json({ error: "Failed to fetch staff members" });
      }
    }
  );

  /**
   * POST /api/admin/staff/:userId/promote
   * Promote a user to staff role
   */
  app.post(
    "/api/admin/staff/:userId/promote",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const adminUser = req.user;

        // Prevent self-promotion edge cases
        if (userId === adminUser.id) {
          return res.status(400).json({ error: "Cannot modify your own role" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Protect super admin email
        const SUPER_ADMIN_EMAIL =
          process.env.ADMIN_EMAIL || "info.mealscout@gmail.com";
        if (user.email === SUPER_ADMIN_EMAIL) {
          return res
            .status(403)
            .json({ error: "Cannot modify super admin account" });
        }

        // Cannot promote admin/staff to staff (no-op or error)
        if (user.userType === "admin" || user.userType === "staff") {
          return res
            .status(400)
            .json({ error: "User is already staff or admin" });
        }

        await storage.updateUserType(userId, "staff");

        // Audit log
        await logAudit(
          adminUser.id,
          "staff_promoted",
          "user",
          userId,
          req.ip || "unknown",
          req.get("User-Agent") || "unknown",
          { previousRole: user.userType, newRole: "staff" }
        );

        res.json({ success: true, message: "User promoted to staff" });
      } catch (error) {
        console.error("Error promoting staff:", error);
        res.status(500).json({ error: "Failed to promote user to staff" });
      }
    }
  );

  /**
   * POST /api/admin/staff/:userId/demote
   * Demote staff to customer (or disable)
   */
  app.post(
    "/api/admin/staff/:userId/demote",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const { disable = false } = req.body; // optionally disable instead of demote
        const adminUser = req.user;

        if (userId === adminUser.id) {
          return res.status(400).json({ error: "Cannot modify your own role" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Protect super admin email
        const SUPER_ADMIN_EMAIL =
          process.env.ADMIN_EMAIL || "info.mealscout@gmail.com";
        if (user.email === SUPER_ADMIN_EMAIL) {
          return res
            .status(403)
            .json({ error: "Cannot modify super admin account" });
        }

        if (user.userType !== "staff") {
          return res.status(400).json({ error: "User is not staff" });
        }

        if (disable) {
          await storage.disableUser(userId);
          await logAudit(
            adminUser.id,
            "staff_disabled",
            "user",
            userId,
            req.ip || "unknown",
            req.get("User-Agent") || "unknown",
            { reason: "admin_action" }
          );
          res.json({ success: true, message: "Staff account disabled" });
        } else {
          await storage.updateUserType(userId, "customer");
          await logAudit(
            adminUser.id,
            "staff_demoted",
            "user",
            userId,
            req.ip || "unknown",
            req.get("User-Agent") || "unknown",
            { previousRole: "staff", newRole: "customer" }
          );
          res.json({ success: true, message: "Staff demoted to customer" });
        }
      } catch (error) {
        console.error("Error demoting staff:", error);
        res.status(500).json({ error: "Failed to demote staff" });
      }
    }
  );

  // ============================================
  // STAFF-OR-ADMIN: User Creation
  // ============================================

  /**
   * POST /api/staff/users
   * Create a customer account (staff or admin)
   * Returns temp password that must be reset on first login
   */
  app.post(
    "/api/staff/users",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const { email, firstName, lastName, phone } = req.body;
        const staffUser = req.user;

        if (!email || typeof email !== "string") {
          return res.status(400).json({ error: "Valid email is required" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existingUser = await storage.getUserByEmail(normalizedEmail);
        if (existingUser) {
          return res
            .status(400)
            .json({ error: "User with this email already exists" });
        }

        const tempPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        const result = await storage.createUserWithPassword({
          email: normalizedEmail,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          phone: phone?.trim() || null,
          userType: "customer",
          passwordHash,
          mustResetPassword: true,
        });

        // Audit log
        await logAudit(
          staffUser.id,
          "user_created_by_staff",
          "user",
          result.userId,
          req.ip || "unknown",
          req.get("User-Agent") || "unknown",
          { createdUserType: "customer", createdByRole: staffUser.userType }
        );

        res.json({
          success: true,
          userId: result.userId,
          email: normalizedEmail,
          tempPassword,
          mustResetPassword: true,
          message:
            "Customer account created. User must reset password on first login.",
        });
      } catch (error) {
        console.error("Error creating customer:", error);
        res.status(500).json({ error: "Failed to create customer account" });
      }
    }
  );

  /**
   * POST /api/staff/restaurant-owners
   * Create restaurant owner + optional restaurant shell (staff or admin)
   * Returns temp password that must be reset on first login
   */
  app.post(
    "/api/staff/restaurant-owners",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const {
          email,
          firstName,
          lastName,
          phone,
          restaurantName,
          restaurantAddress,
          restaurantPhone,
        } = req.body;
        const staffUser = req.user;

        if (!email || typeof email !== "string") {
          return res.status(400).json({ error: "Valid email is required" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existingUser = await storage.getUserByEmail(normalizedEmail);
        if (existingUser) {
          return res
            .status(400)
            .json({ error: "User with this email already exists" });
        }

        const tempPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        // Create restaurant owner account
        const result = await storage.createUserWithPassword({
          email: normalizedEmail,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          phone: phone?.trim() || null,
          userType: "restaurant_owner",
          passwordHash,
          mustResetPassword: true,
        });

        let restaurantId: string | null = null;

        // If restaurant details provided, create shell
        if (restaurantName && restaurantName.trim()) {
          const restaurant = await storage.createRestaurant({
            ownerId: result.userId,
            name: restaurantName.trim(),
            address: restaurantAddress?.trim() || "Address pending",
            phone: restaurantPhone?.trim() || null,
            businessType: "restaurant",
            cuisineType: "Cuisine pending",
            isActive: false, // Inactive until owner completes setup
          });
          restaurantId = restaurant.id;
        }

        // Audit log
        await logAudit(
          staffUser.id,
          "restaurant_owner_created_by_staff",
          "user",
          result.userId,
          req.ip || "unknown",
          req.get("User-Agent") || "unknown",
          {
            createdUserType: "restaurant_owner",
            createdByRole: staffUser.userType,
            restaurantCreated: !!restaurantId,
            restaurantId,
          }
        );

        res.json({
          success: true,
          userId: result.userId,
          email: normalizedEmail,
          tempPassword,
          restaurantId,
          mustResetPassword: true,
          message: restaurantId
            ? "Restaurant owner and restaurant shell created. User must reset password on first login."
            : "Restaurant owner created. User must reset password on first login.",
        });
      } catch (error) {
        console.error("Error creating restaurant owner:", error);
        res
          .status(500)
          .json({ error: "Failed to create restaurant owner account" });
      }
    }
  );

  /**
   * POST /api/account/force-password-reset
   * User forced to set new password after first login with temp password
   */
  app.post(
    "/api/account/force-password-reset",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const user = req.user;
        const { newPassword } = req.body;

        if (!user.mustResetPassword) {
          return res.status(400).json({ error: "Password reset not required" });
        }

        if (
          !newPassword ||
          typeof newPassword !== "string" ||
          newPassword.length < 8
        ) {
          return res
            .status(400)
            .json({ error: "Password must be at least 8 characters" });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await storage.updateUserPassword(user.id, passwordHash, false); // clear mustResetPassword flag

        // Audit log
        await logAudit(
          user.id,
          "password_reset_completed",
          "user",
          user.id,
          req.ip || "unknown",
          req.get("User-Agent") || "unknown",
          { forced: true }
        );

        res.json({ success: true, message: "Password updated successfully" });
      } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ error: "Failed to reset password" });
      }
    }
  );
}
