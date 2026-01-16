import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { isAuthenticated, isAdmin } from "../unifiedAuth";

// Optional Stripe integration (mirrors server/routes.ts)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function registerAdminManagementRoutes(app: Express) {
  // Admin API endpoints
  app.get("/api/auth/admin/verify", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (
        user.userType === "admin" ||
        user.userType === "super_admin" ||
        user.userType === "staff"
      ) {
        res.json(user);
      } else {
        res.status(403).json({ message: "Admin access required" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to verify admin" });
    }
  });

  app.get(
    "/api/admin/stats",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const stats = await storage.getAdminStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ message: "Failed to fetch stats" });
      }
    }
  );

  // Admin endpoint to sync subscriptions from Stripe to database
  app.post(
    "/api/admin/subscriptions/sync",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        if (!stripe) {
          return res.status(500).json({ message: "Stripe not configured" });
        }

        const results = {
          synced: 0,
          skipped: 0,
          errors: 0,
          details: [] as any[],
        };

        // Get all users with Stripe customer IDs
        const allUsers = await storage.getAllUsers();
        const usersWithStripe = allUsers.filter((u) => u.stripeCustomerId);

        console.log(
          `[ADMIN SYNC] Found ${usersWithStripe.length} users with Stripe customer IDs`
        );

        for (const user of usersWithStripe) {
          try {
            // Skip if user already has subscription ID
            if (user.stripeSubscriptionId) {
              results.skipped++;
              continue;
            }

            // Check Stripe for active subscriptions
            const subscriptions = await stripe.subscriptions.list({
              customer: user.stripeCustomerId!,
              status: "active",
              limit: 1,
            });

            if (subscriptions.data.length > 0) {
              const subscription = subscriptions.data[0];
              const interval =
                subscription.items.data[0]?.price?.recurring?.interval;
              const intervalCount =
                subscription.items.data[0]?.price?.recurring?.interval_count ||
                1;

              let billingInterval = "month";
              if (interval === "month" && intervalCount === 3) {
                billingInterval = "quarter";
              } else if (interval === "year") {
                billingInterval = "year";
              }

              await storage.updateUserStripeInfo(
                user.id,
                user.stripeCustomerId!,
                subscription.id,
                `standard-${billingInterval}`
              );

              results.synced++;
              results.details.push({
                userId: user.id,
                email: user.email,
                subscriptionId: subscription.id,
                billingInterval: `standard-${billingInterval}`,
                status: "synced",
              });

              console.log(
                `[ADMIN SYNC] ✅ Synced subscription ${subscription.id} for user ${user.email}`
              );
            } else {
              results.skipped++;
            }
          } catch (error: any) {
            results.errors++;
            results.details.push({
              userId: user.id,
              email: user.email,
              error: error.message,
              status: "error",
            });
            console.error(
              `[ADMIN SYNC] ❌ Error syncing user ${user.email}:`,
              error
            );
          }
        }

        console.log(
          `[ADMIN SYNC] Complete: ${results.synced} synced, ${results.skipped} skipped, ${results.errors} errors`
        );
        res.json(results);
      } catch (error) {
        console.error("Error syncing subscriptions:", error);
        res.status(500).json({ message: "Failed to sync subscriptions" });
      }
    }
  );

  app.get(
    "/api/admin/restaurants/pending",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const restaurants = await storage.getPendingRestaurants();
        res.json(restaurants);
      } catch (error) {
        console.error("Error fetching pending restaurants:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch pending restaurants" });
      }
    }
  );

  app.post(
    "/api/admin/restaurants/:id/approve",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        await storage.approveRestaurant(req.params.id);
        res.json({ message: "Restaurant approved successfully" });
      } catch (error) {
        console.error("Error approving restaurant:", error);
        res.status(500).json({ message: "Failed to approve restaurant" });
      }
    }
  );

  app.delete(
    "/api/admin/restaurants/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        await storage.deleteRestaurant(req.params.id);
        res.json({ message: "Restaurant deleted successfully" });
      } catch (error) {
        console.error("Error deleting restaurant:", error);
        res.status(500).json({ message: "Failed to delete restaurant" });
      }
    }
  );

  app.get(
    "/api/admin/users",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const users = await storage.getAllUsers();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );

  app.patch(
    "/api/admin/users/:id/status",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { isActive } = req.body;
        await storage.updateUserStatus(req.params.id, isActive);
        res.json({ message: "User status updated successfully" });
      } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: "Failed to update user status" });
      }
    }
  );

  app.patch(
    "/api/admin/users/:id/type",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { userType } = req.body;
        const allowedTypes = ["customer", "restaurant_owner", "staff", "admin", "super_admin"];
        
        if (!allowedTypes.includes(userType)) {
          return res.status(400).json({ message: "Invalid user type" });
        }

        await storage.updateUserType(req.params.id, userType);
        res.json({ message: "User type updated successfully" });
      } catch (error) {
        console.error("Error updating user type:", error);
        res.status(500).json({ message: "Failed to update user type" });
      }
    }
  );

  app.delete(
    "/api/admin/users/:id",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        await storage.deleteUser(req.params.id);
        res.json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Failed to delete user" });
      }
    }
  );

  app.get(
    "/api/admin/users/:userId/addresses",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const addresses = await storage.getUserAddresses(req.params.userId);
        res.json(addresses);
      } catch (error) {
        console.error("Error fetching user addresses:", error);
        res.status(500).json({ message: "Failed to fetch user addresses" });
      }
    }
  );

  app.get(
    "/api/admin/deals",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const deals = await storage.getAllDealsWithRestaurants();
        res.json(deals);
      } catch (error) {
        console.error("Error fetching deals:", error);
        res.status(500).json({ message: "Failed to fetch deals" });
      }
    }
  );

  app.get(
    "/api/admin/deals/:dealId/stats",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const dealId = req.params.dealId;
        const [viewsCount, claimsCount, feedbackStats] = await Promise.all([
          storage.getDealViewsCount(dealId),
          storage.getDealClaimsCount(dealId),
          storage.getDealFeedbackStats(dealId),
        ]);

        res.json({
          views: viewsCount,
          claims: claimsCount,
          averageRating: feedbackStats.averageRating,
          totalFeedback: feedbackStats.totalFeedback,
          ratingDistribution: feedbackStats.ratingDistribution,
        });
      } catch (error) {
        console.error("Error fetching deal stats:", error);
        res.status(500).json({ message: "Failed to fetch deal statistics" });
      }
    }
  );

  app.delete(
    "/api/admin/deals/:dealId",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        await storage.deleteDeal(req.params.dealId);
        res.json({ message: "Deal deleted successfully" });
      } catch (error) {
        console.error("Error deleting deal:", error);
        res.status(500).json({ message: "Failed to delete deal" });
      }
    }
  );

  app.post(
    "/api/admin/deals/:dealId/clone",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const clonedDeal = await storage.duplicateDeal(req.params.dealId);
        res.json(clonedDeal);
      } catch (error) {
        console.error("Error cloning deal:", error);
        res.status(500).json({ message: "Failed to clone deal" });
      }
    }
  );

  app.patch(
    "/api/admin/deals/:dealId/status",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { isActive } = req.body;
        await storage.updateDeal(req.params.dealId, { isActive });
        res.json({ message: "Deal status updated successfully" });
      } catch (error) {
        console.error("Error updating deal status:", error);
        res.status(500).json({ message: "Failed to update deal status" });
      }
    }
  );

  app.patch(
    "/api/admin/deals/:dealId/extend",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { days } = req.body;
        if (!days || days < 1) {
          return res.status(400).json({ message: "Invalid number of days" });
        }

        const deal = await storage.getDeal(req.params.dealId);
        if (!deal) {
          return res.status(404).json({ message: "Deal not found" });
        }

        if (!deal.endDate) {
          return res
            .status(400)
            .json({ message: "Cannot extend ongoing deals (no end date)" });
        }

        const newEndDate = new Date(deal.endDate);
        newEndDate.setDate(newEndDate.getDate() + days);

        await storage.updateDeal(req.params.dealId, { endDate: newEndDate });
        res.json({ message: `Deal extended by ${days} days`, newEndDate });
      } catch (error) {
        console.error("Error extending deal:", error);
        res.status(500).json({ message: "Failed to extend deal" });
      }
    }
  );

  // Admin verification routes
  app.get(
    "/api/admin/verifications",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const { status } = req.query;
        let verifications = await storage.getVerificationRequests();

        // Filter by status if provided
        if (
          status &&
          ["pending", "approved", "rejected"].includes(status as string)
        ) {
          verifications = verifications.filter((v) => v.status === status);
        }

        res.json(verifications);
      } catch (error) {
        console.error("Error fetching verification requests:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch verification requests" });
      }
    }
  );

  app.post(
    "/api/admin/verifications/:id/approve",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const user = req.user;
        const { id } = req.params;
        await storage.approveVerificationRequest(id, user.id);
        res.json({ success: true, message: "Verification request approved" });
      } catch (error) {
        console.error("Error approving verification request:", error);
        res
          .status(500)
          .json({ message: "Failed to approve verification request" });
      }
    }
  );

  app.post(
    "/api/admin/verifications/:id/reject",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const user = req.user;
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
          return res
            .status(400)
            .json({ message: "Rejection reason is required" });
        }

        await storage.rejectVerificationRequest(id, user.id, reason);
        res.json({ success: true, message: "Verification request rejected" });
      } catch (error) {
        console.error("Error rejecting verification request:", error);
        res
          .status(500)
          .json({ message: "Failed to reject verification request" });
      }
    }
  );

  // OAuth configuration status check
  app.get(
    "/api/admin/oauth/status",
    isAuthenticated,
    isAdmin,
    async (req: any, res) => {
      try {
        const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5000";

        const status = {
          google: {
            configured: !!(
              process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ),
            clientIdPresent: !!process.env.GOOGLE_CLIENT_ID,
            clientSecretPresent: !!process.env.GOOGLE_CLIENT_SECRET,
            callbackUrls: {
              customer: `${baseUrl}/api/auth/google/customer/callback`,
              restaurant: `${baseUrl}/api/auth/google/restaurant/callback`,
            },
          },
          facebook: {
            configured: !!(
              process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
            ),
            appIdPresent: !!process.env.FACEBOOK_APP_ID,
            appSecretPresent: !!process.env.FACEBOOK_APP_SECRET,
            callbackUrl: `${baseUrl}/api/auth/facebook/callback`,
          },
          requiredUrls: {
            privacyPolicy: `${baseUrl}/privacy-policy`,
            dataDeletion: `${baseUrl}/data-deletion`,
            termsOfService: `${baseUrl}/terms-of-service`,
          },
          baseUrl,
          environment: process.env.NODE_ENV || "development",
        };

        res.json(status);
      } catch (error) {
        console.error("Error checking OAuth status:", error);
        res.status(500).json({ error: "Failed to check OAuth status" });
      }
    }
  );
}
