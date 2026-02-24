import "dotenv/config";
import { pool } from "../server/db";

async function checkRoleStatus() {
  // Check which users have restaurants
  const restaurantUsers = await pool.query(`
    SELECT DISTINCT owner_id as user_id
    FROM restaurants
    ORDER BY owner_id
  `);

  console.log("🔍 ROLE STATUS CHECK\n");
  console.log(`Total users with restaurants: ${restaurantUsers.rows.length}\n`);

  // Check their actual role
  const roles = await pool.query(`
    SELECT u.id, u.first_name, u.user_type, COUNT(r.id)::integer as restaurant_count
    FROM users u
    LEFT JOIN restaurants r ON r.owner_id = u.id
    WHERE u.id IN (${restaurantUsers.rows.map((r) => `'${r.user_id}'`).join(",")})
    GROUP BY u.id, u.first_name, u.user_type
    ORDER BY restaurant_count DESC
  `);

  console.log("User Roles:");
  roles.rows.forEach((r) => {
    const roleStatus = r.user_type === "restaurant_owner" ? "✅" : "❌";
    console.log(
      `${roleStatus} ${r.first_name || r.id.substring(0, 8)}: ${r.user_type} | ${r.restaurant_count} restaurants`,
    );
  });

  // Count by role
  const roleCounts = roles.rows.reduce(
    (acc, r) => {
      acc[r.user_type] = (acc[r.user_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log("\n📊 Role Summary:");
  Object.entries(roleCounts).forEach(([role, count]) => {
    console.log(`  ${role}: ${count}`);
  });
}

checkRoleStatus()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  });
