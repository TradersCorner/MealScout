import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { emailService } from "../emailService";
import { db } from "../db";
import {
  isAuthenticated,
  isRestaurantOwner,
} from "../unifiedAuth";
import {
  eventBookings,
  insertEventInterestSchema,
  restaurants,
  CLAIM_STATUS,
  CLAIM_TYPES,
} from "@shared/schema";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { forwardGeocode } from "../utils/geocoding";
import { listParkingPassOccurrences } from "../services/parkingPassVirtual";

export function registerEventRoutes(app: Express) {
  // Get all upcoming events (public)
  app.get("/api/events/upcoming", async (req: any, res) => {
    try {
      const upcomingEvents = await storage.getAllUpcomingEvents();
      res.json(upcomingEvents.filter((event) => !event.requiresPayment));
    } catch (error: any) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Truck Discovery (authenticated)
  app.get("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      // Optional: Filter by location (lat/lng/radius) in the future
      const upcomingEvents = await storage.getAllUpcomingEvents();
      res.json(upcomingEvents.filter((event) => !event.requiresPayment));
    } catch (error: any) {
      console.error("Error fetching all events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Parking Pass listings (truck-paid slots only)
  app.get("/api/parking-pass", async (req: any, res) => {
    try {
      const { occurrences } = await listParkingPassOccurrences({ horizonDays: 30 });

      const hostCanAcceptPayments = (event: any) =>
        Boolean(
          event?.host?.stripeConnectAccountId && event?.host?.stripeChargesEnabled,
        );

      // NOTE: In the Airbnb-style model, occurrences are generated virtually and only persisted when
      // booked/overridden. While we transition, we also include legacy materialized Parking Pass events.
      const virtualEvents = occurrences.map((event: any) => ({
          ...event,
          paymentsEnabled: hostCanAcceptPayments(event),
        }));

      const legacyUpcoming = await storage.getAllUpcomingEvents();
      const legacyEvents = legacyUpcoming
        .filter(
          (event: any) =>
            event?.eventType === "parking_pass",
        )
        .map((event: any) => ({
          ...event,
          paymentsEnabled: hostCanAcceptPayments(event),
        }));

      const dedupedById = new Map<string, any>();
      for (const item of [...virtualEvents, ...legacyEvents]) {
        dedupedById.set(item.id, item);
      }
      const parkingEvents = Array.from(dedupedById.values());

      // Best-effort: ensure host coordinates exist so map pins can render.
      // We intentionally cap work per request to avoid hammering geocoding providers.
      const MAX_GEOCODE_PER_REQUEST = 12;
      const seenHostIds = new Set<string>();
      let geocodeCount = 0;

      const candidateHosts: any[] = [];
      for (const event of parkingEvents) {
        const host: any = (event as any)?.host;
        const hostId = String(host?.id || "").trim();
        if (!hostId) continue;
        if (seenHostIds.has(hostId)) continue;
        seenHostIds.add(hostId);

        const lat =
          host.latitude !== null && host.latitude !== undefined
            ? Number(host.latitude)
            : NaN;
        const lng =
          host.longitude !== null && host.longitude !== undefined
            ? Number(host.longitude)
            : NaN;
        const hasCoords =
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          Math.abs(lat) <= 90 &&
          Math.abs(lng) <= 180;
        if (hasCoords) continue;

        candidateHosts.push(host);
      }

      for (
        let index = 0;
        index < candidateHosts.length && geocodeCount < MAX_GEOCODE_PER_REQUEST;
        index += 1
      ) {
        const host: any = candidateHosts[index];
        const addressParts = [host.address, host.city, host.state, "USA"]
          .map((value: any) => String(value || "").trim())
          .filter((value: string) => value.length > 0);
        if (addressParts.length === 0) continue;

        const geocodeAddress = addressParts.join(", ");
        const coords = await forwardGeocode(geocodeAddress).catch(() => null);
        if (!coords) continue;

        geocodeCount += 1;

        // Persist and patch the in-memory host so this response includes the coords.
        try {
          await storage.updateHostCoordinates(host.id, coords.lat, coords.lng);
        } catch {
          // Ignore persistence errors; response can still use computed coords.
        }
        host.latitude = coords.lat.toString();
        host.longitude = coords.lng.toString();
      }
      const eventIds = parkingEvents.map((event) => event.id);

      const bookingRows =
        eventIds.length > 0
          ? await db
              .select({
                eventId: eventBookings.eventId,
                spotNumber: eventBookings.spotNumber,
                bookingConfirmedAt: eventBookings.bookingConfirmedAt,
                slotType: eventBookings.slotType,
                truckId: eventBookings.truckId,
                truckName: restaurants.name,
              })
              .from(eventBookings)
              .innerJoin(
                restaurants,
                eq(eventBookings.truckId, restaurants.id),
              )
              .where(inArray(eventBookings.eventId, eventIds))
              .where(inArray(eventBookings.status, ["confirmed"]))
              .orderBy(asc(eventBookings.bookingConfirmedAt))
          : [];

      const pendingCounts =
        eventIds.length > 0
          ? await db
              .select({
                eventId: eventBookings.eventId,
                count: sql<number>`count(*)`,
              })
              .from(eventBookings)
              .where(inArray(eventBookings.eventId, eventIds))
              .where(inArray(eventBookings.status, ["pending"]))
              .groupBy(eventBookings.eventId)
          : [];

      const pendingByEvent = new Map<string, number>();
      for (const row of pendingCounts) {
        pendingByEvent.set(row.eventId, Number(row.count || 0));
      }

      const bookingsByEvent = new Map<string, typeof bookingRows>();
      for (const row of bookingRows) {
        const list = bookingsByEvent.get(row.eventId) ?? [];
        list.push(row);
        bookingsByEvent.set(row.eventId, list);
      }

      const enhancedEvents = parkingEvents.map((event) => {
        const rows = bookingsByEvent.get(event.id) ?? [];
        const pending = pendingByEvent.get(event.id) ?? 0;
        const maxSpots = event.maxTrucks ?? 1;

        const usedSpotNumbers = new Set<number>();
        for (const row of rows) {
          if (row.spotNumber && row.spotNumber > 0) {
            usedSpotNumbers.add(row.spotNumber);
          }
        }

        let nextSpot = 1;
        for (const row of rows) {
          if (row.spotNumber && row.spotNumber > 0) {
            continue;
          }
          while (usedSpotNumbers.has(nextSpot) && nextSpot <= maxSpots) {
            nextSpot += 1;
          }
          if (nextSpot <= maxSpots) {
            usedSpotNumbers.add(nextSpot);
            nextSpot += 1;
          }
        }

        const availableSpotNumbers: number[] = [];
        for (let spot = 1; spot <= maxSpots; spot += 1) {
          if (!usedSpotNumbers.has(spot)) {
            availableSpotNumbers.push(spot);
          }
        }

        const confirmedCount = rows.length;
        const reservedCount = Math.min(confirmedCount + pending, maxSpots);
        const availableCount = Math.max(0, maxSpots - reservedCount);
        const trimmedAvailable = availableSpotNumbers.slice(0, availableCount);

        return {
          ...event,
          spotCount: maxSpots,
          bookedSpots: reservedCount,
          availableSpotNumbers: trimmedAvailable,
          bookings: rows.map((row: (typeof rows)[number]) => ({
            truckId: row.truckId,
            truckName: row.truckName,
            slotType: row.slotType,
            spotNumber: row.spotNumber,
            bookingConfirmedAt: row.bookingConfirmedAt,
          })),
        };
      });

      res.json(enhancedEvents);
    } catch (error: any) {
      console.error("Error fetching parking pass listings:", error);
      res.status(500).json({ message: "Failed to fetch parking pass listings" });
    }
  });

  app.post(
    "/api/events/:eventId/interests",
    isRestaurantOwner,
    async (req: any, res) => {
      try {
        const { eventId } = req.params;
        const { restaurantId, message } = req.body;

        if (!restaurantId) {
          return res.status(400).json({ message: "Restaurant ID is required" });
        }

        // Verify ownership
        const ownsRestaurant = await storage.verifyRestaurantOwnership(
          restaurantId,
          req.user.id
        );
        if (!ownsRestaurant) {
          return res
            .status(403)
            .json({
              message: "You can only express interest for restaurants you own",
            });
        }

        // Check event expiry
        const event = await storage.getEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        if (event.requiresPayment) {
          return res.status(400).json({
            message:
              "This listing uses Parking Pass. Events do not accept payments.",
          });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(event.date) < today) {
          return res
            .status(400)
            .json({ message: "Cannot express interest in past events" });
        }

        // Check idempotency
        const existing = await storage.getEventInterestByTruckId(
          eventId,
          restaurantId
        );
        if (existing) {
          return res
            .status(200)
            .json({
              message: "Interest already expressed",
              interest: existing,
            });
        }

        const parsed = insertEventInterestSchema.parse({
          eventId,
          truckId: restaurantId,
          message,
        });

        const interest = await storage.createEventInterest(parsed);

        // Send notification to host (fire and forget)
        (async () => {
          try {
            const event = await storage.getEvent(eventId);
            if (event) {
              // Telemetry: Interest Created
              await storage.createTelemetryEvent({
                eventName: "interest_created",
                userId: req.user.id,
                properties: {
                  eventId,
                  truckId: restaurantId,
                  eventDate: event.date,
                },
              });

              const host = await storage.getHost(event.hostId);
              const truck = await storage.getRestaurant(restaurantId);

              if (host && truck) {
                // Get host's user email
                const hostUser = await storage.getUser(host.userId);
                if (hostUser && hostUser.email) {
                  await emailService.sendInterestNotification(
                    hostUser.email,
                    host.businessName,
                    truck.name,
                    new Date(event.date).toLocaleDateString()
                  );
                }
              }
            }
          } catch (err) {
            console.error("Failed to send interest notification:", err);
          }
        })();

        res.status(201).json({ message: "Interest sent", interest });
      } catch (error: any) {
        console.error("Error creating event interest:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to submit interest" });
      }
    }
  );

  app.post("/api/events/signup", isAuthenticated, async (req: any, res) => {
    try {
      const schema = z.object({
        eventName: z.string().min(1),
        date: z.string().min(1),
        city: z.string().min(1),
        expectedCrowd: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        notes: z.string().optional(),
      });

      const parsed = schema.parse(req.body);
      let updatedUserType = req.user?.userType;
      if (req.user?.userType === "customer") {
        const updatedUser = await storage.updateUserType(
          req.user.id,
          "event_coordinator"
        );
        updatedUserType = updatedUser.userType;
      }

      const adminEmail =
        process.env.ADMIN_ALERT_EMAIL || "info.mealscout@gmail.com";

      const subject = `New event coordinator request: ${parsed.eventName}`;
      const html = `
        <h2>New event coordinator request</h2>
        <p><strong>Event:</strong> ${parsed.eventName}</p>
        <p><strong>Date:</strong> ${parsed.date}</p>
        <p><strong>City:</strong> ${parsed.city}</p>
        <p><strong>Expected Crowd:</strong> ${parsed.expectedCrowd}</p>
        <p><strong>Contact Email:</strong> ${parsed.contactEmail}</p>
        ${parsed.contactPhone ? `<p><strong>Phone:</strong> ${parsed.contactPhone}</p>` : ""}
        ${parsed.notes ? `<p><strong>Notes:</strong> ${parsed.notes}</p>` : ""}
      `;

      await emailService.sendBasicEmail(adminEmail, subject, html);

      await storage.createTelemetryEvent({
        eventName: "event_coordinator_request_created",
        userId: req.user.id,
        properties: {
          eventName: parsed.eventName,
          city: parsed.city,
          expectedCrowd: parsed.expectedCrowd,
        },
      });

      await storage.createUnifiedClaim({
        personId: req.user.id,
        claimType: CLAIM_TYPES.EVENT,
        status: CLAIM_STATUS.PROVISIONAL,
        claimData: {
          eventName: parsed.eventName,
          date: parsed.date,
          city: parsed.city,
          expectedCrowd: parsed.expectedCrowd,
          contactEmail: parsed.contactEmail,
          contactPhone: parsed.contactPhone ?? null,
          notes: parsed.notes ?? null,
        },
        metadata: {
          source: "event_signup",
        },
      });

      res.json({ message: "Request submitted", userType: updatedUserType });
    } catch (error: any) {
      console.error("Error submitting event coordinator request:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit request" });
    }
  });
}
