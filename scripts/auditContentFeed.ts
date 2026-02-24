import "dotenv/config";
import { pool } from "../server/db";

async function auditContentFeed() {
  console.log("📺 CONTENT & FEED BEHAVIOR AUDIT\n");

  try {
    // Query 1: Video story counts
    console.log("📊 VIDEO STORY COUNTS...");
    const storyStats = await pool.query(`
      SELECT
        COUNT(*) as total_stories,
        COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_stories,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_stories,
        COUNT(CASE WHEN status != 'ready' AND status != 'draft' THEN 1 END) as other_status,
        COUNT(CASE WHEN restaurant_id IS NOT NULL THEN 1 END) as tagged_stories,
        COUNT(CASE WHEN restaurant_id IS NULL THEN 1 END) as untagged_stories
      FROM video_stories
    `);
    const stories = storyStats.rows[0];
    console.log(`  Total stories: ${stories.total_stories}`);
    console.log(`    - Ready: ${stories.ready_stories}`);
    console.log(`    - Draft: ${stories.draft_stories}`);
    console.log(`    - Other: ${stories.other_status}`);
    console.log(`    - Tagged (recommendations): ${stories.tagged_stories}`);
    console.log(`    - Untagged: ${stories.untagged_stories}`);

    // Query 2: Recommendation count alignment
    console.log("\n📊 RECOMMENDATION COUNT ALIGNMENT...");
    const recsAlignment = await pool.query(`
      SELECT
        u.id,
        u.first_name || ' ' || COALESCE(u.last_name, '') as name,
        u.recommendation_count as db_count,
        COUNT(CASE WHEN v.status = 'ready' AND v.restaurant_id IS NOT NULL THEN 1 END)::integer as actual_count
      FROM users u
      LEFT JOIN video_stories v ON v.user_id = u.id
      WHERE u.id IN (
        SELECT DISTINCT user_id FROM video_stories WHERE restaurant_id IS NOT NULL
      )
      GROUP BY u.id, u.first_name, u.last_name, u.recommendation_count
      HAVING COUNT(CASE WHEN v.status = 'ready' AND v.restaurant_id IS NOT NULL THEN 1 END) > 0
      ORDER BY actual_count DESC
      LIMIT 10
    `);

    if (recsAlignment.rows.length === 0) {
      console.log("  ✅ No users with recommendations yet");
    } else {
      console.log(`  Top recommendation users:`);
      let mismatches = 0;
      recsAlignment.rows.forEach((r) => {
        const status = r.db_count === r.actual_count ? "✅" : "❌";
        console.log(
          `  ${status} ${r.name || r.id.substring(0, 8)}: DB=${r.db_count}, Actual=${r.actual_count}`
        );
        if (r.db_count !== r.actual_count) mismatches += 1;
      });
      if (mismatches > 0) {
        console.log(`  ⚠️  Found ${mismatches} recommendation count mismatches`);
      }
    }

    // Query 3: Story status distribution
    console.log("\n📊 STORY STATUS BREAKDOWN...");
    const statusBreakdown = await pool.query(`
      SELECT
        status,
        COUNT(*)::integer as count,
        COUNT(CASE WHEN restaurant_id IS NOT NULL THEN 1 END)::integer as tagged
      FROM video_stories
      GROUP BY status
      ORDER BY count DESC
    `);

    statusBreakdown.rows.forEach((r) => {
      console.log(`  ${r.status}: ${r.count} total (${r.tagged} tagged)`);
    });

    // Query 4: Users with viewer influence
    console.log("\n📊 GOLDEN FORK CANDIDATE ANALYSIS...");
    const goldenForkCandidates = await pool.query(`
      SELECT
        u.id,
        u.first_name || ' ' || COALESCE(u.last_name, '') as name,
        COUNT(CASE WHEN v.status = 'ready' AND v.restaurant_id IS NOT NULL THEN 1 END)::integer as recommendation_count,
        u.has_golden_fork,
        u.golden_fork_earned_at
      FROM users u
      LEFT JOIN video_stories v ON v.user_id = u.id
      WHERE u.user_type = 'customer'
      GROUP BY u.id, u.first_name, u.last_name, u.has_golden_fork, u.golden_fork_earned_at
      HAVING COUNT(CASE WHEN v.status = 'ready' AND v.restaurant_id IS NOT NULL THEN 1 END) >= 5
      ORDER BY recommendation_count DESC
      LIMIT 5
    `);

    if (goldenForkCandidates.rows.length === 0) {
      console.log("  ℹ️  No users with 5+ recommendations yet");
    } else {
      console.log(`  Potential Golden Fork holders (5+ recommendations):`);
      goldenForkCandidates.rows.forEach((r) => {
        const status = r.has_golden_fork ? "✅" : "🔲";
        console.log(
          `  ${status} ${r.name || r.id.substring(0, 8)}: ${r.recommendation_count} recommendations`
        );
      });
    }

    // Query 5: Daily upload activity check
    console.log("\n📊 STORY UPLOAD LIMITS (Last 24H)...");
    const uploadActivity = await pool.query(`
      SELECT
        u.id,
        u.first_name || ' ' || COALESCE(u.last_name, '') as name,
        COUNT(*)::integer as stories_in_24h,
        COUNT(CASE WHEN v.created_at > NOW() - INTERVAL '1 hour' THEN 1 END)::integer as stories_in_1h
      FROM users u
      LEFT JOIN video_stories v ON v.user_id = u.id
      WHERE v.created_at > NOW() - INTERVAL '24 hours'
      AND u.id IN (
        SELECT DISTINCT user_id FROM video_stories
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY user_id
        HAVING COUNT(*) > 0
      )
      GROUP BY u.id, u.first_name, u.last_name
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `);

    if (uploadActivity.rows.length === 0) {
      console.log("  ℹ️  No recent upload activity");
    } else {
      console.log(`  Users with recent uploads:`);
      uploadActivity.rows.forEach((r) => {
        const status = r.stories_in_24h > 10 ? "⚠️ " : "ℹ️ ";
        console.log(
          `  ${status}${r.name || r.id.substring(0, 8)}: ${r.stories_in_24h}/24h, ${r.stories_in_1h} in last hour`
        );
      });
    }

    // Query 6: Auto-published/ready stories by restaurant
    console.log("\n📊 FEED VISIBILITY (Ready Stories by Restaurant)...");
    const restaurantFeed = await pool.query(`
      SELECT
        r.id,
        r.name,
        COUNT(v.id)::integer as ready_recommendations,
        COUNT(CASE WHEN v.created_at > NOW() - INTERVAL '7 days' THEN 1 END)::integer as recommendations_7d
      FROM restaurants r
      LEFT JOIN video_stories v ON v.restaurant_id = r.id AND v.status = 'ready'
      WHERE v.id IS NOT NULL
      GROUP BY r.id, r.name
      ORDER BY ready_recommendations DESC
      LIMIT 5
    `);

    if (restaurantFeed.rows.length === 0) {
      console.log("  ℹ️  No restaurants with recommendations in feed yet");
    } else {
      console.log(`  Top restaurants by recommendation count:`);
      restaurantFeed.rows.forEach((r) => {
        console.log(
          `    ${r.name}: ${r.ready_recommendations} ready, ${r.recommendations_7d} in last 7 days`
        );
      });
    }

    console.log("\n✅ AUDIT COMPLETE\n");
  } catch (error) {
    console.error("❌ AUDIT FAILED:", error);
    process.exit(1);
  }
}

auditContentFeed();
