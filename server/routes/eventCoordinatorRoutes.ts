import type { Express } from "express";
import { z } from "zod";
import { insertEventSchema, insertHostSchema } from "@shared/schema";
import { storage } from "../storage";

const allowedRoles = new Set([
  "event_coordinator",
  "admin",
  "super_admin",
  "staff",
]);

const isEventCoordinatorOrAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!allowedRoles.has(req.user?.userType)) {
    return res.status(403).json({ error: "Event coordinator access required" });
  }

  next();
};

export function registerEventCoordinatorRoutes(app: Express) {
  app.get(
    "/api/event-coordinator/events",
    isEventCoordinatorOrAdmin,
    async (req: any, res) => {
      try {
        const host = await storage.getHostByUserId(req.user.id);
        if (!host) {
          return res.json([]);
        }

        const events = await storage.getEventsByHost(host.id);
        const payload = events.map((event) => ({
          ...event,
          host: {
            businessName: host.businessName,
            address: host.address,
          },
        }));
        res.json(payload);
      } catch (error) {
        console.error("Error fetching event coordinator events:", error);
        res.status(500).json({ message: "Failed to fetch events" });
      }
    }
  );

  app.post(
    "/api/event-coordinator/events",
    isEventCoordinatorOrAdmin,
    async (req: any, res) => {
      try {
        const schema = z.object({
          businessName: z.string().min(1),
          address: z.string().min(1),
          city: z.string().min(1),
          state: z.string().min(2),
          contactPhone: z.string().min(1),
          name: z.string().min(1),
          description: z.string().optional(),
          date: z.string().min(1),
          startTime: z.string().min(1),
          endTime: z.string().min(1),
          maxTrucks: z.number().int().min(1).max(50),
        });

        const parsed = schema.parse(req.body);

        let host = await storage.getHostByUserId(req.user.id);
        if (!host) {
          const hostData = insertHostSchema.parse({
            userId: req.user.id,
            businessName: parsed.businessName,
            address: parsed.address,
            city: parsed.city,
            state: parsed.state,
            contactPhone: parsed.contactPhone,
            locationType: "event_coordinator",
          });
          host = await storage.createHost(hostData);
        }

        const eventPayload = insertEventSchema.parse({
          hostId: host.id,
          name: parsed.name,
          description: parsed.description || null,
          date: parsed.date,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          maxTrucks: parsed.maxTrucks,
          requiresPayment: false,
        });

        const eventDate = new Date(eventPayload.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (eventDate < today) {
          return res
            .status(400)
            .json({ message: "Event date must be in the future" });
        }

        const [startHour, startMinute] = eventPayload.startTime
          .split(":")
          .map(Number);
        const [endHour, endMinute] = eventPayload.endTime
          .split(":")
          .map(Number);
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        if (endMinutes <= startMinutes) {
          return res
            .status(400)
            .json({ message: "End time must be after start time" });
        }

        const created = await storage.createEvent(eventPayload);
        res.status(201).json({
          ...created,
          host: {
            businessName: host.businessName,
            address: host.address,
          },
        });
      } catch (error: any) {
        console.error("Error creating event coordinator event:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid event data", errors: error.errors });
        }
        res.status(400).json({
          message: error.message || "Failed to create event",
        });
      }
    }
  );
}
