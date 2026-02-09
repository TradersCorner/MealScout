import "dotenv/config";
import { and, isNotNull, isNull, or, eq } from "drizzle-orm";
import { db } from "../server/db";
import { forwardGeocode } from "../server/utils/geocoding";
import { hosts, locationRequests, userAddresses } from "../shared/schema";

type EntityType = "host" | "user_address" | "location_request";

type MissingRow = {
  id: string;
  entityType: EntityType;
  label: string;
  address: string | null;
  city?: string | null;
  state?: string | null;
};

type GeoPoint = { lat: number; lng: number };

const buildAddress = (
  address?: string | null,
  city?: string | null,
  state?: string | null,
) =>
  [address, city, state, "USA"]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(", ");

const parseLimit = (args: string[]) => {
  const flag = args.find((arg) => arg.startsWith("--limit="));
  if (!flag) return null;
  const raw = Number(flag.split("=")[1]);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return Math.floor(raw);
};

async function collectMissingRows(limit: number | null): Promise<MissingRow[]> {
  const [hostRows, userAddressRows, requestRows] = await Promise.all([
    db
      .select({
        id: hosts.id,
        label: hosts.businessName,
        address: hosts.address,
        city: hosts.city,
        state: hosts.state,
      })
      .from(hosts)
      .where(and(or(isNull(hosts.latitude), isNull(hosts.longitude)), isNotNull(hosts.address))),
    db
      .select({
        id: userAddresses.id,
        label: userAddresses.label,
        address: userAddresses.address,
        city: userAddresses.city,
        state: userAddresses.state,
      })
      .from(userAddresses)
      .where(
        and(
          or(isNull(userAddresses.latitude), isNull(userAddresses.longitude)),
          isNotNull(userAddresses.address),
        ),
      ),
    db
      .select({
        id: locationRequests.id,
        label: locationRequests.businessName,
        address: locationRequests.address,
      })
      .from(locationRequests)
      .where(
        and(
          or(isNull(locationRequests.latitude), isNull(locationRequests.longitude)),
          isNotNull(locationRequests.address),
        ),
      ),
  ]);

  const rows: MissingRow[] = [
    ...hostRows.map((row) => ({ ...row, entityType: "host" as const })),
    ...userAddressRows.map((row) => ({
      ...row,
      entityType: "user_address" as const,
    })),
    ...requestRows.map((row) => ({
      ...row,
      entityType: "location_request" as const,
      city: null,
      state: null,
    })),
  ];

  if (!limit) return rows;
  return rows.slice(0, limit);
}

async function persistCoords(
  row: MissingRow,
  coords: GeoPoint,
): Promise<void> {
  if (row.entityType === "host") {
    await db
      .update(hosts)
      .set({
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
        updatedAt: new Date(),
      })
      .where(eq(hosts.id, row.id));
    return;
  }

  if (row.entityType === "user_address") {
    await db
      .update(userAddresses)
      .set({
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
        updatedAt: new Date(),
      })
      .where(eq(userAddresses.id, row.id));
    return;
  }

  await db
    .update(locationRequests)
    .set({
      latitude: coords.lat.toString(),
      longitude: coords.lng.toString(),
    })
    .where(eq(locationRequests.id, row.id));
}

async function run() {
  const limit = parseLimit(process.argv.slice(2));
  const missingRows = await collectMissingRows(limit);
  if (!missingRows.length) {
    console.log("No missing coordinates found in hosts, user addresses, or location requests.");
    return;
  }

  console.log(`Backfilling coordinates for ${missingRows.length} row(s)...`);

  let updated = 0;
  let skipped = 0;
  const addrCache = new Map<string, GeoPoint | null>();

  for (const row of missingRows) {
    const fullAddress = buildAddress(row.address, row.city, row.state);
    if (!fullAddress) {
      skipped += 1;
      continue;
    }

    const addressKey = fullAddress.toLowerCase();
    let coords = addrCache.get(addressKey);
    if (coords === undefined) {
      coords = await forwardGeocode(fullAddress);
      addrCache.set(addressKey, coords ?? null);
    }
    if (!coords) {
      skipped += 1;
      console.log(`Skipped ${row.entityType}:${row.id} (${row.label}) -> no geocode match`);
      continue;
    }

    await persistCoords(row, coords);
    updated += 1;
    console.log(
      `Updated ${row.entityType}:${row.id} (${row.label}) -> ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
    );
  }

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`);
}

run().catch((error) => {
  console.error("Map coordinate backfill failed:", error);
  process.exit(1);
});

