import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo-head";
import {
  Truck,
  MapPin,
  Sparkles,
  CheckCircle,
  Calendar,
  Compass,
} from "lucide-react";

export default function TruckLanding() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff1db_0%,_#ffffff_40%,_#e7f6ff_100%)] px-4 py-10">
      <SEOHead
        title="Food Trucks on MealScout"
        description="Live food truck locations, local specials, and easy booking in one place. Join MealScout to get discovered and book better spots."
        keywords="food trucks, live locations, food truck specials, book food trucks"
        canonicalUrl="https://mealscout.us/truck-landing"
        noIndex={true}
      />

      <div className="max-w-6xl mx-auto space-y-12">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
              Built for Food Trucks
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
              Book more events.
              <br />
              Get discovered locally.
            </h1>
            <p className="text-lg text-slate-600">
              Hosts, breweries, and event organizers use MealScout to find and
              book food trucks nearby. Skip the DMs and keep your schedule in
              one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="px-6 py-6 text-base">
                <Link href="/customer-signup?role=business">
                  List my food truck (free)
                </Link>
              </Button>
              <Button asChild variant="outline" className="px-6 py-6 text-base">
                <Link href="/login">See how it works</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                Free to list
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                No contracts
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                Pay only when booked
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-orange-200/60 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-emerald-200/60 blur-2xl" />
            <Card className="border border-orange-100 shadow-2xl bg-white/90">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Live Map
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      Downtown pulse
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Active
                  </div>
                </div>
                <div className="relative h-44 rounded-2xl bg-[linear-gradient(140deg,_#dff4ff,_#ffffff_60%,_#ffe9d2)] overflow-hidden">
                  <div className="absolute left-6 top-8 h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_0_6px_rgba(249,115,22,0.15)]" />
                  <div className="absolute right-10 top-14 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.15)]" />
                  <div className="absolute left-16 bottom-10 h-3 w-3 rounded-full bg-slate-700 shadow-[0_0_0_6px_rgba(15,23,42,0.1)]" />
                  <div className="absolute left-5 bottom-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                    8 hosts searching
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs text-slate-500">Bookings this week</p>
                    <p className="text-xl font-semibold text-slate-900">4</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs text-slate-500">Next slot</p>
                    <p className="text-xl font-semibold text-slate-900">Fri 6pm</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600 shadow-lg md:grid-cols-3">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-orange-500" />
            Used by food trucks and hosts across the region
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Free to list, no contract required
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-slate-700" />
            Pay only when you confirm a booking
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Create your truck profile",
              copy: "Photos, menu, availability, and your live map toggle.",
              icon: Truck,
            },
            {
              title: "Get discovered",
              copy: "Hosts and events search locally, not on social feeds.",
              icon: Compass,
            },
            {
              title: "Get booked",
              copy: "Accept what works. Your schedule updates instantly.",
              icon: Calendar,
            },
          ].map((step) => (
            <Card key={step.title} className="border border-slate-200">
              <CardContent className="p-6 space-y-3">
                <step.icon className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600">{step.copy}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-slate-200">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-slate-900">
                Why trucks choose MealScout
              </h3>
              <div className="grid gap-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  No DMs, no chasing, no ghosted bookings.
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  One place for your live location and schedule.
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  Hosts see real availability before they reach out.
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  You control pricing and when to accept.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-200 bg-emerald-50/70">
            <CardContent className="p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
                Pricing
              </p>
              <h3 className="text-2xl font-semibold text-slate-900">
                Free for food trucks
              </h3>
              <p className="text-sm text-slate-600">
                We only make money when you do. Booking fees apply only on
                confirmed bookings. Premium tools start after your free month.
              </p>
              <ul className="text-sm text-slate-700 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Listing is free
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  No subscriptions to get started
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Cancel anytime
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl bg-slate-900 px-6 py-10 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-semibold">
            Ready to get booked this week?
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            List your truck in minutes. Start with the free month and upgrade
            only if you want premium tools.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild className="px-6 py-6 text-base">
              <Link href="/customer-signup?role=business">
                List my food truck
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="px-6 py-6 text-base text-white border-white/30 hover:text-white"
            >
              <Link href="/login">Already have an account?</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
