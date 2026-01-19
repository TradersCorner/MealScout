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

  const handleSelect = (event: ParkingPassEvent) => {
    if (!truckId) {
      toast({
        title: "Truck Profile Required",
        description: "You need a truck profile to book parking spots.",
        variant: "destructive",
      });
      return;
    }
    setSelectedEvent(event);
    setPaymentOpen(true);
  };

  const handleSuccess = () => {
    setSelectedEvent(null);
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
                const totalPrice =
                  ((event.hostPriceCents || 0) + 1000) / 100;
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => handleSelect(event)}
                    className="w-full text-left rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">
                        {event.host.businessName}
                      </span>
                      <span className="font-semibold text-orange-600">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>{event.host.address}</p>
                      <p>
                        {format(new Date(event.date), "EEEE, MMM d")} -{" "}
                        {event.startTime} - {event.endTime}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Includes $10 MealScout fee
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEvent && truckId && (
        <BookingPaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          eventId={selectedEvent.id}
          truckId={truckId}
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
