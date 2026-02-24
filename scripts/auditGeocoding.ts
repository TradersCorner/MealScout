import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, pool } from "../server/db";
import { hosts, userAddresses, users } from "../shared/schema";

async function auditGeocodeCoverage() {
  try {
    if (!pool) {
      console.error("❌ DATABASE_URL not set. Cannot run audit.");
      process.exit(1);
    }

    console.log("🗺️ MAP & GEOCODE INTEGRITY AUDIT\n");

    // Query 1: Primary hosts with addresses
    console.log("📊 QUERYING HOST COVERAGE...");
    const hostStats = await pool.query(`
      SELECT
        COUNT(*) AS total_hosts,
        SUM(CASE WHEN address IS NOT NULL THEN 1 ELSE 0 END) as hosts_with_address,
        SUM(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 ELSE 0 END) as hosts_with_coords,
        SUM(CASE WHEN address IS NOT NULL AND (latitude IS NULL OR longitude IS NULL) THEN 1 ELSE 0 END) as hosts_missing_coords,
        SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as verified_hosts,
        SUM(CASE WHEN is_verified = true AND address IS NOT NULL THEN 1 ELSE 0 END) as verified_with_address,
        SUM(CASE WHEN is_verified = true AND latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 ELSE 0 END) as verified_with_coords
      FROM hosts
    `);
    console.log("Hosts:", hostStats.rows[0]);

    // Query 2: Secondary addresses
    console.log("\n📊 QUERYING SECONDARY ADDRESSES...");
    const secondaryStats = await pool.query(`
      SELECT
        COUNT(ua.id) AS total_secondary_addresses,
        SUM(CASE WHEN ua.address IS NOT NULL THEN 1 ELSE 0 END) as secondary_with_address,
        SUM(CASE WHEN ua.latitude IS NOT NULL AND ua.longitude IS NOT NULL THEN 1 ELSE 0 END) as secondary_with_coords,
        SUM(CASE WHEN ua.address IS NOT NULL AND (ua.latitude IS NULL OR ua.longitude IS NULL) THEN 1 ELSE 0 END) as secondary_missing_coords,
        COUNT(DISTINCT ua.user_id) as unique_host_users_with_addresses
      FROM user_addresses ua
      INNER JOIN users u ON ua.user_id = u.id
      WHERE u.id IN (SELECT DISTINCT user_id FROM hosts WHERE is_verified = true)
    `);
    console.log("Secondary Addresses:", secondaryStats.rows[0]);

    // Query 3: Hosts missing coordinates with addresses
    console.log("\n📊 HOSTS WITH ADDRESSES BUT NO COORDINATES...");
    const hostsMissingCoords = await pool.query(`
      SELECT
        id,
        user_id,
        business_name,
        address,
        city,
        state,
        is_verified,
        created_at
      FROM hosts
      WHERE address IS NOT NULL
        AND (latitude IS NULL OR longitude IS NULL)
        AND is_verified = true
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log(
      `Found ${hostsMissingCoords.rows.length} hosts missing coordinates:`,
    );
    hostsMissingCoords.rows.forEach((host: any) => {
      console.log(`  - ${host.business_name} (${host.city}, ${host.state})`);
    });

    // Query 4: Secondary addresses missing coordinates
    console.log(
      "\n📊 SECONDARY ADDRESSES WITH ADDRESSES BUT NO COORDINATES...",
    );
    const secondaryMissingCoords = await pool.query(`
      SELECT
        ua.id,
        ua.user_id,
        ua.label,
        ua.address,
        ua.city,
        ua.state,
        h.business_name as host_name,
        ua.created_at
      FROM user_addresses ua
      INNER JOIN users u ON ua.user_id = u.id
      LEFT JOIN hosts h ON h.user_id = u.id AND h.is_verified = true
      WHERE ua.address IS NOT NULL
        AND (ua.latitude IS NULL OR ua.longitude IS NULL)
        AND u.id IN (SELECT DISTINCT user_id FROM hosts WHERE is_verified = true)
      ORDER BY ua.created_at DESC
      LIMIT 10
    `);
    console.log(
      `Found ${secondaryMissingCoords.rows.length} secondary addresses missing coordinates:`,
    );
    secondaryMissingCoords.rows.forEach((addr: any) => {
      console.log(
        `  - ${addr.label} for ${addr.host_name || "(host)"} (${addr.city}, ${addr.state})`,
      );
    });

    // Query 5: Coordinate quality check
    console.log("\n📊 COORDINATE QUALITY CHECK...");
    const coordQuality = await pool.query(`
      SELECT
        'hosts' as source,
        SUM(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
          AND latitude > -90 AND latitude < 90
          AND longitude > -180 AND longitude < 180 THEN 1 ELSE 0 END)::int as valid_coords,
        SUM(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
          AND (latitude <= -90 OR latitude >= 90 OR longitude <= -180 OR longitude >= 180) THEN 1 ELSE 0 END)::int as invalid_coords
      FROM hosts
      UNION ALL
      SELECT
        'secondary_addresses' as source,
        SUM(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
          AND latitude > -90 AND latitude < 90
          AND longitude > -180 AND longitude < 180 THEN 1 ELSE 0 END)::int as valid_coords,
        SUM(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
          AND (latitude <= -90 OR latitude >= 90 OR longitude <= -180 OR longitude >= 180) THEN 1 ELSE 0 END)::int as invalid_coords
      FROM user_addresses
    `);
    console.log("Coordinate Quality:");
    coordQuality.rows.forEach((row: any) => {
      console.log(
        `  ${row.source}: ${row.valid_coords} valid, ${row.invalid_coords || 0} invalid`,
      );
    });

    console.log("\n✅ AUDIT COMPLETE");
    process.exit(0);
  } catch (error) {
    console.error("❌ AUDIT FAILED:", error);
    process.exit(1);
  }
}

auditGeocodeCoverage();
