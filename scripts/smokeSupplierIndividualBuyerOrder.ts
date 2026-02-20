import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import {
  supplierProducts,
  suppliers,
  users,
} from "@shared/schema";
import { eq } from "drizzle-orm";

type HttpResult<T> = { status: number; data: T; cookie: string };

function cookieHeaderFromSetCookies(setCookies: string[]): string {
  const parts: string[] = [];
  for (const sc of setCookies) {
    const first = String(sc || "").split(";")[0].trim();
    if (first) parts.push(first);
  }
  // Avoid duplicates (last wins).
  const byName = new Map<string, string>();
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx <= 0) continue;
    byName.set(p.slice(0, idx), p);
  }
  return Array.from(byName.values()).join("; ");
}

async function httpJson<T>(
  url: string,
  opts: {
    method?: string;
    cookie?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {},
): Promise<HttpResult<T>> {
  const ORIGIN = String(process.env.API_ORIGIN || process.env.ORIGIN || "http://localhost:5000").replace(/\/+$/, "");
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      Origin: ORIGIN,
      Referer: `${ORIGIN}/`,
      ...(opts.cookie ? { Cookie: opts.cookie } : {}),
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    redirect: "manual",
  });
  const data = (await res.json().catch(() => null)) as T;
  const setCookies =
    // Node/undici supports getSetCookie()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (res.headers as any).getSetCookie === "function"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((res.headers as any).getSetCookie() as string[])
      : [];
  const cookie = cookieHeaderFromSetCookies(setCookies);
  return { status: res.status, data, cookie };
}

async function assertDbHasIndividualOrderColumns() {
  // Avoid running migrations here; just fail with a clear message.
  const result = await db.execute(
    sql`
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'supplier_orders'
        and column_name in ('buyer_user_id', 'truck_restaurant_id')
    `,
  );
  const rows = (result as any).rows || [];
  const cols = new Set(rows.map((r: any) => String(r.column_name)));
  if (!cols.has("truck_restaurant_id")) {
    throw new Error("DB missing supplier_orders.truck_restaurant_id (unexpected).");
  }
  if (!cols.has("buyer_user_id")) {
    throw new Error(
      "DB missing supplier_orders.buyer_user_id. Run: npm run migrate:sql -- 066_supplier_order_individual_buyers.sql",
    );
  }
}

