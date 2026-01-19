import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Event {
  id: string;
  name: string | null;
  description?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  maxTrucks: number;
  status: string;
  host: {
    businessName: string;
    address: string;
  };
}

export default function EventCoordinatorDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [formData, setFormData] = useState({
    organizationName: "",
    address: "",
    city: "",
    state: "",
    contactPhone: "",
    eventName: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    maxTrucks: 1,
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setLocation("/login?redirect=/event-coordinator/dashboard");
      return;
    }

    if (user?.userType !== "event_coordinator") {
      setLocation("/");
      return;
    }

    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/event-coordinator/events");
        if (!res.ok) {
          throw new Error("Failed to load events");
        }
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load events.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [isAuthenticated, isLoading, setLocation, toast, user?.userType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    try {
      const res = await fetch("/api/event-coordinator/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.organizationName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          contactPhone: formData.contactPhone,
          name: formData.eventName,
          description: formData.description,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          maxTrucks: Number(formData.maxTrucks),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create event");
      }

      const created = await res.json();
      setEvents((prev) => [...prev, created]);
      setIsCreating(false);
      setFormData({
        organizationName: "",
        address: "",
        city: "",
        state: "",
        contactPhone: "",
        eventName: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        maxTrucks: 1,
      });
      toast({
        title: "Event Created",
        description: "Your event is now visible on the Events page and map.",
      });
    } catch (error: any) {
      setCreateError(error.message || "Failed to create event");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Event Coordinator Dashboard
          </h1>
          <p className="text-slate-600">
            Post events and invite food trucks. Payments are handled offline.
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? (
            "Cancel"
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> New Event
            </>
          )}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4">Create Event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {createError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-md text-sm">
                {createError}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({ ...formData, organizationName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name</Label>
                <Input
                  id="eventName"
                  value={formData.eventName}
                  onChange={(e) =>
                    setFormData({ ...formData, eventName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTrucks">Max Trucks</Label>
                <Input
                  id="maxTrucks"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxTrucks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxTrucks: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Event details, expectations, vendor notes"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit">Publish Event</Button>
            </div>
          </form>
        </div>
      )}

      <Tabs defaultValue="upcoming" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Your Events</h2>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upcoming" className="space-y-4">
          {events.filter(
            (e) => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)),
          ).length === 0 ? (
            <Card className="p-8 text-center text-slate-600">
              No upcoming events yet.
            </Card>
          ) : (
            <div className="grid gap-4">
              {events
                .filter(
                  (e) =>
                    new Date(e.date) >=
                    new Date(new Date().setHours(0, 0, 0, 0)),
                )
                .map((event) => (
                  <Card key={event.id} className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">
                        {event.name || "Food Truck Event"}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {event.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.date), "MMMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.host.businessName} - {event.host.address}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {events.filter(
            (e) => new Date(e.date) < new Date(new Date().setHours(0, 0, 0, 0)),
          ).length === 0 ? (
            <Card className="p-8 text-center text-slate-600">
              No past events yet.
            </Card>
          ) : (
            <div className="grid gap-4 opacity-80">
              {events
                .filter(
                  (e) =>
                    new Date(e.date) <
                    new Date(new Date().setHours(0, 0, 0, 0)),
                )
                .map((event) => (
                  <Card key={event.id} className="p-5 space-y-2">
                    <h3 className="font-semibold text-slate-900">
                      {event.name || "Food Truck Event"}
                    </h3>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.date), "MMMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {event.startTime} - {event.endTime}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
