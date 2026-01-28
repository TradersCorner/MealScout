import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function ParkingPassManage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/login?redirect=/parking-pass");
      return;
    }

    let cancelled = false;
    fetch("/api/hosts/me")
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setLocation("/parking-pass#parking-pass-settings");
        } else {
          setLocation("/parking-pass");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setLocation("/parking-pass");
      });

    return () => {
      cancelled = true;
    };
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Redirecting to your parking pass experience...
    </div>
  );
}
