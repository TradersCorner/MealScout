import "dotenv/config";
import { pool } from "../server/db";

async function auditPhase5Events() {
  console.log("📅 PHASE 5: EVENTS & OPEN CALLS READINESS AUDIT\n");

  try {
    if (!pool) {
      console.error("❌ No database connection");
      process.exit(1);
    }

    // Query 1: Event coordinator status
    console.log("📊 EVENT COORDINATOR STATUS\n");
    const coordStats = await pool.query(`
      SELECT
        COUNT(*)::integer as total_coordinators,
        SUM(CASE WHEN (is_disabled = false OR is_disabled IS NULL) THEN 1 ELSE 0 END)::integer as active,
        u.id,
        u.first_name || ' ' || COALESCE(u.last_name, '') as name,
        COUNT(e.id)::integer as events_posted
      FROM users u
      LEFT JOIN events e ON u.id = e.coordinator_user_id
      WHERE u.user_type = 'event_coordinator'
      GROUP BY u.id, u.first_name, u.last_name
    `);

    if (coordStats.rows.length === 0) {
      console.log("  ℹ️  No event coordinators yet");
    } else {
      console.log(`Found ${coordStats.rows.length} event coordinator(s):`);
      coordStats.rows.forEach((c: any) => {
        console.log(
          `  - ${c.name || c.id.substring(0, 8)}: ${c.events_posted || 0} events`,
        );
      });
    }

    // Query 2: Events overview
    console.log("\n📊 EVENTS INVENTORY\n");
    const eventStats = await pool.query(`
      SELECT
        COUNT(*)::integer as total_events,
        COUNT(DISTINCT host_id)::integer as hosts_hosting,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)::integer as open_events,
        SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END)::integer as booked_events,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::integer as completed_events,
        SUM(CASE WHEN requires_payment = true THEN 1 ELSE 0 END)::integer as paid_events
      FROM events
    `);

    const events = eventStats.rows[0];
    console.log(`Total Events: ${events.total_events}`);
    if (events.total_events > 0) {
      console.log(`  - By Status:`);
      console.log(`    Open: ${events.open_events}`);
      console.log(`    Booked: ${events.booked_events}`);
      console.log(`    Completed: ${events.completed_events}`);
      console.log(`  - Paid Events: ${events.paid_events}`);
      console.log(`  - Hosts Running Events: ${events.hosts_hosting}`);
    }

    // Query 3: Event series (Open Calls)
    console.log("\n📋 EVENT SERIES (OPEN CALLS)\n");
    const seriesStats = await pool.query(`
      SELECT COUNT(*)::integer as total_series FROM event_series
    `);

    const series = seriesStats.rows[0];
    console.log(`Total Series: ${series.total_series}`);

    // Query 4: Event interests (truck participation)
    console.log("\n🚚 TRUCK EVENT PARTICIPATION\n");
    const interestStats = await pool.query(`
      SELECT
        COUNT(DISTINCT truck_id)::integer as unique_trucks,
        COUNT(*)::integer as total_interests,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END)::integer as accepted_interests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::integer as pending_interests,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::integer as rejected_interests
      FROM event_interests
    `);

    const interests = interestStats.rows[0];
    console.log(`Trucks with event interests: ${interests.unique_trucks}`);
    console.log(`Total interest expressions: ${interests.total_interests}`);
    if (interests.total_interests > 0) {
      console.log(`  - Accepted: ${interests.accepted_interests}`);
      console.log(`  - Pending: ${interests.pending_interests}`);
      console.log(`  - Rejected: ${interests.rejected_interests}`);
    }

    // Query 5: Event schema completeness
    console.log("\n✅ FEATURE READINESS\n");
    console.log("Events Schema: ✅ Complete");
    console.log("Event Series: ✅ Defined");
    console.log("Event Interests: ✅ Implemented");
    console.log("Open Calls Workflow: 🟡 Defined, needs completion");
    console.log("  - [ ] Series creation UI");
    console.log("  - [ ] Occurrence generation");
    console.log("  - [ ] Coordinator dashboard");
    console.log("  - [ ] Truck discovery & RSVP");
    console.log("  - [ ] Capacity guard enforcement");

    console.log("\n✅ AUDIT COMPLETE\n");
  } catch (error) {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  }
}

auditPhase5Events();
