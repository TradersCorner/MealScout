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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
import { locationNotificationService } from "@/services/location-notifications";
import { Bell, BellOff, MapPin, Clock, Shield, BarChart3 } from "lucide-react";
export default function NotificationSettings() {
    var _this = this;
    var _a = useState(locationNotificationService.getSettings()), settings = _a[0], setSettings = _a[1];
    var _b = useState(locationNotificationService.isMonitoringActive()), isMonitoring = _b[0], setIsMonitoring = _b[1];
    var _c = useState(Notification.permission), permissionStatus = _c[0], setPermissionStatus = _c[1];
    var toast = useToast().toast;
    useEffect(function () {
        // Update monitoring status when settings change
        setIsMonitoring(locationNotificationService.isMonitoringActive());
    }, [settings.enabled]);
    var handleSettingChange = function (key, value) {
        var _a;
        var newSettings = __assign(__assign({}, settings), (_a = {}, _a[key] = value, _a));
        setSettings(newSettings);
        locationNotificationService.updateSettings(newSettings);
        toast({
            title: "Settings Updated",
            description: "".concat(key, " has been updated successfully."),
        });
    };
    var handleEnableNotifications = function () { return __awaiter(_this, void 0, void 0, function () {
        var hasPermission;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!settings.enabled) return [3 /*break*/, 5];
                    return [4 /*yield*/, locationNotificationService.requestPermission()];
                case 1:
                    hasPermission = _a.sent();
                    if (!hasPermission) return [3 /*break*/, 3];
                    handleSettingChange('enabled', true);
                    return [4 /*yield*/, locationNotificationService.startMonitoring()];
                case 2:
                    _a.sent();
                    setIsMonitoring(true);
                    setPermissionStatus('granted');
                    toast({
                        title: "Notifications Enabled",
                        description: "You'll receive alerts when you're near great deals!",
                    });
                    return [3 /*break*/, 4];
                case 3:
                    toast({
                        title: "Permission Required",
                        description: "Please enable notifications in your browser settings.",
                        variant: "destructive",
                    });
                    setPermissionStatus('denied');
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    handleSettingChange('enabled', false);
                    locationNotificationService.stopMonitoring();
                    setIsMonitoring(false);
                    toast({
                        title: "Notifications Disabled",
                        description: "You won't receive location-based alerts anymore.",
                    });
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var stats = locationNotificationService.getTodayStats();
    var cuisineTypes = ['Pizza', 'Burgers', 'Asian', 'Mexican', 'Healthy', 'Coffee'];
    return (<div className="space-y-6">
      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5"/>
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
            <Switch checked={settings.enabled} onCheckedChange={handleEnableNotifications} data-testid="switch-notifications"/>
          </div>

          {/* Permission Status */}
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-muted-foreground"/>
            <span className="text-sm">Permission Status:</span>
            <Badge variant={permissionStatus === 'granted' ? 'default' : 'secondary'}>
              {permissionStatus === 'granted' ? 'Granted' :
            permissionStatus === 'denied' ? 'Denied' : 'Not Set'}
            </Badge>
          </div>

          {/* Monitoring Status */}
          {settings.enabled && (<div className="flex items-center space-x-2 text-sm">
              <MapPin className="w-4 h-4 text-green-600"/>
              <span className={isMonitoring ? "text-green-600" : "text-orange-600"}>
                {isMonitoring ? "Monitoring Active" : "Monitoring Inactive"}
              </span>
            </div>)}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {settings.enabled && (<>
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
                <Slider value={[settings.radius]} onValueChange={function (value) { return handleSettingChange('radius', value[0]); }} max={5} min={0.5} step={0.5} className="w-full" data-testid="slider-radius"/>
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
                <Select value={settings.maxPerDay.toString()} onValueChange={function (value) { return handleSettingChange('maxPerDay', parseInt(value)); }}>
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
                <Clock className="w-5 h-5"/>
                <span>Quiet Hours</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={settings.quietHours.start} onChange={function (e) { return handleSettingChange('quietHours', __assign(__assign({}, settings.quietHours), { start: e.target.value })); }} data-testid="input-quiet-start"/>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={settings.quietHours.end} onChange={function (e) { return handleSettingChange('quietHours', __assign(__assign({}, settings.quietHours), { end: e.target.value })); }} data-testid="input-quiet-end"/>
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
                <BarChart3 className="w-5 h-5"/>
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
        </>)}

      {/* Help Text */}
      {!settings.enabled && (<Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <BellOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground"/>
            <h3 className="font-semibold mb-2">Location Notifications Disabled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enable notifications to get alerts when you're near restaurants with active deals. 
              We'll only notify you during your preferred hours and within your chosen radius.
            </p>
            <Button onClick={handleEnableNotifications} data-testid="button-enable-notifications">
              Enable Notifications
            </Button>
          </CardContent>
        </Card>)}
    </div>);
}
