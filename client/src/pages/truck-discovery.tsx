import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock, MapPin, Truck, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Host {
  id: string;
  businessName: string;
  address: string;
  locationType: string;
}

interface Event {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxTrucks: number;
  status: string;
  host: Host;
}

function TruckDiscovery() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) {
          if (res.status === 401) {
            setLocation("/login?redirect=/truck-discovery");
            return;
          }
          throw new Error("Failed to fetch events");
        }
        const data = await res.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [setLocation]);

  const handleExpressInterest = async (eventId: string) => {
    if (!user?.restaurantId) {
      toast({
        title: "Restaurant Profile Required",
        description: "You must have a restaurant profile to express interest.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/interests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: user.restaurantId,
          message: "I'm interested in this event!",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit interest");
      }

      setInterestedEvents((prev) => new Set(prev).add(eventId));
      toast({
        title: "Interest Sent",
        description: "The host can now contact you directly.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Hosting Opportunities</h1>
        <p className="text-slate-600">Discover local businesses looking for food trucks. Express interest to get connected.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg mb-6">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Truck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No upcoming events found</h3>
          <p className="text-slate-500">Check back later for new hosting opportunities.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{event.host.businessName}</h3>
                    <div className="flex items-center text-slate-500 text-sm mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="line-clamp-1">{event.host.address}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 capitalize">
                    {event.host.locationType}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-slate-700">
                    <Calendar className="h-4 w-4 mr-2 text-rose-500" />
                    <span className="font-medium">{format(new Date(event.date), 'EEEE, MMMM d')}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <Clock className="h-4 w-4 mr-2 text-rose-500" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <Truck className="h-4 w-4 mr-2 text-rose-500" />
                    <span>Capacity: {event.maxTrucks} truck{event.maxTrucks !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => handleExpressInterest(event.id)}
                  disabled={submittingId === event.id || interestedEvents.has(event.id)}
                >
                  {submittingId === event.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : interestedEvents.has(event.id) ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Interest Sent
                    </>
                  ) : (
                    "Express Interest"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TruckDiscovery;
