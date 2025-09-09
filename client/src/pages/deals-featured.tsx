import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import DealCard from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, SlidersHorizontal, Filter } from "lucide-react";

export default function FeaturedDealsPage() {
  const { data: featuredDeals, isLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
  });

  const allDeals = Array.isArray(featuredDeals) ? featuredDeals : [];

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative pb-20">
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-3 -ml-2" data-testid="button-back-featured">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-3 shadow-sm">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Hot Deals Nearby</h1>
              <p className="text-sm text-muted-foreground">Featured deals from top restaurants</p>
            </div>
          </div>
        </div>

        {/* Filter & Sort */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {allDeals.length} featured deal{allDeals.length !== 1 ? 's' : ''}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" data-testid="button-sort-featured">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Sort
            </Button>
            <Button variant="outline" size="sm" data-testid="button-filter-featured">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-md">
                <div className="w-full h-48 bg-muted"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : allDeals.length > 0 ? (
          <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
            {allDeals.map((deal: any) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">No featured deals yet</h3>
            <p className="text-muted-foreground mb-6">
              Check back soon for amazing featured deals from top restaurants!
            </p>
            <Link href="/search">
              <Button data-testid="button-browse-all-featured">
                Browse All Deals
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}