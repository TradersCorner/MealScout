import { db } from "../db";
import { cities } from "@shared/schema";
import { and, eq, ilike, or } from "drizzle-orm";

export function usStateToTimeZone(state: string | null | undefined): string {
  const abbr = String(state || "").trim().toUpperCase();
  const pacific = new Set(["CA", "OR", "WA", "NV"]);
  const mountain = new Set(["AZ", "CO", "ID", "MT", "NM", "UT", "WY"]);
  const central = new Set([
    "AL",
    "AR",
    "IL",
    "IA",
    "KS",
    "KY",
    "LA",
    "MN",
    "MS",
    "MO",
    "ND",
    "NE",
    "OK",
    "SD",
    "TN",
    "TX",
    "WI",
    "FL", // Pensacola + early rollout; override per-city via cities.timezone.
  ]);
  const eastern = new Set([
    "CT",
    "DC",
    "DE",
    "GA",
    "IN",
    "MA",
    "MD",
    "ME",
    "MI",
    "NC",
    "NH",
    "NJ",
    "NY",
    "OH",
    "PA",
    "RI",
    "SC",
    "VA",
    "VT",
    "WV",
  ]);

  if (pacific.has(abbr)) return "America/Los_Angeles";
  if (mountain.has(abbr)) return "America/Denver";
  if (central.has(abbr)) return "America/Chicago";
  if (eastern.has(abbr)) return "America/New_York";
  return "America/Chicago";
}

export async function resolveCityTimeZone(params: {
  city?: string | null;
  state?: string | null;
}): Promise<string> {
  const city = String(params.city || "").trim();
  const state = String(params.state || "").trim().toUpperCase();
  if (!city) return usStateToTimeZone(state);

  // Prefer exact slug match where possible, but city pages often store plain names.
  const cityLike = `%${city}%`;
  const rows = await db
    .select({ timezone: cities.timezone, state: cities.state })
    .from(cities)
    .where(
      and(
        or(ilike(cities.name, cityLike), eq(cities.slug, city.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))),
        state ? eq(cities.state, state) : undefined,
      ),
    )
    .limit(1);

  const tz = String(rows?.[0]?.timezone || "").trim();
  if (tz) return tz;
  return usStateToTimeZone(state || rows?.[0]?.state);
}

