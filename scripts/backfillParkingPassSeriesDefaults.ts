import "dotenv/config";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../server/db";
import { events, eventSeries } from "../shared/schema";

const parseArgs = () => {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: args.has("--dry-run") || args.has("-n"),
    limit: args.has("--limit")
      ? Number(process.argv[process.argv.indexOf("--limit") + 1])
      : null,
  };
};

const cents = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0;
};

async function run() {
  const { dryRun, limit } = parseArgs();
  console.log(
    `[backfill:parking-pass-series] Starting (${dryRun ? "dry-run" : "apply"})...`,
  );

  const seriesIds = await db
    .selectDistinct({ seriesId: events.seriesId })
    .from(events)
    .where(
      and(
        eq(events.eventType, "parking_pass"),
        eq(events.requiresPayment, true),
        isNotNull(events.seriesId),
      ),
    )
    .then((rows) => rows.map((row) => row.seriesId).filter(Boolean) as string[]);

  const sliced = typeof limit === "number" && Number.isFinite(limit) ? seriesIds.slice(0, limit) : seriesIds;
  console.log(
    `[backfill:parking-pass-series] Series found: ${seriesIds.length}${sliced.length !== seriesIds.length ? ` (processing ${sliced.length})` : ""}`,
  );

  let updated = 0;
  let skipped = 0;

  for (const seriesId of sliced) {
    const [series] = await db
      .select()
      .from(eventSeries)
      .where(eq(eventSeries.id, seriesId))
      .limit(1);
    if (!series) {
      skipped += 1;
      continue;
    }

    const recent = await db
      .select({
        date: events.date,
        breakfastPriceCents: events.breakfastPriceCents,
        lunchPriceCents: events.lunchPriceCents,
        dinnerPriceCents: events.dinnerPriceCents,
        dailyPriceCents: events.dailyPriceCents,
        weeklyPriceCents: events.weeklyPriceCents,
        monthlyPriceCents: events.monthlyPriceCents,
        maxTrucks: events.maxTrucks,
        hardCapEnabled: events.hardCapEnabled,
        startTime: events.startTime,
        endTime: events.endTime,
        updatedAt: events.updatedAt,
      })
      .from(events)
      .where(and(eq(events.seriesId, seriesId), eq(events.eventType, "parking_pass"), eq(events.requiresPayment, true)))
      .orderBy(desc(events.date))
      .limit(120);

    if (recent.length === 0) {
      skipped += 1;
      continue;
    }

    const daySet = new Set<number>();
    for (const row of recent) {
      daySet.add(new Date(row.date).getDay());
    }
    const daysOfWeek = Array.from(daySet.values()).sort((a, b) => a - b);

    const bestPricingRow =
      recent.find(
        (row) =>
          cents(row.breakfastPriceCents) > 0 ||
          cents(row.lunchPriceCents) > 0 ||
          cents(row.dinnerPriceCents) > 0 ||
          cents(row.dailyPriceCents) > 0 ||
          cents(row.weeklyPriceCents) > 0 ||
          cents(row.monthlyPriceCents) > 0,
      ) ?? recent[0];

    const breakfast = cents(bestPricingRow.breakfastPriceCents);
    const lunch = cents(bestPricingRow.lunchPriceCents);
    const dinner = cents(bestPricingRow.dinnerPriceCents);
    const hostPrice = breakfast + lunch + dinner;

    const nextValues: Record<string, any> = {
      seriesType: "parking_pass",
      parkingPassDaysOfWeek: daysOfWeek,
      defaultBreakfastPriceCents: breakfast,
      defaultLunchPriceCents: lunch,
      defaultDinnerPriceCents: dinner,
      defaultDailyPriceCents: cents(bestPricingRow.dailyPriceCents) || hostPrice,
      defaultWeeklyPriceCents: cents(bestPricingRow.weeklyPriceCents) || hostPrice * 7,
      defaultMonthlyPriceCents: cents(bestPricingRow.monthlyPriceCents) || hostPrice * 30,
      defaultHostPriceCents: hostPrice,
      defaultMaxTrucks: Number(bestPricingRow.maxTrucks ?? series.defaultMaxTrucks ?? 1) || 1,
      defaultHardCapEnabled: Boolean(bestPricingRow.hardCapEnabled ?? series.defaultHardCapEnabled),
      defaultStartTime: String(bestPricingRow.startTime || series.defaultStartTime),
      defaultEndTime: String(bestPricingRow.endTime || series.defaultEndTime),
      updatedAt: new Date(),
    };

    const alreadyParkingPass = series.seriesType === "parking_pass";
    const alreadyHasDefaults =
      (series.defaultHostPriceCents ?? 0) > 0 ||
      (series.defaultDailyPriceCents ?? 0) > 0 ||
      (series.defaultWeeklyPriceCents ?? 0) > 0 ||
      (series.defaultMonthlyPriceCents ?? 0) > 0;

    if (alreadyParkingPass && alreadyHasDefaults) {
      skipped += 1;
      continue;
    }

    if (!dryRun) {
      await db.update(eventSeries).set(nextValues).where(eq(eventSeries.id, seriesId));
    }

    updated += 1;
  }

  console.log(
    `[backfill:parking-pass-series] Done. Updated ${updated}, skipped ${skipped}.`,
  );
}

run().catch((error) => {
  console.error("[backfill:parking-pass-series] Failed:", error);
  process.exit(1);
});

