import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { BookingPaymentModal } from "@/components/booking-payment-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Host {
  id: string;
  businessName: string;
  address: string;
  locationType: string;
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

export default function ParkingPassPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<ParkingPassEvent[]>([]);
  const [truckId, setTruckId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ParkingPassEvent | null>(
    null,
  );
  const [selectedSlotTypes, setSelectedSlotTypes] = useState<string[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().split("T")[0],
  );
  const [selectedSlotsByEvent, setSelectedSlotsByEvent] = useState<
    Record<string, string[]>
  >({});
  const [cartItems, setCartItems] = useState<
    Array<{ event: ParkingPassEvent; slotTypes: string[] }>
  >([]);
  const [checkoutQueue, setCheckoutQueue] = useState<
    Array<{ event: ParkingPassEvent; slotTypes: string[] }>
  >([]);

  useEffect(() => {
    setSelectedSlotsByEvent({});
  }, [selectedDate]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login?redirect=/parking-pass");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const truckRes = await fetch("/api/restaurants/my");
        if (truckRes.ok) {
          const trucks = await truckRes.json();
          if (!cancelled && Array.isArray(trucks) && trucks[0]) {
            setTruckId(trucks[0].id);
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

  const handleSelect = (event: ParkingPassEvent, slotType: string) => {
    if (!truckId) {
      toast({
        title: "Truck Profile Required",
        description: "You need a truck profile to book parking spots.",
        variant: "destructive",
      });
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
              {events
                .filter(
                  (event) =>
                    new Date(event.date).toISOString().split("T")[0] ===
                    selectedDate,
                )
                .map((event) => {
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
              {events.filter(
                (event) =>
                  new Date(event.date).toISOString().split("T")[0] ===
                  selectedDate,
              ).length === 0 && (
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
