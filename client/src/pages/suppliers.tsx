import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BackHeader } from "@/components/back-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";

type Supplier = {
  id: string;
  businessName: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  isActive?: boolean | null;
};

type Restaurant = {
  id: string;
  name: string;
};

type SupplySearchRow = {
  product: {
    id: string;
    supplierId: string;
    name: string;
    sku?: string | null;
    description?: string | null;
    priceCents: number;
    unitLabel?: string | null;
  };
  supplier: Supplier;
  distanceMiles?: number | null;
};

const formatMoney = (cents: number) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

export default function SuppliersPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [orderListFile, setOrderListFile] = useState<File | null>(null);
  const [selectedBuyerRestaurantId, setSelectedBuyerRestaurantId] =
    useState<string>("");

  const { data: suppliers = [], isLoading, isError } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load suppliers");
      return res.json();
    },
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

  useEffect(() => {
    if (!selectedBuyerRestaurantId && myRestaurants.length > 0) {
      setSelectedBuyerRestaurantId(myRestaurants[0].id);
    }
  }, [myRestaurants, selectedBuyerRestaurantId]);

  const trimmedQ = q.trim();
  const showSearch = trimmedQ.length > 0;

  const { data: supplyMatches = [], isLoading: isSearchLoading } = useQuery<
    SupplySearchRow[]
  >({
    queryKey: ["/api/supply/search", trimmedQ, selectedBuyerRestaurantId],
    queryFn: async () => {
      const params = new URLSearchParams({ q: trimmedQ });
      if (selectedBuyerRestaurantId) {
        params.set("buyerRestaurantId", selectedBuyerRestaurantId);
      }
      const res = await fetch(`/api/supply/search?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to search supply");
      return res.json();
    },
    enabled: showSearch,
    staleTime: 15_000,
  });

  const groupedMatches = useMemo(() => {
    const bySupplier = new Map<string, { supplier: Supplier; rows: SupplySearchRow[] }>();
    for (const row of supplyMatches) {
      const supplierId = row.supplier.id;
      const existing = bySupplier.get(supplierId);
      if (!existing) bySupplier.set(supplierId, { supplier: row.supplier, rows: [row] });
      else existing.rows.push(row);
    }
    return Array.from(bySupplier.values());
  }, [supplyMatches]);

  const requestDemand = useMutation({
    mutationFn: async () => {
      if (!selectedBuyerRestaurantId) throw new Error("Select a business first.");
      const res = await fetch("/api/supply/demand", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerRestaurantId: selectedBuyerRestaurantId,
          itemName: trimmedQ,
          quantity: null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to request item");
      return data;
    },
    onSuccess: (data: any) => {
      const notified = Number(data?.notified || 0) || 0;
      const reason = String(data?.reason || "");
      if (reason === "already_listed") {
        toast({ title: "Already listed", description: "Try searching again." });
        return;
      }
      toast({
        title: "Requested",
        description:
          notified > 0
            ? `We notified ${notified} local supplier(s).`
            : "We recorded demand for this item.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request failed",
        description: error?.message || "Unable to request item",
        variant: "destructive",
      });
    },
  });

  const importOrderList = useMutation({
    mutationFn: async () => {
      if (!orderListFile) throw new Error("Choose an order list file first.");
      if (!selectedBuyerRestaurantId) throw new Error("Select a business first.");
      const form = new FormData();
      form.append("file", orderListFile);
      form.append("buyerRestaurantId", selectedBuyerRestaurantId);
      const res = await fetch("/api/supply/order-list/import", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to import order list");
      return data;
    },
    onSuccess: (data: any) => {
      const suppliers = Array.isArray(data?.suppliers) ? data.suppliers : [];
      if (suppliers.length === 0) {
        toast({
          title: "Imported",
          description: "No matching supplier deals found for that list yet.",
        });
        return;
      }
      const top = suppliers[0];
      toast({
        title: "Best match found",
        description: `${top?.supplier?.businessName || "Supplier"} can fulfill ${top.coverageCount} item(s).`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error?.message || "Unable to import order list",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen pb-24">
      <BackHeader title="Suppliers" fallbackHref="/map" />

      <div className="px-4 space-y-3">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-semibold">Search supplies</div>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try: lemons, cups, ice, tortillas..."
            />

            <div className="text-sm font-semibold">Your business (for local matches)</div>
            {myRestaurants.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                You don't have a business profile yet.
              </div>
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

            <div className="text-sm font-semibold">Upload order list</div>
            <div className="text-xs text-muted-foreground">
              Upload CSV/TSV/XLSX with columns like: <code>sku</code> or <code>name</code>, and{" "}
              <code>quantity</code>. We'll find which suppliers have the best deals.
            </div>
            <div className="flex gap-2">
              <Link href="/supplies/scout">
                <Button size="sm" variant="outline">
                  Open Price Scout
                </Button>
              </Link>
            </div>
            <input
              type="file"
              accept=".csv,.tsv,.xlsx"
              onChange={(e) => setOrderListFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              disabled={!orderListFile || !selectedBuyerRestaurantId || importOrderList.isPending}
              onClick={() => importOrderList.mutate()}
            >
              {importOrderList.isPending ? "Importing..." : "Find best deals"}
            </Button>
          </CardContent>
        </Card>

        {showSearch ? (
          isSearchLoading ? (
            <p className="text-sm text-muted-foreground">Searching...</p>
          ) : supplyMatches.length === 0 ? (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="font-semibold">No matches</div>
                <div className="text-sm text-muted-foreground">
                  If we don't have it listed yet, you can request it and we'll notify local suppliers.
                </div>
                <Button
                  disabled={!trimmedQ || requestDemand.isPending}
                  onClick={() => requestDemand.mutate()}
                >
                  Request "{trimmedQ}"
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {groupedMatches.map(({ supplier, rows }) => (
                <Card key={supplier.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">{supplier.businessName}</div>
                      <Link href={`/suppliers/${supplier.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-1">
                      {rows.slice(0, 6).map((r) => (
                        <div key={r.product.id} className="text-sm flex justify-between gap-3">
                          <div className="truncate">{r.product.name}</div>
                          <div className="text-muted-foreground whitespace-nowrap">
                            {formatMoney(r.product.priceCents)}
                            {r.product.unitLabel ? ` / ${r.product.unitLabel}` : ""}
                          </div>
                        </div>
                      ))}
                      {rows.length > 6 ? (
                        <div className="text-xs text-muted-foreground">
                          +{rows.length - 6} more
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : null}

        {!showSearch ? (
          isLoading ? (
            <p className="text-sm text-muted-foreground">Loading suppliers...</p>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">
              Unable to load suppliers. Please try again.
            </p>
          ) : suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No suppliers yet. Check back soon.
            </p>
          ) : (
            suppliers.map((supplier) => {
              const location = [supplier.address, supplier.city, supplier.state]
                .map((v) => (v || "").trim())
                .filter(Boolean)
                .join(", ");
              return (
                <Link key={supplier.id} href={`/suppliers/${supplier.id}`}>
                  <Card className="cursor-pointer hover:opacity-90 transition">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="mt-1">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{supplier.businessName}</div>
                        {location ? (
                          <div className="text-xs text-muted-foreground">
                            {location}
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )
        ) : null}
      </div>

      <Navigation />
    </div>
  );
}
