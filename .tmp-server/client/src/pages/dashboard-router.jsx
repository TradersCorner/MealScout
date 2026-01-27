import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
export default function DashboardRouter() {
    var _a = useAuth(), user = _a.user, isLoading = _a.isLoading;
    var _b = useLocation(), setLocation = _b[1];
    var roles = useMemo(function () {
        var list = new Set();
        if (user === null || user === void 0 ? void 0 : user.userType)
            list.add(user.userType);
        if (Array.isArray(user === null || user === void 0 ? void 0 : user.roles)) {
            user.roles.forEach(function (role) {
                if (role)
                    list.add(role);
            });
        }
        return list;
    }, [user]);
    useEffect(function () {
        if (isLoading)
            return;
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
