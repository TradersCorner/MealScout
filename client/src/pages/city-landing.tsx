import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/seo-head";
import { Link } from "wouter";

function fetchCity(slug: string) {
  return fetch(`/api/cities/${encodeURIComponent(slug)}`).then(async (r) => {
    if (!r.ok) throw new Error("City not found");
    return r.json();
  });
}

export default function CityLanding() {
  const params = useParams<{ citySlug: string }>();
  const slug = params.citySlug;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["city", slug],
    queryFn: () => fetchCity(slug),
    staleTime: 60_000,
  });

  useEffect(() => {
    // Refetch on slug change
    refetch();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">City Not Found</h1>
        <p className="text-[color:var(--text-muted)]">This city may not have any activity yet.</p>
      </div>
    );
  }

  const title = `${data.city.name}${data.city.state ? ", " + data.city.state : ""} Food Trucks & Restaurants`;
  const description = `Discover food trucks, restaurants, and upcoming events in ${data.city.name}. Real-time updates, top cuisines, and video stories.`;
  const canonical = `/food-trucks/${data.city.slug}`;
  const keywords = `${data.city.name} food trucks, ${data.city.name} restaurants, ${data.city.name} food deals, food near ${data.city.name}, local events ${data.city.name}`;

  return (
    <div>
      <SEOHead
        title={title}
        description={description}
        keywords={keywords}
        canonicalUrl={canonical}
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">
            Food Trucks in {data.city.name}
          </h1>
          <p className="text-[color:var(--text-muted)] mt-2">Updated {new Date(data.updatedAt).toLocaleString()}</p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Featured Trucks</h2>
          {data.trucks.length === 0 ? (
            <p className="text-[color:var(--text-muted)]">No trucks yet. Be the first to join.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.trucks.slice(0, 12).map((t: any) => (
                <Link key={t.id} href={`/restaurant/${t.id}`}>
                  <a className="block border rounded-lg p-4 hover:shadow transition">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-[color:var(--text-muted)]">{t.cuisineType || "Cuisine"}</div>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Restaurants</h2>
          {data.restaurants.length === 0 ? (
            <p className="text-[color:var(--text-muted)]">No restaurants yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.restaurants.slice(0, 12).map((r: any) => (
                <Link key={r.id} href={`/restaurant/${r.id}`}>
                  <a className="block border rounded-lg p-4 hover:shadow transition">
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-sm text-[color:var(--text-muted)]">{r.cuisineType || "Cuisine"}</div>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Upcoming Events</h2>
          {data.events.length === 0 ? (
            <p className="text-[color:var(--text-muted)]">No upcoming events yet.</p>
          ) : (
            <div className="space-y-3">
              {data.events.slice(0, 10).map((e: any) => (
                <div key={e.id} className="border rounded-lg p-4">
                  <div className="font-semibold">{e.name || "Food Truck Event"}</div>
                  <div className="text-sm text-[color:var(--text-muted)]">
                    {new Date(e.date).toLocaleDateString()} — {e.startTime} to {e.endTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Top Cuisines</h2>
          {data.cuisines.length === 0 ? (
            <p className="text-[color:var(--text-muted)]">No cuisines yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.cuisines.map((c: any) => (
                <span key={c.name} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm">
                  {c.name} ({c.count})
                </span>
              ))}
            </div>
          )}
        </section>

        {data.stories.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Video Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.stories.map((s: any) => (
                <a key={s.id} href={s.videoUrl} target="_blank" rel="noreferrer" className="block border rounded-lg p-4 hover:shadow transition">
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-[color:var(--text-muted)]">{s.cuisine || ""}</div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}



