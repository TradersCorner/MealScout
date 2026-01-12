import { db } from "../server/db.js";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log(
    "🔄 Running migration: 010_unified_claims_and_pricing_lock.sql\n"
  );

  try {
    // Read migration file
    const migrationPath = path.join(
      __dirname,
      "../migrations/010_unified_claims_and_pricing_lock.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Split by semicolons but handle the DO block properly
    const statements = migrationSQL
      .split(/;(?=\s*(?:--|$|\n\s*(?:ALTER|CREATE|INSERT|DO)))/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\s+/g, " ");

      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);
        await db.execute(sql.raw(statement));
        console.log(`✅ Success\n`);
      } catch (error: any) {
        // Skip "already exists" errors
        if (
          error.code === "42701" ||
          error.message?.includes("already exists")
        ) {
          console.log(`⚠️  Skipped (already exists)\n`);
          continue;
        }
        throw error;
      }
    }

    console.log("✅ Migration completed successfully!\n");
    console.log("Changes applied:");
    console.log("  • Added locked_price_cents to restaurants");
    console.log("  • Added price_lock_date to restaurants");
    console.log("  • Added price_lock_reason to restaurants");
    console.log("  • Created claims table");
    console.log("  • Backfilled existing restaurant claims");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

runMigration();
