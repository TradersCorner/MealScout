import "dotenv/config";
import { db, pool } from "../server/db";
import { userAddresses } from "../shared/schema";
import { eq } from "drizzle-orm";
import { forwardGeocode } from "../server/utils/geocoding";

// Map full state names to abbreviations
const stateAbbreviations: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
};

function normalizeState(state: string | null): string {
  if (!state) return "";
  const lower = state.toLowerCase().trim();
  return stateAbbreviations[lower] || state;
}

async function geocodeMissingAddresses() {
  try {
    if (!pool) {
      console.error("❌ DATABASE_URL not set. Cannot geocode.");
      process.exit(1);
    }

    console.log("🧭 GEOCODING MISSING SECONDARY ADDRESSES...\n");

    // Get secondary addresses missing coordinates
    const missingAddresses = await pool.query(`
      SELECT
        ua.id,
        ua.user_id,
        ua.label,
        ua.address,
        ua.city,
        ua.state,
        h.business_name as host_name
      FROM user_addresses ua
      INNER JOIN users u ON ua.user_id = u.id
      LEFT JOIN hosts h ON h.user_id = u.id AND h.is_verified = true
      WHERE ua.address IS NOT NULL
        AND (ua.latitude IS NULL OR ua.longitude IS NULL)
        AND u.id IN (SELECT DISTINCT user_id FROM hosts WHERE is_verified = true)
      ORDER BY ua.created_at DESC
    `);

    if (missingAddresses.rows.length === 0) {
      console.log(
        "✅ No missing addresses found. All secondary addresses are geocoded!",
      );
      process.exit(0);
    }

    console.log(
      `Found ${missingAddresses.rows.length} missing secondary addresses to geocode:\n`,
    );

    let successCount = 0;
    let failureCount = 0;

    for (const addr of missingAddresses.rows) {
      const stateAbbr = normalizeState(addr.state);
      const fullAddress = [addr.address, addr.city, stateAbbr, "USA"]
        .filter(Boolean)
        .join(", ");

      console.log(
        `⏳ Geocoding: ${addr.label} for ${addr.host_name || "(host)"}`,
      );
      console.log(`   Address: ${fullAddress}`);

      try {
        // Try forwardGeocode first
        let coords = await forwardGeocode(fullAddress).catch(() => null);

        if (!coords) {
          // Try without "USA"
          console.log(`   ℹ️  Trying without country...`);
          const altAddress = [addr.address, addr.city, stateAbbr]
            .filter(Boolean)
            .join(", ");
          coords = await forwardGeocode(altAddress).catch(() => null);
        }

        if (!coords) {
          // Try forcing a fresh lookup
          console.log(`   ℹ️  Trying with force refresh...`);
          coords = await forwardGeocode(fullAddress, { force: true }).catch(
            () => null,
          );
        }

        if (!coords) {
          console.log(`   ❌ FAILED: Could not geocode address\n`);
          failureCount += 1;
          continue;
        }

        console.log(`   ✅ Found: lat=${coords.lat}, lng=${coords.lng}`);

        // Update the database
        await db
          .update(userAddresses)
          .set({
            latitude: coords.lat.toString(),
            longitude: coords.lng.toString(),
            updatedAt: new Date(),
          })
          .where(eq(userAddresses.id, addr.id));

        console.log(`   💾 Saved to database\n`);
        successCount += 1;
      } catch (error) {
        console.error(`   ❌ ERROR: ${error}\n`);
        failureCount += 1;
      }
    }

    console.log(
      `\n✅ GEOCODING COMPLETE: ${successCount} success, ${failureCount} failed`,
    );
    process.exit(failureCount > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ FAILED:", error);
    process.exit(1);
  }
}

geocodeMissingAddresses();
