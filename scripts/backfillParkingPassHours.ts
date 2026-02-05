import "dotenv/config";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../server/db";
import { events, eventSeries } from "../shared/schema";
import {
  PARKING_PASS_MEAL_WINDOWS,
  timeToMinutes,
} from "../shared/parkingPassSlots";

type RowUpdate = {
  id: string;
  startTime: string;
  endTime: string;
};

const defaultStartTime = PARKING_PASS_MEAL_WINDOWS.breakfast.start;
const defaultEndTime = PARKING_PASS_MEAL_WINDOWS.dinner.end;
const breakfastStartMinutes = timeToMinutes(defaultStartTime) ?? 7 * 60;
const dinnerEndMinutes = timeToMinutes(defaultEndTime) ?? 21 * 60;

const parseArgs = () => {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: args.has("--dry-run") || args.has("-n"),
  };
};

const widenHours = (startTime: string, endTime: string) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return { startTime: defaultStartTime, endTime: defaultEndTime, changed: true };
  }

  const nextStartTime =
    startMinutes > breakfastStartMinutes ? defaultStartTime : startTime;
  const nextEndTime = endMinutes < dinnerEndMinutes ? defaultEndTime : endTime;

  const changed = nextStartTime !== startTime || nextEndTime !== endTime;
  return { startTime: nextStartTime, endTime: nextEndTime, changed };
};

async function run() {
  const { dryRun } = parseArgs();
  console.log(
    `[backfill:parking-pass-hours] Starting (${dryRun ? "dry-run" : "apply"})...`,
  );
  console.log(
    `[backfill:parking-pass-hours] Target window: ${defaultStartTime} → ${defaultEndTime}`,
  );

  const passEvents = await db
    .select({
      id: events.id,
      startTime: events.startTime,
      endTime: events.endTime,
      seriesId: events.seriesId,
    })
    .from(events)
    .where(and(eq(events.eventType, "parking_pass"), eq(events.requiresPayment, true)));

  const eventUpdates: RowUpdate[] = [];
  const seriesIds = new Set<string>();

  for (const row of passEvents) {
    if (row.seriesId) {
      seriesIds.add(row.seriesId);
    }
    const widened = widenHours(row.startTime, row.endTime);
    if (!widened.changed) continue;
    eventUpdates.push({ id: row.id, startTime: widened.startTime, endTime: widened.endTime });
  }

  console.log(
    `[backfill:parking-pass-hours] Events scanned: ${passEvents.length}, to update: ${eventUpdates.length}`,
  );

  if (!dryRun && eventUpdates.length > 0) {
    let updated = 0;
    for (const item of eventUpdates) {
      await db
        .update(events)
        .set({
          startTime: item.startTime,
          endTime: item.endTime,
          updatedAt: new Date(),
        })
        .where(eq(events.id, item.id));
      updated += 1;
      if (updated % 250 === 0) {
        console.log(`[backfill:parking-pass-hours] Updated ${updated} event(s)...`);
      }
    }
    console.log(`[backfill:parking-pass-hours] Updated ${updated} event(s).`);
  }

  const seriesIdList = Array.from(seriesIds);
  if (seriesIdList.length === 0) {
    console.log("[backfill:parking-pass-hours] No series found. Done.");
    return;
  }

  const seriesRows = await db
    .select({
      id: eventSeries.id,
      defaultStartTime: eventSeries.defaultStartTime,
      defaultEndTime: eventSeries.defaultEndTime,
    })
    .from(eventSeries)
    .where(inArray(eventSeries.id, seriesIdList));

  const seriesUpdates: RowUpdate[] = [];
  for (const row of seriesRows) {
    const widened = widenHours(row.defaultStartTime, row.defaultEndTime);
    if (!widened.changed) continue;
    seriesUpdates.push({ id: row.id, startTime: widened.startTime, endTime: widened.endTime });
  }

  console.log(
    `[backfill:parking-pass-hours] Series scanned: ${seriesRows.length}, to update: ${seriesUpdates.length}`,
  );

  if (!dryRun && seriesUpdates.length > 0) {
    let updated = 0;
    for (const item of seriesUpdates) {
      await db
        .update(eventSeries)
        .set({
          defaultStartTime: item.startTime,
          defaultEndTime: item.endTime,
          updatedAt: new Date(),
        })
        .where(eq(eventSeries.id, item.id));
      updated += 1;
      if (updated % 100 === 0) {
        console.log(`[backfill:parking-pass-hours] Updated ${updated} series...`);
      }
    }
    console.log(`[backfill:parking-pass-hours] Updated ${updated} series.`);
  }

  console.log("[backfill:parking-pass-hours] Done.");
}

run().catch((error) => {
  console.error("[backfill:parking-pass-hours] Failed:", error);
  process.exit(1);
});

