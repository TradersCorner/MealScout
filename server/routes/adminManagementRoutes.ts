import type { Express } from "express";
import Stripe from "stripe";
import crypto from "crypto";
import { eq, and, inArray, or, sql, desc, isNull, gte } from "drizzle-orm";
import { storage } from "../storage";
import { isAuthenticated, isStaffOrAdmin } from "../unifiedAuth";
import { sanitizeUser, sanitizeUsers } from "../utils/sanitize";
import { sendAccountSetupInvite } from "../utils/accountSetup";
import { emailService } from "../emailService";
import { emailDeliveryAudit, getEmailConfigSummary } from "../emailService";
import { db } from "../db";
import { logAudit } from "../auditLogger";
import multer from "multer";
import { parseTruckImportFile } from "../utils/truckImport";
import { forwardGeocode } from "../utils/geocoding";
import {
  deals,
  eventBookings,
  eventSeries,
  events,
  hosts,
  insertHostSchema,
  restaurants,
  verificationRequests,
  truckImportBatches,
  truckImportListings,
  truckClaimRequests,
  users,
  userAddresses,
  locationRequests,
  affiliateShareEvents,
  affiliateCommissionLedger,
  affiliateWithdrawals,
  creditLedger,
} from "@shared/schema";
import { isSlotWithinHours } from "@shared/parkingPassSlots";
import {
  computeParkingPassQualityFlags,
  isParkingPassPublicReady,
} from "../services/parkingPassQuality";
import { listParkingPassOccurrences } from "../services/parkingPassVirtual";
import { runParkingPassIntegrity } from "../services/parkingPassIntegrity";

// Optional Stripe integration (mirrors server/routes.ts)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const buildLocationKey = (
  address?: string | null,
  city?: string | null,
  state?: string | null,
) =>
  `${(address || "").trim().toLowerCase()}|${(city || "")
    .trim()
    .toLowerCase()}|${(state || "").trim().toLowerCase()}`;

const retryGeocodeAddress = async (rawAddress: string) => {
  const base = (rawAddress || "").trim();
  if (!base) return null;
  const candidates = Array.from(new Set([base, `${base}, USA`]));
  for (const candidate of candidates) {
    const coords = await forwardGeocode(candidate, { force: true }).catch(
      () => null,
    );
    if (coords) {
      return { coords, attempted: candidate };
    }
  }
  return null;
};

const truckImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const IMPORT_SYSTEM_EMAIL =
  process.env.IMPORT_SYSTEM_EMAIL || "system-import@mealscout.us";
let importSystemUserIdPromise: Promise<string> | null = null;

const getOrCreateImportSystemUserId = async (): Promise<string> => {
  if (!importSystemUserIdPromise) {
    importSystemUserIdPromise = (async () => {
      const existing = await storage.getUserByEmail(IMPORT_SYSTEM_EMAIL);
      if (existing) return existing.id;

      const created = await storage.createUserInvite({
        email: IMPORT_SYSTEM_EMAIL,
        firstName: "System",
        lastName: "Import",
        phone: null,
        userType: "admin",
      });
      return created.id;
    })();
  }
  return await importSystemUserIdPromise;
};

