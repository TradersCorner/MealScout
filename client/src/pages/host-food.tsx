import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo-head";

const TITLE = "Host Food Trucks at Your Location | MealScout";
const DESCRIPTION =
  "Own a gas station, school, brewery, or other business? Host food trucks at your location. Free forever. Food trucks find you, you choose who parks.";

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
            Host Food Trucks at Your Business
          </h1>
          <p className="text-lg text-gray-700">
            Gas station, school, laundromat, office park, or brewery? Bring food
            trucks to your location with zero fees or setup costs.
          </p>
          <p className="text-lg text-gray-700">
            <strong>Completely free for hosts.</strong> Food trucks find you,
            you choose who parks.
          </p>
          <div className="pt-2">
            <Button asChild size="lg">
              <Link href="/host-signup">Become a Host Location</Link>
            </Button>
          </div>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">How it works</h2>
          <p className="text-gray-700">
            1. Tell us your business type, address, available days, and
            amenities (power, wifi, parking space).
          </p>
          <p className="text-gray-700">
            2. Food trucks discover your location and request to park.
          </p>
          <p className="text-gray-700">
            3. You approve or decline requests - you're always in control.
          </p>
          <p className="text-gray-700 font-semibold mt-4">
            No fees. No contracts. You can stop anytime.
          </p>
        </section>
      </main>
    </div>
  );
}
