import { useMemo, useState } from "react";
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
};

type SupplierProduct = {
  id: string;
  name: string;
  priceCents: number;
  unitLabel?: string | null;
  isActive?: boolean | null;
};

type SupplierOrder = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalCents: number;
  createdAt?: string;
};

const formatMoney = (cents: number) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

export default function SupplierDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newProduct, setNewProduct] = useState({
    name: "",
    priceDollars: "",
    unitLabel: "",
  });

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
                  {createProduct.isPending ? "Saving…" : "Create"}
                </Button>
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
