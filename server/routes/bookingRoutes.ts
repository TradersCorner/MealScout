import type { Express } from "express";
import { z } from "zod";
import { db } from "../db";
import {
  eventBookings,
  eventInterests,
  events,
  hosts,
  restaurants,
} from "@shared/schema";
import { eq, and, or, desc, gte } from "drizzle-orm";
import { isAuthenticated, isStaffOrAdmin } from "../unifiedAuth";
import { storage } from "../storage";
import { emailService } from "../emailService";

/**
 * Booking Management Routes
 * - GET /api/bookings/my-truck - Get all bookings for user's food truck
 * - GET /api/bookings/my-host - Get all bookings for user's host locations
 * - POST /api/bookings/:bookingId/cancel - Cancel a booking with refund
 */
export function registerBookingRoutes(app: Express) {
  // Get all bookings for the user's food truck
  app.get("/api/bookings/my-truck", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get user's restaurants (trucks)
      const userTrucks = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, userId));

      if (userTrucks.length === 0) {
        return res.json([]);
      }

      const truckIds = userTrucks.map((t) => t.id);

      // Get all bookings for these trucks
      const bookings = await db
        .select({
          id: eventBookings.id,
          eventId: eventBookings.eventId,
          truckId: eventBookings.truckId,
          hostId: eventBookings.hostId,
          status: eventBookings.status,
          totalCents: eventBookings.totalCents,
          hostPriceCents: eventBookings.hostPriceCents,
          platformFeeCents: eventBookings.platformFeeCents,
          stripePaymentIntentId: eventBookings.stripePaymentIntentId,
          bookingConfirmedAt: eventBookings.bookingConfirmedAt,
          cancelledAt: eventBookings.cancelledAt,
          createdAt: eventBookings.createdAt,
          event: events,
          host: hosts,
        })
        .from(eventBookings)
        .innerJoin(events, eq(eventBookings.eventId, events.id))
        .innerJoin(hosts, eq(eventBookings.hostId, hosts.id))
        .where(or(...truckIds.map((id) => eq(eventBookings.truckId, id))))
        .orderBy(desc(events.date));

      // Format the response
      const formattedBookings = bookings.map((b) => ({
        id: b.id,
        eventId: b.eventId,
        truckId: b.truckId,
        hostId: b.hostId,
        status: b.status,
        totalCents: b.totalCents,
        hostPriceCents: b.hostPriceCents,
        platformFeeCents: b.platformFeeCents,
        stripePaymentIntentId: b.stripePaymentIntentId,
        bookingConfirmedAt: b.bookingConfirmedAt,
        cancelledAt: b.cancelledAt,
        createdAt: b.createdAt,
        event: {
          id: b.event.id,
          date: b.event.date,
          startTime: b.event.startTime,
          endTime: b.event.endTime,
          status: b.event.status,
          host: {
            businessName: b.host.businessName,
            address: b.host.address,
            locationType: b.host.locationType,
          },
        },
      }));

      res.json(formattedBookings);
    } catch (error) {
      console.error("Error fetching truck bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get all bookings for the user's host locations
  app.get("/api/bookings/my-host", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get user's host profile
      const userHosts = await db
        .select()
        .from(hosts)
        .where(eq(hosts.userId, userId));

      if (userHosts.length === 0) {
        return res.json([]);
      }

      const hostIds = userHosts.map((h) => h.id);

      // Get all bookings for these host locations
      const bookings = await db
        .select({
          id: eventBookings.id,
          eventId: eventBookings.eventId,
          truckId: eventBookings.truckId,
          hostId: eventBookings.hostId,
          status: eventBookings.status,
          totalCents: eventBookings.totalCents,
          hostPriceCents: eventBookings.hostPriceCents,
          platformFeeCents: eventBookings.platformFeeCents,
          stripePaymentIntentId: eventBookings.stripePaymentIntentId,
          bookingConfirmedAt: eventBookings.bookingConfirmedAt,
          cancelledAt: eventBookings.cancelledAt,
          createdAt: eventBookings.createdAt,
          event: events,
          host: hosts,
          truck: restaurants,
        })
        .from(eventBookings)
        .innerJoin(events, eq(eventBookings.eventId, events.id))
        .innerJoin(hosts, eq(eventBookings.hostId, hosts.id))
        .innerJoin(restaurants, eq(eventBookings.truckId, restaurants.id))
        .where(or(...hostIds.map((id) => eq(eventBookings.hostId, id))))
        .orderBy(desc(events.date));

      // Format the response
      const formattedBookings = bookings.map((b) => ({
        id: b.id,
        eventId: b.eventId,
        truckId: b.truckId,
        hostId: b.hostId,
        status: b.status,
        totalCents: b.totalCents,
        hostPriceCents: b.hostPriceCents,
        platformFeeCents: b.platformFeeCents,
        stripePaymentIntentId: b.stripePaymentIntentId,
        bookingConfirmedAt: b.bookingConfirmedAt,
        cancelledAt: b.cancelledAt,
        createdAt: b.createdAt,
        event: {
          id: b.event.id,
          date: b.event.date,
          startTime: b.event.startTime,
          endTime: b.event.endTime,
          status: b.event.status,
          host: {
            businessName: b.host.businessName,
            address: b.host.address,
            locationType: b.host.locationType,
          },
        },
        truck: {
          id: b.truck.id,
          name: b.truck.name,
          cuisineType: b.truck.cuisineType,
          imageUrl: b.truck.imageUrl,
        },
      }));

      res.json(formattedBookings);
    } catch (error) {
      console.error("Error fetching host bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Cancel a booking (with refund if paid)
  app.post(
    "/api/bookings/:bookingId/cancel",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        // Get the booking
        const [booking] = await db
          .select()
          .from(eventBookings)
          .where(eq(eventBookings.id, bookingId));

        if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
        }

        // Verify the user owns the truck for this booking
        const truck = await db
          .select()
          .from(restaurants)
          .where(eq(restaurants.id, booking.truckId));

        if (!truck.length || truck[0].ownerId !== userId) {
          return res
            .status(403)
            .json({ message: "Not authorized to cancel this booking" });
        }

        // Check if already cancelled
        if (booking.status === "cancelled") {
          return res
            .status(400)
            .json({ message: "Booking is already cancelled" });
        }

        // If there's a payment intent, process refund
        if (booking.stripePaymentIntentId) {
          const stripe = (await import("stripe")).default;
          const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2024-12-18.acacia",
          });

          try {
            // Refund the payment
            await stripeClient.refunds.create({
              payment_intent: booking.stripePaymentIntentId,
              reason: "requested_by_customer",
            });
          } catch (stripeError: any) {
            console.error("Stripe refund error:", stripeError);
            return res.status(500).json({
              message: "Failed to process refund. Please contact support.",
              error: stripeError.message,
            });
          }
        }

        // Update booking status
        await db
          .update(eventBookings)
          .set({
            status: "cancelled",
            cancelledAt: new Date(),
            cancellationReason: "Cancelled by food truck owner",
            updatedAt: new Date(),
          })
          .where(eq(eventBookings.id, bookingId));

        // Update event status if needed
        await db
          .update(events)
          .set({
            status: "open",
            bookedRestaurantId: null,
          })
          .where(eq(events.id, booking.eventId));

        res.json({
          message: "Booking cancelled successfully",
          refundProcessed: !!booking.stripePaymentIntentId,
        });
      } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ message: "Failed to cancel booking" });
      }
    },
  );

  // Admin/staff-only: public profile schedule (booked + accepted events)
  app.get(
    "/api/bookings/truck/:truckId/schedule",
    isStaffOrAdmin,
    async (req: any, res) => {
      try {
        const { truckId } = req.params;

        const [truck] = await db
          .select({ id: restaurants.id, name: restaurants.name })
          .from(restaurants)
          .where(eq(restaurants.id, truckId));

        if (!truck) {
          return res.status(404).json({ message: "Truck not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookingRows = await db
          .select({
            eventId: eventBookings.eventId,
            status: eventBookings.status,
            bookingConfirmedAt: eventBookings.bookingConfirmedAt,
            createdAt: eventBookings.createdAt,
            event: events,
            host: hosts,
          })
          .from(eventBookings)
          .innerJoin(events, eq(eventBookings.eventId, events.id))
          .innerJoin(hosts, eq(eventBookings.hostId, hosts.id))
          .where(
            and(
              eq(eventBookings.truckId, truckId),
              or(
                eq(eventBookings.status, "confirmed"),
                eq(eventBookings.status, "pending"),
              ),
              or(eq(events.status, "open"), eq(events.status, "booked")),
              gte(events.date, today),
            ),
          )
          .orderBy(desc(events.date));

        const acceptedInterestRows = await db
          .select({
            eventId: eventInterests.eventId,
            status: eventInterests.status,
            createdAt: eventInterests.createdAt,
            event: events,
            host: hosts,
          })
          .from(eventInterests)
          .innerJoin(events, eq(eventInterests.eventId, events.id))
          .innerJoin(hosts, eq(events.hostId, hosts.id))
          .where(
            and(
              eq(eventInterests.truckId, truckId),
              eq(eventInterests.status, "accepted"),
              or(eq(events.status, "open"), eq(events.status, "booked")),
              gte(events.date, today),
            ),
          )
          .orderBy(desc(events.date));

        const bookingEventIds = new Set(
          bookingRows.map((row) => row.eventId),
        );

        const schedule = [
          ...bookingRows.map((row) => ({
            type: "booking",
            status: row.status,
            createdAt: row.createdAt,
            bookingConfirmedAt: row.bookingConfirmedAt,
            event: {
              id: row.event.id,
              date: row.event.date,
              startTime: row.event.startTime,
              endTime: row.event.endTime,
              status: row.event.status,
              hostPriceCents: row.event.hostPriceCents,
              requiresPayment: row.event.requiresPayment,
            },
            host: {
              businessName: row.host.businessName,
              address: row.host.address,
              locationType: row.host.locationType,
            },
          })),
          ...acceptedInterestRows
            .filter((row) => !bookingEventIds.has(row.eventId))
            .map((row) => ({
              type: "accepted_interest",
              status: row.status,
              createdAt: row.createdAt,
              event: {
                id: row.event.id,
                date: row.event.date,
                startTime: row.event.startTime,
                endTime: row.event.endTime,
                status: row.event.status,
                hostPriceCents: row.event.hostPriceCents,
                requiresPayment: row.event.requiresPayment,
              },
              host: {
                businessName: row.host.businessName,
                address: row.host.address,
                locationType: row.host.locationType,
              },
            })),
        ];

        res.json({
          truck: { id: truck.id, name: truck.name },
          schedule,
        });
      } catch (error) {
        console.error("Error fetching truck schedule:", error);
        res.status(500).json({ message: "Failed to fetch schedule" });
      }
    },
  );

  // Admin/staff-only: booking request from public profile
  app.post(
    "/api/trucks/:truckId/booking-request",
    async (req: any, res) => {
      try {
        const { truckId } = req.params;

        const schema = z.object({
          name: z.string().min(1),
          email: z.string().email(),
          phone: z.string().min(5),
          expectedGuests: z.string().min(1),
          date: z.string().min(1),
          startTime: z.string().min(1),
          endTime: z.string().min(1),
          location: z.string().min(1),
          notes: z.string().optional(),
        });

        const parsed = schema.parse(req.body);

        const truck = await storage.getRestaurant(truckId);
        if (!truck) {
          return res.status(404).json({ message: "Truck not found" });
        }

        const owner = await storage.getUser(truck.ownerId);
        if (!owner || !owner.email) {
          return res
            .status(400)
            .json({ message: "Truck owner email not available" });
        }

        const subject = `New booking request for ${truck.name}`;
        const html = `
          <h2>New booking request for ${truck.name}</h2>
          <p><strong>Requester:</strong> ${parsed.name}</p>
          <p><strong>Email:</strong> ${parsed.email}</p>
          <p><strong>Phone:</strong> ${parsed.phone}</p>
          <p><strong>Expected Guests:</strong> ${parsed.expectedGuests}</p>
          <p><strong>Date:</strong> ${parsed.date}</p>
          <p><strong>Time:</strong> ${parsed.startTime} - ${parsed.endTime}</p>
          <p><strong>Location:</strong> ${parsed.location}</p>
          ${parsed.notes ? `<p><strong>Notes:</strong> ${parsed.notes}</p>` : ""}
        `;

        await emailService.sendBasicEmail(owner.email, subject, html);

        if (!process.env.TWILIO_ACCOUNT_SID) {
          console.warn(
            "SMS not configured for booking requests (missing TWILIO_ACCOUNT_SID).",
          );
        }

        await storage.createTelemetryEvent({
          eventName: "truck_booking_request_created",
          userId: req.user?.id || null,
          properties: {
            truckId,
            requesterEmail: parsed.email,
            expectedGuests: parsed.expectedGuests,
          },
        });

        res.json({ message: "Request sent" });
      } catch (error: any) {
        console.error("Error sending booking request:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid request data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to send request" });
      }
    },
  );
}
