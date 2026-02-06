import "dotenv/config";
import { db } from "../server/db.js";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: tsx scripts/runSqlMigration.ts <migration-file.sql>");
  process.exit(1);
}

const migrationPath = path.isAbsolute(fileArg)
  ? fileArg
  : path.join(__dirname, "../migrations", fileArg);

async function runMigration() {
  console.log(`🔄 Running migration: ${migrationPath}\n`);

  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  const statements = migrationSQL
    .split(/;(?=\s*(?:--|$|\n\s*(?:ALTER|CREATE|INSERT|UPDATE|DELETE|DO)))/i)
    .map((chunk) => {
      const withoutLeadingComments = chunk
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");
      return withoutLeadingComments.trim();
    })
    .filter((s) => s.length > 0);

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 100).replace(/\s+/g, " ");

    try {
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);
      await db.execute(sql.raw(statement));
      console.log("✅ Success\n");
    } catch (error: any) {
      if (error?.code === "42701" || error?.message?.includes("already exists")) {
        console.log("⚠️  Skipped (already exists)\n");
        continue;
      }
      throw error;
    }
  }

  console.log("✅ Migration completed successfully!\n");
}

runMigration().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
