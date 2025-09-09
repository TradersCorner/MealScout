import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import DealCard from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { Heart, Search } from "lucide-react";

export default function FavoritesPage() {
  const [savedDeals] = useState<string[]>([]); // In real app, this would come from localStorage or backend

  const { data: featuredDeals, isLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
  });

  // Filter deals based on saved deals (mock for now)
  const allDeals = Array.isArray(featuredDeals) ? featuredDeals : [];
  const favoriteDeals = allDeals.slice(0, 2); // Show first 2 as favorites for demo

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-background min-h-screen relative pb-20">
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <Heart className="w-6 h-6 text-red-500 mr-3" />
              Favorites
            </h1>
            <p className="text-sm text-muted-foreground">Your saved deals and restaurants</p>
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
        ) : favoriteDeals.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Saved Deals ({favoriteDeals.length})
            </h2>
            <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
              {favoriteDeals.map((deal: any) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-6">
              Start saving deals by tapping the heart icon on any deal card
            </p>
            <Link href="/search">
              <Button data-testid="button-browse-deals">
                <Search className="w-4 h-4 mr-2" />
                Browse Deals
              </Button>
            </Link>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-100">
          <h3 className="font-bold text-foreground mb-3 flex items-center">
            <Heart className="w-5 h-5 text-red-500 mr-2" />
            Pro Tip
          </h3>
          <p className="text-sm text-muted-foreground">
            Save deals to get notified when they're about to expire or when similar deals become available!
          </p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}