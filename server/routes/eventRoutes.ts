import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { emailService } from "../emailService";
import { isAuthenticated, isRestaurantOwner } from "../unifiedAuth";
import { insertEventInterestSchema } from "@shared/schema";

export function registerEventRoutes(app: Express) {
  // Get all upcoming events (public)
  app.get("/api/events/upcoming", async (req: any, res) => {
    try {
      const events = await storage.getAllUpcomingEvents();
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Truck Discovery (authenticated)
  app.get("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      // Optional: Filter by location (lat/lng/radius) in the future
      const events = await storage.getAllUpcomingEvents();
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching all events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
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
}
