import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo-head";

const TITLE = "Food Trucks | MealScout Local Discovery";
const DESCRIPTION =
  "Food trucks use MealScout to get local visibility, post specials, and connect with hosts and events.";

export default function ForFoodTrucks() {
  const canonicalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/for-food-trucks`
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
            MealScout for Food Trucks
          </h1>
          <p className="text-lg text-gray-700">
            Get discovered locally, post your daily specials, and connect with
            hosts and events without extra complexity.
          </p>
          <p className="text-lg text-gray-700">
            Listing is free. You set your price. We only make money when you
            book.
          </p>
          <div className="pt-2">
            <Button asChild size="lg">
              <Link href="/restaurant-signup">List My Food Truck</Link>
            </Button>
          </div>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Pricing</h2>
          <p className="text-gray-700">
            Food trucks list free. Booking fees only when you confirm events.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-1 text-gray-800">
            <p>MealScout is $25/month for food businesses.</p>
            <p>
              Businesses that join before March 1, 2026 are locked in at
              $25/month forever.
            </p>
            <p className="text-sm text-gray-700">
              (Applies to fixed-location businesses; trucks stay free to list.)
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            What you can do
          </h2>
          <p className="text-gray-700">
            Show up where diners, hosts, and event organizers look for local
            options. Post specials, share your schedule, and accept event
            interest.
          </p>
          <p className="text-gray-700">
            No blogs, no tiers, just clear visibility and booking when you want
            it.
          </p>
        </section>
      </main>
    </div>
  );
}
