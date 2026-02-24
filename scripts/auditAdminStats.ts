import "dotenv/config";
import { pool } from "../server/db";

async function auditAdminStats() {
  try {
    if (!pool) {
      console.error("❌ DATABASE_URL not set. Cannot audit.");
      process.exit(1);
    }

    console.log("📊 ADMIN STATS INTEGRITY AUDIT\n");

    // Query 1: User totals and role breakdown
    console.log("📊 USER COVERAGE ANALYSIS...");
    const userStats = await pool.query(`
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN is_disabled = false OR is_disabled IS NULL THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_disabled = true THEN 1 ELSE 0 END) as disabled_users
      FROM users
    `);
    console.log("Total Users:", userStats.rows[0]);

    // Query 2: Role counts
    console.log("\n📊 ROLE BREAKDOWN...");
    const roleCounts = await pool.query(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN user_type = 'customer' THEN 1 ELSE 0 END) as customer,
        SUM(CASE WHEN user_type = 'food_truck' THEN 1 ELSE 0 END) as food_truck,
        SUM(CASE WHEN user_type = 'restaurant_owner' THEN 1 ELSE 0 END) as restaurant_owner,
        SUM(CASE WHEN user_type = 'host' THEN 1 ELSE 0 END) as host,
        SUM(CASE WHEN user_type = 'event_coordinator' THEN 1 ELSE 0 END) as event_coordinator,
        SUM(CASE WHEN user_type = 'staff' THEN 1 ELSE 0 END) as staff,
        SUM(CASE WHEN user_type = 'admin' THEN 1 ELSE 0 END) as admin,
        SUM(CASE WHEN user_type = 'super_admin' THEN 1 ELSE 0 END) as super_admin,
        SUM(CASE WHEN user_type NOT IN ('customer', 'food_truck', 'restaurant_owner', 'host', 'event_coordinator', 'staff', 'admin', 'super_admin')
          OR user_type IS NULL THEN 1 ELSE 0 END) as other
      FROM users WHERE is_disabled = false OR is_disabled IS NULL
    `);
    const roles = roleCounts.rows[0];
    console.log("Role Counts:", roles);

    // Query 3: Check consistency
    const roleTotal =
      parseInt(roles.customer || 0) +
      parseInt(roles.food_truck || 0) +
      parseInt(roles.restaurant_owner || 0) +
      parseInt(roles.host || 0) +
      parseInt(roles.event_coordinator || 0) +
      parseInt(roles.staff || 0) +
      parseInt(roles.admin || 0) +
      parseInt(roles.super_admin || 0) +
      parseInt(roles.other || 0);

    const activeUsers = parseInt(userStats.rows[0].active_users || 0);
    const unclassified = Math.max(0, activeUsers - roleTotal);
    const isConsistent = roleTotal <= activeUsers;

    console.log("\n📊 CONSISTENCY CHECK...");
    console.log(`Active Users: ${activeUsers}`);
    console.log(`Role Total: ${roleTotal}`);
    console.log(`Unclassified: ${unclassified}`);
    console.log(`Status: ${isConsistent ? "✅ CONSISTENT" : "❌ MISMATCH"}`);

    // Query 4: Restaurant counts
    console.log("\n📊 RESTAURANT ANALYSIS...");
    const restaurantStats = await pool.query(`
      SELECT
        COUNT(*) as total_restaurants,
        COUNT(DISTINCT owner_id) as unique_owners,
        SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN is_verified = false OR is_verified IS NULL THEN 1 ELSE 0 END) as unverified
      FROM restaurants
    `);
    console.log("Restaurant Stats:", restaurantStats.rows[0]);

    // Query 5: Host counts
    console.log("\n📊 HOST ANALYSIS...");
    const hostStats = await pool.query(`
      SELECT
        COUNT(*) as total_hosts,
        COUNT(DISTINCT user_id) as unique_host_users,
        SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as verified_hosts,
        SUM(CASE WHEN is_verified = false OR is_verified IS NULL THEN 1 ELSE 0 END) as unverified_hosts
      FROM hosts
    `);
    console.log("Host Stats:", hostStats.rows[0]);

    // Query 6: Check for users with multiple restaurants
    console.log("\n📊 CHECKING FOR DOUBLE-COUNTS...");
    const doubleCountRestaurants = await pool.query(`
      SELECT
        owner_id,
        COUNT(*) as restaurant_count
      FROM restaurants
      GROUP BY owner_id
      HAVING COUNT(*) > 1
      LIMIT 10
    `);
    if (doubleCountRestaurants.rows.length > 0) {
      console.log(
        `⚠️  Found ${doubleCountRestaurants.rows.length} owners with multiple restaurants:`,
      );
      doubleCountRestaurants.rows.forEach((row: any) => {
        console.log(
          `   Owner ${row.owner_id}: ${row.restaurant_count} restaurants`,
        );
      });
    } else {
      console.log("✅ No owners with multiple restaurant profiles detected");
    }

    // Query 7: Check for users with multiple hosts
    const doubleCountHosts = await pool.query(`
      SELECT
        user_id,
        COUNT(*) as host_count
      FROM hosts
      GROUP BY user_id
      HAVING COUNT(*) > 1
      LIMIT 10
    `);
    if (doubleCountHosts.rows.length > 0) {
      console.log(
        `⚠️  Found ${doubleCountHosts.rows.length} users with multiple hosts:`,
      );
      doubleCountHosts.rows.forEach((row: any) => {
        console.log(`   User ${row.user_id}: ${row.host_count} hosts`);
      });
    } else {
      console.log("✅ No users with multiple host profiles detected");
    }

    // Query 8: Verify that all restaurant owners have proper roles
    console.log("\n📊 ROLE ALIGNMENT...");
    const restaurantOwnerRoleCheck = await pool.query(`
      SELECT
        u.id,
        u.user_type,
        COUNT(r.id)::integer as restaurant_count
      FROM users u
      LEFT JOIN restaurants r ON u.id = r.owner_id
      WHERE u.id IN (SELECT DISTINCT owner_id FROM restaurants)
      GROUP BY u.id, u.user_type
      ORDER BY u.user_type, restaurant_count DESC
    `);

    const byRole = restaurantOwnerRoleCheck.rows.reduce(
      (acc, row) => {
        acc[row.user_type] = (acc[row.user_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log(`✅ Restaurant Owners by Role:`);
    Object.entries(byRole)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .forEach(([role, count]) => {
        console.log(`   - ${role}: ${count}`);
      });

    const totalRestaurantUsers = parseInt(
      restaurantStats.rows[0].unique_owners || 0,
    );
    console.log(`✅ Total: ${totalRestaurantUsers} users own restaurants`);

    console.log("\n✅ AUDIT COMPLETE\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ AUDIT FAILED:", error);
    process.exit(1);
  }
}

auditAdminStats();
