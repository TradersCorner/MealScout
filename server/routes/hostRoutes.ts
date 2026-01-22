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
import { and, asc, eq, gte, inArray, isNotNull, lt } from "drizzle-orm";
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

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function registerHostRoutes(app: Express) {
  const getActiveParkingPassSeriesId = async (hostId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [row] = await db
      .select({ seriesId: events.seriesId })
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
      .limit(1);
    return row?.seriesId ?? null;
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

      const host = await storage.createHost(parsed);

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

  app.get("/api/hosts/:hostId", isAuthenticated, async (req: any, res) => {
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
  });

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
      });
      const parsed = updateSchema.parse(req.body || {});

      const [updated] = await db
        .update(hosts)
        .set({
          businessName: parsed.businessName ?? host.businessName,
          address: parsed.address ?? host.address,
          city: parsed.city ?? host.city,
          state: parsed.state ?? host.state,
          locationType: parsed.locationType ?? host.locationType,
          contactPhone: parsed.contactPhone ?? host.contactPhone,
          notes: parsed.notes ?? host.notes,
          amenities: parsed.amenities ?? host.amenities ?? null,
          spotCount: parsed.spotCount ?? host.spotCount ?? 1,
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
          return res
            .status(404)
            .json({ message: "No active parking pass found." });
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

  app.post("/api/hosts/events", isAuthenticated, async (req: any, res) => {
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
          message: "Hosts can only create paid Parking Pass listings.",
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

      const slotSum = breakfastPriceCents + lunchPriceCents + dinnerPriceCents;
      const dailyPriceCents = slotSum + 1000;
      const weeklyPriceCents = slotSum * 7 + 1000;

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

      // Validation: Spots >= 1
      if (parsed.maxTrucks !== undefined && parsed.maxTrucks < 1) {
        return res
          .status(400)
          .json({ message: "Number of spots must be at least 1" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingPaidEvents = await db
        .select({ id: events.id })
        .from(events)
        .where(
          and(
            eq(events.hostId, host.id),
            gte(events.date, today),
            eq(events.requiresPayment, true),
          ),
        );

      if (existingPaidEvents.length > 0) {
        return res.status(409).json({
          message:
            "You already have a parking pass for this address. Edit your existing listing.",
        });
      }

      const horizon = new Date(today);
      horizon.setDate(horizon.getDate() + 30);

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
          (row) => new Date(row.date).toISOString().split("T")[0],
        ),
      );

      const existingKeys = new Set(
        existingEvents.map((item) => {
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
      console.error("Error creating event:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid event data", errors: error.errors });
      }
      res
        .status(400)
        .json({ message: error.message || "Failed to create event" });
    }
  });

  app.get("/api/hosts/events", isAuthenticated, async (req: any, res) => {
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
      res.json(eventsByHost);
    } catch (error: any) {
      console.error("Error fetching host events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // PATCH: Override a single event occurrence (time window, capacity, hard cap)
  app.patch(
    "/api/hosts/events/:eventId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { eventId } = req.params;
        const userId = req.user.id;

        // Verify event exists and host owns it
        const { event, host } = await getEventAndHostForUser(eventId, userId);

        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        // Verify host owns the event
        if (!hostOwnsEvent(host, event)) {
          return res
            .status(403)
            .json({ message: "Not authorized to edit this event" });
        }

        // Don't allow editing past events
        const eventDate = new Date(event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (eventDate < today) {
          return res.status(400).json({ message: "Cannot edit past events" });
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
        if (hardCapEnabled !== undefined)
          updates.hardCapEnabled = hardCapEnabled;

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
            changedFields: Object.keys(updates).filter(
              (k) => k !== "updatedAt"
            ),
          },
        });

        res.json(updatedEvent);
      } catch (error: any) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Failed to update event" });
      }
    }
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
          return res.status(404).json({ message: "Event not found" });
        }

        if (!hostOwnsEvent(host, event)) {
          return res
            .status(403)
            .json({ message: "Not authorized to manage this event" });
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

  app.get(
    "/api/hosts/events/:eventId/interests",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { eventId } = req.params;
        const userId = req.user.id;

        // Verify host owns this event (indirectly via host profile)
        const host = await getHostByUserId(userId);
        if (!host) {
          return res.status(403).json({ message: "Not a host" });
        }

        const { event } = await getEventAndHostForUser(eventId, userId);
        if (!event || !hostOwnsEvent(host, event)) {
          return res.status(404).json({ message: "Event not found" });
        }

        const interests = await storage.getEventInterestsByEventId(eventId);
        res.json(interests);
      } catch (error: any) {
        console.error("Error fetching event interests:", error);
        res.status(500).json({ message: "Failed to fetch interests" });
      }
    }
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

  // Book a Parking Pass (creates payment intent with $10 platform fee auto-added)
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
      const allowedSlotTypes = new Set([
        "breakfast",
        "lunch",
        "dinner",
        "daily",
        "weekly",
      ]);
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
      if (
        normalizedSlots.length === 0 ||
        normalizedSlots.some((value) => !allowedSlotTypes.has(value))
      ) {
        return res.status(400).json({ message: "Valid slotTypes required" });
      }

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

      const currentBookings = await db
        .select({ id: eventBookings.id })
        .from(eventBookings)
        .where(eq(eventBookings.eventId, passId))
        .where(inArray(eventBookings.status, ["confirmed"]));

      if (currentBookings.length >= event.maxTrucks) {
        return res.status(400).json({
          message: "This parking pass is fully booked.",
        });
      }

      const eventDate = new Date(event.date);
      const dayStart = new Date(eventDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const existingDayBooking = await db
        .select({ id: eventBookings.id })
        .from(eventBookings)
        .innerJoin(events, eq(eventBookings.eventId, events.id))
        .where(
          and(
            eq(eventBookings.truckId, truckId),
            eq(eventBookings.hostId, event.hostId),
            gte(events.date, dayStart),
            lt(events.date, dayEnd),
            inArray(eventBookings.status, ["confirmed"])
          )
        )
        .limit(1);

      if (existingDayBooking.length > 0) {
        return res.status(400).json({
          message:
            "You already have a parking pass for this host on that date.",
          bookingId: existingDayBooking[0].id,
        });
      }

      // Calculate pricing: Host price + $10 platform fee
      const slotPriceMap: Record<string, number | null | undefined> = {
        breakfast: event.breakfastPriceCents,
        lunch: event.lunchPriceCents,
        dinner: event.dinnerPriceCents,
        daily: event.dailyPriceCents,
        weekly: event.weeklyPriceCents,
      };
      const selectedPrices = normalizedSlots.map((slot) => ({
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
      const bookingDays = normalizedSlots.includes("weekly") ? 7 : 1;
      const platformFeeCents = 1000 * bookingDays; // $10 per day per host

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
          application_fee_amount: platformFeeCents, // $10 to MealScout (platform)
          metadata: {
            passId: event.id,
            hostId: host.id,
            truckId,
            slotTypes: normalizedSlots.join(","),
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
