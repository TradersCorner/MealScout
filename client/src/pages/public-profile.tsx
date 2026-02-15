import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Globe, Store } from "lucide-react";
import { SEOHead } from "@/components/seo-head";

type PublicProfile = {
  entity: "restaurant" | "host" | "supplier";
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  imageUrl?: string | null;
  canonicalUrl: string;
  profilePath: string;
  metrics?: {
    activeProductCount?: number;
  };
  social?: {
    instagramUrl?: string | null;
    facebookPageUrl?: string | null;
    xUrl?: string | null;
  };
};

const labelByEntity: Record<string, string> = {
  restaurant: "Restaurant Profile",
  host: "Host Profile",
  supplier: "Supplier Profile",
};

export default function PublicProfilePage() {
  const { profileType, profileId } = useParams<{
    profileType: string;
    profileId: string;
  }>();

  const { data, isLoading } = useQuery<PublicProfile>({
    queryKey: ["/api/public/profiles", profileType, profileId],
    enabled: !!profileType && !!profileId,
    queryFn: async () => {
      const res = await fetch(
        `/api/public/profiles/${encodeURIComponent(String(profileType || ""))}/${encodeURIComponent(String(profileId || ""))}`,
      );
      if (!res.ok) {
        throw new Error("Profile not found");
      }
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-10">Loading profile...</div>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Profile not found</h1>
        <div className="mt-4">
          <Link href="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const locationLine = [data.address, data.city, data.state].filter(Boolean).join(", ");
  const title = `${data.title} | ${labelByEntity[data.entity] || "Public Profile"} | MealScout`;
  const description =
    data.description ||
    `${data.title} on MealScout. View profile details, location info, and business links.`;

  const schemaData = {
    "@context": "https://schema.org",
    "@type":
      data.entity === "supplier"
        ? "Organization"
        : data.entity === "host"
          ? "LocalBusiness"
          : "Restaurant",
    name: data.title,
    description,
    url: data.canonicalUrl,
    telephone: data.phone || undefined,
    image: data.imageUrl || undefined,
    address: locationLine
      ? {
          "@type": "PostalAddress",
          streetAddress: data.address || undefined,
          addressLocality: data.city || undefined,
          addressRegion: data.state || undefined,
        }
      : undefined,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <SEOHead
        title={title}
        description={description}
        canonicalUrl={data.canonicalUrl}
        ogType="profile"
        ogImage={data.imageUrl || "/og-default.jpg"}
        schemaData={schemaData}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-muted-foreground" />
            <Badge variant="secondary">
              {labelByEntity[data.entity] || "Public Profile"}
            </Badge>
          </div>
          <CardTitle className="text-3xl">{data.title}</CardTitle>
          {data.subtitle ? (
            <p className="text-sm text-muted-foreground">{data.subtitle}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {data.description ? <p className="text-base leading-relaxed">{data.description}</p> : null}

          {locationLine ? (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>{locationLine}</span>
            </div>
          ) : null}

          {data.phone ? (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{data.phone}</span>
            </div>
          ) : null}

          {data.websiteUrl ? (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={data.websiteUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary underline"
              >
                {data.websiteUrl}
              </a>
            </div>
          ) : null}

          {data.entity === "supplier" && typeof data.metrics?.activeProductCount === "number" ? (
            <div className="text-sm text-muted-foreground">
              Active products: <span className="font-medium text-foreground">{data.metrics.activeProductCount}</span>
            </div>
          ) : null}

          <div className="border-t pt-4 text-xs text-muted-foreground">
            Permanent profile link: {data.canonicalUrl}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
