#!/usr/bin/env node
import "dotenv/config";
import http from "http";
import https from "https";
import Stripe from "stripe";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type CookieJar = Map<string, string>;

type HttpResult<T = any> = {
  status: number;
  timeMs: number;
  body?: T;
  headers: Record<string, string | string[] | undefined>;
};

function requireEnv(name: string): string {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function parseBool(value: string | undefined): boolean | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function storeSetCookie(cookieJar: CookieJar, setCookie: string[] | string | undefined) {
  if (!setCookie) return;
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const cookie of cookies) {
    const first = String(cookie || "").split(";")[0] || "";
    const eqIndex = first.indexOf("=");
    if (eqIndex === -1) continue;
    const name = first.slice(0, eqIndex).trim();
    const value = first.slice(eqIndex + 1).trim();
    if (name) cookieJar.set(name, value);
  }
}

function serializeCookies(cookieJar: CookieJar): string {
  return Array.from(cookieJar.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

async function httpJson<T = any>(
  baseUrl: string,
  path: string,
  opts: {
    method?: string;
    body?: JsonObject;
    rawBody?: string;
    headers?: Record<string, string>;
    cookieJar?: CookieJar;
    cookieHeader?: string;
    expected?: number | number[];
  } = {},
): Promise<HttpResult<T>> {
  const url = new URL(path, baseUrl);
  const client = url.protocol === "https:" ? https : http;
  const method = opts.method || "GET";
  const headers: Record<string, string> = {
    "User-Agent": "MealScout-MoneyButton/1.0",
    Origin: url.origin,
    Referer: `${url.origin}/`,
    ...(opts.body || typeof opts.rawBody === "string"
      ? { "Content-Type": "application/json" }
      : {}),
    ...(opts.headers || {}),
  };

  if (opts.cookieHeader) {
    headers.Cookie = opts.cookieHeader;
  } else if (opts.cookieJar && opts.cookieJar.size > 0) {
    headers.Cookie = serializeCookies(opts.cookieJar);
  }

  const start = Date.now();
  const result = await new Promise<HttpResult<T>>((resolve, reject) => {
    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        timeout: 45_000,
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const timeMs = Date.now() - start;
          if (opts.cookieJar) storeSetCookie(opts.cookieJar, res.headers["set-cookie"]);

          let body: T | undefined;
          const text = String(data || "").trim();
          if (text.length > 0) {
            try {
              body = JSON.parse(text) as T;
            } catch {
              body = undefined;
            }
          }
          resolve({
            status: res.statusCode || 500,
            timeMs,
            body,
            headers: res.headers as any,
          });
        });
      },
    );

    req.on("error", (error: any) => reject(error));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (typeof opts.rawBody === "string") {
      req.write(opts.rawBody);
    } else if (opts.body) {
      req.write(JSON.stringify(opts.body));
    }
    req.end();
  });

  const expectedStatuses = Array.isArray(opts.expected) ? opts.expected : opts.expected ? [opts.expected] : null;
  if (expectedStatuses && !expectedStatuses.includes(result.status)) {
    throw new Error(
      `Unexpected status ${result.status} for ${method} ${path}. Expected ${expectedStatuses.join(
        ",",
      )}. Body=${JSON.stringify(result.body)}`,
    );
  }

  return result;
}

async function login(
  baseUrl: string,
  cookieJar: CookieJar,
  emailEnv: string,
  passwordEnv: string,
) {
  const email = requireEnv(emailEnv);
  const password = requireEnv(passwordEnv);
  await httpJson(baseUrl, "/api/auth/login", {
    method: "POST",
    expected: 200,
    cookieJar,
    body: { email, password },
  });
}

async function ensureVisaDefaultPaymentMethod(stripe: Stripe, customerId: string) {
  const existing = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 10 });
  const visa =
    existing.data.find((pm) => pm.card?.last4 === "4242") ||
    existing.data[0] ||
    (await stripe.paymentMethods.attach("pm_card_visa", { customer: customerId }));

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: visa.id },
  });

  return visa.id;
}

async function postStripeWebhook(
  params: {
    baseUrl: string;
    stripe: Stripe;
    webhookSecret?: string;
    forceVerify?: boolean;
    event: any;
  },
) {
  const payload = JSON.stringify(params.event);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (params.forceVerify) {
    const secret = params.webhookSecret || requireEnv("STRIPE_WEBHOOK_SECRET");
    const signature = params.stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    headers["Stripe-Signature"] = signature;
  }

  await httpJson(params.baseUrl, "/api/stripe/webhook", {
    method: "POST",
    expected: 200,
    headers,
    rawBody: payload,
  });
}

async function poll<T>(
  fn: () => Promise<T>,
  opts: { timeoutMs: number; intervalMs: number; isDone: (value: T) => boolean },
): Promise<T> {
  const start = Date.now();
  while (true) {
    const value = await fn();
    if (opts.isDone(value)) return value;
    if (Date.now() - start > opts.timeoutMs) return value;
    await sleep(opts.intervalMs);
  }
}

