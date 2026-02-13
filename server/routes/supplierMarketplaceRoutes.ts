import type { Express } from "express";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "../db";
import { storage } from "../storage";
import {
  supplierOrders,
  supplierOrderItems,
  supplierProducts,
  supplierRequests,
  supplierRequestItems,
  supplyOrderPreferences,
  supplyDemandNotifications,
  supplyDemands,
  suppliers,
} from "@shared/schema";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { isAuthenticated, isStaffOrAdmin, isSupplierOrAdmin } from "../unifiedAuth";
import multer from "multer";
import { parseTabularFile } from "../utils/tabularImport";
import { emailService } from "../emailService";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const computeFees = (subtotalCents: number) => {
  const platformFeeBps = Number(process.env.SUPPLIER_ORDER_PLATFORM_FEE_BPS || 0) || 0;
  const platformFeeFixed = Number(process.env.SUPPLIER_ORDER_PLATFORM_FEE_FIXED_CENTS || 0) || 0;
  const stripeFeeBps = Number(process.env.SUPPLIER_ORDER_STRIPE_FEE_BPS || 290) || 290;
  const stripeFeeFixed = Number(process.env.SUPPLIER_ORDER_STRIPE_FEE_FIXED_CENTS || 30) || 30;
  const includeStripeFee = String(process.env.SUPPLIER_ORDER_COLLECT_STRIPE_FEE || "").toLowerCase() === "true";

  const platformFeeCents =
    Math.max(0, Math.round((subtotalCents * platformFeeBps) / 10_000)) +
    Math.max(0, Math.round(platformFeeFixed));

  const stripeFeeEstimateCents = includeStripeFee
    ? Math.max(0, Math.round((subtotalCents * stripeFeeBps) / 10_000)) +
      Math.max(0, Math.round(stripeFeeFixed))
    : 0;

  const totalCents = subtotalCents + platformFeeCents + stripeFeeEstimateCents;
  return { platformFeeCents, stripeFeeEstimateCents, totalCents };
};

const normalizeSupplyKey = (raw: string) =>
  String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const haversineMiles = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.7613; // earth radius (miles)
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

async function resolveBuyerRestaurantOrThrow(req: any, buyerRestaurantId: string) {
  const buyerRestaurant = await storage.getRestaurant(buyerRestaurantId);
  if (!buyerRestaurant || String(buyerRestaurant.ownerId) !== String(req.user.id)) {
    throw new Error("Not authorized");
  }
  return buyerRestaurant;
}

async function findLocalSuppliersForBuyer(buyerRestaurant: any) {
  const radiusMiles = Number(process.env.SUPPLY_LOCAL_RADIUS_MILES || 75) || 75;
  const limit = Math.min(Number(process.env.SUPPLY_LOCAL_SUPPLIER_LIMIT || 60) || 60, 200);

  const conditions: any[] = [eq(suppliers.isActive, true)];
  const buyerState = String((buyerRestaurant as any).state || "").trim();
  if (buyerState) conditions.push(eq(suppliers.state, buyerState));

  const candidates = await db
    .select()
    .from(suppliers)
    .where(and(...conditions))
    .orderBy(desc(suppliers.updatedAt))
    .limit(500);

  const buyerLat = Number((buyerRestaurant as any).latitude);
  const buyerLon = Number((buyerRestaurant as any).longitude);
  const hasBuyerCoords = Number.isFinite(buyerLat) && Number.isFinite(buyerLon);

  if (!hasBuyerCoords) {
    return candidates.slice(0, limit);
  }

  const withDistance = (candidates as any[])
    .map((s: any) => {
      const lat = Number(s.latitude);
      const lon = Number(s.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const distanceMiles = haversineMiles({ lat: buyerLat, lon: buyerLon }, { lat, lon });
      return { supplier: s, distanceMiles };
    })
    .filter(Boolean) as Array<{ supplier: any; distanceMiles: number }>;

  return withDistance
    .filter((r) => r.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, limit)
    .map((r) => r.supplier);
}

async function searchSupplierProductsForTerms(params: {
  terms: string[];
  buyerRestaurant: any | null;
  limit: number;
}) {
  const terms = params.terms
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .slice(0, 100);
  if (terms.length === 0) return [];

  const conditions: any[] = [
    eq(supplierProducts.isActive, true),
    eq(suppliers.isActive, true),
  ];

  const buyerState = params.buyerRestaurant
    ? String((params.buyerRestaurant as any).state || "").trim()
    : "";
  if (buyerState) conditions.push(eq(suppliers.state, buyerState));

  const orConditions: any[] = [];
  for (const t of terms) {
    orConditions.push(ilike(supplierProducts.name, `%${t}%`));
    orConditions.push(ilike(supplierProducts.sku, `%${t}%`));
  }
  conditions.push(or(...orConditions));

  return db
    .select({
      product: supplierProducts,
      supplier: suppliers,
    })
    .from(supplierProducts)
    .innerJoin(suppliers, eq(supplierProducts.supplierId, suppliers.id))
    .where(and(...conditions))
    .orderBy(desc(supplierProducts.updatedAt))
    .limit(Math.min(Math.max(params.limit, 50), 1500));
}

async function recordDemandAndNotifyIfUnlisted(params: {
  buyerRestaurant: any;
  itemNameRaw: string;
  quantity?: number | null;
  source: "manual" | "request" | "import";
}) {
  const itemName = String(params.itemNameRaw || "").trim();
  const itemKey = normalizeSupplyKey(itemName);
  if (!itemKey) return { created: false, notified: 0, reason: "empty_key" };

  const [existing] = await db
    .select({ id: supplierProducts.id })
    .from(supplierProducts)
    .where(
      and(
        eq(supplierProducts.isActive, true),
        or(
          ilike(supplierProducts.name, `%${itemName}%`),
          ilike(supplierProducts.sku, `%${itemName}%`),
        ),
      ),
    )
    .limit(1);
  if (existing) return { created: false, notified: 0, reason: "already_listed" };

  const now = new Date();
  const [demand] = await db
    .insert(supplyDemands)
    .values({
      buyerRestaurantId: String((params.buyerRestaurant as any).id),
      itemKey,
      itemName,
      quantity: params.quantity ?? null,
      buyerCity: (params.buyerRestaurant as any).city ?? null,
      buyerState: (params.buyerRestaurant as any).state ?? null,
      buyerLatitude: (params.buyerRestaurant as any).latitude ?? null,
      buyerLongitude: (params.buyerRestaurant as any).longitude ?? null,
      source: params.source,
      createdAt: now,
      updatedAt: now,
    } as any)
    .returning();

  const notifyEnabled =
    String(process.env.SUPPLY_DEMAND_NOTIFY || "").toLowerCase() !== "false";
  if (!notifyEnabled) return { created: true, notified: 0, demandId: demand?.id };

  const localSuppliers = await findLocalSuppliersForBuyer(params.buyerRestaurant);
  if (localSuppliers.length === 0) return { created: true, notified: 0, demandId: demand?.id };

  const supplierIds = localSuppliers.map((s: any) => String(s.id));
  const existingNotifs = await db
    .select()
    .from(supplyDemandNotifications)
    .where(
      and(
        eq(supplyDemandNotifications.itemKey, itemKey),
        inArray(supplyDemandNotifications.supplierId, supplierIds),
      ),
    );

  const notifBySupplierId = new Map<string, any>(
    (existingNotifs as any[]).map((n: any) => [String(n.supplierId), n]),
  );

  const ttlHours = Number(process.env.SUPPLY_DEMAND_NOTIFY_TTL_HOURS || 24) || 24;
  const ttlMs = ttlHours * 60 * 60 * 1000;
  const nowMs = now.getTime();

  const toNotify = (localSuppliers as any[]).filter((s: any) => {
    const n = notifBySupplierId.get(String(s.id));
    if (!n) return true;
    const last = n.lastNotifiedAt ? new Date(n.lastNotifiedAt).getTime() : 0;
    return nowMs - last > ttlMs;
  });

  let notified = 0;
  for (const supplier of toNotify) {
    try {
      const supplierUser = await storage.getUser(String((supplier as any).userId)).catch(
        () => null,
      );
      const to =
        String((supplier as any).contactEmail || "").trim() ||
        String((supplierUser as any)?.email || "").trim();
      if (!to) continue;

      const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5000";
      const manageUrl = `${baseUrl.replace(/\/+$/, "")}/supplier/dashboard`;
      const location = [params.buyerRestaurant.city, params.buyerRestaurant.state]
        .map((s: any) => String(s || "").trim())
        .filter(Boolean)
        .join(", ");
      const subject = location
        ? `In-demand item near ${location}: ${itemName}`
        : `In-demand item: ${itemName}`;
      const html = `
        <h2>Item in demand</h2>
        <p><strong>Item:</strong> ${itemName}</p>
        ${location ? `<p><strong>Area:</strong> ${location}</p>` : ""}
        <p>A local vendor searched for this item but it isn't listed yet.</p>
        <p style="margin: 18px 0;">
          <a href="${manageUrl}" class="cta-button">Add it to your catalog</a>
        </p>
      `;
      await emailService.sendBasicEmail(to, subject, html, undefined, "general");

      await db
        .insert(supplyDemandNotifications)
        .values({
          supplierId: String((supplier as any).id),
          itemKey,
          lastNotifiedAt: now,
        } as any)
        .onConflictDoUpdate({
          target: [supplyDemandNotifications.supplierId, supplyDemandNotifications.itemKey] as any,
          set: { lastNotifiedAt: now } as any,
        });

      notified += 1;
    } catch (e) {
      console.warn("Demand notify failed:", e);
    }
  }

  return { created: true, notified, demandId: demand?.id };
}

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function ensureSupplierProfile(userId: string) {
  const [existing] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.userId, userId))
    .limit(1);
  if (existing) return existing;

  const user = await storage.getUser(userId).catch(() => null);

  const [created] = await db
    .insert(suppliers)
    .values({
      userId,
      businessName: "New Supplier",
      contactEmail: (user as any)?.email ?? null,
      isActive: true,
    } as any)
    .returning();
  return created;
}

