import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Clock, Share2, Bookmark, Star } from "lucide-react";
import { GoldenForkIcon } from "@/components/award-badges";
import { apiRequest } from "@/lib/queryClient";
import DealShareModal from "./deal-share-modal";
import RestaurantDealsDrawer from "./restaurant-deals-drawer";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const SAVED_DEALS_KEY = "mealscout_saved_deals";

function getSavedDeals(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_DEALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSavedDeals(ids: string[]) {
  try {
    localStorage.setItem(SAVED_DEALS_KEY, JSON.stringify(ids));
  } catch {
    // Best effort; ignore storage failures
  }
}

interface Deal {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  dealType: string;
  discountValue: string;
  minOrderAmount?: string;
  imageUrl?: string;
  facebookPageUrl?: string;
  isAiGenerated?: boolean;
  restaurant?: {
    name: string;
    cuisineType?: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
  };
  distance?: number;
  currentUses?: number;
  totalUsesLimit?: number;
}

interface DealCardProps {
  deal: Deal;
}

const getDefaultImage = (cuisineType?: string, title?: string) => {
  const images = {
    pizza:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&auto=format",
    burger:
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&auto=format",
    mexican:
      "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop&auto=format",
    asian:
      "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop&auto=format",
    italian:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&auto=format",
    chinese:
      "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400&h=300&fit=crop&auto=format",
    indian:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&auto=format",
    cafe: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&auto=format",
    creole:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format",
    seafood:
      "https://images.unsplash.com/photo-1565299585323-38174c97c24d?w=400&h=300&fit=crop&auto=format",
    sushi:
      "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=400&h=300&fit=crop&auto=format",
    deli: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format",
    healthy:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&auto=format",
    default:
      "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&h=300&fit=crop&auto=format",
  };

  const lowerCuisine = cuisineType?.toLowerCase() || "";
  const lowerTitle = title?.toLowerCase() || "";

  // Title-based matching
  if (lowerTitle.includes("burger") || lowerTitle.includes("sandwich"))
    return images.burger;
  if (lowerTitle.includes("pizza")) return images.pizza;
  if (lowerTitle.includes("taco") || lowerTitle.includes("burrito"))
    return images.mexican;
  if (lowerTitle.includes("sushi") || lowerTitle.includes("roll"))
    return images.sushi;
  if (
    lowerTitle.includes("beignet") ||
    lowerTitle.includes("coffee") ||
    lowerTitle.includes("pastry")
  )
    return images.cafe;
  if (lowerTitle.includes("curry") || lowerTitle.includes("naan"))
    return images.indian;
  if (lowerTitle.includes("pasta") || lowerTitle.includes("garlic bread"))
    return images.italian;
  if (lowerTitle.includes("noodle") || lowerTitle.includes("bowl"))
    return images.asian;
  if (
    lowerTitle.includes("jambalaya") ||
    lowerTitle.includes("brunch") ||
    lowerTitle.includes("mimosa")
  )
    return images.creole;
  if (
    lowerTitle.includes("shrimp") ||
    lowerTitle.includes("fish") ||
    lowerTitle.includes("catch")
  )
    return images.seafood;
  if (lowerTitle.includes("smoothie") || lowerTitle.includes("salad"))
    return images.healthy;

  // Cuisine-based matching
  if (lowerCuisine.includes("mexican")) return images.mexican;
  if (lowerCuisine.includes("chinese") || lowerCuisine.includes("asian"))
    return images.chinese;
  if (lowerCuisine.includes("italian")) return images.italian;
  if (lowerCuisine.includes("indian")) return images.indian;
  if (lowerCuisine.includes("cafe")) return images.cafe;
  if (lowerCuisine.includes("creole")) return images.creole;
  if (lowerCuisine.includes("seafood")) return images.seafood;
  if (lowerCuisine.includes("sushi")) return images.sushi;
  if (lowerCuisine.includes("deli")) return images.deli;
  if (lowerCuisine.includes("healthy")) return images.healthy;

  return images.default;
};

export default function DealCard({ deal }: DealCardProps) {
  const { user, isGuest } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDealsDrawer, setShowDealsDrawer] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [forkPressed, setForkPressed] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recommendationText, setRecommendationText] = useState("");
  const [favoriteSelection, setFavoriteSelection] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState<number | null>(null);
  const [isRestaurantFavorite, setIsRestaurantFavorite] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [recommendSubmitting, setRecommendSubmitting] = useState(false);
  const isGoldenForkUser = Boolean(
    (user as any)?.influenceScore && (user as any)?.influenceScore > 0
  );
  const [, setLocation] = useLocation();

  // Initialize saved state from localStorage for quick UX feedback
  useEffect(() => {
    const saved = getSavedDeals();
    setIsSaved(saved.includes(deal.id));
  }, [deal.id]);

  // Track view when card becomes visible
  useEffect(() => {
    if (hasTrackedView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // Track view when card is more than 50% visible
            const trackView = async () => {
              try {
                await apiRequest("POST", `/api/deals/${deal.id}/view`, {});
                setHasTrackedView(true);
              } catch (error) {
                // Silently fail - view tracking shouldn't interrupt user experience
                console.debug("Card view tracking failed:", error);
              }
            };

            // Small delay to ensure it's not just scrolling past
            setTimeout(trackView, 500);
          }
        });
      },
      { threshold: 0.5 } // Track when 50% of card is visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [deal.id, hasTrackedView]);

  useEffect(() => {
    if (!showRecommendModal || !user) return;

    const fetchFavoritesSnapshot = async () => {
      try {
        const favorites = await apiRequest("GET", "/api/favorites/restaurants");
        const list = Array.isArray(favorites) ? favorites : [];
        const isFav = list.some(
          (fav: any) =>
            (fav.restaurantId || fav.restaurant?.id) === deal.restaurantId
        );
        setFavoriteCount(list.length);
        setIsRestaurantFavorite(isFav);
        setFavoriteSelection(isFav);
        setFavoriteError("");
      } catch (error) {
        console.error("Failed to load favorites snapshot:", error);
      }
    };

    fetchFavoritesSnapshot();
  }, [showRecommendModal, user, deal.restaurantId]);

  const formatDiscount = () => {
    // Normalize discount display for percentage vs flat amounts
    if (deal.dealType === "percentage") {
      return `${deal.discountValue}%`;
    }

    // Handle values that may already include a dollar sign
    if (deal.discountValue?.trim().startsWith("$")) {
      return deal.discountValue.trim();
    }

    return `$${deal.discountValue}`;
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isGuest) {
      window.location.href = "/login";
      return;
    }

    try {
      // Toggle saved state immediately for responsiveness
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);

      // Keep a lightweight client-side record so the bookmark visibly sticks
      const currentSaved = getSavedDeals();
      const updatedSaved = newSavedState
        ? Array.from(new Set([...currentSaved, deal.id]))
        : currentSaved.filter((id) => id !== deal.id);
      persistSavedDeals(updatedSaved);

      // Try to persist server-side when the endpoint is available
      try {
        if (newSavedState) {
          await apiRequest("POST", `/api/deals/${deal.id}/save`, {});
        } else {
          await apiRequest("DELETE", `/api/deals/${deal.id}/save`, {});
        }
      } catch (apiError) {
        console.debug(
          "Deal save API not available; kept client bookmark",
          apiError
        );
      }
    } catch (error) {
      console.error("Failed to save deal:", error);
      // Revert on error
      setIsSaved(!isSaved);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/deal/${deal.id}`;
    const shareText = `${deal.title} at ${
      deal.restaurant?.name || "this restaurant"
    }`;

    if (navigator.share) {
      try {
          await navigator.share({
            title: "MealScout Special",
            text: shareText,
            url: shareUrl,
          });
        return;
      } catch (err) {
        console.debug("Web Share failed, falling back to modal", err);
      }
    }

    setShowShareModal(true);
  };

  const handleCardClick = () => {
    setShowDealsDrawer(true);
  };

  const handleParkingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const params = new URLSearchParams();
    if (deal.restaurantId) {
      params.set("hostId", deal.restaurantId);
    }
    params.set("source", "deal");

    setLocation(`/parking-pass?${params.toString()}`);
  };

  const MAX_FAVORITES = 3;

  const toggleRestaurantFavorite = async (nextSelected: boolean) => {
    if (!user) {
      window.location.href = "/api/auth/facebook";
      return;
    }

    if (favoriteLoading) return;

    // Enforce max favorites for new additions
    if (
      nextSelected &&
      !isRestaurantFavorite &&
      favoriteCount !== null &&
      favoriteCount >= MAX_FAVORITES
    ) {
      setFavoriteError(`You can favorite up to ${MAX_FAVORITES} restaurants.`);
      setFavoriteSelection(false);
      return;
    }

    try {
      setFavoriteLoading(true);
      setFavoriteError("");

      if (nextSelected) {
        await apiRequest(
          "POST",
          `/api/restaurants/${deal.restaurantId}/favorite`,
          {}
        );
        setIsRestaurantFavorite(true);
        setFavoriteSelection(true);
        setFavoriteCount(
          (prev) => (prev ?? 0) + (isRestaurantFavorite ? 0 : 1)
        );
      } else {
        await apiRequest(
          "DELETE",
          `/api/restaurants/${deal.restaurantId}/favorite`,
          {}
        );
        setIsRestaurantFavorite(false);
        setFavoriteSelection(false);
        setFavoriteCount((prev) => Math.max((prev ?? 1) - 1, 0));
      }
    } catch (error: any) {
      console.error("Favorite toggle failed:", error);
      setFavoriteError(error?.message || "Unable to update favorite");
      // Reset selection to previous state on failure
      setFavoriteSelection(isRestaurantFavorite);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleRecommendSubmit = async () => {
    if (!user) {
      window.location.href = "/api/auth/facebook";
      return;
    }

    // If user opts to favorite the restaurant, enforce max rules before submitting recommendation text
    if (
      favoriteSelection &&
      !isRestaurantFavorite &&
      favoriteCount !== null &&
      favoriteCount >= MAX_FAVORITES
    ) {
      setFavoriteError(`You can favorite up to ${MAX_FAVORITES} restaurants.`);
      return;
    }

    try {
      setRecommendSubmitting(true);

      // Sync favorite state first
      if (favoriteSelection !== isRestaurantFavorite) {
        await toggleRestaurantFavorite(favoriteSelection);
      }

      // Optional recommendation text routed through reviews endpoint with a positive rating
      if (recommendationText.trim().length > 0) {
        await apiRequest("POST", "/api/reviews", {
          restaurantId: deal.restaurantId,
          rating: 5,
          comment: recommendationText.trim(),
        });
      }

      setShowRecommendModal(false);
      setRecommendationText("");
    } catch (error) {
      console.error("Recommendation submit failed:", error);
      setFavoriteError("Could not submit recommendation. Please try again.");
    } finally {
      setRecommendSubmitting(false);
    }
  };

  return (
    <div>
      <Card
        ref={cardRef}
        className="bg-white rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 shadow-md hover:shadow-2xl group overflow-hidden"
        data-testid={`card-deal-${deal.id}`}
      >
        <CardContent className="p-0">
          {/* Image with gradient overlay - framed inside card */}
          <div className="relative h-24 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden rounded-t-2xl">
            <img
              src={
                deal.imageUrl ||
                getDefaultImage(deal.restaurant?.cuisineType, deal.title)
              }
              alt={deal.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Gradient overlay for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Deal Badge - top left */}
            <div className="absolute top-1.5 left-1.5 bg-orange-600 text-white px-1.5 py-0.5 rounded-lg shadow-lg">
              <span className="font-bold text-sm leading-none">
                {formatDiscount()} OFF
              </span>
            </div>

            {/* Golden fork (restaurant recommendation) - top right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRecommendModal(true);
                setForkPressed(true);
              }}
              onMouseDown={() => setForkPressed(true)}
              onMouseUp={() => setForkPressed(false)}
              onMouseLeave={() => setForkPressed(false)}
              className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-300 hover:scale-110 z-10"
              title="Recommend this restaurant"
            >
              <GoldenForkIcon
                className={`w-3.5 h-3.5 transition-colors duration-200 ${
                  forkPressed ? "text-amber-500" : "text-gray-700"
                }`}
              />
            </button>

            {/* Restaurant Name Overlay - bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
              <h3
                className="font-bold text-white text-xs truncate"
                data-testid={`text-restaurant-name-${deal.id}`}
              >
                {deal.restaurant?.name || "Restaurant Name"}
              </h3>
              {deal.restaurant?.cuisineType && (
                <p className="text-white/90 text-[10px] truncate">
                  {deal.restaurant.cuisineType}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-2" onClick={handleCardClick}>
            {/* Deal Title */}
            <p
              className="text-gray-900 text-xs font-bold mb-1.5 line-clamp-2 leading-tight min-h-[2rem]"
              data-testid={`text-restaurant-info-${deal.id}`}
            >
              {deal.title}
            </p>

            {/* Rating + Distance */}
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-gray-600">
              <div className="flex items-center gap-0.5">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-yellow-500"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="font-medium">4.5</span>
              </div>
              {deal.distance !== undefined && (
                <>
                  <span>•</span>
                  <span>{deal.distance.toFixed(1)} mi</span>
                </>
              )}
              {deal.minOrderAmount && (
                <>
                  <span>•</span>
                  <span className="text-orange-600 font-medium">
                    ${deal.minOrderAmount} min
                  </span>
                </>
              )}
            </div>

            {/* Meta Line: Time & Popularity */}
            <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2">
              <div className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                <span>Ends in 2h15m</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="font-medium text-gray-700">
                  {deal.currentUses || 188} claimed
                </span>
              </div>
            </div>

            {/* Action row: save + share + parking */}
            <div className="flex gap-1.5 mb-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-[10px] px-1"
                onClick={(e) => handleSave(e)}
              >
                {isSaved ? "Bookmarked" : "Bookmark special"}
                </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-[10px] px-1"
                onClick={handleShare}
              >
                Share
              </Button>
            </div>

            {/* Button */}
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold h-8 text-xs shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              View Special
              </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommend Modal */}
      {showRecommendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowRecommendModal(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-yellow-200/60">
            {/* Hero header */}
            <div className="bg-gradient-to-br from-yellow-200 via-amber-200 to-yellow-300 px-5 py-4 flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-yellow-300 flex items-center justify-center shadow-md">
                <GoldenForkIcon className="w-7 h-7 text-yellow-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 leading-tight">
                  Recommend this restaurant
                </h3>
                <p className="text-xs text-yellow-800/80">
                  Your recommendation directly affects local visibility
                </p>
                {isGoldenForkUser && (
                  <div className="mt-1 text-xs text-yellow-900 font-semibold flex items-center gap-1">
                    <span role="img" aria-label="golden">
                      🥇
                    </span>
                    Your recommendations carry extra weight in this area
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white px-5 pb-5 pt-4">
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Add context (optional)
              </label>
              <p className="text-xs text-gray-600 mb-2">
                What makes this spot worth recommending?
              </p>
              <textarea
                className="w-full rounded-xl border border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-sm p-3 min-h-[96px] resize-none"
                placeholder="Great food, fair prices, fast service, friendly owner…"
                value={recommendationText}
                onChange={(e) => setRecommendationText(e.target.value)}
              />

              {/* Favorite toggle card */}
              <button
                type="button"
                onClick={() => {
                  const next = !favoriteSelection;
                  setFavoriteSelection(next);
                  if (
                    next &&
                    favoriteCount !== null &&
                    favoriteCount >= MAX_FAVORITES &&
                    !isRestaurantFavorite
                  ) {
                    setFavoriteError(
                      `You can favorite up to ${MAX_FAVORITES} restaurants.`
                    );
                  } else {
                    setFavoriteError("");
                  }
                }}
                className={`mt-4 w-full rounded-xl border transition-all text-left p-3 flex items-center gap-3 ${
                  favoriteSelection
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                    favoriteSelection
                      ? "bg-white text-yellow-600 border-yellow-300"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      favoriteSelection ? "fill-yellow-500 text-yellow-600" : ""
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">
                    Add to Favorites
                  </div>
                  <div className="text-xs text-gray-600">
                    Only 3 favorites allowed
                    {favoriteSelection
                      ? " · One of your top 3 restaurants"
                      : ""}
                  </div>
                  {favoriteCount !== null && (
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Currently using {favoriteCount}/{MAX_FAVORITES}
                    </div>
                  )}
                  {favoriteError && (
                    <div className="text-red-600 text-xs mt-1">
                      {favoriteError}
                    </div>
                  )}
                </div>
              </button>

              <div className="flex justify-end gap-2 mt-5">
                <Button
                  variant="outline"
                  className="h-9 text-sm border-gray-200 text-gray-700"
                  onClick={() => setShowRecommendModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="h-9 bg-yellow-500 hover:bg-yellow-600 text-white text-sm shadow-md shadow-yellow-200/80"
                  onClick={handleRecommendSubmit}
                  disabled={recommendSubmitting || favoriteLoading}
                >
                  {recommendSubmitting ? "Sending..." : "Boost This Restaurant"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <DealShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        deal={deal}
      />

      {/* Restaurant Deals Drawer */}
      <RestaurantDealsDrawer
        isOpen={showDealsDrawer}
        onClose={() => setShowDealsDrawer(false)}
        restaurantId={deal.restaurantId}
        restaurantName={deal.restaurant?.name || "Restaurant"}
        initialDealId={deal.id}
      />
    </div>
  );
}