export function registerAdminManagementRoutes(app: Express) {
  const isMissingRelationError = (error: unknown, relationName?: string) => {
    const err = error as { code?: string; message?: string } | null;
    if (!err || err.code !== "42P01") return false;
    if (!relationName) return true;
    return err.message?.includes(`"${relationName}"`) ?? false;
  };

  const denyStaffEdits = (req: any, res: any) => {
    if (req.user?.userType === "staff") {
      res.status(403).json({ message: "Staff cannot modify existing data" });
      return true;
    }
    return false;
  };
  const requireAdminUser = (req: any, res: any) => {
    if (
      req.user?.userType !== "admin" &&
      req.user?.userType !== "super_admin"
    ) {
      res.status(403).json({ message: "Admin access required" });
      return false;
    }
    return true;
  };

  app.get(
    "/api/admin/email/status",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      res.json(getEmailConfigSummary());
    },
  );

  app.post(
    "/api/admin/email/test",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const to = String(req.body?.to || "").trim() || req.user?.email;
        const categoryRaw = String(req.body?.category || "general").trim();
        const category =
          categoryRaw === "account" ? "account" : ("general" as const);
        if (!to) {
          return res.status(400).json({ message: "Recipient email required" });
        }
        const summary = getEmailConfigSummary();
        if (!summary.configured) {
          return res.status(400).json({
            message:
              "Email provider is not configured (missing/invalid BREVO_API_KEY).",
          });
        }

        const ok = await emailService.sendBasicEmail(
          to,
          "MealScout test email",
          "<p>This is a test email from MealScout admin.</p>",
          "This is a test email from MealScout admin.",
          category,
        );
        res.json({
          success: ok,
          configured: summary.configured,
          mode: summary.mode,
          category,
          latestAttempt: emailDeliveryAudit.latest(),
        });
      } catch (error: any) {
        console.error("Error sending test email:", error);
        res.status(500).json({ message: "Failed to send test email" });
      }
    },
  );

  app.get(
    "/api/admin/email/attempts",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      const rawLimit = typeof req.query?.limit === "string" ? req.query.limit : "";
      const limit = Number(rawLimit || 25);
      res.json({ rows: emailDeliveryAudit.list(limit) });
    },
  );

  // Manual User/Host Creation
  app.post(
    "/api/admin/users/create",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const {
          email,
          firstName,
          lastName,
          phone,
          businessName,
          address,
          cuisineType,
          latitude,
          longitude,
          locationType,
          footTraffic,
          amenities,
          userType,
        } = req.body;

        if (req.user?.userType === "staff") {
          if (userType === "admin" || userType === "super_admin") {
            return res.status(403).json({
              message: "Staff cannot create admin or super admin accounts",
            });
          }
        }

        // Validate required fields
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !userType) {
          return res.status(400).json({
            message: "Email and userType are required",
          });
        }

        // Create user account (invite link flow)
        const user = await storage.createUserInvite({
          email: normalizedEmail,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          phone: phone?.trim() || null,
          userType,
        });

        // Handle restaurant owner and food truck creation
        if (
          (userType === "restaurant_owner" || userType === "food_truck") &&
          businessName &&
          address
        ) {
          await storage.createRestaurantForUser({
            userId: user.id,
            name: businessName,
            address,
            cuisineType: cuisineType || "Various",
          });
        }

        // Handle host and event coordinator creation
        if (
          (userType === "host" || userType === "event_coordinator") &&
          businessName &&
          address
        ) {
          // Convert footTraffic string to expected integer
          const footTrafficMap: Record<string, number> = {
            low: 50,
            medium: 150,
            high: 300,
          };

          // Convert amenities array to object
          const amenitiesObj: Record<string, boolean> = {};
          if (Array.isArray(amenities)) {
            amenities.forEach((amenity: string) => {
              amenitiesObj[amenity] = true;
            });
          }

          const hostData: any = {
            userId: user.id,
            businessName,
            address,
            locationType: locationType || "other",
            expectedFootTraffic: footTrafficMap[footTraffic] || 100,
            amenities:
              Object.keys(amenitiesObj).length > 0 ? amenitiesObj : null,
            isVerified: true, // Admin-created hosts are pre-verified
            adminCreated: true,
          };

          if (latitude && longitude) {
            hostData.latitude = latitude.toString();
            hostData.longitude = longitude.toString();
          }

          await storage.createHost(hostData);
        }

        const emailSent = await sendAccountSetupInvite({
          user,
          createdBy: req.user,
          req,
        });

        res.json({
          success: true,
          setupEmailSent: emailSent,
          message: `${userType} account created successfully. Setup link emailed to ${email}.`,
        });
      } catch (error: any) {
        console.error("Error creating user manually:", error);
        res.status(500).json({
          message: error.message || "Failed to create user",
        });
      }
    }
  );

  // Admin API endpoints
  app.get("/api/auth/admin/verify", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (
        user.userType === "admin" ||
        user.userType === "super_admin" ||
        user.userType === "staff"
      ) {
        res.json(sanitizeUser(user, { includeStripe: true }));
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
    isStaffOrAdmin,
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

  app.get(
    "/api/admin/dashboard-totals",
    isAuthenticated,
    isStaffOrAdmin,
    async (_req: any, res) => {
      try {
        const stats = await storage.getAdminStats();
        const roleTotal = Number(stats.memberCountsTotal || 0);
        const totalUsers = Number(stats.totalUsers || 0);
        const isConsistent = roleTotal <= totalUsers;

        res.json({
          generatedAt: new Date().toISOString(),
          totals: stats,
          consistency: {
            roleTotal,
            totalUsers,
            unclassifiedUsers: Math.max(0, totalUsers - roleTotal),
            rolesWithinUserTotal: isConsistent,
          },
        });
      } catch (error) {
        console.error("Error fetching dashboard totals:", error);
        res.status(500).json({ message: "Failed to fetch dashboard totals" });
      }
    },
  );

  app.get(
    "/api/admin/map-pin-audit",
    isAuthenticated,
    isStaffOrAdmin,
    async (_req: any, res) => {
      try {
        const normalize = (value?: string | null) =>
          (value || "").trim().toLowerCase();
        const keyFor = (
          address?: string | null,
          city?: string | null,
          state?: string | null,
        ) => `${normalize(address)}|${normalize(city)}|${normalize(state)}`;
        const hasCoords = (
          lat?: string | number | null,
          lng?: string | number | null,
        ) =>
          lat !== null &&
          lat !== undefined &&
          lng !== null &&
          lng !== undefined &&
          Number.isFinite(Number(lat)) &&
          Number.isFinite(Number(lng));

        const openLocations = await storage.getOpenLocationRequests();
        const hostProfiles = await db
          .select({ host: hosts })
          .from(hosts)
          .innerJoin(users, eq(hosts.userId, users.id))
          .where(
            and(
              sql`${hosts.address} IS NOT NULL`,
              or(eq(users.isDisabled, false), isNull(users.isDisabled)),
            ),
          );

        const hostByUserId = new Map<string, (typeof hosts.$inferSelect)>();
        hostProfiles.forEach(({ host }: { host: typeof hosts.$inferSelect }) => {
          const existing = hostByUserId.get(host.userId);
          if (!existing) {
            hostByUserId.set(host.userId, host);
            return;
          }
          if (!existing.isVerified && host.isVerified) {
            hostByUserId.set(host.userId, host);
          }
        });

        const hostUserIds = Array.from(hostByUserId.keys());
        const additionalAddressRows = hostUserIds.length
          ? await db
              .select({ address: userAddresses })
              .from(userAddresses)
              .innerJoin(users, eq(userAddresses.userId, users.id))
              .where(
                and(
                  inArray(userAddresses.userId, hostUserIds),
                  sql`${userAddresses.address} IS NOT NULL`,
                  or(eq(users.isDisabled, false), isNull(users.isDisabled)),
                ),
              )
          : [];

        const primaryHostLocations: Array<{
          id: string;
          address: string | null;
          city?: string | null;
          state?: string | null;
          mappable: boolean;
        }> = hostProfiles.map(
          ({ host }: { host: typeof hosts.$inferSelect }) => ({
          id: host.id,
          address: host.address,
          city: host.city,
          state: host.state,
          mappable: hasCoords(host.latitude, host.longitude),
        }),
        );

        const openHostLocations: Array<{
          id: string;
          address: string | null;
          city: string | null;
          state: string | null;
          mappable: boolean;
        }> = openLocations.map(
          (loc: {
            id: string;
            address: string | null;
            latitude?: string | number | null;
            longitude?: string | number | null;
          }) => ({
          id: loc.id,
          address: loc.address,
          city: null,
          state: null,
          mappable: hasCoords(loc.latitude, loc.longitude),
        }),
        );

        const seenKeys = new Set<string>();
        primaryHostLocations.forEach((loc) => {
          seenKeys.add(keyFor(loc.address, loc.city, loc.state));
        });
        openHostLocations.forEach((loc) => {
          seenKeys.add(keyFor(loc.address, null, null));
        });

        let additionalIncluded = 0;
        let additionalSkippedDuplicates = 0;
        const additionalIncludedLocations: Array<{
          id: string;
          address: string;
          city?: string | null;
          state?: string | null;
          mappable: boolean;
        }> = [];

        additionalAddressRows.forEach(
          ({ address }: { address: typeof userAddresses.$inferSelect }) => {
          const key = keyFor(address.address, address.city, address.state);
          if (!key || seenKeys.has(key)) {
            additionalSkippedDuplicates += 1;
            return;
          }
          seenKeys.add(key);
          additionalIncluded += 1;
          additionalIncludedLocations.push({
            id: address.id,
            address: address.address,
            city: address.city,
            state: address.state,
            mappable: hasCoords(address.latitude, address.longitude),
          });
        },
        );

        const renderedCandidates = [
          ...openHostLocations.map((loc) => ({ ...loc, source: "open_request" })),
          ...primaryHostLocations.map((loc) => ({
            ...loc,
            source: "host_profile",
          })),
          ...additionalIncludedLocations.map((loc) => ({
            ...loc,
            source: "host_address",
          })),
        ];

        const renderedMappable = renderedCandidates.filter((loc) => loc.mappable);
        const renderedMissing = renderedCandidates.filter((loc) => !loc.mappable);

        res.json({
          openLocationRequests: {
            total: openHostLocations.length,
            mappable: openHostLocations.filter((loc) => loc.mappable).length,
            missingCoords: openHostLocations.filter((loc) => !loc.mappable).length,
          },
          primaryHostProfiles: {
            total: primaryHostLocations.length,
            mappable: primaryHostLocations.filter((loc) => loc.mappable).length,
            missingCoords: primaryHostLocations.filter((loc) => !loc.mappable).length,
          },
          additionalHostAddresses: {
            total: additionalAddressRows.length,
            included: additionalIncluded,
            skippedDuplicates: additionalSkippedDuplicates,
            mappable: additionalIncludedLocations.filter((loc) => loc.mappable)
              .length,
            missingCoords: additionalIncludedLocations.filter((loc) => !loc.mappable)
              .length,
          },
          renderedHostLocationCandidates: {
            total: renderedCandidates.length,
            mappable: renderedMappable.length,
            missingCoords: renderedMissing.length,
          },
          sampleMissing: renderedMissing.slice(0, 20),
        });
      } catch (error) {
        console.error("Error building map pin audit:", error);
        res.status(500).json({ message: "Failed to build map pin audit" });
      }
    },
  );

  app.post(
    "/api/admin/map-pin-audit/retry-geocode",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const normalize = (value?: string | null) =>
          (value || "").trim().toLowerCase();
        const keyFor = (
          address?: string | null,
          city?: string | null,
          state?: string | null,
        ) => `${normalize(address)}|${normalize(city)}|${normalize(state)}`;
        const hasCoords = (
          lat?: string | number | null,
          lng?: string | number | null,
        ) =>
          lat !== null &&
          lat !== undefined &&
          lng !== null &&
          lng !== undefined &&
          Number.isFinite(Number(lat)) &&
          Number.isFinite(Number(lng));

        const requestedLimit = Number(req.body?.limit ?? 30);
        const limit = Number.isFinite(requestedLimit)
          ? Math.max(1, Math.min(100, Math.floor(requestedLimit)))
          : 30;

        const hostProfiles = await db
          .select({ host: hosts })
          .from(hosts)
          .innerJoin(users, eq(hosts.userId, users.id))
          .where(
            and(
              sql`${hosts.address} IS NOT NULL`,
              eq(hosts.isVerified, true),
              or(eq(users.isDisabled, false), isNull(users.isDisabled)),
            ),
          );

        const hostByUserId = new Map<string, (typeof hosts.$inferSelect)>();
        hostProfiles.forEach(({ host }: { host: typeof hosts.$inferSelect }) => {
          const existing = hostByUserId.get(host.userId);
          if (!existing) {
            hostByUserId.set(host.userId, host);
            return;
          }
          if (!existing.isVerified && host.isVerified) {
            hostByUserId.set(host.userId, host);
          }
        });

        const hostUserIds = Array.from(hostByUserId.keys());
        const additionalAddressRows = hostUserIds.length
          ? await db
              .select({ address: userAddresses })
              .from(userAddresses)
              .innerJoin(users, eq(userAddresses.userId, users.id))
              .where(
                and(
                  inArray(userAddresses.userId, hostUserIds),
                  sql`${userAddresses.address} IS NOT NULL`,
                  or(eq(users.isDisabled, false), isNull(users.isDisabled)),
                ),
              )
          : [];

        const seenKeys = new Set<string>();
        hostProfiles.forEach(({ host }: { host: typeof hosts.$inferSelect }) => {
          seenKeys.add(keyFor(host.address, host.city, host.state));
        });

        const failures: Array<{ source: string; id: string; address: string }> = [];
        let primaryUpdated = 0;
        let additionalUpdated = 0;
        let attempted = 0;

        const primaryQueue = hostProfiles
          .map(({ host }: { host: typeof hosts.$inferSelect }) => host)
          .filter(
            (host: typeof hosts.$inferSelect) =>
              !hasCoords(host.latitude, host.longitude) &&
              Boolean((host.address || "").trim()),
          );

        for (const host of primaryQueue) {
          if (attempted >= limit) break;
          const address = [host.address, host.city, host.state]
            .map((part) => (part || "").trim())
            .filter(Boolean)
            .join(", ");
          if (!address) continue;
          attempted += 1;
          const geocode = await retryGeocodeAddress(address);
          if (!geocode) {
            failures.push({ source: "host_profile", id: host.id, address });
            continue;
          }
          await db
            .update(hosts)
            .set({
              latitude: geocode.coords.lat.toString(),
              longitude: geocode.coords.lng.toString(),
              updatedAt: new Date(),
            })
            .where(eq(hosts.id, host.id));
          primaryUpdated += 1;
        }

        const additionalQueue = additionalAddressRows
          .map(({ address }: { address: typeof userAddresses.$inferSelect }) => address)
          .filter((address: typeof userAddresses.$inferSelect) => {
            if (hasCoords(address.latitude, address.longitude)) return false;
            const key = keyFor(address.address, address.city, address.state);
            if (!key) return false;
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
          });

        for (const addressRow of additionalQueue) {
          if (attempted >= limit) break;
          const address = [addressRow.address, addressRow.city, addressRow.state]
            .map((part) => (part || "").trim())
            .filter(Boolean)
            .join(", ");
          if (!address) continue;
          attempted += 1;
          const geocode = await retryGeocodeAddress(address);
          if (!geocode) {
            failures.push({ source: "host_address", id: addressRow.id, address });
            continue;
          }
          await db
            .update(userAddresses)
            .set({
              latitude: geocode.coords.lat.toString(),
              longitude: geocode.coords.lng.toString(),
              updatedAt: new Date(),
            })
            .where(eq(userAddresses.id, addressRow.id));
          additionalUpdated += 1;
        }

        res.json({
          attempted,
          updated: {
            primaryHostProfiles: primaryUpdated,
            additionalHostAddresses: additionalUpdated,
            total: primaryUpdated + additionalUpdated,
          },
          failures: {
            total: failures.length,
            sample: failures.slice(0, 20),
          },
        });
      } catch (error) {
        console.error("Error retrying admin map geocode:", error);
        res.status(500).json({ message: "Failed to retry geocoding" });
      }
    },
  );

  app.post(
    "/api/admin/map-pin-audit/retry-geocode-item",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const source = String(req.body?.source || "");
        const id = String(req.body?.id || "");
        if (!source || !id) {
          return res.status(400).json({ message: "source and id are required" });
        }

        if (source === "host_profile") {
          const rows = await db.select().from(hosts).where(eq(hosts.id, id)).limit(1);
          const host = rows[0];
          if (!host) return res.status(404).json({ message: "Host not found" });
          const address = [host.address, host.city, host.state]
            .map((part) => (part || "").trim())
            .filter(Boolean)
            .join(", ");
          if (!address) {
            return res.status(400).json({ message: "Host address is empty" });
          }
          const geocode = await retryGeocodeAddress(address);
          if (!geocode) {
            return res.status(422).json({
              message: "Unable to geocode host address",
              address,
            });
          }
          await db
            .update(hosts)
            .set({
              latitude: geocode.coords.lat.toString(),
              longitude: geocode.coords.lng.toString(),
              updatedAt: new Date(),
            })
            .where(eq(hosts.id, id));
          return res.json({
            ok: true,
            source,
            id,
            address,
            attempted: geocode.attempted,
            coords: geocode.coords,
          });
        }

        if (source === "host_address") {
          const rows = await db
            .select()
            .from(userAddresses)
            .where(eq(userAddresses.id, id))
            .limit(1);
          const addressRow = rows[0];
          if (!addressRow) {
            return res.status(404).json({ message: "Host address not found" });
          }
          const address = [addressRow.address, addressRow.city, addressRow.state]
            .map((part) => (part || "").trim())
            .filter(Boolean)
            .join(", ");
          if (!address) {
            return res.status(400).json({ message: "Address is empty" });
          }
          const geocode = await retryGeocodeAddress(address);
          if (!geocode) {
            return res.status(422).json({
              message: "Unable to geocode host address",
              address,
            });
          }
          await db
            .update(userAddresses)
            .set({
              latitude: geocode.coords.lat.toString(),
              longitude: geocode.coords.lng.toString(),
              updatedAt: new Date(),
            })
            .where(eq(userAddresses.id, id));
          return res.json({
            ok: true,
            source,
            id,
            address,
            attempted: geocode.attempted,
            coords: geocode.coords,
          });
        }

        if (source === "open_request") {
          const rows = await db
            .select()
            .from(locationRequests)
            .where(eq(locationRequests.id, id))
            .limit(1);
          const requestRow = rows[0];
          if (!requestRow) {
            return res.status(404).json({ message: "Open request not found" });
          }
          const address = (requestRow.address || "").trim();
          if (!address) {
            return res.status(400).json({ message: "Open request address is empty" });
          }
          const geocode = await retryGeocodeAddress(address);
          if (!geocode) {
            return res
              .status(422)
              .json({ message: "Unable to geocode open request address", address });
          }
          await db
            .update(locationRequests)
            .set({
              latitude: geocode.coords.lat.toString(),
              longitude: geocode.coords.lng.toString(),
            })
            .where(eq(locationRequests.id, id));
          return res.json({
            ok: true,
            source,
            id,
            address,
            attempted: geocode.attempted,
            coords: geocode.coords,
          });
        }

        return res.status(400).json({ message: "Unsupported source type" });
      } catch (error) {
        console.error("Error retrying map geocode item:", error);
        res.status(500).json({ message: "Failed to retry geocode item" });
      }
    },
  );

  // Admin endpoint to sync subscriptions from Stripe to database
  app.post(
    "/api/admin/subscriptions/sync",
    isAuthenticated,
    isStaffOrAdmin,
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
    isStaffOrAdmin,
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
    isStaffOrAdmin,
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
    isStaffOrAdmin,
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
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const users = await storage.getAllUsers();
        res.json(sanitizeUsers(users, { includeStripe: true }));
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );

  app.get(
    "/api/admin/truck-imports",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const includePurged = String(req.query?.includePurged || "") === "1";
        const batches = await db
          .select()
          .from(truckImportBatches)
          .where(includePurged ? sql`true` : isNull(truckImportBatches.purgedAt))
          .orderBy(desc(truckImportBatches.createdAt))
          .limit(50);
        res.json(batches);
      } catch (error) {
        if (isMissingRelationError(error, "truck_import_batches")) {
          return res.status(503).json({
            message:
              'Truck import tables are missing in the database. Run `npm run migrate:sql -- 042_create_truck_import_tables.sql` (and then `npm run migrate:sql -- 041_truck_import_batches_purged.sql`).',
            code: "migration_required",
          });
        }
        console.error("Error fetching truck import batches:", error);
        res.status(500).json({ message: "Failed to fetch import batches" });
      }
    },
  );

  app.get(
    "/api/admin/truck-import-listings/search",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const query = String(req.query?.q || "").trim();
        if (!query) return res.json([]);

        const searchValue = `%${query.toLowerCase()}%`;

        const rows = await db
          .select({
            listing: truckImportListings,
            restaurantId: restaurants.id,
            restaurantOwnerId: restaurants.ownerId,
          })
          .from(truckImportListings)
          .leftJoin(
            restaurants,
            eq(restaurants.claimedFromImportId, truckImportListings.id),
          )
          .where(
            or(
              eq(truckImportListings.externalId, query),
              sql`lower(${truckImportListings.name}) like ${searchValue}`,
              sql`lower(coalesce(${truckImportListings.email}, '')) like ${searchValue}`,
              sql`lower(coalesce(${truckImportListings.address}, '')) like ${searchValue}`,
              sql`lower(coalesce(${truckImportListings.city}, '')) like ${searchValue}`,
              sql`lower(coalesce(${truckImportListings.state}, '')) like ${searchValue}`,
              sql`lower(coalesce(${truckImportListings.phone}, '')) like ${searchValue}`,
            ),
          )
          .orderBy(desc(truckImportListings.confidenceScore))
          .limit(25);

        res.json(
          rows.map((row: any) => ({
            ...row.listing,
            restaurantId: row.restaurantId ?? null,
            restaurantOwnerId: row.restaurantOwnerId ?? null,
          })),
        );
      } catch (error: any) {
        if (isMissingRelationError(error, "truck_import_listings")) {
          return res.status(503).json({
            message:
              'Truck import tables are missing in the database. Run `npm run migrate:sql -- 042_create_truck_import_tables.sql`.',
            code: "migration_required",
          });
        }
        console.error("Error searching truck import listings:", error);
        res.status(500).json({ message: "Failed to search import listings" });
      }
    },
  );

  app.get(
    "/api/admin/truck-import-listings/unclaimed",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const limit = Math.min(100, Math.max(1, Number(req.query?.limit ?? 50)));
        const offset = Math.max(0, Number(req.query?.offset ?? 0));

        const [{ total }] = await db
          .select({ total: sql<number>`count(*)` })
          .from(truckImportListings)
          .where(eq(truckImportListings.status, "unclaimed"));

        const rows = await db
          .select({
            listing: truckImportListings,
            restaurantId: restaurants.id,
            restaurantOwnerId: restaurants.ownerId,
            restaurantIsVerified: restaurants.isVerified,
            restaurantIsActive: restaurants.isActive,
          })
          .from(truckImportListings)
          .leftJoin(
            restaurants,
            eq(restaurants.claimedFromImportId, truckImportListings.id),
          )
          .where(eq(truckImportListings.status, "unclaimed"))
          .orderBy(desc(truckImportListings.createdAt))
          .limit(limit)
          .offset(offset);

        res.json({
          total: Number(total ?? 0),
          limit,
          offset,
          rows: rows.map((row: any) => ({
            ...row.listing,
            restaurantId: row.restaurantId ?? null,
            restaurantOwnerId: row.restaurantOwnerId ?? null,
            restaurantIsVerified: row.restaurantIsVerified ?? null,
            restaurantIsActive: row.restaurantIsActive ?? null,
          })),
        });
      } catch (error: any) {
        console.error("Error listing unclaimed import listings:", error);
        res.status(500).json({ message: "Failed to load unclaimed trucks" });
      }
    },
  );

  app.patch(
    "/api/admin/truck-import-listings/:id",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const listingId = req.params.id;
        const updates: any = {};
        const fields = [
          "externalId",
          "email",
          "name",
          "address",
          "city",
          "state",
          "phone",
          "cuisineType",
          "websiteUrl",
          "instagramUrl",
          "facebookPageUrl",
          "latitude",
          "longitude",
        ];
        for (const field of fields) {
          if (req.body?.[field] === undefined) continue;
          updates[field] =
            field === "email"
              ? String(req.body[field] || "").trim().toLowerCase() || null
              : req.body[field];
        }

        const [updated] = await db
          .update(truckImportListings)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(truckImportListings.id, listingId))
          .returning();

        if (!updated) {
          return res.status(404).json({ message: "Import listing not found" });
        }

        // Keep the seeded restaurant (if any) in sync with listing fields.
        const [seededRestaurant] = await db
          .select()
          .from(restaurants)
          .where(eq(restaurants.claimedFromImportId, listingId))
          .limit(1);
        if (seededRestaurant) {
          const restaurantUpdates: any = {};
          const map: Array<[string, string]> = [
            ["name", "name"],
            ["address", "address"],
            ["city", "city"],
            ["state", "state"],
            ["phone", "phone"],
            ["cuisineType", "cuisineType"],
            ["websiteUrl", "websiteUrl"],
            ["instagramUrl", "instagramUrl"],
            ["facebookPageUrl", "facebookPageUrl"],
            ["latitude", "latitude"],
            ["longitude", "longitude"],
          ];
          for (const [listingField, restaurantField] of map) {
            if (updates[listingField] !== undefined) {
              restaurantUpdates[restaurantField] = updates[listingField];
            }
          }
          if (Object.keys(restaurantUpdates).length > 0) {
            await db
              .update(restaurants)
              .set({ ...restaurantUpdates, updatedAt: new Date() })
              .where(eq(restaurants.id, seededRestaurant.id));
          }
        }

        res.json(updated);
      } catch (error: any) {
        console.error("Error updating import listing:", error);
        res.status(500).json({ message: "Failed to update import listing" });
      }
    },
  );

  app.post(
    "/api/admin/truck-import-listings/:id/invite",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const listingId = req.params.id;
        const email = String(req.body?.email || "").trim().toLowerCase();
        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }

        const [listing] = await db
          .select()
          .from(truckImportListings)
          .where(eq(truckImportListings.id, listingId))
          .limit(1);
        if (!listing) {
          return res.status(404).json({ message: "Import listing not found" });
        }

        const importSystemUserId = await getOrCreateImportSystemUserId();

        const existingUser = await storage.getUserByEmail(email);
        const inviteUser =
          existingUser ??
          (await storage.createUserInvite({
            email,
            firstName: null,
            lastName: null,
            phone: null,
            userType: "food_truck",
          }));

        // Ensure there is a seeded restaurant for this listing.
        const [restaurant] = await db
          .select()
          .from(restaurants)
          .where(eq(restaurants.claimedFromImportId, listingId))
          .limit(1);

        if (restaurant) {
          if (
            restaurant.ownerId !== importSystemUserId &&
            restaurant.ownerId !== inviteUser.id
          ) {
            return res.status(409).json({
              message:
                "This truck is already owned by another account. Refusing to reassign ownership.",
            });
          }
          await db
            .update(restaurants)
            .set({ ownerId: inviteUser.id, updatedAt: new Date() })
            .where(eq(restaurants.id, restaurant.id));
        } else {
          await db.insert(restaurants).values({
            ownerId: inviteUser.id,
            name: listing.name,
            address: listing.address,
            phone: listing.phone,
            businessType: "food_truck",
            cuisineType: listing.cuisineType,
            city: listing.city,
            state: listing.state,
            websiteUrl: listing.websiteUrl,
            instagramUrl: listing.instagramUrl,
            facebookPageUrl: listing.facebookPageUrl,
            latitude: listing.latitude,
            longitude: listing.longitude,
            isFoodTruck: true,
            isActive: false,
            isVerified: false,
            claimedFromImportId: listing.id,
          } as any);
        }

        const [updated] = await db
          .update(truckImportListings)
          .set({
            email,
            invitedUserId: inviteUser.id,
            lastInviteSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(truckImportListings.id, listingId))
          .returning();

        const emailSent = await sendAccountSetupInvite({
          user: inviteUser,
          createdBy: req.user,
          req,
        });

        res.json({ success: true, emailSent, listing: updated });
      } catch (error: any) {
        console.error("Error sending import invite:", error);
        res.status(500).json({ message: error.message || "Failed to send invite" });
      }
    },
  );

  app.post(
    "/api/admin/truck-imports",
    isAuthenticated,
    isStaffOrAdmin,
    truckImportUpload.single("file"),
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const file = req.file;
        if (!file) {
          return res.status(400).json({ message: "File is required" });
        }

        const source = String(req.body?.source || "").trim() || null;
        const { rows, headers } = await parseTruckImportFile(
          file.buffer,
          file.originalname || "import.csv",
        );

        const [batch] = await db
          .insert(truckImportBatches)
          .values({
            source,
            fileName: file.originalname || "import.csv",
            uploadedBy: req.user?.id,
            totalRows: rows.length,
          })
          .returning();

        let importedRows = 0;
        let missingRows = 0;
        let duplicateRows = 0;
        let seededRestaurants = 0;

        const listingsToInsert: Array<typeof truckImportListings.$inferInsert> =
          [];
        const seenKeys = new Set<string>();

        const normalize = (value: any) => String(value || "").trim().toLowerCase();
        const nameAddressKey = (name: string, address: string) =>
          `${normalize(name)}|${normalize(address)}`;

        const candidateExternalIds = new Set<string>();
        const candidateEmails = new Set<string>();
        const candidateNameAddressKeys = new Set<string>();

        for (const row of rows) {
          const name = row.name?.trim() || "";
          const address = row.address?.trim() || "";
          const externalId = row.externalId?.trim() || "";
          const email = row.email?.trim()?.toLowerCase() || "";
          if (externalId) candidateExternalIds.add(externalId.toLowerCase());
          if (email) candidateEmails.add(email.toLowerCase());
          if (name && address) candidateNameAddressKeys.add(nameAddressKey(name, address));
        }

        const extList = Array.from(candidateExternalIds);
        const emailList = Array.from(candidateEmails);
        const nameList = Array.from(
          new Set(Array.from(candidateNameAddressKeys).map((key) => key.split("|")[0])),
        );
        const addressList = Array.from(
          new Set(Array.from(candidateNameAddressKeys).map((key) => key.split("|")[1])),
        );

        const existingImportRows =
          extList.length || emailList.length || (nameList.length && addressList.length)
            ? await db
                .select({
                  externalId: truckImportListings.externalId,
                  email: truckImportListings.email,
                  name: truckImportListings.name,
                  address: truckImportListings.address,
                })
                .from(truckImportListings)
                .where(
                  or(
                    extList.length
                      ? inArray(truckImportListings.externalId, extList)
                      : sql`false`,
                    emailList.length
                      ? inArray(truckImportListings.email, emailList)
                      : sql`false`,
                    nameList.length && addressList.length
                      ? and(
                          inArray(sql`lower(${truckImportListings.name})` as any, nameList),
                          inArray(sql`lower(${truckImportListings.address})` as any, addressList),
                        )
                      : sql`false`,
                  ),
                )
            : [];

        const existingRestaurantRows =
          nameList.length && addressList.length
            ? await db
                .select({
                  name: restaurants.name,
                  address: restaurants.address,
                })
                .from(restaurants)
                .where(
                  and(
                    or(eq(restaurants.businessType, "food_truck"), eq(restaurants.isFoodTruck, true)),
                    inArray(sql`lower(${restaurants.name})` as any, nameList),
                    inArray(sql`lower(${restaurants.address})` as any, addressList),
                  ),
                )
            : [];

        const existingExternalIdSet = new Set(
          existingImportRows
            .map((row: any) => normalize(row.externalId))
            .filter((value: string) => value.length > 0),
        );
        const existingEmailSet = new Set(
          existingImportRows
            .map((row: any) => normalize(row.email))
            .filter((value: string) => value.length > 0),
        );
        const existingNameAddressSet = new Set<string>();
        existingImportRows.forEach((row: any) => {
          const name = normalize(row.name);
          const address = normalize(row.address);
          if (name && address) existingNameAddressSet.add(`${name}|${address}`);
        });
        existingRestaurantRows.forEach((row: any) => {
          const name = normalize(row.name);
          const address = normalize(row.address);
          if (name && address) existingNameAddressSet.add(`${name}|${address}`);
        });

        for (const row of rows) {
          const name = row.name?.trim();
          const addressInput = row.address?.trim() || "";
          if (!name) {
            missingRows += 1;
            continue;
          }

          const email = row.email?.trim()?.toLowerCase() || null;
          const externalId = row.externalId?.trim() || null;
          const cityKey = (row.city || "").trim().toLowerCase();
          const nameKey = name.toLowerCase();
          const addressKey = addressInput.toLowerCase();
          const dedupeKey = externalId
            ? `ext:${externalId.toLowerCase()}`
            : email
              ? `email:${email}`
            : addressInput
              ? `addr:${nameKey}|${addressKey}`
              : `name:${nameKey}|${cityKey}`;
          if (seenKeys.has(dedupeKey)) {
            duplicateRows += 1;
            continue;
          }
          seenKeys.add(dedupeKey);

          // Duplicate rejection rule:
          // If 2 identifying fields match, treat as a duplicate. ExternalId/email count as "2"
          // because they're unique identifiers in practice (gov license, owner email).
          let matchScore = 0;
          if (externalId && existingExternalIdSet.has(normalize(externalId))) matchScore += 2;
          if (email && existingEmailSet.has(normalize(email))) matchScore += 2;
          if (addressInput && existingNameAddressSet.has(`${normalize(name)}|${normalize(addressInput)}`)) {
            matchScore += 2;
          }

          if (matchScore >= 2) {
            duplicateRows += 1;
            continue;
          }

          listingsToInsert.push({
            batchId: batch?.id,
            source: source || null,
            externalId,
            email,
            name,
            // Address is optional for admin-uploaded seeds; claim flow can fill it in later.
            address: addressInput,
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
        }

        const chunkSize = 250;
        const insertedListingRows: Array<{
          id: string;
          email: string | null;
          name: string;
          address: string;
          city: string | null;
          state: string | null;
          phone: string | null;
          cuisineType: string | null;
          websiteUrl: string | null;
          instagramUrl: string | null;
          facebookPageUrl: string | null;
          latitude: string | null;
          longitude: string | null;
        }> = [];
        for (let i = 0; i < listingsToInsert.length; i += chunkSize) {
          const chunk = listingsToInsert.slice(i, i + chunkSize);
          if (chunk.length === 0) continue;
          const inserted = await db
            .insert(truckImportListings)
            .values(chunk)
            .returning({
              id: truckImportListings.id,
              email: truckImportListings.email,
              name: truckImportListings.name,
              address: truckImportListings.address,
              city: truckImportListings.city,
              state: truckImportListings.state,
              phone: truckImportListings.phone,
              cuisineType: truckImportListings.cuisineType,
              websiteUrl: truckImportListings.websiteUrl,
              instagramUrl: truckImportListings.instagramUrl,
              facebookPageUrl: truckImportListings.facebookPageUrl,
              latitude: truckImportListings.latitude,
              longitude: truckImportListings.longitude,
            });
          insertedListingRows.push(...inserted);
          importedRows += inserted.length;
        }

        if (insertedListingRows.length > 0) {
          const systemOwnerId = await getOrCreateImportSystemUserId();

          // Create invited owner accounts where we have an email, but do not email them here.
          // The “Request this truck” flow sends reminders on-demand.
          const invitedOwnerByEmail = new Map<string, string>();
          const uniqueEmails = Array.from(
            new Set(
              insertedListingRows
                .map((listing: any) => String(listing.email || "").trim().toLowerCase())
                .filter((value) => value.length > 0),
            ),
          );
          for (const email of uniqueEmails) {
            const existing = await storage.getUserByEmail(email);
            const user =
              existing ??
              (await storage.createUserInvite({
                email,
                firstName: null,
                lastName: null,
                phone: null,
                userType: "food_truck",
              }));
            invitedOwnerByEmail.set(email, user.id);
          }

          const restaurantsToInsert = insertedListingRows.map((listing: any) => {
            const email = String(listing.email || "").trim().toLowerCase();
            const invitedOwnerId = email ? invitedOwnerByEmail.get(email) : undefined;
            return {
              ownerId: invitedOwnerId || systemOwnerId,
              name: listing.name,
              address: listing.address,
              phone: listing.phone,
              businessType: "food_truck",
              cuisineType: listing.cuisineType,
              city: listing.city,
              state: listing.state,
              websiteUrl: listing.websiteUrl,
              instagramUrl: listing.instagramUrl,
              facebookPageUrl: listing.facebookPageUrl,
              latitude: listing.latitude,
              longitude: listing.longitude,
              isFoodTruck: true,
              isActive: false,
              isVerified: false,
              claimedFromImportId: listing.id,
            };
          });

          const restaurantChunkSize = 200;
          for (let i = 0; i < restaurantsToInsert.length; i += restaurantChunkSize) {
            const chunk = restaurantsToInsert.slice(i, i + restaurantChunkSize);
            if (chunk.length === 0) continue;
            await db.insert(restaurants).values(chunk);
            seededRestaurants += chunk.length;
          }

          // Best-effort: persist invited owner linkage on the import listing rows.
          // This allows us to block hostile claims and send setup reminders.
          for (const listing of insertedListingRows as any[]) {
            const email = String(listing.email || "").trim().toLowerCase();
            const invitedOwnerId = email ? invitedOwnerByEmail.get(email) : null;
            if (!invitedOwnerId) continue;
            try {
              await db
                .update(truckImportListings)
                .set({ invitedUserId: invitedOwnerId, updatedAt: new Date() })
                .where(eq(truckImportListings.id, listing.id));
            } catch {
              // ignore
            }
          }
        }

        const skippedRows = Math.max(
          0,
          rows.length - importedRows - duplicateRows - missingRows,
        );

        await db
          .update(truckImportBatches)
          .set({
            importedRows,
            skippedRows,
            updatedAt: new Date(),
          })
          .where(eq(truckImportBatches.id, batch.id));

        res.json({
          batchId: batch.id,
          totalRows: rows.length,
          importedRows,
          skippedRows,
          missingRows,
          duplicateRows,
          seededRestaurants,
          headers: (headers || []).slice(0, 50),
        });
      } catch (error: any) {
        if (isMissingRelationError(error, "truck_import_batches")) {
          return res.status(503).json({
            message:
              'Truck import tables are missing in the database. Run `npm run migrate:sql -- 042_create_truck_import_tables.sql` (and then retry the upload).',
            code: "migration_required",
          });
        }
        console.error("Error importing truck listings:", error);
        res.status(500).json({
          message:
            error.message || "Failed to import truck listings",
        });
      }
    },
  );

  app.post(
    "/api/admin/truck-imports/:batchId/purge",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const batchId = String(req.params.batchId || "").trim();
        const force = Boolean(req.body?.force);
        if (!batchId) {
          return res.status(400).json({ message: "Batch ID required" });
        }

        const [batch] = await db
          .select()
          .from(truckImportBatches)
          .where(eq(truckImportBatches.id, batchId))
          .limit(1);
        if (!batch) {
          return res.status(404).json({ message: "Import batch not found" });
        }

        const listings = await db
          .select()
          .from(truckImportListings)
          .where(eq(truckImportListings.batchId, batchId));

        const listingIds = listings.map((l: any) => l.id);
        if (listingIds.length === 0) {
          return res.json({
            batchId,
            fileName: batch.fileName,
            totalListings: 0,
            deletedListings: 0,
            deletedRestaurants: 0,
            deletedClaimRequests: 0,
            blocked: [],
          });
        }

        const importSystemUserId = await getOrCreateImportSystemUserId();

        const claimRequests = await db
          .select({
            id: truckClaimRequests.id,
            listingId: truckClaimRequests.listingId,
            restaurantId: truckClaimRequests.restaurantId,
          })
          .from(truckClaimRequests)
          .where(inArray(truckClaimRequests.listingId, listingIds));

        const claimRequestListingIds = new Set(
          claimRequests.map((row: any) => String(row.listingId || "")),
        );

        const seededRestaurants = await db
          .select({
            id: restaurants.id,
            ownerId: restaurants.ownerId,
            claimedFromImportId: restaurants.claimedFromImportId,
          })
          .from(restaurants)
          .where(inArray(restaurants.claimedFromImportId, listingIds));

        const restaurantIds = seededRestaurants.map((row: any) => row.id);
        const bookingRows = restaurantIds.length
          ? await db
              .select({ id: eventBookings.id, truckId: eventBookings.truckId })
              .from(eventBookings)
              .where(inArray(eventBookings.truckId, restaurantIds))
              .limit(1)
          : [];
        const restaurantIdsWithBookings = new Set(
          bookingRows.map((row: any) => String(row.truckId)),
        );

        const blocked: Array<{
          listingId: string;
          reason: string;
        }> = [];

        // Purge policy:
        // - Default: only purge listings that are still `unclaimed`.
        // - Force: allow purging `claim_requested` too (also deletes the claim requests).
        // - Never purge `claimed` rows (could belong to a real business owner).
        const purgeableListingIds: string[] = [];
        for (const listing of listings as any[]) {
          const status = String(listing.status || "");
          const canPurge =
            status === "unclaimed" || (force && status === "claim_requested");
          if (!canPurge) {
            blocked.push({
              listingId: listing.id,
              reason: `status:${status}`,
            });
            continue;
          }
          if (claimRequestListingIds.has(String(listing.id)) && !force) {
            blocked.push({
              listingId: listing.id,
              reason: "has_claim_request",
            });
            continue;
          }
          purgeableListingIds.push(String(listing.id));
        }

        let deletedClaimRequests = 0;
        let deletedRestaurants = 0;
        let deletedListings = 0;

        await db.transaction(async (tx: any) => {
          if (force && claimRequests.length > 0) {
            const deleted = await tx
              .delete(truckClaimRequests)
              .where(
                inArray(
                  truckClaimRequests.id,
                  claimRequests.map((r: any) => r.id),
                ),
              )
              .returning({ id: truckClaimRequests.id });
            deletedClaimRequests = deleted.length;
          }

          // Delete seeded restaurant profiles for purgeable listings.
          const restaurantIdsToDelete: string[] = [];
          for (const row of seededRestaurants as any[]) {
            const listingId = String(row.claimedFromImportId || "");
            if (!purgeableListingIds.includes(listingId)) continue;
            if (restaurantIdsWithBookings.has(String(row.id))) {
              blocked.push({
                listingId,
                reason: "has_booking",
              });
              continue;
            }
            // If a restaurant is already owned by a real user (not system, not invited), require force.
            const isSystemOrInvited =
              String(row.ownerId) === String(importSystemUserId) ||
              listings.some(
                (l: any) =>
                  String(l.id) === listingId &&
                  l.invitedUserId &&
                  String(l.invitedUserId) === String(row.ownerId),
              );
            if (!isSystemOrInvited && !force) {
              blocked.push({
                listingId,
                reason: "owned_by_user",
              });
              continue;
            }
            restaurantIdsToDelete.push(String(row.id));
          }

          if (restaurantIdsToDelete.length > 0) {
            const deleted = await tx
              .delete(restaurants)
              .where(inArray(restaurants.id, restaurantIdsToDelete))
              .returning({ id: restaurants.id });
            deletedRestaurants = deleted.length;
          }

          const deletableListingIds = purgeableListingIds.filter((id) => {
            // If we blocked restaurant deletion due to bookings/ownership and the listing is linked, keep it.
            const hasBlocked = blocked.some((b) => b.listingId === id);
            return !hasBlocked;
          });

          if (deletableListingIds.length > 0) {
            const deleted = await tx
              .delete(truckImportListings)
              .where(inArray(truckImportListings.id, deletableListingIds))
              .returning({ id: truckImportListings.id });
            deletedListings = deleted.length;
          }
        });

        res.json({
          batchId,
          fileName: batch.fileName,
          totalListings: listings.length,
          deletedListings,
          deletedRestaurants,
          deletedClaimRequests,
          blocked,
          force,
        });

        // Hide this batch from the default Recent Imports list so staff don't keep re-purging the same file.
        try {
          await db
            .update(truckImportBatches)
            .set({
              purgedAt: new Date(),
              purgedBy: req.user?.id ?? null,
              updatedAt: new Date(),
            })
            .where(eq(truckImportBatches.id, batchId));
        } catch (markError) {
          console.error("Failed to mark import batch as purged:", markError);
        }
      } catch (error: any) {
        if (
          isMissingRelationError(error, "truck_import_batches") ||
          isMissingRelationError(error, "truck_import_listings")
        ) {
          return res.status(503).json({
            message:
              'Truck import tables are missing in the database. Run `npm run migrate:sql -- 042_create_truck_import_tables.sql`.',
            code: "migration_required",
          });
        }
        console.error("Error purging truck import batch:", error);
        res.status(500).json({
          message: error.message || "Failed to purge import batch",
        });
      }
    },
  );

  app.get(
    "/api/admin/truck-imports/:batchId",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const batchId = String(req.params.batchId || "").trim();
        const limit = Math.min(200, Math.max(1, Number(req.query?.limit ?? 50)));
        const offset = Math.max(0, Number(req.query?.offset ?? 0));
        if (!batchId) return res.status(400).json({ message: "Batch ID required" });

        const [batch] = await db
          .select()
          .from(truckImportBatches)
          .where(eq(truckImportBatches.id, batchId))
          .limit(1);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        const [{ total }] = await db
          .select({ total: sql<number>`count(*)` })
          .from(truckImportListings)
          .where(eq(truckImportListings.batchId, batchId));

        const statusCounts = await db
          .select({
            status: truckImportListings.status,
            count: sql<number>`count(*)`,
          })
          .from(truckImportListings)
          .where(eq(truckImportListings.batchId, batchId))
          .groupBy(truckImportListings.status);

        const seededRestaurantCounts = await db
          .select({ count: sql<number>`count(*)` })
          .from(restaurants)
          .innerJoin(
            truckImportListings,
            eq(restaurants.claimedFromImportId, truckImportListings.id),
          )
          .where(eq(truckImportListings.batchId, batchId));

        const claimRequestCounts = await db
          .select({ count: sql<number>`count(*)` })
          .from(truckClaimRequests)
          .innerJoin(
            truckImportListings,
            eq(truckClaimRequests.listingId, truckImportListings.id),
          )
          .where(eq(truckImportListings.batchId, batchId));

        const listingRows = await db
          .select({
            listing: truckImportListings,
            restaurantId: restaurants.id,
            restaurantOwnerId: restaurants.ownerId,
          })
          .from(truckImportListings)
          .leftJoin(
            restaurants,
            eq(restaurants.claimedFromImportId, truckImportListings.id),
          )
          .where(eq(truckImportListings.batchId, batchId))
          .orderBy(desc(truckImportListings.confidenceScore))
          .limit(limit)
          .offset(offset);

        res.json({
          batch,
          total: Number(total ?? 0),
          statusCounts: statusCounts.map((row: any) => ({
            status: row.status,
            count: Number(row.count ?? 0),
          })),
          seededRestaurants: Number(seededRestaurantCounts?.[0]?.count ?? 0),
          claimRequests: Number(claimRequestCounts?.[0]?.count ?? 0),
          rows: listingRows.map((row: any) => ({
            ...row.listing,
            restaurantId: row.restaurantId ?? null,
            restaurantOwnerId: row.restaurantOwnerId ?? null,
          })),
          limit,
          offset,
        });
      } catch (error: any) {
        if (
          isMissingRelationError(error, "truck_import_batches") ||
          isMissingRelationError(error, "truck_import_listings")
        ) {
          return res.status(503).json({
            message:
              'Truck import tables are missing in the database. Run `npm run migrate:sql -- 042_create_truck_import_tables.sql`.',
            code: "migration_required",
          });
        }
        console.error("Error fetching import batch details:", error);
        res.status(500).json({ message: "Failed to fetch batch details" });
      }
    },
  );

  app.get(
    "/api/admin/affiliates/users",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const allUsers = await db
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
          .orderBy(users.createdAt);

        const shareCounts = await db
          .select({
            affiliateUserId: affiliateShareEvents.affiliateUserId,
            count: sql<number>`count(*)`,
          })
          .from(affiliateShareEvents)
          .groupBy(affiliateShareEvents.affiliateUserId);

        type ShareCountRow = {
          affiliateUserId: string | null;
          count: number | string | null;
        };
        const shareCountMap = new Map(
          (shareCounts as ShareCountRow[]).map((row) => [
            row.affiliateUserId,
            Number(row.count ?? 0),
          ]),
        );

        const commissionSums = await db
          .select({
            affiliateUserId: affiliateCommissionLedger.affiliateUserId,
            earnedCents: sql<number>`coalesce(sum(${affiliateCommissionLedger.amount}), 0)`,
            revenueCents: sql<number>`coalesce(sum(${affiliateCommissionLedger.sourceAmountCents}), 0)`,
            subscriptionRevenueCents: sql<number>`coalesce(sum(case when ${affiliateCommissionLedger.commissionSource} = 'subscription_payment' then ${affiliateCommissionLedger.sourceAmountCents} else 0 end), 0)`,
            bookingRevenueCents: sql<number>`coalesce(sum(case when ${affiliateCommissionLedger.commissionSource} in ('booking_fee_host', 'booking_fee_truck') then ${affiliateCommissionLedger.sourceAmountCents} else 0 end), 0)`,
          })
          .from(affiliateCommissionLedger)
          .groupBy(affiliateCommissionLedger.affiliateUserId);

        type CommissionSumRow = {
          affiliateUserId: string | null;
          earnedCents: number | string | null;
          revenueCents: number | string | null;
          subscriptionRevenueCents: number | string | null;
          bookingRevenueCents: number | string | null;
        };
        const commissionMap = new Map(
          (commissionSums as CommissionSumRow[]).map((row) => [
            row.affiliateUserId,
            row,
          ]),
        );

        const referralRows = await db
          .select({
            id: users.id,
            affiliateCloserUserId: users.affiliateCloserUserId,
            affiliateBookerUserId: users.affiliateBookerUserId,
            stripeSubscriptionId: users.stripeSubscriptionId,
          })
          .from(users)
          .where(
            and(
              or(eq(users.isDisabled, false), isNull(users.isDisabled)),
              or(
                sql`${users.affiliateCloserUserId} is not null`,
                sql`${users.affiliateBookerUserId} is not null`,
              )
            )
          );

        const truckOwnerRows = await db
          .select({ ownerId: restaurants.ownerId })
          .from(eventBookings)
          .innerJoin(restaurants, eq(eventBookings.truckId, restaurants.id));

        const hostOwnerRows = await db
          .select({ ownerId: hosts.userId })
          .from(eventBookings)
          .innerJoin(hosts, eq(eventBookings.hostId, hosts.id));

        const bookingOwnerIds = new Set<string>();
        for (const row of truckOwnerRows) {
          if (row.ownerId) bookingOwnerIds.add(row.ownerId);
        }
        for (const row of hostOwnerRows) {
          if (row.ownerId) bookingOwnerIds.add(row.ownerId);
        }

        const referredMap = new Map<string, Set<string>>();
        const paidMap = new Map<string, Set<string>>();
        for (const row of referralRows) {
          const referrerIds = [row.affiliateCloserUserId, row.affiliateBookerUserId]
            .filter((value): value is string => Boolean(value));
          if (referrerIds.length === 0) continue;

          for (const referrerId of referrerIds) {
            if (!referredMap.has(referrerId)) {
              referredMap.set(referrerId, new Set());
            }
            referredMap.get(referrerId)?.add(row.id);

            const isPaid =
              Boolean(row.stripeSubscriptionId) || bookingOwnerIds.has(row.id);
            if (isPaid) {
              if (!paidMap.has(referrerId)) {
                paidMap.set(referrerId, new Set());
              }
              paidMap.get(referrerId)?.add(row.id);
            }
          }
        }

        const payload = allUsers.map((user: (typeof allUsers)[number]) => {
          const commissions = commissionMap.get(user.id as string);
          const referred = referredMap.get(user.id);
          const paid = paidMap.get(user.id);

          return {
            ...user,
            linksShared: shareCountMap.get(user.id) ?? 0,
            peopleReferred: referred?.size ?? 0,
            paidReferrals: paid?.size ?? 0,
            affiliateEarningsCents: Number(commissions?.earnedCents ?? 0),
            mealScoutRevenueCents: Number(commissions?.revenueCents ?? 0),
            subscriptionRevenueCents: Number(
              commissions?.subscriptionRevenueCents ?? 0,
            ),
            bookingRevenueCents: Number(commissions?.bookingRevenueCents ?? 0),
          };
        });

        res.json(payload);
      } catch (error: any) {
        console.error("Error fetching affiliate users:", error);
        res.status(500).json({ message: "Failed to fetch affiliate users" });
      }
    },
  );

  app.patch(
    "/api/admin/affiliates/users/:id",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const targetUserId = req.params.id;
        const {
          affiliatePercent,
          affiliateCloserUserId,
          affiliateBookerUserId,
        } = req.body || {};

        const updates: any = {};
        if (affiliatePercent !== undefined) {
          const parsed = Number(affiliatePercent);
          if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
            return res
              .status(400)
              .json({ message: "affiliatePercent must be 0-100" });
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
          return res
            .status(400)
            .json({ message: "No affiliate fields to update" });
        }

        updates.updatedAt = new Date();

        const [updated] = await db
          .update(users)
          .set(updates)
          .where(eq(users.id, targetUserId))
          .returning();

        if (!updated) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({
          id: updated.id,
          affiliatePercent: updated.affiliatePercent,
          affiliateCloserUserId: updated.affiliateCloserUserId,
          affiliateBookerUserId: updated.affiliateBookerUserId,
        });
      } catch (error: any) {
        console.error("Error updating affiliate settings:", error);
        res.status(500).json({ message: "Failed to update affiliate settings" });
      }
    },
  );

  // Affiliate payout queue (manual payouts)
  app.get(
    "/api/admin/affiliate-payouts",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const status = typeof req.query?.status === "string" ? req.query.status : null;
        const baseQuery = db
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

        const rows = status
          ? await baseQuery.where(eq(affiliateWithdrawals.status, status)).orderBy(desc(affiliateWithdrawals.requestedAt))
          : await baseQuery.orderBy(desc(affiliateWithdrawals.requestedAt));

        res.json(rows);
      } catch (error: any) {
        console.error("Error fetching affiliate payouts:", error);
        res.status(500).json({ message: "Failed to fetch payout requests" });
      }
    },
  );

  app.post(
    "/api/admin/affiliate-payouts/:id/approve",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const payoutId = req.params.id;
        const [existing] = await db
          .select()
          .from(affiliateWithdrawals)
          .where(eq(affiliateWithdrawals.id, payoutId))
          .limit(1);

        if (!existing) {
          return res.status(404).json({ message: "Payout request not found" });
        }
        if (existing.status !== "pending") {
          return res.status(409).json({ message: "Payout is not pending" });
        }

        const [updated] = await db
          .update(affiliateWithdrawals)
          .set({
            status: "approved",
            approvedAt: new Date(),
            approvedBy: req.user.id,
          })
          .where(eq(affiliateWithdrawals.id, payoutId))
          .returning();

        res.json(updated);
      } catch (error: any) {
        console.error("Error approving affiliate payout:", error);
        res.status(500).json({ message: "Failed to approve payout" });
      }
    },
  );

  app.post(
    "/api/admin/affiliate-payouts/:id/mark-paid",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const payoutId = req.params.id;
        const [existing] = await db
          .select()
          .from(affiliateWithdrawals)
          .where(eq(affiliateWithdrawals.id, payoutId))
          .limit(1);

        if (!existing) {
          return res.status(404).json({ message: "Payout request not found" });
        }
        if (existing.status === "paid") {
          return res.status(409).json({ message: "Payout already marked paid" });
        }
        if (existing.status === "rejected") {
          return res.status(409).json({ message: "Payout was rejected" });
        }

        const [updated] = await db
          .update(affiliateWithdrawals)
          .set({
            status: "paid",
            paidAt: new Date(),
            processedAt: new Date(),
          })
          .where(eq(affiliateWithdrawals.id, payoutId))
          .returning();

        if (existing.creditLedgerId) {
          await db
            .update(creditLedger)
            .set({
              redeemedFor: "cash_payout",
              redeemedAt: new Date(),
            })
            .where(eq(creditLedger.id, existing.creditLedgerId));
        }

        res.json(updated);
      } catch (error: any) {
        console.error("Error marking affiliate payout paid:", error);
        res.status(500).json({ message: "Failed to mark payout paid" });
      }
    },
  );

  app.post(
    "/api/admin/affiliate-payouts/:id/reject",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const payoutId = req.params.id;
        const reason = typeof req.body?.reason === "string" ? req.body.reason : null;
        const [existing] = await db
          .select()
          .from(affiliateWithdrawals)
          .where(eq(affiliateWithdrawals.id, payoutId))
          .limit(1);

        if (!existing) {
          return res.status(404).json({ message: "Payout request not found" });
        }
        if (existing.status === "paid") {
          return res.status(409).json({ message: "Payout already paid" });
        }
        if (existing.status === "rejected") {
          return res.status(409).json({ message: "Payout already rejected" });
        }

        const amountNum = parseFloat(existing.amount?.toString() || "0");

        await db.transaction(async (tx: any) => {
          await tx
            .update(affiliateWithdrawals)
            .set({
              status: "rejected",
              rejectedAt: new Date(),
              notes: reason || existing.notes,
            })
            .where(eq(affiliateWithdrawals.id, payoutId));

          const reversalExists = (await tx
            .select({ id: creditLedger.id })
            .from(creditLedger)
            .where(
              and(
                eq(creditLedger.userId, existing.userId),
                eq(creditLedger.sourceType, "cash_payout_reversal"),
                eq(creditLedger.sourceId, payoutId),
              ),
            )
            .limit(1))[0];

          if (!reversalExists && amountNum > 0) {
            await tx.insert(creditLedger).values({
              userId: existing.userId,
              amount: amountNum.toString(),
              sourceType: "cash_payout_reversal",
              sourceId: payoutId,
            });
          }

          if (existing.creditLedgerId) {
            await tx
              .update(creditLedger)
              .set({ redeemedFor: "cash_payout_rejected" })
              .where(eq(creditLedger.id, existing.creditLedgerId));
          }
        });

        res.json({ success: true });
      } catch (error: any) {
        console.error("Error rejecting affiliate payout:", error);
        res.status(500).json({ message: "Failed to reject payout" });
      }
    },
  );

  app.post(
    "/api/admin/users/:id/resend-verification",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const user = await storage.getUser(req.params.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        if (!user.email) {
          return res.status(400).json({ message: "User has no email address" });
        }
        if (user.emailVerified) {
          return res
            .status(400)
            .json({ message: "Email is already verified" });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await storage.createEmailVerificationToken({
          userId: user.id,
          tokenHash,
          expiresAt,
          requestIp: req.ip || req.connection.remoteAddress || undefined,
          userAgent: req.get("User-Agent") || undefined,
        });

        const apiBaseUrl =
          `${req.protocol}://${req.get("host")}` ||
          process.env.PUBLIC_BASE_URL ||
          "http://localhost:5000";
        const verifyUrl = `${apiBaseUrl}/api/auth/verify-email?token=${encodeURIComponent(
          token,
        )}`;

        await emailService.sendEmailVerificationEmail(user, verifyUrl);

        res.json({ message: "Verification email sent" });
      } catch (error: any) {
        console.error("Error resending verification email:", error);
        res.status(500).json({
          message: error.message || "Failed to resend verification email",
        });
      }
    }
  );

  app.post(
    "/api/admin/users/:id/verify",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (!requireAdminUser(req, res)) return;
      try {
        const user = await storage.getUser(req.params.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const updated = await storage.updateUser(user.id, {
          emailVerified: true,
        });
        res.json(sanitizeUser(updated, { includeStripe: true }));
      } catch (error: any) {
        console.error("Error verifying user:", error);
        res.status(500).json({
          message: error.message || "Failed to verify user",
        });
      }
    }
  );

  app.post(
    "/api/admin/users/:id/send-subscription-link",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const user = await storage.getUser(req.params.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        if (!user.email) {
          return res.status(400).json({ message: "User has no email address" });
        }

        const baseUrl =
          process.env.CLIENT_ORIGIN ||
          process.env.PUBLIC_BASE_URL ||
          "http://localhost:5000";
        const subscribeUrl = `${baseUrl}/subscribe`;
        const subject = "MealScout Monthly Subscription";
        const html = `
          <p>Hi ${user.firstName || "there"},</p>
          <p>Use the link below to sign up for MealScout monthly subscriptions:</p>
          <p><a href="${subscribeUrl}">Subscribe now</a></p>
          <p>If the link doesn't work, copy and paste this URL:</p>
          <p>${subscribeUrl}</p>
        `;
        const text = `Use this link to sign up for MealScout monthly subscriptions: ${subscribeUrl}`;

        await emailService.sendBasicEmail(user.email, subject, html, text);
        res.json({ message: "Subscription link sent" });
      } catch (error: any) {
        console.error("Error sending subscription link:", error);
        res.status(500).json({
          message: error.message || "Failed to send subscription link",
        });
      }
    }
  );

  app.patch(
    "/api/admin/users/:id",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const userId = req.params.id;
        const {
          email,
          firstName,
          lastName,
          phone,
          postalCode,
          birthYear,
          gender,
          isActive,
          emailVerified,
          userType,
        } = req.body || {};

        const updates: any = {};
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

        if (userType) {
          const allowedTypes = [
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
            return res.status(400).json({ message: "Invalid user type" });
          }
          if (req.user?.userType === "staff") {
            if (userType === "admin" || userType === "super_admin") {
              return res.status(403).json({
                message: "Staff cannot assign admin roles",
              });
            }
          }
          await storage.updateUserType(userId, userType);
        }

        const updated = Object.keys(updates).length
          ? await storage.updateUser(userId, updates)
          : await storage.getUser(userId);

        if (!updated) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json(sanitizeUser(updated, { includeStripe: true }));
      } catch (error: any) {
        console.error("Error updating user info:", error);
        if (error?.code === "23505") {
          return res.status(409).json({
            message: "Email or phone already in use",
          });
        }
        res.status(500).json({
          message: error.message || "Failed to update user",
        });
      }
    }
  );

  app.get(
    "/api/admin/users/:id/parking-pass",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const hosts = await storage.getHostsByUserId(req.params.id);
        if (!hosts.length) {
          return res.json([]);
        }

        // Ensure every host has a draft Parking Pass series so pricing can be edited.
        await Promise.all(
          hosts.map((host) => storage.ensureDraftParkingPassForHost(host.id)),
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hostIds = hosts.map((host) => host.id);
        const { occurrences } = await listParkingPassOccurrences({
          hostIds,
          horizonDays: 30,
          includeDraft: true,
          start: today,
        });

        const occurrencesByHost = new Map<string, any[]>();
        for (const row of occurrences) {
          const list = occurrencesByHost.get(row.hostId) ?? [];
          list.push(row);
          occurrencesByHost.set(row.hostId, list);
        }

        const listings = hosts.flatMap((host) => {
          const hostOccurrences = occurrencesByHost.get(host.id) ?? [];
          if (!hostOccurrences.length) return [];
          const sorted = [...hostOccurrences].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
          const upcoming = sorted.find((event) => new Date(event.date) >= today);
          const representative = upcoming ?? sorted[0];

          return [
            {
              ...representative,
              host,
              nextDate: upcoming?.date ?? representative.date,
              occurrenceCount: sorted.length,
              publicReady: isParkingPassPublicReady(representative),
              qualityFlags: computeParkingPassQualityFlags(representative),
            },
          ];
        });

        res.json(listings);
      } catch (error) {
        console.error("Error fetching parking pass listings:", error);
        res.status(500).json({ message: "Failed to fetch parking pass listings" });
      }
    }
  );

  app.patch(
    "/api/admin/parking-pass/:id",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const eventId = req.params.id;
        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Parking pass not found" });
        }
        const host = event.hostId ? await storage.getHost(event.hostId) : null;

        const updates: any = {};
        const fields = [
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
        for (const field of fields) {
          if (req.body?.[field] === undefined) continue;
          if (field === "startTime" || field === "endTime" || field === "status") {
            updates[field] = req.body[field];
          } else {
            updates[field] = Number(req.body[field]);
          }
        }

        if (updates.startTime && updates.endTime) {
          const [startHour, startMinute] = String(updates.startTime)
            .split(":")
            .map(Number);
          const [endHour, endMinute] = String(updates.endTime)
            .split(":")
            .map(Number);
          const startMinutes = startHour * 60 + startMinute;
          const endMinutes = endHour * 60 + endMinute;
          if (endMinutes <= startMinutes) {
            return res
              .status(400)
              .json({ message: "End time must be after start time" });
          }
        }

        if (updates.maxTrucks !== undefined && updates.maxTrucks < 1) {
          return res
            .status(400)
            .json({ message: "Max trucks must be at least 1" });
        }

        const breakfast = Number(
          updates.breakfastPriceCents ?? event.breakfastPriceCents ?? 0,
        );
        const lunch = Number(
          updates.lunchPriceCents ?? event.lunchPriceCents ?? 0,
        );
        const dinner = Number(
          updates.dinnerPriceCents ?? event.dinnerPriceCents ?? 0,
        );
        const dailyExisting = Number(event.dailyPriceCents ?? 0);
        const weeklyExisting = Number(event.weeklyPriceCents ?? 0);
        const monthlyExisting = Number(event.monthlyPriceCents ?? 0);
        const dailyCandidate =
          updates.dailyPriceCents !== undefined
            ? Number(updates.dailyPriceCents)
            : dailyExisting;
        const weeklyCandidate =
          updates.weeklyPriceCents !== undefined
            ? Number(updates.weeklyPriceCents)
            : weeklyExisting;
        const monthlyCandidate =
          updates.monthlyPriceCents !== undefined
            ? Number(updates.monthlyPriceCents)
            : monthlyExisting;
        const slotSum = breakfast + lunch + dinner;
        const hasAnyPrice = [slotSum, dailyCandidate, weeklyCandidate, monthlyCandidate].some(
          (value) => Number(value) > 0,
        );
        if (!hasAnyPrice) {
          return res.status(400).json({
            message: "At least one slot price is required.",
          });
        }
        const dailyOverride =
          updates.dailyPriceCents !== undefined
            ? Number(updates.dailyPriceCents)
            : null;
        const weeklyOverride =
          updates.weeklyPriceCents !== undefined
            ? Number(updates.weeklyPriceCents)
            : null;
        const monthlyOverride =
          updates.monthlyPriceCents !== undefined
            ? Number(updates.monthlyPriceCents)
            : null;
        let baseDaily =
          dailyOverride ?? (slotSum > 0 ? slotSum : event.dailyPriceCents ?? 0);
        if (baseDaily <= 0) {
          if (weeklyOverride && weeklyOverride > 0) {
            baseDaily = Math.round(weeklyOverride / 7);
          } else if (monthlyOverride && monthlyOverride > 0) {
            baseDaily = Math.round(monthlyOverride / 30);
          }
        }
        const hostPriceCents = slotSum > 0 ? slotSum : baseDaily;
        const pricingUpdates = {
          hostPriceCents: hostPriceCents || event.hostPriceCents || 0,
          dailyPriceCents: baseDaily,
          weeklyPriceCents:
            weeklyOverride ?? (baseDaily > 0 ? baseDaily * 7 : event.weeklyPriceCents ?? 0),
          monthlyPriceCents:
            monthlyOverride ?? (baseDaily > 0 ? baseDaily * 30 : event.monthlyPriceCents ?? 0),
          requiresPayment: true,
          updatedAt: new Date(),
        };

        if (event.seriesId) {
          const seriesUpdates: any = { updatedAt: new Date() };
          if (updates.startTime !== undefined) {
            seriesUpdates.defaultStartTime = String(updates.startTime);
          }
          if (updates.endTime !== undefined) {
            seriesUpdates.defaultEndTime = String(updates.endTime);
          }
          if (updates.maxTrucks !== undefined) {
            seriesUpdates.defaultMaxTrucks = Number(updates.maxTrucks);
          }
          const pricingTouched = [
            "breakfastPriceCents",
            "lunchPriceCents",
            "dinnerPriceCents",
            "dailyPriceCents",
            "weeklyPriceCents",
            "monthlyPriceCents",
          ].some((field) => req.body?.[field] !== undefined);
          if (pricingTouched) {
            seriesUpdates.defaultBreakfastPriceCents = breakfast;
            seriesUpdates.defaultLunchPriceCents = lunch;
            seriesUpdates.defaultDinnerPriceCents = dinner;
            seriesUpdates.defaultDailyPriceCents = baseDaily;
            seriesUpdates.defaultWeeklyPriceCents = pricingUpdates.weeklyPriceCents;
            seriesUpdates.defaultMonthlyPriceCents = pricingUpdates.monthlyPriceCents;
            seriesUpdates.defaultHostPriceCents = hostPriceCents;

            const publicReady =
              host &&
              isParkingPassPublicReady({
                host,
                startTime: updates.startTime ?? event.startTime,
                endTime: updates.endTime ?? event.endTime,
                maxTrucks: updates.maxTrucks ?? event.maxTrucks,
                breakfastPriceCents: breakfast,
                lunchPriceCents: lunch,
                dinnerPriceCents: dinner,
                dailyPriceCents: baseDaily,
                weeklyPriceCents: pricingUpdates.weeklyPriceCents,
                monthlyPriceCents: pricingUpdates.monthlyPriceCents,
              });

            seriesUpdates.status = publicReady ? "published" : "draft";
            seriesUpdates.publishedAt = publicReady ? new Date() : null;
          }
          if (Object.keys(seriesUpdates).length > 1) {
            await db
              .update(eventSeries)
              .set(seriesUpdates)
              .where(eq(eventSeries.id, event.seriesId));
          }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const scope = event.seriesId
          ? eq(events.seriesId, event.seriesId)
          : eq(events.hostId, event.hostId);

        const updatedEvents = await db
          .update(events)
          .set({ ...updates, ...pricingUpdates })
          .where(
            and(scope, gte(events.date, today), eq(events.requiresPayment, true)),
          )
          .returning();

        let updated = updatedEvents[0];
        if (!updated) {
          const [singleUpdated] = await db
            .update(events)
            .set({ ...updates, ...pricingUpdates })
            .where(eq(events.id, eventId))
            .returning();
          updated = singleUpdated;
        }

        void logAudit(
          req.user?.id || "",
          "admin_parking_pass_updated",
          "parking_pass",
          String(eventId),
          String(req.ip || ""),
          String(req.get("User-Agent") || ""),
          {
            seriesId: event.seriesId,
            hostId: event.hostId,
            fields: Object.keys(updates),
            pricingFields: Object.keys(pricingUpdates),
          },
        ).catch((err) =>
          console.error("Failed to write admin parking pass audit log:", err),
        );

        res.json(updated ?? event);
      } catch (error: any) {
        console.error("Error updating parking pass:", error);
        res.status(500).json({
          message: error.message || "Failed to update parking pass",
        });
      }
    }
  );

  app.post(
    "/api/admin/parking-pass/backfill",
    isAuthenticated,
    isStaffOrAdmin,
    async (_req: any, res) => {
      try {
        // Ensures every host row has a draft parking pass series, so pricing can be edited immediately.
        const created = await storage.ensureDraftParkingPassesForHosts();
        res.json({ success: true, created });
      } catch (error: any) {
        console.error("Error backfilling parking pass series:", error);
        res.status(500).json({ message: "Failed to backfill parking pass series" });
      }
    },
  );

  app.post(
    "/api/admin/parking-pass/normalize-series",
    isAuthenticated,
    isStaffOrAdmin,
    async (_req: any, res) => {
      try {
        const rows = await db
          .select({ series: eventSeries })
          .from(eventSeries)
          .where(eq(eventSeries.seriesType, "parking_pass"));

        const hostIds = Array.from(
          new Set<string>(
            rows
              .map((row: any) => String(row.series?.hostId || "").trim())
              .filter(Boolean),
          ),
        );
        const hostRows = await storage.getHostsByIds(hostIds);
        const hostById = new Map<string, any>(
          (hostRows || []).map((host: any) => [host.id, host]),
        );

        let updated = 0;
        for (const row of rows as any[]) {
          const series = row.series;
          const host = hostById.get(String(series.hostId || "").trim()) ?? null;
          const listing = {
            host,
            startTime: series.defaultStartTime,
            endTime: series.defaultEndTime,
            maxTrucks: series.defaultMaxTrucks,
            breakfastPriceCents: series.defaultBreakfastPriceCents,
            lunchPriceCents: series.defaultLunchPriceCents,
            dinnerPriceCents: series.defaultDinnerPriceCents,
            dailyPriceCents: series.defaultDailyPriceCents,
            weeklyPriceCents: series.defaultWeeklyPriceCents,
            monthlyPriceCents: series.defaultMonthlyPriceCents,
          };
          const publicReady = isParkingPassPublicReady(listing);
          const nextStatus = publicReady ? "published" : "draft";

          if (String(series.status) !== nextStatus) {
            await db
              .update(eventSeries)
              .set({
                status: nextStatus as any,
                publishedAt: publicReady ? (series.publishedAt ?? new Date()) : null,
                updatedAt: new Date(),
              })
              .where(eq(eventSeries.id, series.id));
            updated += 1;
          }
        }

        res.json({ success: true, updated });
      } catch (error: any) {
        console.error("Error normalizing parking pass series:", error);
        res.status(500).json({ message: "Failed to normalize parking pass series" });
      }
    },
  );

  app.post(
    "/api/admin/parking-pass/integrity/run",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const dryRun = Boolean(req.body?.dryRun);
        const result = await runParkingPassIntegrity({ dryRun });
        res.json({ success: true, ...result });
      } catch (error: any) {
        console.error("Error running parking pass integrity:", error);
        res.status(500).json({ message: "Failed to run integrity job" });
      }
    },
  );

  app.patch(
    "/api/admin/users/:id/status",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
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
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const { userType } = req.body;
        const allowedTypes = [
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

  app.get(
    "/api/admin/hosts",
    isAuthenticated,
    isStaffOrAdmin,
    async (_req: any, res) => {
      try {
        const allHosts = await storage.getAllHosts();
        res.json(allHosts);
      } catch (error) {
        console.error("Error fetching hosts:", error);
        res.status(500).json({ message: "Failed to fetch hosts" });
      }
    },
  );

  app.patch(
    "/api/admin/hosts/:hostId/coordinates",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const hostId = req.params.hostId;
        const lat = Number(req.body?.latitude);
        const lng = Number(req.body?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return res.status(400).json({ message: "Invalid coordinates" });
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return res.status(400).json({ message: "Invalid coordinates" });
        }

        const updated = await storage.updateHostCoordinates(hostId, lat, lng);
        res.json(updated);
      } catch (error: any) {
        console.error("Error updating host coordinates:", error);
        res.status(500).json({ message: "Failed to update coordinates" });
      }
    },
  );

  app.delete(
    "/api/admin/users/:id",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
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
    isStaffOrAdmin,
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

  app.post(
    "/api/admin/users/:userId/addresses",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const address = await storage.createUserAddress({
          userId: req.params.userId,
          label: req.body?.label || "Address",
          address: req.body?.address,
          city: req.body?.city,
          state: req.body?.state,
          postalCode: req.body?.postalCode,
          latitude: req.body?.latitude,
          longitude: req.body?.longitude,
          type: req.body?.type || "other",
          isDefault: !!req.body?.isDefault,
        });

        if (req.body?.isDefault) {
          await storage.setDefaultAddress(req.params.userId, address.id);
        }
        await storage.syncHostFromUserAddress(req.params.userId, address, undefined, {
          force: true,
        });

        res.json(address);
      } catch (error: any) {
        console.error("Error creating user address:", error);
        res.status(500).json({ message: "Failed to create address" });
      }
    }
  );

  app.patch(
    "/api/admin/users/:userId/addresses/:addressId",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const existing = await storage.getUserAddress(req.params.addressId);
        const updated = await storage.updateUserAddress(req.params.addressId, {
          label: req.body?.label,
          address: req.body?.address,
          city: req.body?.city,
          state: req.body?.state,
          postalCode: req.body?.postalCode,
          latitude: req.body?.latitude,
          longitude: req.body?.longitude,
          type: req.body?.type,
        });

        if (req.body?.isDefault) {
          await storage.setDefaultAddress(req.params.userId, updated.id);
        }
        if (existing) {
          await storage.syncHostFromUserAddress(
            req.params.userId,
            updated,
            existing,
            { force: true },
          );
        }

        res.json(updated);
      } catch (error: any) {
        console.error("Error updating user address:", error);
        res.status(500).json({ message: "Failed to update address" });
      }
    }
  );

  app.post(
    "/api/admin/users/:userId/addresses/:addressId/default",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        await storage.setDefaultAddress(req.params.userId, req.params.addressId);
        res.json({ message: "Default address updated" });
      } catch (error) {
        console.error("Error setting default address:", error);
        res.status(500).json({ message: "Failed to set default address" });
      }
    }
  );

  app.delete(
    "/api/admin/users/:userId/addresses/:addressId",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const existing = await storage.getUserAddress(req.params.addressId);
        await storage.deleteUserAddress(req.params.addressId);
        if (existing) {
          await storage.deleteHostForUserAddress(req.params.userId, existing);
        }
        res.json({ message: "Address deleted" });
      } catch (error) {
        console.error("Error deleting user address:", error);
        res.status(500).json({ message: "Failed to delete address" });
      }
    }
  );

  app.post(
    "/api/admin/users/:userId/hosts",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const userId = req.params.userId;
        const address = req.body?.address?.trim();
        const businessName = req.body?.businessName?.trim();

        if (!businessName || !address) {
          return res.status(400).json({
            message: "Business name and address are required.",
          });
        }

        const city = req.body?.city?.trim() || null;
        const state = req.body?.state?.trim() || null;
        const newKey = buildLocationKey(address, city, state);
        const existingHosts = await db
          .select({
            address: hosts.address,
            city: hosts.city,
            state: hosts.state,
          })
          .from(hosts)
          .where(eq(hosts.userId, userId));
        const hasDuplicate = existingHosts.some(
          (host: (typeof existingHosts)[number]) =>
            buildLocationKey(host.address, host.city, host.state) === newKey,
        );
        if (hasDuplicate) {
          return res.status(409).json({
            message:
              "This user already has a host location for that address.",
          });
        }

        const expectedFootTraffic =
          req.body?.expectedFootTraffic !== undefined &&
          req.body?.expectedFootTraffic !== null &&
          req.body?.expectedFootTraffic !== ""
            ? Number(req.body.expectedFootTraffic)
            : undefined;
        const spotCount =
          req.body?.spotCount !== undefined &&
          req.body?.spotCount !== null &&
          req.body?.spotCount !== ""
            ? Number(req.body.spotCount)
            : undefined;

        const parsed = insertHostSchema.parse({
          userId,
          businessName,
          address,
          city,
          state,
          locationType: req.body?.locationType || "other",
          expectedFootTraffic: Number.isFinite(expectedFootTraffic)
            ? expectedFootTraffic
            : undefined,
          contactPhone: req.body?.contactPhone || null,
          notes: req.body?.notes || null,
          amenities: req.body?.amenities,
          spotCount: Number.isFinite(spotCount) ? spotCount : undefined,
          isVerified: true,
          adminCreated: true,
          latitude:
            req.body?.latitude !== undefined && req.body?.latitude !== null
              ? req.body.latitude.toString()
              : undefined,
          longitude:
            req.body?.longitude !== undefined && req.body?.longitude !== null
              ? req.body.longitude.toString()
              : undefined,
        });

        const host = await storage.createHost(parsed);
        // Ensure the new host has draft Parking Pass events so pricing can be edited immediately.
        await storage.ensureDraftParkingPassForHost(host.id);
        res.status(201).json(host);
      } catch (error: any) {
        console.error("Error creating host location:", error);
        res.status(500).json({ message: "Failed to create host location" });
      }
    },
  );

  app.get(
    "/api/admin/users/:id/hosts",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const hostsForUser = await storage.getHostsByUserId(req.params.id);
        res.json(hostsForUser);
      } catch (error) {
        console.error("Error fetching user hosts:", error);
        res.status(500).json({ message: "Failed to fetch hosts" });
      }
    }
  );

  app.get(
    "/api/admin/users/:id/restaurants",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const restaurantsForUser = await storage.getRestaurantsByOwner(
          req.params.id,
        );
        res.json(restaurantsForUser);
      } catch (error) {
        console.error("Error fetching user restaurants:", error);
        res.status(500).json({ message: "Failed to fetch restaurants" });
      }
    }
  );

  app.get(
    "/api/admin/users/:id/deals",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const ownedRestaurants = await storage.getRestaurantsByOwner(
          req.params.id,
        );
        if (!ownedRestaurants.length) {
          return res.json([]);
        }
        const restaurantIds = ownedRestaurants.map((r) => r.id);
        const userDeals = await db
          .select()
          .from(deals)
          .where(inArray(deals.restaurantId, restaurantIds))
          .orderBy(deals.createdAt);
        res.json(userDeals);
      } catch (error) {
        console.error("Error fetching user deals:", error);
        res.status(500).json({ message: "Failed to fetch deals" });
      }
    }
  );

  app.get(
    "/api/admin/users/:id/events",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const hostsForUser = await storage.getHostsByUserId(req.params.id);
        if (!hostsForUser.length) {
          return res.json([]);
        }
        const hostIds = hostsForUser.map((h) => h.id);
        const userEvents = await db
          .select()
          .from(events)
          .where(inArray(events.hostId, hostIds))
          .orderBy(events.date);
        res.json(userEvents);
      } catch (error) {
        console.error("Error fetching user events:", error);
        res.status(500).json({ message: "Failed to fetch events" });
      }
    }
  );

  app.get(
    "/api/admin/users/:id/event-series",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const hostsForUser = await storage.getHostsByUserId(req.params.id);
        if (!hostsForUser.length) {
          return res.json([]);
        }
        const hostIds = hostsForUser.map((h) => h.id);
        const userSeries = await db
          .select()
          .from(eventSeries)
          .where(inArray(eventSeries.hostId, hostIds))
          .orderBy(eventSeries.createdAt);
        res.json(userSeries);
      } catch (error) {
        console.error("Error fetching event series:", error);
        res.status(500).json({ message: "Failed to fetch event series" });
      }
    }
  );

  app.get(
    "/api/admin/users/:id/parking-pass-bookings",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const userId = req.params.id;
        const bookingsAsTruck = await db
          .select()
          .from(eventBookings)
          .innerJoin(restaurants, eq(eventBookings.truckId, restaurants.id))
          .where(eq(restaurants.ownerId, userId));

        const hostRows = await db
          .select({ id: hosts.id })
          .from(hosts)
          .where(eq(hosts.userId, userId));
        const hostIds = hostRows.map((row: (typeof hostRows)[number]) => row.id);
        const bookingsAsHost = hostIds.length
          ? await db
              .select()
              .from(eventBookings)
              .where(inArray(eventBookings.hostId, hostIds))
          : [];

        res.json({ bookingsAsTruck, bookingsAsHost });
      } catch (error) {
        console.error("Error fetching parking pass bookings:", error);
        res.status(500).json({ message: "Failed to fetch bookings" });
      }
    }
  );

  app.patch(
    "/api/admin/hosts/:id",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const updates: any = {
          businessName: req.body?.businessName,
          address: req.body?.address,
          city: req.body?.city,
          state: req.body?.state,
          latitude: req.body?.latitude,
          longitude: req.body?.longitude,
          spotImageUrl: req.body?.spotImageUrl,
          locationType: req.body?.locationType,
          expectedFootTraffic: req.body?.expectedFootTraffic,
          amenities: req.body?.amenities,
          contactPhone: req.body?.contactPhone,
          notes: req.body?.notes,
          isVerified: req.body?.isVerified,
        };

        Object.keys(updates).forEach((key) => {
          if (updates[key] === undefined) {
            delete updates[key];
          }
        });

        const [updated] = await db
          .update(hosts)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(hosts.id, req.params.id))
          .returning();

        res.json(updated);
      } catch (error: any) {
        console.error("Error updating host:", error);
        res.status(500).json({ message: "Failed to update host" });
      }
    }
  );

  app.delete(
    "/api/admin/hosts/:hostId",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const hostId = req.params.hostId;
        const host = await storage.getHost(hostId);
        if (!host) {
          return res.status(404).json({ message: "Host location not found" });
        }

        const existingBookings = await db
          .select({ id: eventBookings.id })
          .from(eventBookings)
          .where(eq(eventBookings.hostId, hostId))
          .limit(1);

        if (existingBookings.length > 0) {
          return res.status(409).json({
            message:
              "This location has bookings and cannot be deleted.",
          });
        }

        await db.delete(hosts).where(eq(hosts.id, hostId));
        res.json({ message: "Host location deleted" });
      } catch (error: any) {
        console.error("Error deleting host location:", error);
        res.status(500).json({ message: "Failed to delete host location" });
      }
    },
  );

  app.patch(
    "/api/admin/restaurants/:id",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const updates: any = {
          name: req.body?.name,
          address: req.body?.address,
          phone: req.body?.phone,
          businessType: req.body?.businessType,
          cuisineType: req.body?.cuisineType,
          promoCode: req.body?.promoCode,
          city: req.body?.city,
          state: req.body?.state,
          latitude: req.body?.latitude,
          longitude: req.body?.longitude,
          isActive: req.body?.isActive,
          isVerified: req.body?.isVerified,
          description: req.body?.description,
          websiteUrl: req.body?.websiteUrl,
          instagramUrl: req.body?.instagramUrl,
          facebookPageUrl: req.body?.facebookPageUrl,
          amenities: req.body?.amenities,
        };

        Object.keys(updates).forEach((key) => {
          if (updates[key] === undefined) {
            delete updates[key];
          }
        });

        const updated = await storage.updateRestaurant(req.params.id, updates);
        res.json(updated);
      } catch (error: any) {
        console.error("Error updating restaurant:", error);
        res.status(500).json({ message: "Failed to update restaurant" });
      }
    }
  );

  app.get(
    "/api/admin/restaurants/:id/deals",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const restaurantDeals = await storage.getDealsByRestaurant(
          req.params.id,
        );
        res.json(restaurantDeals);
      } catch (error) {
        console.error("Error fetching restaurant deals:", error);
        res.status(500).json({ message: "Failed to fetch deals" });
      }
    }
  );

  app.patch(
    "/api/admin/deals/:id",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const updates: any = {
          title: req.body?.title,
          description: req.body?.description,
          dealType: req.body?.dealType,
          discountValue:
            req.body?.discountValue !== undefined
              ? Number(req.body.discountValue)
              : undefined,
          minOrderAmount:
            req.body?.minOrderAmount !== undefined
              ? Number(req.body.minOrderAmount)
              : undefined,
          imageUrl: req.body?.imageUrl,
          startDate: req.body?.startDate
            ? new Date(req.body.startDate)
            : undefined,
          endDate: req.body?.endDate ? new Date(req.body.endDate) : undefined,
          startTime: req.body?.startTime,
          endTime: req.body?.endTime,
          availableDuringBusinessHours: req.body?.availableDuringBusinessHours,
          isOngoing: req.body?.isOngoing,
          totalUsesLimit:
            req.body?.totalUsesLimit !== undefined
              ? Number(req.body.totalUsesLimit)
              : undefined,
          perCustomerLimit:
            req.body?.perCustomerLimit !== undefined
              ? Number(req.body.perCustomerLimit)
              : undefined,
          isActive: req.body?.isActive,
        };

        Object.keys(updates).forEach((key) => {
          if (updates[key] === undefined) {
            delete updates[key];
          }
        });

        const updated = await storage.updateDeal(req.params.id, updates);
        res.json(updated);
      } catch (error: any) {
        console.error("Error updating deal:", error);
        res.status(500).json({ message: "Failed to update deal" });
      }
    }
  );

  app.patch(
    "/api/admin/events/:id",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const eventId = req.params.id;
        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        const updates: any = {
          name: req.body?.name,
          description: req.body?.description,
          date: req.body?.date ? new Date(req.body.date) : undefined,
          startTime: req.body?.startTime,
          endTime: req.body?.endTime,
          maxTrucks:
            req.body?.maxTrucks !== undefined
              ? Number(req.body.maxTrucks)
              : undefined,
          status: req.body?.status,
          hardCapEnabled: req.body?.hardCapEnabled,
          requiresPayment: req.body?.requiresPayment,
          breakfastPriceCents:
            req.body?.breakfastPriceCents !== undefined
              ? Number(req.body.breakfastPriceCents)
              : undefined,
          lunchPriceCents:
            req.body?.lunchPriceCents !== undefined
              ? Number(req.body.lunchPriceCents)
              : undefined,
          dinnerPriceCents:
            req.body?.dinnerPriceCents !== undefined
              ? Number(req.body.dinnerPriceCents)
              : undefined,
        };

        Object.keys(updates).forEach((key) => {
          if (updates[key] === undefined) {
            delete updates[key];
          }
        });

        if (updates.startTime && updates.endTime) {
          const [startHour, startMinute] = String(updates.startTime)
            .split(":")
            .map(Number);
          const [endHour, endMinute] = String(updates.endTime)
            .split(":")
            .map(Number);
          const startMinutes = startHour * 60 + startMinute;
          const endMinutes = endHour * 60 + endMinute;
          if (endMinutes <= startMinutes) {
            return res
              .status(400)
              .json({ message: "End time must be after start time" });
          }
        }

        const breakfast = Number(
          updates.breakfastPriceCents ?? event.breakfastPriceCents ?? 0,
        );
        const lunch = Number(
          updates.lunchPriceCents ?? event.lunchPriceCents ?? 0,
        );
        const dinner = Number(
          updates.dinnerPriceCents ?? event.dinnerPriceCents ?? 0,
        );
        const finalStartTime = String(updates.startTime ?? event.startTime);
        const finalEndTime = String(updates.endTime ?? event.endTime);
        const invalidSlots: string[] = [];
        if (breakfast > 0 && !isSlotWithinHours("breakfast", finalStartTime, finalEndTime)) {
          invalidSlots.push("Breakfast");
        }
        if (lunch > 0 && !isSlotWithinHours("lunch", finalStartTime, finalEndTime)) {
          invalidSlots.push("Lunch");
        }
        if (dinner > 0 && !isSlotWithinHours("dinner", finalStartTime, finalEndTime)) {
          invalidSlots.push("Dinner");
        }
        if (invalidSlots.length > 0) {
          return res.status(400).json({
            message:
              "Parking hours must fully cover priced slots: " +
              invalidSlots.join(", "),
          });
        }
        const slotSum = breakfast + lunch + dinner;
        updates.hostPriceCents = slotSum;
        updates.dailyPriceCents = slotSum;
        updates.weeklyPriceCents = slotSum * 7;
        updates.monthlyPriceCents = slotSum * 30;
        updates.updatedAt = new Date();

        const [updated] = await db
          .update(events)
          .set(updates)
          .where(eq(events.id, eventId))
          .returning();

        res.json(updated);
      } catch (error: any) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Failed to update event" });
      }
    }
  );

  app.patch(
    "/api/admin/event-series/:id",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const updates: any = {
          name: req.body?.name,
          description: req.body?.description,
          timezone: req.body?.timezone,
          recurrenceRule: req.body?.recurrenceRule,
          startDate: req.body?.startDate
            ? new Date(req.body.startDate)
            : undefined,
          endDate: req.body?.endDate ? new Date(req.body.endDate) : undefined,
          defaultStartTime: req.body?.defaultStartTime,
          defaultEndTime: req.body?.defaultEndTime,
          defaultMaxTrucks:
            req.body?.defaultMaxTrucks !== undefined
              ? Number(req.body.defaultMaxTrucks)
              : undefined,
          defaultHardCapEnabled: req.body?.defaultHardCapEnabled,
          status: req.body?.status,
        };

        Object.keys(updates).forEach((key) => {
          if (updates[key] === undefined) {
            delete updates[key];
          }
        });

        const [updated] = await db
          .update(eventSeries)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(eventSeries.id, req.params.id))
          .returning();

        res.json(updated);
      } catch (error: any) {
        console.error("Error updating event series:", error);
        res.status(500).json({ message: "Failed to update event series" });
      }
    }
  );

  app.patch(
    "/api/admin/parking-pass-bookings/:id",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      if (denyStaffEdits(req, res)) return;
      try {
        const updates: any = {
          status: req.body?.status,
          refundStatus: req.body?.refundStatus,
          refundAmountCents:
            req.body?.refundAmountCents !== undefined
              ? Number(req.body.refundAmountCents)
              : undefined,
          cancellationReason: req.body?.cancellationReason,
          refundReason: req.body?.refundReason,
        };

        Object.keys(updates).forEach((key) => {
          if (updates[key] === undefined) {
            delete updates[key];
          }
        });

        const [updated] = await db
          .update(eventBookings)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(eventBookings.id, req.params.id))
          .returning();

        res.json(updated);
      } catch (error: any) {
        console.error("Error updating booking:", error);
        res.status(500).json({ message: "Failed to update booking" });
      }
    }
  );

  app.get(
    "/api/admin/deals",
    isAuthenticated,
    isStaffOrAdmin,
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
    isStaffOrAdmin,
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
    isStaffOrAdmin,
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
    isStaffOrAdmin,
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
    isStaffOrAdmin,
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
    isStaffOrAdmin,
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
    isStaffOrAdmin,
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
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const user = req.user;
        const { id } = req.params;
        await storage.approveVerificationRequest(id, user.id);

        const [claimContext] = await db
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
          .limit(1);

        if (claimContext?.claimedFromImportId) {
          await db
            .update(truckImportListings)
            .set({
              status: "claimed",
              updatedAt: new Date(),
            })
            .where(eq(truckImportListings.id, claimContext.claimedFromImportId));

          await db
            .update(truckClaimRequests)
            .set({
              status: "approved",
              reviewerId: user.id,
              reviewedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(truckClaimRequests.restaurantId, claimContext.restaurantId));

          await db
            .update(restaurants)
            .set({
              isActive: true,
              updatedAt: new Date(),
            })
            .where(eq(restaurants.id, claimContext.restaurantId));

          const notificationEmail = "notifications@mealscout.us";
          if (claimContext.ownerEmail) {
            await emailService.sendBasicEmail(
              claimContext.ownerEmail,
              "Your food truck claim was approved",
              `
                <p>Your food truck claim has been approved.</p>
                <p><strong>Restaurant ID:</strong> ${claimContext.restaurantId}</p>
              `,
            );
          }
          await emailService.sendBasicEmail(
            notificationEmail,
            "Food Truck Claim Approved",
            `
              <p>A food truck claim was approved.</p>
              <p><strong>Restaurant ID:</strong> ${claimContext.restaurantId}</p>
              <p><strong>Owner ID:</strong> ${claimContext.ownerId}</p>
            `,
          );
        }

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
    isStaffOrAdmin,
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

        const [claimContext] = await db
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
          .limit(1);

        if (claimContext?.claimedFromImportId) {
          await db
            .update(truckImportListings)
            .set({
              status: "rejected",
              updatedAt: new Date(),
            })
            .where(eq(truckImportListings.id, claimContext.claimedFromImportId));

          await db
            .update(truckClaimRequests)
            .set({
              status: "rejected",
              reviewerId: user.id,
              reviewedAt: new Date(),
              rejectionReason: reason,
              updatedAt: new Date(),
            })
            .where(eq(truckClaimRequests.restaurantId, claimContext.restaurantId));

          const notificationEmail = "notifications@mealscout.us";
          if (claimContext.ownerEmail) {
            await emailService.sendBasicEmail(
              claimContext.ownerEmail,
              "Your food truck claim was rejected",
              `
                <p>Your food truck claim was rejected.</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p><strong>Restaurant ID:</strong> ${claimContext.restaurantId}</p>
              `,
            );
          }
          await emailService.sendBasicEmail(
            notificationEmail,
            "Food Truck Claim Rejected",
            `
              <p>A food truck claim was rejected.</p>
              <p><strong>Restaurant ID:</strong> ${claimContext.restaurantId}</p>
              <p><strong>Owner ID:</strong> ${claimContext.ownerId}</p>
              <p><strong>Reason:</strong> ${reason}</p>
            `,
          );
        }

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
    isStaffOrAdmin,
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
