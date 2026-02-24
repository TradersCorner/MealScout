import "dotenv/config";
import { pool } from "../server/db";

async function inspectAddress() {
  try {
    const r = await pool.query(
      `SELECT id, label, address, city, state, latitude, longitude FROM user_addresses WHERE address LIKE '%Navy%' OR address LIKE '%Exxon%'`,
    );
    console.log("Address Details:");
    console.log(JSON.stringify(r.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

inspectAddress();
