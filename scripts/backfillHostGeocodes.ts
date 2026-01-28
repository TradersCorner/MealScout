import "dotenv/config";
import { and, eq, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "../server/db";
import { forwardGeocode } from "../server/utils/geocoding";
import { hosts, locationRequests } from "../shared/schema";

type GeoPoint = { lat: number; lng: number };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildAddress = (parts: Array<string | null | undefined>) =>
  parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(", ");

async function run() {
  const hostRows = await db
    .select({
      id: hosts.id,
      businessName: hosts.businessName,
      address: hosts.address,
      city: hosts.city,
      state: hosts.state,
    })
    .from(hosts)
    .where(
      and(
        or(isNull(hosts.latitude), isNull(hosts.longitude)),
        isNotNull(hosts.address),
      ),
    );

  const requestRows = await db
    .select({
      id: locationRequests.id,
      businessName: locationRequests.businessName,
      address: locationRequests.address,
    })
    .from(locationRequests)
    .where(
      and(
        or(
          isNull(locationRequests.latitude),
          isNull(locationRequests.longitude),
        ),
        isNotNull(locationRequests.address),
      ),
    );

  if (!hostRows.length && !requestRows.length) {
    console.log("No hosts or location requests missing coordinates.");
    return;
  }

  if (hostRows.length) {
    console.log(`Geocoding ${hostRows.length} host(s)...`);
  }
  if (requestRows.length) {
    console.log(`Geocoding ${requestRows.length} location request(s)...`);
  }

  let updated = 0;
  let skipped = 0;

  for (const host of hostRows) {
    const fullAddress = buildAddress([
      host.address,
      host.city,
      host.state,
      "USA",
    ]);

    if (!fullAddress) {
      skipped += 1;
      continue;
    }

    const coords = await forwardGeocode(fullAddress);
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
      `Updated host ${host.businessName} -> ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
    );
    await delay(1100);
  }

  for (const request of requestRows) {
    const fullAddress = buildAddress([request.address, "USA"]);
    if (!fullAddress) {
      skipped += 1;
      continue;
    }

    const coords = await forwardGeocode(fullAddress);
    if (!coords) {
      console.log(
        `No coords for request ${request.businessName} (${fullAddress})`,
      );
      skipped += 1;
      await delay(1100);
      continue;
    }

    await db
      .update(locationRequests)
      .set({
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
      })
      .where(eq(locationRequests.id, request.id));

    updated += 1;
    console.log(
      `Updated request ${request.businessName} -> ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
    );
    await delay(1100);
  }

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`);
}

run().catch((error) => {
  console.error("Host geocode backfill failed:", error);
  process.exit(1);
});
