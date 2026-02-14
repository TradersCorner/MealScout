/**
 * Basic load generator for supplier payment-intent endpoint.
 *
 * Required env:
 * - API_BASE
 * - TEST_AUTH_COOKIE
 * - TEST_SUPPLIER_ORDER_ID
 *
 * Optional:
 * - CONCURRENCY (default 10)
 * - REQUESTS (default 200)
 * - PAYMENT_METHOD ("ach" | "card", default "ach")
 */

const API_BASE = String(process.env.API_BASE || "http://localhost:5000").replace(/\/+$/, "");
const TEST_AUTH_COOKIE = String(process.env.TEST_AUTH_COOKIE || "").trim();
const TEST_SUPPLIER_ORDER_ID = String(process.env.TEST_SUPPLIER_ORDER_ID || "").trim();
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 10) || 10);
const REQUESTS = Math.max(1, Number(process.env.REQUESTS || 200) || 200);
const PAYMENT_METHOD = String(process.env.PAYMENT_METHOD || "ach").trim().toLowerCase() === "card"
  ? "card"
  : "ach";

async function worker(queue: number[]) {
  const stats = { ok: 0, conflict409: 0, rate429: 0, other: 0, latencies: [] as number[] };
  while (queue.length > 0) {
    const _i = queue.pop();
    if (_i === undefined) break;
    const started = Date.now();
    try {
      const res = await fetch(
        `${API_BASE}/api/supplier-orders/${encodeURIComponent(TEST_SUPPLIER_ORDER_ID)}/pay-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: TEST_AUTH_COOKIE,
            "Idempotency-Key": `load-${_i}`,
          },
          body: JSON.stringify({ paymentMethod: PAYMENT_METHOD }),
        },
      );
      const ms = Date.now() - started;
      stats.latencies.push(ms);
      if (res.status === 200) stats.ok += 1;
      else if (res.status === 409) stats.conflict409 += 1;
      else if (res.status === 429) stats.rate429 += 1;
      else stats.other += 1;
    } catch {
      stats.other += 1;
    }
  }
  return stats;
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

async function main() {
  if (!TEST_AUTH_COOKIE || !TEST_SUPPLIER_ORDER_ID) {
    console.error("Missing TEST_AUTH_COOKIE or TEST_SUPPLIER_ORDER_ID.");
    process.exit(1);
  }

  const queue = Array.from({ length: REQUESTS }, (_, i) => i + 1);
  const workers = Array.from({ length: CONCURRENCY }, () => worker(queue));
  const started = Date.now();
  const results = await Promise.all(workers);
  const totalMs = Date.now() - started;

  const merged = results.reduce(
    (acc, cur) => {
      acc.ok += cur.ok;
      acc.conflict409 += cur.conflict409;
      acc.rate429 += cur.rate429;
      acc.other += cur.other;
      acc.latencies.push(...cur.latencies);
      return acc;
    },
    { ok: 0, conflict409: 0, rate429: 0, other: 0, latencies: [] as number[] },
  );

  console.log("Supplier payment-intent load test");
  console.log(`requests=${REQUESTS} concurrency=${CONCURRENCY} durationMs=${totalMs}`);
  console.log(
    `ok=${merged.ok} conflict409=${merged.conflict409} rate429=${merged.rate429} other=${merged.other}`,
  );
  console.log(
    `latency p50=${percentile(merged.latencies, 50)}ms p95=${percentile(merged.latencies, 95)}ms p99=${percentile(merged.latencies, 99)}ms`,
  );
}

main().catch((error) => {
  console.error("Load test failed:", error);
  process.exit(1);
});

