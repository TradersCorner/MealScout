import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo-head";

const TITLE = "Bars | MealScout Local Discovery";
const DESCRIPTION =
  "Bars use MealScout to get discovered locally, post specials, and connect with diners, hosts, and events.";

export default function ForBars() {
  const canonicalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/for-bars`
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
            MealScout for Bars
          </h1>
          <p className="text-lg text-gray-700">
            Announce specials, stay visible to locals, and coordinate with hosts
            and events without extra overhead.
          </p>
          <p className="text-lg text-gray-700">
            Straightforward pricing with an early rollout guarantee.
          </p>
          <div className="pt-2">
            <Button asChild size="lg">
              <Link href="/restaurant-signup">List My Bar</Link>
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
            Lock is permanent—even if you pause or cancel and return.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            What you can do
          </h2>
          <p className="text-gray-700">
            Reach nearby customers, publish offers, and coordinate with local
            hosts and events quickly.
          </p>
          <p className="text-gray-700">
            Built for clarity: no roles, no tiers, just a single paid path for
            visibility.
          </p>
        </section>
      </main>
    </div>
  );
}

