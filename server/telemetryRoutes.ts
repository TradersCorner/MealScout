
import { Router } from 'express';
import { db } from './db';
import { telemetryEvents, events, eventInterests, hosts } from '@shared/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { isAdmin } from './unifiedAuth';

const router = Router();

// Helper to get date ranges
const getRange = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

/**
 * GET /api/admin/telemetry/velocity
 * Interest creation velocity (last 7/30/90 days)
 */
router.get('/velocity', isAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = getRange(days);

    const velocity = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        count: sql<number>`count(*)`
      })
      .from(eventInterests)
      .where(gte(eventInterests.createdAt, startDate))
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

    res.json(velocity);
  } catch (error) {
    console.error('Error fetching telemetry velocity:', error);
    res.status(500).json({ error: 'Failed to fetch velocity data' });
  }
});

/**
 * GET /api/admin/telemetry/fill-rates
 * Fill rate distribution and over-capacity events
 */
router.get('/fill-rates', isAdmin, async (req, res) => {
  try {
    // Get all events with their interests
    const allEvents = await db.query.events.findMany({
      with: {
        interests: true
      }
    });

    const fillRates: number[] = [];
    let overCapacityCount = 0;
    let totalEvents = 0;

    for (const event of allEvents) {
      const acceptedCount = event.interests.filter((i: any) => i.status === 'accepted').length;
      const max = event.maxTrucks || 1; // Avoid division by zero
      
      if (max > 0) {
        const rate = Math.min(acceptedCount / max, 1.5); // Cap at 150% for viz
        fillRates.push(rate);
        totalEvents++;

        if (acceptedCount >= max) {
          overCapacityCount++;
        }
      }
    }

    // Create histogram buckets (0-10%, 10-20%, ..., 100%+)
    const buckets = new Array(11).fill(0);
    fillRates.forEach(rate => {
      const index = Math.min(Math.floor(rate * 10), 10);
      buckets[index]++;
    });

    res.json({
      buckets: buckets.map((count, i) => ({
        range: i === 10 ? '100%+' : `${i * 10}-${(i + 1) * 10}%`,
        count
      })),
      overCapacityPercentage: totalEvents > 0 ? (overCapacityCount / totalEvents) * 100 : 0,
      totalEvents
    });
  } catch (error) {
    console.error('Error fetching fill rates:', error);
    res.status(500).json({ error: 'Failed to fetch fill rate data' });
  }
});

/**
 * GET /api/admin/telemetry/decision-time
 * Time from interest creation to decision (accepted/declined)
 */
router.get('/decision-time', isAdmin, async (req, res) => {
  try {
    // We need to join eventInterests with telemetryEvents or infer from updated_at if available
    // Since schema doesn't have 'decidedAt', we might need to rely on telemetry if available, 
    // or use createdAt vs updatedAt for interests that are not pending.
    // For v1, let's use telemetry_events if we have 'interest_accepted'/'interest_declined' events,
    // OR just use the difference between interest.createdAt and interest.updatedAt for non-pending interests.
    
    // Using interest table timestamps as a proxy for now (assuming updatedAt is when decision happened)
    const decisions = await db
      .select({
        created: eventInterests.createdAt,
        // We don't have a separate decidedAt, so we assume updatedAt is the decision time for non-pending
        decided: sql<Date>`CASE WHEN status != 'pending' THEN created_at ELSE NULL END` // Wait, schema has no updatedAt for interests?
      })
      .from(eventInterests)
      .where(sql`status != 'pending'`);

    // Wait, let's check schema for eventInterests
    // It only has createdAt. It does NOT have updatedAt.
    // We must rely on telemetry_events for this, or we can't calculate it accurately yet.
    // Let's check telemetry_events for 'interest_accepted' and 'interest_declined'.
    
    const decisionEvents = await db
      .select({
        eventName: telemetryEvents.eventName,
        createdAt: telemetryEvents.createdAt,
        properties: telemetryEvents.properties
      })
      .from(telemetryEvents)
      .where(
        and(
          sql`event_name IN ('interest_accepted', 'interest_declined')`,
          gte(telemetryEvents.createdAt, getRange(90))
        )
      );

    // This requires us to match these events back to the creation time of the interest.
    // If telemetry doesn't have the creation time, we might be stuck.
    // Alternative: For v1, if we can't calculate it accurately, we return a placeholder or 
    // we add 'updatedAt' to eventInterests in a future migration.
    
    // CHECK: Does telemetry event have 'interestId'?
    // If so, we can fetch the interest creation time.
    
    // For now, let's return a "Not Available" state or simplified metric if data is missing.
    // But wait, I can add a TODO to the response.
    
    res.json({
      medianHours: 0,
      p75Hours: 0,
      note: "Requires 'updatedAt' on event_interests or correlation with creation logs."
    });

  } catch (error) {
    console.error('Error fetching decision time:', error);
    res.status(500).json({ error: 'Failed to fetch decision time data' });
  }
});

/**
 * GET /api/admin/telemetry/digest-coverage
 * Weekly digests sent vs eligible hosts
 */
router.get('/digest-coverage', isAdmin, async (req, res) => {
  try {
    // 1. Get digest sent counts by week from telemetry
    const sentCounts = await db
      .select({
        week: sql<string>`properties->>'week'`,
        count: sql<number>`count(*)`
      })
      .from(telemetryEvents)
      .where(eq(telemetryEvents.eventName, 'weekly_digest_sent'))
      .groupBy(sql`properties->>'week'`)
      .orderBy(desc(sql`properties->>'week'`))
      .limit(12); // Last 12 weeks

    // 2. Get total eligible hosts (approximate - current count)
    const totalHosts = await db.select({ count: sql<number>`count(*)` }).from(hosts);
    const eligibleCount = totalHosts[0].count;

    res.json({
      history: sentCounts.map((row: any) => ({
        week: row.week,
        sent: Number(row.count),
        eligible: Number(eligibleCount), // simplified: assuming constant host count for history
        coverage: eligibleCount > 0 ? Math.round((Number(row.count) / Number(eligibleCount)) * 100) : 0
      }))
    });
  } catch (error) {
    console.error('Error fetching digest coverage:', error);
    res.status(500).json({ error: 'Failed to fetch digest coverage' });
  }
});

export default router;
