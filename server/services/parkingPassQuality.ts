type ParkingPassQualityFlag =
  | "missing_price"
  | "missing_address"
  | "missing_city"
  | "missing_state"
  | "invalid_state"
  | "bad_address_format"
  | "missing_coords"
  | "invalid_coords"
  | "invalid_time_window"
  | "missing_spots"
  | "invalid_spots"
  | "payments_disabled";

const normalize = (value?: string | number | null) =>
  String(value ?? "").trim();

export const normalizeUsStateAbbr = (value: string): string => {
  const raw = value.trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;

  const key = raw.trim().toLowerCase();
  const byName: Record<string, string> = {
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
    northcarolina: "NC",
    "north carolina": "NC",
    northdakota: "ND",
    "north dakota": "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    "rhode island": "RI",
    southcarolina: "SC",
    "south carolina": "SC",
    southdakota: "SD",
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
    "district of columbia": "DC",
    dc: "DC",
  };

  return byName[key] || byName[key.replace(/\./g, "")] || raw;
};

const toNumberOrNull = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

export function computeParkingPassQualityFlags(listing: {
  host?: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    stripeConnectAccountId?: string | null;
    stripeChargesEnabled?: boolean | null;
  } | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  startTime?: string | null;
  endTime?: string | null;
  maxTrucks?: number | null;
  breakfastPriceCents?: number | null;
  lunchPriceCents?: number | null;
  dinnerPriceCents?: number | null;
  dailyPriceCents?: number | null;
  weeklyPriceCents?: number | null;
  monthlyPriceCents?: number | null;
}): ParkingPassQualityFlag[] {
  const flags: ParkingPassQualityFlag[] = [];

  const host = listing.host ?? null;
  const address = normalize(listing.address ?? host?.address);
  const city = normalize(listing.city ?? host?.city);
  const stateRaw = normalize(listing.state ?? host?.state);
  const state = stateRaw ? normalizeUsStateAbbr(stateRaw) : "";
  // Platform payments: we must be able to charge trucks for Parking Pass bookings.
  // Host payouts (Stripe Connect) are optional; if not enabled we hold host earnings as credit.
  const platformPaymentsEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

  if (!address) flags.push("missing_address");
  // City/state are optional because many legacy host rows store the full location in `address`.
  // If state is provided, validate it to avoid obviously bad data.
  if (stateRaw && state && !/^[A-Za-z]{2}$/.test(state)) flags.push("invalid_state");
  if (address && !/\d/.test(address)) flags.push("bad_address_format");

  const lat = toNumberOrNull(listing.latitude ?? host?.latitude);
  const lng = toNumberOrNull(listing.longitude ?? host?.longitude);
  if (lat === null || lng === null) {
    flags.push("missing_coords");
  } else if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    flags.push("invalid_coords");
  }

  const startTime = normalize(listing.startTime);
  const endTime = normalize(listing.endTime);
  if (!startTime || !endTime) {
    flags.push("invalid_time_window");
  } else {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (
      !Number.isFinite(sh) ||
      !Number.isFinite(sm) ||
      !Number.isFinite(eh) ||
      !Number.isFinite(em) ||
      eh * 60 + em <= sh * 60 + sm
    ) {
      flags.push("invalid_time_window");
    }
  }

  const maxTrucks = listing.maxTrucks ?? null;
  if (maxTrucks === null || maxTrucks === undefined) {
    flags.push("missing_spots");
  } else if (!Number.isFinite(maxTrucks) || maxTrucks < 1) {
    flags.push("invalid_spots");
  }

  const breakfast = Number(listing.breakfastPriceCents ?? 0);
  const lunch = Number(listing.lunchPriceCents ?? 0);
  const dinner = Number(listing.dinnerPriceCents ?? 0);
  const daily = Number(listing.dailyPriceCents ?? 0);
  const weekly = Number(listing.weeklyPriceCents ?? 0);
  const monthly = Number(listing.monthlyPriceCents ?? 0);
  const hasPricing = [breakfast, lunch, dinner, daily, weekly, monthly].some(
    (value) => Number.isFinite(value) && value > 0,
  );
  if (!hasPricing) flags.push("missing_price");

  if (!platformPaymentsEnabled) flags.push("payments_disabled");

  return Array.from(new Set(flags));
}

export function isParkingPassPublicReady(listing: Parameters<typeof computeParkingPassQualityFlags>[0]) {
  const flags = computeParkingPassQualityFlags(listing);
  // Visibility should not hard-fail just because platform payments are temporarily misconfigured.
  // Booking flows will still fail safely if payments are disabled.
  return flags.filter((flag) => flag !== "payments_disabled").length === 0;
}
