import "dotenv/config";
import { db, pool } from "../server/db";
import { hosts } from "../shared/schema";
import { eq } from "drizzle-orm";

async function consolidateDuplicateHosts() {
  console.log("🔧 CONSOLIDATING DUPLICATE HOST LOCATIONS\n");

  // Find duplicate hosts under the same user (same business_name)
  const duplicates = await pool.query(`
    SELECT 
      user_id,
      business_name,
      ARRAY_AGG(id ORDER BY created_at ASC) as host_ids,
      COUNT(*)::integer as count,
      ARRAY_AGG(address ORDER BY created_at ASC) as addresses
    FROM hosts
    GROUP BY user_id, business_name
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `);

  if (duplicates.rows.length === 0) {
    console.log("✅ No duplicate host locations found!");
    process.exit(0);
  }

  console.log(
    `Found ${duplicates.rows.length} groups of duplicates to consolidate:\n`
  );

  let totalConsolidated = 0;

  for (const group of duplicates.rows) {
    const [keepId, ...deleteIds] = group.host_ids;
    console.log(`📍 ${group.business_name} (${group.count} duplicates)`);
    console.log(`   Keeping: ${keepId}`);
    console.log(
      `   Deleting: ${deleteIds.join(", ")}`
    );

    // Delete the duplicate hosts (cascade will handle related records)
    for (const deleteId of deleteIds) {
      try {
        await db.delete(hosts).where(eq(hosts.id, deleteId));
        totalConsolidated += 1;
      } catch (error) {
        console.error(`   ❌ Failed to delete ${deleteId}:`, error);
      }
    }

    console.log();
  }

  console.log(
    `✅ CONSOLIDATION COMPLETE: ${totalConsolidated} duplicate hosts removed`
  );
  process.exit(0);
}

consolidateDuplicateHosts().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
