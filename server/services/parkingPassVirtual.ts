import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "../db";
import {
  eventSeries,
  events,
  hosts,
  parkingPassBlackoutDates,
  type Event,
  type EventSeries,
} from "@shared/schema";
import { PARKING_PASS_MEAL_WINDOWS, timeToMinutes } from "@shared/parkingPassSlots";

const DEFAULT_HORIZON_DAYS = 30;

export const buildParkingPassVirtualId = (seriesId: string, dateKey: string) =>
  `pp:${seriesId}:${dateKey}`;

export const parseParkingPassVirtualId = (value: string) => {
  if (!value.startsWith("pp:")) return null;
  const parts = value.split(":");
  if (parts.length !== 3) return null;
  const [, seriesId, dateKey] = parts;
  if (!seriesId) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  return { seriesId, dateKey };
};

const dayStart = (d: Date) => {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (d: Date, days: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

const dateKeyFromDate = (d: Date) => d.toISOString().split("T")[0];

const normalizeDaysOfWeek = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "number" ? item : Number(item)))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
};

const ensureValidWindow = (startTime: string, endTime: string) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null || end <= start) {
    return {
      startTime: PARKING_PASS_MEAL_WINDOWS.breakfast.start,
      endTime: PARKING_PASS_MEAL_WINDOWS.dinner.end,
    };
  }
  return { startTime, endTime };
};

export type ParkingPassOccurrence = Event & {
  host: typeof hosts.$inferSelect;
};

type SeriesJoinRow = {
  series: EventSeries;
  host: typeof hosts.$inferSelect;
};

export async function listParkingPassOccurrences(options?: {
  start?: Date;
  horizonDays?: number;
  hostIds?: string[];
}) {
  const start = dayStart(options?.start ?? new Date());
  const horizonDays = Math.max(1, options?.horizonDays ?? DEFAULT_HORIZON_DAYS);
  const end = addDays(start, horizonDays);

  const whereSeries = options?.hostIds?.length
    ? and(
        eq(eventSeries.seriesType, "parking_pass"),
        eq(eventSeries.status, "published"),
        inArray(eventSeries.hostId, options.hostIds),
      )
    : and(eq(eventSeries.seriesType, "parking_pass"), eq(eventSeries.status, "published"));

  const seriesRows: SeriesJoinRow[] = await db
    .select({
      series: eventSeries,
      host: hosts,
    })
    .from(eventSeries)
    .innerJoin(hosts, eq(hosts.id, eventSeries.hostId))
    .where(whereSeries as any);

  if (seriesRows.length === 0) {
    return { occurrences: [] as ParkingPassOccurrence[], start, end };
  }

  const seriesIds = seriesRows.map((row) => row.series.id);
  const overrides = await db
    .select()
    .from(events)
    .where(
      and(
        inArray(events.seriesId, seriesIds),
        eq(events.eventType, "parking_pass"),
        eq(events.requiresPayment, true),
        gte(events.date, start),
        lt(events.date, end),
      ),
    );
  const overrideBySeriesDate = new Map<string, (typeof overrides)[number]>();
  for (const row of overrides) {
    const seriesId = row.seriesId;
    if (!seriesId) continue;
    const key = `${seriesId}:${dateKeyFromDate(new Date(row.date))}`;
    overrideBySeriesDate.set(key, row);
  }

  const blackoutRows: Array<{ seriesId: string; date: Date }> = await db
    .select({ seriesId: parkingPassBlackoutDates.seriesId, date: parkingPassBlackoutDates.date })
    .from(parkingPassBlackoutDates)
    .where(
      and(
        inArray(parkingPassBlackoutDates.seriesId, seriesIds),
        gte(parkingPassBlackoutDates.date, start),
        lt(parkingPassBlackoutDates.date, end),
      ),
    );
  const blackoutSet = new Set(
    blackoutRows.map(
      (row) => `${row.seriesId}:${dateKeyFromDate(new Date(row.date))}`,
    ),
  );

  const occurrences: ParkingPassOccurrence[] = [];
  for (const row of seriesRows) {
    const series = row.series;
    const host = row.host;

    const daysOfWeek = normalizeDaysOfWeek(series.parkingPassDaysOfWeek as unknown);
    const includeAllDays = daysOfWeek.length === 0;
    const window = ensureValidWindow(series.defaultStartTime, series.defaultEndTime);

    for (let offset = 0; offset < horizonDays; offset += 1) {
      const cursor = addDays(start, offset);
      const dow = cursor.getDay();
      if (!includeAllDays && !daysOfWeek.includes(dow)) {
        continue;
      }
      const dateKey = dateKeyFromDate(cursor);
      const seriesDateKey = `${series.id}:${dateKey}`;
      if (blackoutSet.has(seriesDateKey)) {
        continue;
      }

      const override = overrideBySeriesDate.get(seriesDateKey);
      const startTime = override?.startTime ?? window.startTime;
      const endTime = override?.endTime ?? window.endTime;

      const id = override?.id ?? buildParkingPassVirtualId(series.id, dateKey);
      const effectiveDate = override?.date ?? new Date(dateKey);

      const maxTrucks = override?.maxTrucks ?? series.defaultMaxTrucks ?? 1;
      const hardCapEnabled = override?.hardCapEnabled ?? series.defaultHardCapEnabled ?? false;
      const status = override?.status ?? "open";

      const breakfastPriceCents =
        override?.breakfastPriceCents ?? series.defaultBreakfastPriceCents ?? 0;
      const lunchPriceCents =
        override?.lunchPriceCents ?? series.defaultLunchPriceCents ?? 0;
      const dinnerPriceCents =
        override?.dinnerPriceCents ?? series.defaultDinnerPriceCents ?? 0;
      const dailyPriceCents = override?.dailyPriceCents ?? series.defaultDailyPriceCents ?? 0;
      const weeklyPriceCents = override?.weeklyPriceCents ?? series.defaultWeeklyPriceCents ?? 0;
      const monthlyPriceCents = override?.monthlyPriceCents ?? series.defaultMonthlyPriceCents ?? 0;
      const hostPriceCents = override?.hostPriceCents ?? series.defaultHostPriceCents ?? 0;

      occurrences.push({
        id,
        hostId: host.id,
        seriesId: series.id,
        name: override?.name ?? series.name,
        description: override?.description ?? series.description,
        eventType: "parking_pass",
        date: effectiveDate as any,
        startTime,
        endTime,
        maxTrucks,
        status,
        bookedRestaurantId: override?.bookedRestaurantId ?? null,
        hardCapEnabled,
        hostPriceCents,
        breakfastPriceCents,
        lunchPriceCents,
        dinnerPriceCents,
        dailyPriceCents,
        weeklyPriceCents,
        monthlyPriceCents,
        requiresPayment: true,
        stripeProductId: override?.stripeProductId ?? null,
        stripePriceId: override?.stripePriceId ?? null,
        unbookedNotificationSentAt: override?.unbookedNotificationSentAt ?? null,
        createdAt: override?.createdAt ?? null,
        updatedAt: override?.updatedAt ?? null,
        host,
      } as ParkingPassOccurrence);
    }
  }

  occurrences.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return { occurrences, start, end };
}

