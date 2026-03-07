import "dotenv/config";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type HttpResult<T = JsonObject> = {
  status: number;
  data: T | null;
};

async function httpJson<T = JsonObject>(
  url: string,
  opts: {
    method?: string;
    cookie?: string;
    body?: JsonObject;
    headers?: Record<string, string>;
  } = {},
): Promise<HttpResult<T>> {
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.cookie ? { Cookie: opts.cookie } : {}),
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    redirect: "manual",
  });

  const text = await res.text();
  let data: T | null = null;
  if (text.trim().length > 0) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = null;
    }
  }

  return { status: res.status, data };
}

function asRecord(value: unknown): Record<string, any> {
  if (value && typeof value === "object") return value as Record<string, any>;
  return {};
}

function missingEnv(name: string): boolean {
  return String(process.env[name] || "").trim().length === 0;
}

async function run() {
  const required = [
    "TEST_TRUCK_AUTH_COOKIE",
    "TEST_PARKING_PASS_ID",
    "TEST_TRUCK_ID",
  ];
  const missing = required.filter(missingEnv);
  if (missing.length > 0) {
    console.log(
      `[booking-concurrency] Skipping: missing env vars ${missing.join(", ")}`,
    );
    return;
  }

  const API_BASE = String(process.env.API_BASE || "http://localhost:5000").replace(/\/+$/, "");
  const cookie = String(process.env.TEST_TRUCK_AUTH_COOKIE || "").trim();
  const passId = String(process.env.TEST_PARKING_PASS_ID || "").trim();
  const truckId = String(process.env.TEST_TRUCK_ID || "").trim();
  const slotTypes = String(process.env.TEST_SLOT_TYPES || "daily")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const body: JsonObject = {
    truckId,
    slotTypes,
  };
  const bookingUrl = `${API_BASE}/api/parking-pass/${encodeURIComponent(passId)}/book`;

  const idem = `booking-concurrency-${Date.now()}`;

  const [first, second] = await Promise.all([
    httpJson(bookingUrl, {
      method: "POST",
      cookie,
      headers: { "Idempotency-Key": idem },
      body,
    }),
    httpJson(bookingUrl, {
      method: "POST",
      cookie,
      headers: { "Idempotency-Key": idem },
      body,
    }),
  ]);

  const allowedStatuses = new Set([200, 409]);
  if (!allowedStatuses.has(first.status) || !allowedStatuses.has(second.status)) {
    throw new Error(
      `[booking-concurrency] Unexpected concurrent statuses: ${first.status}, ${second.status}`,
    );
  }

  const success = [first, second].find((x) => x.status === 200) || null;
  if (!success) {
    throw new Error(
      `[booking-concurrency] Both concurrent calls failed: ${JSON.stringify([
        first.data,
        second.data,
      ])}`,
    );
  }

  const successBody = asRecord(success.data);
  const paymentIntentId = String(successBody.paymentIntentId || "").trim();
  if (!paymentIntentId) {
    throw new Error("[booking-concurrency] Missing paymentIntentId on successful response");
  }

  const replay = await httpJson(bookingUrl, {
    method: "POST",
    cookie,
    headers: { "Idempotency-Key": idem },
    body,
  });
  if (replay.status !== 200) {
    throw new Error(
      `[booking-concurrency] Idempotent replay expected 200, got ${replay.status}`,
    );
  }
  const replayIntent = String(asRecord(replay.data).paymentIntentId || "").trim();
  if (replayIntent !== paymentIntentId) {
    throw new Error(
      `[booking-concurrency] Replay paymentIntent mismatch: ${replayIntent} vs ${paymentIntentId}`,
    );
  }

  const secondKeyAttempt = await httpJson(bookingUrl, {
    method: "POST",
    cookie,
    headers: { "Idempotency-Key": `${idem}-different` },
    body,
  });
  if (![400, 409].includes(secondKeyAttempt.status)) {
    throw new Error(
      `[booking-concurrency] Different idempotency key should be blocked by duplicate hold, got ${secondKeyAttempt.status}`,
    );
  }

  const cancel = await httpJson(
    `${API_BASE}/api/bookings/payment-intent/${encodeURIComponent(paymentIntentId)}/cancel?truckId=${encodeURIComponent(truckId)}`,
    {
      method: "POST",
      cookie,
    },
  );
  if (![200, 409].includes(cancel.status)) {
    throw new Error(
      `[booking-concurrency] Cleanup cancel failed: status ${cancel.status}`,
    );
  }

  console.log("[booking-concurrency] PASS");
}

run().catch((error: any) => {
  console.error("[booking-concurrency] FAIL", error?.stack || error?.message || error);
  process.exit(1);
});
