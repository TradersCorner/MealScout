import type { Express } from "express";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "../db";
import { storage } from "../storage";
import {
  supplierOrders,
  supplierOrderItems,
  supplierProducts,
  suppliers,
} from "@shared/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { isAuthenticated, isStaffOrAdmin, isSupplierOrAdmin } from "../unifiedAuth";

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
