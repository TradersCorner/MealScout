import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo-head";

const TITLE = "Find Food Near You | MealScout";
const DESCRIPTION =
  "Diners use MealScout to discover local food trucks, bars, and restaurants, and see current specials.";

export default function FindFood() {
  const canonicalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/find-food`
      : undefined;

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={TITLE}
        description={DESCRIPTION}
        canonicalUrl={canonicalUrl}
      />
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Find Food Near You
          </h1>
          <p className="text-lg text-gray-700">
            Browse nearby food trucks, bars, and restaurants with current
            specials and availability.
          </p>
          <p className="text-lg text-gray-700">
            No accounts required for discovery—just search and go.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" variant="outline">
              <Link href="/search">Start Searching</Link>
            </Button>
          </div>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Why MealScout</h2>
          <p className="text-gray-700">
            Real-time specials from local businesses and trucks, with simple
            routes to contact or visit.
          </p>
          <p className="text-gray-700">
            No ads clutter, no blogs—just local options you can act on.
          </p>
        </section>
      </main>
    </div>
  );
}
