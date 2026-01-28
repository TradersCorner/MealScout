import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface HostProfile {
  id: string;
  businessName: string;
  address: string;
  city?: string;
  state?: string;
  locationType: string;
  contactPhone?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  stripeOnboardingCompleted?: boolean;
  amenities?: Record<string, boolean> | null;
}

function HostDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [hosts, setHosts] = useState<HostProfile[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string>("");
  const [host, setHost] = useState<HostProfile | null>(null);
  const [isCheckingStripe, setIsCheckingStripe] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setLocation("/login?redirect=/host/dashboard");
      return;
    }

    if (user?.userType === "event_coordinator") {
      setLocation("/event-coordinator/dashboard");
      return;
    }

    const fetchData = async () => {
      try {
        const hostsRes = await fetch("/api/hosts");
        if (!hostsRes.ok) {
          throw new Error("Failed to fetch host profiles");
        }
        const hostList = await hostsRes.json();
        if (!Array.isArray(hostList) || hostList.length === 0) {
          setLocation("/host-signup");
          return;
        }

        setHosts(hostList);
        const initialHost = hostList[0];
        setSelectedHostId(initialHost.id);
        setHost(initialHost);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingPage(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isLoading, setLocation, user]);

  useEffect(() => {
    if (!selectedHostId) return;
    const selected = hosts.find((item) => item.id === selectedHostId) || null;
    setHost(selected);
  }, [hosts, selectedHostId]);

  const handleEnablePayments = async () => {
    try {
      const res = await fetch("/api/hosts/stripe/onboard", { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to initiate Stripe onboarding");
      }
      const { onboardingUrl } = await res.json();
      window.location.href = onboardingUrl;
    } catch (error) {
      console.error("Stripe onboarding error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate payment setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshStripeStatus = async () => {
    setIsCheckingStripe(true);
    try {
      const res = await fetch("/api/hosts/stripe/status");
      if (!res.ok) {
        throw new Error("Failed to check payment status");
      }
      const data = await res.json();
      setHost((prev) =>
        prev
          ? {
              ...prev,
              stripeChargesEnabled: data.chargesEnabled,
              stripePayoutsEnabled: data.payoutsEnabled,
              stripeOnboardingCompleted: data.onboardingCompleted,
            }
          : prev,
      );
      toast({
        title: "Stripe status updated",
        description: data.chargesEnabled
          ? "Payments are enabled."
          : "Payments are still pending.",
      });
    } catch (error: any) {
      console.error("Stripe status error:", error);
      toast({
        title: "Unable to refresh status",
        description: error.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingStripe(false);
    }
  };

  if (isLoading || isLoadingPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!host) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {!host.stripeChargesEnabled && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">
            Enable Payments to Accept Bookings
          </AlertTitle>
          <AlertDescription className="text-orange-800">
            <p className="mb-3">
              Set up payments to receive booking fees from trucks. You set your
              price per slot and get paid automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleEnablePayments}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Enable Payments with Stripe
              </Button>
              <Button
                variant="outline"
                onClick={refreshStripeStatus}
                disabled={isCheckingStripe}
              >
                {isCheckingStripe ? "Checking..." : "Refresh Stripe Status"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {host.businessName}
            </h1>
            <p className="text-slate-600">{host.address}</p>
          </div>
          {hosts.length > 1 && (
          <div className="flex items-center gap-2">
            <Label htmlFor="hostSelect" className="text-sm text-slate-600">
              Property
            </Label>
            <select
              id="hostSelect"
              value={selectedHostId}
              onChange={(event) => setSelectedHostId(event.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              {hosts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.businessName} · {item.address}
                </option>
              ))}
            </select>
          </div>
          )}
      </div>

    </div>
  );
}

export default HostDashboard;
