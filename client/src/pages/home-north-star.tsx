import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Truck, MapPin, Calendar, Search } from "lucide-react";
import Navigation from "@/components/navigation";
import { SEOHead } from "@/components/seo-head";
import { authDebugProbe } from "@/lib/authDebug";

const HOME_TITLE = "MealScout | Food Truck Finder & Parking Sourcing";
const HOME_DESCRIPTION =
  "MealScout helps food trucks find real places to park and serve — and helps customers find where food trucks are today. Discover food trucks near you or scout verified parking spots, host locations, and opportunities to operate.";

const canonicalUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/`
    : "https://www.mealscout.us/";

const schemaData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "MealScout",
      url: canonicalUrl,
      description: HOME_DESCRIPTION,
      sameAs: ["https://www.mealscout.us/"],
    },
    {
      "@type": "LocalBusiness",
      name: "MealScout",
      url: canonicalUrl,
      description: HOME_DESCRIPTION,
      areaServed: "Local",
      priceRange: "$",
    },
    {
      "@type": "Offer",
      name: "MealScout monthly subscription",
      description: "Paid local discovery for food businesses",
      price: "25.00",
      priceCurrency: "USD",
      availabilityStarts: "2026-03-01",
      eligibleCustomerType: "Business",
    },
    {
      "@type": "Service",
      name: "Local food discovery",
      provider: {
        "@type": "Organization",
        name: "MealScout",
      },
      serviceType: "Food truck discovery and parking sourcing",
      areaServed: "Local",
    },
  ],
};

export default function Home() {
  useEffect(() => {
    authDebugProbe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <SEOHead
        title={HOME_TITLE}
        description={HOME_DESCRIPTION}
        canonicalUrl={canonicalUrl}
        schemaData={schemaData}
      />
      <Navigation />

      <main className="container max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find food trucks. Scout places to park.
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            MealScout helps food trucks find real places to park and serve — and
            helps customers find where food trucks are today.
          </p>
        </div>

        {/* Four Equal CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* List my food truck or restaurant */}
          <Link href="/restaurant-signup">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-orange-500">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <Store className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    List my food truck or restaurant
                  </h3>
                  <p className="text-sm text-gray-600">
                    Join before March 1 and lock in $50 → $25/month forever
                  </p>
                  <Button className="mt-4">Get Started</Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Host food at my location */}
          <Link href="/host-signup">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-emerald-500">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Host food at my location
                  </h3>
                  <p className="text-sm text-gray-600">
                    Free forever. Unlock local food truck supply.
                  </p>
                  <Button variant="outline" className="mt-4">
                    Sign Up Free
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Need trucks for an event */}
          <Link href="/event-signup">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-blue-500">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Need trucks for an event
                  </h3>
                  <p className="text-sm text-gray-600">
                    Free forever. No event organizer fees.
                  </p>
                  <Button variant="outline" className="mt-4">
                    Create Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Find food near me */}
          <Link href="/search">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-2 hover:border-purple-500">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Find food near me
                  </h3>
                  <p className="text-sm text-gray-600">
                    Discover deals, trucks, and local restaurants.
                  </p>
                  <Button variant="outline" className="mt-4">
                    Start Exploring
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Trust Signals */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>
            One identity → many claims → verified → coordinated → monetized
            where fair
          </p>
          <p className="font-semibold text-orange-600">
            🔒 $50 → $25/month forever for restaurants joining before March 1, 2026
          </p>
          <p className="text-gray-700">
            MealScout is a food truck finder and parking sourcing tool. It is
            not delivery, not a marketplace, and not events-only.
          </p>
        </div>
      </main>
    </div>
  );
}
