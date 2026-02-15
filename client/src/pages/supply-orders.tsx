import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { BackHeader } from "@/components/back-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SupplierOrderPaymentModal } from "@/components/supply/supplier-order-payment-modal";

type Restaurant = { id: string; name: string };

type SupplierOrderRow = {
  id: string;
  supplierId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  platformFeeCents: number;
  stripeFeeEstimateCents: number;
  totalCents: number;
  buyerDiscountCents?: number;
  buyerPaymentMethod?: string | null;
  createdAt?: string;
  supplier?: { id: string; businessName: string };
};

const formatMoney = (cents: number) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
const prettify = (raw: string) => {
  const s = String(raw || "").trim();
  if (!s) return "Unknown";
  return s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
};

export default function SupplyOrdersPage() {
  const { toast } = useToast();
  const [selectedBuyerRestaurantId, setSelectedBuyerRestaurantId] = useState("");
  const [payOrderId, setPayOrderId] = useState<string | null>(null);

  const { data: myRestaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants/my-restaurants"],
    queryFn: async () => {
      const res = await fetch("/api/restaurants/my-restaurants", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load restaurants");
      return res.json();
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    if (!selectedBuyerRestaurantId && myRestaurants.length > 0) {
      setSelectedBuyerRestaurantId(myRestaurants[0].id);
    }
  }, [myRestaurants, selectedBuyerRestaurantId]);

  const { data: orders = [], isLoading, isError, refetch } = useQuery<SupplierOrderRow[]>({
    queryKey: ["/api/supplier-orders/mine", selectedBuyerRestaurantId],
    queryFn: async () => {
      const params = new URLSearchParams({ buyerRestaurantId: selectedBuyerRestaurantId });
      const res = await fetch(`/api/supplier-orders/mine?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load orders");
      return data;
    },
    enabled: Boolean(selectedBuyerRestaurantId),
    staleTime: 10_000,
  });

  const sorted = useMemo(() => {
    const rows = Array.isArray(orders) ? orders : [];
    return rows;
  }, [orders]);

  const totals = useMemo(() => {
    const rows = Array.isArray(sorted) ? sorted : [];
    const open = rows.filter((o) => String(o.paymentStatus) !== "paid");
    const dueCents = open.reduce((sum, o) => {
      const total = Number(o.totalCents || 0) || 0;
      const discount = Number(o.buyerDiscountCents || 0) || 0;
      return sum + Math.max(0, total - discount);
    }, 0);
    return {
      count: rows.length,
      openCount: open.length,
      dueCents,
    };
  }, [sorted]);

  return (
    <div className="min-h-screen pb-24">
      <BackHeader title="Supply Orders" fallbackHref="/suppliers" />

      <div className="px-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your business</CardTitle>
            <CardDescription>Orders are tied to a specific business profile.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {myRestaurants.length === 0 ? (
              <div className="text-sm text-muted-foreground">No business profiles yet.</div>
            ) : (
              <select
                className="w-full border rounded px-2 py-2 text-sm bg-background"
                value={selectedBuyerRestaurantId}
                onChange={(e) => setSelectedBuyerRestaurantId(e.target.value)}
              >
                {myRestaurants.map((biz) => (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                ))}
              </select>
            )}
            <Button variant="outline" onClick={() => refetch()} disabled={!selectedBuyerRestaurantId}>
              Refresh
            </Button>
            {sorted.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-md border p-2">
                  <div className="text-xs text-muted-foreground">Orders</div>
                  <div className="font-semibold">{totals.count}</div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-xs text-muted-foreground">Open</div>
                  <div className="font-semibold">{totals.openCount}</div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-xs text-muted-foreground">Outstanding</div>
                  <div className="font-semibold">{formatMoney(totals.dueCents)}</div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : isError ? (
          <div className="text-sm text-muted-foreground">Unable to load orders.</div>
        ) : sorted.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              No supply orders yet. Start by browsing suppliers.
              <div className="pt-3">
                <Link href="/suppliers">
                  <Button>Shop suppliers</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sorted.map((o) => {
              const orderStatus = String(o.status || "");
              const paymentStatus = String(o.paymentStatus || "");
              const paymentMethod = String(o.paymentMethod || "");
              const discountCents = Number(o.buyerDiscountCents || 0) || 0;
              const dueNowCents = Math.max(0, (Number(o.totalCents || 0) || 0) - discountCents);
              const canPay =
                paymentMethod === "stripe" &&
                paymentStatus === "unpaid" &&
                orderStatus !== "cancelled";

              return (
                <Card key={o.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">
                          {o.supplier?.businessName || "Supplier"}
                        </CardTitle>
                        <CardDescription className="truncate">
                          Status: {prettify(orderStatus)} • Payment: {prettify(paymentStatus)}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {formatMoney(dueNowCents)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Subtotal</div>
                        <div className="font-semibold">{formatMoney(o.subtotalCents)}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Delivery fee</div>
                        <div className="font-semibold">{formatMoney(o.deliveryFeeCents || 0)}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Platform fee</div>
                        <div className="font-semibold">{formatMoney(o.platformFeeCents || 0)}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Buyer discount</div>
                        <div className="font-semibold">
                          {discountCents ? `-${formatMoney(discountCents)}` : "$0.00"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Payment method</span>
                        <span className="font-medium">
                          {paymentMethod === "stripe"
                            ? `Online${o.buyerPaymentMethod ? ` (${String(o.buyerPaymentMethod).toUpperCase()})` : ""}`
                            : prettify(paymentMethod)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Amount due now</span>
                        <span className="font-semibold">{formatMoney(dueNowCents)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                      </div>
                      {canPay ? (
                        <Button onClick={() => setPayOrderId(o.id)}>Pay now</Button>
                      ) : (
                        <Badge variant="outline">{prettify(paymentMethod)}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Navigation />

      {payOrderId ? (
        <SupplierOrderPaymentModal
          open={Boolean(payOrderId)}
          orderId={payOrderId}
          onOpenChange={(open) => {
            if (!open) setPayOrderId(null);
          }}
          onPaid={() => {
            toast({ title: "Payment received" });
            refetch();
          }}
        />
      ) : null}
    </div>
  );
}

