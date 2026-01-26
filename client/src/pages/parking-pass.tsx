import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2, Share2, Trash2 } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { BookingPaymentModal } from "@/components/booking-payment-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ShareButton from "@/components/share-button";
import mealScoutIcon from "@assets/meal-scout-icon.png";

interface Host {
  id: string;
  businessName: string;
  address: string;
  locationType: string;
  city?: string | null;
  state?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  expectedFootTraffic?: string | null;
}

interface ParkingPassEvent {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  requiresPayment?: boolean;
  maxTrucks?: number;
  spotCount?: number;
  bookedSpots?: number;
  availableSpotNumbers?: number[];
  hostPriceCents?: number;
  breakfastPriceCents?: number | null;
  lunchPriceCents?: number | null;
  dinnerPriceCents?: number | null;
  dailyPriceCents?: number | null;
  weeklyPriceCents?: number | null;
  host: Host;
  bookings?: Array<{
    truckId: string;
    truckName: string;
    slotType?: string | null;
    spotNumber?: number | null;
  }>;
}

interface ManualScheduleEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  locationName?: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  isPublic?: boolean | null;
}

interface TruckScheduleEntry {
  type: "booking" | "accepted_interest" | "manual";
  status: string;
  createdAt?: string;
  bookingConfirmedAt?: string | null;
  slotType?: string | null;
  event?: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    requiresPayment?: boolean | null;
  };
  host?: {
    businessName: string;
    address: string;
    locationType: string;
  };
  manual?: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    locationName?: string | null;
    address: string;
    city?: string | null;
    state?: string | null;
    notes?: string | null;
  };
}

const parkingPassPinIcon = new L.Icon({
  iconUrl: mealScoutIcon,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -30],
});

const MapCenterer = ({
  center,
}: {
  center: { lat: number; lng: number } | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center?.lat, center?.lng, map]);

  return null;
};

