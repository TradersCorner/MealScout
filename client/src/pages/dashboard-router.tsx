import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardRouter() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const roles = useMemo(() => {
    const list = new Set<string>();
    if (user?.userType) list.add(user.userType);
    if (Array.isArray(user?.roles)) {
      user.roles.forEach((role) => {
        if (role) list.add(role);
      });
    }
    return list;
  }, [user]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setLocation("/login?redirect=/dashboard");
      return;
    }

    if (roles.has("admin") || roles.has("super_admin")) {
      setLocation("/admin/dashboard");
      return;
    }

    if (roles.has("staff")) {
      setLocation("/staff");
      return;
    }

    if (roles.has("event_coordinator")) {
      setLocation("/event-coordinator/dashboard");
      return;
    }

    if (roles.has("host")) {
      setLocation("/host/dashboard");
      return;
    }

    if (roles.has("restaurant_owner") || roles.has("food_truck")) {
      setLocation("/restaurant-owner-dashboard");
      return;
    }

    setLocation("/user-dashboard");
  }, [isLoading, roles, setLocation, user]);

  return null;
}
