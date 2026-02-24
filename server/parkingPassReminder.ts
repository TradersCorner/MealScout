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

export type ParkingPassOnboardingQueueItem = {
  hostId: string;
  userId: string;
  businessName: string | null;
  address: string | null;
  email: string | null;
  locationType: string | null;
  pricingReady: boolean;
  stripeReady: boolean;
  needsPricing: boolean;
  needsStripe: boolean;
  priority: "high" | "medium";
};

const isHostExcluded = (host: {
  userType: string | null;
  locationType: string | null;
}) =>
  host.userType === "event_coordinator" ||
  host.locationType === "event_coordinator";

async function buildOnboardingQueueInternal() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hostRows = await db
    .select({
      hostId: hosts.id,
      userId: hosts.userId,
      businessName: hosts.businessName,
      address: hosts.address,
      locationType: hosts.locationType,
      stripeConnectAccountId: hosts.stripeConnectAccountId,
      stripeChargesEnabled: hosts.stripeChargesEnabled,
      stripePayoutsEnabled: hosts.stripePayoutsEnabled,
      stripeOnboardingCompleted: hosts.stripeOnboardingCompleted,
      email: users.email,
      userType: users.userType,
    })
    .from(hosts)
    .innerJoin(users, eq(hosts.userId, users.id))
    .where(or(eq(users.isDisabled, false), isNull(users.isDisabled)));

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
    if (hasPricing(row)) hostsWithPricing.add(row.hostId);
  }

  const queue: ParkingPassOnboardingQueueItem[] = [];
  for (const host of hostRows) {
    if (isHostExcluded(host)) continue;

    const pricingReady = hostsWithPricing.has(host.hostId);
    const stripeReady = Boolean(
      host.stripeConnectAccountId &&
      host.stripeChargesEnabled &&
      host.stripePayoutsEnabled &&
      host.stripeOnboardingCompleted,
    );
    const needsPricing = !pricingReady;
    const needsStripe = !stripeReady;
    if (!needsPricing && !needsStripe) continue;

    queue.push({
      hostId: host.hostId,
      userId: host.userId,
      businessName: host.businessName,
      address: host.address,
      email: host.email,
      locationType: host.locationType,
      pricingReady,
      stripeReady,
      needsPricing,
      needsStripe,
      priority: needsStripe ? "high" : "medium",
    });
  }

  queue.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
    const aName = String(a.businessName || "").toLowerCase();
    const bName = String(b.businessName || "").toLowerCase();
    return aName.localeCompare(bName);
  });

  return queue;
}

export async function getParkingPassOnboardingQueue() {
  const queue = await buildOnboardingQueueInternal();
  return {
    total: queue.length,
    highPriority: queue.filter((item) => item.priority === "high").length,
    mediumPriority: queue.filter((item) => item.priority === "medium").length,
    items: queue,
  };
}

export async function sendParkingPassReminderForHost(hostId: string) {
  const normalizedHostId = String(hostId || "").trim();
  if (!normalizedHostId) {
    return {
      ok: false,
      code: "invalid_host_id",
      message: "Host ID is required",
    };
  }

  if (!isEmailConfigured()) {
    return {
      ok: false,
      code: "email_not_configured",
      message: "Email provider is not configured",
    };
  }

  const queue = await buildOnboardingQueueInternal();
  const item = queue.find((entry) => entry.hostId === normalizedHostId);
  if (!item) {
    return {
      ok: false,
      code: "not_eligible",
      message: "Host is not in onboarding queue",
    };
  }

  if (!item.email) {
    return {
      ok: false,
      code: "missing_email",
      message: "Host owner has no email address",
    };
  }

  const sent = await emailService.sendParkingPassCompletionReminder({
    email: item.email,
    businessName: item.businessName || "Your location",
    address: item.address || "",
  });

  if (!sent) {
    return {
      ok: false,
      code: "send_failed",
      message: "Reminder email failed to send",
    };
  }

  return {
    ok: true,
    code: "sent",
    message: "Reminder sent",
    host: {
      hostId: item.hostId,
      businessName: item.businessName,
      email: item.email,
      needsPricing: item.needsPricing,
      needsStripe: item.needsStripe,
      priority: item.priority,
    },
  };
}

export async function remindIncompleteParkingPassHosts() {
  if (!isEmailConfigured()) {
    console.warn("[parking-pass] Email not configured; skipping reminders");
    return { sent: 0, skipped: 0, eligible: 0 };
  }

  const queue = await buildOnboardingQueueInternal();
  if (queue.length === 0) {
    return {
      sent: 0,
      skipped: 0,
      eligible: 0,
      pricingIncomplete: 0,
      stripeIncomplete: 0,
    };
  }

  let sent = 0;
  let skipped = 0;
  let eligible = 0;
  const pricingIncomplete = queue.filter((item) => item.needsPricing).length;
  const stripeIncomplete = queue.filter((item) => item.needsStripe).length;

  for (const item of queue) {
    if (!item.email) {
      skipped += 1;
      continue;
    }

    eligible += 1;
    const ok = await emailService.sendParkingPassCompletionReminder({
      email: item.email,
      businessName: item.businessName || "Your location",
      address: item.address || "",
    });
    if (ok) {
      sent += 1;
    } else {
      skipped += 1;
    }
  }

  return {
    sent,
    skipped,
    eligible,
    pricingIncomplete,
    stripeIncomplete,
  };
}