export default function ParkingPassPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<ParkingPassEvent[]>([]);
  const [truckId, setTruckId] = useState<string | null>(null);
  const [truck, setTruck] = useState<any | null>(null);
  const [hasHostProfile, setHasHostProfile] = useState(false);
  const [manualSchedules, setManualSchedules] = useState<ManualScheduleEntry[]>(
    [],
  );
  const [bookedSchedule, setBookedSchedule] = useState<TruckScheduleEntry[]>(
    [],
  );
  const [selectedEvent, setSelectedEvent] = useState<ParkingPassEvent | null>(
    null,
  );
  const [selectedSlotTypes, setSelectedSlotTypes] = useState<string[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateParam;
    }
    return new Date().toISOString().split("T")[0];
  });
  const [selectedSlotsByEvent, setSelectedSlotsByEvent] = useState<
    Record<string, string[]>
  >({});
  const [cityQuery, setCityQuery] = useState("");
  const [cartItems, setCartItems] = useState<
    Array<{ event: ParkingPassEvent; slotTypes: string[] }>
  >([]);
  const [checkoutQueue, setCheckoutQueue] = useState<
    Array<{ event: ParkingPassEvent; slotTypes: string[] }>
  >([]);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    locationName: "",
    address: "",
    city: "",
    state: "",
    notes: "",
    isPublic: true,
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    setSelectedSlotsByEvent({});
  }, [selectedDate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const passId = params.get("pass");
    if (passId) {
      setActiveEventId(passId);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setTruckId(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        if (isAuthenticated) {
          const truckRes = await fetch("/api/restaurants/my-restaurants");
          if (truckRes.ok) {
            const trucks = await truckRes.json();
            if (!cancelled && Array.isArray(trucks) && trucks.length > 0) {
              const foodTruck =
                trucks.find((item: any) => item.isFoodTruck) || trucks[0];
              setTruckId(foodTruck.id);
              setTruck(foodTruck);
            }
          }
          const hostRes = await fetch("/api/hosts");
          if (hostRes.ok) {
            const hosts = await hostRes.json();
            if (!cancelled && Array.isArray(hosts) && hosts.length > 0) {
              setHasHostProfile(true);
            }
          } else if (!cancelled) {
            setHasHostProfile(false);
          }
        }

        const eventsRes = await fetch("/api/parking-pass");
        if (!eventsRes.ok) {
          throw new Error("Failed to load parking pass listings");
        }
        const data = await eventsRes.json();
        if (!cancelled) {
          const openEvents = Array.isArray(data)
            ? data.filter((e) => e.status === "open")
            : [];
          setEvents(openEvents);
        }
      } catch (error: any) {
        if (!cancelled) {
          toast({
            title: "Error",
            description:
              error.message || "Failed to load parking pass listings.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, toast]);

  useEffect(() => {
    if (!truckId) {
      setManualSchedules([]);
      return;
    }
    let cancelled = false;
    const loadManualSchedules = async () => {
      try {
        const res = await fetch(`/api/trucks/${truckId}/manual-schedule`);
        if (!res.ok) {
          throw new Error("Failed to load schedule");
        }
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          setManualSchedules(data);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Schedule Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to load your schedule.",
            variant: "destructive",
          });
        }
      }
    };

    loadManualSchedules();
    return () => {
      cancelled = true;
    };
  }, [truckId, toast]);

  useEffect(() => {
    if (!truckId) {
      setBookedSchedule([]);
      return;
    }
    let cancelled = false;
    const loadBookedSchedule = async () => {
      try {
        const res = await fetch(`/api/bookings/truck/${truckId}/schedule`);
        if (!res.ok) {
          throw new Error("Failed to load booked schedule");
        }
        const data = await res.json();
        const schedule = Array.isArray(data?.schedule) ? data.schedule : [];
        const parkingBookings = schedule.filter(
          (entry: TruckScheduleEntry) =>
            entry.type === "booking" && entry.event?.requiresPayment,
        );
        if (!cancelled) {
          setBookedSchedule(parkingBookings);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Schedule Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to load booked schedule.",
            variant: "destructive",
          });
        }
      }
    };

    loadBookedSchedule();
    return () => {
      cancelled = true;
    };
  }, [truckId, toast]);

  const handleScheduleFieldChange = (
    field: keyof typeof scheduleForm,
    value: string | boolean,
  ) => {
    setScheduleForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateSchedule = async () => {
    if (!truckId) {
      toast({
        title: "Missing truck",
        description: "Select a food truck before adding a schedule stop.",
        variant: "destructive",
      });
      return;
    }
    if (!scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime) {
      toast({
        title: "Missing time",
        description: "Date, start time, and end time are required.",
        variant: "destructive",
      });
      return;
    }
    if (!scheduleForm.address) {
      toast({
        title: "Missing address",
        description: "Address is required for schedule entries.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingSchedule(true);
    try {
      const res = await fetch(`/api/trucks/${truckId}/manual-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: scheduleForm.date,
          startTime: scheduleForm.startTime,
          endTime: scheduleForm.endTime,
          locationName: scheduleForm.locationName || undefined,
          address: scheduleForm.address,
          city: scheduleForm.city || undefined,
          state: scheduleForm.state || undefined,
          notes: scheduleForm.notes || undefined,
          isPublic: scheduleForm.isPublic,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save schedule");
      }
      const created = await res.json();
      setManualSchedules((prev) => [...prev, created]);
      setScheduleForm((current) => ({
        ...current,
        startTime: "",
        endTime: "",
        locationName: "",
        address: "",
        city: "",
        state: "",
        notes: "",
      }));
      toast({
        title: "Schedule saved",
        description: "Your stop is now on your schedule.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save schedule entry.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!truckId) return;
    try {
      const res = await fetch(
        `/api/trucks/${truckId}/manual-schedule/${scheduleId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete schedule");
      }
      setManualSchedules((prev) =>
        prev.filter((entry) => entry.id !== scheduleId),
      );
      toast({
        title: "Schedule removed",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete schedule entry.",
        variant: "destructive",
      });
    }
  };

  const formatSlotLabel = (slot: string) =>
    slot.charAt(0).toUpperCase() + slot.slice(1);

  const buildSlotOptions = (event: ParkingPassEvent) =>
    [
      {
        label: "Breakfast",
        type: "breakfast",
        priceCents: event.breakfastPriceCents,
      },
      {
        label: "Lunch",
        type: "lunch",
        priceCents: event.lunchPriceCents,
      },
      {
        label: "Dinner",
        type: "dinner",
        priceCents: event.dinnerPriceCents,
      },
      {
        label: "Daily",
        type: "daily",
        priceCents: event.dailyPriceCents,
      },
      {
        label: "Weekly",
        type: "weekly",
        priceCents: event.weeklyPriceCents,
      },
    ].filter((slot) => (slot.priceCents || 0) > 0);

  const getFeeCentsForSlots = (slotTypes: string[], slotTotalCents: number) => {
    if (!slotTypes.length || slotTotalCents <= 0) return 0;
    return slotTypes.includes("weekly") ? 7000 : 1000;
  };

  const getCartTotals = () => {
    return cartItems.reduce(
      (totals, item) => {
        const slotTotal = item.slotTypes.reduce((sum, slotType) => {
          const price =
            (slotType === "breakfast" && item.event.breakfastPriceCents) ||
            (slotType === "lunch" && item.event.lunchPriceCents) ||
            (slotType === "dinner" && item.event.dinnerPriceCents) ||
            (slotType === "daily" && item.event.dailyPriceCents) ||
            (slotType === "weekly" && item.event.weeklyPriceCents) ||
            0;
          return sum + price;
        }, 0);
        const fee = getFeeCentsForSlots(item.slotTypes, slotTotal);
        totals.hostCents += slotTotal;
        totals.feeCents += fee;
        totals.totalCents += slotTotal + fee;
        return totals;
      },
      { hostCents: 0, feeCents: 0, totalCents: 0 },
    );
  };

  const parseCoord = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return null;
    const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getEventCoords = (event?: ParkingPassEvent | null) => {
    if (!event?.host) return null;
    const lat = parseCoord(event.host.latitude);
    const lng = parseCoord(event.host.longitude);
    if (lat === null || lng === null) return null;
    return { lat, lng };
  };

  const handleSelect = (event: ParkingPassEvent, slotType: string) => {
    setSelectedSlotsByEvent((prev) => {
      const existing = prev[event.id] || [];
      const updated = existing.includes(slotType)
        ? existing.filter((type) => type !== slotType)
        : [...existing, slotType];
      return { ...prev, [event.id]: updated };
    });
  };

  const handleBookSelected = (event: ParkingPassEvent) => {
    const slotTypes = selectedSlotsByEvent[event.id] || [];
    if (slotTypes.length === 0) return;

    setCartItems((prev) => {
      const rest = prev.filter((item) => item.event.id !== event.id);
      return [...rest, { event, slotTypes }];
    });
  };

  const removeCartItem = (eventId: string) => {
    setCartItems((prev) => prev.filter((item) => item.event.id !== eventId));
  };

  const startCheckout = () => {
    if (cartItems.length === 0) return;
    const [first, ...rest] = cartItems;
    setCheckoutQueue(rest);
    setSelectedEvent(first.event);
    setSelectedSlotTypes(first.slotTypes);
    setPaymentOpen(true);
  };

  const handleSuccess = () => {
    if (selectedEvent) {
      removeCartItem(selectedEvent.id);
    }

    if (checkoutQueue.length > 0) {
      const [next, ...rest] = checkoutQueue;
      setCheckoutQueue(rest);
      setSelectedEvent(next.event);
      setSelectedSlotTypes(next.slotTypes);
      setPaymentOpen(true);
    } else {
      setPaymentOpen(false);
      setSelectedEvent(null);
      setSelectedSlotTypes([]);
    }

    toast({
      title: "Parking Pass Booked",
      description: "Your booking is confirmed.",
    });
  };

  const handleShareLocation = async () => {
    if (!truckId) {
      toast({
        title: "Missing truck",
        description: "Select a food truck before sharing location.",
        variant: "destructive",
      });
      return;
    }

    setIsSharingLocation(true);
    try {
      if (isLive) {
        await fetch(`/api/restaurants/${truckId}/mobile-settings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobileOnline: false }),
        });
        setIsLive(false);
        toast({ title: "You are offline" });
        return;
      }

      if (!navigator.geolocation) {
        throw new Error("Location services are not available.");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await fetch(`/api/restaurants/${truckId}/mobile-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileOnline: true }),
      });

      const locationRes = await fetch(`/api/restaurants/${truckId}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: "manual",
        }),
      });

      if (!locationRes.ok) {
        const data = await locationRes.json().catch(() => ({}));
        throw new Error(data.message || "Failed to share location");
      }

      setIsLive(true);
      toast({
        title: "Live location shared",
        description: "You are now visible on the map.",
      });
    } catch (error) {
      toast({
        title: "Location update failed",
        description:
          error instanceof Error ? error.message : "Unable to share location.",
        variant: "destructive",
      });
    } finally {
      setIsSharingLocation(false);
    }
  };

  const isFoodTruckUser = user?.userType === "food_truck";
  const showHostParkingPass = isAuthenticated && hasHostProfile;
  const normalizedCityQuery = cityQuery.trim().toLowerCase();
  const filteredEvents = events
    .filter((event) => {
      const eventDate = new Date(event.date).toISOString().split("T")[0];
      if (eventDate !== selectedDate) {
        return false;
      }
      if (!normalizedCityQuery) {
        return true;
      }
      const locationText = [
        event.host.city,
        event.host.state,
        event.host.address,
        event.host.businessName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return locationText.includes(normalizedCityQuery);
    })
    .sort((a, b) => {
      const cityA = (a.host.city || "").toLowerCase();
      const cityB = (b.host.city || "").toLowerCase();
      if (cityA && cityB && cityA !== cityB) {
        return cityA.localeCompare(cityB);
      }
      return a.host.businessName.localeCompare(b.host.businessName);
    });

  const activeEvent =
    filteredEvents.find((event) => event.id === activeEventId) ||
    filteredEvents[0] ||
    null;
  const activeEventBookings = Array.isArray(activeEvent?.bookings)
    ? activeEvent.bookings
    : [];
  const activeEventAvailability = activeEvent?.availableSpotNumbers
    ? activeEvent.availableSpotNumbers.length > 0
      ? `Open spots: ${activeEvent.availableSpotNumbers.join(", ")}`
      : "Fully booked"
    : activeEvent?.status
      ? activeEvent.status === "open"
        ? "Open"
        : "Closed"
      : null;
  const mapEvents = useMemo(
    () =>
      filteredEvents
        .map((event) => {
          const coords = getEventCoords(event);
          return coords ? { event, coords } : null;
        })
        .filter(
          (
            item,
          ): item is { event: ParkingPassEvent; coords: { lat: number; lng: number } } =>
            item !== null,
        ),
    [filteredEvents],
  );
  const mapCenter = useMemo(() => {
    const activeCoords = getEventCoords(activeEvent);
    return activeCoords || mapEvents[0]?.coords || null;
  }, [activeEvent, mapEvents]);

  useEffect(() => {
    if (!activeEvent) {
      setActiveEventId(null);
      return;
    }
    if (activeEventId && activeEventId === activeEvent.id) {
      return;
    }
    setActiveEventId(activeEvent.id);
  }, [activeEvent, activeEventId]);

  if (
    isAuthenticated &&
    user &&
    !["food_truck", "admin", "super_admin", "staff"].includes(user.userType)
  ) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Parking Pass is for food trucks only</h1>
        <p className="text-gray-600 mb-4 max-w-md">
          Restaurant and bar accounts can’t book parking pass slots. Switch to a food truck profile to access Parking Pass.
        </p>
        <Button onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parking Pass</h1>
          <p className="text-xs text-gray-500">
            Book available parking spots by day and time.
          </p>
        </div>
        {showHostParkingPass && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-900">
                Host parking pass listings
              </p>
              <p className="text-xs text-orange-700">
                Create and manage parking passes for your locations.
              </p>
            </div>
            <Button size="sm" onClick={() => setLocation("/host/dashboard")}>
              Open host dashboard
            </Button>
          </div>
        )}

        {isFoodTruckUser && (
          <Card className="rounded-2xl border border-gray-200 bg-white">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Live share
                  </p>
                  <p className="text-xs text-gray-500">
                    Share your live location in one tap.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleShareLocation}
                  disabled={isSharingLocation || !truckId}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  {isSharingLocation
                    ? "Working..."
                    : isLive
                      ? "Go offline"
                      : "Go live + share"}
                </Button>
              </div>
              {(truck?.instagramUrl || truck?.facebookPageUrl) && (
                <div className="flex flex-wrap gap-2">
                  {truck?.instagramUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(truck.instagramUrl, "_blank")}
                    >
                      Open Instagram
                    </Button>
                  )}
                  {truck?.facebookPageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(truck.facebookPageUrl, "_blank")
                      }
                    >
                      Open Facebook
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isFoodTruckUser && (
          <Card className="rounded-2xl border border-gray-200 bg-white">
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Your current schedule
                </p>
                <p className="text-xs text-gray-500">
                  Add non-MealScout stops to keep customers in the loop.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">
                  Booked parking pass schedule
                </p>
                {bookedSchedule.length > 0 ? (
                  <div className="space-y-2">
                    {bookedSchedule.map((entry) => (
                      <div
                        key={`${entry.event?.id || "booking"}-${
                          entry.slotType || "slot"
                        }`}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
                      >
                        <p className="font-semibold text-gray-900 text-sm">
                          {entry.event
                            ? `${format(new Date(entry.event.date), "EEE, MMM d")} • ${
                                entry.event.startTime
                              } - ${entry.event.endTime}`
                            : "Upcoming booking"}
                        </p>
                        <p>{entry.host?.businessName || "Host location"}</p>
                        {entry.slotType && (
                          <p className="text-[11px] text-gray-500">
                            Slot: {formatSlotLabel(entry.slotType)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    No confirmed parking pass bookings yet.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="schedule-date">Date</Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduleForm.date}
                    onChange={(event) =>
                      handleScheduleFieldChange("date", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-location">Location name</Label>
                  <Input
                    id="schedule-location"
                    placeholder="Downtown plaza"
                    value={scheduleForm.locationName}
                    onChange={(event) =>
                      handleScheduleFieldChange(
                        "locationName",
                        event.target.value,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-start">Start time</Label>
                  <Input
                    id="schedule-start"
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={(event) =>
                      handleScheduleFieldChange("startTime", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-end">End time</Label>
                  <Input
                    id="schedule-end"
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(event) =>
                      handleScheduleFieldChange("endTime", event.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-address">Address</Label>
                <Input
                  id="schedule-address"
                  placeholder="123 Main St, City"
                  value={scheduleForm.address}
                  onChange={(event) =>
                    handleScheduleFieldChange("address", event.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="schedule-city">City</Label>
                  <Input
                    id="schedule-city"
                    placeholder="City"
                    value={scheduleForm.city}
                    onChange={(event) =>
                      handleScheduleFieldChange("city", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-state">State</Label>
                  <Input
                    id="schedule-state"
                    placeholder="State"
                    value={scheduleForm.state}
                    onChange={(event) =>
                      handleScheduleFieldChange("state", event.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-notes">Notes</Label>
                <Textarea
                  id="schedule-notes"
                  placeholder="Optional notes for this stop."
                  value={scheduleForm.notes}
                  onChange={(event) =>
                    handleScheduleFieldChange("notes", event.target.value)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={scheduleForm.isPublic}
                    onChange={(event) =>
                      handleScheduleFieldChange("isPublic", event.target.checked)
                    }
                  />
                  Show on public profile
                </label>
                <Button
                  size="sm"
                  onClick={handleCreateSchedule}
                  disabled={isSavingSchedule}
                >
                  {isSavingSchedule ? "Saving..." : "Add stop"}
                </Button>
              </div>
              {manualSchedules.length > 0 && (
                <div className="space-y-2">
                  {manualSchedules.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {new Date(entry.date).toLocaleDateString()} -{" "}
                            {entry.startTime} - {entry.endTime}
                          </p>
                          <p>
                            {entry.locationName ? `${entry.locationName} - ` : ""}
                            {entry.address}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSchedule(entry.id)}
                          aria-label="Remove schedule entry"
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Find parking pass spots
              </p>
              <p className="text-xs text-gray-500">
                Search by date, city, or address.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewMode === "map" ? "default" : "outline"}
                onClick={() => setViewMode("map")}
              >
                Map view
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
              >
                List view
              </Button>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
            <div className="space-y-4 order-1 lg:order-none">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-700">
                  Pick a day to book
                </p>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  placeholder="Search city or address"
                  value={cityQuery}
                  onChange={(event) => setCityQuery(event.target.value)}
                />
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  <p className="text-sm text-gray-600">
                    Loading parking pass spots...
                  </p>
                </div>
              ) : events.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                  No parking pass spots are available right now.
                </div>
              ) : viewMode === "map" ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                    <div className="h-72 w-full bg-gray-100">
                      {mapCenter ? (
                        <MapContainer
                          center={[mapCenter.lat, mapCenter.lng]}
                          zoom={13}
                          scrollWheelZoom
                          className="h-full w-full"
                        >
                          <MapCenterer center={mapCenter} />
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                          />
                          {mapEvents.map(({ event, coords }) => {
                            const bookings = Array.isArray(event.bookings)
                              ? event.bookings
                              : [];
                            const availability = event.availableSpotNumbers
                              ? event.availableSpotNumbers.length > 0
                                ? `Open spots: ${event.availableSpotNumbers.join(
                                    ", ",
                                  )}`
                                : "Fully booked"
                              : event.status === "open"
                                ? "Open"
                                : "Closed";

                            return (
                              <Marker
                                key={event.id}
                                position={[coords.lat, coords.lng]}
                                icon={parkingPassPinIcon}
                                eventHandlers={{
                                  click: () => setActiveEventId(event.id),
                                }}
                              >
                                <Popup>
                                  <div className="space-y-1 text-xs">
                                    <p className="font-semibold text-gray-900">
                                      {event.host.businessName}
                                    </p>
                                    <p className="text-gray-600">
                                      {event.host.address}
                                    </p>
                                    <p className="text-gray-600">
                                      {format(
                                        new Date(event.date),
                                        "EEE, MMM d",
                                      )}{" "}
                                      •{" "}
                                      {event.startTime === "00:00" &&
                                      event.endTime === "23:59"
                                        ? "Any time"
                                        : `${event.startTime} - ${event.endTime}`}
                                    </p>
                                    <p className="text-gray-600">
                                      {availability}
                                    </p>
                                    {bookings.length > 0 ? (
                                      <div className="pt-1 text-[11px] text-gray-500 space-y-1">
                                        {bookings
                                          .slice(0, 3)
                                          .map((booking) => (
                                            <div key={`${booking.truckId}-${booking.slotType || "slot"}`}>
                                              {booking.truckName}
                                              {booking.slotType
                                                ? ` • ${formatSlotLabel(
                                                    booking.slotType,
                                                  )}`
                                                : ""}
                                            </div>
                                          ))}
                                        {bookings.length > 3 && (
                                          <div>
                                            +{bookings.length - 3} more
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="pt-1 text-[11px] text-gray-500">
                                        No bookings yet
                                      </p>
                                    )}
                                  </div>
                                </Popup>
                              </Marker>
                            );
                          })}
                        </MapContainer>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
                          No mappable locations yet.
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
                      Tap a location below to update the map.
                    </div>
                  </div>
                  <div className="space-y-2">
                    {filteredEvents.map((event) => {
                      const slotOptions = buildSlotOptions(event);
                      const selectedSlots = selectedSlotsByEvent[event.id] || [];
                      const selectedTotalCents = selectedSlots.reduce(
                        (sum, slot) => {
                          const price =
                            slotOptions.find((item) => item.type === slot)
                              ?.priceCents || 0;
                          return sum + price;
                        },
                        0,
                      );
                      const selectedFeeCents = getFeeCentsForSlots(
                        selectedSlots,
                        selectedTotalCents,
                      );
                      const selectedTotalWithFee =
                        selectedTotalCents > 0
                          ? selectedTotalCents + selectedFeeCents
                          : 0;
                      const availableSpots = event.availableSpotNumbers;
                      const hasAvailability =
                        availableSpots === undefined
                          ? event.status === "open"
                          : availableSpots.length > 0;
                      const bookings = Array.isArray(event.bookings)
                        ? event.bookings
                        : [];

                      return (
                        <div
                          key={event.id}
                          role="button"
                          tabIndex={0}
                          aria-pressed={activeEvent?.id === event.id}
                          onClick={() => setActiveEventId(event.id)}
                          onKeyDown={(keyboardEvent) => {
                            if (
                              keyboardEvent.key === "Enter" ||
                              keyboardEvent.key === " "
                            ) {
                              keyboardEvent.preventDefault();
                              setActiveEventId(event.id);
                            }
                          }}
                          className={`w-full rounded-xl border px-4 py-3 space-y-2 transition cursor-pointer ${
                            activeEvent?.id === event.id
                              ? "border-orange-300 bg-orange-50"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-gray-900">
                                {event.host.businessName}
                              </span>
                              <div className="text-xs text-gray-500">
                                {format(new Date(event.date), "EEE, MMM d")}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveEventId(event.id)}
                            >
                              View
                            </Button>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>{event.host.address}</p>
                            <p>
                              {event.startTime === "00:00" &&
                              event.endTime === "23:59"
                                ? "Any time"
                                : `${event.startTime} - ${event.endTime}`}
                            </p>
                            {event.availableSpotNumbers && (
                              <p className="text-[11px] text-gray-500">
                                {event.availableSpotNumbers.length > 0
                                  ? `Open spot${event.availableSpotNumbers.length > 1 ? "s" : ""}: ${event.availableSpotNumbers.join(", ")}`
                                  : "Fully booked"}
                              </p>
                            )}
                            {bookings.length > 0 ? (
                              <div className="text-[11px] text-gray-500">
                                Booked trucks:{" "}
                                {bookings
                                  .slice(0, 2)
                                  .map((booking) => booking.truckName)
                                  .join(", ")}
                                {bookings.length > 2
                                  ? ` +${bookings.length - 2} more`
                                  : ""}
                              </div>
                            ) : (
                              <div className="text-[11px] text-gray-500">
                                No bookings yet
                              </div>
                            )}
                          </div>
                          <div>
                            <ShareButton
                              url={`/parking-pass?date=${encodeURIComponent(
                                event.date?.split("T")[0] || selectedDate,
                              )}&pass=${event.id}`}
                              title={`Parking Pass at ${event.host.businessName}`}
                              description={`${event.host.address}${
                                event.host.city ? `, ${event.host.city}` : ""
                              }${event.host.state ? `, ${event.host.state}` : ""}`}
                              size="sm"
                              variant="outline"
                            />
                          </div>
                          {slotOptions.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              {slotOptions.map((slot) => {
                                const feeCents =
                                  slot.type === "weekly" ? 7000 : 1000;
                                const totalPrice =
                                  ((slot.priceCents || 0) + feeCents) / 100;
                                const isSelected = selectedSlots.includes(
                                  slot.type,
                                );
                                return (
                                  <Button
                                    key={slot.type}
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    className="justify-between"
                                    disabled={!hasAvailability}
                                    onClick={() => handleSelect(event, slot.type)}
                                  >
                                    <span>{slot.label}</span>
                                    <span>${totalPrice.toFixed(2)}</span>
                                  </Button>
                                );
                              })}
                            </div>
                          )}
                          {hasAvailability ? (
                            <div className="flex items-center justify-between gap-3 pt-2">
                              <p className="text-[11px] text-gray-500">
                                Includes a $10/day MealScout fee per host.
                              </p>
                              <Button
                                size="sm"
                                onClick={() => handleBookSelected(event)}
                                disabled={selectedSlots.length === 0}
                              >
                                Add to cart
                                {selectedTotalWithFee > 0 && (
                                  <span className="ml-2 text-xs">
                                    ${(
                                      (selectedTotalWithFee || 0) / 100
                                    ).toFixed(2)}
                                  </span>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-500">
                              Fully booked.
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {filteredEvents.length === 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                        No spots are available for that day.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event) => {
                    const slotOptions = buildSlotOptions(event);

                    const selectedSlots =
                      selectedSlotsByEvent[event.id] || [];
                    const selectedTotalCents = selectedSlots.reduce(
                      (sum, slot) => {
                        const price =
                          slotOptions.find((item) => item.type === slot)
                            ?.priceCents || 0;
                        return sum + price;
                      },
                      0,
                    );
                    const selectedFeeCents = getFeeCentsForSlots(
                      selectedSlots,
                      selectedTotalCents,
                    );
                    const selectedTotalWithFee =
                      selectedTotalCents > 0
                        ? selectedTotalCents + selectedFeeCents
                        : 0;

                    const availableSpots = event.availableSpotNumbers;
                    const hasAvailability =
                      availableSpots === undefined
                        ? event.status === "open"
                        : availableSpots.length > 0;

                    return (
                      <div
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={activeEvent?.id === event.id}
                        onClick={() => setActiveEventId(event.id)}
                        onKeyDown={(keyboardEvent) => {
                          if (
                            keyboardEvent.key === "Enter" ||
                            keyboardEvent.key === " "
                          ) {
                            keyboardEvent.preventDefault();
                            setActiveEventId(event.id);
                          }
                        }}
                        className={`w-full text-left rounded-xl border px-4 py-3 space-y-2 transition cursor-pointer ${
                          activeEvent?.id === event.id
                            ? "border-orange-300 bg-orange-50"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">
                            {event.host.businessName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(event.date), "EEE, MMM d")}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p>{event.host.address}</p>
                          <p>
                            {event.startTime === "00:00" &&
                            event.endTime === "23:59"
                              ? "Any time"
                              : `${event.startTime} - ${event.endTime}`}
                          </p>
                          {availableSpots && (
                            <p className="text-[11px] text-gray-500">
                              {availableSpots.length > 0
                                ? `Open spot${availableSpots.length > 1 ? "s" : ""}: ${availableSpots.join(", ")}`
                                : "Fully booked"}
                            </p>
                          )}
                        </div>
                        <div>
                          <ShareButton
                            url={`/parking-pass?date=${encodeURIComponent(
                              event.date?.split("T")[0] || selectedDate,
                            )}&pass=${event.id}`}
                            title={`Parking Pass at ${event.host.businessName}`}
                            description={`${event.host.address}${
                              event.host.city ? `, ${event.host.city}` : ""
                            }${event.host.state ? `, ${event.host.state}` : ""}`}
                            size="sm"
                            variant="outline"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {slotOptions.map((slot) => {
                            const feeCents =
                              slot.type === "weekly" ? 7000 : 1000;
                            const totalPrice =
                              ((slot.priceCents || 0) + feeCents) / 100;
                            const isSelected = selectedSlots.includes(
                              slot.type,
                            );
                            return (
                              <Button
                                key={slot.type}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className="justify-between"
                                disabled={!hasAvailability}
                                onClick={() => handleSelect(event, slot.type)}
                              >
                                <span>{slot.label}</span>
                                <span>${totalPrice.toFixed(2)}</span>
                              </Button>
                            );
                          })}
                        </div>
                        {hasAvailability ? (
                          <div className="flex items-center justify-between gap-3 pt-2">
                            <p className="text-[11px] text-gray-500">
                              Includes a $10/day MealScout fee per host.
                            </p>
                            <Button
                              size="sm"
                              onClick={() => handleBookSelected(event)}
                              disabled={selectedSlots.length === 0}
                            >
                              Add to cart
                              {selectedTotalWithFee > 0 && (
                                <span className="ml-2 text-xs">
                                  ${(
                                    (selectedTotalWithFee || 0) / 100
                                  ).toFixed(2)}
                                </span>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-500">
                            Fully booked.
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {filteredEvents.length === 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                      No spots are available for that day.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 order-2 lg:order-none">
              {cartItems.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Booking cart
                      </p>
                      <p className="text-xs text-gray-500">
                        Separate charges per host.
                      </p>
                    </div>
                    <Button size="sm" onClick={startCheckout}>
                      Checkout {cartItems.length}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.event.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
                      >
                        <div className="flex items-center justify-between text-sm text-gray-900">
                          <span>{item.event.host.businessName}</span>
                          <button
                            type="button"
                            className="text-xs text-gray-500 underline"
                            onClick={() => removeCartItem(item.event.id)}
                          >
                            remove
                          </button>
                        </div>
                        <p>
                          {format(new Date(item.event.date), "EEE, MMM d")} -{" "}
                          {item.slotTypes.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const totals = getCartTotals();
                    if (!totals.totalCents) return null;
                    return (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Host total</span>
                          <span>${(totals.hostCents / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>MealScout fee</span>
                          <span>${(totals.feeCents / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between font-semibold text-gray-900">
                          <span>Total</span>
                          <span>${(totals.totalCents / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <Card className="rounded-2xl border border-gray-200 bg-white">
                <CardContent className="p-5 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {activeEvent?.host.businessName || "Select a location"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activeEvent?.host.address || "Choose a spot to see details."}
                    </p>
                  </div>
                  {activeEvent && (
                    <>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                          {activeEvent.host.locationType || "Location"}
                        </span>
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                          Foot traffic:{" "}
                          {activeEvent.host.expectedFootTraffic || "Not shared"}
                        </span>
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                          {activeEvent.startTime === "00:00" &&
                          activeEvent.endTime === "23:59"
                            ? "Any time"
                            : `${activeEvent.startTime} - ${activeEvent.endTime}`}
                        </span>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 space-y-2">
                        <p className="text-[11px] font-semibold text-gray-700">
                          Schedule
                        </p>
                        <div className="flex items-center justify-between">
                          <span>Date</span>
                          <span>
                            {format(new Date(activeEvent.date), "EEE, MMM d")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Time</span>
                          <span>
                            {activeEvent.startTime === "00:00" &&
                            activeEvent.endTime === "23:59"
                              ? "Any time"
                              : `${activeEvent.startTime} - ${activeEvent.endTime}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Status</span>
                          <span className="capitalize">{activeEvent.status}</span>
                        </div>
                        {activeEventAvailability && (
                          <div className="flex items-center justify-between">
                            <span>Availability</span>
                            <span>{activeEventAvailability}</span>
                          </div>
                        )}
                      </div>
                      {activeEventBookings.length > 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 space-y-2">
                          <p className="text-[11px] font-semibold text-gray-700">
                            Booked trucks
                          </p>
                          <div className="space-y-1">
                            {activeEventBookings.slice(0, 5).map((booking) => (
                              <div
                                key={`${booking.truckId}-${booking.slotType || "slot"}`}
                                className="flex items-center justify-between"
                              >
                                <span>{booking.truckName}</span>
                                <span className="text-[11px] text-gray-500">
                                  {booking.slotType
                                    ? formatSlotLabel(booking.slotType)
                                    : "Booked"}
                                  {booking.spotNumber
                                    ? ` • Spot ${booking.spotNumber}`
                                    : ""}
                                </span>
                              </div>
                            ))}
                            {activeEventBookings.length > 5 && (
                              <div className="text-[11px] text-gray-500">
                                +{activeEventBookings.length - 5} more
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-500">
                          No bookings yet.
                        </p>
                      )}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-700">
                          Slot pricing
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {
                              label: "Breakfast",
                              type: "breakfast",
                              priceCents: activeEvent.breakfastPriceCents,
                            },
                            {
                              label: "Lunch",
                              type: "lunch",
                              priceCents: activeEvent.lunchPriceCents,
                            },
                            {
                              label: "Dinner",
                              type: "dinner",
                              priceCents: activeEvent.dinnerPriceCents,
                            },
                            {
                              label: "Daily",
                              type: "daily",
                              priceCents: activeEvent.dailyPriceCents,
                            },
                            {
                              label: "Weekly",
                              type: "weekly",
                              priceCents: activeEvent.weeklyPriceCents,
                            },
                          ]
                            .filter((slot) => (slot.priceCents || 0) > 0)
                            .map((slot) => {
                              const feeCents =
                                slot.type === "weekly" ? 7000 : 1000;
                              const totalPrice =
                                ((slot.priceCents || 0) + feeCents) / 100;
                              const selectedSlots =
                                selectedSlotsByEvent[activeEvent.id] || [];
                              const isSelected = selectedSlots.includes(
                                slot.type,
                              );
                              return (
                                <Button
                                  key={slot.type}
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  className="justify-between"
                                  disabled={activeEvent.status !== "open"}
                                  onClick={() =>
                                    handleSelect(activeEvent, slot.type)
                                  }
                                >
                                  <span>{slot.label}</span>
                                  <span>${totalPrice.toFixed(2)}</span>
                                </Button>
                              );
                            })}
                        </div>
                      </div>
                      {activeEvent.status === "open" && (
                        <div className="flex items-center justify-between gap-3 pt-2">
                          <p className="text-[11px] text-gray-500">
                            Includes a $10/day MealScout fee per host.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleBookSelected(activeEvent)}
                            disabled={
                              (selectedSlotsByEvent[activeEvent.id] || [])
                                .length === 0
                            }
                          >
                            Add to cart
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && truckId && selectedSlotTypes.length > 0 && (
        <BookingPaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          passId={selectedEvent.id}
          truckId={truckId}
          slotTypes={selectedSlotTypes}
          eventDetails={{
            name: "Parking Pass",
            date: format(new Date(selectedEvent.date), "MMMM d, yyyy"),
            startTime: selectedEvent.startTime,
            endTime: selectedEvent.endTime,
            hostName: selectedEvent.host.businessName,
            hostPrice: selectedEvent.hostPriceCents,
            slotSummary: selectedSlotTypes.map(formatSlotLabel).join(", "),
          }}
          onSuccess={() => {
            if (selectedEvent) {
              removeCartItem(selectedEvent.id);
            }
            handleSuccess();
          }}
        />
      )}
    </div>
  );
}

