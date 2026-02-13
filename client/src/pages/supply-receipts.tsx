import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { BackHeader } from "@/components/back-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Restaurant = {
  id: string;
  name: string;
};

type Receipt = {
  id: string;
  receiptImageUrl: string;
  merchantName?: string | null;
  merchantCity?: string | null;
  merchantState?: string | null;
  purchasedAt?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

export default function SupplyReceiptsPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [selectedBuyerRestaurantId, setSelectedBuyerRestaurantId] =
    useState<string>("");
  const [merchantName, setMerchantName] = useState("");
  const [merchantCity, setMerchantCity] = useState("");
  const [merchantState, setMerchantState] = useState("");
  const [purchasedAt, setPurchasedAt] = useState("");

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

  const defaultBuyerRestaurantId = useMemo(() => {
    return selectedBuyerRestaurantId || (myRestaurants[0]?.id ?? "");
  }, [myRestaurants, selectedBuyerRestaurantId]);

  const receiptsQuery = useQuery<Receipt[]>({
    queryKey: ["/api/supply/receipts/mine"],
    queryFn: async () => {
      const res = await fetch("/api/supply/receipts/mine", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load receipts");
      return res.json();
    },
    staleTime: 15_000,
  });

  const uploadReceipt = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a receipt image first.");
      const form = new FormData();
      form.append("file", file);
      if (defaultBuyerRestaurantId) {
        form.append("buyerRestaurantId", defaultBuyerRestaurantId);
      }
      if (merchantName.trim()) form.append("merchantName", merchantName.trim());
      if (merchantCity.trim()) form.append("merchantCity", merchantCity.trim());
      if (merchantState.trim()) form.append("merchantState", merchantState.trim());
      if (purchasedAt) form.append("purchasedAt", purchasedAt);

      const res = await fetch("/api/supply/receipts", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to upload receipt");
      return data;
    },
    onSuccess: () => {
      setFile(null);
      toast({
        title: "Receipt uploaded",
        description: "Next: add items so we can track prices.",
      });
      receiptsQuery.refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error?.message || "Unable to upload receipt",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen pb-24">
      <BackHeader title="Receipt Uploads" fallbackHref="/suppliers" />

      <div className="px-4 space-y-3">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-semibold">Upload a receipt</div>
            <div className="text-xs text-muted-foreground">
              Upload a JPG/PNG/WebP receipt. We'll use it to find best prices.
            </div>

            {myRestaurants.length > 0 ? (
              <>
                <div className="text-sm font-semibold">Your business</div>
                <select
                  className="w-full border rounded px-2 py-2 text-sm bg-background"
                  value={defaultBuyerRestaurantId}
                  onChange={(e) => setSelectedBuyerRestaurantId(e.target.value)}
                >
                  {myRestaurants.map((biz) => (
                    <option key={biz.id} value={biz.id}>
                      {biz.name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            <div className="grid grid-cols-1 gap-2">
              <Input
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Merchant (optional) e.g. Walmart"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={merchantCity}
                  onChange={(e) => setMerchantCity(e.target.value)}
                  placeholder="City (optional)"
                />
                <Input
                  value={merchantState}
                  onChange={(e) => setMerchantState(e.target.value)}
                  placeholder="State (optional)"
                />
              </div>
              <Input
                type="datetime-local"
                value={purchasedAt}
                onChange={(e) => setPurchasedAt(e.target.value)}
              />
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <Button disabled={uploadReceipt.isPending} onClick={() => uploadReceipt.mutate()}>
              {uploadReceipt.isPending ? "Uploading..." : "Upload receipt"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="text-sm font-semibold">Your receipts</div>
            {receiptsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : receiptsQuery.isError ? (
              <div className="text-sm text-muted-foreground">Unable to load receipts.</div>
            ) : (receiptsQuery.data || []).length === 0 ? (
              <div className="text-sm text-muted-foreground">No receipts yet.</div>
            ) : (
              <div className="space-y-2">
                {(receiptsQuery.data || []).slice(0, 20).map((r) => (
                  <a
                    key={r.id}
                    href={r.receiptImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm underline"
                  >
                    {r.merchantName || "Receipt"}{" "}
                    <span className="text-muted-foreground">
                      ({r.status || "uploaded"})
                    </span>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}

