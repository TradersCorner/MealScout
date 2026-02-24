import "dotenv/config";
import { pool } from "../server/db";

async function investigateMultipleHosts() {
  console.log("🔍 INVESTIGATING USERS WITH MULTIPLE HOSTS\n");

  const result = await pool.query(`
    SELECT 
      u.id, 
      u.first_name || ' ' || COALESCE(u.last_name, '') as name,
      u.email,
      COUNT(h.id)::integer as host_count,
      STRING_AGG(h.id::text, ', ') as host_ids,
      STRING_AGG(h.business_name, ' | ') as host_names
    FROM users u
    JOIN hosts h ON h.user_id = u.id
    GROUP BY u.id
    HAVING COUNT(h.id) > 1
    ORDER BY host_count DESC
  `);

  console.log(`Found ${result.rows.length} users with multiple hosts:\n`);

  for (const row of result.rows) {
    console.log(`👤 ${row.name}`);
    console.log(`   Email: ${row.email}`);
    console.log(`   Hosts (${row.host_count}):`);
    const hosts = row.host_names.split(" | ");
    hosts.forEach((h, i) => console.log(`     ${i + 1}. ${h}`));
    console.log();
  }

  // Check if these are legitimate multi-location hosts
  console.log("📊 CAPACITY IMPACT ANALYSIS:\n");
  const capacityResult = await pool.query(`
    SELECT 
      u.id,
      u.first_name || ' ' || COALESCE(u.last_name, '') as name,
      COUNT(h.id)::integer as host_count,
      COALESCE(SUM(h.parking_spaces), 0)::integer as total_parking,
      COALESCE(SUM(h.parking_passes_sold), 0)::integer as total_passes_sold,
      COALESCE(SUM(h.parking_passes_available), 0)::integer as total_available
    FROM users u
    LEFT JOIN hosts h ON h.user_id = u.id
    WHERE u.id IN (
      SELECT u.id FROM users u 
      JOIN hosts h ON h.user_id = u.id
      GROUP BY u.id
      HAVING COUNT(h.id) > 1
    )
    GROUP BY u.id
    ORDER BY total_parking DESC
  `);

  capacityResult.rows.forEach((row) => {
    console.log(`${row.name}:`);
    console.log(
      `  Locations: ${row.host_count} | Total Parking: ${row.total_parking} | Passes Sold: ${row.total_passes_sold} | Available: ${row.total_available}`
    );
  });

  console.log("\n✅ ANALYSIS COMPLETE");
}

investigateMultipleHosts()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  });
