import { and, eq, gte, isNull, or } from "drizzle-orm";
import { db } from "./db";
import { events, hosts, users } from "@shared/schema";
import { emailService, isEmailConfigured } from "./emailService";

const hasPricing = (row: {
  breakfastPriceCents: number | null;
  lunchPriceCents: number | null;
  dinnerPriceCents: number | null;
  dailyPriceCents: number | null;
  weeklyPriceCents: number | null;
  monthlyPriceCents: number | null;
}) =>
  (row.breakfastPriceCents ?? 0) > 0 ||
  (row.lunchPriceCents ?? 0) > 0 ||
  (row.dinnerPriceCents ?? 0) > 0 ||
  (row.dailyPriceCents ?? 0) > 0 ||
  (row.weeklyPriceCents ?? 0) > 0 ||
  (row.monthlyPriceCents ?? 0) > 0;

export async function remindIncompleteParkingPassHosts() {
  if (!isEmailConfigured()) {
    console.warn("[parking-pass] Email not configured; skipping reminders");
    return { sent: 0, skipped: 0, eligible: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hostRows = await db
    .select({
      hostId: hosts.id,
      userId: hosts.userId,
      businessName: hosts.businessName,
      address: hosts.address,
      locationType: hosts.locationType,
      email: users.email,
      userType: users.userType,
    })
    .from(hosts)
    .innerJoin(users, eq(hosts.userId, users.id))
    .where(or(eq(users.isDisabled, false), isNull(users.isDisabled)));

  if (hostRows.length === 0) {
    return { sent: 0, skipped: 0, eligible: 0 };
  }

  const upcomingRows = await db
    .select({
      hostId: events.hostId,
      breakfastPriceCents: events.breakfastPriceCents,
      lunchPriceCents: events.lunchPriceCents,
      dinnerPriceCents: events.dinnerPriceCents,
      dailyPriceCents: events.dailyPriceCents,
      weeklyPriceCents: events.weeklyPriceCents,
      monthlyPriceCents: events.monthlyPriceCents,
    })
    .from(events)
    .where(and(eq(events.requiresPayment, true), gte(events.date, today)));

  const hostsWithPricing = new Set<string>();
  for (const row of upcomingRows) {
    if (hasPricing(row)) {
      hostsWithPricing.add(row.hostId);
    }
  }

  let sent = 0;
  let skipped = 0;
  let eligible = 0;

  for (const host of hostRows) {
    if (
      host.userType === "event_coordinator" ||
      host.locationType === "event_coordinator"
    ) {
      skipped += 1;
      continue;
    }
    if (hostsWithPricing.has(host.hostId)) {
      skipped += 1;
      continue;
    }
    if (!host.email) {
      skipped += 1;
      continue;
    }

    eligible += 1;
    const ok = await emailService.sendParkingPassCompletionReminder({
      email: host.email,
      businessName: host.businessName || "Your location",
      address: host.address || "",
    });
    if (ok) {
      sent += 1;
    } else {
      skipped += 1;
    }
  }

  return { sent, skipped, eligible };
}
