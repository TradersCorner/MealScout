import { db } from "./db";
import { events, eventInterests, hosts, users, telemetryEvents } from "@shared/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { emailService } from "./emailService";

export class DigestService {
  private static instance: DigestService;

  private constructor() {}

  public static getInstance(): DigestService {
    if (!DigestService.instance) {
      DigestService.instance = new DigestService();
    }
    return DigestService.instance;
  }

  async sendWeeklyDigests() {
    console.log('📧 Starting weekly digest generation...');
    
    try {
      // 1. Define time window (Next 7 days)
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      // Idempotency Key: Year + Week Number
      const weekNumber = this.getWeekNumber(now);
      const idempotencyKey = `${now.getFullYear()}-W${weekNumber}`;

      // 2. Fetch all hosts with their users
      // In a real app, we might batch this or filter by active status
      const allHosts = await db.query.hosts.findMany({
        with: {
          user: true
        }
      });

      let sentCount = 0;
      let skippedCount = 0;
      let duplicateCount = 0;

      for (const host of allHosts) {
        if (!host.user.email) continue;

        // Check Idempotency via Telemetry
        const alreadySent = await db.query.telemetryEvents.findFirst({
          where: and(
            eq(telemetryEvents.eventName, 'weekly_digest_sent'),
            eq(telemetryEvents.userId, host.userId),
            sql`properties->>'week' = ${idempotencyKey}`
          )
        });

        if (alreadySent) {
          duplicateCount++;
          continue;
        }

        // 3. Fetch upcoming events for this host
        const upcomingEvents = await db.query.events.findMany({
          where: and(
            eq(events.hostId, host.id),
            gte(events.date, now),
            lt(events.date, nextWeek)
          ),
          with: {
            interests: true
          },
          orderBy: (events, { asc }) => [asc(events.date)]
        });

        // Skip if no events (per spec: "Empty digest behavior: skip send")
        if (upcomingEvents.length === 0) {
          skippedCount++;
          continue;
        }

        // 4. Aggregate Data
        let pendingInterestCount = 0;
        const capacityAlerts: { eventName: string; date: string; accepted: number; max: number }[] = [];
        const eventSummaries: { name: string; date: string; accepted: number; max: number }[] = [];

        for (const event of upcomingEvents) {
          const interests = event.interests || [];
          const pending = interests.filter(i => i.status === 'pending').length;
          const accepted = interests.filter(i => i.status === 'accepted').length;
          
          pendingInterestCount += pending;

          eventSummaries.push({
            name: event.name || 'Event',
            date: new Date(event.date).toLocaleDateString(),
            accepted,
            max: event.maxTrucks
          });

          if (accepted >= event.maxTrucks) {
            capacityAlerts.push({
              eventName: event.name || 'Event',
              date: new Date(event.date).toLocaleDateString(),
              accepted,
              max: event.maxTrucks
            });
          }
        }

        // 5. Send Email
        await emailService.sendWeeklyDigest(host.user.email, {
          hostName: host.businessName,
          weekStart: now.toLocaleDateString(),
          weekEnd: nextWeek.toLocaleDateString(),
          events: eventSummaries,
          pendingCount: pendingInterestCount,
          capacityAlerts
        });

        // Log Telemetry (Idempotency)
        await db.insert(telemetryEvents).values({
          eventName: 'weekly_digest_sent',
          userId: host.userId,
          properties: {
            week: idempotencyKey,
            hostId: host.id,
            eventCount: upcomingEvents.length,
            pendingCount: pendingInterestCount,
            alertCount: capacityAlerts.length
          }
        });

        sentCount++;
      }

      console.log(`✅ Weekly digest complete. Sent: ${sentCount}, Skipped: ${skippedCount}, Duplicates: ${duplicateCount}`);

    } catch (error) {
      console.error('❌ Error generating weekly digests:', error);
    }
  }

  private getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}

export const digestService = DigestService.getInstance();
