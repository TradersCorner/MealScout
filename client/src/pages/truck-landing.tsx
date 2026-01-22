import { Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo-head";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import {
  Truck,
  MapPin,
  Sparkles,
  CheckCircle,
  Calendar,
  Compass,
  Bolt,
  Radar,
} from "lucide-react";

type HostPin = {
  id: string;
  name: string;
  address: string;
  latitude: number | string | null;
  longitude: number | string | null;
};

const hostIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12" fill="#F97316" stroke="white" stroke-width="3"/>
        <path d="M14 7l5 4v8h-3v-4h-4v4H9v-8l5-4z" fill="white"/>
      </svg>
    `),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -22],
});

export default function TruckLanding() {
  const [hostPins, setHostPins] = useState<HostPin[]>([]);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchPins = async () => {
      try {
        const res = await fetch("/api/map/locations");
        if (!res.ok) throw new Error("Map locations unavailable");
        const data = await res.json();
        if (cancelled) return;
        const pins = (data?.hostLocations || [])
          .map((host: HostPin) => ({
            ...host,
            latitude:
              host.latitude !== null ? Number(host.latitude) : host.latitude,
            longitude:
              host.longitude !== null
                ? Number(host.longitude)
                : host.longitude,
          }))
          .filter(
            (host: HostPin) =>
              typeof host.latitude === "number" &&
              typeof host.longitude === "number",
          );
        setHostPins(pins);
      } catch {
        if (!cancelled) {
          setMapError(true);
        }
      }
    };
    fetchPins();
    return () => {
      cancelled = true;
    };
  }, []);

  const mapCenter = useMemo(() => {
    if (!hostPins.length) {
      return { lat: 30.4213, lng: -87.2169 };
    }
    const latSum = hostPins.reduce(
      (sum, host) => sum + Number(host.latitude || 0),
      0,
    );
    const lngSum = hostPins.reduce(
      (sum, host) => sum + Number(host.longitude || 0),
      0,
    );
    return {
      lat: latSum / hostPins.length,
      lng: lngSum / hostPins.length,
    };
  }, [hostPins]);

  const showLiveMap = hostPins.length > 0 && !mapError;

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={
        {
          "--paper": "#fdf7f0",
          "--ink": "#121314",
          "--accent": "#f97316",
          "--accent-dark": "#c2410c",
          "--oxide": "#3a2f2f",
          "--mint": "#dff7ef",
          "--sky": "#e7f0ff",
          background:
            "radial-gradient(circle at 20% 0%, #ffe5c2 0%, #fff8ee 45%, #e9f1ff 100%)",
          fontFamily:
            '"Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif',
        } as React.CSSProperties
      }
    >
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
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-700">
              MealScout for Trucks
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight text-[var(--ink)]">
              Stop chasing.
              <br />
              Start getting booked.
            </h1>
            <p className="text-lg text-slate-700">
              MealScout puts your truck on the map hosts actually use. Your
              profile, schedule, and booking flow are built for how you really
              move.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="px-6 py-6 text-base bg-[var(--ink)] text-white hover:bg-black"
              >
                <Link href="/restaurant-signup">List my food truck</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="px-6 py-6 text-base border-slate-300"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                Free to join
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                Full access on sale $25/mo
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                Built for bookings
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-orange-200/70 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-emerald-200/70 blur-2xl" />
            <Card className="border border-slate-200 shadow-2xl bg-white/95">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Concept map
                    </p>
                    <p className="text-lg font-semibold text-[var(--ink)]">
                      Host hotspots + time slots
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Mock view
                  </div>
                </div>
                <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-200 bg-[linear-gradient(140deg,_#f6efe1,_#fff4e6_50%,_#e6eeff)]">
                  {showLiveMap ? (
                    <MapContainer
                      center={[mapCenter.lat, mapCenter.lng]}
                      zoom={12}
                      scrollWheelZoom={false}
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {hostPins.map((host) => (
                        <Marker
                          key={host.id}
                          position={[
                            Number(host.latitude),
                            Number(host.longitude),
                          ]}
                          icon={hostIcon}
                        >
                          <Popup>
                            <div className="text-sm">
                              <div className="font-semibold">{host.name}</div>
                              <div className="text-xs text-slate-600">
                                {host.address}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  ) : (
                    <>
                      <div className="absolute left-6 top-8 h-4 w-4 rounded-full bg-orange-500 shadow-[0_0_0_8px_rgba(249,115,22,0.18)]" />
                      <div className="absolute right-12 top-16 h-3 w-3 rounded-full bg-slate-700 shadow-[0_0_0_6px_rgba(15,23,42,0.12)]" />
                      <div className="absolute left-20 bottom-12 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.18)]" />
                      <div className="absolute right-16 bottom-6 h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_0_6px_rgba(249,115,22,0.18)]" />
                      <div className="absolute left-6 bottom-6 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                        Booking-ready locations
                      </div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs text-slate-500">Bookings</p>
                    <p className="text-xl font-semibold text-slate-900">—</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs text-slate-500">Next opening</p>
                    <p className="text-xl font-semibold text-slate-900">—</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600 shadow-lg md:grid-cols-3">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-orange-500" />
            Built for mobile-first booking, not social feeds
          </div>
          <div className="flex items-center gap-3">
            <Bolt className="h-5 w-5 text-slate-700" />
            One profile, all your locations + availability
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            Free to join, full access on sale $25/mo
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Create your truck profile",
              copy: "Photos, menu, availability, and your booking-ready presence.",
              icon: Truck,
            },
            {
              title: "Get discovered",
              copy: "Hosts and coordinators search by city, day, and slot.",
              icon: Radar,
            },
            {
              title: "Get booked",
              copy: "Accept what works. Your schedule updates instantly.",
              icon: Calendar,
            },
          ].map((step) => (
            <Card key={step.title} className="border border-slate-200 bg-white">
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
          <Card className="border border-slate-200 bg-white/95">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-slate-900">
                Why serious trucks pick MealScout
              </h3>
              <div className="grid gap-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  Stop chasing DMs and last-minute changes.
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  Your schedule and booking status live in one place.
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  Hosts see availability before they ever reach out.
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  You control where you go and when you move.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-900 bg-[var(--ink)] text-white shadow-xl">
            <CardContent className="p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                Start now
              </p>
              <h3 className="text-2xl font-semibold text-white">Free to join</h3>
              <p className="text-sm text-slate-200">
                Build your presence today. Full access is on sale for $25/month.
              </p>
              <ul className="text-sm text-slate-100 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Signup is free
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Full access on sale for $25/month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Cancel anytime
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl bg-[var(--ink)] px-6 py-10 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-semibold">Ready to get booked?</h2>
          <p className="mt-3 text-sm text-slate-300">
            Build your profile, set your schedule, and start getting real
            booking requests.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Button
              asChild
              className="px-6 py-6 text-base bg-white text-slate-900 hover:bg-slate-100"
            >
              <Link href="/restaurant-signup">List my food truck</Link>
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
