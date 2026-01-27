import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
export default function ParkingPassManage() {
    var user = useAuth().user;
    var _a = useLocation(), setLocation = _a[1];
    useEffect(function () {
        if (!user) {
            setLocation("/login?redirect=/parking-pass");
            return;
        }
        var cancelled = false;
        fetch("/api/hosts/me")
            .then(function (res) {
            if (cancelled)
                return;
            if (res.ok) {
                setLocation("/host/dashboard");
            }
            else {
                setLocation("/parking-pass");
            }
        })
            .catch(function () {
            if (cancelled)
                return;
            setLocation("/parking-pass");
        });
        return function () {
            cancelled = true;
        };
    }, [user, setLocation]);
    return (<div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Redirecting to your parking pass experience...
    </div>);
}
