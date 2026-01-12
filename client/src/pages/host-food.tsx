import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo-head";

const TITLE = "Host Food at Your Location | MealScout";
const DESCRIPTION =
  "Hosts use MealScout to bring food trucks and restaurants to their location. Free forever.";

export default function HostFood() {
  const canonicalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/host-food`
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
            Host Food at Your Location
          </h1>
          <p className="text-lg text-gray-700">
            Bring food trucks or partner restaurants to your venue without fees
            or heavy setup.
          </p>
          <p className="text-lg text-gray-700">
            MealScout is free for hosts and events. We coordinate; you choose.
          </p>
          <div className="pt-2">
            <Button asChild size="lg">
              <Link href="/host-signup">Host With MealScout</Link>
            </Button>
          </div>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">How it works</h2>
          <p className="text-gray-700">
            Tell us your address, days available, and any constraints like power
            or parking. We surface the right trucks and restaurants.
          </p>
          <p className="text-gray-700">
            No fees for hosts. You get reliable service; businesses get fair,
            transparent coordination.
          </p>
        </section>
      </main>
    </div>
  );
}
