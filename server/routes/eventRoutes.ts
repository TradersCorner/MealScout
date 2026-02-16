import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { emailService } from "../emailService";
import { db } from "../db";
import {
  isAuthenticated,
  isRestaurantOwner,
  isStaffOrAdmin,
} from "../unifiedAuth";
import {
  eventBookings,
  eventSeries,
  hosts,
  insertEventInterestSchema,
  restaurants,
  CLAIM_STATUS,
  CLAIM_TYPES,
} from "@shared/schema";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { forwardGeocode, reverseGeocode } from "../utils/geocoding";
import { listParkingPassOccurrences } from "../services/parkingPassVirtual";
import {
  computeParkingPassQualityFlags,
  isParkingPassPublicReady,
  normalizeUsStateAbbr,
} from "../services/parkingPassQuality";

export function registerEventRoutes(app: Express) {
  let parkingPassPublicFeedCache:
    | { expiresAt: number; payload: any[] }
    | null = null;
  let parkingPassPublicFeedLastGood: { payload: any[] } | null = null;
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
      res.setHeader("Cache-Control", "public, max-age=60");
      if (
        parkingPassPublicFeedCache &&
        parkingPassPublicFeedCache.expiresAt > Date.now()
      ) {
        return res.json(parkingPassPublicFeedCache.payload);
      }
      const { occurrences } = await listParkingPassOccurrences({ horizonDays: 30 });

      const payoutsEnabled = (event: any) =>
        Boolean(
          event?.host?.stripeConnectAccountId && event?.host?.stripeChargesEnabled,
        );

      // NOTE: Public feed must only show Parking Pass listings that have pricing
      // and a clean, geocodable address. Draft/incomplete listings can exist
      // but must not be returned here.
      const virtualEvents = occurrences
        .filter((event: any) => isParkingPassPublicReady(event))
        .map((event: any) => ({
          ...event,
          paymentsEnabled: payoutsEnabled(event),
          qualityFlags: computeParkingPassQualityFlags(event),
        }));

      const legacyUpcoming = await storage.getAllUpcomingEvents();
      const legacyEvents = legacyUpcoming
        .filter(
          (event: any) =>
            event?.eventType === "parking_pass" && isParkingPassPublicReady(event),
        )
        .map((event: any) => ({
          ...event,
          paymentsEnabled: payoutsEnabled(event),
          qualityFlags: computeParkingPassQualityFlags(event),
        }));

      const dedupedById = new Map<string, any>();
      for (const item of [...virtualEvents, ...legacyEvents]) {
        dedupedById.set(item.id, item);
      }
      const parkingEvents = Array.from(dedupedById.values());

      // Best-effort: ensure host coordinates exist so map pins can render.
      // We intentionally cap work per request to avoid hammering geocoding providers.
      const MAX_GEOCODE_PER_REQUEST = 30;
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

      const toNumberOrNull = (value: any) => {
        if (value === null || value === undefined) return null;
        const parsed = typeof value === "string" ? Number(value) : value;
        return Number.isFinite(parsed) ? parsed : null;
      };
      const parkingEventsWithPins = parkingEvents.filter((event: any) => {
        const host = event?.host;
        const lat = toNumberOrNull(host?.latitude);
        const lng = toNumberOrNull(host?.longitude);
        return (
          lat !== null &&
          lng !== null &&
          Math.abs(lat) <= 90 &&
          Math.abs(lng) <= 180
        );
      });

      const eventIds = parkingEventsWithPins.map((event) => event.id);

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

      const enhancedEvents = parkingEventsWithPins.map((event) => {
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

      parkingPassPublicFeedCache = {
        payload: enhancedEvents,
        expiresAt: Date.now() + 60_000,
      };
      parkingPassPublicFeedLastGood = { payload: enhancedEvents };
      res.json(enhancedEvents);
    } catch (error: any) {
      console.error("Error fetching parking pass listings:", error);
      if (parkingPassPublicFeedLastGood?.payload) {
        res.setHeader("X-MealScout-Stale", "1");
        return res.json(parkingPassPublicFeedLastGood.payload);
      }
      res.status(200).json([]);
    }
  });

  // Lightweight helper for map gating: which hosts have public-ready (priced) parking pass listings?
  // This endpoint intentionally avoids booking lookups/geocoding so maps can load quickly.
  let parkingPassHostIdsCache:
    | { expiresAt: number; payload: { generatedAt: string; hostIds: string[] } }
    | null = null;
  let parkingPassHostIdsLastGood:
    | { payload: { generatedAt: string; hostIds: string[] } }
    | null = null;
  app.get("/api/parking-pass/host-ids", async (_req: any, res) => {
    try {
      res.setHeader("Cache-Control", "public, max-age=60");
      if (parkingPassHostIdsCache && parkingPassHostIdsCache.expiresAt > Date.now()) {
        return res.json(parkingPassHostIdsCache.payload);
      }

      const VALID_US_STATE_ABBRS = new Set([
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
        "DC",
      ]);

      const extractStateAbbr = (value?: string | null) => {
        const raw = String(value || "").toUpperCase();
        if (!raw) return "";
        const matches = raw.match(/\b[A-Z]{2}\b/g) || [];
        for (let i = matches.length - 1; i >= 0; i -= 1) {
          const candidate = matches[i];
          if (VALID_US_STATE_ABBRS.has(candidate)) return candidate;
        }
        return "";
      };

      const parseCoord = (value?: string | number | null) => {
        if (value === null || value === undefined) return null;
        const parsed = typeof value === "string" ? Number(value) : value;
        return Number.isFinite(parsed) ? parsed : null;
      };
      const buildFullAddress = (
        address?: string | null,
        city?: string | null,
        state?: string | null,
      ) => {
        const base = (address ?? "").trim();
        if (!base) return "";
        const baseLower = base.toLowerCase();
        const normalizedCity = (city ?? "").trim();
        const normalizedState = (state ?? "").trim();

        const parts: string[] = [base];
        if (normalizedCity && !baseLower.includes(normalizedCity.toLowerCase())) {
          parts.push(normalizedCity);
        }
        if (normalizedState && !baseLower.includes(normalizedState.toLowerCase())) {
          parts.push(normalizedState);
        }
        parts.push("USA");
        return parts.join(", ");
      };

      // Prefer series-level gating (not occurrences) so hosts remain visible even if they have no
      // occurrences in the next N days.
      const seriesRows = await db
        .select({
          seriesId: eventSeries.id,
          hostId: eventSeries.hostId,
          status: eventSeries.status,
          publishedAt: eventSeries.publishedAt,
          defaultStartTime: eventSeries.defaultStartTime,
          defaultEndTime: eventSeries.defaultEndTime,
          defaultMaxTrucks: eventSeries.defaultMaxTrucks,
          breakfastPriceCents: eventSeries.defaultBreakfastPriceCents,
          lunchPriceCents: eventSeries.defaultLunchPriceCents,
          dinnerPriceCents: eventSeries.defaultDinnerPriceCents,
          dailyPriceCents: eventSeries.defaultDailyPriceCents,
          weeklyPriceCents: eventSeries.defaultWeeklyPriceCents,
          monthlyPriceCents: eventSeries.defaultMonthlyPriceCents,
          updatedAt: eventSeries.updatedAt,
        })
        .from(eventSeries)
        .where(
          sql`${eventSeries.seriesType} = 'parking_pass' and ${eventSeries.status} in ('published', 'draft')`,
        )
        .orderBy(asc(eventSeries.updatedAt));

      // De-dupe: keep the most-recent published series per host.
      const bestByHostId = new Map<string, (typeof seriesRows)[number]>();
      for (const row of seriesRows) {
        bestByHostId.set(String(row.hostId), row);
      }

      const seriesHostIds = Array.from(bestByHostId.keys()).filter(Boolean);
      // Avoid `storage.getHostsByIds()` here because schema mismatches on older DBs can
      // cause this endpoint to return zero hosts (and blank the map).
      const hostRows =
        seriesHostIds.length > 0
          ? await db
              .select({
                id: hosts.id,
                address: hosts.address,
                city: hosts.city,
                state: hosts.state,
                latitude: hosts.latitude,
                longitude: hosts.longitude,
              })
              .from(hosts)
              .where(inArray(hosts.id, seriesHostIds))
          : [];
      const hostById = new Map<string, any>(
        (hostRows || []).map((host: any) => [String(host.id), host]),
      );

      // Opportunistic geocode: map pins can only render with coords, so try to backfill a few per request.
      const MAX_GEOCODE_PER_REQUEST = 20;
      let geocoded = 0;
      const MAX_REVERSE_CHECKS = 20;
      let reverseChecks = 0;
      const MAX_PUBLISH_PER_REQUEST = 50;
      let published = 0;

      const hostIds = new Set<string>();
      for (const row of bestByHostId.values()) {
        const host = hostById.get(String(row.hostId)) ?? null;
        const address = host?.address ?? null;
        const city = host?.city ?? null;
        const state = host?.state ?? null;
        const expectedStateRaw = normalizeUsStateAbbr(String(state || "").trim());
        const expectedState =
          expectedStateRaw && VALID_US_STATE_ABBRS.has(expectedStateRaw)
            ? expectedStateRaw
            : extractStateAbbr(address) || extractStateAbbr(city);
        let lat = parseCoord(host?.latitude);
        let lng = parseCoord(host?.longitude);

        if (
          expectedState &&
          lat !== null &&
          lng !== null &&
          reverseChecks < MAX_REVERSE_CHECKS
        ) {
          reverseChecks += 1;
          const reversed = await reverseGeocode(lat, lng).catch(() => null);
          const reversedState = normalizeUsStateAbbr(
            String(reversed?.state || "").trim(),
          );
          if (reversedState && reversedState !== expectedState) {
            // Coordinates appear to be for the wrong state; force re-geocode.
            lat = null;
            lng = null;
          }
        }

        if ((lat === null || lng === null) && geocoded < MAX_GEOCODE_PER_REQUEST) {
          const addr = buildFullAddress(address, city, state);
          if (addr) {
            const coords = await forwardGeocode(addr).catch(() => null);
            if (coords) {
              if (expectedState && reverseChecks < MAX_REVERSE_CHECKS) {
                reverseChecks += 1;
                const verify = await reverseGeocode(coords.lat, coords.lng).catch(
                  () => null,
                );
                const verifyState = normalizeUsStateAbbr(
                  String(verify?.state || "").trim(),
                );
                if (verifyState && verifyState !== expectedState) {
                  continue;
                }
              }
              geocoded += 1;
              lat = coords.lat;
              lng = coords.lng;
              try {
                await storage.updateHostCoordinates(String(row.hostId), coords.lat, coords.lng);
              } catch {
                // ignore persist failures; still allow map rendering when coords are returned.
              }
            }
          }
        }

        const flags = computeParkingPassQualityFlags({
          host: {
            address,
            city,
            state,
            latitude: lat,
            longitude: lng,
            stripeConnectAccountId: null,
            stripeChargesEnabled: null,
          },
          startTime: row.defaultStartTime,
          endTime: row.defaultEndTime,
          maxTrucks: row.defaultMaxTrucks,
          breakfastPriceCents: row.breakfastPriceCents,
          lunchPriceCents: row.lunchPriceCents,
          dinnerPriceCents: row.dinnerPriceCents,
          dailyPriceCents: row.dailyPriceCents,
          weeklyPriceCents: row.weeklyPriceCents,
          monthlyPriceCents: row.monthlyPriceCents,
        });
        if (flags.length > 0) continue;

        hostIds.add(String(row.hostId));

        // If a draft series is now public-ready (often after coords are geocoded),
        // promote it to published so subsequent requests don't depend on this endpoint.
        if (
          String(row.status || "").toLowerCase() !== "published" &&
          published < MAX_PUBLISH_PER_REQUEST
        ) {
          published += 1;
          await db
            .update(eventSeries)
            .set({
              status: "published" as any,
              publishedAt: row.publishedAt ?? new Date(),
              updatedAt: new Date(),
            })
            .where(eq(eventSeries.id, row.seriesId));
        }
      }

      // Legacy fallback: some old parking pass events can exist without a series.
      const legacyUpcoming = await storage.getAllUpcomingEvents();
      for (const event of legacyUpcoming) {
        if (event?.eventType !== "parking_pass") continue;
        if (!isParkingPassPublicReady(event)) continue;
        const hostId = String((event as any)?.hostId ?? (event as any)?.host?.id ?? "").trim();
        if (hostId) hostIds.add(hostId);
      }

      const payload = {
        generatedAt: new Date().toISOString(),
        hostIds: Array.from(hostIds),
      };
      parkingPassHostIdsCache = {
        payload,
        expiresAt: Date.now() + 60_000,
      };
      parkingPassHostIdsLastGood = { payload };
      res.json(payload);
    } catch (error: any) {
      console.error("Error fetching parking pass host ids:", error);
      if (parkingPassHostIdsLastGood?.payload) {
        res.setHeader("X-MealScout-Stale", "1");
        return res.json(parkingPassHostIdsLastGood.payload);
      }
      res.status(200).json({ generatedAt: new Date().toISOString(), hostIds: [] });
    }
  });

  let parkingPassHostStatusCacheByDate = new Map<
    string,
    {
      expiresAt: number;
      payload: {
        generatedAt: string;
        date: string;
        hosts: Array<{
          hostId: string;
          availableCount: number;
          spotCount: number;
          reservedCount: number;
          isFull: boolean;
        }>;
      };
    }
  >();

  const normalizeDateKey = (value: unknown) => {
    const raw = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    return new Date().toISOString().split("T")[0];
  };

  const buildParkingPassHostStatusPayload = async (dateKey: string) => {
    const { occurrences } = await listParkingPassOccurrences({ horizonDays: 30 });
    const virtualEvents = occurrences.filter((event: any) => {
      if (!isParkingPassPublicReady(event)) return false;
      const eventDate = String(event?.date || "").slice(0, 10);
      return eventDate === dateKey;
    });

    const legacyUpcoming = await storage.getAllUpcomingEvents();
    const legacyEvents = legacyUpcoming.filter((event: any) => {
      if (event?.eventType !== "parking_pass") return false;
      if (!isParkingPassPublicReady(event)) return false;
      const eventDate = String(event?.date || "").slice(0, 10);
      return eventDate === dateKey;
    });

    const dedupedById = new Map<string, any>();
    for (const item of [...virtualEvents, ...legacyEvents]) {
      dedupedById.set(String(item.id), item);
    }
    const events = Array.from(dedupedById.values());
    const eventIds = events.map((event) => String(event.id));

    const bookingCounts =
      eventIds.length > 0
        ? await db
            .select({
              eventId: eventBookings.eventId,
              status: eventBookings.status,
              count: sql<number>`count(*)`,
            })
            .from(eventBookings)
            .where(inArray(eventBookings.eventId, eventIds))
            .where(inArray(eventBookings.status, ["confirmed", "pending"]))
            .groupBy(eventBookings.eventId, eventBookings.status)
        : [];

    const countsByEvent = new Map<
      string,
      { confirmed: number; pending: number }
    >();
    for (const row of bookingCounts) {
      const prev = countsByEvent.get(row.eventId) || { confirmed: 0, pending: 0 };
      if (row.status === "confirmed") prev.confirmed = Number(row.count || 0);
      if (row.status === "pending") prev.pending = Number(row.count || 0);
      countsByEvent.set(row.eventId, prev);
    }

    const byHost = new Map<
      string,
      { availableCount: number; spotCount: number; reservedCount: number }
    >();

    for (const event of events) {
      const hostId = String(event?.hostId ?? event?.host?.id ?? "").trim();
      if (!hostId) continue;
      const maxSpots = Number(event?.maxTrucks ?? 1) || 1;
      const counts = countsByEvent.get(String(event.id)) || {
        confirmed: 0,
        pending: 0,
      };
      const reservedCount = Math.min(
        maxSpots,
        Number(counts.confirmed) + Number(counts.pending),
      );
      const availableCount = Math.max(0, maxSpots - reservedCount);

      const prev = byHost.get(hostId) || {
        availableCount: 0,
        spotCount: 0,
        reservedCount: 0,
      };
      byHost.set(hostId, {
        availableCount: prev.availableCount + availableCount,
        spotCount: prev.spotCount + maxSpots,
        reservedCount: prev.reservedCount + reservedCount,
      });
    }

    const hosts = Array.from(byHost.entries()).map(([hostId, totals]) => ({
      hostId,
      availableCount: totals.availableCount,
      spotCount: totals.spotCount,
      reservedCount: totals.reservedCount,
      isFull: totals.availableCount <= 0,
    }));

    return {
      generatedAt: new Date().toISOString(),
      date: dateKey,
      hosts,
    };
  };

  app.get("/api/parking-pass/host-status", async (req: any, res) => {
    try {
      res.setHeader("Cache-Control", "public, max-age=60");
      const dateKey = normalizeDateKey(req.query?.date);
      const cached = parkingPassHostStatusCacheByDate.get(dateKey);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json(cached.payload);
      }

      const payload = await buildParkingPassHostStatusPayload(dateKey);
      parkingPassHostStatusCacheByDate.set(dateKey, {
        payload,
        expiresAt: Date.now() + 60_000,
      });
      res.json(payload);
    } catch (error: any) {
      console.error("Error fetching parking pass host status:", error);
      const dateKey = normalizeDateKey(req.query?.date);
      const stale = parkingPassHostStatusCacheByDate.get(dateKey);
      if (stale?.payload) {
        res.setHeader("X-MealScout-Stale", "1");
        return res.json(stale.payload);
      }
      res.status(200).json({
        generatedAt: new Date().toISOString(),
        date: dateKey,
        hosts: [],
      });
    }
  });

  app.get(
    "/api/admin/parking-pass/host-status",
    isAuthenticated,
    isStaffOrAdmin,
    async (req: any, res) => {
      const dateKey = normalizeDateKey(req.query?.date);
      try {
        const payload = await buildParkingPassHostStatusPayload(dateKey);

        // Attach quality flags (staff/admin only) so map popups can show "needs fixes".
        const flagsByHost = new Map<string, Set<string>>();
        const { occurrences } = await listParkingPassOccurrences({
          horizonDays: 30,
          includeDraft: true,
        });
        occurrences.forEach((event: any) => {
          const hostId = String(event?.hostId ?? event?.host?.id ?? "").trim();
          const eventDate = String(event?.date || "").slice(0, 10);
          if (!hostId || eventDate !== dateKey) return;
          const flags = computeParkingPassQualityFlags(event);
          const set = flagsByHost.get(hostId) || new Set<string>();
          flags.forEach((flag) => set.add(flag));
          flagsByHost.set(hostId, set);
        });

        const hosts = payload.hosts.map((host) => ({
          ...host,
          qualityFlags: Array.from(flagsByHost.get(host.hostId) || []),
        }));

        res.json({ ...payload, hosts });
      } catch (error: any) {
        console.error("Error fetching admin parking pass host status:", error);
        try {
          // Graceful fallback: keep map usable for staff/admin even if
          // quality-flag enrichment fails.
          const payload = await buildParkingPassHostStatusPayload(dateKey);
          res.setHeader("X-MealScout-Stale", "1");
          return res.status(200).json({
            ...payload,
            hosts: payload.hosts.map((host) => ({ ...host, qualityFlags: [] })),
          });
        } catch (fallbackError: any) {
          console.error(
            "Error building fallback admin parking pass host status:",
            fallbackError,
          );
          res.setHeader("X-MealScout-Stale", "1");
          return res.status(200).json({
            generatedAt: new Date().toISOString(),
            date: dateKey,
            hosts: [],
          });
        }
      }
    },
  );

  app.post(
    "/api/admin/parking-pass/cache/clear",
    isAuthenticated,
    isStaffOrAdmin,
    async (_req: any, res) => {
      parkingPassHostIdsCache = null;
      parkingPassHostIdsLastGood = null;
      parkingPassHostStatusCacheByDate = new Map();
      parkingPassPublicFeedCache = null;
      parkingPassPublicFeedLastGood = null;
      res.json({ success: true });
    },
  );

  app.get(
    "/api/admin/parking-pass/fix-queue",
    isAuthenticated,
    isStaffOrAdmin,
    async (_req: any, res) => {
      try {
        const rows = await db
          .select({
            series: eventSeries,
          })
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

        const items = rows.map(({ series }: any) => {
          const hostId = String(series.hostId || "").trim();
          const host = hostById.get(hostId) ?? null;
          const platformPaymentsEnabled = Boolean(process.env.STRIPE_SECRET_KEY);
          const listing = {
            host,
            startTime: (series as any).defaultStartTime,
            endTime: (series as any).defaultEndTime,
            maxTrucks: (series as any).defaultMaxTrucks,
            breakfastPriceCents: (series as any).defaultBreakfastPriceCents,
            lunchPriceCents: (series as any).defaultLunchPriceCents,
            dinnerPriceCents: (series as any).defaultDinnerPriceCents,
            dailyPriceCents: (series as any).defaultDailyPriceCents,
            weeklyPriceCents: (series as any).defaultWeeklyPriceCents,
            monthlyPriceCents: (series as any).defaultMonthlyPriceCents,
          };
          const qualityFlags = computeParkingPassQualityFlags(listing);
          const publicReady = isParkingPassPublicReady(listing);

          return {
            seriesId: series.id,
            seriesStatus: (series as any).status ?? null,
            hostId: host?.id ?? hostId,
            hostUserId: host?.userId ?? null,
            businessName: host?.businessName ?? null,
            address: host?.address ?? null,
            city: host?.city ?? null,
            state: host?.state ?? null,
            paymentsEnabled: platformPaymentsEnabled,
            publicReady,
            qualityFlags,
            hasSpotPhoto: Boolean((host as any)?.spotImageUrl),
          };
        });

        items.sort((a: any, b: any) => {
          const aScore = (a.publicReady ? 0 : 10) + a.qualityFlags.length;
          const bScore = (b.publicReady ? 0 : 10) + b.qualityFlags.length;
          return bScore - aScore;
        });

        res.json({ rows: items });
      } catch (error: any) {
        console.error("Error building parking pass fix queue:", error);
        res.status(500).json({ message: "Failed to load fix queue" });
      }
    },
  );

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
