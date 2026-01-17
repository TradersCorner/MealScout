import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  Plus,
  Calendar,
  Clock,
  Truck,
  Users,
  ChefHat,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

import { useToast } from "@/hooks/use-toast";

import { CreateSeriesDialog } from "@/components/create-series-dialog";
import { EditOccurrenceDialog } from "@/components/edit-occurrence-dialog";
import { CancelSeriesDialog } from "@/components/cancel-series-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HostProfile {
  id: number;
  businessName: string;
  address: string;
  locationType: string;
  stripeChargesEnabled?: boolean;
  stripeOnboardingCompleted?: boolean;
}

interface EventInterest {
  id: number;
  truckId: number;
  status: string;
  createdAt: string;
  truck: {
    id: number;
    name: string;
    cuisineType: string;
    description?: string;
    imageUrl?: string;
  };
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
  interests?: { truckId: number }[];
}

interface EventSeries {
  id: number;
  hostId: number;
  name: string;
  recurrenceRule: string;
  timezone: string;
  defaultMaxTrucks: number;
  defaultHardCapEnabled: boolean;
  status: "draft" | "published" | "closed";
  createdAt: string;
  futureOccurrencesCount?: number;
  affectedTrucksCount?: number;
}

function HostDashboard() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [host, setHost] = useState<HostProfile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [series, setSeries] = useState<EventSeries[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  // New Event State
  const [isCreating, setIsCreating] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxTrucks, setMaxTrucks] = useState(1);
  const [hardCapEnabled, setHardCapEnabled] = useState(false);
  const [createError, setCreateError] = useState("");

  // Interest Drawer State
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventInterests, setEventInterests] = useState<EventInterest[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);

  // Series Dialog State
  const [isCreatingSeriesDialog, setIsCreatingSeriesDialog] = useState(false);

  // Edit Occurrence State
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Cancel Series State
  const [cancellingSeriesId, setCancellingSeriesId] = useState<number | null>(
    null,
  );
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login?redirect=/host/dashboard");
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

          const seriesRes = await fetch("/api/hosts/event-series");
          if (seriesRes.ok) {
            const seriesData = await seriesRes.json();
            setSeries(seriesData);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, setLocation]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create event");
      }

      const newEvent = await res.json();
      // Initialize with empty interests
      setEvents([...events, { ...newEvent, interests: [] }]);
      setIsCreating(false);
      // Reset form
      setDate("");
      setStartTime("");
      setEndTime("");
      setMaxTrucks(1);
      setHardCapEnabled(false);
    } catch (error: any) {
      setCreateError(error.message);
    }
  };

  const handleViewInterests = async (event: Event) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);
    setIsLoadingInterests(true);
    setEventInterests([]); // Clear previous

    try {
      const res = await fetch(`/api/hosts/events/${event.id}/interests`);
      if (res.ok) {
        const data = await res.json();
        setEventInterests(data);
      }
    } catch (error) {
      console.error("Failed to fetch interests", error);
    } finally {
      setIsLoadingInterests(false);
    }
  };

  const handleUpdateStatus = async (
    interestId: number,
    status: "accepted" | "declined",
  ) => {
    try {
      const res = await fetch(`/api/hosts/interests/${interestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update status");
      }

      const updatedInterest = await res.json();

      // Update local state
      setEventInterests((prev) =>
        prev.map((i) =>
          i.id === interestId ? { ...i, status: updatedInterest.status } : i,
        ),
      );

      toast({
        title: status === "accepted" ? "Truck Accepted" : "Truck Declined",
        description:
          status === "accepted"
            ? "The truck has been notified and will contact you."
            : "The truck has been notified.",
      });
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description:
          error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSeriesCreated = async () => {
    toast({
      title: "Series Published",
      description:
        "Your event series has been published and is now discoverable by trucks.",
    });

    // Refresh events to include newly generated occurrences
    await refreshEventsAndSeries();
  };

  const refreshEventsAndSeries = async () => {
    const seriesRes = await fetch("/api/hosts/event-series");
    if (seriesRes.ok) {
      const seriesData = await seriesRes.json();
      setSeries(seriesData);
    }
    try {
      const eventsRes = await fetch("/api/hosts/events");
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleEventUpdated = async () => {
    toast({
      title: "Event Updated",
      description:
        "Changes have been saved. Other occurrences are not affected.",
    });

    // Refresh events list
    await refreshEventsAndSeries();
  };

  const handleCancelSeries = (seriesId: number) => {
    setCancellingSeriesId(seriesId);
    setIsCancelDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!host) return null;

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Stripe Connect Payment Setup Alert */}
      {!host.stripeChargesEnabled && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">
            Enable Payments to Accept Bookings
          </AlertTitle>
          <AlertDescription className="text-orange-800">
            <p className="mb-3">
              Set up payments to receive booking fees from trucks. You set your
              price ($0-$5,000), MealScout adds a fixed $10 coordination fee.
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCreatingSeriesDialog(true)}
          >
            <Calendar className="mr-2 h-4 w-4" /> Open Call (Series)
          </Button>
          <Button onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? (
              "Cancel"
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Single Event
              </>
            )}
          </Button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-semibold mb-4">Schedule New Event</h2>
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
                  onChange={(e) => setDate(e.target.value)}
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
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
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
                  onChange={(e) => setMaxTrucks(Number(e.target.value))}
                  required
                />
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
              <Button type="submit">Schedule Event</Button>
            </div>
          </form>

          {/* Event Series Management */}
          {series.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Active Event Series
              </h2>
              <div className="space-y-3">
                {series
                  .filter((s) => s.status === "published")
                  .map((eventSeries) => {
                    // Calculate future occurrences and affected trucks
                    const futureOccurrences = events.filter(
                      (e) =>
                        e.seriesId === String(eventSeries.id) &&
                        new Date(e.date) >=
                          new Date(new Date().setHours(0, 0, 0, 0)),
                    );

                    const affectedTruckIds = new Set(
                      futureOccurrences.flatMap(
                        (e) => e.interests?.map((i) => i.truckId) || [],
                      ),
                    );

                    return (
                      <div
                        key={eventSeries.id}
                        className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">
                              {eventSeries.name}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {futureOccurrences.length} future occurrence
                                {futureOccurrences.length !== 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <Truck className="h-4 w-4" />
                                {affectedTruckIds.size} interested truck
                                {affectedTruckIds.size !== 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <ChefHat className="h-4 w-4" />
                                {eventSeries.defaultMaxTrucks} trucks/event
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              {eventSeries.recurrenceRule} • Timezone:{" "}
                              {eventSeries.timezone}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelSeries(eventSeries.id)}
                            className="ml-4"
                          >
                            Cancel Series
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        <Tabs
          defaultValue="upcoming"
          className="w-full"
          onValueChange={(v) => setActiveTab(v as "upcoming" | "past")}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Your Events
            </h2>
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="upcoming" className="space-y-4">
            {events.filter(
              (e) =>
                new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)),
            ).length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900">
                  No upcoming events
                </h3>
                <p className="text-slate-500 mb-4">
                  Create an event to invite food trucks to your location.
                </p>
                <Button variant="outline" onClick={() => setIsCreating(true)}>
                  Schedule First Event
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {events
                  .filter(
                    (e) =>
                      new Date(e.date) >=
                      new Date(new Date().setHours(0, 0, 0, 0)),
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

                            {/* Interest Count Badge */}
                            {(event.interests?.length || 0) > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                <Users className="w-3 h-3 mr-1" />
                                {event.interests?.length} Interested
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInterests(event)}
                        >
                          View Interests
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                        >
                          Edit Details
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {events.filter(
              (e) =>
                new Date(e.date) < new Date(new Date().setHours(0, 0, 0, 0)),
            ).length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900">
                  No past events
                </h3>
                <p className="text-slate-500">
                  Your event history will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 opacity-75">
                {events
                  .filter(
                    (e) =>
                      new Date(e.date) <
                      new Date(new Date().setHours(0, 0, 0, 0)),
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
                            {(event.interests?.length || 0) > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
                                <Users className="w-3 h-3 mr-1" />
                                {event.interests?.length} Interested
                              </span>
                            )}
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

      {/* Interest Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Interested Trucks</SheetTitle>
            <SheetDescription>
              {selectedEvent && (
                <div className="space-y-4">
                  <span>
                    For event on{" "}
                    {format(new Date(selectedEvent.date), "MMMM d, yyyy")}
                  </span>

                  {/* Capacity Guard */}
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Event Capacity</span>
                      <span
                        className={`font-medium ${
                          eventInterests.filter((i) => i.status === "accepted")
                            .length >= selectedEvent.maxTrucks
                            ? "text-amber-600"
                            : "text-slate-900"
                        }`}
                      >
                        {
                          eventInterests.filter((i) => i.status === "accepted")
                            .length
                        }{" "}
                        / {selectedEvent.maxTrucks} Spots Filled
                      </span>
                    </div>
                    <Progress
                      value={
                        (eventInterests.filter((i) => i.status === "accepted")
                          .length /
                          selectedEvent.maxTrucks) *
                        100
                      }
                      className={`h-2 ${
                        eventInterests.filter((i) => i.status === "accepted")
                          .length >= selectedEvent.maxTrucks
                          ? "bg-amber-100 [&>div]:bg-amber-500"
                          : ""
                      }`}
                    />

                    {eventInterests.filter((i) => i.status === "accepted")
                      .length >= selectedEvent.maxTrucks && (
                      <Alert
                        variant="default"
                        className="bg-amber-50 border-amber-200 text-amber-800 mt-2"
                      >
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">
                          Capacity Reached
                        </AlertTitle>
                        <AlertDescription className="text-amber-700">
                          You have reached your maximum capacity of{" "}
                          {selectedEvent.maxTrucks} trucks. You can still accept
                          more, but be aware of space limitations. This does not
                          reserve space or guarantee attendance.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {isLoadingInterests ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
              </div>
            ) : eventInterests.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Truck className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                <p>No trucks have expressed interest yet.</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                <div className="space-y-4">
                  {eventInterests.map((interest) => (
                    <div
                      key={interest.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50/50"
                    >
                      <Avatar className="h-12 w-12 border border-slate-200">
                        <AvatarImage src={interest.truck.imageUrl} />
                        <AvatarFallback>
                          <ChefHat className="h-6 w-6 text-slate-400" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {interest.truck.name}
                            </h4>
                            <p className="text-sm text-slate-500">
                              {interest.truck.cuisineType}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {interest.status}
                          </Badge>
                        </div>

                        {interest.truck.description && (
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                            {interest.truck.description}
                          </p>
                        )}

                        <div className="mt-3 flex gap-2">
                          {interest.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                className="w-full"
                                variant="default"
                                onClick={() =>
                                  handleUpdateStatus(interest.id, "accepted")
                                }
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                className="w-full"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateStatus(interest.id, "declined")
                                }
                              >
                                Decline
                              </Button>
                            </>
                          ) : (
                            <div
                              className={`w-full text-center py-2 text-sm font-medium rounded-md ${
                                interest.status === "accepted"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-50 text-slate-500 border border-slate-200"
                              }`}
                            >
                              {interest.status === "accepted"
                                ? "Accepted"
                                : "Declined"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CreateSeriesDialog
        open={isCreatingSeriesDialog}
        onOpenChange={setIsCreatingSeriesDialog}
        onSeriesCreated={handleSeriesCreated}
      />

      <EditOccurrenceDialog
        event={editingEvent}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onEventUpdated={handleEventUpdated}
      />

      {cancellingSeriesId &&
        (() => {
          const eventSeries = series.find((s) => s.id === cancellingSeriesId);
          if (!eventSeries) return null;

          const futureOccurrences = events.filter(
            (e) =>
              e.seriesId === String(eventSeries.id) &&
              new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)),
          );

          const affectedTruckIds = new Set(
            futureOccurrences.flatMap(
              (e) => e.interests?.map((i) => i.truckId) || [],
            ),
          );

          return (
            <CancelSeriesDialog
              open={isCancelDialogOpen}
              onOpenChange={setIsCancelDialogOpen}
              seriesId={eventSeries.id}
              seriesName={eventSeries.name}
              futureOccurrencesCount={futureOccurrences.length}
              affectedTrucksCount={affectedTruckIds.size}
            />
          );
        })()}
    </div>
  );
}

export default HostDashboard;
