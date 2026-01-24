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
import mealScoutLogo from "@assets/ChatGPT Image Sep 14, 2025, 09_25_52 AM_1757872111259.png";
import { useFoodTruckSocket } from "@/hooks/useFoodTruckSocket";
import { getReverseGeocodedLocationName } from "@/utils/locationUtils";

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

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationName, setLocationName] = useState("Your Location");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
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
        setShowLocationInput(true);
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
    if (error) {
      setShowLocationInput(true);
    }
  };

  const handleManualLocation = async () => {
    if (!manualLocation.trim()) return;

    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
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
        setShowLocationInput(false);
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
    setShowLocationInput(false);
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

  const groupedFeaturedDeals = featuredDeals?.reduce(
    (
      acc: Record<
        string,
        { restaurant?: Deal["restaurant"]; deals: Deal[]; distance?: number }
      >,
      deal: Deal
    ) => {
      const bucket = acc[deal.restaurantId] || {
        restaurant: deal.restaurant,
        deals: [],
        distance: deal.distance,
      };
      bucket.deals.push(deal);
      // prefer the first distance value we see
      if (bucket.distance === undefined && deal.distance !== undefined) {
        bucket.distance = deal.distance;
      }
      // prefer the first restaurant object we see
      if (!bucket.restaurant && deal.restaurant) {
        bucket.restaurant = deal.restaurant;
      }
      acc[deal.restaurantId] = bucket;
      return acc;
    },
    {}
  );

  const shortLocation = locationName?.split(",")[0] || "your area";
  const firstName =
    (user as any)?.firstName?.trim() ||
    (user as any)?.name?.split?.(" ")?.[0] ||
    "";
  const welcomeName = firstName || "there";

  return (
    <div className="page relative overflow-hidden">
      <Navigation />

      {/* Header with Logo and Navigation */}
      <header className="section section--full bg-[hsl(var(--surface))]/85 backdrop-blur-md border-b border-white/10 sticky top-0 z-10 shadow-sm">
        <div className="content flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-10 h-10 flex items-center justify-center overflow-visible">
              <img
                src={mealScoutLogo}
                alt="MealScout Logo"
                className="w-10 h-10 object-contain scale-125 origin-center"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-lg font-bold text-foreground">MealScout</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNavigateTo("/login")}
                  className="text-muted-foreground hover:text-[hsl(var(--primary))]"
                  title="Login"
                >
                  <LogIn className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNavigateTo("/customer-signup")}
                  className="text-muted-foreground hover:text-[hsl(var(--primary))]"
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
                  className="text-muted-foreground hover:text-[hsl(var(--primary))]"
                  title="Restaurant/Bar/Food Truck Sign Up"
                >
                  <Store className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={retryLocation}
                  disabled={isLoadingLocation}
                  className="text-muted-foreground hover:text-[hsl(var(--primary))]"
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
                <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
                  {locationName.split(",")[0]}
                </span>
                <div
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  title="Real-time location active"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={retryLocation}
                  disabled={isLoadingLocation}
                  className="text-muted-foreground hover:text-[hsl(var(--primary))] w-7 h-7"
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
      <section className="section section--full section--surface border-b border-white/5 py-4">
        <div className="content">
          <div className="mb-3">
            <h2 className="text-xl font-bold text-foreground mb-1">
              {firstName ? `Hey ${firstName}, hungry?` : "Hungry?"}
            </h2>
            <p className="text-sm text-muted-foreground">
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
            className="mb-6 shadow-lg"
            placeholder="Search deals, restaurants..."
          />

          {/* Filter Chips */}
          <div className="flex space-x-2 overflow-x-auto pb-1">
            <Link href="/deals/featured">
              <Button
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-semibold text-[#2b1b12] bg-gradient-to-r from-[#f7a552] to-[#e0701a] border border-white/10 shadow-md hover:shadow-lg transition-all"
                size="sm"
              >
                <Sparkles className="w-4 h-4 mr-1.5" /> 🔥 Hot Deals
              </Button>
            </Link>
            <Link href="/category/pizza">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium bg-[hsl(var(--surface))] border border-white/12 text-foreground hover:bg-[hsl(var(--surface-hover))]"
              >
                🍕 Pizza
              </Button>
            </Link>
            <Link href="/category/burgers">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium bg-[hsl(var(--surface))] border border-white/12 text-foreground hover:bg-[hsl(var(--surface-hover))]"
              >
                🍔 Burgers
              </Button>
            </Link>
            <Link href="/category/sushi">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium bg-[hsl(var(--surface))] border border-white/12 text-foreground hover:bg-[hsl(var(--surface-hover))]"
              >
                🍣 Sushi
              </Button>
            </Link>
            <Link href="/category/chinese">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium bg-[hsl(var(--surface))] border border-white/12 text-foreground hover:bg-[hsl(var(--surface-hover))]"
              >
                🥡 Chinese
              </Button>
            </Link>
            <Link href="/category/mexican">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium bg-[hsl(var(--surface))] border border-white/12 text-foreground hover:bg-[hsl(var(--surface-hover))]"
              >
                🌮 Tacos
              </Button>
            </Link>
            <Link href="/category/breakfast">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium bg-[hsl(var(--surface))] border border-white/12 text-foreground hover:bg-[hsl(var(--surface-hover))]"
              >
                🥐 Breakfast
              </Button>
            </Link>
            <Link href="/category/seafood">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium bg-[hsl(var(--surface))] border border-white/12 text-foreground hover:bg-[hsl(var(--surface-hover))]"
              >
                🦞 Seafood
              </Button>
            </Link>
            <Link href="/category/bbq">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium bg-[hsl(var(--surface))] border border-white/12 text-foreground hover:bg-[hsl(var(--surface-hover))]"
              >
                🍖 BBQ
              </Button>
            </Link>
            <Link href="/category/dessert">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium bg-[hsl(var(--surface))] border border-white/12 text-foreground hover:bg-[hsl(var(--surface-hover))]"
              >
                🍰 Desserts
              </Button>
            </Link>
            <Link href="/category/coffee">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium bg-[hsl(var(--surface))] border border-white/12 text-foreground hover:bg-[hsl(var(--surface-hover))]"
              >
                ☕ Coffee
              </Button>
            </Link>
            <Link href="/category/healthy">
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 rounded-full px-3.5 py-2 text-sm sm:text-base font-medium bg-[hsl(var(--surface))] border border-white/12 text-foreground hover:bg-[hsl(var(--surface-hover))]"
              >
                🥗 Healthy
              </Button>
            </Link>
          </div>

          {/* Location Error and Manual Input */}
          {locationError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Enter city or zip"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleManualLocation()
                  }
                />
                <Button
                  onClick={handleManualLocation}
                  disabled={!manualLocation.trim() || isLoadingLocation}
                  size="sm"
                >
                  {isLoadingLocation ? "..." : "Go"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Food Trucks Nearby - Horizontal Scroll Row */}
      <section className="section section--full section--surface-2 border-y border-white/5 py-4">
        <div className="content">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[hsl(var(--primary))]" />
              <h3 className="text-sm font-bold text-foreground">
                Live Trucks:{" "}
                {shortLocation === "Your Location" ? "Nearby" : shortLocation}
              </h3>
            </div>
            <Link href="/map">
              <Button
                variant="link"
                className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/90 p-0 h-auto text-xs"
              >
                View Map →
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
      <section className="section section--full border-y border-white/5 py-4">
        <div className="content">
          <div className="mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center">
              <Sparkles className="w-4 h-4 text-[hsl(var(--primary))] mr-1.5" />
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
                className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/90 p-0 h-auto mt-1"
              >
                See all nearby deals →
              </Button>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-56 bg-[hsl(var(--surface-hover))]/60 rounded-lg h-48 animate-pulse"
                />
              ))}
            </div>
          ) : featuredError ? (
            <div className="text-center py-8 text-red-500 text-sm">
              We couldnt load deals right now. Try again in a bit.
            </div>
          ) : featuredDeals && featuredDeals.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
              {featuredDeals.map((deal: Deal) => (
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
        <section className="section section--full section--surface-2 py-3 text-white">
          <div className="content text-center">
            <ChefHat className="w-6 h-6 mx-auto mb-1 text-[color:var(--action-primary)]" />
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
      <section className="section section--full border-y border-white/5 py-6">
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
                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-[hsl(var(--primary))]" />
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

                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-[hsl(var(--primary))]" />
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

                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-[hsl(var(--primary))]" />
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
                  <Button className="w-full h-9 text-xs font-medium">
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
                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-white/5 flex items-start gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[hsl(var(--primary))] font-bold text-xs">
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

                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-white/5 flex items-start gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[hsl(var(--primary))] font-bold text-xs">
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

                  <div className="bg-[hsl(var(--surface))] p-3 rounded-xl border border-white/5 flex items-start gap-3">
                    <div className="w-8 h-8 bg-[hsl(var(--surface-hover))] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[hsl(var(--primary))] font-bold text-xs">
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
                  <Button className="w-full h-9 text-xs font-medium">
                    {user ? "Community Builder Dashboard" : "Start Building"}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* LOGGED IN - REAL FEATURES */
            <div className="max-w-[520px] mx-auto">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Browse by Category
              </h3>

              {/* Category Rows */}
              {groupedFeaturedDeals &&
              Object.keys(groupedFeaturedDeals).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(
                    Object.values(groupedFeaturedDeals).reduce(
                      (acc: Record<string, any[]>, bucket: any) => {
                        const cuisine =
                          bucket.restaurant?.cuisineType || "Other";
                        if (!acc[cuisine]) acc[cuisine] = [];
                        acc[cuisine].push(bucket);
                        return acc;
                      },
                      {}
                    )
                  ).map(([cuisine, buckets]) => (
                    <div key={cuisine}>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <h4 className="font-bold text-primary">{cuisine}</h4>
                        <Link href={`/search?q=${encodeURIComponent(cuisine)}`}>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-[color:var(--action-primary)] h-auto p-0 text-xs"
                          >
                            View all
                          </Button>
                        </Link>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                        {buckets.map((bucket: any) => {
                          const restaurantName =
                            bucket.restaurant?.name || "Restaurant";
                          const distance = bucket.distance;
                          const deals = bucket.deals.slice(0, 3); // Limit to 3 deals per card in horizontal view

                          return (
                            <div
                              key={bucket.restaurant?.id || Math.random()}
                              className="flex-shrink-0 w-[280px] rounded-xl border border-subtle bg-card shadow-sm p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="text-sm font-bold text-primary leading-tight truncate max-w-[180px]">
                                    {restaurantName}
                                  </h3>
                                  <div className="text-[11px] text-secondary flex items-center gap-1">
                                    {distance !== undefined && (
                                      <span>{distance.toFixed(1)} mi</span>
                                    )}
                                  </div>
                                </div>
                                <Link
                                  href={`/restaurant/${bucket.deals[0].restaurantId}`}
                                >
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="px-2 py-1 text-[10px] h-6"
                                  >
                                    Visit
                                  </Button>
                                </Link>
                              </div>
                              <div className="divide-y divide-gray-100">
                                {deals.map((deal: any) => (
                                  <div
                                    key={deal.id}
                                    className="py-2 flex items-start gap-2"
                                  >
                                    <div className="px-2 py-1 rounded-md bg-[color:var(--bg-surface-muted)] text-secondary text-[10px] font-semibold leading-none whitespace-nowrap">
                                      {deal.dealType === "percentage"
                                        ? `${deal.discountValue}%`
                                        : deal.dealType === "dollar"
                                        ? `$${deal.discountValue}`
                                        : deal.discountValue}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-primary leading-tight truncate">
                                        {deal.title}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                {bucket.deals.length > 3 && (
                                  <div className="pt-2 text-center">
                                    <span className="text-[10px] text-muted">
                                      +{bucket.deals.length - 3} more deals
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted bg-surface-muted rounded-lg border border-dashed border-subtle">
                  <p className="text-sm">No categories available yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="section section--full border-t border-white/5 py-6">
        <div className="content">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Product</h4>
              <Link
                href="/how-it-works"
                className="block text-muted-foreground hover:text-[hsl(var(--primary))]"
              >
                How It Works
              </Link>
              <Link
                href="/faq"
                className="block text-muted-foreground hover:text-[hsl(var(--primary))]"
              >
                FAQ
              </Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Company</h4>
              <Link
                href="/about"
                className="block text-muted-foreground hover:text-[hsl(var(--primary))]"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block text-muted-foreground hover:text-[hsl(var(--primary))]"
              >
                Contact
              </Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <Link
                href="/privacy-policy"
                className="block text-muted-foreground hover:text-[hsl(var(--primary))]"
              >
                Privacy
              </Link>
              <Link
                href="/terms-of-service"
                className="block text-muted-foreground hover:text-[hsl(var(--primary))]"
              >
                Terms
              </Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Support</h4>
              <Link
                href="/faq"
                className="block text-muted-foreground hover:text-[hsl(var(--primary))]"
              >
                Help Center
              </Link>
              <Link
                href="/status"
                className="block text-muted-foreground hover:text-[hsl(var(--primary))]"
              >
                Status
              </Link>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground border-t border-white/5 pt-4 mt-5">
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
