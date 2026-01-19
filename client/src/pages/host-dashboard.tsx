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
  id: number;
  businessName: string;
  address: string;
  locationType: string;
  stripeChargesEnabled?: boolean;
  stripeOnboardingCompleted?: boolean;
}

interface Event {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  maxTrucks: number;
  hardCapEnabled?: boolean;
  seriesId?: string | null;
  status: string;
  requiresPayment?: boolean;
  hostPriceCents?: number;
}

function HostDashboard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [host, setHost] = useState<HostProfile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxTrucks, setMaxTrucks] = useState(1);
  const [hardCapEnabled, setHardCapEnabled] = useState(false);
  const [createError, setCreateError] = useState("");
  const [priceDollars, setPriceDollars] = useState("");

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
        const hostRes = await fetch("/api/hosts/me");
        if (!hostRes.ok) {
          if (hostRes.status === 404) {
            setLocation("/host-signup");
            return;
          }
          throw new Error("Failed to fetch host profile");
        }
        const hostData = await hostRes.json();
        setHost(hostData);

        const eventsRes = await fetch("/api/hosts/events");
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

  const handleCreateEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError("");
    const parsedPrice = Number(priceDollars);
    if (!parsedPrice || parsedPrice <= 0) {
      setCreateError("Parking pass price must be greater than $0.");
      return;
    }

    try {
      const res = await fetch("/api/hosts/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startTime,
          endTime,
          maxTrucks: Number(maxTrucks),
          hardCapEnabled,
          requiresPayment: true,
          hostPriceCents: Math.round(parsedPrice * 100),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create listing");
      }

      const newEvent = await res.json();
      setEvents([...events, newEvent]);
      setIsCreating(false);
      setDate("");
      setStartTime("");
      setEndTime("");
      setMaxTrucks(1);
      setHardCapEnabled(false);
      setPriceDollars("");
    } catch (error: any) {
      setCreateError(error.message);
    }
  };

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
      {!host.stripeChargesEnabled &&
        events.some((event) => event.requiresPayment) && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900">
              Enable Payments to Accept Bookings
            </AlertTitle>
            <AlertDescription className="text-orange-800">
              <p className="mb-3">
                Set up payments to receive booking fees from trucks. You set
                your price ($0-$5,000), MealScout adds a fixed $10 coordination
                fee.
              </p>
              <Button
                onClick={handleEnablePayments}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Enable Payments with Stripe
              </Button>
            </AlertDescription>
          </Alert>
        )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {host.businessName}
          </h1>
          <p className="text-slate-600">{host.address}</p>
        </div>
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

      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-semibold mb-4">
            Create Parking Pass Listing
          </h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            {createError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-md text-sm">
                {createError}
              </div>
            )}

            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTrucks">Max Trucks</Label>
                <Input
                  id="maxTrucks"
                  type="number"
                  min="1"
                  max="10"
                  value={maxTrucks}
                  onChange={(event) => setMaxTrucks(Number(event.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Parking Pass Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={priceDollars}
                  onChange={(event) => setPriceDollars(event.target.value)}
                  required
                />
              </div>
              <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
                Trucks pay your price + $10 MealScout fee.
              </div>
            </div>

            <div className="flex items-center space-x-4 border p-4 rounded-md border-slate-200 bg-slate-50">
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

            <div className="flex justify-end">
              <Button type="submit">Create Parking Pass</Button>
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
            {events.filter(
              (event) =>
                new Date(event.date) >=
                  new Date(new Date().setHours(0, 0, 0, 0)) &&
                event.requiresPayment,
            ).length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900">
                  No upcoming parking pass listings
                </h3>
                <p className="text-slate-500 mb-4">
                  Create a paid parking pass listing for trucks.
                </p>
                <Button variant="outline" onClick={() => setIsCreating(true)}>
                  Create Parking Pass Listing
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {events
                  .filter(
                    (event) =>
                      new Date(event.date) >=
                        new Date(new Date().setHours(0, 0, 0, 0)) &&
                      event.requiresPayment,
                  )
                  .map((event) => (
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
                              {event.startTime} - {event.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="h-4 w-4" />
                              {event.maxTrucks} Truck
                              {event.maxTrucks !== 1 ? "s" : ""}
                            </span>
                            {event.requiresPayment &&
                              event.hostPriceCents !== undefined && (
                                <span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                                  ${(
                                    (event.hostPriceCents + 1000) /
                                    100
                                  ).toFixed(2)}{" "}
                                  total
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

                      <Badge variant="secondary">Paid Listing</Badge>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {events.filter(
              (event) =>
                new Date(event.date) <
                  new Date(new Date().setHours(0, 0, 0, 0)) &&
                event.requiresPayment,
            ).length === 0 ? (
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
                {events
                  .filter(
                    (event) =>
                      new Date(event.date) <
                        new Date(new Date().setHours(0, 0, 0, 0)) &&
                      event.requiresPayment,
                  )
                  .map((event) => (
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
