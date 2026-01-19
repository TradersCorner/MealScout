import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo-head";
import { Truck, MapPin, Sparkles } from "lucide-react";

export default function TruckLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 px-4 py-10">
      <SEOHead
        title="Food Trucks on MealScout"
        description="Live food truck locations, local specials, and easy booking in one place. Join MealScout to get discovered and book better spots."
        keywords="food trucks, live locations, food truck specials, book food trucks"
        canonicalUrl="https://mealscout.us/truck-landing"
        noIndex={true}
      />

      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Find Live Food Trucks Fast
          </h1>
          <p className="text-slate-600">
            MealScout helps food trucks get discovered, share live location, and
            land better bookings with minimum effort.
          </p>
        </div>

        <Card className="border border-emerald-100 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-600 mt-1" />
              <div>
                <h2 className="font-semibold text-slate-900">
                  Live location in one tap
                </h2>
                <p className="text-sm text-slate-600">
                  Go live and show up on the map instantly. Customers find you
                  without chasing you across socials.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <h2 className="font-semibold text-slate-900">
                  Specials that actually move
                </h2>
                <p className="text-sm text-slate-600">
                  Post specials when you want the crowd to show up. It all stays
                  tied to your live location.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-slate-700 mt-1" />
              <div>
                <h2 className="font-semibold text-slate-900">
                  Better bookings, fewer headaches
                </h2>
                <p className="text-sm text-slate-600">
                  Hosts and event coordinators can book you directly through
                  MealScout.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/customer-signup?role=business">
              Create Food Truck Account
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Log in</Link>
          </Button>
        </div>

        <p className="text-center text-xs text-slate-500">
          No spam. No fluff. Just visibility and bookings.
        </p>
      </div>
    </div>
  );
}
