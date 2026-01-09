// scripts/verifyClaimRedeemFlow.ts
// Terminal-only verifier: claim -> redeem -> redeem again (expect 400)
// Supports either Cookie sessions or Bearer tokens.
// Usage examples are below.

import process from "node:process";

type AuthMode = "cookie" | "bearer";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v.trim();
}

function optionalEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

function buildAuthHeaders(mode: AuthMode, raw: string): Record<string, string> {
  if (mode === "cookie") {
    // raw must be the Cookie header value only, e.g. "connect.sid=...; other=..."
    return { Cookie: raw };
  }
  // bearer
  return { Authorization: `Bearer ${raw}` };
}

async function httpJson(
  url: string,
  init: { method: string; headers: Record<string, string>; body?: unknown }
): Promise<{ status: number; text: string; json: any | null }> {
  const headers: Record<string, string> = { ...init.headers };

  let body: string | undefined;
  if (init.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    body = JSON.stringify(init.body);
  }

  const res = await fetch(url, { method: init.method, headers, body });
  const text = await res.text();

  let json: any | null = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { status: res.status, text, json };
}

function passFail(label: string, ok: boolean, detail: string) {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`\n[${mark}] ${label}\n${detail}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const baseUrl = requireEnv("BASE_URL").replace(/\/+$/, "");
  const dealId = requireEnv("DEAL_ID");

  const customerAuthMode = (requireEnv("CUSTOMER_AUTH_MODE") as AuthMode);
  const ownerAuthMode = (requireEnv("OWNER_AUTH_MODE") as AuthMode);

  if (customerAuthMode !== "cookie" && customerAuthMode !== "bearer") {
    throw new Error(`CUSTOMER_AUTH_MODE must be "cookie" or "bearer"`);
  }
  if (ownerAuthMode !== "cookie" && ownerAuthMode !== "bearer") {
    throw new Error(`OWNER_AUTH_MODE must be "cookie" or "bearer"`);
  }

  const customerAuthRaw =
    customerAuthMode === "cookie" ? requireEnv("CUSTOMER_COOKIE") : requireEnv("CUSTOMER_BEARER_TOKEN");
  const ownerAuthRaw =
    ownerAuthMode === "cookie" ? requireEnv("OWNER_COOKIE") : requireEnv("OWNER_BEARER_TOKEN");

  const orderAmountRaw = optionalEnv("ORDER_AMOUNT"); // optional
  const orderAmount = orderAmountRaw ? Number(orderAmountRaw) : undefined;
  if (orderAmountRaw && (!Number.isFinite(orderAmount) || orderAmount! <= 0)) {
    throw new Error(`ORDER_AMOUNT must be a positive number if provided (got: ${orderAmountRaw})`);
  }

  // ---- STEP 1: CLAIM ----
  const claimUrl = `${baseUrl}/api/deals/${encodeURIComponent(dealId)}/claim`;

  const claimRes = await httpJson(claimUrl, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(customerAuthMode, customerAuthRaw),
      Accept: "application/json",
    },
    body: {}, // route doesn't require fields; keeps it explicit
  });

  const claimOk = claimRes.status >= 200 && claimRes.status < 300 && claimRes.json && claimRes.json.claimId;
  passFail(
    "Step 1: Claim deal returns claimId",
    !!claimOk,
    `HTTP ${claimRes.status}\nBody: ${claimRes.text}`
  );

  if (!claimOk) {
    console.log("\nStopping because claim did not succeed.");
    return;
  }

  const claimId: string = String(claimRes.json.claimId);
  console.log(`\nCaptured claimId: ${claimId}`);

  // ---- STEP 2: REDEEM ONCE (EXPECT SUCCESS) ----
  const redeemUrl = `${baseUrl}/api/deal-claims/${encodeURIComponent(claimId)}/use`;

  const redeemBody: any = {};
  if (orderAmount !== undefined) redeemBody.orderAmount = orderAmount;

  const redeemRes1 = await httpJson(redeemUrl, {
    method: "PATCH",
    headers: {
      ...buildAuthHeaders(ownerAuthMode, ownerAuthRaw),
      Accept: "application/json",
    },
    body: redeemBody, // {} or {orderAmount}
  });

  const redeem1Ok = redeemRes1.status >= 200 && redeemRes1.status < 300;
  passFail(
    "Step 2: Redeem claim (first time) succeeds",
    redeem1Ok,
    `HTTP ${redeemRes1.status}\nBody: ${redeemRes1.text}`
  );

  // ---- STEP 3: REDEEM AGAIN (EXPECT 400 already used) ----
  const redeemRes2 = await httpJson(redeemUrl, {
    method: "PATCH",
    headers: {
      ...buildAuthHeaders(ownerAuthMode, ownerAuthRaw),
      Accept: "application/json",
    },
    body: {}, // no amount needed
  });

  const redeem2Ok =
    redeemRes2.status === 400 &&
    (typeof redeemRes2.text === "string") &&
    redeemRes2.text.toLowerCase().includes("already used");

  passFail(
    'Step 3: Redeem claim again returns HTTP 400 "already used"',
    redeem2Ok,
    `HTTP ${redeemRes2.status}\nBody: ${redeemRes2.text}`
  );

  // Final summary line (for copy/paste)
  console.log("\n=== SUMMARY ===");
  console.log(`claimId=${claimId}`);
  console.log(`step1_http=${claimRes.status}`);
  console.log(`step2_http=${redeemRes1.status}`);
  console.log(`step3_http=${redeemRes2.status}`);
}

main().catch((err) => {
  console.error("\nFATAL:", err?.message || err);
  process.exitCode = 1;
});
