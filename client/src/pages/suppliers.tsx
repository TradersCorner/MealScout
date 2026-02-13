import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BackHeader } from "@/components/back-header";
import { Building2 } from "lucide-react";

type Supplier = {
  id: string;
  businessName: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  isActive?: boolean | null;
};

export default function SuppliersPage() {
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

  return (
    <div className="min-h-screen pb-24">
      <BackHeader title="Suppliers" fallbackHref="/map" />

      <div className="px-4 space-y-3">
        {isLoading ? (
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
        )}
      </div>

      <Navigation />
    </div>
  );
}
