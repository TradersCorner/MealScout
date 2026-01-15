import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { emailService } from "../emailService";
import { db } from "../db";
import { insertHostSchema, insertEventSchema, events } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../unifiedAuth";
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

export function registerHostRoutes(app: Express) {
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

  app.post("/api/hosts/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const host = await getHostByUserId(userId);
      if (!host) {
        return res.status(404).json({ message: "Host profile not found" });
      }

      const parsed = insertEventSchema.parse({
        ...req.body,
        hostId: host.id,
      });

      // Validation: Future dates only
      const eventDate = new Date(parsed.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        return res
          .status(400)
          .json({ message: "Event date must be in the future" });
      }

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

      // Validation: Capacity >= 1
      if (parsed.maxTrucks !== undefined && parsed.maxTrucks < 1) {
        return res
          .status(400)
          .json({ message: "Max trucks must be at least 1" });
      }

      const event = await storage.createEvent(parsed);
      res.status(201).json(event);
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
      const host = await getHostByUserId(userId);
      if (!host) {
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
        if (maxTrucks !== undefined) updates.maxTrucks = maxTrucks;
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
}
