import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function geocodeAddress(address) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address,
    )}&limit=1`,
    {
      headers: { "Accept-Language": "en", "User-Agent": "MealScout/1.0" },
    },
  );
  if (!response.ok) return null;
  const data = await response.json();
  if (!data.length) return null;
  const lat = Number(data[0].lat);
  const lng = Number(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    select id, business_name, address, city, state
    from hosts
    where latitude is null
      and longitude is null
      and address is not null
  `;

  if (!rows.length) {
    console.log("No hosts missing coordinates.");
    return;
  }

  console.log(`Geocoding ${rows.length} host(s)...`);

  let updated = 0;
  let skipped = 0;

  for (const host of rows) {
    const fullAddress = [host.address?.trim(), host.city?.trim(), host.state?.trim()]
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

    await sql`
      update hosts
      set latitude = ${coords.lat.toString()},
          longitude = ${coords.lng.toString()},
          updated_at = now()
      where id = ${host.id}
    `;

    updated += 1;
    console.log(
      `Updated ${host.business_name} -> ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
    );
    await delay(1100);
  }

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`);
}

run().catch((error) => {
  console.error("Host geocode backfill failed:", error);
  process.exit(1);
});
