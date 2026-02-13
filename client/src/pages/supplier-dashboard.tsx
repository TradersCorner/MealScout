import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { BackHeader } from "@/components/back-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Supplier = {
  id: string;
  businessName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive?: boolean | null;
  offersDelivery?: boolean | null;
  deliveryRadiusMiles?: number | null;
  deliveryFeeCents?: number | null;
  deliveryMinOrderCents?: number | null;
  deliveryNotes?: string | null;
  stripeConnectAccountId?: string | null;
  stripeChargesEnabled?: boolean | null;
  stripePayoutsEnabled?: boolean | null;
  stripeOnboardingCompleted?: boolean | null;
  stripeConnectStatus?: string | null;
};

type StripeStatus = {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingCompleted: boolean;
  accountId?: string;
};

type SupplierProduct = {
  id: string;
  name: string;
  priceCents: number;
  unitLabel?: string | null;
  isActive?: boolean | null;
  deliveryEligible?: boolean | null;
};

type SupplierOrder = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalCents: number;
  createdAt?: string;
};

type SupplierRequest = {
  id: string;
  status: string;
  requestedFulfillment?: string | null;
  paymentPreference: string;
  note?: string | null;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
  deliveryPostalCode?: string | null;
  deliveryInstructions?: string | null;
  deliveryFeeCents?: number | null;
  deliveryStatus?: string | null;
  deliveryScheduledFor?: string | null;
  createdAt?: string;
};

