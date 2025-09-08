import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { locationNotificationService, type NotificationSettings } from "@/services/location-notifications";
import { Bell, BellOff, MapPin, Clock, Shield, BarChart3 } from "lucide-react";

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(locationNotificationService.getSettings());
  const [isMonitoring, setIsMonitoring] = useState(locationNotificationService.isMonitoringActive());
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>(Notification.permission as any);
  const { toast } = useToast();

  useEffect(() => {
    // Update monitoring status when settings change
    setIsMonitoring(locationNotificationService.isMonitoringActive());
  }, [settings.enabled]);

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    locationNotificationService.updateSettings(newSettings);
    
    toast({
      title: "Settings Updated",
      description: `${key} has been updated successfully.`,
    });
  };

  const handleEnableNotifications = async () => {
    if (!settings.enabled) {
      const hasPermission = await locationNotificationService.requestPermission();
      
      if (hasPermission) {
        handleSettingChange('enabled', true);
        await locationNotificationService.startMonitoring();
        setIsMonitoring(true);
        setPermissionStatus('granted');
        
        toast({
          title: "Notifications Enabled",
          description: "You'll receive alerts when you're near great deals!",
        });
      } else {
        toast({
          title: "Permission Required",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        setPermissionStatus('denied');
      }
    } else {
      handleSettingChange('enabled', false);
      locationNotificationService.stopMonitoring();
      setIsMonitoring(false);
      
      toast({
        title: "Notifications Disabled",
        description: "You won't receive location-based alerts anymore.",
      });
    }
  };

  const stats = locationNotificationService.getTodayStats();
  const cuisineTypes = ['Pizza', 'Burgers', 'Asian', 'Mexican', 'Healthy', 'Coffee'];

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Location-Based Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Enable Deal Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when you're near restaurants with active deals
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={handleEnableNotifications}
              data-testid="switch-notifications"
            />
          </div>

          {/* Permission Status */}
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Permission Status:</span>
            <Badge variant={permissionStatus === 'granted' ? 'default' : 'secondary'}>
              {permissionStatus === 'granted' ? 'Granted' : 
               permissionStatus === 'denied' ? 'Denied' : 'Not Set'}
            </Badge>
          </div>

          {/* Monitoring Status */}
          {settings.enabled && (
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className={isMonitoring ? "text-green-600" : "text-orange-600"}>
                {isMonitoring ? "Monitoring Active" : "Monitoring Inactive"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {settings.enabled && (
        <>
          {/* Detection Radius */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detection Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Notification Radius</Label>
                  <span className="text-sm font-medium">{settings.radius}km</span>
                </div>
                <Slider
                  value={[settings.radius]}
                  onValueChange={(value) => handleSettingChange('radius', value[0])}
                  max={5}
                  min={0.5}
                  step={0.5}
                  className="w-full"
                  data-testid="slider-radius"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5km</span>
                  <span>5km</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Maximum notifications per day</Label>
                <Select
                  value={settings.maxPerDay.toString()}
                  onValueChange={(value) => handleSettingChange('maxPerDay', parseInt(value))}
                >
                  <SelectTrigger data-testid="select-max-per-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 notification</SelectItem>
                    <SelectItem value="3">3 notifications</SelectItem>
                    <SelectItem value="5">5 notifications</SelectItem>
                    <SelectItem value="10">10 notifications</SelectItem>
                    <SelectItem value="20">20 notifications</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Quiet Hours</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => handleSettingChange('quietHours', {
                      ...settings.quietHours,
                      start: e.target.value
                    })}
                    data-testid="input-quiet-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => handleSettingChange('quietHours', {
                      ...settings.quietHours,
                      end: e.target.value
                    })}
                    data-testid="input-quiet-end"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                No notifications will be sent during these hours
              </p>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Today's Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">{stats.notificationsShown}</div>
                  <div className="text-sm text-muted-foreground">Notifications Sent</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-muted-foreground">{stats.maxAllowed - stats.notificationsShown}</div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Help Text */}
      {!settings.enabled && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <BellOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Location Notifications Disabled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enable notifications to get alerts when you're near restaurants with active deals. 
              We'll only notify you during your preferred hours and within your chosen radius.
            </p>
            <Button onClick={handleEnableNotifications} data-testid="button-enable-notifications">
              Enable Notifications
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}