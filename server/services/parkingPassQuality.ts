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
  const state = normalize(listing.state ?? host?.state);
  const paymentsEnabled =
    host == null
      ? null
      : Boolean(host.stripeConnectAccountId && host.stripeChargesEnabled);

  if (!address) flags.push("missing_address");
  if (!city) flags.push("missing_city");
  if (!state) flags.push("missing_state");
  if (state && !/^[A-Za-z]{2}$/.test(state)) flags.push("invalid_state");
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

  if (paymentsEnabled === false) flags.push("payments_disabled");

  return Array.from(new Set(flags));
}

export function isParkingPassPublicReady(listing: Parameters<typeof computeParkingPassQualityFlags>[0]) {
  const flags = computeParkingPassQualityFlags(listing);
  // Strict: public listings must have zero data-quality flags (including payments enabled).
  return flags.length === 0;
}
