import "dotenv/config";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "../server/db";
import { hosts } from "../shared/schema";

type GeoPoint = { lat: number; lng: number };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address,
    )}&limit=1`,
    {
      headers: { "Accept-Language": "en", "User-Agent": "MealScout/1.0" },
    },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;
  const lat = Number(data[0].lat);
  const lng = Number(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function run() {
  const rows = await db
    .select({
      id: hosts.id,
      businessName: hosts.businessName,
      address: hosts.address,
      city: hosts.city,
      state: hosts.state,
    })
    .from(hosts)
    .where(
      and(isNull(hosts.latitude), isNull(hosts.longitude), isNotNull(hosts.address)),
    );

  if (!rows.length) {
    console.log("No hosts missing coordinates.");
    return;
  }

  console.log(`Geocoding ${rows.length} host(s)...`);

  let updated = 0;
  let skipped = 0;

  for (const host of rows) {
    const fullAddress = [
      host.address?.trim(),
      host.city?.trim(),
      host.state?.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    if (!fullAddress) {
      skipped += 1;
      continue;
    }

    const coords = await geocodeAddress(fullAddress);
    if (!coords) {
      console.log(`No coords for ${host.businessName} (${fullAddress})`);
      skipped += 1;
      await delay(1100);
      continue;
    }

    await db
      .update(hosts)
      .set({
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
        updatedAt: new Date(),
      })
      .where(eq(hosts.id, host.id));

    updated += 1;
    console.log(
      `Updated ${host.businessName} -> ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
    );
    await delay(1100);
  }

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`);
}

run().catch((error) => {
  console.error("Host geocode backfill failed:", error);
  process.exit(1);
});
