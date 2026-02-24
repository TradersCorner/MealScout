import "dotenv/config";
import { pool } from "../server/db";

interface RoleCapability {
  role: string;
  canViewFood: boolean;
  canViewParking: boolean;
  canViewEvents: boolean;
  canBookParking: boolean;
  canPostEvents: boolean;
  canCreateRestaurant: boolean;
  canCreateHost: boolean;
  canAccessAdmin: boolean;
}

async function auditRoleCapabilities() {
  console.log("🔐 ROLE-BASED CAPABILITY AUDIT\n");

  try {
    if (!pool) {
      console.error("❌ No database connection");
      process.exit(1);
    }

    // Get active users by role
    console.log("📊 Active Users by Role:");
    const usersByRole = await pool.query(`
      SELECT
        user_type,
        COUNT(*)::integer as count
      FROM users
      WHERE is_disabled = false OR is_disabled IS NULL
      GROUP BY user_type
      ORDER BY count DESC
    `);

    usersByRole.rows.forEach((r: any) => {
      console.log(`  ${r.user_type || "null"}: ${r.count}`);
    });

    // Check what restaurants/hosts exist by role
    console.log("\n📊 Capabilities by Role:");

    const capabilities: RoleCapability[] = [
      {
        role: "customer",
        canViewFood: true,
        canViewParking: true,
        canViewEvents: true,
        canBookParking: true,
        canPostEvents: false,
        canCreateRestaurant: false,
        canCreateHost: false,
        canAccessAdmin: false,
      },
      {
        role: "food_truck",
        canViewFood: true,
        canViewParking: true,
        canViewEvents: true,
        canBookParking: true,
        canPostEvents: false,
        canCreateRestaurant: false,
        canCreateHost: false,
        canAccessAdmin: false,
      },
      {
        role: "restaurant_owner",
        canViewFood: true,
        canViewParking: true,
        canViewEvents: true,
        canBookParking: false,
        canPostEvents: false,
        canCreateRestaurant: true,
        canCreateHost: false,
        canAccessAdmin: false,
      },
      {
        role: "host",
        canViewFood: true,
        canViewParking: true,
        canViewEvents: true,
        canBookParking: false,
        canPostEvents: false,
        canCreateRestaurant: false,
        canCreateHost: true,
        canAccessAdmin: false,
      },
      {
        role: "event_coordinator",
        canViewFood: true,
        canViewParking: false,
        canViewEvents: true,
        canBookParking: false,
        canPostEvents: true,
        canCreateRestaurant: false,
        canCreateHost: false,
        canAccessAdmin: false,
      },
      {
        role: "staff",
        canViewFood: true,
        canViewParking: true,
        canViewEvents: true,
        canBookParking: false,
        canPostEvents: false,
        canCreateRestaurant: false,
        canCreateHost: false,
        canAccessAdmin: true,
      },
      {
        role: "admin",
        canViewFood: true,
        canViewParking: true,
        canViewEvents: true,
        canBookParking: false,
        canPostEvents: true,
        canCreateRestaurant: true,
        canCreateHost: true,
        canAccessAdmin: true,
      },
    ];

    capabilities.forEach((cap) => {
      const actions = [
        cap.canViewFood ? "view-food" : null,
        cap.canViewParking ? "view-parking" : null,
        cap.canViewEvents ? "view-events" : null,
        cap.canBookParking ? "book-parking" : null,
        cap.canPostEvents ? "post-events" : null,
        cap.canCreateRestaurant ? "create-restaurant" : null,
        cap.canCreateHost ? "create-host" : null,
        cap.canAccessAdmin ? "access-admin" : null,
      ].filter(Boolean);

      console.log(`\n  ${cap.role}:`);
      actions.forEach((a) => console.log(`    ✓ ${a}`));
    });

    // Verify users with capabilities match their active roles
    console.log("\n✅ ROLE CAPABILITY ALIGNMENT CHECK");

    // Check restaurant_owners can create restaurants
    const restOwners = await pool.query(`
      SELECT
        COUNT(DISTINCT u.id)::integer as users_with_role,
        COUNT(DISTINCT r.owner_id)::integer as users_who_own_restaurants
      FROM users u
      LEFT JOIN restaurants r ON u.id = r.owner_id
      WHERE u.user_type = 'restaurant_owner'
      AND (u.is_disabled = false OR u.is_disabled IS NULL)
    `);

    const ro = restOwners.rows[0];
    const roStatus =
      ro.users_with_role === ro.users_who_own_restaurants ? "✅" : "⚠️ ";
    console.log(
      `${roStatus} Restaurant Owners: ${ro.users_with_role} with role, ${ro.users_who_own_restaurants} own restaurants`,
    );

    // Check hosts can create hosts
    const hostUsers = await pool.query(`
      SELECT
        COUNT(DISTINCT u.id)::integer as users_with_role,
        COUNT(DISTINCT h.user_id)::integer as users_who_own_hosts
      FROM users u
      LEFT JOIN hosts h ON u.id = h.user_id
      WHERE u.user_type = 'host'
      AND (u.is_disabled = false OR u.is_disabled IS NULL)
    `);

    const hu = hostUsers.rows[0];
    const huStatus =
      hu.users_with_role === hu.users_who_own_hosts ? "✅" : "⚠️ ";
    console.log(
      `${huStatus} Hosts: ${hu.users_with_role} with role, ${hu.users_who_own_hosts} own locations`,
    );

    // Check event coordinators
    const eventCoords = await pool.query(`
      SELECT
        COUNT(DISTINCT u.id)::integer as users_with_role,
        COUNT(DISTINCT e.coordinator_user_id)::integer as users_who_posted_events
      FROM users u
      LEFT JOIN events e ON u.id = e.coordinator_user_id
      WHERE u.user_type = 'event_coordinator'
      AND (u.is_disabled = false OR u.is_disabled IS NULL)
    `);

    const ec = eventCoords.rows[0];
    const ecStatus =
      ec.users_with_role >= ec.users_who_posted_events ? "✅" : "⚠️ ";
    console.log(
      `${ecStatus} Event Coordinators: ${ec.users_with_role} with role, ${ec.users_who_posted_events} posted events`,
    );

    console.log("\n✅ AUDIT COMPLETE\n");
  } catch (error) {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  }
}

auditRoleCapabilities();