async function createVerifiedUser(params: {
  email: string;
  phone: string;
  userType: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  const passwordHash = await bcrypt.hash(params.password, 10);
  const [created] = await db
    .insert(users)
    .values({
      email: params.email,
      phone: params.phone,
      userType: params.userType as any,
      firstName: params.firstName || "Test",
      lastName: params.lastName || "User",
      passwordHash,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .returning();
  return created as any;
}

async function run() {
  const API_BASE = String(process.env.API_BASE || "http://127.0.0.1:5000").replace(/\/+$/, "");
  const CLEANUP = String(process.env.CLEANUP || "true").toLowerCase() !== "false";
  const AUTO_START_SERVER = String(process.env.AUTO_START_SERVER || "true").toLowerCase() !== "false";

  let serverProc: ChildProcessWithoutNullStreams | null = null;

  const waitForHealth = async (msTotal: number) => {
    const started = Date.now();
    while (Date.now() - started < msTotal) {
      const res = await fetch(`${API_BASE}/api/health`).catch(() => null);
      if (res && (res as any).status === 200) return true;
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  };

  const isUp = await waitForHealth(1500);
  if (!isUp) {
    if (!AUTO_START_SERVER) {
      throw new Error(`Server not reachable at ${API_BASE}. Start with: npm run dev:server`);
    }

    // Best-effort local server start for smoke tests.
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    serverProc = spawn(npmCmd, ["run", "-s", "dev:server"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    serverProc.stdout.on("data", () => {});
    serverProc.stderr.on("data", () => {});
    serverProc.on("error", () => {});

    const ok = await waitForHealth(30_000);
    if (!ok) {
      try {
        serverProc.kill("SIGTERM");
      } catch {
        // ignore
      }
      throw new Error(`Failed to start dev server or health never became ready at ${API_BASE}.`);
    }
  }

  await assertDbHasIndividualOrderColumns();

  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const buyerEmail = `test.buyer.${nonce}@example.com`;
  const supplierEmail = `test.supplier.${nonce}@example.com`;
  const buyerPhone = `555000${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const supplierPhone = `555100${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const password = `TestPass!${Math.floor(Math.random() * 10000)}`;

  let buyerUser: any | null = null;
  let supplierUser: any | null = null;
  let supplierProfile: any | null = null;
  let product: any | null = null;

  try {
    buyerUser = await createVerifiedUser({
      email: buyerEmail,
      phone: buyerPhone,
      userType: "customer",
      password,
      firstName: "Test",
      lastName: "Buyer",
    });
    supplierUser = await createVerifiedUser({
      email: supplierEmail,
      phone: supplierPhone,
      userType: "supplier",
      password,
      firstName: "Test",
      lastName: "Supplier",
    });

    const [supplierCreated] = await db
      .insert(suppliers)
      .values({
        userId: supplierUser.id,
        businessName: `Test Supplier ${nonce}`,
        address: "123 Test St",
        city: "Testville",
        state: "TX",
        isActive: true,
        onlinePaymentsEnabled: false,
        offersDelivery: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();
    supplierProfile = supplierCreated;

    const [productCreated] = await db
      .insert(supplierProducts)
      .values({
        supplierId: supplierProfile.id,
        name: "Test Paper Towels",
        description: "Test product for automated smoke checks",
        sku: `TEST-SKU-${nonce}`,
        priceCents: 499,
        unitLabel: "case",
        isActive: true,
        deliveryEligible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();
    product = productCreated;

    const buyerLogin = await httpJson<any>(`${API_BASE}/api/auth/login`, {
      method: "POST",
      body: { email: buyerEmail, password },
    });
    if (buyerLogin.status !== 200 || !buyerLogin.cookie) {
      throw new Error(`Buyer login failed status=${buyerLogin.status} body=${JSON.stringify(buyerLogin.data)}`);
    }

    const supplierLogin = await httpJson<any>(`${API_BASE}/api/auth/login`, {
      method: "POST",
      body: { email: supplierEmail, password },
    });
    if (supplierLogin.status !== 200 || !supplierLogin.cookie) {
      throw new Error(`Supplier login failed status=${supplierLogin.status} body=${JSON.stringify(supplierLogin.data)}`);
    }

    // 1) Individual buyer creates a supplier order (no truckRestaurantId).
    const createdOrderRes = await httpJson<any>(`${API_BASE}/api/supplier-orders`, {
      method: "POST",
      cookie: buyerLogin.cookie,
      headers: {
        "Idempotency-Key": `smoke-order-${nonce}`,
      },
      body: {
        supplierId: supplierProfile.id,
        paymentMethod: "offsite",
        pickupNote: "Smoke test individual order",
        items: [{ productId: product.id, quantity: 2 }],
      },
    });
    if (createdOrderRes.status !== 201) {
      throw new Error(
        `Create order failed status=${createdOrderRes.status} body=${JSON.stringify(createdOrderRes.data)}`,
      );
    }
    const createdOrder = createdOrderRes.data?.order || createdOrderRes.data;
    const createdOrderId = String(createdOrder?.id || "").trim();
    if (!createdOrderId) {
      throw new Error(`Create order missing id body=${JSON.stringify(createdOrderRes.data)}`);
    }

    const mineOrdersRes = await httpJson<any[]>(`${API_BASE}/api/supplier-orders/mine`, {
      method: "GET",
      cookie: buyerLogin.cookie,
    });
    if (mineOrdersRes.status !== 200) {
      throw new Error(
        `List my orders failed status=${mineOrdersRes.status} body=${JSON.stringify(mineOrdersRes.data)}`,
      );
    }
    const mineHasOrder = Array.isArray(mineOrdersRes.data)
      ? mineOrdersRes.data.some((o: any) => String(o?.id) === createdOrderId)
      : false;
    if (!mineHasOrder) {
      throw new Error(`List my orders did not include created orderId=${createdOrderId}`);
    }

    const getOrderRes = await httpJson<any>(`${API_BASE}/api/supplier-orders/${encodeURIComponent(createdOrderId)}`, {
      method: "GET",
      cookie: buyerLogin.cookie,
    });
    if (getOrderRes.status !== 200) {
      throw new Error(`Get order failed status=${getOrderRes.status} body=${JSON.stringify(getOrderRes.data)}`);
    }

    // 2) Individual buyer creates a supplier request; supplier accepts; acceptance creates a supplier order.
    const reqRes = await httpJson<any>(`${API_BASE}/api/supplier-requests`, {
      method: "POST",
      cookie: buyerLogin.cookie,
      body: {
        supplierId: supplierProfile.id,
        requestedFulfillment: "pickup",
        paymentPreference: "offsite",
        note: "Smoke test request",
        items: [{ productId: product.id, quantity: 1 }],
      },
    });
    if (reqRes.status !== 201) {
      throw new Error(`Create request failed status=${reqRes.status} body=${JSON.stringify(reqRes.data)}`);
    }
    const requestId = String(reqRes.data?.request?.id || "").trim();
    if (!requestId) {
      throw new Error(`Create request missing id body=${JSON.stringify(reqRes.data)}`);
    }

    const acceptRes = await httpJson<any>(
      `${API_BASE}/api/supplier/requests/${encodeURIComponent(requestId)}/accept`,
      {
        method: "POST",
        cookie: supplierLogin.cookie,
        body: {},
      },
    );
    if (acceptRes.status !== 200) {
      throw new Error(`Accept request failed status=${acceptRes.status} body=${JSON.stringify(acceptRes.data)}`);
    }
    const acceptedOrderId = String(acceptRes.data?.orderId || "").trim();
    if (!acceptedOrderId) {
      throw new Error(`Accept request missing orderId body=${JSON.stringify(acceptRes.data)}`);
    }

    const getAcceptedOrderRes = await httpJson<any>(
      `${API_BASE}/api/supplier-orders/${encodeURIComponent(acceptedOrderId)}`,
      { method: "GET", cookie: buyerLogin.cookie },
    );
    if (getAcceptedOrderRes.status !== 200) {
      throw new Error(
        `Get accepted order failed status=${getAcceptedOrderRes.status} body=${JSON.stringify(getAcceptedOrderRes.data)}`,
      );
    }

    console.log("PASS: individual buyer order + request->accept->order flows succeeded.");
  } finally {
    if (CLEANUP) {
      try {
        if (supplierUser?.id) {
          await db.delete(users).where(eq(users.id, String(supplierUser.id)));
        }
      } catch {
        // ignore
      }
      try {
        if (buyerUser?.id) {
          await db.delete(users).where(eq(users.id, String(buyerUser.id)));
        }
      } catch {
        // ignore
      }
    }
    if (serverProc) {
      try {
        serverProc.kill("SIGTERM");
      } catch {
        // ignore
      }
    }
  }
}

run().catch((err) => {
  console.error("FAIL:", err?.message || err);
  process.exit(1);
});
