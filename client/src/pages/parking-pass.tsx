import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2, Share2, Trash2 } from "lucide-react";
import { BookingPaymentModal } from "@/components/booking-payment-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Host {
  id: string;
  businessName: string;
  address: string;
  locationType: string;
  city?: string | null;
  state?: string | null;
}

interface ParkingPassEvent {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  requiresPayment?: boolean;
  hostPriceCents?: number;
  breakfastPriceCents?: number | null;
  lunchPriceCents?: number | null;
  dinnerPriceCents?: number | null;
  dailyPriceCents?: number | null;
  weeklyPriceCents?: number | null;
  host: Host;
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
      } catch (error: any) {
        if (!cancelled) {
          toast({
            title: "Schedule Error",
            description: error.message || "Failed to load your schedule.",
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
    setIsLive(!!truck?.mobileOnline);
  }, [truck?.mobileOnline]);

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
    if (!truckId) return;
    if (!scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime) {
      toast({
        title: "Missing details",
        description: "Date, start time, and end time are required.",
        variant: "destructive",
      });
      return;
    }
    if (!scheduleForm.address) {
      toast({
        title: "Missing address",
        description: "Add the address where you will park.",
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
        throw new Error("Failed to save schedule entry");
      }
      const created = await res.json();
      setManualSchedules((current) => [created, ...current]);
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
        title: "Schedule updated",
        description: "Your parking time is now live on your profile.",
      });
    } catch (error: any) {
      toast({
        title: "Schedule Error",
        description: error.message || "Failed to save schedule entry.",
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
        throw new Error("Failed to delete schedule entry");
      }
      setManualSchedules((current) =>
        current.filter((entry) => entry.id !== scheduleId),
      );
      toast({
        title: "Schedule entry removed",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete schedule entry.",
        variant: "destructive",
      });
    }
  };

  const getDeviceId = () => {
    const key = "mealscout_device_id";
    let deviceId = window.localStorage.getItem(key);
    if (!deviceId) {
      deviceId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `device_${Date.now()}`;
      window.localStorage.setItem(key, deviceId);
    }
    return deviceId;
  };

  const handleShareLocation = () => {
    if (!truckId) return;
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Available",
        description: "Your device does not support GPS location.",
        variant: "destructive",
      });
      return;
    }

    setIsSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          if (isLive) {
            await fetch(`/api/restaurants/${truckId}/truck-session/end`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
            setIsLive(false);
            setTruck((current: any) =>
              current ? { ...current, mobileOnline: false } : current,
            );
            toast({
              title: "Location sharing paused",
              description: "You are now hidden from the map and feed.",
            });
            return;
          }

          const locationPayload = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          await fetch(`/api/restaurants/${truckId}/location`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(locationPayload),
          });
          await fetch(`/api/restaurants/${truckId}/truck-session/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId: getDeviceId() }),
          });

          setIsLive(true);
          setTruck((current: any) =>
            current
              ? {
                  ...current,
                  mobileOnline: true,
                  currentLatitude: position.coords.latitude,
                  currentLongitude: position.coords.longitude,
                }
              : current,
          );

          const profileUrl = `${window.location.origin}/restaurants/${truckId}`;
          const shareText = `We are live now on MealScout. Find us here: ${profileUrl}`;

          if (navigator.share) {
            await navigator.share({
              title: truck?.name || "MealScout",
              text: shareText,
              url: profileUrl,
            });
          } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            toast({
              title: "Link copied",
              description: "Paste it to share your live location.",
            });
          } else {
            toast({
              title: "Share not available",
              description: "Copy this link: " + profileUrl,
            });
          }
        } catch (error: any) {
          toast({
            title: "Share failed",
            description: error.message || "Unable to share your location.",
            variant: "destructive",
          });
        } finally {
          setIsSharingLocation(false);
        }
      },
      (error) => {
        setIsSharingLocation(false);
        toast({
          title: "Location Error",
          description:
            error.message || "Unable to get your current location.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const getDistanceKm = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!isLive || !truckId) return;
    const storedLat = Number(truck?.currentLatitude || 0);
    const storedLng = Number(truck?.currentLongitude || 0);
    if (!storedLat || !storedLng || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const distanceKm = getDistanceKm(
          storedLat,
          storedLng,
          position.coords.latitude,
          position.coords.longitude,
        );
        if (distanceKm < 0.2) return;

        const update = window.confirm(
          "You have moved since your last check-in. Update your location now?",
        );
        if (update) {
          await fetch(`/api/restaurants/${truckId}/location`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });
          setTruck((current: any) =>
            current
              ? {
                  ...current,
                  currentLatitude: position.coords.latitude,
                  currentLongitude: position.coords.longitude,
                }
              : current,
          );
          toast({
            title: "Location updated",
            description: "Your live location is refreshed.",
          });
          return;
        }

        const stayLive = window.confirm(
          "Stay live without updating your location?",
        );
        if (stayLive) {
          toast({
            title: "Staying live",
            description: "Location unchanged. You are still visible.",
          });
          return;
        }

        {
          await fetch(`/api/restaurants/${truckId}/truck-session/end`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          setIsLive(false);
          setTruck((current: any) =>
            current ? { ...current, mobileOnline: false } : current,
          );
          toast({
            title: "Visibility paused",
            description: "You are hidden until you share again.",
          });
        }
      },
      () => {
        // If we cannot access GPS, do not interrupt the flow.
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, [isLive, truckId, truck?.currentLatitude, truck?.currentLongitude, toast]);

  const handleSelect = (event: ParkingPassEvent, slotType: string) => {
    if (!truckId) {
      toast({
        title: "Truck Profile Required",
        description: "You need a truck profile to book parking spots.",
        variant: "destructive",
      });
      if (!isAuthenticated) {
        setLocation("/login?redirect=/parking-pass");
      }
      return;
    }
    setSelectedSlotsByEvent((current) => {
      const existing = current[event.id] || [];
      const isDailyOrWeekly = slotType === "daily" || slotType === "weekly";
      const hasDailyOrWeekly = existing.some(
        (slot) => slot === "daily" || slot === "weekly",
      );
      if (isDailyOrWeekly) {
        return { ...current, [event.id]: [slotType] };
      }
      const next = existing.includes(slotType)
        ? existing.filter((slot) => slot !== slotType)
        : [...existing, slotType];
      if (hasDailyOrWeekly) {
        return {
          ...current,
          [event.id]: next.filter(
            (slot) => slot !== "daily" && slot !== "weekly",
          ),
        };
      }
      return { ...current, [event.id]: next };
    });
  };

  const handleBookSelected = (event: ParkingPassEvent) => {
    const slots = selectedSlotsByEvent[event.id] || [];
    if (!slots.length) {
      return;
    }
    setCartItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.event.id === event.id,
      );
      if (existingIndex === -1) {
        return [...current, { event, slotTypes: slots }];
      }
      const next = [...current];
      next[existingIndex] = { event, slotTypes: slots };
      return next;
    });
    setSelectedSlotsByEvent((current) => ({ ...current, [event.id]: [] }));
  };

  const handleSuccess = () => {
    setSelectedEvent(null);
    setSelectedSlotTypes([]);
    setPaymentOpen(false);
    setSelectedSlotsByEvent({});
    setCheckoutQueue((current) => current.slice(1));
    toast({
      title: "Parking Pass Booked",
      description: "Your parking spot is reserved.",
    });
  };

  const startCheckout = () => {
    if (cartItems.length === 0) return;
    setCheckoutQueue(cartItems);
    const nextItem = cartItems[0];
    setSelectedEvent(nextItem.event);
    setSelectedSlotTypes(nextItem.slotTypes);
    setPaymentOpen(true);
  };

  useEffect(() => {
    if (!checkoutQueue.length) return;
    const currentItem = checkoutQueue[0];
    setSelectedEvent(currentItem.event);
    setSelectedSlotTypes(currentItem.slotTypes);
    setPaymentOpen(true);
  }, [checkoutQueue]);

  const removeCartItem = (eventId: string) => {
    setCartItems((current) =>
      current.filter((item) => item.event.id !== eventId),
    );
  };

  const getFeeCentsForSlots = (slots: string[], slotTotalCents: number) => {
    if (!slots.length) return 0;
    if (slots.includes("weekly")) return 7000;
    return slotTotalCents > 0 ? 1000 : 0;
  };

  const getCartTotals = () => {
    return cartItems.reduce(
      (totals, item) => {
        const slotMap: Record<string, number> = {
          breakfast: item.event.breakfastPriceCents || 0,
          lunch: item.event.lunchPriceCents || 0,
          dinner: item.event.dinnerPriceCents || 0,
          daily: item.event.dailyPriceCents || 0,
          weekly: item.event.weeklyPriceCents || 0,
        };
        const slotTotal = item.slotTypes.reduce(
          (sum, slot) => sum + (slotMap[slot] || 0),
          0,
        );
        const fee = getFeeCentsForSlots(item.slotTypes, slotTotal);
        totals.hostCents += slotTotal;
        totals.feeCents += fee;
        totals.totalCents += slotTotal + fee;
        return totals;
      },
      { hostCents: 0, feeCents: 0, totalCents: 0 },
    );
  };

  const formatSlotLabel = (slot: string) =>
    slot.charAt(0).toUpperCase() + slot.slice(1);

  const isFoodTruckUser = user?.userType === "food_truck";
  const canManageParkingPass =
    isAuthenticated && (hasHostProfile || !!truckId);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-3 py-6">
      <Card className="w-full max-w-md rounded-3xl shadow-xl border border-gray-200 bg-white">
        <CardContent className="p-5 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parking Pass</h1>
              <p className="text-xs text-gray-500">
                Book available parking spots by day and time.
              </p>
          </div>
          {canManageParkingPass && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-900">
                  Manage your parking pass bookings
                </p>
                <p className="text-xs text-orange-700">
                  Hosts and trucks can review bookings and confirmations.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setLocation("/parking-pass-manage")}
              >
                Open manager
              </Button>
            </div>
          )}
          {isFoodTruckUser && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Your schedule + live share
                  </p>
                  <p className="text-xs text-gray-500">
                    Add non-MealScout stops and share your live location in one tap.
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
                      handleScheduleFieldChange("locationName", event.target.value)
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
                <Button size="sm" onClick={handleCreateSchedule} disabled={isSavingSchedule}>
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
            </div>
          )}
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

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <p className="text-sm text-gray-600">
                Loading parking pass spots...
              </p>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
              No paid parking pass spots are available right now.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const slotOptions: Array<{
                  label: string;
                  type: string;
                  priceCents?: number | null;
                }> = [
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

                const selectedSlots = selectedSlotsByEvent[event.id] || [];
                const selectedTotalCents = selectedSlots.reduce((sum, slot) => {
                  const price =
                    slotOptions.find((item) => item.type === slot)
                      ?.priceCents || 0;
                  return sum + price;
                }, 0);
                const selectedFeeCents = getFeeCentsForSlots(
                  selectedSlots,
                  selectedTotalCents,
                );
                const selectedTotalWithFee =
                  selectedTotalCents > 0
                    ? selectedTotalCents + selectedFeeCents
                    : 0;

                return (
                  <div
                    key={event.id}
                    className="w-full text-left rounded-xl border border-gray-200 bg-white px-4 py-3 space-y-2"
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
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {slotOptions.map((slot) => {
                        const feeCents =
                          slot.type === "weekly" ? 7000 : 1000;
                        const totalPrice =
                          ((slot.priceCents || 0) + feeCents) / 100;
                        const isSelected = selectedSlots.includes(slot.type);
                        return (
                          <Button
                            key={slot.type}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="justify-between"
                            disabled={event.status !== "open"}
                            onClick={() => handleSelect(event, slot.type)}
                          >
                            <span>{slot.label}</span>
                            <span>${totalPrice.toFixed(2)}</span>
                          </Button>
                        );
                      })}
                    </div>
                    {event.status === "open" ? (
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
                              ${((selectedTotalWithFee || 0) / 100).toFixed(2)}
                            </span>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-500">Fully booked.</p>
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
        </CardContent>
      </Card>

      {selectedEvent && truckId && selectedSlotTypes.length > 0 && (
        <BookingPaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          eventId={selectedEvent.id}
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
