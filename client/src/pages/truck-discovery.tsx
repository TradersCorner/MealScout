import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Truck,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Host {
  id: string;
  businessName: string;
  address: string;
  locationType: string;
}

interface EventSeries {
  id: number;
  name: string;
  recurrenceRule: string;
  timezone: string;
  status: string;
}

interface Event {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxTrucks: number;
  hardCapEnabled?: boolean;
  status: string;
  seriesId?: string | null;
  host: Host;
  series?: EventSeries | null;
}

interface SeriesGroup {
  seriesId: string;
  seriesName: string;
  host: Host;
  occurrences: Event[];
  earliestDate: string;
  latestDate: string;
}

function TruckDiscovery() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(
    new Set(),
  );
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [myRestaurantId, setMyRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's restaurant first
        const restaurantRes = await fetch("/api/restaurants/my");
        if (restaurantRes.ok) {
          const restaurants = await restaurantRes.json();
          if (restaurants.length > 0) {
            setMyRestaurantId(restaurants[0].id);
          }
        }

        // Fetch events
        const eventsRes = await fetch("/api/events");
        if (!eventsRes.ok) {
          if (eventsRes.status === 401) {
            setLocation("/login?redirect=/truck-discovery");
            return;
          }
          throw new Error("Failed to fetch events");
        }
        const data = await eventsRes.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setLocation]);

  const handleExpressInterest = async (eventId: string) => {
    if (!myRestaurantId) {
      toast({
        title: "Truck Profile Required",
        description: "You must have a truck profile to express interest.",
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
          restaurantId: myRestaurantId,
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


  const toggleSeries = (seriesId: string) => {
    setExpandedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesId)) {
        next.delete(seriesId);
      } else {
        next.add(seriesId);
      }
      return next;
    });
  };

  // Group events by series
  const groupedData: { series: SeriesGroup[]; standalone: Event[] } =
    events.reduce(
      (acc, event) => {
        if (event.seriesId && event.series) {
          const existingGroup = acc.series.find(
            (g) => g.seriesId === event.seriesId,
          );
          if (existingGroup) {
            existingGroup.occurrences.push(event);
            if (new Date(event.date) > new Date(existingGroup.latestDate)) {
              existingGroup.latestDate = event.date;
            }
          } else {
            acc.series.push({
              seriesId: event.seriesId,
              seriesName: event.series.name,
              host: event.host,
              occurrences: [event],
              earliestDate: event.date,
              latestDate: event.date,
            });
          }
        } else {
          acc.standalone.push(event);
        }
        return acc;
      },
      { series: [] as SeriesGroup[], standalone: [] as Event[] },
    );

  // Sort series by earliest occurrence
  groupedData.series.sort(
    (a, b) =>
      new Date(a.earliestDate).getTime() - new Date(b.earliestDate).getTime(),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-layered)]">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--accent-text)]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 bg-[var(--bg-layered)] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[color:var(--text-primary)] mb-2">
          Find Parking & Events
        </h1>
        <p className="text-[color:var(--text-secondary)]">
          Browse host locations (gas stations, schools, breweries, etc.) and
          high-volume events looking for food trucks. Express interest to
          connect with hosts and event coordinators.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-[color:var(--status-error)]/10 text-[color:var(--status-error)] rounded-lg mb-6">
          {error}
        </div>
      )}

      {groupedData.series.length === 0 &&
      groupedData.standalone.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-surface-muted)] rounded-xl border border-dashed border-[color:var(--border-subtle)]">
          <Truck className="mx-auto h-12 w-12 text-[color:var(--text-muted)] mb-3" />
          <h3 className="text-lg font-medium text-[color:var(--text-primary)]">
            No events available right now
          </h3>
          <p className="text-[color:var(--text-secondary)]">
            Check back later for new host locations and events.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Series Groups */}
          {groupedData.series.map((group) => (
            <div
              key={group.seriesId}
              className="bg-[var(--bg-card)] rounded-xl border border-[color:var(--border-subtle)] shadow-clean overflow-hidden"
            >
              {/* Series Header */}
              <div
                className="p-6 bg-[linear-gradient(110deg,rgba(255,77,46,0.08),rgba(245,158,11,0.08))] border-b border-[color:var(--border-subtle)] cursor-pointer hover:bg-[linear-gradient(110deg,rgba(255,77,46,0.12),rgba(245,158,11,0.12))] transition-colors"
                onClick={() => toggleSeries(group.seriesId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-[color:var(--text-primary)]">
                        {group.seriesName}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-[color:var(--accent-text)]/12 text-[color:var(--accent-text)] border-[color:var(--accent-text)]/30"
                      >
                        Recurring Open Call
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-[color:var(--text-secondary)]">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[color:var(--accent-text)]" />
                        <span className="font-medium">
                          {group.host.businessName}
                        </span>
                        <span className="text-[color:var(--text-muted)]">-</span>
                        <span>{group.host.address}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[color:var(--accent-text)]" />
                        <span>
                          {group.occurrences.length} occurrence
                          {group.occurrences.length !== 1 ? "s" : ""} -{" "}
                          {format(new Date(group.earliestDate), "MMM d")} -{" "}
                          {format(new Date(group.latestDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="ml-4">
                    {expandedSeries.has(group.seriesId) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Occurrences List */}
              {expandedSeries.has(group.seriesId) && (
                <div className="divide-y divide-[color:var(--border-subtle)]">
                  {group.occurrences.map((event) => (
                    <div
                      key={event.id}
                      className="p-6 hover:bg-[var(--bg-surface-muted)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center font-semibold text-[color:var(--text-primary)]">
                              <Calendar className="h-4 w-4 mr-2 text-[color:var(--accent-text)]" />
                              {format(
                                new Date(event.date),
                                "EEEE, MMMM d, yyyy",
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-[color:var(--text-secondary)]">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-[color:var(--accent-text)]" />
                              {event.startTime} - {event.endTime}
                            </div>
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 mr-2 text-[color:var(--accent-text)]" />
                              Capacity: {event.maxTrucks} truck
                              {event.maxTrucks !== 1 ? "s" : ""}
                            </div>
                            {event.hardCapEnabled && (
                              <Badge
                                variant="outline"
                                className="text-xs border-[color:var(--status-warning)]/30 bg-[color:var(--status-warning)]/10 text-[color:var(--status-warning)]"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Strict Cap
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-[color:var(--text-muted)]">
                            Part of an Open Call series - Express interest for
                            this date
                          </p>
                        </div>

                        <Button
                          onClick={() => handleExpressInterest(event.id)}
                          disabled={
                            submittingId === event.id ||
                            interestedEvents.has(event.id)
                          }
                          className="min-w-[140px]"
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
          ))}

          {/* Standalone Events */}
          {groupedData.standalone.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groupedData.standalone.map((event) => (
                <div
                  key={event.id}
                  className="bg-[var(--bg-card)] rounded-xl border border-[color:var(--border-subtle)] shadow-clean overflow-hidden hover:shadow-clean-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-[color:var(--text-primary)] line-clamp-1">
                          {event.host.businessName}
                        </h3>
                        <div className="flex items-center text-[color:var(--text-muted)] text-sm mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="line-clamp-1">
                            {event.host.address}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-[var(--bg-surface-muted)] text-xs font-medium text-[color:var(--text-secondary)] capitalize">
                        {event.host.locationType}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-[color:var(--text-secondary)]">
                        <Calendar className="h-4 w-4 mr-2 text-[color:var(--accent-text)]" />
                        <span className="font-medium">
                          {format(new Date(event.date), "EEEE, MMMM d")}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-[color:var(--text-secondary)]">
                        <Clock className="h-4 w-4 mr-2 text-[color:var(--accent-text)]" />
                        <span>
                          {event.startTime} - {event.endTime}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-[color:var(--text-secondary)]">
                        <Truck className="h-4 w-4 mr-2 text-[color:var(--accent-text)]" />
                        <span>
                          Capacity: {event.maxTrucks} truck
                          {event.maxTrucks !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-xs text-[color:var(--text-muted)]">
                        Interest-based only. No payments for events.
                      </div>
                      {event.hardCapEnabled && (
                        <Badge
                          variant="outline"
                          className="text-xs border-[color:var(--status-warning)]/30 bg-[color:var(--status-warning)]/10 text-[color:var(--status-warning)]"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Strict Cap
                        </Badge>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleExpressInterest(event.id)}
                      disabled={
                        submittingId === event.id ||
                        interestedEvents.has(event.id)
                      }
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
      )}

    </div>
  );
}

export default TruckDiscovery;





