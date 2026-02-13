import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { BackHeader } from "@/components/back-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Restaurant = { id: string; name: string };

const formatMoney = (cents: number) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

export default function SupplyScoutPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [selectedBuyerRestaurantId, setSelectedBuyerRestaurantId] =
    useState<string>("");
  const [listName, setListName] = useState("Weekly Supplies");
  const [listId, setListId] = useState<string>("");

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

  const buyerRestaurantId = useMemo(() => {
    return selectedBuyerRestaurantId || (myRestaurants[0]?.id ?? "");
  }, [selectedBuyerRestaurantId, myRestaurants]);

  const priceFinder = useQuery<any>({
    queryKey: ["/api/supply-scout/price-finder", q.trim(), buyerRestaurantId],
    queryFn: async () => {
      const params = new URLSearchParams({ q: q.trim() });
      if (buyerRestaurantId) params.set("buyerRestaurantId", buyerRestaurantId);
      const res = await fetch(`/api/supply-scout/price-finder?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to find prices");
      return res.json();
    },
    enabled: q.trim().length > 0,
    staleTime: 15_000,
  });

  const createList = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/supply-scout/lists", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: listName.trim() || "Shopping List",
          buyerRestaurantId: buyerRestaurantId || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to create list");
      return data;
    },
    onSuccess: (data: any) => {
      setListId(String(data?.id || ""));
      toast({ title: "List created" });
    },
    onError: (error: any) => {
      toast({
        title: "Create failed",
        description: error?.message || "Unable to create list",
        variant: "destructive",
      });
    },
  });

  const optimize = useQuery<any>({
    queryKey: ["/api/supply-scout/lists", listId, "optimize"],
    queryFn: async () => {
      const res = await fetch(`/api/supply-scout/lists/${listId}/optimize`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to optimize list");
      return data;
    },
    enabled: Boolean(listId),
    staleTime: 0,
  });

  return (
    <div className="min-h-screen pb-24">
      <BackHeader title="Supply Scout" fallbackHref="/suppliers" />

      <div className="px-4 space-y-3">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-semibold">Your business</div>
            {myRestaurants.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Create a business profile first.
              </div>
            ) : (
              <select
                className="w-full border rounded px-2 py-2 text-sm bg-background"
                value={buyerRestaurantId}
                onChange={(e) => setSelectedBuyerRestaurantId(e.target.value)}
              >
                {myRestaurants.map((biz) => (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                ))}
              </select>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-semibold">Price Finder</div>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search items (e.g. lemons, 16oz cups, ice)..."
            />
            {q.trim() ? (
              priceFinder.isLoading ? (
                <div className="text-sm text-muted-foreground">Searching…</div>
              ) : priceFinder.isError ? (
                <div className="text-sm text-muted-foreground">
                  No results yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {(priceFinder.data?.offers || []).slice(0, 8).map((o: any, idx: number) => (
                    <div key={idx} className="text-sm flex justify-between gap-3">
                      <div className="truncate">
                        {o?.store?.name || "Store"}
                        {o?.location?.city ? ` • ${o.location.city}` : ""}
                      </div>
                      <div className="text-muted-foreground whitespace-nowrap">
                        {formatMoney(o?.price?.unitPriceCents || 0)}
                        {o?.price?.unitLabel ? ` / ${o.price.unitLabel}` : ""}
                      </div>
                    </div>
                  ))}
                  {(priceFinder.data?.offers || []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No known prices yet. Next step: add store price imports.
                    </div>
                  ) : null}
                </div>
              )
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-semibold">Shopping Lists</div>
            <div className="grid grid-cols-1 gap-2">
              <Input
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="List name"
              />
              <Button disabled={createList.isPending} onClick={() => createList.mutate()}>
                {createList.isPending ? "Creating..." : "Create list"}
              </Button>
              {listId ? (
                <div className="text-xs text-muted-foreground">
                  List ID: {listId}
                </div>
              ) : null}
            </div>

            {listId ? (
              <div className="space-y-2">
                <Button variant="outline" onClick={() => optimize.refetch()}>
                  Generate optimized shopping plan
                </Button>
                {optimize.isFetching ? (
                  <div className="text-sm text-muted-foreground">Optimizing…</div>
                ) : optimize.data?.plan ? (
                  <div className="text-sm">
                    <div className="font-semibold">
                      Plan: {optimize.data.plan.type === "one_stop" ? "1 stop" : "2 stops"}
                    </div>
                    <div className="text-muted-foreground">
                      Est total: {formatMoney(optimize.data.plan.totalCents)}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Add items to the list, then optimize.
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}

