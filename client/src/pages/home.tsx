import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import DealCard from "@/components/deal-card";
import Navigation from "@/components/navigation";
import SmartSearch from "@/components/smart-search";
import WelcomeLocationModal from "@/components/WelcomeLocationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Sparkles,
  Rocket,
  Pizza,
  DollarSign,
  Truck,
  RotateCw,
  ChefHat,
  Clock,
  Target,
  Heart,
  Bell,
  Map,
  LogIn,
  UserPlus,
  Store,
  Bug,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Croissant,
  Salad,
  Fish,
  Coffee,
  Cake,
  Beef,
  Flame,
} from "lucide-react";
import mealScoutLogo from "@assets/meal-scout-icon.png";
import { useFoodTruckSocket } from "@/hooks/useFoodTruckSocket";
import { getReverseGeocodedLocationName } from "@/utils/locationUtils";
import { sendGeoPing, trackGeoAdEvent, trackGeoAdImpression } from "@/utils/geoAds";
import { SEOHead } from "@/components/seo-head";

// Version marker for deployment verification
console.log("MealScout Client Loaded - Build: " + new Date().toISOString());

interface Deal {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  dealType: string;
  discountValue: string;
  minOrderAmount?: string;
  imageUrl?: string;
  isFeatured: boolean;
  restaurant?: {
    name: string;
    cuisineType?: string;
  };
  distance?: number;
}

