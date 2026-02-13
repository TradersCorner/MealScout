import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import Navigation from "@/components/navigation";
import { BackHeader } from "@/components/back-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type SupplierProduct = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  unitLabel?: string | null;
};

type Restaurant = {
  id: string;
  name: string;
  isFoodTruck?: boolean | null;
};

const formatMoney = (cents: number) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

export default function SupplierDetailPage() {
  const { supplierId } = useParams();
  const { toast } = useToast();
  const [pickupNote, setPickupNote] = useState("");
  const [selectedTruckId, setSelectedTruckId] = useState<string>("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: products = [], isLoading: isProductsLoading } = useQuery<
    SupplierProduct[]
  >({
    queryKey: ["/api/suppliers", supplierId, "products"],
    queryFn: async () => {
      const res = await fetch(`/api/suppliers/${supplierId}/products`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
    enabled: Boolean(supplierId),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  const { data: myRestaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants/my-restaurants"],
    queryFn: async () => {
      const res = await fetch("/api/restaurants/my-restaurants", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load restaurants");
      return res.json();
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  const myTrucks = useMemo(
    () => myRestaurants.filter((r) => Boolean((r as any).isFoodTruck)),
    [myRestaurants],
  );

  const cartItems = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    const items = Object.entries(quantities)
      .map(([productId, quantity]) => ({
        product: byId.get(productId) || null,
        productId,
        quantity,
      }))
      .filter((row) => row.product && row.quantity > 0) as Array<{
      product: SupplierProduct;
      productId: string;
      quantity: number;
    }>;
    return items;
  }, [quantities, products]);

  const subtotalCents = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.priceCents || 0),
      0,
    );
  }, [cartItems]);

  const placeOrder = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/supplier-orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          truckRestaurantId: selectedTruckId,
          paymentMethod: "offsite",
          pickupNote: pickupNote.trim() || null,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to place order");
      return data;
    },
    onSuccess: () => {
      setQuantities({});
      setPickupNote("");
      toast({
        title: "Order placed",
        description: "Your pickup order was sent to the supplier.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Order failed",
        description: error?.message || "Unable to place order",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen pb-24">
      <BackHeader title="Supplier" fallbackHref="/suppliers" />

      <div className="px-4 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-semibold">Your truck</div>
            {myTrucks.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                You don’t have a food truck profile yet.
              </div>
            ) : (
              <select
                className="w-full border rounded px-2 py-2 text-sm bg-background"
                value={selectedTruckId}
                onChange={(e) => setSelectedTruckId(e.target.value)}
              >
                <option value="">Select a truck…</option>
                {myTrucks.map((truck) => (
                  <option key={truck.id} value={truck.id}>
                    {truck.name}
                  </option>
                ))}
              </select>
            )}
            <div className="text-sm font-semibold">Pickup note</div>
            <Input
              value={pickupNote}
              onChange={(e) => setPickupNote(e.target.value)}
              placeholder="Optional note for the supplier"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-semibold">Products</div>
            {isProductsLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : products.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No products available.
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => {
                  const qty = quantities[product.id] || 0;
                  return (
                    <div
                      key={product.id}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatMoney(product.priceCents)}
                          {product.unitLabel ? ` / ${product.unitLabel}` : ""}
                        </div>
                        {product.description ? (
                          <div className="text-xs text-muted-foreground mt-1">
                            {product.description}
                          </div>
                        ) : null}
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) => {
                          const next = Number(e.target.value || 0);
                          setQuantities((prev) => ({
                            ...prev,
                            [product.id]: Number.isFinite(next) ? next : 0,
                          }));
                        }}
                        className="w-20"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Subtotal</div>
              <div className="text-lg font-semibold">{formatMoney(subtotalCents)}</div>
            </div>
            <Button
              disabled={
                placeOrder.isPending ||
                !selectedTruckId ||
                cartItems.length === 0 ||
                subtotalCents <= 0
              }
              onClick={() => placeOrder.mutate()}
            >
              {placeOrder.isPending ? "Placing…" : "Place order"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}
