import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Bell, Globe, Palette, Save, Settings, Shield } from "lucide-react";
import Navigation from "@/components/navigation";
import NotificationSettings from "@/components/notification-settings";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type SettingsPayload = {
  accountSettings: {
    language?: string;
    currency?: string;
    locationServices?: boolean;
    analytics?: boolean;
    marketing?: boolean;
  };
  publicProfileSettings: {
    theme?: "sunset" | "slate" | "forest" | "amber";
    accentColor?: string;
    fontFamily?: "system" | "serif" | "display" | "mono";
    heroLayout?: "center" | "left" | "split";
    heroTitle?: string;
    heroSubtitle?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    about?: string;
    highlights?: string[];
    featuredLinks?: Array<{ label: string; url: string }>;
    galleryUrls?: string[];
    sectionOrder?: Array<
      "about" | "highlights" | "links" | "gallery" | "contact" | "location" | "metrics"
    >;
    showAddress?: boolean;
    showContact?: boolean;
    showHours?: boolean;
    hideProfileBadge?: boolean;
  };
  profileLinks?: Array<{
    entity: "restaurant" | "host" | "supplier";
    id: string;
    title: string;
    path: string;
  }>;
};

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const { data, isLoading, refetch } = useQuery<SettingsPayload>({
    queryKey: ["/api/settings/me"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/settings/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
  });

  const [general, setGeneral] = useState({
    language: "english",
    currency: "usd",
    locationServices: true,
    analytics: true,
    marketing: false,
  });
  const [profile, setProfile] = useState({
    theme: "sunset" as "sunset" | "slate" | "forest" | "amber",
    accentColor: "#f97316",
    fontFamily: "system" as "system" | "serif" | "display" | "mono",
    heroLayout: "left" as "center" | "left" | "split",
    heroTitle: "",
    heroSubtitle: "",
    ctaLabel: "",
    ctaUrl: "",
    about: "",
    highlights: "",
    featuredLinks: "",
    galleryUrls: "",
    sectionOrder: "about,location,contact,metrics,highlights,links,gallery",
    showAddress: true,
    showContact: true,
    showHours: true,
    hideProfileBadge: false,
  });

  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!data || hydratedRef.current) return;
    const a = data.accountSettings || {};
    const p = data.publicProfileSettings || {};
    setGeneral({
      language: a.language || "english",
      currency: a.currency || "usd",
      locationServices: a.locationServices ?? true,
      analytics: a.analytics ?? true,
      marketing: a.marketing ?? false,
    });
    setProfile({
      theme: (p.theme as any) || "sunset",
      accentColor: p.accentColor || "#f97316",
      fontFamily: (p.fontFamily as any) || "system",
      heroLayout: (p.heroLayout as any) || "left",
      heroTitle: p.heroTitle || "",
      heroSubtitle: p.heroSubtitle || "",
      ctaLabel: p.ctaLabel || "",
      ctaUrl: p.ctaUrl || "",
      about: p.about || "",
      highlights: Array.isArray(p.highlights) ? p.highlights.join("\n") : "",
      featuredLinks: Array.isArray(p.featuredLinks)
        ? p.featuredLinks.map((l) => `${l.label}|${l.url}`).join("\n")
        : "",
      galleryUrls: Array.isArray(p.galleryUrls) ? p.galleryUrls.join("\n") : "",
      sectionOrder: Array.isArray(p.sectionOrder)
        ? p.sectionOrder.join(",")
        : "about,location,contact,metrics,highlights,links,gallery",
      showAddress: p.showAddress ?? true,
      showContact: p.showContact ?? true,
      showHours: p.showHours ?? true,
      hideProfileBadge: p.hideProfileBadge ?? false,
    });
    hydratedRef.current = true;
  }, [data]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-3xl mx-auto bg-[var(--bg-app)] min-h-screen relative pb-20">
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
          <p className="text-muted-foreground">Log in to access your settings</p>
        </div>
        <Navigation />
      </div>
    );
  }

  const saveGeneral = async () => {
    setSavingGeneral(true);
    try {
      const res = await fetch("/api/settings/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSettings: general,
        }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast({ title: "Saved", description: "General settings updated." });
      await refetch();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.message || "Unable to save general settings.",
        variant: "destructive",
      });
    } finally {
      setSavingGeneral(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const parsedHighlights = profile.highlights
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
      const parsedGallery = profile.galleryUrls
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
      const parsedLinks = profile.featuredLinks
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, url] = line.split("|").map((s) => s.trim());
          return { label: label || url, url: url || label };
        })
        .filter((row) => row.label && row.url);
      const parsedSectionOrder = profile.sectionOrder
        .split(",")
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean)
        .filter((v) =>
          [
            "about",
            "highlights",
            "links",
            "gallery",
            "contact",
            "location",
            "metrics",
          ].includes(v),
        ) as Array<
        "about" | "highlights" | "links" | "gallery" | "contact" | "location" | "metrics"
      >;

      const res = await fetch("/api/settings/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicProfileSettings: {
            theme: profile.theme,
            accentColor: profile.accentColor,
            fontFamily: profile.fontFamily,
            heroLayout: profile.heroLayout,
            heroTitle: profile.heroTitle,
            heroSubtitle: profile.heroSubtitle,
            ctaLabel: profile.ctaLabel,
            ctaUrl: profile.ctaUrl,
            about: profile.about,
            highlights: parsedHighlights,
            featuredLinks: parsedLinks,
            galleryUrls: parsedGallery,
            sectionOrder: parsedSectionOrder,
            showAddress: profile.showAddress,
            showContact: profile.showContact,
            showHours: profile.showHours,
            hideProfileBadge: profile.hideProfileBadge,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile studio changes");
      toast({ title: "Saved", description: "Public profile studio updated." });
      await refetch();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.message || "Unable to save profile settings.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-[var(--bg-app)] min-h-screen relative pb-20">
      <header className="px-6 py-6 bg-[hsl(var(--background))] border-b border-white/5">
        <div className="flex items-center mb-2">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="mr-3 -ml-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center">
            <Settings className="w-6 h-6 text-primary mr-3" />
            <h1 className="text-xl font-bold text-foreground">Settings + Profile Studio</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Build your public profile into a mini website and control account preferences.
        </p>
      </header>

      <div className="px-6 py-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <Palette className="w-4 h-4 mr-1" />
              Studio
            </TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-1" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="w-4 h-4 mr-1" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Public Profile Studio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Theme</Label>
                    <Select
                      value={profile.theme}
                      onValueChange={(value: any) => setProfile((prev) => ({ ...prev, theme: value }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sunset">Sunset</SelectItem>
                        <SelectItem value="slate">Slate</SelectItem>
                        <SelectItem value="forest">Forest</SelectItem>
                        <SelectItem value="amber">Amber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Accent color</Label>
                    <Input
                      value={profile.accentColor}
                      onChange={(e) => setProfile((prev) => ({ ...prev, accentColor: e.target.value }))}
                      placeholder="#f97316"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Font style</Label>
                    <Select
                      value={profile.fontFamily}
                      onValueChange={(value: any) => setProfile((prev) => ({ ...prev, fontFamily: value }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="serif">Serif</SelectItem>
                        <SelectItem value="display">Display</SelectItem>
                        <SelectItem value="mono">Mono</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hero layout</Label>
                    <Select
                      value={profile.heroLayout}
                      onValueChange={(value: any) => setProfile((prev) => ({ ...prev, heroLayout: value }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="split">Split</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Hero title</Label>
                  <Input
                    value={profile.heroTitle}
                    onChange={(e) => setProfile((prev) => ({ ...prev, heroTitle: e.target.value }))}
                    placeholder="Your headline"
                  />
                </div>
                <div>
                  <Label>Hero subtitle</Label>
                  <Input
                    value={profile.heroSubtitle}
                    onChange={(e) => setProfile((prev) => ({ ...prev, heroSubtitle: e.target.value }))}
                    placeholder="Short one-liner"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>CTA label</Label>
                    <Input
                      value={profile.ctaLabel}
                      onChange={(e) => setProfile((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                      placeholder="Book now"
                    />
                  </div>
                  <div>
                    <Label>CTA URL</Label>
                    <Input
                      value={profile.ctaUrl}
                      onChange={(e) => setProfile((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <Label>About</Label>
                  <Textarea
                    value={profile.about}
                    onChange={(e) => setProfile((prev) => ({ ...prev, about: e.target.value }))}
                    rows={5}
                    placeholder="Tell visitors what makes your business special."
                  />
                </div>

                <div>
                  <Label>Highlights (one per line)</Label>
                  <Textarea
                    value={profile.highlights}
                    onChange={(e) => setProfile((prev) => ({ ...prev, highlights: e.target.value }))}
                    rows={4}
                    placeholder={"Fresh made daily\nFamily-owned\nAvailable for events"}
                  />
                </div>

                <div>
                  <Label>Featured links (one per line: label|url)</Label>
                  <Textarea
                    value={profile.featuredLinks}
                    onChange={(e) => setProfile((prev) => ({ ...prev, featuredLinks: e.target.value }))}
                    rows={4}
                    placeholder={"Menu|https://example.com/menu\nCatering|https://example.com/catering"}
                  />
                </div>

                <div>
                  <Label>Gallery image URLs (one per line)</Label>
                  <Textarea
                    value={profile.galleryUrls}
                    onChange={(e) => setProfile((prev) => ({ ...prev, galleryUrls: e.target.value }))}
                    rows={4}
                    placeholder={"https://.../image1.jpg\nhttps://.../image2.jpg"}
                  />
                </div>

                <div>
                  <Label>Section order (comma-separated)</Label>
                  <Input
                    value={profile.sectionOrder}
                    onChange={(e) => setProfile((prev) => ({ ...prev, sectionOrder: e.target.value }))}
                    placeholder="about,location,contact,metrics,highlights,links,gallery"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <Label>Show address</Label>
                    <Switch
                      checked={profile.showAddress}
                      onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, showAddress: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <Label>Show contact</Label>
                    <Switch
                      checked={profile.showContact}
                      onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, showContact: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <Label>Show hours</Label>
                    <Switch
                      checked={profile.showHours}
                      onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, showHours: checked }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label>Hide profile badge</Label>
                  <Switch
                    checked={profile.hideProfileBadge}
                    onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, hideProfileBadge: checked }))}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={savingProfile || isLoading || !hydratedRef.current}>
                    <Save className="w-4 h-4 mr-2" />
                    {savingProfile ? "Saving..." : "Save Profile Studio"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Public Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.isArray(data?.profileLinks) && data.profileLinks.length > 0 ? (
                  data.profileLinks.map((row) => (
                    <div key={`${row.entity}-${row.id}`} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">{row.title}</p>
                        <p className="text-xs text-muted-foreground">/{row.path.replace(/^\//, "")}</p>
                      </div>
                      <a href={row.path} target="_blank" rel="noreferrer noopener">
                        <Button variant="outline" size="sm">
                          <Globe className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Create a restaurant, host, or supplier profile to generate public links.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Regional Preferences</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Language</Label>
                  <Select
                    value={general.language}
                    onValueChange={(value) => setGeneral((prev) => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={general.currency}
                    onValueChange={(value) => setGeneral((prev) => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button onClick={saveGeneral} disabled={savingGeneral || isLoading || !hydratedRef.current}>
                    <Save className="w-4 h-4 mr-2" />
                    {savingGeneral ? "Saving..." : "Save General Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Location Services</p>
                    <p className="text-sm text-muted-foreground">Enable nearby discovery and map context</p>
                  </div>
                  <Switch
                    checked={general.locationServices}
                    onCheckedChange={(checked) => setGeneral((prev) => ({ ...prev, locationServices: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-sm text-muted-foreground">Help improve product quality and performance</p>
                  </div>
                  <Switch
                    checked={general.analytics}
                    onCheckedChange={(checked) => setGeneral((prev) => ({ ...prev, analytics: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Communications</p>
                    <p className="text-sm text-muted-foreground">Receive product updates and offers</p>
                  </div>
                  <Switch
                    checked={general.marketing}
                    onCheckedChange={(checked) => setGeneral((prev) => ({ ...prev, marketing: checked }))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveGeneral} disabled={savingGeneral || isLoading || !hydratedRef.current}>
                    <Save className="w-4 h-4 mr-2" />
                    {savingGeneral ? "Saving..." : "Save Privacy Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
}
