import "dotenv/config";
import { pool } from "../server/db";

async function investigateAnomalousOwner() {
  const ownerId = "d6910fa9-2a02-4ba5-b604-69b9191864bf";

  console.log("🔍 INVESTIGATING ANOMALOUS OWNER DATA\n");

  // Get owner details
  const ownerResult = await pool.query(
    `SELECT id, name, email, phone, created_at FROM users WHERE id = $1`,
    [ownerId],
  );

  if (ownerResult.rows.length === 0) {
    console.log("❌ Owner not found");
    process.exit(1);
  }

  const owner = ownerResult.rows[0];
  console.log("Owner Details:");
  console.log(`  ID: ${owner.id}`);
  console.log(`  Name: ${owner.name}`);
  console.log(`  Email: ${owner.email}`);
  console.log(`  Phone: ${owner.phone}`);
  console.log(`  Created: ${owner.created_at}`);

  // Get restaurant details - sample first 10 and last 10
  console.log("\n📊 First 10 restaurants:");
  const firstResult = await pool.query(
    `
    SELECT id, name, location, location_coords, created_at
    FROM restaurants
    WHERE owner_id = $1
    ORDER BY created_at ASC
    LIMIT 10
    `,
    [ownerId],
  );

  firstResult.rows.forEach((r, i) => {
    console.log(
      `  ${String(i + 1).padStart(2, " ")}. ${r.name} | ${r.location} | ${r.created_at.toISOString().split("T")[0]}`,
    );
  });

  console.log("\n📊 Last 10 restaurants:");
  const lastResult = await pool.query(
    `
    SELECT id, name, location, location_coords, created_at
    FROM restaurants
    WHERE owner_id = $1
    ORDER BY created_at DESC
    LIMIT 10
    `,
    [ownerId],
  );

  lastResult.rows.forEach((r, i) => {
    console.log(
      `  ${String(i + 1).padStart(2, " ")}. ${r.name} | ${r.location} | ${r.created_at.toISOString().split("T")[0]}`,
    );
  });

  // Check for duplicates
  console.log("\n🔎 Checking for duplicate restaurants:");
  const dupResult = await pool.query(
    `
    SELECT name, COUNT(*)::integer as count, STRING_AGG(id::text, ', ') as ids
    FROM restaurants
    WHERE owner_id = $1
    GROUP BY name
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 20
    `,
    [ownerId],
  );

  if (dupResult.rows.length === 0) {
    console.log("  No duplicate restaurant names found");
  } else {
    console.log(`  Found ${dupResult.rows.length} duplicate names:`);
    dupResult.rows.forEach((r) => {
      console.log(`    - "${r.name}": ${r.count} instances`);
    });
  }

  // Check for similar names
  console.log("\n🔍 Sample of unique restaurant names (first 20):");
  const namesResult = await pool.query(
    `
    SELECT DISTINCT name
    FROM restaurants
    WHERE owner_id = $1
    ORDER BY name
    LIMIT 20
    `,
    [ownerId],
  );

  namesResult.rows.forEach((r, i) => {
    console.log(`  ${String(i + 1).padStart(2, " ")}. ${r.name}`);
  });

  console.log("\n📈 SUMMARY:");
  console.log(
    `  Total restaurants: ${firstResult.rowCount + lastResult.rowCount > 1000 ? "~1000+" : "?"}`,
  );
  const totalResult = await pool.query(
    `SELECT COUNT(*)::integer as count FROM restaurants WHERE owner_id = $1`,
    [ownerId],
  );
  console.log(`  Verified total: ${totalResult.rows[0].count}`);
  console.log(
    `  Duplicate names: ${dupResult.rows.length > 0 ? dupResult.rows.length : "None detected"}`,
  );

  console.log("\n⚠️  RECOMMENDATION:");
  console.log("  If this appears to be an import error or test data:");
  console.log(`  1. Verify with owner before taking action`);
  console.log(`  2. Consider archiving as 'historical' import`);
  console.log(`  3. Or delete duplicates leaving only active restaurants`);
}

investigateAnomalousOwner()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  });
