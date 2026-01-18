import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo-head";

const TITLE = "Restaurants | MealScout Local Discovery";
const DESCRIPTION =
  "Restaurants use MealScout to get discovered locally, post specials, and connect with diners, hosts, and events.";

export default function ForRestaurants() {
  const canonicalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/for-restaurants`
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
            MealScout for Restaurants
          </h1>
          <p className="text-lg text-gray-700">
            Reach nearby diners, share daily specials, and stay visible without
            juggling extra tools.
          </p>
          <p className="text-lg text-gray-700">
            Simple, honest pricing with an early rollout lock.
          </p>
          <div className="pt-2">
            <Button asChild size="lg">
              <Link href="/restaurant-signup">List My Restaurant</Link>
            </Button>
          </div>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Pricing</h2>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-1 text-gray-800">
            <p>MealScout is $25/month for food businesses.</p>
            <p>
              Businesses that join before March 1, 2026 are locked in at
              $25/month forever.
            </p>
          </div>
          <p className="text-gray-700">
            Price is stored, never recalculated. Cancel anytime—the lock stays.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            What you can do
          </h2>
          <p className="text-gray-700">
            Publish specials, show up in local discovery, and connect with hosts
            and events that fit your calendar.
          </p>
          <p className="text-gray-700">
            No tiers, no gimmicks—just fair coordination and visibility.
          </p>
        </section>
      </main>
    </div>
  );
}

