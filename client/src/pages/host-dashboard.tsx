import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [seriesError, setSeriesError] = useState("");
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [occurrenceLoadingId, setOccurrenceLoadingId] = useState<string | null>(
    null,
  );
  const [occurrencesBySeries, setOccurrencesBySeries] = useState<
    Record<string, any[]>
  >({});
  const [isCreatingSeries, setIsCreatingSeries] = useState(false);
  const [publishingSeriesId, setPublishingSeriesId] = useState<string | null>(
    null,
  );
  const [cancelingSeriesId, setCancelingSeriesId] = useState<string | null>(
    null,
  );

  const [seriesForm, setSeriesForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    defaultStartTime: "11:00",
    defaultEndTime: "14:00",
    defaultMaxTrucks: 5,
    defaultHardCapEnabled: true,
    recurrenceDays: [] as string[],
  });

  const recurrenceOptions = [
    { label: "Sun", value: "SU" },
    { label: "Mon", value: "MO" },
    { label: "Tue", value: "TU" },
    { label: "Wed", value: "WE" },
    { label: "Thu", value: "TH" },
    { label: "Fri", value: "FR" },
    { label: "Sat", value: "SA" },
  ];

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

  const loadSeries = async () => {
    setSeriesLoading(true);
    setSeriesError("");
    try {
      const res = await fetch("/api/hosts/event-series", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to load event series");
      }
      const data = await res.json();
      setSeriesList(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setSeriesError(error.message || "Failed to load event series.");
    } finally {
      setSeriesLoading(false);
    }
  };

  useEffect(() => {
    if (!host) return;
    loadSeries();
  }, [host?.id]);

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

  const toggleRecurrenceDay = (day: string) => {
    setSeriesForm((prev) => {
      const exists = prev.recurrenceDays.includes(day);
      const nextDays = exists
        ? prev.recurrenceDays.filter((d) => d !== day)
        : [...prev.recurrenceDays, day];
      return { ...prev, recurrenceDays: nextDays };
    });
  };

  const handleCreateSeries = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreatingSeries(true);
    setSeriesError("");
    try {
      const recurrenceRule =
        seriesForm.recurrenceDays.length > 0
          ? `WEEKLY:${seriesForm.recurrenceDays.join(",")}`
          : null;

      const res = await fetch("/api/hosts/event-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: seriesForm.name,
          description: seriesForm.description || null,
          timezone: "America/New_York",
          recurrenceRule,
          startDate: seriesForm.startDate,
          endDate: seriesForm.endDate,
          defaultStartTime: seriesForm.defaultStartTime,
          defaultEndTime: seriesForm.defaultEndTime,
          defaultMaxTrucks: Number(seriesForm.defaultMaxTrucks),
          defaultHardCapEnabled: Boolean(seriesForm.defaultHardCapEnabled),
          seriesType: "open_call",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create series");
      }

      const created = await res.json();
      setSeriesList((prev) => [created, ...prev]);
      setSeriesForm({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        defaultStartTime: "11:00",
        defaultEndTime: "14:00",
        defaultMaxTrucks: 5,
        defaultHardCapEnabled: true,
        recurrenceDays: [],
      });
      toast({
        title: "Series created",
        description: "Draft series created. Publish when ready.",
      });
    } catch (error: any) {
      setSeriesError(error.message || "Failed to create series.");
    } finally {
      setIsCreatingSeries(false);
    }
  };

  const handlePublishSeries = async (seriesId: string) => {
    setPublishingSeriesId(seriesId);
    try {
      const res = await fetch(`/api/hosts/event-series/${seriesId}/publish`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to publish series");
      }
      await loadSeries();
      toast({
        title: "Series published",
        description: "Occurrences generated and now visible to trucks.",
      });
    } catch (error: any) {
      toast({
        title: "Publish failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPublishingSeriesId(null);
    }
  };

  const handleCancelSeries = async (seriesId: string) => {
    setCancelingSeriesId(seriesId);
    try {
      const res = await fetch(`/api/hosts/event-series/${seriesId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to cancel series");
      }
      await loadSeries();
      toast({
        title: "Series cancelled",
        description: "Future occurrences cancelled and trucks notified.",
      });
    } catch (error: any) {
      toast({
        title: "Cancellation failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelingSeriesId(null);
    }
  };

  const handleLoadOccurrences = async (seriesId: string) => {
    setOccurrenceLoadingId(seriesId);
    try {
      const res = await fetch(
        `/api/hosts/event-series/${seriesId}/occurrences`,
        {
          credentials: "include",
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to load occurrences");
      }
      const data = await res.json();
      setOccurrencesBySeries((prev) => ({
        ...prev,
        [seriesId]: Array.isArray(data) ? data : [],
      }));
    } catch (error: any) {
      toast({
        title: "Load failed",
        description: error.message || "Unable to load occurrences.",
        variant: "destructive",
      });
    } finally {
      setOccurrenceLoadingId(null);
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
                  {item.businessName} � {item.address}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <section className="mb-12">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Event Series (Open Calls)
          </h2>
          <p className="text-sm text-slate-600">
            Create multi-day or recurring events and publish when ready.
          </p>
        </div>

        <form
          onSubmit={handleCreateSeries}
          className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
        >
          {seriesError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-md text-sm">
              {seriesError}
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seriesName">Series Name</Label>
              <Input
                id="seriesName"
                value={seriesForm.name}
                onChange={(e) =>
                  setSeriesForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                placeholder="Weekly Night Market"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seriesMaxTrucks">Max Trucks per Day</Label>
              <Input
                id="seriesMaxTrucks"
                type="number"
                min={1}
                max={50}
                value={seriesForm.defaultMaxTrucks}
                onChange={(e) =>
                  setSeriesForm((prev) => ({
                    ...prev,
                    defaultMaxTrucks: Number(e.target.value || 1),
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seriesDescription">Description</Label>
            <Textarea
              id="seriesDescription"
              value={seriesForm.description}
              onChange={(e) =>
                setSeriesForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              placeholder="Set expectations for trucks: timing, power, parking, audience."
            />
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seriesStartDate">Start Date</Label>
              <Input
                id="seriesStartDate"
                type="date"
                value={seriesForm.startDate}
                onChange={(e) =>
                  setSeriesForm((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seriesEndDate">End Date</Label>
              <Input
                id="seriesEndDate"
                type="date"
                value={seriesForm.endDate}
                onChange={(e) =>
                  setSeriesForm((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seriesStartTime">Start Time</Label>
              <Input
                id="seriesStartTime"
                type="time"
                value={seriesForm.defaultStartTime}
                onChange={(e) =>
                  setSeriesForm((prev) => ({
                    ...prev,
                    defaultStartTime: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seriesEndTime">End Time</Label>
              <Input
                id="seriesEndTime"
                type="time"
                value={seriesForm.defaultEndTime}
                onChange={(e) =>
                  setSeriesForm((prev) => ({
                    ...prev,
                    defaultEndTime: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recurrence (optional)</Label>
            <div className="flex flex-wrap gap-3">
              {recurrenceOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <Checkbox
                    checked={seriesForm.recurrenceDays.includes(option.value)}
                    onCheckedChange={() => toggleRecurrenceDay(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Leave blank for a single occurrence on the start date.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox
              checked={seriesForm.defaultHardCapEnabled}
              onCheckedChange={(value) =>
                setSeriesForm((prev) => ({
                  ...prev,
                  defaultHardCapEnabled: Boolean(value),
                }))
              }
            />
            Enforce hard capacity per occurrence
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Timezone: America/New_York</span>
            <span>Status: Draft on create</span>
          </div>

          <Button type="submit" disabled={isCreatingSeries}>
            {isCreatingSeries ? "Creating..." : "Create Series"}
          </Button>
        </form>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900">
              Your Series
            </h3>
            <Button
              variant="outline"
              onClick={loadSeries}
              disabled={seriesLoading}
            >
              {seriesLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {seriesLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading series...
            </div>
          ) : seriesList.length === 0 ? (
            <p className="text-sm text-slate-500">
              No event series yet. Create your first series above.
            </p>
          ) : (
            <div className="space-y-4">
              {seriesList.map((series) => (
                <div
                  key={series.id}
                  className="border border-slate-200 rounded-xl p-4 bg-white"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">
                        {series.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {series.startDate?.slice(0, 10)} →{" "}
                        {series.endDate?.slice(0, 10)} · {series.defaultStartTime}-
                        {series.defaultEndTime}
                      </p>
                      <p className="text-xs text-slate-500">
                        Status: {series.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {series.status === "draft" && (
                        <Button
                          onClick={() => handlePublishSeries(series.id)}
                          disabled={publishingSeriesId === series.id}
                        >
                          {publishingSeriesId === series.id
                            ? "Publishing..."
                            : "Publish"}
                        </Button>
                      )}
                      {series.status !== "closed" && (
                        <Button
                          variant="destructive"
                          onClick={() => handleCancelSeries(series.id)}
                          disabled={cancelingSeriesId === series.id}
                        >
                          {cancelingSeriesId === series.id
                            ? "Cancelling..."
                            : "Cancel Series"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleLoadOccurrences(series.id)}
                        disabled={occurrenceLoadingId === series.id}
                      >
                        {occurrenceLoadingId === series.id
                          ? "Loading..."
                          : "View Occurrences"}
                      </Button>
                    </div>
                  </div>

                  {occurrencesBySeries[series.id] && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      {occurrencesBySeries[series.id].length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No occurrences generated yet.
                        </p>
                      ) : (
                        <ul className="text-xs text-slate-600 space-y-1">
                          {occurrencesBySeries[series.id].map((occurrence) => (
                            <li key={occurrence.id}>
                              {occurrence.date?.slice(0, 10)} ·{" "}
                              {occurrence.startTime}-{occurrence.endTime} ·{" "}
                              {occurrence.status}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

export default HostDashboard;
