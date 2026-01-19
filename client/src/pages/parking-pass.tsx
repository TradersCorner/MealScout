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
  const [selectedSlotType, setSelectedSlotType] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

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
    setSelectedEvent(event);
    setSelectedSlotType(slotType);
    setPaymentOpen(true);
  };

  const handleSuccess = () => {
    setSelectedEvent(null);
    setSelectedSlotType(null);
    setPaymentOpen(false);
    toast({
      title: "Parking Pass Booked",
      description: "Your parking spot is reserved.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-3 py-6">
      <Card className="w-full max-w-md rounded-3xl shadow-xl border border-gray-200 bg-white">
        <CardContent className="p-5 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parking Pass</h1>
            <p className="text-xs text-gray-500">
              Paid parking spots for food trucks.
            </p>
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
              No paid parking pass spots are available right now.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
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
                        {event.startTime} - {event.endTime}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {slotOptions.map((slot) => {
                        const totalPrice =
                          ((slot.priceCents || 0) + 1000) / 100;
                        return (
                          <Button
                            key={slot.type}
                            variant="outline"
                            size="sm"
                            className="justify-between"
                            onClick={() => handleSelect(event, slot.type)}
                          >
                            <span>{slot.label}</span>
                            <span>${totalPrice.toFixed(2)}</span>
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Prices include the $10 MealScout fee.
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEvent && truckId && selectedSlotType && (
        <BookingPaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          eventId={selectedEvent.id}
          truckId={truckId}
          slotType={selectedSlotType}
          eventDetails={{
            name: "Parking Pass",
            date: format(new Date(selectedEvent.date), "MMMM d, yyyy"),
            startTime: selectedEvent.startTime,
            endTime: selectedEvent.endTime,
            hostName: selectedEvent.host.businessName,
            hostPrice: selectedEvent.hostPriceCents,
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
