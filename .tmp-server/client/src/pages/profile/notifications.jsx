var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Smartphone } from "lucide-react";
import { BackHeader } from "@/components/back-header";
export default function NotificationsPage() {
    var _a = useAuth(), user = _a.user, isAuthenticated = _a.isAuthenticated;
    var _b = useState({
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        dealAlerts: true,
        orderUpdates: true,
        newRestaurants: false,
        weeklyDigest: true,
    }), notifications = _b[0], setNotifications = _b[1];
    if (!isAuthenticated || !user) {
        return (<div className="max-w-md mx-auto bg-[var(--bg-app)] min-h-screen relative pb-20">
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4"/>
          <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
          <p className="text-muted-foreground">Log in to manage your notifications</p>
        </div>
        <Navigation />
      </div>);
    }
    var handleToggle = function (key) {
        setNotifications(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = !prev[key], _a)));
        });
    };
    return (<div className="max-w-md mx-auto bg-[var(--bg-app)] min-h-screen relative pb-20">
      <BackHeader title="Notifications" subtitle="Manage how you receive updates" fallbackHref="/profile" icon={Bell} className="bg-white border-b border-border"/>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Delivery Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Smartphone className="w-5 h-5 mr-2"/>
              Delivery Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified on your device</p>
              </div>
              <Switch checked={notifications.pushNotifications} onCheckedChange={function () { return handleToggle('pushNotifications'); }} data-testid="switch-push"/>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch checked={notifications.emailNotifications} onCheckedChange={function () { return handleToggle('emailNotifications'); }} data-testid="switch-email"/>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">Get text message alerts</p>
              </div>
              <Switch checked={notifications.smsNotifications} onCheckedChange={function () { return handleToggle('smsNotifications'); }} data-testid="switch-sms"/>
            </div>
          </CardContent>
        </Card>

        {/* Content Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Bell className="w-5 h-5 mr-2"/>
              What to notify me about
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Deal Alerts</p>
                <p className="text-sm text-muted-foreground">New deals near you</p>
              </div>
              <Switch checked={notifications.dealAlerts} onCheckedChange={function () { return handleToggle('dealAlerts'); }} data-testid="switch-deals"/>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Order Updates</p>
                <p className="text-sm text-muted-foreground">Status of your claimed deals</p>
              </div>
              <Switch checked={notifications.orderUpdates} onCheckedChange={function () { return handleToggle('orderUpdates'); }} data-testid="switch-orders"/>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Restaurants</p>
                <p className="text-sm text-muted-foreground">When new places join MealScout</p>
              </div>
              <Switch checked={notifications.newRestaurants} onCheckedChange={function () { return handleToggle('newRestaurants'); }} data-testid="switch-restaurants"/>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Digest</p>
                <p className="text-sm text-muted-foreground">Summary of your activity</p>
              </div>
              <Switch checked={notifications.weeklyDigest} onCheckedChange={function () { return handleToggle('weeklyDigest'); }} data-testid="switch-digest"/>
            </div>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>);
}
