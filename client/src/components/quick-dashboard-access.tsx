import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Shield, Store, ToggleLeft, User } from "lucide-react";

export default function QuickDashboardAccess() {
  const { data: adminUser, isLoading: isVerifyingAdmin } = useQuery({
    queryKey: ["/api/auth/admin/verify"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isVerifyingAdmin || !adminUser) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ToggleLeft className="h-5 w-5" />
          Dashboard Views
        </CardTitle>
        <CardDescription>
          Quickly switch to see what different user types experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button variant="outline" className="flex items-center gap-2 justify-start" asChild>
            <Link href="/admin/switcher?view=admin" data-testid="link-admin-view">
              <Shield className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Admin View</div>
                <div className="text-xs text-muted-foreground">Platform management</div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="flex items-center gap-2 justify-start" asChild>
            <Link href="/admin/switcher?view=user" data-testid="link-user-view">
              <User className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Customer View</div>
                <div className="text-xs text-muted-foreground">Customer experience</div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="flex items-center gap-2 justify-start" asChild>
            <Link href="/admin/switcher?view=restaurant" data-testid="link-restaurant-view">
              <Store className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Restaurant View</div>
                <div className="text-xs text-muted-foreground">Restaurant owner experience</div>
              </div>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
