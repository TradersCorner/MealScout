import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { apiUrl } from "@/lib/api";
import { SEOHead } from "@/components/seo-head";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateItemListSchema } from "@/lib/schema-helpers";

type DealRow = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate?: string | null;
  endDate?: string | null;
  dealPath: string;
  restaurant: {
    id: string;
    name: string;
    cuisineType?: string | null;
    city?: string | null;
    state?: string | null;
    entityPath: string;
  };
  updatedAt?: string | null;
};

export default function DealsCityPage() {
  const params = useParams() as Record<string, string | undefined>;
  const citySlug = String(params.city || "").trim();

  const { data, isLoading, error } = useQuery({
    queryKey: ["deals-city", citySlug],
    enabled: Boolean(citySlug),
    queryFn: async () => {
      const res = await fetch(
        apiUrl(`/api/public/deals/city/${encodeURIComponent(citySlug)}`),
        { credentials: "include" },
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || `Failed to load deals (status=${res.status})`);
      }
      return res.json() as any;
    },
    staleTime: 60_000,
  });

  const cityName = String(data?.city?.name || citySlug);
  const state = String(data?.city?.state || "");
  const title = `Deals in ${cityName}${state ? `, ${state}` : ""}`;
  const description = `Fresh, active deals in ${cityName}.`;
  const canonicalUrl = data?.canonicalUrl || (citySlug ? `https://www.mealscout.us/deals/${encodeURIComponent(citySlug)}` : undefined);

  const deals: DealRow[] = Array.isArray(data?.deals) ? data.deals : [];

  const schemaData = useMemo(() => {
    if (!Array.isArray(deals) || deals.length === 0) return undefined;
    return generateItemListSchema(
      deals.map((d) => ({
        id: d.id,
        name: d.title,
        url: `https://www.mealscout.us${d.dealPath}`,
      })),
      title,
    );
  }, [deals, title]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={title} description={description} canonicalUrl={canonicalUrl} schemaData={schemaData} />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            Only active deals show here. Expired deals automatically disappear.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <a href={`/city/${encodeURIComponent(citySlug)}`}>Food trucks in {cityName}</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/deals/featured">Featured deals</a>
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {isLoading ? "Loading..." : `${Number(data?.totalDeals || deals.length) || 0} deals`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-sm text-destructive">
                  {(error as any)?.message || "Failed to load deals."}
                </div>
              ) : null}

              {!isLoading && deals.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No active deals found in {cityName} right now.
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deals.map((deal) => (
                  <Card key={deal.id} className="overflow-hidden">
                    <CardContent className="pt-6 flex flex-col gap-2">
                      <div className="font-semibold">
                        <a href={deal.dealPath} className="underline">
                          {deal.title}
                        </a>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <Link href={deal.restaurant.entityPath} className="underline">
                          {deal.restaurant.name}
                        </Link>
                        {deal.restaurant.cuisineType ? ` · ${deal.restaurant.cuisineType}` : ""}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-3">
                        {deal.description}
                      </div>

                      <div className="mt-2 flex gap-2 flex-wrap">
                        <Button asChild>
                          <a href={deal.dealPath}>View deal</a>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={deal.restaurant.entityPath}>View business</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

