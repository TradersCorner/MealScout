import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  Clock,
  Loader2,
  Plus,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  stripeOnboardingCompleted?: boolean;
  amenities?: Record<string, boolean> | null;
}

interface Event {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxTrucks: number;
  hardCapEnabled?: boolean;
  seriesId?: string | null;
  status: string;
  requiresPayment?: boolean;
  hostPriceCents?: number;
  breakfastPriceCents?: number | null;
  lunchPriceCents?: number | null;
  dinnerPriceCents?: number | null;
  dailyPriceCents?: number | null;
  weeklyPriceCents?: number | null;
  monthlyPriceCents?: number | null;
}

const normalizeDollar = (value: string | number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed);
};

const parseOptionalDollar = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(parsed));
};

function HostDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [hosts, setHosts] = useState<HostProfile[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string>("");
  const [host, setHost] = useState<HostProfile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [anyTime, setAnyTime] = useState(false);
  const [maxTrucks, setMaxTrucks] = useState(1);
  const [hardCapEnabled, setHardCapEnabled] = useState(false);
  const [createError, setCreateError] = useState("");
  const [breakfastPrice, setBreakfastPrice] = useState("");
  const [lunchPrice, setLunchPrice] = useState("");
  const [dinnerPrice, setDinnerPrice] = useState("");
  const [weeklyOverride, setWeeklyOverride] = useState("");
  const [monthlyOverride, setMonthlyOverride] = useState("");
  const [amenities, setAmenities] = useState<Record<string, boolean>>({
    water: false,
    electric: false,
    bathrooms: false,
    wifi: false,
    seating: false,
  });
  const [isSavingAmenities, setIsSavingAmenities] = useState(false);
  const [blackoutDateInput, setBlackoutDateInput] = useState("");
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [isSavingBlackout, setIsSavingBlackout] = useState(false);
  const [hasActiveParkingPass, setHasActiveParkingPass] = useState(false);
  const [newLocationForm, setNewLocationForm] = useState({
    businessName: "",
    address: "",
    city: "",
    state: "",
    locationType: "other",
    contactPhone: "",
  });
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);
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
        setAmenities((current) => ({
          ...current,
          ...(initialHost.amenities ?? {}),
        }));

        const eventsRes = await fetch(`/api/hosts/events?hostId=${initialHost.id}`);
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData);
        }
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
    if (selected) {
      setAmenities((current) => ({
        ...current,
        ...(selected.amenities ?? {}),
      }));
    }

    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/hosts/events?hostId=${selectedHostId}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchEvents();

    const fetchBlackouts = async () => {
      try {
        const res = await fetch(
          `/api/hosts/${selectedHostId}/blackout-dates`,
        );
        if (res.status === 404) {
          setBlackoutDates([]);
          setHasActiveParkingPass(false);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const dates = data
              .map((row) =>
                new Date(row.date).toISOString().split("T")[0],
              )
              .sort();
            setBlackoutDates(dates);
            setHasActiveParkingPass(true);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchBlackouts();
  }, [hosts, selectedHostId]);

  const handleCreateLocation = async () => {
    if (!newLocationForm.businessName || !newLocationForm.address) {
      toast({
        title: "Missing details",
        description: "Business name and address are required.",
        variant: "destructive",
      });
      return;
    }
    if (!newLocationForm.city || !newLocationForm.state) {
      toast({
        title: "Missing city/state",
        description: "City and state are required to save a location.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingLocation(true);
    try {
      const res = await fetch("/api/hosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: newLocationForm.businessName,
          address: newLocationForm.address,
          city: newLocationForm.city,
          state: newLocationForm.state,
          locationType: newLocationForm.locationType,
          contactPhone: newLocationForm.contactPhone || null,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to create host location");
      }
      const created = await res.json();
      setHosts((current) => [created, ...current]);
      setSelectedHostId(created.id);
      setNewLocationForm({
        businessName: "",
        address: "",
        city: "",
        state: "",
        locationType: "other",
        contactPhone: "",
      });
      toast({
        title: "Location added",
        description: "You can edit this location any time.",
      });
    } catch (error: any) {
      toast({
        title: "Unable to save location",
        description: error.message || "Failed to create location.",
        variant: "destructive",
      });
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!host) return;
    setIsUpdatingLocation(true);
    try {
      const res = await fetch(`/api/hosts/${host.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: host.businessName,
          address: host.address,
          city: host.city,
          state: host.state,
          locationType: host.locationType,
          contactPhone: host.contactPhone || null,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update location");
      }
      const updated = await res.json();
      setHosts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setHost(updated);
      toast({
        title: "Location updated",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update location.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!host) return;
    const confirmed = window.confirm(
      `Delete ${host.businessName}? This removes the location and its listings.`,
    );
    if (!confirmed) return;

    setIsDeletingLocation(true);
    try {
      const res = await fetch(`/api/hosts/${host.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete location");
      }

      const nextHosts = hosts.filter((item) => item.id !== host.id);
      setHosts(nextHosts);

      if (!nextHosts.length) {
        setHost(null);
        setSelectedHostId("");
        toast({
          title: "Location deleted",
          description: "Your test location has been removed.",
        });
        setLocation("/host-signup");
        return;
      }

      const nextHost = nextHosts[0];
      setSelectedHostId(nextHost.id);
      setHost(nextHost);
      toast({
        title: "Location deleted",
        description: "Your test location has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete location.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingLocation(false);
    }
  };

  const hasPricing = (item: Event) =>
    (item.breakfastPriceCents ?? 0) > 0 ||
    (item.lunchPriceCents ?? 0) > 0 ||
    (item.dinnerPriceCents ?? 0) > 0 ||
    (item.dailyPriceCents ?? 0) > 0 ||
    (item.weeklyPriceCents ?? 0) > 0 ||
    (item.monthlyPriceCents ?? 0) > 0;

  const hasActivePass = events.some((item) => {
    if (!item.requiresPayment) return false;
    if (!hasPricing(item)) return false;
    const itemDate = new Date(item.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return itemDate >= today;
  });

  const groupParkingPassListings = (items: Event[]) => {
    const sorted = [...items].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const grouped = new Map<string, Event>();
    sorted.forEach((item) => {
      const key = item.seriesId || item.id;
      if (!grouped.has(key)) {
        grouped.set(key, item);
      }
    });
    return Array.from(grouped.values());
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const upcomingListings = groupParkingPassListings(
    events.filter(
      (event) =>
        event.requiresPayment && new Date(event.date) >= todayStart,
    ),
  );

  const pastListings = groupParkingPassListings(
    events.filter(
      (event) => event.requiresPayment && new Date(event.date) < todayStart,
    ),
  );

  const handleCreateEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError("");
    if (hasActivePass) {
      setCreateError(
        "You already have a parking pass for this address. Edit the existing listing.",
      );
      return;
    }
    const finalStartTime = anyTime ? "00:00" : startTime;
    const finalEndTime = anyTime ? "23:59" : endTime;
    const breakfast = normalizeDollar(breakfastPrice);
    const lunch = normalizeDollar(lunchPrice);
    const dinner = normalizeDollar(dinnerPrice);
    const hasSlotPrice = breakfast > 0 || lunch > 0 || dinner > 0;

    if (!hasSlotPrice) {
      setCreateError("At least one slot price is required.");
      return;
    }
    if (daysOfWeek.length === 0) {
      setCreateError("Select at least one day of the week.");
      return;
    }

    try {
      const res = await fetch("/api/hosts/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostId: selectedHostId,
          daysOfWeek,
          startTime: finalStartTime,
          endTime: finalEndTime,
          maxTrucks: Number(maxTrucks),
          hardCapEnabled,
          requiresPayment: true,
          breakfastPriceCents: breakfast ? breakfast * 100 : 0,
          lunchPriceCents: lunch ? lunch * 100 : 0,
          dinnerPriceCents: dinner ? dinner * 100 : 0,
          ...(weeklyOverrideValue !== null
            ? { weeklyPriceCents: weeklyOverrideValue * 100 }
            : {}),
          ...(monthlyOverrideValue !== null
            ? { monthlyPriceCents: monthlyOverrideValue * 100 }
            : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create listing");
      }

      const newEvent = await res.json();
      const newEvents = Array.isArray(newEvent) ? newEvent : [newEvent];
      setEvents([...events, ...newEvents]);
      setIsCreating(false);
      setDaysOfWeek([]);
      setStartTime("");
      setEndTime("");
      setAnyTime(false);
      setMaxTrucks(1);
      setHardCapEnabled(false);
      setBreakfastPrice("");
      setLunchPrice("");
      setDinnerPrice("");
      setWeeklyOverride("");
      setMonthlyOverride("");
    } catch (error: any) {
      setCreateError(error.message);
    }
  };

  const handleAmenitiesSave = async () => {
    if (!host) {
      return;
    }
    setIsSavingAmenities(true);
    try {
      const res = await fetch(`/api/hosts/${host.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amenities }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update amenities");
      }

      const updatedHost = await res.json();
      setHost(updatedHost);
      setHosts((current) =>
        current.map((item) => (item.id === updatedHost.id ? updatedHost : item)),
      );
      toast({
        title: "Amenities updated",
        description: "Your parking pass amenities are saved.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingAmenities(false);
    }
  };

  const handleAddBlackout = async () => {
    if (!host || !blackoutDateInput || !hasActiveParkingPass) return;
    setIsSavingBlackout(true);
    try {
      const res = await fetch(`/api/hosts/${host.id}/blackout-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: blackoutDateInput }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add blackout date");
      }
      const dateKey = blackoutDateInput;
      setBlackoutDates((current) =>
        current.includes(dateKey) ? current : [...current, dateKey].sort(),
      );
      setBlackoutDateInput("");
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingBlackout(false);
    }
  };

  const handleRemoveBlackout = async (dateKey: string) => {
    if (!host || !hasActiveParkingPass) return;
    setIsSavingBlackout(true);
    try {
      const res = await fetch(`/api/hosts/${host.id}/blackout-dates`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove blackout date");
      }
      setBlackoutDates((current) =>
        current.filter((item) => item !== dateKey),
      );
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingBlackout(false);
    }
  };

  const formatCents = (value?: number | null) =>
    value && value > 0 ? `$${(value / 100).toFixed(2)}` : "—";

  const breakfastValue = normalizeDollar(breakfastPrice);
  const lunchValue = normalizeDollar(lunchPrice);
  const dinnerValue = normalizeDollar(dinnerPrice);
  const slotSum = breakfastValue + lunchValue + dinnerValue;
  const dailyEstimate = slotSum ? slotSum + 10 : 0;
  const weeklyEstimate = slotSum ? slotSum * 7 + 10 : 0;
  const monthlyEstimate = slotSum ? slotSum * 30 + 10 : 0;
  const weeklyOverrideValue = parseOptionalDollar(weeklyOverride);
  const monthlyOverrideValue = parseOptionalDollar(monthlyOverride);
  const weeklyFinal = weeklyOverrideValue ?? weeklyEstimate;
  const monthlyFinal = monthlyOverrideValue ?? monthlyEstimate;

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
          <Button onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? (
              "Cancel"
            ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> New Parking Pass
            </>
          )}
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              On-site Amenities
            </h2>
            <p className="text-sm text-slate-500">
              Share what trucks can expect at your location.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleAmenitiesSave}
            disabled={isSavingAmenities}
          >
            {isSavingAmenities ? "Saving..." : "Save amenities"}
          </Button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Location details
              </h2>
              <p className="text-sm text-slate-500">
                Keep each parking address accurate for trucks.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleUpdateLocation}
                disabled={isUpdatingLocation}
              >
                {isUpdatingLocation ? "Saving..." : "Save location"}
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteLocation}
                disabled={isDeletingLocation}
              >
                {isDeletingLocation ? "Deleting..." : "Delete location"}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hostBusinessName">Location name</Label>
              <Input
                id="hostBusinessName"
                value={host.businessName}
                onChange={(event) =>
                  setHost((current) =>
                    current
                      ? { ...current, businessName: event.target.value }
                      : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostContactPhone">Contact phone</Label>
              <Input
                id="hostContactPhone"
                value={host.contactPhone || ""}
                onChange={(event) =>
                  setHost((current) =>
                    current
                      ? { ...current, contactPhone: event.target.value }
                      : current,
                  )
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hostAddress">Address</Label>
              <Input
                id="hostAddress"
                value={host.address}
                onChange={(event) =>
                  setHost((current) =>
                    current ? { ...current, address: event.target.value } : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostCity">City</Label>
              <Input
                id="hostCity"
                value={host.city || ""}
                onChange={(event) =>
                  setHost((current) =>
                    current ? { ...current, city: event.target.value } : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostState">State</Label>
              <Input
                id="hostState"
                value={host.state || ""}
                onChange={(event) =>
                  setHost((current) =>
                    current ? { ...current, state: event.target.value } : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostType">Location type</Label>
              <select
                id="hostType"
                value={host.locationType || "other"}
                onChange={(event) =>
                  setHost((current) =>
                    current
                      ? { ...current, locationType: event.target.value }
                      : current,
                  )
                }
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="office">Office</option>
                <option value="bar">Bar</option>
                <option value="brewery">Brewery</option>
                <option value="restaurant">Restaurant</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              Add another parking location
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newHostName">Location name</Label>
                <Input
                  id="newHostName"
                  value={newLocationForm.businessName}
                  onChange={(event) =>
                    setNewLocationForm((current) => ({
                      ...current,
                      businessName: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newHostPhone">Contact phone</Label>
                <Input
                  id="newHostPhone"
                  value={newLocationForm.contactPhone}
                  onChange={(event) =>
                    setNewLocationForm((current) => ({
                      ...current,
                      contactPhone: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="newHostAddress">Address</Label>
                <Input
                  id="newHostAddress"
                  value={newLocationForm.address}
                  onChange={(event) =>
                    setNewLocationForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newHostCity">City</Label>
                <Input
                  id="newHostCity"
                  value={newLocationForm.city}
                  onChange={(event) =>
                    setNewLocationForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newHostState">State</Label>
                <Input
                  id="newHostState"
                  value={newLocationForm.state}
                  onChange={(event) =>
                    setNewLocationForm((current) => ({
                      ...current,
                      state: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newHostType">Location type</Label>
                <select
                  id="newHostType"
                  value={newLocationForm.locationType}
                  onChange={(event) =>
                    setNewLocationForm((current) => ({
                      ...current,
                      locationType: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="office">Office</option>
                  <option value="bar">Bar</option>
                  <option value="brewery">Brewery</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleCreateLocation}
                  disabled={isSavingLocation}
                >
                  {isSavingLocation ? "Saving..." : "Add location"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {[
            { key: "water", label: "Water" },
            { key: "electric", label: "Electric" },
            { key: "bathrooms", label: "Bathrooms" },
            { key: "wifi", label: "Wi-Fi" },
            { key: "seating", label: "Seating" },
          ].map((amenity) => (
            <label
              key={amenity.key}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={amenities[amenity.key] ?? false}
                onChange={(event) =>
                  setAmenities((prev) => ({
                    ...prev,
                    [amenity.key]: event.target.checked,
                  }))
                }
              />
              {amenity.label}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Blackout Dates
            </h2>
            <p className="text-sm text-slate-500">
              Block specific days when trucks cannot park.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="date"
            value={blackoutDateInput}
            onChange={(event) => setBlackoutDateInput(event.target.value)}
            min={new Date().toISOString().split("T")[0]}
            disabled={!hasActiveParkingPass}
          />
          <Button
            type="button"
            onClick={handleAddBlackout}
            disabled={
              !hasActiveParkingPass || !blackoutDateInput || isSavingBlackout
            }
          >
            {isSavingBlackout ? "Saving..." : "Add blackout date"}
          </Button>
        </div>
        {!hasActiveParkingPass && (
          <p className="mt-3 text-sm text-slate-500">
            Create a parking pass to manage blackout dates for that pass.
          </p>
        )}
        {blackoutDates.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No blackout dates set.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {blackoutDates.map((dateKey) => (
              <button
                key={dateKey}
                type="button"
                onClick={() => handleRemoveBlackout(dateKey)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                disabled={
                  isSavingBlackout ||
                  dateKey <= new Date().toISOString().split("T")[0]
                }
              >
                {format(new Date(dateKey), "MMM d, yyyy")} (remove)
              </button>
            ))}
          </div>
        )}
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Post a Parking Pass
              </h2>
              <p className="text-sm text-slate-500">
                Set the day, time window, and what each slot costs.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
              {host.businessName}
            </div>
          </div>
          <form onSubmit={handleCreateEvent} className="mt-6 space-y-6">
            {createError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-md text-sm">
                {createError}
              </div>
            )}
            {hasActivePass && (
              <div className="p-3 bg-amber-50 text-amber-700 rounded-md text-sm">
                You already have a parking pass for this address. Edit the
                existing listing instead of creating a new one.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      When trucks can park
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pick the weekly schedule and a time window.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="anyTime"
                      checked={anyTime}
                      onCheckedChange={setAnyTime}
                    />
                    <Label htmlFor="anyTime" className="text-xs text-slate-600">
                      Any time
                    </Label>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Days of the week</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Mon", value: 1 },
                        { label: "Tue", value: 2 },
                        { label: "Wed", value: 3 },
                        { label: "Thu", value: 4 },
                        { label: "Fri", value: 5 },
                        { label: "Sat", value: 6 },
                        { label: "Sun", value: 0 },
                      ].map((day) => {
                        const selected = daysOfWeek.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            className={`rounded-md border px-3 py-2 text-xs font-medium transition ${
                              selected
                                ? "border-orange-300 bg-orange-100 text-orange-900"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                            onClick={() =>
                              setDaysOfWeek((current) =>
                                current.includes(day.value)
                                  ? current.filter((item) => item !== day.value)
                                  : [...current, day.value],
                              )
                            }
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTrucks">Number of spots</Label>
                    <Input
                      id="maxTrucks"
                      type="number"
                      min="1"
                      max="10"
                      value={maxTrucks}
                      onChange={(event) =>
                        setMaxTrucks(Number(event.target.value))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      disabled={anyTime}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      disabled={anyTime}
                      required
                    />
                  </div>
                </div>
                {anyTime && (
                  <p className="mt-3 text-xs text-slate-500">
                    Any time means trucks can park 24/7.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
                <h3 className="text-base font-semibold text-orange-900">
                  Earnings preview
                </h3>
                <p className="text-xs text-orange-700 mb-4">
                  Daily = slot total + $10. Weekly = (slot total x 7) + $10.
                  Monthly = (slot total x 30) + $10.
                </p>
                <div className="space-y-2 text-sm text-orange-900">
                  <div className="flex items-center justify-between">
                    <span>Slot total</span>
                    <span className="font-semibold">
                      {slotSum ? `$${slotSum.toFixed(2)}` : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Daily</span>
                    <span className="font-semibold">
                      {dailyEstimate ? `$${dailyEstimate.toFixed(2)}` : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      Weekly{" "}
                      {weeklyOverrideValue !== null ? "(custom)" : "(auto)"}
                    </span>
                    <span className="font-semibold">
                      {weeklyFinal ? `$${weeklyFinal.toFixed(2)}` : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      Monthly{" "}
                      {monthlyOverrideValue !== null ? "(custom)" : "(auto)"}
                    </span>
                    <span className="font-semibold">
                      {monthlyFinal ? `$${monthlyFinal.toFixed(2)}` : "-"}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-orange-800">
                  Trucks see your full payout per slot.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Set slot pricing
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Set any slot to $0 if you don't want to offer it.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <Label htmlFor="breakfastPrice">Breakfast</Label>
                  <Input
                    id="breakfastPrice"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={breakfastPrice}
                    onChange={(event) => setBreakfastPrice(event.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-500">Early shift pricing.</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <Label htmlFor="lunchPrice">Lunch</Label>
                  <Input
                    id="lunchPrice"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={lunchPrice}
                    onChange={(event) => setLunchPrice(event.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-500">Peak traffic slot.</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <Label htmlFor="dinnerPrice">Dinner</Label>
                  <Input
                    id="dinnerPrice"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={dinnerPrice}
                    onChange={(event) => setDinnerPrice(event.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-500">Evening coverage.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Weekly & monthly rates (optional)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Leave blank to use the auto-calculated weekly and monthly
                totals.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <Label htmlFor="weeklyOverride">Weekly rate</Label>
                  <Input
                    id="weeklyOverride"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={weeklyOverride}
                    onChange={(event) => setWeeklyOverride(event.target.value)}
                    placeholder={
                      weeklyEstimate ? `$${weeklyEstimate.toFixed(0)}` : "Auto"
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Auto weekly:{" "}
                    {weeklyEstimate ? `$${weeklyEstimate.toFixed(0)}` : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <Label htmlFor="monthlyOverride">Monthly rate</Label>
                  <Input
                    id="monthlyOverride"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={monthlyOverride}
                    onChange={(event) => setMonthlyOverride(event.target.value)}
                    placeholder={
                      monthlyEstimate ? `$${monthlyEstimate.toFixed(0)}` : "Auto"
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Auto monthly:{" "}
                    {monthlyEstimate ? `$${monthlyEstimate.toFixed(0)}` : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 border p-4 rounded-xl border-slate-200 bg-slate-50">
              <Switch
                id="hard-cap"
                checked={hardCapEnabled}
                onCheckedChange={setHardCapEnabled}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="hard-cap" className="font-semibold">
                    Capacity Guard v2.2
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  Strictly enforces the max trucks limit. Once you accept enough
                  trucks to hit the limit, no further approvals will be allowed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                You can edit times later if plans change.
              </p>
              <Button type="submit" className="px-6" disabled={hasActivePass}>
                Publish Parking Pass
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        <Tabs
          defaultValue="upcoming"
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Your Parking Pass Listings
            </h2>
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingListings.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900">
                  No upcoming parking pass listings
                </h3>
                <p className="text-slate-500 mb-4">
                  Create a parking pass listing for trucks.
                </p>
                <Button variant="outline" onClick={() => setIsCreating(true)}>
                  Create Parking Pass Listing
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {upcomingListings.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-rose-50 rounded-lg text-rose-700">
                          <span className="text-xs font-bold uppercase">
                            {format(new Date(event.date), "MMM")}
                          </span>
                          <span className="text-2xl font-bold">
                            {format(new Date(event.date), "d")}
                          </span>
                        </div>

                        <div>
            <div className="flex items-center gap-4 text-sm text-slate-600 mb-1">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {event.startTime === "00:00" &&
                event.endTime === "23:59"
                  ? "Any time"
                  : `${event.startTime} - ${event.endTime}`}
              </span>
              <span className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                {event.maxTrucks} Spot
                {event.maxTrucks !== 1 ? "s" : ""}
              </span>
                            {event.requiresPayment && (
                              <span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                                Daily {formatCents(event.dailyPriceCents)} / Weekly{" "}
                                {formatCents(event.weeklyPriceCents)} / Monthly{" "}
                                {formatCents(event.monthlyPriceCents)}
                              </span>
                            )}
                            {event.hardCapEnabled && (
                              <span
                                title="Capacity Guard v2.2 Enabled"
                                className="flex items-center gap-1 text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100"
                              >
                                <AlertCircle className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700 font-medium">
                                  Strict Cap
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                event.status === "open"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : event.status === "filled"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {event.status.charAt(0).toUpperCase() +
                                event.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge variant="secondary">Listing</Badge>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastListings.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900">
                  No past parking pass listings
                </h3>
                <p className="text-slate-500">
                  Your parking pass history will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 opacity-75">
                {pastListings.map((event) => (
                    <div
                      key={event.id}
                      className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-200 rounded-lg text-slate-600">
                          <span className="text-xs font-bold uppercase">
                            {format(new Date(event.date), "MMM")}
                          </span>
                          <span className="text-2xl font-bold">
                            {format(new Date(event.date), "d")}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mb-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {event.startTime} - {event.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
                              Completed
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" disabled>
                        Archived
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default HostDashboard;
