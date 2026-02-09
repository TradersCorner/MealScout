import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import EventsPage from "@/pages/events";

export default function EventsRouter() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const roleState = useMemo(() => {
    const roles = new Set<string>();
    if (user?.userType) roles.add(user.userType);
    if (Array.isArray(user?.roles)) {
      user.roles.forEach((role: string | null) => {
        if (role) roles.add(role);
      });
    }

    const isEventCoordinator = roles.has("event_coordinator");
    const isTruck =
      roles.has("food_truck") || roles.has("restaurant_owner");
    const isMultiRole = Number(isEventCoordinator) + Number(isTruck) > 1;

    return { isEventCoordinator, isTruck, isMultiRole };
  }, [user]);

  useEffect(() => {
    if (isLoading || !user) return;
    if (roleState.isMultiRole) return;
    // Keep event coordinators on /events so posting lives on the Events page.
    if (roleState.isTruck) {
      setLocation("/truck-discovery");
    }
  }, [isLoading, roleState, setLocation, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || (!roleState.isEventCoordinator && !roleState.isTruck)) {
    return <EventsPage />;
  }

  if (roleState.isMultiRole) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-2">
          <h1 className="text-lg font-semibold text-[color:var(--text-primary)]">Events</h1>
          <p className="text-sm text-[color:var(--text-muted)]">
            Choose the events experience you want to use right now.
          </p>
        </div>
        <div className="grid gap-3">
          {roleState.isEventCoordinator && (
            <Button
              className="justify-start"
              onClick={() => setLocation("/event-coordinator/dashboard")}
            >
              Organizer events
            </Button>
          )}
          {roleState.isTruck && (
            <Button
              className="justify-start"
              onClick={() => setLocation("/truck-discovery")}
            >
              Truck events
            </Button>
          )}
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => setLocation("/events/public")}
          >
            Public event listings
          </Button>
        </div>
      </div>
    );
  }

  return <EventsPage />;
}




