import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Clock, CheckCircle, XCircle } from "lucide-react";
import { BackHeader } from "@/components/back-header";
import { SEOHead } from "@/components/seo-head";

type ClaimedDeal = {
  id: string;
  dealId: string;
  claimedAt: string;
  usedAt?: string | null;
  isUsed?: boolean | null;
  orderAmount?: string | number | null;
  dealTitle?: string | null;
  dealType?: string | null;
  discountValue?: string | number | null;
  restaurantId?: string | null;
  restaurantName?: string | null;
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const { data: claimedDeals, isLoading } = useQuery<ClaimedDeal[]>({
    queryKey: ["/api/deals/claimed"],
    enabled: isAuthenticated,
  });

  const claims = Array.isArray(claimedDeals) ? claimedDeals : [];
  const activeClaims = claims.filter((claim) => !claim.isUsed);
  const completedClaims = claims.filter((claim) => claim.isUsed);
  const currentClaims = activeTab === "active" ? activeClaims : completedClaims;

  const formatMoney = (value?: string | number | null) => {
    if (value === null || value === undefined) return "--";
    const amount = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(amount)) return "--";
    return `$${amount.toFixed(2)}`;
  };

  const formatDiscount = (claim: ClaimedDeal) => {
    if (claim.discountValue === null || claim.discountValue === undefined) {
      return "Deal claimed";
    }
    const value =
      typeof claim.discountValue === "string"
        ? Number(claim.discountValue)
        : claim.discountValue;
    if (!Number.isFinite(value)) return "Deal claimed";
    return claim.dealType === "fixed"
      ? `$${value.toFixed(2)} off`
      : `${value}% off`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <BackHeader
          title="Deal History"
          fallbackHref="/"
          icon={Receipt}
          className="bg-white border-b border-border"
        />

        <div className="px-6 py-12 text-center">
          <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Sign in to view orders
          </h2>
          <p className="text-muted-foreground mb-6">
            Log in to see your claimed deals and deal history
          </p>
          <Button onClick={() => (window.location.href = "/api/auth/facebook")}>
            Sign In
          </Button>
        </div>

        <Navigation />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      <SEOHead
        title="Deal History - MealScout | My Orders & Claims"
        description="View your complete deal history and claimed deals. Track active orders, see past purchases, and review your savings on MealScout."
        keywords="deal history, orders, claimed deals, order tracking, purchase history"
        canonicalUrl="https://mealscout.us/orders"
        noIndex={true}
      />
      <BackHeader
        title="Deal History"
        fallbackHref="/"
        icon={Receipt}
        className="bg-white border-b border-border"
      />

      {/* Tabs */}
      <div className="px-6 py-4 bg-white border-b border-border">
        <div className="flex bg-muted rounded-xl p-1">
          <Button
            variant={activeTab === "active" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("active")}
            className="flex-1 rounded-lg"
            data-testid="tab-active-orders"
          >
            Active ({activeClaims.length})
          </Button>
          <Button
            variant={activeTab === "completed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("completed")}
            className="flex-1 rounded-lg"
            data-testid="tab-completed-orders"
          >
            Completed ({completedClaims.length})
          </Button>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-md animate-pulse"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : currentClaims.length > 0 ? (
          <div className="space-y-4">
            {currentClaims.map((claim) => {
              const status = claim.isUsed ? "completed" : "active";
              const claimedAt = claim.claimedAt
                ? new Date(claim.claimedAt)
                : null;
              return (
                <div
                  key={claim.id}
                  className="bg-white rounded-2xl p-6 shadow-md"
                  data-testid={`order-${claim.id}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {claim.restaurantName || "Restaurant"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {claim.dealTitle || "Deal"}
                      </p>
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {getStatusIcon(status)}
                      <span className="ml-1 capitalize">{status}</span>
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                    <span>{formatDiscount(claim)}</span>
                    <span>{formatMoney(claim.orderAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {claimedAt ? claimedAt.toLocaleDateString() : "--"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      data-testid={`button-view-${claim.id}`}
                    >
                      <a href={`/deal/${claim.dealId}`}>View Deal</a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">
              {activeTab === "active"
                ? "No active claims"
                : "No completed claims"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeTab === "active"
                ? "Claim a deal to see it here"
                : "Your deal history will appear here"}
            </p>
            <Button asChild data-testid="button-browse-deals-orders">
              <a href="/deals">Browse Deals</a>
            </Button>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
