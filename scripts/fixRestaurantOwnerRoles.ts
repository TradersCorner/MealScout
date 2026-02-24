import "dotenv/config";
import { db, pool } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fixRestaurantOwnerRoles() {
  try {
    if (!pool) {
      console.error("❌ DATABASE_URL not set.");
      process.exit(1);
    }

    console.log("🔧 FIXING RESTAURANT OWNER ROLE ASSIGNMENTS\n");

    // Find all owners who have restaurants but don't have the restaurant_owner role
    const result = await pool.query(`
      SELECT DISTINCT r.owner_id
      FROM restaurants r
      LEFT JOIN users u ON r.owner_id = u.id AND u.user_type = 'restaurant_owner'
      WHERE u.id IS NULL
      ORDER BY r.owner_id
    `);

    const ownerIds = result.rows.map((row: any) => row.owner_id);

    if (ownerIds.length === 0) {
      console.log("✅ All restaurant owners already have correct role assigned!");
      process.exit(0);
    }

    console.log(`Found ${ownerIds.length} restaurant owners missing the restaurant_owner role:`);
    ownerIds.forEach((id: string) => console.log(`  - ${id}`));
    console.log();

    // Update these users to have restaurant_owner role
    let updated = 0;
    let failed = 0;

    for (const ownerId of ownerIds) {
      try {
        await db
          .update(users)
          .set({
            userType: "restaurant_owner",
            updatedAt: new Date(),
          })
          .where(eq(users.id, ownerId));

        console.log(`✅ Updated ${ownerId}`);
        updated += 1;
      } catch (error) {
        console.error(`❌ Failed to update ${ownerId}:`, error);
        failed += 1;
      }
    }

    console.log(`\n✅ ROLE ASSIGNMENT COMPLETE: ${updated} updated, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ FAILED:", error);
    process.exit(1);
  }
}

fixRestaurantOwnerRoles();