interface GeoAd {
  id: string;
  title: string;
  body?: string | null;
  mediaUrl?: string | null;
  targetUrl: string;
  ctaText?: string | null;
}

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationName, setLocationName] = useState("Your Location");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setNavigateTo] = useLocation();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const { isConnected, subscribeToNearby } = useFoodTruckSocket();

  // Show welcome modal only for anonymous users; auto-detect for logged-in users
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem("mealscout_welcome_seen");

    if (user) {
      // Logged-in: skip welcome modal and auto-detect location silently
      setShowWelcomeModal(false);
      if (!location) {
        setIsLoadingLocation(true);
        handleLocationDetection();
      }
      return;
    }

    if (!hasSeenWelcome && !location) {
      setShowWelcomeModal(true);
    }
  }, [user, location]);

  const handleLocationDetection = async () => {
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 0,
            });
          }
        );

        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setLocation(newLocation);
        setLocationError(null);

        await getReverseGeocodedLocationName(
          newLocation.lat,
          newLocation.lng,
          setLocationName
        );

        queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });

        if (isConnected) {
          subscribeToNearby(newLocation.lat, newLocation.lng, 5000);
        }
      } catch (error: any) {
        setLocationError(
          "Unable to detect location automatically. Please set your location."
        );
      } finally {
        setIsLoadingLocation(false);
      }
    }
  };

  const handleLocationUpdate = (newLocation: { lat: number; lng: number }) => {
    setLocation(newLocation);
    setLocationError(null);
    queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });
  };

  const handleLocationNameUpdate = (name: string) => {
    setLocationName(name);
  };

  const handleLocationErrorUpdate = (error: string | null) => {
    setLocationError(error);
    setIsLoadingLocation(false);
  };

  const handleManualLocation = async () => {
    if (!manualLocation.trim()) return;

    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `/api/location/search?q=${encodeURIComponent(
          manualLocation
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data[0]) {
        const newLocation = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        setLocation(newLocation);
        setLocationName(data[0].display_name);
        setLocationError(null);
        queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });
      } else {
        setLocationError(
          "Could not find that location. Please try a different city name."
        );
      }
    } catch (error) {
      setLocationError("Failed to search for location. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const retryLocation = () => {
    setLocationError(null);
    setIsLoadingLocation(true);
    handleLocationDetection();
  };

  const handleWelcomeLocationSet = (
    newLocation: { lat: number; lng: number },
    name: string
  ) => {
    setLocation(newLocation);
    setLocationName(name);
    setLocationError(null);
    sessionStorage.setItem("mealscout_welcome_seen", "true");
    setShowWelcomeModal(false);
    queryClient.invalidateQueries({ queryKey: ["/api/deals/nearby"] });

    if (isConnected) {
      subscribeToNearby(newLocation.lat, newLocation.lng, 5000);
    }
  };

  const handleWelcomeSkip = () => {
    sessionStorage.setItem("mealscout_welcome_seen", "true");
    setShowWelcomeModal(false);
  };

  const {
    data: featuredDeals,
    isLoading: featuredLoading,
    isError: featuredError,
  } = useQuery({
    queryKey: ["/api/deals/featured"],
    queryFn: () =>
      fetch(apiUrl("/api/deals/featured"), { credentials: "include" }).then(
        (res) => res.json()
      ),
  });

  const sortedFeaturedDeals = featuredDeals
    ? [...featuredDeals].sort((a: Deal, b: Deal) => {
        const aDistance = a.distance ?? Number.POSITIVE_INFINITY;
        const bDistance = b.distance ?? Number.POSITIVE_INFINITY;
        return aDistance - bDistance;
      })
    : [];

  const { data: geoAds = [] } = useQuery<GeoAd[]>({
    queryKey: ["/api/geo-ads", "home", location?.lat, location?.lng],
    enabled: !!location,
    queryFn: async () => {
      if (!location) return [];
      const res = await fetch(
        `/api/geo-ads?placement=home&lat=${location.lat}&lng=${location.lng}&limit=1`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    if (!location) return;
    sendGeoPing({ lat: location.lat, lng: location.lng, source: "home" });
  }, [location?.lat, location?.lng]);

  useEffect(() => {
    if (!geoAds.length) return;
    geoAds.forEach((ad) =>
      trackGeoAdImpression({ adId: ad.id, placement: "home" })
    );
  }, [geoAds]);

  const shortLocation = locationName?.split(",")[0] || "your area";
  const firstName =
    (user as any)?.firstName?.trim() ||
    (user as any)?.name?.split?.(" ")?.[0] ||
    "";
  const welcomeName = firstName || "there";

  const handleGeoAdClick = (ad: GeoAd) => {
    trackGeoAdEvent({ adId: ad.id, eventType: "click", placement: "home" });
    window.open(ad.targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="page relative overflow-hidden home-cinematic">
      <SEOHead
        title="MealScout | Find Food Trucks Near You"
        description="Find food trucks near you, discover live locations, and browse local deals from restaurants, bars, and hosts with MealScout."
        keywords="food truck finder, food trucks near me, local food deals, meal deals, restaurant deals, food truck map"
        canonicalUrl="https://www.mealscout.us/"
      />
      <Navigation />

      {/* Header with Logo and Navigation */}
      <header className="section section--full bg-[var(--bg-card)] border-b border-[color:var(--border-subtle)] sticky top-0 z-10 shadow-clean">
        <div className="content flex items-center justify-between py-3">
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-14 h-14 flex items-center justify-center overflow-hidden">
              <img
                src={mealScoutLogo}
                alt="MealScout Logo"
                className="w-full h-full object-contain object-center"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNavigateTo("/login")}
                  className="text-[color:var(--accent-text)] hover:text-[color:var(--accent-text-hover)]"
                  title="Login"
                >
                  <LogIn className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNavigateTo("/customer-signup")}
                  className="text-[color:var(--accent-text)] hover:text-[color:var(--accent-text-hover)]"
                  title="Customer Sign Up"
                >
                  <UserPlus className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setNavigateTo("/customer-signup?role=business")
                  }
                  className="text-[color:var(--accent-text)] hover:text-[color:var(--accent-text-hover)]"
                  title="Restaurant/Bar/Food Truck Sign Up"
                >
                  <Store className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={retryLocation}
                  disabled={isLoadingLocation}
                  className="text-[color:var(--accent-text)] hover:text-[color:var(--accent-text-hover)]"
                  title="Refresh Location"
                >
                  {isLoadingLocation ? (
                    <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Target className="w-4 h-4" />
                  )}
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline text-sm font-medium text-secondary">
                  {locationName.split(",")[0]}
                </span>
                <div
                  className="w-2 h-2 rounded-full bg-[color:var(--status-success)]"
                  title="Real-time location active"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={retryLocation}
                  disabled={isLoadingLocation}
                  className="text-[color:var(--accent-text)] hover:text-[color:var(--accent-text-hover)]"
                  title="Refresh Location"
                >
                  {isLoadingLocation ? (
                    <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Target className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Search Section */}
      <section className="section section--full section--surface border-b border-[color:var(--border-subtle)] py-4">
        <div className="content">
          <div className="home-hero-panel">
            <div className="mb-3">
              <h1 className="hero-title text-xl mb-1">
                {firstName ? `Hey ${firstName}, hungry?` : "Hungry?"}
              </h1>
              <p className="hero-subtitle text-sm">
                See what's happening{" "}
                {shortLocation === "Your Location"
                  ? "near you"
                  : `in ${shortLocation}`}
                . Fresh deals and local favorites.
              </p>
            </div>

            <SmartSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={(query) =>
                setNavigateTo(`/search?q=${encodeURIComponent(query)}`)
              }
              className="mb-6 shadow-clean-lg"
              placeholder="Search deals, restaurants..."
            />

            {geoAds.length > 0 && (
              <div className="mb-5">
                {geoAds.map((ad) => (
                  <div
                    key={ad.id}
                    className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-clean"
                  >
                    {ad.mediaUrl && (
                      <img
                        src={ad.mediaUrl}
                        alt={ad.title}
                        className="w-full h-40 object-cover rounded-xl mb-3"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Sponsored
                    </div>
                    <div className="text-base font-semibold text-foreground mt-1">
                      {ad.title}
                    </div>
                    {ad.body && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {ad.body}
                      </p>
                    )}
                    <div className="mt-3">
                      <Button size="sm" onClick={() => handleGeoAdClick(ad)}>
                        {ad.ctaText || "Learn more"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filter Chips */}
            <div className="flex space-x-2 overflow-x-auto pb-1">
              <Link href="/deals/featured">
                <Button
                  className="filter-pill filter-pill--active flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-semibold shadow-clean hover:shadow-clean-lg transition-all"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />  Hot Deals
                </Button>
              </Link>
              <Link href="/category/pizza">
                <Button
                  variant="outline"
                  size="sm"
                  className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium"
                >
                   Pizza
                </Button>
              </Link>
              <Link href="/category/burgers">
                <Button
                  variant="outline"
                  size="sm"
                  className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium"
                >
                   Burgers
                </Button>
              </Link>
              <Link href="/category/sushi">
                <Button
                  variant="outline"
                  size="sm"
                  className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium"
                >
                   Sushi
                </Button>
              </Link>
              <Link href="/category/chinese">
                <Button
                  variant="outline"
                  size="sm"
                  className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium"
                >
                   Chinese
                </Button>
              </Link>
              <Link href="/category/mexican">
                <Button
                  variant="outline"
                  size="sm"
                  className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium"
                >
                   Tacos
                </Button>
              </Link>
              <Link href="/category/breakfast">
                <Button
                  variant="outline"
                  size="sm"
                  className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium"
                >
                   Breakfast
                </Button>
              </Link>
              <Link href="/category/seafood">
                <Button
                  variant="outline"
                  size="sm"
                  className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium"
                >
                   Seafood
                </Button>
              </Link>
              <Link href="/category/bbq">
                <Button
                  variant="outline"
                  size="sm"
                  className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium"
                >
                   BBQ
                </Button>
              </Link>
              <Link href="/category/dessert">
                <Button
                  variant="outline"
                  size="sm"
                  className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium"
                >
                   Desserts
                </Button>
              </Link>
              <Link href="/category/coffee">
                <Button
                  variant="outline"
                  size="sm"
                  className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium"
                >
                   Coffee
                </Button>
              </Link>
              <Link href="/category/healthy">
                <Button
                  variant="outline"
                  size="sm"
                  className="filter-pill flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium"
                >
                   Healthy
                </Button>
              </Link>
            </div>

            {/* Manual location input (only when we don't have a location) */}
            {!location && !showWelcomeModal && (
              <div className="mt-4 w-full max-w-md">
                <div className="manual-location-shell">
                  <Input
                    type="text"
                    placeholder="Enter city or zip"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    className="manual-location-input"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleManualLocation()
                    }
                  />
                  <Button
                    onClick={handleManualLocation}
                    disabled={!manualLocation.trim() || isLoadingLocation}
                    className="manual-location-button"
                  >
                    {isLoadingLocation ? "..." : "Go"}
                  </Button>
                </div>
                {locationError && (
                  <p className="manual-location-error">{locationError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Food Trucks Nearby - Horizontal Scroll Row */}
      <section className="section section--full section--surface-2 border-y border-[color:var(--border-subtle)] py-4">
        <div className="content">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[color:var(--accent-text)]" />
              <h3 className="text-sm font-bold text-foreground">
                Live Trucks:{" "}
                {shortLocation === "Your Location" ? "Nearby" : shortLocation}
              </h3>
            </div>
            <Link href="/map">
              <Button
                variant="link"
                className="text-[color:var(--accent-text)] hover:text-[color:var(--accent-text-hover)] p-0 h-auto text-xs"
              >
                View Map {"->"}
              </Button>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-56">
                <DealCard
                  deal={
                    {
                      id: `truck-${i}`,
                      restaurantId: `truck-${i}`,
                      title: "Food Truck Deal",
                      description: "Special lunch combo",
                      dealType: "percentage",
                      discountValue: "20",
                      minOrderAmount: "10",
                      restaurant: {
                        name: `Tasty Truck #${i}`,
                        cuisineType: "Street Food",
                      },
                      distance: 0.3,
                      currentUses: 45,
                      isFeatured: false,
                    } as any
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Deals Section - ORIGINAL LAYOUT */}
      <section className="section section--full border-y border-[color:var(--border-subtle)] py-4">
        <div className="content">
          <div className="mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center">
              <Sparkles className="w-4 h-4 text-[color:var(--accent-text)] mr-1.5" />
              Trending in{" "}
              {shortLocation === "Your Location"
                ? "Your Neighborhood"
                : shortLocation}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fast-moving offers from spots around you
            </p>
            <Link href="/deals/featured">
              <Button
                variant="link"
                className="text-[color:var(--accent-text)] hover:text-[color:var(--accent-text-hover)] p-0 h-auto mt-1"
              >
                See all nearby deals {"->"}
              </Button>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-56 bg-[var(--bg-surface-muted)]/60 rounded-lg h-48 animate-pulse"
                />
              ))}
            </div>
          ) : featuredError ? (
            <div className="text-center py-8 text-[color:var(--status-error)] text-sm">
              We couldn't load deals right now. Try again in a bit.
            </div>
          ) : sortedFeaturedDeals.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
              {sortedFeaturedDeals.map((deal: Deal) => (
                <div key={deal.id} className="flex-shrink-0 w-56">
                  <DealCard deal={deal} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-3">No deals nearby yet</p>
              <Link href="/contact">
                <Button size="sm" variant="outline">
                  Recommend your favorite spot
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Owner Section - MOVED UP FOR LOGGED OUT USERS */}
      {!user && (
        <section className="section section--full section--surface-2 py-3 text-foreground">
          <div className="content text-center">
            <ChefHat className="w-6 h-6 mx-auto mb-1 text-[color:var(--accent-text)]" />
            <h3 className="text-base font-bold mb-0.5">
              Bring your restaurant to the neighborhood
            </h3>
            <p className="text-secondary mb-2 text-xs">
              Post real-time deals, broadcast when you're open, reach people
              nearby
            </p>
            <Link href="/customer-signup?role=business">
              <Button
                size="sm"
                variant="secondary"
                className="px-3 py-1 text-xs"
              >
                Claim & Go Live
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* TWO-COLUMN SECTIONS - SIDE BY SIDE */}
      <section className="section section--full border-y border-[color:var(--border-subtle)] py-6">
        <div className="content">
          {!user ? (
            /* LOGGED OUT - TWO SECTIONS SIDE BY SIDE */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stay Connected Section */}
              <div>
                <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Unlock the{" "}
                    {shortLocation === "Your Location"
                      ? "Local"
                      : shortLocation}{" "}
                    Scene
                  </h3>
              <p className="text-sm text-muted-foreground">
                Save go-tos, track trucks live, and get a heads-up when
                spots reopen
              </p>
            </div>

                <div className="space-y-2 mb-4">
                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--bg-surface-muted)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-[color:var(--accent-text)]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs">
                        {shortLocation === "Your Location"
                          ? "Neighborhood"
                          : shortLocation}{" "}
                        favorites
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Keep your go-tos one tap away
                      </p>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--bg-surface-muted)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-[color:var(--accent-text)]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs">
                        Food trucks{" "}
                        {shortLocation === "Your Location"
                          ? "nearby"
                          : `in ${shortLocation}`}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Live locations around you
                      </p>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--bg-surface-muted)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-[color:var(--accent-text)]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs">
                        Deals{" "}
                        {shortLocation === "Your Location"
                          ? "nearby"
                          : `in ${shortLocation}`}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Quick wins close to you
                      </p>
                    </div>
                  </div>
                </div>

                <Link href="/customer-signup">
                  <Button className="w-full text-xs font-medium">
                    Create free account
                  </Button>
                </Link>
              </div>

              {/* Community Building Section */}
              <div>
                <div className="text-center mb-4">
                  <h3 className="text-base font-bold text-foreground mb-1">
                    Promote{" "}
                    {shortLocation === "Your Location"
                      ? "Local"
                      : shortLocation}{" "}
                    Gems
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Pass along great spots and help them stay busy
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-start gap-3">
                    <div className="w-8 h-8 bg-[var(--bg-surface-muted)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[color:var(--accent-text)] font-bold text-xs">
                        1
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs mb-0.5">
                        Share Your Link
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Get a unique referral link to share with restaurants
                      </p>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-start gap-3">
                    <div className="w-8 h-8 bg-[var(--bg-surface-muted)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[color:var(--accent-text)] font-bold text-xs">
                        2
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs mb-0.5">
                        Restaurant Subscribes
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        When they join, you become their community partner
                      </p>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[color:var(--border-subtle)] flex items-start gap-3">
                    <div className="w-8 h-8 bg-[var(--bg-surface-muted)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[color:var(--accent-text)] font-bold text-xs">
                        3
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-xs mb-0.5">
                        Earn Recurring Income
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Receive commission as long as they remain active
                      </p>
                    </div>
                  </div>
                </div>

                <Link href={user ? "/affiliate-dashboard" : "/customer-signup"}>
                  <Button className="w-full text-xs font-medium">
                    {user ? "Community Builder Dashboard" : "Start Building"}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-[520px] mx-auto">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Deals Nearby
              </h3>

              {featuredLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-40 rounded-xl bg-[var(--bg-surface-muted)]/60 animate-pulse"
                    />
                  ))}
                </div>
              ) : featuredError ? (
                <div className="text-center py-8 text-[color:var(--status-error)] text-sm">
                  We couldn't load deals right now. Try again in a bit.
                </div>
              ) : sortedFeaturedDeals.length > 0 ? (
                <div className="space-y-3">
                  {sortedFeaturedDeals.map((deal: Deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted bg-surface-muted rounded-lg border border-dashed border-subtle">
                  <p className="text-sm">No deals nearby yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="section section--full border-t border-[color:var(--border-subtle)] py-6">
        <div className="content">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Product</h4>
              <Link
                href="/how-it-works"
                className="block text-muted-foreground hover:text-[color:var(--accent-text)]"
              >
                How It Works
              </Link>
              <Link
                href="/faq"
                className="block text-muted-foreground hover:text-[color:var(--accent-text)]"
              >
                FAQ
              </Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Company</h4>
              <Link
                href="/about"
                className="block text-muted-foreground hover:text-[color:var(--accent-text)]"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block text-muted-foreground hover:text-[color:var(--accent-text)]"
              >
                Contact
              </Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <Link
                href="/privacy-policy"
                className="block text-muted-foreground hover:text-[color:var(--accent-text)]"
              >
                Privacy
              </Link>
              <Link
                href="/terms-of-service"
                className="block text-muted-foreground hover:text-[color:var(--accent-text)]"
              >
                Terms
              </Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Support</h4>
              <Link
                href="/faq"
                className="block text-muted-foreground hover:text-[color:var(--accent-text)]"
              >
                Help Center
              </Link>
              <Link
                href="/status"
                className="block text-muted-foreground hover:text-[color:var(--accent-text)]"
              >
                Status
              </Link>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground border-t border-[color:var(--border-subtle)] pt-4 mt-5">
            <p>&copy; 2026 MealScout. A TradeScout Product.</p>
          </div>
        </div>
      </footer>

      {/* Welcome Modal for First-Time Session Visitors */}
      <WelcomeLocationModal
        open={showWelcomeModal}
        onLocationSet={handleWelcomeLocationSet}
        onSkip={handleWelcomeSkip}
      />
    </div>
  );
}






