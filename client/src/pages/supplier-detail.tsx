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
};

const formatMoney = (cents: number) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

export default function SupplierDetailPage() {
  const { supplierId } = useParams();
  const { toast } = useToast();
  const [pickupNote, setPickupNote] = useState("");
  const [selectedBuyerRestaurantId, setSelectedBuyerRestaurantId] =
    useState<string>("");
  const [paymentPreference, setPaymentPreference] = useState<
    "offsite" | "in_person"
  >("offsite");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [importFile, setImportFile] = useState<File | null>(null);

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
    () => myRestaurants,
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

  const submitRequest = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/supplier-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          buyerRestaurantId: selectedBuyerRestaurantId,
          paymentPreference,
          note: pickupNote.trim() || null,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to submit request");
      return data;
    },
    onSuccess: () => {
      setQuantities({});
      setPickupNote("");
      toast({
        title: "Request sent",
        description: "Your request was sent to the supplier.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request failed",
        description: error?.message || "Unable to send request",
        variant: "destructive",
      });
    },
  });

  const importRequest = useMutation({
    mutationFn: async () => {
      if (!importFile) throw new Error("Select a file");
      const form = new FormData();
      form.set("file", importFile);
      form.set("supplierId", String(supplierId || ""));
      form.set("buyerRestaurantId", selectedBuyerRestaurantId);
      form.set("paymentPreference", paymentPreference);
      form.set("note", pickupNote.trim());

      const res = await fetch("/api/supplier-requests/import", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to import request");
      return data;
    },
    onSuccess: (data: any) => {
      setImportFile(null);
      setQuantities({});
      toast({
        title: "Request imported",
        description: `Created request with ${Number(data?.items ?? 0)} items.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error?.message || "Unable to import request",
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
            <div className="text-sm font-semibold">Your business</div>
            {myTrucks.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                You don’t have a business profile yet.
              </div>
            ) : (
              <select
                className="w-full border rounded px-2 py-2 text-sm bg-background"
                value={selectedBuyerRestaurantId}
                onChange={(e) => setSelectedBuyerRestaurantId(e.target.value)}
              >
                <option value="">Select a business…</option>
                {myTrucks.map((biz) => (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                ))}
              </select>
            )}

            <div className="text-sm font-semibold">Payment preference</div>
            <select
              className="w-full border rounded px-2 py-2 text-sm bg-background"
              value={paymentPreference}
              onChange={(e) =>
                setPaymentPreference(e.target.value as "offsite" | "in_person")
              }
            >
              <option value="offsite">Pay offsite</option>
              <option value="in_person">Pay in person</option>
            </select>
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
            <div className="text-sm font-semibold">Upload order sheet</div>
            <div className="text-xs text-muted-foreground">
              Upload a CSV/TSV/XLSX with columns like: `sku` or `name`, and
              `quantity`.
            </div>
            <input
              type="file"
              accept=".csv,.tsv,.xlsx"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              disabled={
                importRequest.isPending ||
                !importFile ||
                !selectedBuyerRestaurantId
              }
              onClick={() => importRequest.mutate()}
            >
              {importRequest.isPending ? "Importing…" : "Import request"}
            </Button>
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
                submitRequest.isPending ||
                !selectedBuyerRestaurantId ||
                cartItems.length === 0 ||
                subtotalCents <= 0
              }
              onClick={() => submitRequest.mutate()}
            >
              {submitRequest.isPending ? "Sending…" : "Send request"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}
