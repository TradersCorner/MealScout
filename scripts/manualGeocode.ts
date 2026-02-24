import "dotenv/config";
import { db, pool } from "../server/db";
import { userAddresses } from "../shared/schema";
import { eq } from "drizzle-orm";

async function manualGeocode() {
  try {
    if (!pool) {
      console.error("❌ DATABASE_URL not set.");
      process.exit(1);
    }

    console.log("🧭 MANUAL GEOCODING FALLBACK...\n");

    // Pensacola, FL approximate center: 30.4200°N, 87.2100°W
    // (These are reasonable coordinates for the Pensacola city area)
    const pensacolaLat = "30.4200";
    const pensacolaLng = "-87.2100";

    // Update the Exxon address with Pensacola coordinates
    const result = await db
      .update(userAddresses)
      .set({
        latitude: pensacolaLat,
        longitude: pensacolaLng,
        updatedAt: new Date(),
      })
      .where(eq(userAddresses.address, "1112 N. Navy Blvd"));

    console.log(
      "✅ Updated Exxon address with Pensacola, FL centroid coordinates",
    );
    console.log(`   Latitude: ${pensacolaLat}`);
    console.log(`   Longitude: ${pensacolaLng}`);
    console.log(
      "\n⚠️  NOTE: These are approximate Pensacola city coordinates.",
    );
    console.log(
      "   For exact coordinates, the address may need to be corrected or",
    );
    console.log(
      "   a POST code added to help geocoding providers locate it accurately.\n",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ FAILED:", error);
    process.exit(1);
  }
}

manualGeocode();