async function ensureSupplyOrderPreferences(userId: string) {
  const [existing] = await db
    .select()
    .from(supplyOrderPreferences)
    .where(eq(supplyOrderPreferences.userId, userId))
    .limit(1);
  if (existing) return existing;

  const now = new Date();
  const [created] = await db
    .insert(supplyOrderPreferences)
    .values({
      userId,
      maxStops: 2,
      maxRadiusMiles: 20,
      costPerStopCents: 0,
      stopMinutes: 10,
      costPerMinuteCents: 0,
      pingSuppliers: true,
      allowSubstitutions: true,
      createdAt: now,
      updatedAt: now,
    } as any)
    .returning();
  return created;
}

export function registerSupplierMarketplaceRoutes(app: Express) {
  app.get("/api/supply/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const prefs = await ensureSupplyOrderPreferences(String(req.user.id));
      res.json(prefs);
    } catch (error: any) {
      console.error("Error loading supply preferences:", error);
      res.status(500).json({ message: error.message || "Failed to load preferences" });
    }
  });

  app.post("/api/supply/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const schema = z.object({
        maxStops: z.coerce.number().int().min(1).max(5).optional(),
        maxRadiusMiles: z.coerce.number().int().min(1).max(250).optional(),
        // Legacy
        costPerStopCents: z.coerce.number().int().min(0).max(50_000).optional(),
        // Preferred
        stopMinutes: z.coerce.number().int().min(0).max(240).optional(),
        costPerMinuteCents: z.coerce.number().int().min(0).max(5_000).optional(),
        pingSuppliers: z.coerce.boolean().optional(),
        allowSubstitutions: z.coerce.boolean().optional(),
      });
      const parsed = schema.parse(req.body || {});
      const existing = await ensureSupplyOrderPreferences(String(req.user.id));
      const now = new Date();
      const [updated] = await db
        .update(supplyOrderPreferences)
        .set({ ...parsed, updatedAt: now } as any)
        .where(eq(supplyOrderPreferences.id, existing.id))
        .returning();
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating supply preferences:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid preferences", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to update preferences" });
    }
  });

  app.get("/api/supply/search", isAuthenticated, async (req: any, res) => {
    try {
      const q = String(req.query?.q || "").trim();
      if (!q) return res.status(400).json({ message: "q is required" });
      const buyerRestaurantId = String(req.query?.buyerRestaurantId || "").trim();
      const limit = Math.min(Number(req.query?.limit || 50) || 50, 200);

      const buyerRestaurant = buyerRestaurantId
        ? await resolveBuyerRestaurantOrThrow(req, buyerRestaurantId)
        : null;

      const conditions: any[] = [
        eq(supplierProducts.isActive, true),
        eq(suppliers.isActive, true),
        or(
          ilike(supplierProducts.name, `%${q}%`),
          ilike(supplierProducts.sku, `%${q}%`),
        ),
      ];
      const buyerState = buyerRestaurant ? String((buyerRestaurant as any).state || "").trim() : "";
      if (buyerState) conditions.push(eq(suppliers.state, buyerState));

      const rows = await db
        .select({
          product: supplierProducts,
          supplier: suppliers,
        })
        .from(supplierProducts)
        .innerJoin(suppliers, eq(supplierProducts.supplierId, suppliers.id))
        .where(and(...conditions))
        .orderBy(desc(supplierProducts.updatedAt))
        .limit(Math.max(limit, 50));

      const buyerLat = buyerRestaurant ? Number((buyerRestaurant as any).latitude) : NaN;
      const buyerLon = buyerRestaurant ? Number((buyerRestaurant as any).longitude) : NaN;
      const hasBuyerCoords = Number.isFinite(buyerLat) && Number.isFinite(buyerLon);
      const radiusMiles = Number(process.env.SUPPLY_LOCAL_RADIUS_MILES || 75) || 75;

      const decorated = (rows as any[]).map((r: any) => {
        const lat = Number(r.supplier?.latitude);
        const lon = Number(r.supplier?.longitude);
        const distanceMiles =
          hasBuyerCoords && Number.isFinite(lat) && Number.isFinite(lon)
            ? haversineMiles({ lat: buyerLat, lon: buyerLon }, { lat, lon })
            : null;
        return { ...r, distanceMiles };
      });

      const filtered = hasBuyerCoords
        ? decorated.filter((r: any) => r.distanceMiles === null || r.distanceMiles <= radiusMiles)
        : decorated;

      filtered.sort((a: any, b: any) => {
        if (a.distanceMiles !== null && b.distanceMiles !== null) {
          return a.distanceMiles - b.distanceMiles;
        }
        if (a.distanceMiles !== null) return -1;
        if (b.distanceMiles !== null) return 1;
        return new Date(b.product.updatedAt).getTime() - new Date(a.product.updatedAt).getTime();
      });

      res.json(
        filtered.slice(0, limit).map((r: any) => ({
          product: r.product,
          supplier: r.supplier,
          distanceMiles: r.distanceMiles,
        })),
      );
    } catch (error: any) {
      console.error("Error searching supply:", error);
      if (String(error?.message || "") === "Not authorized") {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.status(500).json({ message: error.message || "Failed to search supply" });
    }
  });

  app.post("/api/supply/demand", isAuthenticated, async (req: any, res) => {
    try {
      const schema = z.object({
        buyerRestaurantId: z.string().min(1),
        itemName: z.string().min(1).max(120),
        quantity: z.number().int().min(1).max(100_000).optional().nullable(),
      });
      const parsed = schema.parse(req.body || {});
      const buyerRestaurant = await resolveBuyerRestaurantOrThrow(req, parsed.buyerRestaurantId);

      const result = await recordDemandAndNotifyIfUnlisted({
        buyerRestaurant,
        itemNameRaw: parsed.itemName,
        quantity: parsed.quantity ?? null,
        source: "manual",
      });

      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error creating supply demand:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid demand data", errors: error.errors });
      }
      if (String(error?.message || "") === "Not authorized") {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.status(500).json({ message: error.message || "Failed to create demand" });
    }
  });

  // Upload an order list (CSV/TSV/XLSX) and return best matching supplier deals.
  app.post(
    "/api/supply/order-list/import",
    isAuthenticated,
    importUpload.single("file"),
    async (req: any, res) => {
      try {
        const file = req.file;
        if (!file) return res.status(400).json({ message: "File is required" });

        const schema = z.object({
          buyerRestaurantId: z.string().min(1),
          maxStops: z.coerce.number().int().min(1).max(5).optional(),
          maxRadiusMiles: z.coerce.number().int().min(1).max(250).optional(),
          // Legacy
          costPerStopCents: z.coerce.number().int().min(0).max(50_000).optional(),
          // Preferred
          stopMinutes: z.coerce.number().int().min(0).max(240).optional(),
          costPerMinuteCents: z.coerce.number().int().min(0).max(5_000).optional(),
          pingSuppliers: z.coerce.boolean().optional(),
          allowSubstitutions: z.coerce.boolean().optional(),
        });
        const parsedMeta = schema.parse(req.body || {});

        const buyerRestaurant = await resolveBuyerRestaurantOrThrow(req, parsedMeta.buyerRestaurantId);

        const prefs = await ensureSupplyOrderPreferences(String(req.user.id));
        const maxStops =
          parsedMeta.maxStops !== undefined ? parsedMeta.maxStops : Number((prefs as any).maxStops || 2) || 2;
        const maxRadiusMiles =
          parsedMeta.maxRadiusMiles !== undefined
            ? parsedMeta.maxRadiusMiles
            : Number((prefs as any).maxRadiusMiles || 20) || 20;

        const stopMinutes =
          parsedMeta.stopMinutes !== undefined
            ? parsedMeta.stopMinutes
            : Number((prefs as any).stopMinutes ?? 10) || 10;
        const costPerMinuteCents =
          parsedMeta.costPerMinuteCents !== undefined
            ? parsedMeta.costPerMinuteCents
            : Number((prefs as any).costPerMinuteCents ?? 0) || 0;
        const costPerStopCentsEffective =
          costPerMinuteCents > 0
            ? Math.max(0, Math.round(stopMinutes * costPerMinuteCents))
            : parsedMeta.costPerStopCents !== undefined
              ? parsedMeta.costPerStopCents
              : Number((prefs as any).costPerStopCents || 0) || 0;

        const pingSuppliers =
          parsedMeta.pingSuppliers !== undefined
            ? Boolean(parsedMeta.pingSuppliers)
            : Boolean((prefs as any).pingSuppliers ?? true);
        const allowSubstitutions =
          parsedMeta.allowSubstitutions !== undefined
            ? Boolean(parsedMeta.allowSubstitutions)
            : Boolean((prefs as any).allowSubstitutions ?? true);

        const { headers, rows } = await parseTabularFile(
          file.buffer,
          file.originalname || "order-list.csv",
        );
        const normalizeHeader = (h: string) =>
          String(h || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");
        const headerMap = headers.map(normalizeHeader);
        const idx = (names: string[]) => {
          for (const name of names) {
            const i = headerMap.indexOf(name);
            if (i >= 0) return i;
          }
          return -1;
        };

        const skuIdx = idx(["sku", "product_sku", "item_sku"]);
        const nameIdx = idx(["name", "product", "product_name", "item", "description"]);
        const qtyIdx = idx(["quantity", "qty", "count"]);

        if (qtyIdx < 0) {
          return res.status(400).json({ message: "Missing required column: quantity", headers });
        }
        if (skuIdx < 0 && nameIdx < 0) {
          return res.status(400).json({ message: "Missing required column: sku or name", headers });
        }

        const toCell = (row: string[], i: number) =>
          i >= 0 ? String(row[i] ?? "").trim() : "";

        const parsedItems = rows
          .map((row) => {
            const sku = toCell(row, skuIdx);
            const itemName = toCell(row, nameIdx);
            const qtyRaw = toCell(row, qtyIdx);
            const quantity = Math.max(0, Math.floor(Number(qtyRaw)));
            if (!quantity) return null;
            if (!sku && !itemName) return null;
            const query = sku || itemName;
            return { sku: sku || null, itemName: itemName || null, query, quantity };
          })
          .filter(Boolean) as Array<{
          sku: string | null;
          itemName: string | null;
          query: string;
          quantity: number;
        }>;

        if (parsedItems.length === 0) {
          return res.status(400).json({ message: "No valid items found in file." });
        }

        const maxItems = 100;
        const items = parsedItems.slice(0, maxItems);

        const terms = Array.from(new Set(items.map((i) => i.query))).slice(0, 100);
        const matches = await searchSupplierProductsForTerms({
          terms,
          buyerRestaurant,
          limit: 1200,
        });

        const buyerLat = Number((buyerRestaurant as any).latitude);
        const buyerLon = Number((buyerRestaurant as any).longitude);
        const hasBuyerCoords = Number.isFinite(buyerLat) && Number.isFinite(buyerLon);
        const radiusMiles = maxRadiusMiles;

        const offers = (matches as any[]).map((r: any) => {
          const lat = Number(r.supplier?.latitude);
          const lon = Number(r.supplier?.longitude);
          const distanceMiles =
            hasBuyerCoords && Number.isFinite(lat) && Number.isFinite(lon)
              ? haversineMiles({ lat: buyerLat, lon: buyerLon }, { lat, lon })
              : null;
          return { ...r, distanceMiles };
        });

        const filteredOffers = hasBuyerCoords
          ? offers.filter((r: any) => r.distanceMiles === null || r.distanceMiles <= radiusMiles)
          : offers;

        const itemsOut = items.map((it) => {
          const q = String(it.query).trim();
          const ql = q.toLowerCase();
          const candidates = (filteredOffers as any[])
            .filter((r: any) => {
              const name = String(r.product?.name || "").toLowerCase();
              const sku = String(r.product?.sku || "").toLowerCase();
              if (name.includes(ql) || (sku && sku.includes(ql))) return true;
              if (!allowSubstitutions) return false;
              // Basic substitution: token overlap (keeps it cheap and avoids heavy NLP).
              const tokens = normalizeSupplyKey(q).split(" ").filter(Boolean);
              if (tokens.length <= 1) return false;
              return tokens.every((t) => name.includes(t) || (sku && sku.includes(t)));
            })
            .map((r: any) => ({
              supplierId: String(r.supplier.id),
              supplierName: String(r.supplier.businessName),
              supplier: r.supplier,
              productId: String(r.product.id),
              productName: String(r.product.name),
              sku: r.product.sku ?? null,
              unitLabel: r.product.unitLabel ?? null,
              priceCents: Number(r.product.priceCents || 0) || 0,
              distanceMiles: r.distanceMiles ?? null,
            }))
            .sort((a: any, b: any) => a.priceCents - b.priceCents)
            .slice(0, 10);

          return {
            query: q,
            itemName: it.itemName,
            sku: it.sku,
            quantity: it.quantity,
            offers: candidates,
          };
        });

        // Ping local suppliers for items we couldn't match at all (best-effort).
        if (pingSuppliers) {
          try {
            for (const item of itemsOut as any[]) {
              if ((item.offers || []).length > 0) continue;
              const name = String(item.itemName || item.query || "").trim();
              if (!name) continue;
              await recordDemandAndNotifyIfUnlisted({
                buyerRestaurant,
                itemNameRaw: name,
                quantity: Math.max(1, Math.floor(Number(item.quantity || 1) || 1)),
                source: "import",
              });
            }
          } catch (notifyError) {
            console.warn("Order-list demand notify failed:", notifyError);
          }
        }

        // Aggregate by supplier: how many items can they fulfill and estimated subtotal.
        const supplierAgg = new Map<
          string,
          { supplier: any; coverageCount: number; subtotalCents: number; items: any[] }
        >();

        for (const item of itemsOut as any[]) {
          const bestBySupplier = new Map<string, any>();
          for (const offer of item.offers || []) {
            const prev = bestBySupplier.get(offer.supplierId);
            if (!prev || offer.priceCents < prev.priceCents) bestBySupplier.set(offer.supplierId, offer);
          }
          for (const offer of bestBySupplier.values()) {
            const existing = supplierAgg.get(offer.supplierId);
            const lineTotalCents = offer.priceCents * Math.max(1, Number(item.quantity || 1) || 1);
            if (!existing) {
              supplierAgg.set(offer.supplierId, {
                supplier: offer.supplier,
                coverageCount: 1,
                subtotalCents: lineTotalCents,
                items: [{ query: item.query, productId: offer.productId, priceCents: offer.priceCents, quantity: item.quantity }],
              });
            } else {
              existing.coverageCount += 1;
              existing.subtotalCents += lineTotalCents;
              existing.items.push({ query: item.query, productId: offer.productId, priceCents: offer.priceCents, quantity: item.quantity });
            }
          }
        }

        const suppliersOut = Array.from(supplierAgg.entries())
          .map(([supplierId, v]) => ({
            supplierId,
            supplier: v.supplier,
            coverageCount: v.coverageCount,
            missingCount: itemsOut.length - v.coverageCount,
            subtotalCents: v.subtotalCents,
            items: v.items,
          }))
          .sort((a: any, b: any) => {
            if (b.coverageCount !== a.coverageCount) return b.coverageCount - a.coverageCount;
            return a.subtotalCents - b.subtotalCents;
          })
          .slice(0, 25);

        // Optimized plan: best 1-stop vs best 2-stop (maxStops governs).
        const requiredCount = (itemsOut as any[]).filter((i) => (i.offers || []).length > 0).length;
        const oneStop =
          suppliersOut
            .filter((s: any) => s.coverageCount === requiredCount)
            .map((s: any) => ({
              type: "one_stop",
              supplierIds: [s.supplierId],
              suppliers: [s.supplier],
              subtotalCents: s.subtotalCents,
              stopCostCents: costPerStopCentsEffective,
              totalCents: s.subtotalCents + costPerStopCentsEffective,
            }))
            .sort((a: any, b: any) => a.totalCents - b.totalCents)[0] || null;

        let twoStop: any = null;
        if (maxStops >= 2 && suppliersOut.length >= 2 && requiredCount > 0) {
          const topN = Math.min(25, suppliersOut.length);
          for (let i = 0; i < topN; i++) {
            for (let j = i + 1; j < topN; j++) {
              const a = suppliersOut[i];
              const b = suppliersOut[j];

              let subtotalCents = 0;
              let covered = 0;
              const lines: any[] = [];

              for (const item of itemsOut as any[]) {
                const qty = Math.max(1, Math.floor(Number(item.quantity || 1) || 1));
                const offers = item.offers || [];
                if (offers.length === 0) continue;
                const bestA = offers.find((o: any) => o.supplierId === a.supplierId) || null;
                const bestB = offers.find((o: any) => o.supplierId === b.supplierId) || null;
                const pick =
                  bestA && bestB
                    ? bestA.priceCents <= bestB.priceCents
                      ? { o: bestA, supplierId: a.supplierId }
                      : { o: bestB, supplierId: b.supplierId }
                    : bestA
                      ? { o: bestA, supplierId: a.supplierId }
                      : bestB
                        ? { o: bestB, supplierId: b.supplierId }
                        : null;
                if (!pick) continue;
                covered += 1;
                const lineTotalCents = Number(pick.o.priceCents) * qty;
                subtotalCents += lineTotalCents;
                lines.push({
                  query: item.query,
                  quantity: qty,
                  supplierId: pick.supplierId,
                  productId: pick.o.productId,
                  unitPriceCents: pick.o.priceCents,
                  lineTotalCents,
                });
              }

              if (covered !== requiredCount) continue;
              const stopCostCents = costPerStopCentsEffective * 2;
              const totalCents = subtotalCents + stopCostCents;
              if (!twoStop || totalCents < twoStop.totalCents) {
                twoStop = {
                  type: "two_stop",
                  supplierIds: [a.supplierId, b.supplierId],
                  suppliers: [a.supplier, b.supplier],
                  subtotalCents,
                  stopCostCents,
                  totalCents,
                  lines,
                };
              }
            }
          }
        }

        const plan = (() => {
          if (oneStop && twoStop) return twoStop.totalCents < oneStop.totalCents ? twoStop : oneStop;
          return oneStop || twoStop || null;
        })();

        res.json({
          success: true,
          headers,
          itemCount: itemsOut.length,
          items: itemsOut,
          suppliers: suppliersOut,
          plan,
          preferencesUsed: {
            maxStops,
            maxRadiusMiles,
            stopMinutes,
            costPerMinuteCents,
            costPerStopCents: costPerStopCentsEffective,
            pingSuppliers,
            allowSubstitutions,
          },
          truncated: parsedItems.length > maxItems,
        });
      } catch (error: any) {
        console.error("Error importing order list:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid import request", errors: error.errors });
        }
        if (String(error?.message || "") === "Not authorized") {
          return res.status(403).json({ message: "Not authorized" });
        }
        res.status(500).json({ message: error.message || "Failed to import order list" });
      }
    },
  );

  // Public-ish listing (requires auth for now).
  app.get("/api/suppliers", isAuthenticated, async (_req: any, res) => {
    try {
      const rows = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.isActive, true))
        .orderBy(desc(suppliers.updatedAt))
        .limit(200);
      res.json(rows);
    } catch (error) {
      console.error("Error listing suppliers:", error);
      res.status(500).json({ message: "Failed to load suppliers" });
    }
  });

  app.get("/api/suppliers/:supplierId/products", isAuthenticated, async (req: any, res) => {
    try {
      const supplierId = String(req.params.supplierId || "").trim();
      if (!supplierId) return res.status(400).json({ message: "Supplier ID required" });

      const rows = await db
        .select()
        .from(supplierProducts)
        .where(and(eq(supplierProducts.supplierId, supplierId), eq(supplierProducts.isActive, true)))
        .orderBy(desc(supplierProducts.updatedAt))
        .limit(500);
      res.json(rows);
    } catch (error) {
      console.error("Error listing supplier products:", error);
      res.status(500).json({ message: "Failed to load products" });
    }
  });

  app.post(
    "/api/supplier/products/import",
    isAuthenticated,
    isSupplierOrAdmin,
    importUpload.single("file"),
    async (req: any, res) => {
      try {
        const supplier = await ensureSupplierProfile(req.user.id);
        const file = req.file;
        if (!file) return res.status(400).json({ message: "File is required" });

        const { headers, rows } = await parseTabularFile(
          file.buffer,
          file.originalname || "products.csv",
        );

        const normalizeHeader = (h: string) =>
          String(h || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");
        const headerMap = headers.map(normalizeHeader);
        const idx = (names: string[]) => {
          for (const name of names) {
            const i = headerMap.indexOf(name);
            if (i >= 0) return i;
          }
          return -1;
        };

        const nameIdx = idx(["name", "product", "product_name", "title"]);
        const skuIdx = idx(["sku", "product_sku", "item_sku"]);
        const descIdx = idx(["description", "desc", "details"]);
        const unitIdx = idx(["unit", "unit_label", "uom"]);
        const priceIdx = idx(["price_cents", "price", "unit_price", "unit_price_cents"]);
        const activeIdx = idx(["is_active", "active", "enabled"]);

        if (nameIdx < 0) {
          return res.status(400).json({
            message: "Missing required column: name",
            headers,
          });
        }

        const parsePriceCents = (raw: string) => {
          const cleaned = String(raw || "").trim().replace(/[$,]/g, "");
          if (!cleaned) return 0;
          const n = Number(cleaned);
          if (!Number.isFinite(n)) return 0;
          // If the sheet provided cents explicitly, accept integers; otherwise treat as dollars.
          if (/^\d+$/.test(cleaned) && cleaned.length >= 3) {
            return Math.max(0, Math.round(n));
          }
          return Math.max(0, Math.round(n * 100));
        };

        const parseBool = (raw: string) => {
          const v = String(raw || "").trim().toLowerCase();
          if (!v) return true;
          if (["0", "false", "no", "n", "off"].includes(v)) return false;
          if (["1", "true", "yes", "y", "on"].includes(v)) return true;
          return true;
        };

        const toCell = (row: string[], i: number) =>
          i >= 0 ? String(row[i] ?? "").trim() : "";

        const created: any[] = [];
        const updated: any[] = [];
        const skipped: any[] = [];

        for (const row of rows) {
          const name = toCell(row, nameIdx);
          if (!name) continue;
          const sku = toCell(row, skuIdx) || null;
          const description = toCell(row, descIdx) || null;
          const unitLabel = toCell(row, unitIdx) || null;
          const priceCents = parsePriceCents(toCell(row, priceIdx));
          const isActive = parseBool(toCell(row, activeIdx));

          const existing = sku
            ? await db
                .select()
                .from(supplierProducts)
                .where(
                  and(
                    eq(supplierProducts.supplierId, supplier.id),
                    eq(supplierProducts.sku, sku),
                  ),
                )
                .limit(1)
            : await db
                .select()
                .from(supplierProducts)
                .where(
                  and(
                    eq(supplierProducts.supplierId, supplier.id),
                    eq(supplierProducts.name, name),
                  ),
                )
                .limit(1);

          if (existing.length > 0) {
            const [rowUpdated] = await db
              .update(supplierProducts)
              .set({
                name,
                sku,
                description,
                unitLabel,
                priceCents,
                isActive,
                updatedAt: new Date(),
              } as any)
              .where(eq(supplierProducts.id, existing[0].id))
              .returning();
            updated.push(rowUpdated);
            continue;
          }

          const [rowCreated] = await db
            .insert(supplierProducts)
            .values({
              supplierId: supplier.id,
              name,
              sku,
              description,
              unitLabel,
              priceCents,
              isActive,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any)
            .returning();
          if (rowCreated) created.push(rowCreated);
          else skipped.push({ name, sku });
        }

        res.json({
          success: true,
          imported: created.length + updated.length,
          created: created.length,
          updated: updated.length,
          skipped: skipped.length,
        });
      } catch (error: any) {
        console.error("Error importing supplier products:", error);
        res.status(500).json({ message: error.message || "Failed to import products" });
      }
    },
  );

  // Supplier self-management
  app.get("/api/supplier/me", isAuthenticated, isSupplierOrAdmin, async (req: any, res) => {
    try {
      const supplier = await ensureSupplierProfile(req.user.id);
      res.json(supplier);
    } catch (error) {
      console.error("Error loading supplier profile:", error);
      res.status(500).json({ message: "Failed to load supplier profile" });
    }
  });

  app.patch("/api/supplier/me", isAuthenticated, isSupplierOrAdmin, async (req: any, res) => {
    try {
      const supplier = await ensureSupplierProfile(req.user.id);
      const schema = z.object({
        businessName: z.string().min(1).max(120).optional(),
        address: z.string().max(200).optional().nullable(),
        city: z.string().max(120).optional().nullable(),
        state: z.string().max(50).optional().nullable(),
        latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
        longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
        contactPhone: z.string().max(50).optional().nullable(),
        contactEmail: z.string().max(200).optional().nullable(),
        isActive: z.boolean().optional(),
        offersDelivery: z.boolean().optional(),
        deliveryRadiusMiles: z.coerce.number().int().min(1).max(250).optional().nullable(),
        deliveryFeeCents: z.coerce.number().int().min(0).max(500_000).optional(),
        deliveryMinOrderCents: z.coerce.number().int().min(0).max(5_000_000).optional(),
        deliveryNotes: z.string().max(2000).optional().nullable(),
      });
      const parsed = schema.parse(req.body || {});

      const updates: any = { ...parsed, updatedAt: new Date() };
      if (parsed.latitude !== undefined) {
        updates.latitude = parsed.latitude === null ? null : parsed.latitude;
      }
      if (parsed.longitude !== undefined) {
        updates.longitude = parsed.longitude === null ? null : parsed.longitude;
      }
      if (parsed.deliveryRadiusMiles !== undefined) {
        updates.deliveryRadiusMiles =
          parsed.deliveryRadiusMiles === null ? null : parsed.deliveryRadiusMiles;
      }

      const [updated] = await db
        .update(suppliers)
        .set(updates)
        .where(eq(suppliers.id, supplier.id))
        .returning();

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating supplier profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to update supplier" });
    }
  });

  app.get("/api/supplier/products", isAuthenticated, isSupplierOrAdmin, async (req: any, res) => {
    try {
      const supplier = await ensureSupplierProfile(req.user.id);
      const rows = await db
        .select()
        .from(supplierProducts)
        .where(eq(supplierProducts.supplierId, supplier.id))
        .orderBy(desc(supplierProducts.updatedAt))
        .limit(500);
      res.json(rows);
    } catch (error) {
      console.error("Error listing supplier products:", error);
      res.status(500).json({ message: "Failed to load products" });
    }
  });

  app.post("/api/supplier/products", isAuthenticated, isSupplierOrAdmin, async (req: any, res) => {
    try {
      const supplier = await ensureSupplierProfile(req.user.id);
      const schema = z.object({
        name: z.string().min(1).max(120),
        description: z.string().max(2000).optional().nullable(),
        priceCents: z.number().int().min(0),
        unitLabel: z.string().max(40).optional().nullable(),
        imageUrl: z.string().max(500).optional().nullable(),
        isActive: z.boolean().optional(),
      });
      const parsed = schema.parse(req.body || {});

      const [created] = await db
        .insert(supplierProducts)
        .values({
          supplierId: supplier.id,
          name: parsed.name,
          description: parsed.description ?? null,
          priceCents: parsed.priceCents,
          unitLabel: parsed.unitLabel ?? null,
          imageUrl: parsed.imageUrl ?? null,
          isActive: parsed.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
        .returning();
      res.status(201).json(created);
    } catch (error: any) {
      console.error("Error creating supplier product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to create product" });
    }
  });

  app.patch("/api/supplier/products/:productId", isAuthenticated, isSupplierOrAdmin, async (req: any, res) => {
    try {
      const supplier = await ensureSupplierProfile(req.user.id);
      const productId = String(req.params.productId || "").trim();
      if (!productId) return res.status(400).json({ message: "Product ID required" });

      const schema = z.object({
        name: z.string().min(1).max(120).optional(),
        description: z.string().max(2000).optional().nullable(),
        priceCents: z.number().int().min(0).optional(),
        unitLabel: z.string().max(40).optional().nullable(),
        imageUrl: z.string().max(500).optional().nullable(),
        isActive: z.boolean().optional(),
      });
      const parsed = schema.parse(req.body || {});

      const [existing] = await db
        .select()
        .from(supplierProducts)
        .where(and(eq(supplierProducts.id, productId), eq(supplierProducts.supplierId, supplier.id)))
        .limit(1);
      if (!existing) return res.status(404).json({ message: "Product not found" });

      const [updated] = await db
        .update(supplierProducts)
        .set({ ...parsed, updatedAt: new Date() } as any)
        .where(eq(supplierProducts.id, productId))
        .returning();
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating supplier product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to update product" });
    }
  });

  // Buyer requests (pickup-only; payment handled offsite/in-person between buyer and supplier)
  app.post("/api/supplier-requests", isAuthenticated, async (req: any, res) => {
    try {
      const schema = z.object({
        supplierId: z.string().min(1),
        buyerRestaurantId: z.string().min(1),
        requestedFulfillment: z.enum(["pickup", "delivery"]).default("pickup"),
        paymentPreference: z.enum(["offsite", "in_person"]).default("offsite"),
        note: z.string().max(2000).optional().nullable(),
        deliveryInstructions: z.string().max(2000).optional().nullable(),
        deliveryAddress: z.string().max(400).optional().nullable(),
        deliveryCity: z.string().max(120).optional().nullable(),
        deliveryState: z.string().max(60).optional().nullable(),
        deliveryPostalCode: z.string().max(30).optional().nullable(),
        items: z
          .array(
            z.object({
              productId: z.string().optional().nullable(),
              sku: z.string().optional().nullable(),
              itemName: z.string().optional().nullable(),
              quantity: z.number().int().min(1).max(100_000),
            }),
          )
          .min(1),
      });
      const parsed = schema.parse(req.body || {});

      const buyerRestaurant = await storage.getRestaurant(parsed.buyerRestaurantId);
      if (!buyerRestaurant || String(buyerRestaurant.ownerId) !== String(req.user.id)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [supplier] = await db
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.id, parsed.supplierId), eq(suppliers.isActive, true)))
        .limit(1);
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });
      if (parsed.requestedFulfillment === "delivery" && !(supplier as any).offersDelivery) {
        return res.status(400).json({ message: "Supplier does not offer delivery." });
      }

      const productIds = parsed.items
        .map((i) => (i.productId ? String(i.productId) : ""))
        .filter(Boolean);
      const skus = parsed.items
        .map((i) => (i.sku ? String(i.sku).trim() : ""))
        .filter(Boolean);

      const products =
        productIds.length > 0
          ? await db
              .select()
              .from(supplierProducts)
              .where(
                and(
                  eq(supplierProducts.supplierId, supplier.id),
                  eq(supplierProducts.isActive, true),
                  inArray(supplierProducts.id, productIds),
                ),
              )
          : [];

      const productById = new Map<string, any>(
        (products as any[]).map((p: any) => [String(p.id), p]),
      );

      const productsBySku =
        skus.length > 0
          ? await db
              .select()
              .from(supplierProducts)
              .where(
                and(
                  eq(supplierProducts.supplierId, supplier.id),
                  eq(supplierProducts.isActive, true),
                  inArray(supplierProducts.sku, skus as any),
                ),
              )
          : [];
      const productBySku = new Map<string, any>(
        (productsBySku as any[]).map((p: any) => [String(p.sku || "").trim(), p]),
      );

      const normalized = parsed.items.map((item) => {
        const byId = item.productId ? productById.get(String(item.productId)) : null;
        const bySku = item.sku ? productBySku.get(String(item.sku).trim()) : null;
        const product = byId ?? bySku ?? null;
        return {
          productId: product ? String(product.id) : null,
          itemName: item.itemName ? String(item.itemName).trim() : product?.name ?? null,
          quantity: item.quantity,
        };
      });

      const now = new Date();
      const deliveryDefaults =
        parsed.requestedFulfillment === "delivery"
          ? {
              deliveryAddress: parsed.deliveryAddress ?? (buyerRestaurant as any).address ?? null,
              deliveryCity: parsed.deliveryCity ?? (buyerRestaurant as any).city ?? null,
              deliveryState: parsed.deliveryState ?? (buyerRestaurant as any).state ?? null,
              deliveryPostalCode: parsed.deliveryPostalCode ?? null,
              deliveryInstructions: parsed.deliveryInstructions ?? null,
              deliveryFeeCents: Number((supplier as any).deliveryFeeCents || 0) || 0,
              deliveryStatus: "pending",
            }
          : {
              deliveryAddress: null,
              deliveryCity: null,
              deliveryState: null,
              deliveryPostalCode: null,
              deliveryInstructions: null,
              deliveryFeeCents: 0,
              deliveryStatus: "pending",
            };

      const request = await db.transaction(async (tx: any) => {
        const [created] = await tx
          .insert(supplierRequests)
          .values({
            supplierId: supplier.id,
            buyerRestaurantId: parsed.buyerRestaurantId,
            status: "submitted",
            requestedFulfillment: parsed.requestedFulfillment,
            paymentPreference: parsed.paymentPreference,
            note: parsed.note ?? null,
            ...deliveryDefaults,
            createdAt: now,
            updatedAt: now,
          } as any)
          .returning();

        const values = normalized.map((row) => ({
          requestId: created.id,
          productId: row.productId,
          itemName: row.itemName,
          quantity: row.quantity,
          createdAt: now,
          updatedAt: now,
        }));
        await tx.insert(supplierRequestItems).values(values as any);
        return created;
      });

      // If any items are unmapped and not listed anywhere, record demand + ping local suppliers (best-effort).
      try {
        const demandByKey = new Map<string, { name: string; quantity: number | null }>();
        for (const row of normalized) {
          if (row.productId) continue;
          const name = String(row.itemName || "").trim();
          if (!name) continue;
          const key = normalizeSupplyKey(name);
          if (!key) continue;
          const prev = demandByKey.get(key);
          const nextQty = Math.max(1, Math.floor(Number(row.quantity || 0) || 1));
          if (!prev) demandByKey.set(key, { name, quantity: nextQty });
          else demandByKey.set(key, { name: prev.name, quantity: (prev.quantity ?? 0) + nextQty });
        }

        for (const d of demandByKey.values()) {
          await recordDemandAndNotifyIfUnlisted({
            buyerRestaurant,
            itemNameRaw: d.name,
            quantity: d.quantity,
            source: "request",
          });
        }
      } catch (demandError) {
        console.warn("Demand capture failed:", demandError);
      }

      // Notify supplier immediately (best-effort).
      try {
        const supplierUser = await storage.getUser(String((supplier as any).userId));
        const to =
          String((supplier as any).contactEmail || "").trim() ||
          String((supplierUser as any)?.email || "").trim();
        if (to) {
          const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5000";
          const manageUrl = `${baseUrl.replace(/\/+$/, "")}/supplier/dashboard`;
          const subject = `New supply request: ${buyerRestaurant.name}`;
          const html = `
            <h2>New supply request</h2>
            <p><strong>Buyer:</strong> ${buyerRestaurant.name}</p>
            <p><strong>Payment preference:</strong> ${parsed.paymentPreference}</p>
            <p><strong>Note:</strong> ${parsed.note ?? ""}</p>
            <p style="margin: 18px 0;">
              <a href="${manageUrl}" class="cta-button">View request</a>
            </p>
          `;
          await emailService.sendBasicEmail(to, subject, html, undefined, "general");
        }
      } catch (notifyError) {
        console.warn("Supplier request notify failed:", notifyError);
      }

      res.status(201).json({ request });
    } catch (error: any) {
      console.error("Error creating supplier request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(400).json({ message: error.message || "Failed to create request" });
    }
  });

  app.post(
    "/api/supplier-requests/import",
    isAuthenticated,
    importUpload.single("file"),
    async (req: any, res) => {
      try {
        const file = req.file;
        if (!file) return res.status(400).json({ message: "File is required" });

        const schema = z.object({
          supplierId: z.string().min(1),
          buyerRestaurantId: z.string().min(1),
          requestedFulfillment: z.enum(["pickup", "delivery"]).default("pickup"),
          paymentPreference: z.enum(["offsite", "in_person"]).default("offsite"),
          note: z.string().max(2000).optional().nullable(),
          deliveryInstructions: z.string().max(2000).optional().nullable(),
          deliveryAddress: z.string().max(400).optional().nullable(),
          deliveryCity: z.string().max(120).optional().nullable(),
          deliveryState: z.string().max(60).optional().nullable(),
          deliveryPostalCode: z.string().max(30).optional().nullable(),
        });
        const parsedMeta = schema.parse(req.body || {});

        const buyerRestaurant = await storage.getRestaurant(parsedMeta.buyerRestaurantId);
        if (!buyerRestaurant || String(buyerRestaurant.ownerId) !== String(req.user.id)) {
          return res.status(403).json({ message: "Not authorized" });
        }

        const [supplier] = await db
          .select()
          .from(suppliers)
          .where(and(eq(suppliers.id, parsedMeta.supplierId), eq(suppliers.isActive, true)))
          .limit(1);
        if (!supplier) return res.status(404).json({ message: "Supplier not found" });
        if (parsedMeta.requestedFulfillment === "delivery" && !(supplier as any).offersDelivery) {
          return res.status(400).json({ message: "Supplier does not offer delivery." });
        }

        const { headers, rows } = await parseTabularFile(
          file.buffer,
          file.originalname || "request.csv",
        );
        const normalizeHeader = (h: string) =>
          String(h || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");
        const headerMap = headers.map(normalizeHeader);
        const idx = (names: string[]) => {
          for (const name of names) {
            const i = headerMap.indexOf(name);
            if (i >= 0) return i;
          }
          return -1;
        };
        const skuIdx = idx(["sku", "product_sku", "item_sku"]);
        const nameIdx = idx(["name", "product", "product_name", "item"]);
        const qtyIdx = idx(["quantity", "qty", "count"]);

        if (qtyIdx < 0) {
          return res.status(400).json({ message: "Missing required column: quantity", headers });
        }
        if (skuIdx < 0 && nameIdx < 0) {
          return res.status(400).json({ message: "Missing required column: sku or name", headers });
        }

        const toCell = (row: string[], i: number) =>
          i >= 0 ? String(row[i] ?? "").trim() : "";
        const parsedItems = rows
          .map((row) => {
            const sku = toCell(row, skuIdx);
            const itemName = toCell(row, nameIdx);
            const qtyRaw = toCell(row, qtyIdx);
            const quantity = Math.max(0, Math.floor(Number(qtyRaw)));
            if (!quantity) return null;
            if (!sku && !itemName) return null;
            return { sku: sku || null, itemName: itemName || null, quantity };
          })
          .filter(Boolean) as Array<{ sku: string | null; itemName: string | null; quantity: number }>;

        if (parsedItems.length === 0) {
          return res.status(400).json({ message: "No valid items found in file." });
        }

        const skus = Array.from(new Set(parsedItems.map((i) => i.sku).filter(Boolean))) as string[];
        const productsBySku =
          skus.length > 0
            ? await db
                .select()
                .from(supplierProducts)
                .where(
                  and(
                    eq(supplierProducts.supplierId, supplier.id),
                    eq(supplierProducts.isActive, true),
                    inArray(supplierProducts.sku, skus as any),
                  ),
                )
            : [];
        const productBySku = new Map<string, any>(
          (productsBySku as any[]).map((p: any) => [String(p.sku || "").trim(), p]),
        );

        const normalized = parsedItems.map((item) => {
          const product = item.sku ? productBySku.get(String(item.sku).trim()) : null;
          return {
            productId: product ? String(product.id) : null,
            itemName: item.itemName || product?.name || item.sku || null,
            quantity: item.quantity,
          };
        });

        const now = new Date();
        const deliveryDefaults =
          parsedMeta.requestedFulfillment === "delivery"
            ? {
                deliveryAddress:
                  parsedMeta.deliveryAddress ?? (buyerRestaurant as any).address ?? null,
                deliveryCity: parsedMeta.deliveryCity ?? (buyerRestaurant as any).city ?? null,
                deliveryState: parsedMeta.deliveryState ?? (buyerRestaurant as any).state ?? null,
                deliveryPostalCode: parsedMeta.deliveryPostalCode ?? null,
                deliveryInstructions: parsedMeta.deliveryInstructions ?? null,
                deliveryFeeCents: Number((supplier as any).deliveryFeeCents || 0) || 0,
                deliveryStatus: "pending",
              }
            : {
                deliveryAddress: null,
                deliveryCity: null,
                deliveryState: null,
                deliveryPostalCode: null,
                deliveryInstructions: null,
                deliveryFeeCents: 0,
                deliveryStatus: "pending",
              };

        const request = await db.transaction(async (tx: any) => {
          const [created] = await tx
            .insert(supplierRequests)
            .values({
              supplierId: supplier.id,
              buyerRestaurantId: parsedMeta.buyerRestaurantId,
              status: "submitted",
              requestedFulfillment: parsedMeta.requestedFulfillment,
              paymentPreference: parsedMeta.paymentPreference,
              note: parsedMeta.note ?? null,
              ...deliveryDefaults,
              createdAt: now,
              updatedAt: now,
            } as any)
            .returning();
          const values = normalized.map((row) => ({
            requestId: created.id,
            productId: row.productId,
            itemName: row.itemName,
            quantity: row.quantity,
            createdAt: now,
            updatedAt: now,
          }));
          await tx.insert(supplierRequestItems).values(values as any);
          return created;
        });

        // If any items are unmapped and not listed anywhere, record demand + ping local suppliers (best-effort).
        try {
          const demandByKey = new Map<string, { name: string; quantity: number | null }>();
          for (const row of normalized) {
            if (row.productId) continue;
            const name = String(row.itemName || "").trim();
            if (!name) continue;
            const key = normalizeSupplyKey(name);
            if (!key) continue;
            const prev = demandByKey.get(key);
            const nextQty = Math.max(1, Math.floor(Number(row.quantity || 0) || 1));
            if (!prev) demandByKey.set(key, { name, quantity: nextQty });
            else
              demandByKey.set(key, {
                name: prev.name,
                quantity: (prev.quantity ?? 0) + nextQty,
              });
          }

          for (const d of demandByKey.values()) {
            await recordDemandAndNotifyIfUnlisted({
              buyerRestaurant,
              itemNameRaw: d.name,
              quantity: d.quantity,
              source: "import",
            });
          }
        } catch (demandError) {
          console.warn("Demand capture failed:", demandError);
        }

        res.status(201).json({ request, items: normalized.length });
      } catch (error: any) {
        console.error("Error importing supplier request:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid request data", errors: error.errors });
        }
        res.status(500).json({ message: error.message || "Failed to import request" });
      }
    },
  );

  app.get("/api/supplier-requests/mine", isAuthenticated, async (req: any, res) => {
    try {
      const buyerRestaurantId = String(req.query?.buyerRestaurantId || "").trim();
      if (!buyerRestaurantId) return res.status(400).json({ message: "buyerRestaurantId required" });
      const buyerRestaurant = await storage.getRestaurant(buyerRestaurantId);
      if (!buyerRestaurant || String(buyerRestaurant.ownerId) !== String(req.user.id)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const requests = await db
        .select()
        .from(supplierRequests)
        .where(eq(supplierRequests.buyerRestaurantId, buyerRestaurantId))
        .orderBy(desc(supplierRequests.createdAt))
        .limit(200);
      res.json(requests);
    } catch (error) {
      console.error("Error listing buyer requests:", error);
      res.status(500).json({ message: "Failed to load requests" });
    }
  });

  app.get("/api/supplier/requests", isAuthenticated, isSupplierOrAdmin, async (req: any, res) => {
    try {
      const supplier = await ensureSupplierProfile(req.user.id);
      const requests = await db
        .select()
        .from(supplierRequests)
        .where(eq(supplierRequests.supplierId, supplier.id))
        .orderBy(desc(supplierRequests.createdAt))
        .limit(500);
      res.json(requests);
    } catch (error) {
      console.error("Error listing supplier requests:", error);
      res.status(500).json({ message: "Failed to load requests" });
    }
  });

  app.post("/api/supplier/requests/:requestId/accept", isAuthenticated, isSupplierOrAdmin, async (req: any, res) => {
    try {
      const supplier = await ensureSupplierProfile(req.user.id);
      const requestId = String(req.params.requestId || "").trim();
      if (!requestId) return res.status(400).json({ message: "Request ID required" });

      const [request] = await db
        .select()
        .from(supplierRequests)
        .where(and(eq(supplierRequests.id, requestId), eq(supplierRequests.supplierId, supplier.id)))
        .limit(1);
      if (!request) return res.status(404).json({ message: "Request not found" });
      if (String((request as any).status) !== "submitted") {
        return res.status(409).json({ message: "Request is not pending." });
      }

      const items = await db
        .select()
        .from(supplierRequestItems)
        .where(eq(supplierRequestItems.requestId, requestId));

      const missing = (items as any[]).filter((i) => !i.productId);
      if (missing.length > 0) {
        return res.status(400).json({
          message: "Request contains unmapped items. Please fix the request items before accepting.",
          missingCount: missing.length,
        });
      }

      const productIds = Array.from(new Set((items as any[]).map((i) => String(i.productId))));
      const products = await db
        .select()
        .from(supplierProducts)
        .where(and(eq(supplierProducts.supplierId, supplier.id), inArray(supplierProducts.id, productIds)));
      const productById = new Map<string, any>((products as any[]).map((p: any) => [String(p.id), p]));

      let subtotalCents = 0;
      const normalizedItems = (items as any[]).map((item) => {
        const product = productById.get(String(item.productId));
        const unitPriceCents = Number(product?.priceCents || 0) || 0;
        const lineTotalCents = unitPriceCents * Number(item.quantity || 0);
        subtotalCents += lineTotalCents;
        return { productId: String(item.productId), quantity: Number(item.quantity), unitPriceCents, lineTotalCents };
      });

      const { platformFeeCents, stripeFeeEstimateCents, totalCents } = computeFees(subtotalCents);
      const now = new Date();

      const order = await db.transaction(async (tx: any) => {
        const [createdOrder] = await tx
          .insert(supplierOrders)
          .values({
            supplierId: supplier.id,
            truckRestaurantId: (request as any).buyerRestaurantId,
            status: "submitted",
            paymentMethod: "offsite",
            paymentStatus: "offsite",
            subtotalCents,
            platformFeeCents,
            stripeFeeEstimateCents,
            totalCents,
            pickupNote: (request as any).note ?? null,
            createdAt: now,
            updatedAt: now,
          } as any)
          .returning();

        await tx.insert(supplierOrderItems).values(
          normalizedItems.map((row) => ({
            orderId: createdOrder.id,
            productId: row.productId,
            quantity: row.quantity,
            unitPriceCents: row.unitPriceCents,
            lineTotalCents: row.lineTotalCents,
            createdAt: now,
            updatedAt: now,
          })) as any,
        );

        await tx
          .update(supplierRequests)
          .set({
            status: "accepted",
            acceptedAt: now,
            acceptedBy: req.user.id,
            orderId: createdOrder.id,
            deliveryStatus:
              String((request as any).requestedFulfillment) === "delivery" ? "accepted" : "pending",
            updatedAt: now,
          } as any)
          .where(eq(supplierRequests.id, requestId));

        return createdOrder;
      });

      // Notify buyer (best-effort).
      try {
        const buyerRestaurant = await storage.getRestaurant(
          String((request as any).buyerRestaurantId),
        );
        const buyerUser = buyerRestaurant?.ownerId
          ? await storage.getUser(String(buyerRestaurant.ownerId))
          : null;
        const to = String((buyerUser as any)?.email || "").trim();
        if (to) {
          const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5000";
          const ordersUrl = `${baseUrl.replace(/\/+$/, "")}/suppliers`;
          const subject = "Supplier accepted your request";
          const html = `
            <h2>Your supply request was accepted</h2>
            <p><strong>Supplier:</strong> ${supplier.businessName}</p>
            <p>Your request was accepted. Coordinate pickup and payment with the supplier.</p>
            <p style="margin: 18px 0;">
              <a href="${ordersUrl}" class="cta-button">View suppliers</a>
            </p>
          `;
          await emailService.sendBasicEmail(to, subject, html, undefined, "general");
        }
      } catch (notifyError) {
        console.warn("Buyer accept notify failed:", notifyError);
      }

      res.json({ success: true, orderId: order.id });
    } catch (error: any) {
      console.error("Error accepting supplier request:", error);
      res.status(500).json({ message: error.message || "Failed to accept request" });
    }
  });

  // Delivery portal updates (supplier only)
  app.patch(
    "/api/supplier/requests/:requestId/delivery",
    isAuthenticated,
    isSupplierOrAdmin,
    async (req: any, res) => {
      try {
        const supplier = await ensureSupplierProfile(req.user.id);
        const requestId = String(req.params.requestId || "").trim();
        if (!requestId) return res.status(400).json({ message: "Request ID required" });

        const [request] = await db
          .select()
          .from(supplierRequests)
          .where(
            and(eq(supplierRequests.id, requestId), eq(supplierRequests.supplierId, supplier.id)),
          )
          .limit(1);
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (String((request as any).requestedFulfillment) !== "delivery") {
          return res.status(400).json({ message: "This request is not a delivery request." });
        }

        const schema = z.object({
          deliveryStatus: z
            .enum(["pending", "accepted", "out_for_delivery", "delivered", "cancelled"])
            .optional(),
          deliveryScheduledFor: z.string().optional().nullable(),
          deliveryFeeCents: z.coerce.number().int().min(0).max(500_000).optional(),
        });
        const parsed = schema.parse(req.body || {});

        const now = new Date();
        const scheduled =
          parsed.deliveryScheduledFor !== undefined && parsed.deliveryScheduledFor !== null
            ? new Date(String(parsed.deliveryScheduledFor))
            : null;
        const safeScheduled =
          scheduled && !Number.isNaN(scheduled.getTime()) ? scheduled : null;

        const [updated] = await db
          .update(supplierRequests)
          .set({
            ...(parsed.deliveryStatus ? { deliveryStatus: parsed.deliveryStatus } : {}),
            ...(parsed.deliveryFeeCents !== undefined
              ? { deliveryFeeCents: parsed.deliveryFeeCents }
              : {}),
            ...(parsed.deliveryScheduledFor !== undefined
              ? { deliveryScheduledFor: safeScheduled }
              : {}),
            updatedAt: now,
          } as any)
          .where(eq(supplierRequests.id, requestId))
          .returning();

        res.json(updated);
      } catch (error: any) {
        console.error("Error updating delivery request:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid delivery update", errors: error.errors });
        }
        res.status(500).json({ message: error.message || "Failed to update delivery request" });
      }
    },
  );

  // Truck ordering
  app.post("/api/supplier-orders", isAuthenticated, async (req: any, res) => {
    try {
      const schema = z.object({
        supplierId: z.string().min(1),
        truckRestaurantId: z.string().min(1),
        paymentMethod: z.enum(["stripe", "offsite"]).default("offsite"),
        pickupNote: z.string().max(2000).optional().nullable(),
        items: z
          .array(
            z.object({
              productId: z.string().min(1),
              quantity: z.number().int().min(1).max(10_000),
            }),
          )
          .min(1),
      });
      const parsed = schema.parse(req.body || {});

      // Verify truck ownership + that it's a food truck.
      const truck = await storage.getRestaurant(parsed.truckRestaurantId);
      if (!truck || String(truck.ownerId) !== String(req.user.id)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      if (!truck.isFoodTruck) {
        return res.status(403).json({ message: "Only food trucks can order supplies." });
      }

      const [supplier] = await db
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.id, parsed.supplierId), eq(suppliers.isActive, true)))
        .limit(1);
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });

      const productIds = Array.from(new Set(parsed.items.map((i) => i.productId)));
      const products = await db
        .select()
        .from(supplierProducts)
        .where(
          and(
            eq(supplierProducts.supplierId, supplier.id),
            eq(supplierProducts.isActive, true),
            inArray(supplierProducts.id, productIds),
          ),
        );
      const productById = new Map<string, any>(products.map((p: any) => [String(p.id), p]));

      let subtotalCents = 0;
      const normalizedItems = parsed.items.map((item) => {
        const product = productById.get(String(item.productId));
        if (!product) {
          throw new Error(`Invalid product: ${item.productId}`);
        }
        const unitPriceCents = Number(product.priceCents || 0) || 0;
        const lineTotalCents = unitPriceCents * Number(item.quantity || 0);
        subtotalCents += lineTotalCents;
        return {
          productId: String(product.id),
          quantity: Number(item.quantity),
          unitPriceCents,
          lineTotalCents,
        };
      });

      if (subtotalCents <= 0) {
        return res.status(400).json({ message: "Order total must be greater than $0." });
      }

      const { platformFeeCents, stripeFeeEstimateCents, totalCents } =
        computeFees(subtotalCents);

      const bypassStripe =
        String(process.env.MEALSCOUT_BYPASS_STRIPE || "").toLowerCase() === "true" ||
        String(process.env.MEALSCOUT_TEST_MODE || "").toLowerCase() === "true";

      if (parsed.paymentMethod === "stripe" && !stripe && !bypassStripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const now = new Date();

      const created = await db.transaction(async (tx: any) => {
        const [order] = await tx
          .insert(supplierOrders)
          .values({
            supplierId: supplier.id,
            truckRestaurantId: parsed.truckRestaurantId,
            status: "submitted",
            paymentMethod: parsed.paymentMethod,
            paymentStatus: parsed.paymentMethod === "offsite" ? "offsite" : "unpaid",
            subtotalCents,
            platformFeeCents,
            stripeFeeEstimateCents,
            totalCents,
            pickupNote: parsed.pickupNote ?? null,
            createdAt: now,
            updatedAt: now,
          } as any)
          .returning();

        const values = normalizedItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
          createdAt: now,
          updatedAt: now,
        }));
        await tx.insert(supplierOrderItems).values(values as any);
        return order;
      });

      if (parsed.paymentMethod === "offsite") {
        return res.status(201).json({ order: created, payment: { method: "offsite" } });
      }

      if (bypassStripe) {
        await db
          .update(supplierOrders)
          .set({
            paymentStatus: "paid",
            updatedAt: new Date(),
          } as any)
          .where(eq(supplierOrders.id, created.id));
        return res.status(201).json({
          order: { ...created, paymentStatus: "paid" },
          payment: { bypassed: true, totalCents },
        });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const intentParams: Stripe.PaymentIntentCreateParams = {
        amount: totalCents,
        currency: "usd",
        metadata: {
          supplierOrderId: String(created.id),
          supplierId: String(supplier.id),
          truckRestaurantId: String(parsed.truckRestaurantId),
          subtotalCents: subtotalCents.toString(),
          platformFeeCents: platformFeeCents.toString(),
          stripeFeeEstimateCents: stripeFeeEstimateCents.toString(),
          totalCents: totalCents.toString(),
        },
      };
      const intent = await stripe.paymentIntents.create(intentParams);

      await db
        .update(supplierOrders)
        .set({ stripePaymentIntentId: intent.id, updatedAt: new Date() } as any)
        .where(eq(supplierOrders.id, created.id));

      res.status(201).json({
        order: { ...created, stripePaymentIntentId: intent.id },
        payment: {
          clientSecret: intent.client_secret,
          paymentIntentId: intent.id,
          totalCents,
          breakdown: { subtotalCents, platformFeeCents, stripeFeeEstimateCents },
        },
      });
    } catch (error: any) {
      console.error("Error creating supplier order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(400).json({ message: error.message || "Failed to create order" });
    }
  });

  app.get("/api/supplier-orders/mine", isAuthenticated, async (req: any, res) => {
    try {
      const truckId = String(req.query?.truckRestaurantId || "").trim();
      if (!truckId) return res.status(400).json({ message: "truckRestaurantId required" });

      const truck = await storage.getRestaurant(truckId);
      if (!truck || String(truck.ownerId) !== String(req.user.id)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const orders = await db
        .select()
        .from(supplierOrders)
        .where(eq(supplierOrders.truckRestaurantId, truckId))
        .orderBy(desc(supplierOrders.createdAt))
        .limit(200);
      res.json(orders);
    } catch (error) {
      console.error("Error listing truck supplier orders:", error);
      res.status(500).json({ message: "Failed to load orders" });
    }
  });

  app.get("/api/supplier/orders", isAuthenticated, isSupplierOrAdmin, async (req: any, res) => {
    try {
      const supplier = await ensureSupplierProfile(req.user.id);
      const orders = await db
        .select()
        .from(supplierOrders)
        .where(eq(supplierOrders.supplierId, supplier.id))
        .orderBy(desc(supplierOrders.createdAt))
        .limit(500);
      res.json(orders);
    } catch (error) {
      console.error("Error listing supplier orders:", error);
      res.status(500).json({ message: "Failed to load orders" });
    }
  });

  app.patch("/api/supplier/orders/:orderId/status", isAuthenticated, isSupplierOrAdmin, async (req: any, res) => {
    try {
      const supplier = await ensureSupplierProfile(req.user.id);
      const orderId = String(req.params.orderId || "").trim();
      if (!orderId) return res.status(400).json({ message: "Order ID required" });

      const schema = z.object({
        status: z.enum(["submitted", "ready", "completed", "cancelled"]),
      });
      const parsed = schema.parse(req.body || {});

      const [existing] = await db
        .select()
        .from(supplierOrders)
        .where(and(eq(supplierOrders.id, orderId), eq(supplierOrders.supplierId, supplier.id)))
        .limit(1);
      if (!existing) return res.status(404).json({ message: "Order not found" });

      const [updated] = await db
        .update(supplierOrders)
        .set({ status: parsed.status, updatedAt: new Date() } as any)
        .where(eq(supplierOrders.id, orderId))
        .returning();
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating supplier order status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid status", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to update order" });
    }
  });

  // Admin helper: list all orders
  app.get("/api/admin/supplier-orders", isAuthenticated, isStaffOrAdmin, async (_req: any, res) => {
    try {
      const orders = await db
        .select()
        .from(supplierOrders)
        .orderBy(desc(supplierOrders.createdAt))
        .limit(1000);
      res.json(orders);
    } catch (error) {
      console.error("Error listing all supplier orders:", error);
      res.status(500).json({ message: "Failed to load orders" });
    }
  });
}