async function run() {
  const API_BASE = String(process.env.API_BASE || "http://localhost:5000").replace(/\/+$/, "");
  const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

  const forceWebhookVerify = parseBool(process.env.STRIPE_WEBHOOK_FORCE_VERIFY) ?? false;
  const stripeWebhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim() || undefined;

  const truckId = requireEnv("TEST_TRUCK_ID");
  const passId = requireEnv("TEST_PARKING_PASS_ID");

  const truckJar: CookieJar = new Map();
  const hostJar: CookieJar = new Map();

  const truckCookieHeader = String(process.env.TEST_TRUCK_AUTH_COOKIE || "").trim() || undefined;
  const hostCookieHeader = String(process.env.TEST_HOST_AUTH_COOKIE || "").trim() || undefined;

  if (!truckCookieHeader) {
    await login(API_BASE, truckJar, "TEST_TRUCK_EMAIL", "TEST_TRUCK_PASSWORD");
  }
  if (!hostCookieHeader) {
    await login(API_BASE, hostJar, "TEST_HOST_EMAIL", "TEST_HOST_PASSWORD");
  }

  const truckAuth = truckCookieHeader ? { cookieHeader: truckCookieHeader } : { cookieJar: truckJar };
  const hostAuth = hostCookieHeader ? { cookieHeader: hostCookieHeader } : { cookieJar: hostJar };

  console.log(`[money-button] API_BASE=${API_BASE}`);

  // 1) Subscription: create + pay + verify
  console.log("[money-button] Subscription: create");
  const createSubRes = await httpJson<any>(API_BASE, "/api/create-subscription", {
    method: "POST",
    expected: 200,
    ...(truckAuth as any),
    body: {
      billingInterval: "month",
      promoCode: String(process.env.TEST_SUB_PROMO || "TEST1"),
    },
  });

  const subscriptionId = String(createSubRes.body?.subscriptionId || "").trim();
  if (!subscriptionId) {
    throw new Error(`Missing subscriptionId from /api/create-subscription: ${JSON.stringify(createSubRes.body)}`);
  }

  console.log(`[money-button] Subscription: ${subscriptionId}`);
  const subscriptionExpanded = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice.payment_intent"],
  });
  const customerId = String(subscriptionExpanded.customer || "").trim();
  if (!customerId) throw new Error("Missing subscription.customer");

  const latestInvoice: any = subscriptionExpanded.latest_invoice;
  const invoiceId = String(latestInvoice?.id || "").trim();
  if (!invoiceId) throw new Error("Missing subscription.latest_invoice.id");

  await ensureVisaDefaultPaymentMethod(stripe, customerId);

  console.log(`[money-button] Subscription: paying invoice ${invoiceId}`);
  const invoicePre = await stripe.invoices.retrieve(invoiceId);
  if (invoicePre.status !== "paid") {
    await stripe.invoices.pay(invoiceId);
  }

  const finalSubscription = await poll(
    async () => stripe.subscriptions.retrieve(subscriptionId),
    { timeoutMs: 25_000, intervalMs: 2_000, isDone: (s) => s.status === "active" },
  );
  if (finalSubscription.status !== "active") {
    throw new Error(`Subscription did not become active (status=${finalSubscription.status})`);
  }

  console.log("[money-button] Subscription: API status check");
  const subStatusRes = await httpJson<any>(API_BASE, "/api/subscription/status", {
    method: "GET",
    expected: 200,
    ...(truckAuth as any),
  });
  const apiSubStatus = String(subStatusRes.body?.status || "").trim();
  if (!["active", "trialing"].includes(apiSubStatus)) {
    throw new Error(`Unexpected /api/subscription/status status=${apiSubStatus} body=${JSON.stringify(subStatusRes.body)}`);
  }

  // Optional: simulate invoice webhook for affiliate/side effects
  console.log("[money-button] Subscription: webhook simulate invoice.payment_succeeded");
  const paidInvoice = await stripe.invoices.retrieve(invoiceId);
  await postStripeWebhook({
    baseUrl: API_BASE,
    stripe,
    webhookSecret: stripeWebhookSecret,
    forceVerify: forceWebhookVerify,
    event: {
      id: `evt_moneybutton_invoice_${Date.now()}`,
      type: "invoice.payment_succeeded",
      data: { object: paidInvoice },
    },
  });

  // 2) Booking: create PI + confirm + webhook + verify in both dashboards
  console.log("[money-button] Booking: host Stripe status");
  const hostStatusRes = await httpJson<any>(API_BASE, "/api/hosts/stripe/status", {
    method: "GET",
    expected: 200,
    ...(hostAuth as any),
  });

  const hostAccountId = String(hostStatusRes.body?.accountId || "").trim();
  const hostChargesEnabled = Boolean(hostStatusRes.body?.chargesEnabled);
  const hostPayoutsEnabled = Boolean(hostStatusRes.body?.payoutsEnabled);
  const hostOnboardingCompleted = Boolean(hostStatusRes.body?.onboardingCompleted);
  if (!hostAccountId || !hostChargesEnabled || !hostPayoutsEnabled || !hostOnboardingCompleted) {
    throw new Error(
      `Host must have Stripe Connect fully enabled for fee split. status=${JSON.stringify(hostStatusRes.body)}`,
    );
  }

  console.log("[money-button] Booking: create checkout intent");
  const bookingRes = await httpJson<any>(
    API_BASE,
    `/api/parking-pass/${encodeURIComponent(passId)}/book`,
    {
      method: "POST",
      expected: 200,
      ...(truckAuth as any),
      headers: {
        "Idempotency-Key": `money-button-book-${Date.now()}`,
      },
      body: {
        truckId,
        slotTypes: ["daily"],
      },
    },
  );

  const paymentIntentId = String(bookingRes.body?.paymentIntentId || "").trim();
  if (!paymentIntentId) {
    throw new Error(`Missing paymentIntentId from booking response: ${JSON.stringify(bookingRes.body)}`);
  }

  const breakdown = bookingRes.body?.breakdown || {};
  const expectedTotalCents = Number(bookingRes.body?.totalCents);
  const expectedPlatformFeeCents = Number(breakdown.platformFee);
  if (!Number.isFinite(expectedTotalCents) || expectedTotalCents <= 0) {
    throw new Error(`Invalid totalCents from booking response: ${JSON.stringify(bookingRes.body)}`);
  }
  if (!Number.isFinite(expectedPlatformFeeCents) || expectedPlatformFeeCents <= 0) {
    throw new Error(`Invalid breakdown.platformFee from booking response: ${JSON.stringify(bookingRes.body)}`);
  }

  console.log(`[money-button] Booking: confirm PI ${paymentIntentId} (stripeAccount=${hostAccountId})`);
  const confirmedIntent = await stripe.paymentIntents.confirm(
    paymentIntentId,
    { payment_method: "pm_card_visa" },
    { stripeAccount: hostAccountId },
  );
  if (confirmedIntent.status !== "succeeded") {
    throw new Error(`PaymentIntent not succeeded (status=${confirmedIntent.status})`);
  }

  if (confirmedIntent.amount !== expectedTotalCents) {
    throw new Error(`PaymentIntent amount mismatch: intent=${confirmedIntent.amount} expected=${expectedTotalCents}`);
  }
  if (Number(confirmedIntent.application_fee_amount || 0) !== expectedPlatformFeeCents) {
    throw new Error(
      `Application fee mismatch: intent=${confirmedIntent.application_fee_amount} expected=${expectedPlatformFeeCents}`,
    );
  }

  console.log("[money-button] Booking: webhook simulate payment_intent.succeeded");
  await postStripeWebhook({
    baseUrl: API_BASE,
    stripe,
    webhookSecret: stripeWebhookSecret,
    forceVerify: forceWebhookVerify,
    event: {
      id: `evt_moneybutton_pi_${Date.now()}`,
      type: "payment_intent.succeeded",
      data: { object: confirmedIntent },
    },
  });

  console.log("[money-button] Booking: poll booking status by PI");
  const finalBookingStatusRes = await poll(
    async () =>
      httpJson<any>(
        API_BASE,
        `/api/bookings/payment-intent/${encodeURIComponent(paymentIntentId)}?truckId=${encodeURIComponent(truckId)}`,
        { method: "GET", expected: 200, ...(truckAuth as any) },
      ),
    {
      timeoutMs: 30_000,
      intervalMs: 2_000,
      isDone: (res) => String(res.body?.status || "") === "confirmed",
    },
  );

  const finalBookingStatus = String(finalBookingStatusRes.body?.status || "").trim();
  if (finalBookingStatus !== "confirmed") {
    throw new Error(
      `Booking did not confirm (status=${finalBookingStatus}) body=${JSON.stringify(finalBookingStatusRes.body)}`,
    );
  }

  console.log("[money-button] Booking: verify in my-truck list");
  const myTruckBookings = await httpJson<any[]>(API_BASE, "/api/bookings/my-truck", {
    method: "GET",
    expected: 200,
    ...(truckAuth as any),
  });
  const truckHas = Array.isArray(myTruckBookings.body)
    ? myTruckBookings.body.some((b) => String((b as any)?.stripePaymentIntentId || "") === paymentIntentId)
    : false;
  if (!truckHas) {
    throw new Error("Booking not found in /api/bookings/my-truck");
  }

  console.log("[money-button] Booking: verify in my-host list");
  const myHostBookings = await httpJson<any[]>(API_BASE, "/api/bookings/my-host", {
    method: "GET",
    expected: 200,
    ...(hostAuth as any),
  });
  const hostHas = Array.isArray(myHostBookings.body)
    ? myHostBookings.body.some((b) => String((b as any)?.stripePaymentIntentId || "") === paymentIntentId)
    : false;
  if (!hostHas) {
    throw new Error("Booking not found in /api/bookings/my-host");
  }

  console.log("PASS: money button (subscription + booking) verified end-to-end.");
}

run().catch((error) => {
  console.error("FAIL:", error?.stack || error?.message || error);
  process.exit(1);
});
