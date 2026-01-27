import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import EventsPage from "@/pages/events";
export default function EventsRouter() {
    var _a = useAuth(), user = _a.user, isLoading = _a.isLoading;
    var _b = useLocation(), setLocation = _b[1];
    var roleState = useMemo(function () {
        var roles = new Set();
        if (user === null || user === void 0 ? void 0 : user.userType)
            roles.add(user.userType);
        if (Array.isArray(user === null || user === void 0 ? void 0 : user.roles)) {
            user.roles.forEach(function (role) {
                if (role)
                    roles.add(role);
            });
        }
        var isEventCoordinator = roles.has("event_coordinator");
        var isTruck = roles.has("food_truck") || roles.has("restaurant_owner");
        var isMultiRole = Number(isEventCoordinator) + Number(isTruck) > 1;
        return { isEventCoordinator: isEventCoordinator, isTruck: isTruck, isMultiRole: isMultiRole };
    }, [user]);
    useEffect(function () {
        if (isLoading || !user)
            return;
        if (roleState.isMultiRole)
            return;
        if (roleState.isEventCoordinator) {
            setLocation("/event-coordinator/dashboard");
            return;
        }
        if (roleState.isTruck) {
            setLocation("/truck-discovery");
        }
    }, [isLoading, roleState, setLocation, user]);
    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
      </div>);
    }
    if (!user || (!roleState.isEventCoordinator && !roleState.isTruck)) {
        return <EventsPage />;
    }
    if (roleState.isMultiRole) {
        return (<div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2">
          <h1 className="text-lg font-semibold text-gray-900">Events</h1>
          <p className="text-sm text-gray-600">
            Choose the events experience you want to use right now.
          </p>
        </div>
        <div className="grid gap-3">
          {roleState.isEventCoordinator && (<Button className="justify-start" onClick={function () { return setLocation("/event-coordinator/dashboard"); }}>
              Organizer events
            </Button>)}
          {roleState.isTruck && (<Button className="justify-start" onClick={function () { return setLocation("/truck-discovery"); }}>
              Truck events
            </Button>)}
          <Button variant="outline" className="justify-start" onClick={function () { return setLocation("/events/public"); }}>
            Public event listings
          </Button>
        </div>
      </div>);
    }
    return <EventsPage />;
}
