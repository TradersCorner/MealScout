import { Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testConnection() {
  try {
    const result = await pool.query("SELECT current_database(), version()");
    console.log("✅ Database connected:", result.rows[0].current_database);
    console.log("📊 PostgreSQL version:", result.rows[0].version.split(" ")[1]);

    // Test if tables exist
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`\n📋 Found ${tables.rows.length} tables:`);
    tables.rows.forEach((row) => console.log(`   - ${row.table_name}`));

    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
}

testConnection();
