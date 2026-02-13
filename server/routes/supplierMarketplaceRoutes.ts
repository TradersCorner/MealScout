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
  suppliers,
} from "@shared/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
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

export function registerSupplierMarketplaceRoutes(app: Express) {
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
      });
      const parsed = schema.parse(req.body || {});

      const updates: any = { ...parsed, updatedAt: new Date() };
      if (parsed.latitude !== undefined) {
        updates.latitude = parsed.latitude === null ? null : parsed.latitude;
      }
      if (parsed.longitude !== undefined) {
        updates.longitude = parsed.longitude === null ? null : parsed.longitude;
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
        paymentPreference: z.enum(["offsite", "in_person"]).default("offsite"),
        note: z.string().max(2000).optional().nullable(),
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
      const request = await db.transaction(async (tx: any) => {
        const [created] = await tx
          .insert(supplierRequests)
          .values({
            supplierId: supplier.id,
            buyerRestaurantId: parsed.buyerRestaurantId,
            status: "submitted",
            requestedFulfillment: "pickup",
            paymentPreference: parsed.paymentPreference,
            note: parsed.note ?? null,
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
          paymentPreference: z.enum(["offsite", "in_person"]).default("offsite"),
          note: z.string().max(2000).optional().nullable(),
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
        const request = await db.transaction(async (tx: any) => {
          const [created] = await tx
            .insert(supplierRequests)
            .values({
              supplierId: supplier.id,
              buyerRestaurantId: parsedMeta.buyerRestaurantId,
              status: "submitted",
              requestedFulfillment: "pickup",
              paymentPreference: parsedMeta.paymentPreference,
              note: parsedMeta.note ?? null,
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
