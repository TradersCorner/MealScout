import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Smartphone, Mail, MapPin } from "lucide-react";
import { BackHeader } from "@/components/back-header";

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    dealAlerts: true,
    orderUpdates: true,
    newRestaurants: false,
    weeklyDigest: true,
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
          <p className="text-muted-foreground">Log in to manage your notifications</p>
        </div>
        <Navigation />
      </div>
    );
  }

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      <BackHeader
        title="Notifications"
        subtitle="Manage how you receive updates"
        fallbackHref="/profile"
        icon={Bell}
        className="bg-white border-b border-border"
      />

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Delivery Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Delivery Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified on your device</p>
              </div>
              <Switch
                checked={notifications.pushNotifications}
                onCheckedChange={() => handleToggle('pushNotifications')}
                data-testid="switch-push"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={() => handleToggle('emailNotifications')}
                data-testid="switch-email"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">Get text message alerts</p>
              </div>
              <Switch
                checked={notifications.smsNotifications}
                onCheckedChange={() => handleToggle('smsNotifications')}
                data-testid="switch-sms"
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              What to notify me about
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Deal Alerts</p>
                <p className="text-sm text-muted-foreground">New deals near you</p>
              </div>
              <Switch
                checked={notifications.dealAlerts}
                onCheckedChange={() => handleToggle('dealAlerts')}
                data-testid="switch-deals"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Order Updates</p>
                <p className="text-sm text-muted-foreground">Status of your claimed deals</p>
              </div>
              <Switch
                checked={notifications.orderUpdates}
                onCheckedChange={() => handleToggle('orderUpdates')}
                data-testid="switch-orders"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Restaurants</p>
                <p className="text-sm text-muted-foreground">When new places join MealScout</p>
              </div>
              <Switch
                checked={notifications.newRestaurants}
                onCheckedChange={() => handleToggle('newRestaurants')}
                data-testid="switch-restaurants"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Digest</p>
                <p className="text-sm text-muted-foreground">Summary of your activity</p>
              </div>
              <Switch
                checked={notifications.weeklyDigest}
                onCheckedChange={() => handleToggle('weeklyDigest')}
                data-testid="switch-digest"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}