export async function ensureParkingPassEventRow(args: {
  passId: string;
  requireFuture?: boolean;
}) {
  const parsed = parseParkingPassVirtualId(args.passId);
  if (!parsed) {
    const row = await db
      .select()
      .from(events)
      .where(eq(events.id, args.passId))
      .limit(1);
    return row[0] ?? null;
  }

  const { seriesId, dateKey } = parsed;
  const targetDate = new Date(`${dateKey}T00:00:00`);
  if (args.requireFuture) {
    const today = dayStart(new Date());
    if (targetDate < today) {
      throw new Error("Cannot book past Parking Pass dates.");
    }
  }

  const [seriesRow] = await db
    .select({ series: eventSeries, host: hosts })
    .from(eventSeries)
    .innerJoin(hosts, eq(hosts.id, eventSeries.hostId))
    .where(eq(eventSeries.id, seriesId))
    .limit(1);

  if (!seriesRow || seriesRow.series.seriesType !== "parking_pass") {
    return null;
  }

  // Blackout check
  const [blackout] = await db
    .select({ id: parkingPassBlackoutDates.id })
    .from(parkingPassBlackoutDates)
    .where(and(eq(parkingPassBlackoutDates.seriesId, seriesId), eq(parkingPassBlackoutDates.date, targetDate)))
    .limit(1);
  if (blackout) {
    return null;
  }

  // Day-of-week check
  const days = normalizeDaysOfWeek(seriesRow.series.parkingPassDaysOfWeek as unknown);
  if (days.length > 0 && !days.includes(targetDate.getDay())) {
    return null;
  }

  const window = ensureValidWindow(seriesRow.series.defaultStartTime, seriesRow.series.defaultEndTime);

  // Upsert-like behavior: if already exists, return it.
  const existing = await db
    .select()
    .from(events)
    .where(eq(events.id, args.passId))
    .limit(1);
  if (existing[0]) {
    return existing[0];
  }

  const insertPayload: typeof events.$inferInsert = {
    id: args.passId,
    hostId: seriesRow.host.id,
    seriesId: seriesRow.series.id,
    name: seriesRow.series.name,
    description: seriesRow.series.description ?? null,
    eventType: "parking_pass",
    date: targetDate,
    startTime: window.startTime,
    endTime: window.endTime,
    maxTrucks: seriesRow.series.defaultMaxTrucks ?? 1,
    status: "open",
    bookedRestaurantId: null,
    hardCapEnabled: seriesRow.series.defaultHardCapEnabled ?? false,
    hostPriceCents: seriesRow.series.defaultHostPriceCents ?? 0,
    breakfastPriceCents: seriesRow.series.defaultBreakfastPriceCents ?? 0,
    lunchPriceCents: seriesRow.series.defaultLunchPriceCents ?? 0,
    dinnerPriceCents: seriesRow.series.defaultDinnerPriceCents ?? 0,
    dailyPriceCents: seriesRow.series.defaultDailyPriceCents ?? 0,
    weeklyPriceCents: seriesRow.series.defaultWeeklyPriceCents ?? 0,
    monthlyPriceCents: seriesRow.series.defaultMonthlyPriceCents ?? 0,
    requiresPayment: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [created] = await db.insert(events).values(insertPayload).returning();
  return created ?? null;
}
