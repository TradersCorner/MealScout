import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import RoleLandingPage from "@/components/role-landing";
import { roleLandingContent } from "@/content/role-landing";
import { Card, CardContent } from "@/components/ui/card";

type HostPin = {
  id: string;
  name: string;
  address: string;
  spotImageUrl?: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
};

type DiscoveryCity = {
  id: string;
  name: string;
  slug: string;
  state?: string | null;
  cuisines: Array<{ slug: string; count: number }>;
};

const titleCase = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

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
  const { data: cityData } = useQuery<DiscoveryCity[]>({
    queryKey: ["/api/cities", "truck-landing"],
    queryFn: async () => {
      const res = await fetch("/api/cities");
      if (!res.ok) throw new Error("Failed to fetch cities");
      return res.json();
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    let cancelled = false;
    const fetchPins = async () => {
      try {
        const [hostIdsRes, locationsRes] = await Promise.all([
          fetch("/api/parking-pass/host-ids"),
          fetch("/api/map/locations"),
        ]);
        if (!hostIdsRes.ok) throw new Error("Parking pass host ids unavailable");
        if (!locationsRes.ok) throw new Error("Map locations unavailable");

        const hostIdsPayload = await hostIdsRes.json();
        const data = await locationsRes.json();
        if (cancelled) return;
        const hostIdSet = new Set<string>(
          Array.isArray(hostIdsPayload?.hostIds)
            ? hostIdsPayload.hostIds.map((id: any) => String(id))
            : [],
        );
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
              typeof host.longitude === "number" &&
              hostIdSet.has(String((host as any).hostId ?? host.id)),
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
  const cities = Array.isArray(cityData) ? cityData.slice(0, 12) : [];
  const cityCuisineRoutes = cities.flatMap((city) =>
    (city.cuisines || []).slice(0, 3).map((cuisine) => ({
      href: `/food-trucks/${city.slug}/${cuisine.slug}`,
      label: `${titleCase(cuisine.slug)} in ${city.name}${city.state ? `, ${city.state}` : ""}`,
    })),
  );
  const content = {
    ...roleLandingContent.truck,
    map: {
      ...roleLandingContent.truck.map,
      badge: showLiveMap ? "Live view" : roleLandingContent.truck.map.badge,
    },
  };

  return (
    <RoleLandingPage
      content={content}
      discoverySlot={
        <div className="space-y-6">
          <Card className="border shadow-clean-lg bg-[var(--card)]" style={{ borderColor: "var(--border)" }}>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-[var(--ink-dark)]">
                Explore Food Truck Routes by City
              </h2>
              <p className="text-sm text-[var(--ink-dark-muted)]">
                Browse live local landing pages to see where trucks are active and what cuisine demand is growing.
              </p>
              {cities.length === 0 ? (
                <p className="text-sm text-[var(--ink-dark-muted)]">
                  Loading city routes...
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cities.map((city) => (
                    <Link key={city.id} href={`/food-trucks/${city.slug}`}>
                      <div className="rounded-xl border bg-[var(--card)] p-4 transition-colors hover:bg-[var(--card-muted)]" style={{ borderColor: "var(--border)" }}>
                        <div className="text-sm font-semibold text-[var(--ink-dark)]">
                          {city.name}{city.state ? `, ${city.state}` : ""}
                        </div>
                        <div className="mt-1 text-xs text-[var(--ink-dark-muted)]">
                          {city.cuisines.length} cuisine routes
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {cityCuisineRoutes.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink-dark-muted)]">
                    Popular City + Cuisine Pages
                  </h3>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {cityCuisineRoutes.slice(0, 20).map((route) => (
                      <Link key={route.href} href={route.href}>
                        <div className="rounded-lg border bg-[var(--card)] px-3 py-2 text-sm text-[var(--ink-dark)] transition-colors hover:bg-[var(--card-muted)]" style={{ borderColor: "var(--border)" }}>
                          {route.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      }
      mapSlot={
        showLiveMap ? (
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
                position={[Number(host.latitude), Number(host.longitude)]}
                icon={hostIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{host.name}</div>
                    <div className="text-xs text-[color:var(--text-muted)]">{host.address}</div>
                    {host.spotImageUrl && (
                      <img
                        src={host.spotImageUrl}
                        alt={`${host.name} parking spot`}
                        className="mt-2 h-24 w-full rounded-lg border border-border/50 object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : undefined
      }
    />
  );
}



