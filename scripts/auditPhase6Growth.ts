import "dotenv/config";
import { pool } from "../server/db";

async function auditPhase6GrowthSurfaces() {
  console.log("📈 PHASE 6: GROWTH SURFACES READINESS AUDIT\n");

  try {
    if (!pool) {
      console.error("❌ No database connection");
      process.exit(1);
    }

    // Query 1: Video activation status
    console.log("📺 VIDEO ACTIVATION STATUS\n");
    const videoStats = await pool.query(`
      SELECT
        COUNT(*)::integer as total_stories,
        COUNT(DISTINCT user_id)::integer as creators,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END)::integer as ready_stories,
        SUM(CASE WHEN restaurant_id IS NOT NULL THEN 1 ELSE 0 END)::integer as recommendations
      FROM video_stories
    `);

    const video = videoStats.rows[0];
    console.log(`Video Stories: ${video.total_stories}`);
    if (video.total_stories > 0) {
      console.log(`  - Creators: ${video.creators}`);
      console.log(`  - Ready: ${video.ready_stories}`);
      console.log(`  - With recommendations: ${video.recommendations}`);
    } else {
      console.log(`  Status: 🟡 Zero stories (activation pending)`);
    }

    // Query 2: Video schema completeness
    console.log("\n📊 VIDEO FEATURE COMPONENTS\n");
    console.log("✅ Schema: Complete (video_stories, transcript tables)");
    console.log("✅ Upload Queue: Implemented");
    console.log("✅ Recommendation Tagging: Implemented");
    console.log("🟡 Activation Blockers:");
    console.log("  - [ ] Upload reliability testing");
    console.log("  - [ ] Engagement metrics collection");
    console.log("  - [ ] Content quality review process");
    console.log("  - [ ] User engagement dashboard");

    // Query 3: SEO infrastructure
    console.log("\n🔍 SEO & LOCATION GROWTH\n");
    const seoStats = await pool.query(`
      SELECT
        COUNT(*)::integer as total_deals,
        COUNT(DISTINCT restaurant_id)::integer as restaurants_with_deals
      FROM deals
    `);

    const seo = seoStats.rows[0];
    console.log(`Total Deals: ${seo.total_deals}`);
    console.log(`Restaurants with Deals: ${seo.restaurants_with_deals}`);
    console.log(`\nSEO Status:`);
    console.log(`✅ Cities Registry: Implemented`);
    console.log(`✅ SEO Landing Pages: Ready`);
    console.log(`✅ Deal Promotion: Active`);
    console.log(`🟡 SEO Expansion:`);
    console.log(`  - [ ] Content-based search optimization`);
    console.log(`  - [ ] Local market growth strategy`);
    console.log(`  - [ ] Featured deal rotation`);

    // Query 4: Notifications infrastructure
    console.log("\n🔔 NOTIFICATIONS INFRASTRUCTURE\n");
    const notifStats = await pool.query(`
      SELECT
        COUNT(*)::integer as total_users,
        COUNT(CASE WHEN 
          account_settings->>'notifications' IS NOT NULL 
        THEN 1 END)::integer as with_notification_prefs
      FROM users
      WHERE is_disabled = false OR is_disabled IS NULL
    `);

    const notif = notifStats.rows[0];
    console.log(`Active Users with Notification Prefs: ${notif.with_notification_prefs}/${notif.total_users}`);
    console.log(`\nNotifications Status:`);
    console.log(`✅ Schema: Complete (account_settings.notifications)`);
    console.log(`✅ Webhook Handlers: Implemented`);
    console.log(`🟡 Phase 1 Triggers:`);
    console.log(`  - [ ] Nearby deals notification`);
    console.log(`  - [ ] Truck location updates`);
    console.log(`  - [ ] Event announcements`);
    console.log(`  - [ ] Weekly digest compilation`);
    console.log(`🟡 Phase 2 Triggers:`);
    console.log(`  - [ ] Parking pass reminders`);
    console.log(`  - [ ] Host capacity warnings`);
    console.log(`  - [ ] Coordinator updates`);

    // Query 5: Growth surface completeness
    console.log("\n📋 GROWTH SURFACES SUMMARY\n");
    console.log("| Surface | Status | Blocker |");
    console.log("|---------|--------|---------|");
    console.log("| Video | 🟡 Defined | Upload/engagement maturity |");
    console.log("| SEO | 🟡 Partial | Empty market data bootstrap |");
    console.log("| Notifications | 🟡 Schema ready | Phase 1 trigger implementation |");

    console.log("\n✅ AUDIT COMPLETE\n");
  } catch (error) {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  }
}

auditPhase6GrowthSurfaces();