const formatMoney = (cents: number) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const toDateTimeLocalValue = (raw: string | null | undefined) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export default function SupplierDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newProduct, setNewProduct] = useState({
    name: "",
    priceDollars: "",
    unitLabel: "",
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [deliverySettings, setDeliverySettings] = useState({
    offersDelivery: false,
    deliveryRadiusMiles: "",
    deliveryFeeDollars: "",
    deliveryMinOrderDollars: "",
    deliveryNotes: "",
  });
  const [deliveryEdits, setDeliveryEdits] = useState<
    Record<string, { deliveryScheduledFor: string; deliveryFeeDollars: string }>
  >({});

  const { data: supplier, isError: isSupplierError } = useQuery<Supplier>({
    queryKey: ["/api/supplier/me"],
    queryFn: async () => {
      const res = await fetch("/api/supplier/me", { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load supplier");
      return data;
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });

  const { data: stripeStatus } = useQuery<StripeStatus>({
    queryKey: ["/api/supplier/stripe/status"],
    queryFn: async () => {
      const res = await fetch("/api/supplier/stripe/status", { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load Stripe status");
      return data;
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    enabled: !isSupplierError,
  });

  const supplierDeliveryDefaults = useMemo(() => {
    return {
      offersDelivery: Boolean(supplier?.offersDelivery),
      deliveryRadiusMiles:
        supplier?.deliveryRadiusMiles !== null && supplier?.deliveryRadiusMiles !== undefined
          ? String(supplier.deliveryRadiusMiles)
          : "",
      deliveryFeeDollars:
        supplier?.deliveryFeeCents !== null && supplier?.deliveryFeeCents !== undefined
          ? String((Number(supplier.deliveryFeeCents) / 100).toFixed(2))
          : "",
      deliveryMinOrderDollars:
        supplier?.deliveryMinOrderCents !== null && supplier?.deliveryMinOrderCents !== undefined
          ? String((Number(supplier.deliveryMinOrderCents) / 100).toFixed(2))
          : "",
      deliveryNotes: supplier?.deliveryNotes ?? "",
    };
  }, [supplier]);

  useEffect(() => {
    if (!supplier) return;
    setDeliverySettings((prev) => ({ ...prev, ...supplierDeliveryDefaults }));
  }, [supplier, supplierDeliveryDefaults]);

  const { data: products = [] } = useQuery<SupplierProduct[]>({
    queryKey: ["/api/supplier/products"],
    queryFn: async () => {
      const res = await fetch("/api/supplier/products", {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load products");
      return data;
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    enabled: !isSupplierError,
  });

  const { data: orders = [] } = useQuery<SupplierOrder[]>({
    queryKey: ["/api/supplier/orders"],
    queryFn: async () => {
      const res = await fetch("/api/supplier/orders", {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load orders");
      return data;
    },
    staleTime: 15_000,
    gcTime: 10 * 60_000,
    enabled: !isSupplierError,
  });

  const { data: requests = [] } = useQuery<SupplierRequest[]>({
    queryKey: ["/api/supplier/requests"],
    queryFn: async () => {
      const res = await fetch("/api/supplier/requests", {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load requests");
      return data;
    },
    staleTime: 10_000,
    gcTime: 10 * 60_000,
    enabled: !isSupplierError,
  });

  const createProduct = useMutation({
    mutationFn: async () => {
      const price = Number(newProduct.priceDollars);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Enter a valid price");
      }
      const priceCents = Math.round(price * 100);
      const res = await fetch("/api/supplier/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name.trim(),
          priceCents,
          unitLabel: newProduct.unitLabel.trim() || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to create product");
      return data;
    },
    onSuccess: () => {
      setNewProduct({ name: "", priceDollars: "", unitLabel: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/products"] });
      toast({ title: "Product created" });
    },
    onError: (error: any) => {
      toast({
        title: "Create failed",
        description: error?.message || "Unable to create product",
        variant: "destructive",
      });
    },
  });

  const toggleDeliveryEligible = useMutation({
    mutationFn: async (params: { productId: string; deliveryEligible: boolean }) => {
      const res = await fetch(`/api/supplier/products/${params.productId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryEligible: params.deliveryEligible }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to update product");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "Unable to update product",
        variant: "destructive",
      });
    },
  });

  const startStripeOnboarding = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/supplier/stripe/onboard", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to start onboarding");
      return data as { onboardingUrl: string };
    },
    onSuccess: (data) => {
      if (data?.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else {
        toast({
          title: "Onboarding unavailable",
          description: "No onboarding URL returned.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Stripe setup failed",
        description: error?.message || "Unable to start Stripe onboarding",
        variant: "destructive",
      });
    },
  });

  const importProducts = useMutation({
    mutationFn: async () => {
      if (!importFile) throw new Error("Select a file");
      const form = new FormData();
      form.set("file", importFile);
      const res = await fetch("/api/supplier/products/import", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to import products");
      return data;
    },
    onSuccess: (data: any) => {
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/products"] });
      toast({
        title: "Import complete",
        description: `Imported ${Number(data?.imported ?? 0)} items.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error?.message || "Unable to import products",
        variant: "destructive",
      });
    },
  });

  const acceptRequest = useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const res = await fetch(`/api/supplier/requests/${requestId}/accept`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to accept request");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/orders"] });
      toast({ title: "Request accepted" });
    },
    onError: (error: any) => {
      toast({
        title: "Accept failed",
        description: error?.message || "Unable to accept request",
        variant: "destructive",
      });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async () => {
      const fee = Number(deliverySettings.deliveryFeeDollars);
      const minOrder = Number(deliverySettings.deliveryMinOrderDollars);
      const radius = deliverySettings.deliveryRadiusMiles
        ? Number(deliverySettings.deliveryRadiusMiles)
        : null;

      if (deliverySettings.offersDelivery) {
        if (radius !== null && (!Number.isFinite(radius) || radius <= 0)) {
          throw new Error("Enter a valid delivery radius in miles");
        }
        if (!Number.isFinite(fee) || fee < 0) throw new Error("Enter a valid delivery fee");
        if (!Number.isFinite(minOrder) || minOrder < 0) {
          throw new Error("Enter a valid delivery minimum order");
        }
      }

      const res = await fetch("/api/supplier/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offersDelivery: deliverySettings.offersDelivery,
          deliveryRadiusMiles: deliverySettings.offersDelivery ? radius : null,
          deliveryFeeCents: deliverySettings.offersDelivery ? Math.round(fee * 100) : 0,
          deliveryMinOrderCents: deliverySettings.offersDelivery ? Math.round(minOrder * 100) : 0,
          deliveryNotes: deliverySettings.deliveryNotes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to update delivery settings");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/me"] });
      toast({ title: "Delivery settings saved" });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error?.message || "Unable to save settings",
        variant: "destructive",
      });
    },
  });

  const updateDelivery = useMutation({
    mutationFn: async (params: {
      requestId: string;
      deliveryStatus?: string;
      deliveryScheduledFor?: string | null;
      deliveryFeeCents?: number;
    }) => {
      const res = await fetch(`/api/supplier/requests/${params.requestId}/delivery`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(params.deliveryStatus ? { deliveryStatus: params.deliveryStatus } : {}),
          ...(params.deliveryScheduledFor !== undefined
            ? { deliveryScheduledFor: params.deliveryScheduledFor }
            : {}),
          ...(params.deliveryFeeCents !== undefined
            ? { deliveryFeeCents: params.deliveryFeeCents }
            : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to update delivery");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/requests"] });
      toast({ title: "Delivery updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "Unable to update delivery",
        variant: "destructive",
      });
    },
  });

  const setOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`/api/supplier/orders/${orderId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to update order");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/orders"] });
      toast({ title: "Order updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "Unable to update order",
        variant: "destructive",
      });
    },
  });

  const activeCount = useMemo(
    () => products.filter((p) => p.isActive !== false).length,
    [products],
  );

  const deliveryRequests = useMemo(
    () => requests.filter((r) => String(r.requestedFulfillment || "") === "delivery"),
    [requests],
  );

  useEffect(() => {
    if (deliveryRequests.length === 0) return;
    setDeliveryEdits((prev) => {
      const next = { ...prev };
      for (const r of deliveryRequests) {
        if (next[r.id]) continue;
        next[r.id] = {
          deliveryScheduledFor: toDateTimeLocalValue(r.deliveryScheduledFor),
          deliveryFeeDollars: String(((Number(r.deliveryFeeCents || 0) || 0) / 100).toFixed(2)),
        };
      }
      return next;
    });
  }, [deliveryRequests]);

  return (
    <div className="min-h-screen pb-24">
      <BackHeader title="Supplier Dashboard" fallbackHref="/" />

      <div className="px-4 space-y-4">
        {isSupplierError ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              This dashboard is for supplier accounts.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="text-sm font-semibold">
                  {supplier?.businessName || "Supplier"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Active products: {activeCount}
                </div>
                <div className="pt-2 flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Payouts setup:{" "}
                    {stripeStatus?.connected
                      ? stripeStatus.payoutsEnabled
                        ? "Active"
                        : "Pending"
                      : "Not connected"}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={startStripeOnboarding.isPending}
                    onClick={() => startStripeOnboarding.mutate()}
                  >
                    {stripeStatus?.connected ? "Manage Stripe" : "Enable payouts"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm font-semibold">Add product</div>
                <Input
                  placeholder="Name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, name: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Price (e.g. 12.50)"
                    value={newProduct.priceDollars}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        priceDollars: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Unit (optional)"
                    value={newProduct.unitLabel}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, unitLabel: e.target.value }))
                    }
                  />
                </div>
                <Button
                  disabled={createProduct.isPending || !newProduct.name.trim()}
                  onClick={() => createProduct.mutate()}
                >
                  {createProduct.isPending ? "Saving..." : "Create"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm font-semibold">Delivery settings</div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={deliverySettings.offersDelivery}
                    onChange={(e) =>
                      setDeliverySettings((p) => ({
                        ...p,
                        offersDelivery: e.target.checked,
                      }))
                    }
                  />
                  Offer delivery
                </label>

                <div className="grid grid-cols-1 gap-2">
                  <Input
                    placeholder="Delivery radius (miles)"
                    value={deliverySettings.deliveryRadiusMiles}
                    onChange={(e) =>
                      setDeliverySettings((p) => ({
                        ...p,
                        deliveryRadiusMiles: e.target.value,
                      }))
                    }
                    disabled={!deliverySettings.offersDelivery}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Delivery fee ($)"
                      value={deliverySettings.deliveryFeeDollars}
                      onChange={(e) =>
                        setDeliverySettings((p) => ({
                          ...p,
                          deliveryFeeDollars: e.target.value,
                        }))
                      }
                      disabled={!deliverySettings.offersDelivery}
                    />
                    <Input
                      placeholder="Min order ($)"
                      value={deliverySettings.deliveryMinOrderDollars}
                      onChange={(e) =>
                        setDeliverySettings((p) => ({
                          ...p,
                          deliveryMinOrderDollars: e.target.value,
                        }))
                      }
                      disabled={!deliverySettings.offersDelivery}
                    />
                  </div>
                  <Input
                    placeholder="Delivery notes (optional)"
                    value={deliverySettings.deliveryNotes}
                    onChange={(e) =>
                      setDeliverySettings((p) => ({
                        ...p,
                        deliveryNotes: e.target.value,
                      }))
                    }
                    disabled={!deliverySettings.offersDelivery}
                  />
                </div>

                <Button
                  variant="outline"
                  disabled={updateSupplier.isPending}
                  onClick={() => updateSupplier.mutate()}
                >
                  {updateSupplier.isPending ? "Saving..." : "Save delivery settings"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm font-semibold">Import products</div>
                <div className="text-xs text-muted-foreground">
                  Upload CSV/TSV/XLSX. Required column: `name`. Optional: `sku`,
                  `price` (dollars) or `price_cents`, `unit_label`, `description`,
                  `active`.
                </div>
                <input
                  type="file"
                  accept=".csv,.tsv,.xlsx"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                <Button
                  variant="outline"
                  disabled={importProducts.isPending || !importFile}
                  onClick={() => importProducts.mutate()}
                >
                  {importProducts.isPending ? "Importing..." : "Import"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm font-semibold">Delivery portal</div>
                {deliveryRequests.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No delivery requests yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deliveryRequests.map((r) => {
                      const address = [r.deliveryAddress, r.deliveryCity, r.deliveryState]
                        .map((v) => (v || "").trim())
                        .filter(Boolean)
                        .join(", ");
                      return (
                        <div key={r.id} className="border rounded p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Delivery - {r.paymentPreference}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {r.deliveryStatus || "pending"} - {r.status}
                            </div>
                          </div>
                          {address ? <div className="text-sm">{address}</div> : null}
                          {r.deliveryInstructions ? (
                            <div className="text-sm text-muted-foreground">
                              {r.deliveryInstructions}
                            </div>
                          ) : null}
                          <div className="text-xs text-muted-foreground">
                            Fee: {formatMoney(Number(r.deliveryFeeCents || 0))}
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            <Input
                              type="datetime-local"
                              value={deliveryEdits[r.id]?.deliveryScheduledFor ?? ""}
                              onChange={(e) =>
                                setDeliveryEdits((p) => ({
                                  ...p,
                                  [r.id]: {
                                    ...(p[r.id] || {
                                      deliveryScheduledFor: "",
                                      deliveryFeeDollars: "",
                                    }),
                                    deliveryScheduledFor: e.target.value,
                                  },
                                }))
                              }
                            />
                            <Input
                              value={deliveryEdits[r.id]?.deliveryFeeDollars ?? ""}
                              onChange={(e) =>
                                setDeliveryEdits((p) => ({
                                  ...p,
                                  [r.id]: {
                                    ...(p[r.id] || {
                                      deliveryScheduledFor: "",
                                      deliveryFeeDollars: "",
                                    }),
                                    deliveryFeeDollars: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Delivery fee ($)"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updateDelivery.isPending}
                              onClick={() => {
                                const fee = Number(deliveryEdits[r.id]?.deliveryFeeDollars);
                                const feeCents = Number.isFinite(fee) ? Math.round(fee * 100) : 0;
                                updateDelivery.mutate({
                                  requestId: r.id,
                                  deliveryScheduledFor: deliveryEdits[r.id]?.deliveryScheduledFor
                                    ? deliveryEdits[r.id]?.deliveryScheduledFor
                                    : null,
                                  deliveryFeeCents: Math.max(0, feeCents),
                                });
                              }}
                            >
                              Save schedule/fee
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              disabled={acceptRequest.isPending || r.status !== "submitted"}
                              onClick={() => acceptRequest.mutate({ requestId: r.id })}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updateDelivery.isPending}
                              onClick={() =>
                                updateDelivery.mutate({
                                  requestId: r.id,
                                  deliveryStatus: "out_for_delivery",
                                })
                              }
                            >
                              Out for delivery
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updateDelivery.isPending}
                              onClick={() =>
                                updateDelivery.mutate({
                                  requestId: r.id,
                                  deliveryStatus: "delivered",
                                })
                              }
                            >
                              Delivered
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updateDelivery.isPending}
                              onClick={() =>
                                updateDelivery.mutate({
                                  requestId: r.id,
                                  deliveryStatus: "cancelled",
                                })
                              }
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm font-semibold">Requests</div>
                {requests.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No requests yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {requests
                      .filter((r) => String(r.requestedFulfillment || "") !== "delivery")
                      .map((r) => (
                      <div key={r.id} className="border rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            {r.paymentPreference}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.status}
                          </div>
                        </div>
                        {r.note ? (
                          <div className="text-sm">{r.note}</div>
                        ) : null}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={
                              acceptRequest.isPending || r.status !== "submitted"
                            }
                            onClick={() => acceptRequest.mutate({ requestId: r.id })}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm font-semibold">Products</div>
                {products.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No products yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatMoney(p.priceCents)}
                            {p.unitLabel ? ` / ${p.unitLabel}` : ""}
                          </div>
                          <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={p.deliveryEligible !== false}
                              onChange={(e) =>
                                toggleDeliveryEligible.mutate({
                                  productId: p.id,
                                  deliveryEligible: e.target.checked,
                                })
                              }
                              disabled={toggleDeliveryEligible.isPending}
                            />
                            Delivery eligible
                          </label>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.isActive === false ? "Inactive" : "Active"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm font-semibold">Orders</div>
                {orders.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No orders yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div key={o.id} className="border rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">
                            {formatMoney(o.totalCents)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {o.paymentMethod}:{o.paymentStatus}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Status: {o.status}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={setOrderStatus.isPending}
                            onClick={() =>
                              setOrderStatus.mutate({ orderId: o.id, status: "ready" })
                            }
                          >
                            Ready
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={setOrderStatus.isPending}
                            onClick={() =>
                              setOrderStatus.mutate({
                                orderId: o.id,
                                status: "completed",
                              })
                            }
                          >
                            Completed
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Navigation />
    </div>
  );
}
