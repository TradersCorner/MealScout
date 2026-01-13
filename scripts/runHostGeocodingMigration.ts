import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Running migration 011_add_host_geocoding.sql...");

  try {
    // Add latitude column
    console.log("Adding latitude column...");
    await sql`ALTER TABLE hosts ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8)`;

    // Add longitude column
    console.log("Adding longitude column...");
    await sql`ALTER TABLE hosts ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8)`;

    // Add geospatial index
    console.log("Creating geospatial index...");
    await sql`CREATE INDEX IF NOT EXISTS idx_hosts_location ON hosts(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL`;

    // Add admin_created flag
    console.log("Adding admin_created flag...");
    await sql`ALTER TABLE hosts ADD COLUMN IF NOT EXISTS admin_created BOOLEAN DEFAULT FALSE`;

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

runMigration();
