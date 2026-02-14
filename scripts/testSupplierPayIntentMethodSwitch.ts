/**
 * Integration check for supplier order pay-intent method switching.
 *
 * Required env:
 * - API_BASE (default: http://localhost:5000)
 * - TEST_AUTH_COOKIE (full Cookie header value for an authenticated buyer session)
 * - TEST_SUPPLIER_ORDER_ID (existing supplier order ID with paymentMethod="stripe", paymentStatus!="paid")
 *
 * Optional env:
 * - FIRST_METHOD  (default: ach)
 * - SECOND_METHOD (default: card)
 */

const API_BASE = process.env.API_BASE || "http://localhost:5000";
const TEST_AUTH_COOKIE = String(process.env.TEST_AUTH_COOKIE || "").trim();
const TEST_SUPPLIER_ORDER_ID = String(process.env.TEST_SUPPLIER_ORDER_ID || "").trim();
const FIRST_METHOD = (String(process.env.FIRST_METHOD || "ach").trim().toLowerCase() === "card"
  ? "card"
  : "ach") as "ach" | "card";
const SECOND_METHOD = (String(process.env.SECOND_METHOD || "card").trim().toLowerCase() === "ach"
  ? "ach"
  : "card") as "ach" | "card";

async function createIntent(orderId: string, method: "ach" | "card") {
  const res = await fetch(`${API_BASE}/api/supplier-orders/${encodeURIComponent(orderId)}/pay-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: TEST_AUTH_COOKIE,
    },
    body: JSON.stringify({ paymentMethod: method }),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function run() {
  if (!TEST_AUTH_COOKIE || !TEST_SUPPLIER_ORDER_ID) {
    console.log("SKIPPED: missing TEST_AUTH_COOKIE or TEST_SUPPLIER_ORDER_ID");
    process.exit(0);
  }

  const first = await createIntent(TEST_SUPPLIER_ORDER_ID, FIRST_METHOD);
  if (first.status !== 200) {
    console.error(`FAIL: first call status=${first.status} body=${JSON.stringify(first.data)}`);
    process.exit(1);
  }

  const firstIntentId = String(first.data?.paymentIntentId || "").trim();
  const firstMethod = String(first.data?.paymentMethod || "").trim();
  if (!firstIntentId || firstMethod !== FIRST_METHOD) {
    console.error(
      `FAIL: first call missing expected intent/method intent=${firstIntentId} method=${firstMethod}`,
    );
    process.exit(1);
  }

  const second = await createIntent(TEST_SUPPLIER_ORDER_ID, SECOND_METHOD);
  if (second.status !== 200 && second.status !== 409) {
    console.error(`FAIL: second call status=${second.status} body=${JSON.stringify(second.data)}`);
    process.exit(1);
  }

  if (second.status === 409) {
    console.log("PASS: second call returned 409 conflict for in-flight intent (expected-safe behavior).");
    process.exit(0);
  }

  const secondIntentId = String(second.data?.paymentIntentId || "").trim();
  const secondMethod = String(second.data?.paymentMethod || "").trim();
  if (!secondIntentId || secondMethod !== SECOND_METHOD) {
    console.error(
      `FAIL: second call missing expected intent/method intent=${secondIntentId} method=${secondMethod}`,
    );
    process.exit(1);
  }

  if (secondIntentId === firstIntentId) {
    console.error(
      `FAIL: method switched ${FIRST_METHOD}->${SECOND_METHOD} but intent was reused (${secondIntentId})`,
    );
    process.exit(1);
  }

  console.log(
    `PASS: method switch ${FIRST_METHOD}->${SECOND_METHOD} produced a new intent (${firstIntentId} -> ${secondIntentId}).`,
  );
}

run().catch((error) => {
  console.error("FAIL: script error", error);
  process.exit(1);
});

