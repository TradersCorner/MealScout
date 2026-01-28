import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { emailService } from "../emailService";
import { db } from "../db";
import {
  insertHostSchema,
  insertEventSchema,
  events,
  eventSeries,
  hosts,
  eventBookings,
  parkingPassBlackoutDates,
} from "@shared/schema";
import { and, asc, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { isAuthenticated } from "../unifiedAuth";
import Stripe from "stripe";
import {
  getHostByUserId,
  getEventAndHostForUser,
  getInterestEventAndHostForUser,
  hostOwnsEvent,
} from "../services/hostOwnership";
import {
  computeAcceptedCount,
  shouldBlockAcceptance,
  buildCapacityFullError,
  computeFillRate,
} from "../services/interestDecision";
import { forwardGeocode } from "../utils/geocoding";
import {
  PARKING_PASS_BOOKING_DAYS,
  PARKING_PASS_SLOT_TYPES,
  getSlotWindowMinutes,
  isSlotWithinHours,
  slotWindowsOverlap,
} from "@shared/parkingPassSlots";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function registerHostRoutes(app: Express) {
  const normalizeLocationValue = (value?: string | null) =>
    (value ?? "").trim().toLowerCase();

  const buildLocationKey = (
    address?: string | null,
    city?: string | null,
    state?: string | null,
  ) =>
    [
      normalizeLocationValue(address),
      normalizeLocationValue(city),
      normalizeLocationValue(state),
    ].join("|");

  const buildGeocodeAddress = (
    address?: string | null,
    city?: string | null,
    state?: string | null,
  ) => [address, city, state, "USA"].filter(Boolean).join(", ");

  const getActiveParkingPassSeriesId = async (hostId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rows = await db
      .select({
        seriesId: events.seriesId,
        date: events.date,
        breakfastPriceCents: events.breakfastPriceCents,
        lunchPriceCents: events.lunchPriceCents,
        dinnerPriceCents: events.dinnerPriceCents,
        dailyPriceCents: events.dailyPriceCents,
        weeklyPriceCents: events.weeklyPriceCents,
        monthlyPriceCents: events.monthlyPriceCents,
      })
      .from(events)
      .where(
        and(
          eq(events.hostId, hostId),
          eq(events.requiresPayment, true),
          gte(events.date, today),
          isNotNull(events.seriesId),
        ),
      )
      .orderBy(asc(events.date))
      .limit(14);
    const hasActivePricing = (row: (typeof rows)[number]) =>
      (row.breakfastPriceCents ?? 0) > 0 ||
      (row.lunchPriceCents ?? 0) > 0 ||
      (row.dinnerPriceCents ?? 0) > 0 ||
      (row.dailyPriceCents ?? 0) > 0 ||
      (row.weeklyPriceCents ?? 0) > 0 ||
      (row.monthlyPriceCents ?? 0) > 0;
    const activeRow = rows.find((row: (typeof rows)[number]) =>
      hasActivePricing(row),
    );
    return activeRow?.seriesId ?? null;
  };

  // Host Profile & Events
  app.post("/api/hosts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Check if host profile already exists
      const existing = await getHostByUserId(userId);
      if (existing) {
        return res.status(400).json({ message: "Host profile already exists" });
      }

      const parsed = insertHostSchema.parse({
        ...req.body,
        userId,
      });

      const existingHosts = await db
        .select({
          id: hosts.id,
          address: hosts.address,
          city: hosts.city,
          state: hosts.state,
        })
        .from(hosts)
        .where(eq(hosts.userId, userId));

      const newKey = buildLocationKey(
        parsed.address,
        parsed.city ?? null,
        parsed.state ?? null,
      );
      const hasDuplicate = existingHosts.some(
        (host: (typeof existingHosts)[number]) =>
          buildLocationKey(host.address, host.city, host.state) === newKey,
      );
      if (hasDuplicate) {
        return res.status(409).json({
          message:
            "You already have a location for this address. Edit the existing location instead.",
        });
      }

      const rawLat = parsed.latitude ?? null;
      const rawLng = parsed.longitude ?? null;
      const manualLat =
        rawLat === null || rawLat === undefined ? null : Number(rawLat);
      const manualLng =
        rawLng === null || rawLng === undefined ? null : Number(rawLng);
      const hasManualCoords = rawLat !== null || rawLng !== null;
      if (hasManualCoords && (!Number.isFinite(manualLat) || !Number.isFinite(manualLng))) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      const manualCoords =
        hasManualCoords && manualLat !== null && manualLng !== null
          ? { lat: manualLat, lng: manualLng }
          : null;
      if (
        manualCoords &&
        (manualCoords.lat < -90 ||
          manualCoords.lat > 90 ||
          manualCoords.lng < -180 ||
          manualCoords.lng > 180)
      ) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      const geocodeAddress = buildGeocodeAddress(
        parsed.address,
        parsed.city ?? null,
        parsed.state ?? null,
      );
      let coords: { lat: number; lng: number } | null = null;
      if (!manualCoords && geocodeAddress) {
        try {
          coords = await forwardGeocode(geocodeAddress);
        } catch {
          coords = null;
        }
      }

      const host = await storage.createHost({
        ...parsed,
        latitude: manualCoords
          ? manualCoords.lat.toString()
          : coords
            ? coords.lat.toString()
            : null,
        longitude: manualCoords
          ? manualCoords.lng.toString()
          : coords
            ? coords.lng.toString()
            : null,
      });

      // Hosts should keep their existing user type (typically "customer").
      // We no longer auto-upgrade hosts into restaurant_owner accounts so
      // they don't see restaurant dashboards or deal creation flows.

      res.status(201).json(host);
    } catch (error: any) {
      console.error("Error creating host:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid host data", errors: error.errors });
      }
      res
        .status(400)
        .json({ message: error.message || "Failed to create host profile" });
    }
  });

  app.get("/api/hosts/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const host = await getHostByUserId(userId);
      if (!host) {
        return res.status(404).json({ message: "Host profile not found" });
      }
      res.json(host);
    } catch (error: any) {
      console.error("Error fetching host profile:", error);
      res.status(500).json({ message: "Failed to fetch host profile" });
    }
  });

  app.get("/api/hosts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const hostProfiles = await storage.getHostsByUserId(userId);
      res.json(hostProfiles);
    } catch (error: any) {
      console.error("Error fetching host profiles:", error);
      res.status(500).json({ message: "Failed to fetch host profiles" });
    }
  });

  app.get(
    "/api/hosts/:hostId",
    isAuthenticated,
    async (req: any, res, next) => {
      const reserved = new Set(["events", "event-series"]);
      if (reserved.has(req.params.hostId)) {
        return next();
      }
      try {
        const { hostId } = req.params;
        const userId = req.user.id;
        const host = await storage.getHost(hostId);
        if (!host || host.userId !== userId) {
          return res.status(404).json({ message: "Host profile not found" });
        }
        res.json(host);
      } catch (error: any) {
        console.error("Error fetching host profile:", error);
        res.status(500).json({ message: "Failed to fetch host profile" });
      }
    },
  );

  app.patch("/api/hosts/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const host = await getHostByUserId(userId);
      if (!host) {
        return res.status(404).json({ message: "Host profile not found" });
      }

      const amenitiesSchema = z.record(z.boolean()).optional().nullable();
      const parsedAmenities = amenitiesSchema.parse(req.body?.amenities);

      const [updated] = await db
        .update(hosts)
        .set({
          amenities: parsedAmenities ?? null,
          updatedAt: new Date(),
        })
        .where(eq(hosts.id, host.id))
        .returning();

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating host profile:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid amenities data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update host profile" });
    }
  });

  app.patch("/api/hosts/:hostId", isAuthenticated, async (req: any, res) => {
    try {
      const { hostId } = req.params;
      const userId = req.user.id;
      const host = await storage.getHost(hostId);
      if (!host || host.userId !== userId) {
        return res.status(404).json({ message: "Host profile not found" });
      }

      const latitudeSchema = z.preprocess(
        (value) => (value === null ? undefined : value),
        z.coerce.number().min(-90).max(90),
      );
      const longitudeSchema = z.preprocess(
        (value) => (value === null ? undefined : value),
        z.coerce.number().min(-180).max(180),
      );
      const updateSchema = z.object({
        businessName: z.string().min(1).optional(),
        address: z.string().min(1).optional(),
        city: z.string().min(1).optional(),
        state: z.string().min(2).optional(),
        locationType: z.string().min(1).optional(),
        contactPhone: z.string().min(5).optional(),
        notes: z.string().optional().nullable(),
        amenities: z.record(z.boolean()).optional().nullable(),
        spotCount: z.number().int().min(1).optional(),
        latitude: latitudeSchema.optional(),
        longitude: longitudeSchema.optional(),
      });
      const parsed = updateSchema.parse(req.body || {});

      const hasManualCoords =
        parsed.latitude !== undefined || parsed.longitude !== undefined;
      if (
        hasManualCoords &&
        (parsed.latitude === undefined || parsed.longitude === undefined)
      ) {
        return res
          .status(400)
          .json({ message: "Latitude and longitude are required together." });
      }
      const manualCoords =
        parsed.latitude !== undefined && parsed.longitude !== undefined
          ? { lat: parsed.latitude, lng: parsed.longitude }
          : null;

      const nextAddress = parsed.address ?? host.address;
      const nextCity = parsed.city ?? host.city;
      const nextState = parsed.state ?? host.state;
      const nextKey = buildLocationKey(nextAddress, nextCity, nextState);

      const siblingHosts = await db
        .select({
          id: hosts.id,
          address: hosts.address,
          city: hosts.city,
          state: hosts.state,
        })
        .from(hosts)
        .where(eq(hosts.userId, userId));

      const hasDuplicate = siblingHosts.some(
        (item: (typeof siblingHosts)[number]) =>
          item.id !== host.id &&
          buildLocationKey(item.address, item.city, item.state) === nextKey,
      );
      if (hasDuplicate) {
        return res.status(409).json({
          message:
            "Another location already uses this address. Edit that location instead.",
        });
      }

      const addressChanged =
        buildLocationKey(host.address, host.city, host.state) !== nextKey;
      const shouldGeocode =
        !manualCoords && (addressChanged || !host.latitude || !host.longitude);
      const geocodeAddress = buildGeocodeAddress(
        nextAddress,
        nextCity ?? null,
        nextState ?? null,
      );
      let coords: { lat: number; lng: number } | null = null;
      if (shouldGeocode && geocodeAddress) {
        try {
          coords = await forwardGeocode(geocodeAddress);
        } catch {
          coords = null;
        }
      }

      const [updated] = await db
        .update(hosts)
        .set({
          businessName: parsed.businessName ?? host.businessName,
          address: nextAddress,
          city: nextCity,
          state: nextState,
          locationType: parsed.locationType ?? host.locationType,
          contactPhone: parsed.contactPhone ?? host.contactPhone,
          notes: parsed.notes ?? host.notes,
          amenities: parsed.amenities ?? host.amenities ?? null,
          spotCount: parsed.spotCount ?? host.spotCount ?? 1,
          latitude: manualCoords
            ? manualCoords.lat.toString()
            : coords
              ? coords.lat.toString()
              : addressChanged
                ? null
                : host.latitude,
          longitude: manualCoords
            ? manualCoords.lng.toString()
            : coords
              ? coords.lng.toString()
              : addressChanged
                ? null
                : host.longitude,
          updatedAt: new Date(),
        })
        .where(eq(hosts.id, host.id))
        .returning();

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating host profile:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid amenities data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update host profile" });
    }
  });

  app.patch(
    "/api/hosts/:hostId/coordinates",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { hostId } = req.params;
        const userId = req.user.id;
        const host = await storage.getHost(hostId);
        if (!host || host.userId !== userId) {
          return res.status(404).json({ message: "Host profile not found" });
        }

        const coordSchema = z.object({
          latitude: z.coerce.number().min(-90).max(90),
          longitude: z.coerce.number().min(-180).max(180),
        });
        const parsed = coordSchema.parse(req.body || {});

        const updated = await storage.updateHostCoordinates(
          host.id,
          parsed.latitude,
          parsed.longitude,
        );

        res.json(updated);
      } catch (error: any) {
        console.error("Error updating host coordinates:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid coordinates", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update coordinates" });
      }
    },
  );

  app.post(
    "/api/hosts/:hostId/geocode",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { hostId } = req.params;
        const userId = req.user.id;
        const host = await storage.getHost(hostId);
        if (!host || host.userId !== userId) {
          return res.status(404).json({ message: "Host profile not found" });
        }

        const geocodeAddress = buildGeocodeAddress(
          host.address,
          host.city ?? null,
          host.state ?? null,
        );
        let coords: { lat: number; lng: number } | null = null;
        if (geocodeAddress) {
          try {
            coords = await forwardGeocode(geocodeAddress);
          } catch {
            coords = null;
          }
        }

        if (!coords) {
          return res.status(400).json({
            message: "Unable to find coordinates for this address.",
          });
        }

        const updated = await storage.updateHostCoordinates(
          host.id,
          coords.lat,
          coords.lng,
        );

        res.json(updated);
      } catch (error: any) {
        console.error("Error geocoding host:", error);
        res.status(500).json({ message: "Failed to geocode host" });
      }
    },
  );

  app.get(
    "/api/hosts/:hostId/blackout-dates",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { hostId } = req.params;
        const userId = req.user.id;
        const host = await storage.getHost(hostId);
        if (!host || host.userId !== userId) {
          return res.status(404).json({ message: "Host profile not found" });
        }
        const seriesId = await getActiveParkingPassSeriesId(hostId);
        if (!seriesId) {
          return res.json([]);
        }
        const blackoutDates =
          await storage.getParkingPassBlackoutDates(seriesId);
        res.json(blackoutDates);
      } catch (error: any) {
        console.error("Error fetching blackout dates:", error);
        res.status(500).json({ message: "Failed to fetch blackout dates" });
      }
    },
  );

  app.post(
    "/api/hosts/:hostId/blackout-dates",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { hostId } = req.params;
        const userId = req.user.id;
        const host = await storage.getHost(hostId);
        if (!host || host.userId !== userId) {
          return res.status(404).json({ message: "Host profile not found" });
        }

        const seriesId = await getActiveParkingPassSeriesId(hostId);
        if (!seriesId) {
          return res
            .status(404)
            .json({ message: "No active parking pass found." });
        }

        const date = new Date(req.body?.date);
        if (Number.isNaN(date.getTime())) {
          return res.status(400).json({ message: "Valid date required" });
        }

        const created = await storage.createParkingPassBlackoutDate({
          seriesId,
          date,
        });
        res.status(201).json(created);
      } catch (error: any) {
        console.error("Error creating blackout date:", error);
        res.status(500).json({ message: "Failed to create blackout date" });
      }
    },
  );

  app.delete(
    "/api/hosts/:hostId/blackout-dates",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { hostId } = req.params;
        const userId = req.user.id;
        const host = await storage.getHost(hostId);
        if (!host || host.userId !== userId) {
          return res.status(404).json({ message: "Host profile not found" });
        }

        const date = new Date(req.body?.date);
        if (Number.isNaN(date.getTime())) {
          return res.status(400).json({ message: "Valid date required" });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date <= today) {
          return res.status(400).json({
            message: "Same-day blackout dates cannot be removed.",
          });
        }

        const seriesId = await getActiveParkingPassSeriesId(hostId);
        if (!seriesId) {
          return res
            .status(404)
            .json({ message: "No active parking pass found." });
        }

        await storage.deleteParkingPassBlackoutDate(seriesId, date);
        res.json({ message: "Blackout date removed" });
      } catch (error: any) {
        console.error("Error deleting blackout date:", error);
        res.status(500).json({ message: "Failed to delete blackout date" });
      }
    },
  );

  app.delete("/api/hosts/:hostId", isAuthenticated, async (req: any, res) => {
    try {
      const { hostId } = req.params;
      const userId = req.user.id;
      const host = await storage.getHost(hostId);
      if (!host || host.userId !== userId) {
        return res.status(404).json({ message: "Host profile not found" });
      }

      const existingBookings = await db
        .select({ id: eventBookings.id })
        .from(eventBookings)
        .where(eq(eventBookings.hostId, host.id))
        .limit(1);

      if (existingBookings.length > 0) {
        return res.status(409).json({
          message:
            "This location has bookings and cannot be deleted. Contact support if you need help.",
        });
      }

      await db.delete(hosts).where(eq(hosts.id, host.id));
      res.json({ message: "Location deleted" });
    } catch (error: any) {
      console.error("Error deleting host profile:", error);
      res.status(500).json({ message: "Failed to delete host profile" });
    }
  });

  const createHostParkingPassListing = async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const hostId = req.body?.hostId;
      if (!hostId) {
        return res.status(400).json({ message: "Host ID required" });
      }
      const host = await storage.getHost(hostId);
      if (!host || host.userId !== userId) {
        return res.status(404).json({ message: "Host profile not found" });
      }
      if (req.user.userType === "event_coordinator" || host.locationType === "event_coordinator") {
        return res.status(403).json({
          message: "Event coordinators can only post events, not Parking Pass listings.",
        });
      }

      if (!req.body?.requiresPayment) {
        return res.status(400).json({
          message: "Hosts can only create Parking Pass listings.",
        });
      }

      const breakfastPriceCents = Number(req.body.breakfastPriceCents || 0);
      const lunchPriceCents = Number(req.body.lunchPriceCents || 0);
      const dinnerPriceCents = Number(req.body.dinnerPriceCents || 0);
      const hasAnySlotPrice =
        breakfastPriceCents > 0 || lunchPriceCents > 0 || dinnerPriceCents > 0;

      if (!hasAnySlotPrice) {
        return res.status(400).json({
          message: "At least one slot price is required.",
        });
      }

      const parseOverrideCents = (value: any) => {
        if (value === null || value === undefined || value === "") return null;
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return null;
        return Math.max(0, Math.round(parsed));
      };

      const slotSum = breakfastPriceCents + lunchPriceCents + dinnerPriceCents;
      const dailyPriceCents = slotSum;
      const weeklyOverrideCents = parseOverrideCents(
        req.body?.weeklyPriceCents,
      );
      const monthlyOverrideCents = parseOverrideCents(
        req.body?.monthlyPriceCents,
      );
      const weeklyPriceCents = weeklyOverrideCents ?? slotSum * 7;
      const monthlyPriceCents = monthlyOverrideCents ?? slotSum * 30;

      const daysOfWeekSchema = z.array(z.number().int().min(0).max(6));
      const daysOfWeek = daysOfWeekSchema.parse(req.body?.daysOfWeek || []);
      if (daysOfWeek.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one day of week is required." });
      }

      const spotCount = Number(req.body.maxTrucks ?? host.spotCount ?? 1);
      if (!Number.isFinite(spotCount) || spotCount < 1) {
        return res
          .status(400)
          .json({ message: "Number of spots must be at least 1" });
      }

      if (host.spotCount !== spotCount) {
        await db
          .update(hosts)
          .set({ spotCount, updatedAt: new Date() })
          .where(eq(hosts.id, host.id));
      }

      const parsed = insertEventSchema.parse({
        ...req.body,
        date: new Date(),
        requiresPayment: true,
        hostId: host.id,
        maxTrucks: spotCount,
        breakfastPriceCents: breakfastPriceCents || null,
        lunchPriceCents: lunchPriceCents || null,
        dinnerPriceCents: dinnerPriceCents || null,
        dailyPriceCents,
        weeklyPriceCents,
        monthlyPriceCents,
        hostPriceCents: slotSum,
      });

      // Validation: End time > Start time
      const [startHour, startMinute] = parsed.startTime.split(":").map(Number);
      const [endHour, endMinute] = parsed.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (endMinutes <= startMinutes) {
        return res
          .status(400)
          .json({ message: "End time must be after start time" });
      }

      const invalidSlotLabels: string[] = [];
      if (
        breakfastPriceCents > 0 &&
        !isSlotWithinHours("breakfast", parsed.startTime, parsed.endTime)
      ) {
        invalidSlotLabels.push("Breakfast");
      }
      if (
        lunchPriceCents > 0 &&
        !isSlotWithinHours("lunch", parsed.startTime, parsed.endTime)
      ) {
        invalidSlotLabels.push("Lunch");
      }
      if (
        dinnerPriceCents > 0 &&
        !isSlotWithinHours("dinner", parsed.startTime, parsed.endTime)
      ) {
        invalidSlotLabels.push("Dinner");
      }
      if (invalidSlotLabels.length > 0) {
        return res.status(400).json({
          message:
            "Parking hours must fully cover priced slots: " +
            invalidSlotLabels.join(", "),
        });
      }

      // Validation: Spots >= 1
      if (parsed.maxTrucks !== undefined && parsed.maxTrucks < 1) {
        return res
          .status(400)
          .json({ message: "Number of spots must be at least 1" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingPaidEvents = await db
        .select({
          id: events.id,
          seriesId: events.seriesId,
          breakfastPriceCents: events.breakfastPriceCents,
          lunchPriceCents: events.lunchPriceCents,
          dinnerPriceCents: events.dinnerPriceCents,
          dailyPriceCents: events.dailyPriceCents,
          weeklyPriceCents: events.weeklyPriceCents,
          monthlyPriceCents: events.monthlyPriceCents,
        })
        .from(events)
        .where(
          and(
            eq(events.hostId, host.id),
            gte(events.date, today),
            eq(events.requiresPayment, true),
          ),
        );

      const hasActivePricing = (row: typeof existingPaidEvents[number]) =>
        (row.breakfastPriceCents ?? 0) > 0 ||
        (row.lunchPriceCents ?? 0) > 0 ||
        (row.dinnerPriceCents ?? 0) > 0 ||
        (row.dailyPriceCents ?? 0) > 0 ||
        (row.weeklyPriceCents ?? 0) > 0 ||
        (row.monthlyPriceCents ?? 0) > 0;

      const activePaidEvents = existingPaidEvents.filter(hasActivePricing);
      if (activePaidEvents.length > 0) {
        return res.status(409).json({
          message:
            "You already have a parking pass for this address. Edit your existing listing.",
        });
      }
      if (existingPaidEvents.length > 0) {
        const draftEventIds = existingPaidEvents.map(
          (row: (typeof existingPaidEvents)[number]) => row.id,
        );
        const draftSeriesIds = Array.from(
          new Set(
            existingPaidEvents
              .map((row: (typeof existingPaidEvents)[number]) => row.seriesId)
              .filter((id: string | null): id is string => Boolean(id)),
          ),
        ) as string[];
        await db.delete(events).where(inArray(events.id, draftEventIds));
        if (draftSeriesIds.length > 0) {
          await db
            .delete(eventSeries)
            .where(inArray(eventSeries.id, draftSeriesIds));
        }
      }

      const horizon = new Date(today);
      horizon.setDate(horizon.getDate() + 90);

      const hardCapEnabled = Boolean(req.body?.hardCapEnabled);
      const [series] = await db
        .insert(eventSeries)
        .values({
          hostId: host.id,
          name: `Parking Pass - ${host.businessName}`,
          description: host.address,
          timezone: "America/New_York",
          recurrenceRule: null,
          startDate: today,
          endDate: horizon,
          defaultStartTime: parsed.startTime,
          defaultEndTime: parsed.endTime,
          defaultMaxTrucks: spotCount,
          defaultHardCapEnabled: hardCapEnabled,
          status: "published",
          publishedAt: new Date(),
        })
        .returning();

      const seriesId = series?.id ?? null;

      const existingEvents = await db
        .select({
          date: events.date,
          startTime: events.startTime,
          endTime: events.endTime,
        })
        .from(events)
        .where(
          and(
            eq(events.hostId, host.id),
            gte(events.date, today),
            lt(events.date, horizon),
            eq(events.requiresPayment, true),
          ),
        );

      const blackoutRows = seriesId
        ? await db
            .select({ date: parkingPassBlackoutDates.date })
            .from(parkingPassBlackoutDates)
            .where(
              and(
                eq(parkingPassBlackoutDates.seriesId, seriesId),
                gte(parkingPassBlackoutDates.date, today),
                lt(parkingPassBlackoutDates.date, horizon),
              ),
            )
        : [];

      const blackoutSet = new Set(
        blackoutRows.map(
          (row: (typeof blackoutRows)[number]) =>
            new Date(row.date).toISOString().split("T")[0],
        ),
      );

      const existingKeys = new Set(
        existingEvents.map((item: (typeof existingEvents)[number]) => {
          const dateKey = new Date(item.date).toISOString().split("T")[0];
          return `${dateKey}-${item.startTime}-${item.endTime}`;
        }),
      );

      const newEvents = [];
      for (
        let cursor = new Date(today);
        cursor < horizon;
        cursor.setDate(cursor.getDate() + 1)
      ) {
        if (!daysOfWeek.includes(cursor.getDay())) {
          continue;
        }
        const dateKey = cursor.toISOString().split("T")[0];
        if (blackoutSet.has(dateKey)) {
          continue;
        }
        const key = `${dateKey}-${parsed.startTime}-${parsed.endTime}`;
        if (existingKeys.has(key)) {
          continue;
        }

        const eventPayload = {
          ...parsed,
          date: new Date(dateKey),
          seriesId,
        };
        newEvents.push(eventPayload);
      }

      if (newEvents.length === 0) {
        return res.status(200).json([]);
      }

      const createdEvents = await db.insert(events).values(newEvents).returning();
      res.status(201).json(createdEvents);
    } catch (error: any) {
      console.error("Error creating parking pass listing:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid parking pass data",
          errors: error.errors,
        });
      }
      res.status(400).json({
        message: error.message || "Failed to create parking pass listing",
      });
    }
  };

  app.post("/api/hosts/parking-pass", isAuthenticated, createHostParkingPassListing);
  app.post("/api/hosts/events", isAuthenticated, createHostParkingPassListing);

  const listHostParkingPassListings = async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const hostId = req.query?.hostId;
      if (!hostId) {
        return res.status(400).json({ message: "Host ID required" });
      }
      const host = await storage.getHost(hostId);
      if (!host || host.userId !== userId) {
        return res.status(404).json({ message: "Host profile not found" });
      }

      const eventsByHost = await storage.getEventsByHost(host.id);
      const hasPricing = (event: (typeof eventsByHost)[number]) =>
        (event.breakfastPriceCents ?? 0) > 0 ||
        (event.lunchPriceCents ?? 0) > 0 ||
        (event.dinnerPriceCents ?? 0) > 0 ||
        (event.dailyPriceCents ?? 0) > 0 ||
        (event.weeklyPriceCents ?? 0) > 0 ||
        (event.monthlyPriceCents ?? 0) > 0;
      const parkingPassListings = eventsByHost.filter(
        (event) => event.requiresPayment && hasPricing(event),
      );
      res.json(parkingPassListings);
    } catch (error: any) {
      console.error("Error fetching parking pass listings:", error);
      res.status(500).json({ message: "Failed to fetch parking pass listings" });
    }
  };

  app.get("/api/hosts/parking-pass", isAuthenticated, listHostParkingPassListings);
  app.get("/api/hosts/events", isAuthenticated, listHostParkingPassListings);

  // PATCH: Override a single parking pass listing occurrence (time window, capacity, hard cap)
  const updateHostParkingPassListing = async (req: any, res: any) => {
    try {
      const eventId = req.params.eventId ?? req.params.passId;
      if (!eventId) {
        return res.status(400).json({ message: "Parking pass ID required" });
      }
      const userId = req.user.id;

      // Verify event exists and host owns it
      const { event, host } = await getEventAndHostForUser(eventId, userId);

      if (!event) {
        return res
          .status(404)
          .json({ message: "Parking pass listing not found" });
      }
      if (!host) {
        return res.status(404).json({ message: "Host profile not found" });
      }

      // Verify host owns the event
      if (!hostOwnsEvent(host, event)) {
        return res
          .status(403)
          .json({ message: "Not authorized to edit this parking pass listing" });
      }

      // Don't allow editing past events
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        return res
          .status(400)
          .json({ message: "Cannot edit past parking pass listings" });
      }

      const { startTime, endTime, maxTrucks, hardCapEnabled } = req.body;

      // Build updates object (only include provided fields)
      const updates: any = {};
      if (startTime !== undefined) updates.startTime = startTime;
      if (endTime !== undefined) updates.endTime = endTime;
      let shouldSyncSpotCount = false;
      if (maxTrucks !== undefined) {
        const spotCount = Number(maxTrucks);
        if (!Number.isFinite(spotCount) || spotCount < 1) {
          return res
            .status(400)
            .json({ message: "Number of spots must be at least 1" });
        }
        updates.maxTrucks = spotCount;
        if (event.requiresPayment) {
          shouldSyncSpotCount = true;
        }
      }
      if (hardCapEnabled !== undefined) updates.hardCapEnabled = hardCapEnabled;

      // Validation: End time > Start time (if both provided)
      const finalStartTime = updates.startTime || event.startTime;
      const finalEndTime = updates.endTime || event.endTime;

      const [startHour, startMinute] = finalStartTime.split(":").map(Number);
      const [endHour, endMinute] = finalEndTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (endMinutes <= startMinutes) {
        return res
          .status(400)
          .json({ message: "End time must be after start time" });
      }

      const invalidSlotLabels: string[] = [];
      if (
        (event.breakfastPriceCents ?? 0) > 0 &&
        !isSlotWithinHours("breakfast", finalStartTime, finalEndTime)
      ) {
        invalidSlotLabels.push("Breakfast");
      }
      if (
        (event.lunchPriceCents ?? 0) > 0 &&
        !isSlotWithinHours("lunch", finalStartTime, finalEndTime)
      ) {
        invalidSlotLabels.push("Lunch");
      }
      if (
        (event.dinnerPriceCents ?? 0) > 0 &&
        !isSlotWithinHours("dinner", finalStartTime, finalEndTime)
      ) {
        invalidSlotLabels.push("Dinner");
      }
      if (invalidSlotLabels.length > 0) {
        return res.status(400).json({
          message:
            "Parking hours must fully cover priced slots: " +
            invalidSlotLabels.join(", "),
        });
      }

      // Validation: Capacity >= 1
      const finalMaxTrucks =
        updates.maxTrucks !== undefined ? updates.maxTrucks : event.maxTrucks;
      if (finalMaxTrucks < 1) {
        return res
          .status(400)
          .json({ message: "Max trucks must be at least 1" });
      }

      // Store before state for telemetry
      const beforeState = {
        startTime: event.startTime,
        endTime: event.endTime,
        maxTrucks: event.maxTrucks,
        hardCapEnabled: event.hardCapEnabled,
      };

      // Apply updates
      updates.updatedAt = new Date();
      const [updatedEvent] = await db
        .update(events)
        .set(updates)
        .where(eq(events.id, eventId))
        .returning();

      if (shouldSyncSpotCount && updates.maxTrucks !== undefined) {
        await db
          .update(hosts)
          .set({ spotCount: updates.maxTrucks, updatedAt: new Date() })
          .where(eq(hosts.id, host.id));

        await db
          .update(events)
          .set({ maxTrucks: updates.maxTrucks, updatedAt: new Date() })
          .where(
            and(
              eq(events.hostId, host.id),
              eq(events.requiresPayment, true),
              gte(events.date, today),
            ),
          );
      }

      // Telemetry
      await storage.createTelemetryEvent({
        eventName: "occurrence_overridden",
        userId: req.user.id,
        properties: {
          eventId,
          seriesId: event.seriesId,
          before: beforeState,
          after: {
            startTime: updatedEvent.startTime,
            endTime: updatedEvent.endTime,
            maxTrucks: updatedEvent.maxTrucks,
            hardCapEnabled: updatedEvent.hardCapEnabled,
          },
          changedFields: Object.keys(updates).filter((k) => k !== "updatedAt"),
        },
      });

      res.json(updatedEvent);
    } catch (error: any) {
      console.error("Error updating parking pass listing:", error);
      res.status(500).json({ message: "Failed to update parking pass listing" });
    }
  };

  app.patch(
    "/api/hosts/parking-pass/:passId",
    isAuthenticated,
    updateHostParkingPassListing,
  );
  app.patch(
    "/api/hosts/events/:eventId",
    isAuthenticated,
    updateHostParkingPassListing,
  );

  app.patch(
    "/api/hosts/interests/:interestId/status",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { interestId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        if (!["accepted", "declined"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        // Verify host owns the event associated with this interest
        const { interest, event, host } = await getInterestEventAndHostForUser(
          interestId,
          userId
        );

        if (!interest) {
          return res.status(404).json({ message: "Interest not found" });
        }

        if (!event) {
          return res
            .status(404)
            .json({ message: "Parking pass listing not found" });
        }

        if (!hostOwnsEvent(host, event)) {
          return res.status(403).json({
            message: "Not authorized to manage this parking pass listing",
          });
        }

        // Idempotency Check: If already in desired status, return success
        if (interest.status === status) {
          return res.json(interest);
        }

        // CAPACITY GUARD v2.2
        // If hard cap is enabled, block acceptance if full
        if (status === "accepted" && event.hardCapEnabled) {
          const currentInterests = await storage.getEventInterestsByEventId(
            event.id
          );
          // Note: interest.status is definitely NOT 'accepted' here due to idempotency check above
          const acceptedCount = computeAcceptedCount(currentInterests);

          if (
            shouldBlockAcceptance({
              hardCapEnabled: event.hardCapEnabled,
              acceptedCount,
              maxTrucks: event.maxTrucks,
            })
          ) {
            // Telemetry: Blocked Attempt
            await storage.createTelemetryEvent({
              eventName: "interest_accept_blocked",
              userId: req.user.id,
              properties: {
                eventId: event.id,
                truckId: interest.truckId,
                reason: "capacity_guard_limit_reached",
                maxTrucks: event.maxTrucks,
                acceptedCount,
              },
            });

            const capacityError = buildCapacityFullError();

            return res.status(400).json(capacityError);
          }
        }

        const updatedInterest = await storage.updateEventInterestStatus(
          interestId,
          status
        );

        // Send notification to truck (fire and forget)
        (async () => {
          try {
            // Telemetry: Interest Status Changed
            const allInterests = await storage.getEventInterestsByEventId(
              event.id
            );
            const acceptedCount = computeAcceptedCount(allInterests);
            const isOverCap = acceptedCount >= event.maxTrucks;

            await storage.createTelemetryEvent({
              eventName:
                status === "accepted"
                  ? "interest_accepted"
                  : "interest_declined",
              userId: req.user.id,
              properties: {
                eventId: event.id,
                truckId: interest.truckId,
                fillRate: computeFillRate({
                  acceptedCount,
                  maxTrucks: event.maxTrucks,
                }),
                acceptedCount,
                maxTrucks: event.maxTrucks,
                isOverCap,
              },
            });

            const truck = await storage.getRestaurant(interest.truckId);
            if (truck) {
              // Get truck owner's email
              // Note: getRestaurant doesn't return ownerId directly in all schemas, but let's check schema.ts
              // restaurants table has ownerId.
              const owner = await storage.getUser(truck.ownerId);
              if (owner && owner.email) {
                await emailService.sendInterestStatusUpdate(
                  owner.email,
                  truck.name,
                  host!.businessName,
                  new Date(event.date).toLocaleDateString(),
                  status as "accepted" | "declined"
                );
              }
            }
          } catch (err) {
            console.error("Failed to send status update notification:", err);
          }
        })();

        res.json(updatedInterest);
      } catch (error: any) {
        console.error("Error updating interest status:", error);
        res.status(500).json({ message: "Failed to update status" });
      }
    }
  );

  const listHostParkingPassInterests = async (req: any, res: any) => {
    try {
      const eventId = req.params.eventId ?? req.params.passId;
      if (!eventId) {
        return res.status(400).json({ message: "Parking pass ID required" });
      }
      const userId = req.user.id;

      // Verify host owns this parking pass listing (indirectly via host profile)
      const host = await getHostByUserId(userId);
      if (!host) {
        return res.status(403).json({ message: "Not a host" });
      }

      const { event } = await getEventAndHostForUser(eventId, userId);
      if (!event || !hostOwnsEvent(host, event)) {
        return res
          .status(404)
          .json({ message: "Parking pass listing not found" });
      }

      const interests = await storage.getEventInterestsByEventId(eventId);
      res.json(interests);
    } catch (error: any) {
      console.error("Error fetching parking pass interests:", error);
      res.status(500).json({ message: "Failed to fetch interests" });
    }
  };

  app.get(
    "/api/hosts/parking-pass/:passId/interests",
    isAuthenticated,
    listHostParkingPassInterests,
  );
  app.get(
    "/api/hosts/events/:eventId/interests",
    isAuthenticated,
    listHostParkingPassInterests,
  );

  // =====================================================================
  // STRIPE CONNECT & PAYMENT ENDPOINTS
  // =====================================================================

  // Stripe Connect Onboarding: Host enables payments
  app.post(
    "/api/hosts/stripe/onboard",
    isAuthenticated,
    async (req: any, res) => {
      try {
        if (!stripe) {
          return res.status(500).json({ message: "Stripe not configured" });
        }

        const userId = req.user.id;
        const host = await getHostByUserId(userId);
        if (!host) {
          return res.status(404).json({ message: "Host profile not found" });
        }

        let accountId = host.stripeConnectAccountId;

        // Create Stripe Connect account if not exists
        if (!accountId) {
          const account = await stripe.accounts.create({
            type: "express",
            country: "US",
            email: req.user.email,
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            business_type: "individual",
            metadata: {
              hostId: host.id,
              businessName: host.businessName,
            },
          });

          accountId = account.id;

          // Save to database
          await db
            .update(hosts)
            .set({ stripeConnectAccountId: accountId })
            .where(eq(hosts.id, host.id));
        }

        // Create onboarding link
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: `${baseUrl}/host/dashboard?setup=refresh`,
          return_url: `${baseUrl}/host/dashboard?setup=complete`,
          type: "account_onboarding",
        });

        res.json({ onboardingUrl: accountLink.url });
      } catch (error: any) {
        console.error("Error creating Stripe Connect account:", error);
        res
          .status(500)
          .json({ message: "Failed to initiate Stripe onboarding" });
      }
    }
  );

  // Check Stripe Connect account status
  app.get(
    "/api/hosts/stripe/status",
    isAuthenticated,
    async (req: any, res) => {
      try {
        if (!stripe) {
          return res.status(500).json({ message: "Stripe not configured" });
        }

        const userId = req.user.id;
        const host = await getHostByUserId(userId);
        if (!host) {
          return res.status(404).json({ message: "Host profile not found" });
        }

        if (!host.stripeConnectAccountId) {
          return res.json({
            connected: false,
            chargesEnabled: false,
            payoutsEnabled: false,
          });
        }

        const account = await stripe.accounts.retrieve(
          host.stripeConnectAccountId
        );

        // Update database with current status
        await db
          .update(hosts)
          .set({
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
            stripeOnboardingCompleted: account.details_submitted,
            stripeConnectStatus: account.charges_enabled ? "active" : "pending",
          })
          .where(eq(hosts.id, host.id));

        res.json({
          connected: true,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          onboardingCompleted: account.details_submitted,
        });
      } catch (error: any) {
        console.error("Error checking Stripe status:", error);
        res.status(500).json({ message: "Failed to check Stripe status" });
      }
    }
  );

  // Book a Parking Pass (creates payment intent with $10/day platform fee auto-added)
  app.post(
    "/api/parking-pass/:passId/book",
    isAuthenticated,
    async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const { passId } = req.params;
      const { truckId, slotType, slotTypes, applyCreditsCents } = req.body;
      const userId = req.user.id;

      if (!truckId) {
        return res.status(400).json({ message: "Truck ID required" });
      }
      const allowedSlotTypes = new Set(PARKING_PASS_SLOT_TYPES);
      const requestedSlots = Array.isArray(slotTypes)
        ? slotTypes
        : slotType
          ? [slotType]
          : [];
      const normalizedSlots = Array.from(
        new Set(
          requestedSlots
            .filter((value: any) => typeof value === "string")
            .map((value: string) => value.trim())
            .filter((value: string) => value.length > 0),
        ),
      );
      if (normalizedSlots.length === 0) {
        return res.status(400).json({ message: "Valid slotTypes required" });
      }
      if (normalizedSlots.some((value) => !allowedSlotTypes.has(value))) {
        return res.status(400).json({ message: "Valid slotTypes required" });
      }

      const durationSlots = normalizedSlots.filter((value) =>
        ["daily", "weekly", "monthly"].includes(value),
      );
      const mealSlots = normalizedSlots.filter((value) =>
        ["breakfast", "lunch", "dinner"].includes(value),
      );
      if (durationSlots.length > 0 && mealSlots.length > 0) {
        return res.status(400).json({
          message: "Daily, weekly, and monthly bookings cannot be combined with meal slots.",
        });
      }
      if (durationSlots.length > 1) {
        return res.status(400).json({
          message: "Select only one of daily, weekly, or monthly.",
        });
      }

      const selectedSlotTypes = (durationSlots.length > 0
        ? durationSlots
        : mealSlots) as (typeof PARKING_PASS_SLOT_TYPES)[number][];

      // Verify truck ownership
      const truck = await storage.getRestaurant(truckId);
      if (!truck || truck.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      if (!truck.isFoodTruck) {
        return res.status(403).json({
          message: "Parking Pass bookings are only available for food trucks.",
        });
      }
      if (
        !truck.isVerified &&
        !["admin", "super_admin", "staff"].includes(req.user?.userType)
      ) {
        return res.status(403).json({
          message:
            "Your truck must be verified before booking parking pass slots.",
        });
      }
      if (
        req.user?.userType &&
        !["food_truck", "admin", "super_admin", "staff"].includes(
          req.user.userType,
        )
      ) {
        return res.status(403).json({
          message: "Only food truck accounts can book Parking Pass slots.",
        });
      }

      // Get event
      const event = await storage.getEvent(passId);
      if (!event) {
        return res.status(404).json({ message: "Parking pass not found" });
      }

      if (event.status !== "open") {
        return res
          .status(400)
          .json({ message: "Parking pass not available for booking" });
      }

      if (!event.requiresPayment) {
        return res.status(400).json({
          message:
            "Payments are only available for Parking Pass listings, not events.",
        });
      }

      // Get host
      const host = await storage.getHost(event.hostId);
      if (!host) {
        return res.status(404).json({ message: "Host not found" });
      }

      // Verify host has Stripe Connect setup
      if (!host.stripeConnectAccountId || !host.stripeChargesEnabled) {
        return res.status(400).json({
          message:
            "Host payment setup incomplete. Contact host to enable payments.",
        });
      }

      // Check for existing booking
      const existingBooking = await db
        .select()
        .from(eventBookings)
        .where(eq(eventBookings.eventId, passId))
        .where(eq(eventBookings.truckId, truckId))
        .where(inArray(eventBookings.status, ["confirmed"]))
        .limit(1);

      if (existingBooking.length > 0) {
        return res.status(400).json({
          message: "You already have a booking for this parking pass",
          bookingId: existingBooking[0].id,
        });
      }

      const bookingDays = durationSlots.includes("monthly")
        ? 30
        : durationSlots.includes("weekly")
          ? 7
          : 1;
      const eventDate = new Date(event.date);
      const rangeStart = new Date(eventDate);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + bookingDays);

      const bookingEvents = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.hostId, host.id),
            eq(events.requiresPayment, true),
            gte(events.date, rangeStart),
            lt(events.date, rangeEnd),
          ),
        )
        .orderBy(asc(events.date));

      const eventsByDate = new Map<string, (typeof bookingEvents)[number]>();
      for (const row of bookingEvents) {
        const dateKey = new Date(row.date).toISOString().split("T")[0];
        eventsByDate.set(dateKey, row);
      }

      const expectedDateKeys: string[] = [];
      for (let offset = 0; offset < bookingDays; offset += 1) {
        const cursor = new Date(rangeStart);
        cursor.setDate(cursor.getDate() + offset);
        expectedDateKeys.push(cursor.toISOString().split("T")[0]);
      }

      const missingDates = expectedDateKeys.filter(
        (dateKey) => !eventsByDate.has(dateKey),
      );
      if (missingDates.length > 0) {
        return res.status(400).json({
          message:
            "This parking pass does not have availability for the full booking range.",
        });
      }

      for (const dateKey of expectedDateKeys) {
        const row = eventsByDate.get(dateKey);
        if (!row) continue;
        if (row.status !== "open") {
          return res.status(400).json({
            message: "This parking pass is not available for that date.",
          });
        }
        for (const slotType of selectedSlotTypes) {
          if (!isSlotWithinHours(slotType, row.startTime, row.endTime)) {
            return res.status(400).json({
              message:
                "Selected slots do not fit within host parking hours.",
            });
          }
        }
      }

      const eventIds = bookingEvents.map((row) => row.id);
      const bookingCounts =
        eventIds.length > 0
          ? await db
              .select({
                eventId: eventBookings.eventId,
                count: sql<number>`count(*)`,
              })
              .from(eventBookings)
              .where(inArray(eventBookings.eventId, eventIds))
              .where(inArray(eventBookings.status, ["confirmed"]))
              .groupBy(eventBookings.eventId)
          : [];

      const countsByEvent = new Map<string, number>();
      for (const row of bookingCounts) {
        countsByEvent.set(row.eventId, Number(row.count || 0));
      }

      for (const dateKey of expectedDateKeys) {
        const row = eventsByDate.get(dateKey);
        if (!row) continue;
        const count = countsByEvent.get(row.id) ?? 0;
        if (count >= (row.maxTrucks ?? 1)) {
          return res.status(400).json({
            message: "This parking pass is fully booked.",
          });
        }
      }

      const existingBookings = await db
        .select({
          slotType: eventBookings.slotType,
          eventDate: events.date,
          eventStartTime: events.startTime,
          eventEndTime: events.endTime,
        })
        .from(eventBookings)
        .innerJoin(events, eq(eventBookings.eventId, events.id))
        .where(
          and(
            eq(eventBookings.truckId, truckId),
            inArray(eventBookings.status, ["confirmed"]),
            gte(events.date, rangeStart),
            lt(events.date, rangeEnd),
          ),
        );

      const requestedWindowsByDate = new Map<string, Array<{ start: number; end: number }>>();
      for (const dateKey of expectedDateKeys) {
        const row = eventsByDate.get(dateKey);
        if (!row) continue;
        const windows: Array<{ start: number; end: number }> = [];
        for (const slotType of selectedSlotTypes) {
          const window = getSlotWindowMinutes(
            slotType,
            row.startTime,
            row.endTime,
          );
          if (window) {
            windows.push({
              start: window.startMinutes,
              end: window.endMinutes,
            });
          }
        }
        if (windows.length > 0) {
          requestedWindowsByDate.set(dateKey, windows);
        }
      }

      for (const booking of existingBookings) {
        const dateKey = new Date(booking.eventDate).toISOString().split("T")[0];
        const requested = requestedWindowsByDate.get(dateKey);
        if (!requested || requested.length === 0) continue;
        const slotParts = (booking.slotType || "")
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter((value) => value.length > 0);
        const normalizedExisting = slotParts.filter((value) =>
          allowedSlotTypes.has(value),
        );
        const existingSlots =
          normalizedExisting.length > 0
            ? normalizedExisting
            : ["daily"];
        for (const slot of existingSlots) {
          const window = getSlotWindowMinutes(
            slot as (typeof PARKING_PASS_SLOT_TYPES)[number],
            booking.eventStartTime,
            booking.eventEndTime,
          );
          if (!window) continue;
          for (const requestedWindow of requested) {
            if (
              slotWindowsOverlap(
                requestedWindow.start,
                requestedWindow.end,
                window.startMinutes,
                window.endMinutes,
              )
            ) {
              return res.status(400).json({
                message:
                  "You already have a booking that overlaps this time.",
              });
            }
          }
        }
      }

      // Calculate pricing: Host price + $10 platform fee
      const slotPriceMap: Record<string, number | null | undefined> = {
        breakfast: event.breakfastPriceCents,
        lunch: event.lunchPriceCents,
        dinner: event.dinnerPriceCents,
        daily: event.dailyPriceCents,
        weekly: event.weeklyPriceCents,
        monthly: event.monthlyPriceCents,
      };
      const selectedPrices = selectedSlotTypes.map((slot) => ({
        slot,
        price: slotPriceMap[slot] || 0,
      }));
      if (selectedPrices.some((item) => item.price <= 0)) {
        return res.status(400).json({
          message: "One or more selected slots are not available.",
        });
      }
      const hostPriceCents = selectedPrices.reduce(
        (sum, item) => sum + item.price,
        0,
      );
      const platformFeeCents = 1000 * bookingDays; // $10/day, no cap

      let creditAppliedCents = 0;
      const requestedCreditCents = Number(applyCreditsCents || 0);
      if (requestedCreditCents > 0) {
        const { getUserCreditBalance } = await import("../creditService");
        const creditBalance = await getUserCreditBalance(userId);
        const availableCents = Math.max(
          0,
          Math.floor(creditBalance * 100),
        );
        creditAppliedCents = Math.min(
          requestedCreditCents,
          platformFeeCents,
          availableCents,
        );
      }

      const adjustedPlatformFeeCents = Math.max(
        platformFeeCents - creditAppliedCents,
        0,
      );
      const totalCents = hostPriceCents + adjustedPlatformFeeCents;

      // Create Stripe PaymentIntent as a direct charge on the host's Connect account.
      // Processing fees will be deducted from the host; the platform receives the $10 application fee.
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: totalCents,
          currency: "usd",
          application_fee_amount: adjustedPlatformFeeCents, // MealScout platform fee
          metadata: {
            passId: event.id,
            hostId: host.id,
            truckId,
            slotTypes: selectedSlotTypes.join(","),
            bookingDays: bookingDays.toString(),
            bookingStartDate: rangeStart.toISOString().split("T")[0],
            hostPriceCents: hostPriceCents.toString(),
            platformFeeCents: adjustedPlatformFeeCents.toString(),
            totalCents: totalCents.toString(),
            creditAppliedCents: creditAppliedCents.toString(),
          },
        },
        {
          stripeAccount: host.stripeConnectAccountId, // Direct charge: fees come from host, app fee to platform
        }
      );

      res.json({
        clientSecret: paymentIntent.client_secret,
        totalCents,
        breakdown: {
          hostPrice: hostPriceCents,
          platformFee: adjustedPlatformFeeCents,
          creditsApplied: creditAppliedCents,
        },
      });
    } catch (error: any) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });
}
