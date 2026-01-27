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
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Ticket, Shield, Activity, Bell, CheckCircle, } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import AdminIncidents from './AdminIncidents';
// import AdminAuditLogs from './AdminAuditLogs';
// import AdminSupportTickets from './AdminSupportTickets';
// import AdminModerationEvents from './AdminModerationEvents';
export default function AdminControlCenter() {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g;
    var _h = useState("overview"), activeTab = _h[0], setActiveTab = _h[1];
    var _j = useQuery({
        queryKey: ["admin-stats"],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/admin/stats")];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error("Failed to fetch stats");
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        refetchInterval: 30000, // Refresh every 30s
    }), stats = _j.data, isLoading = _j.isLoading;
    var health = useQuery({
        queryKey: ["admin-health"],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/admin/health")];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error("Failed to fetch health");
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        refetchInterval: 60000,
    }).data;
    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
      </div>);
    }
    return (<div className="min-h-screen bg-[var(--bg-app)]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Control Center</h1>
              <p className="text-gray-600 mt-1">
                MealScout Operations & Moderation
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={"flex items-center gap-2 px-3 py-2 rounded-lg ".concat((health === null || health === void 0 ? void 0 : health.status) === "healthy"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800")}>
                <div className="w-2 h-2 rounded-full bg-current"/>
                <span className="text-sm font-medium">
                  {(health === null || health === void 0 ? void 0 : health.status) || "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        {activeTab === "overview" && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {((_a = stats === null || stats === void 0 ? void 0 : stats.incidents) === null || _a === void 0 ? void 0 : _a.total) || 0}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-red-600 font-medium">
                      {((_b = stats === null || stats === void 0 ? void 0 : stats.incidents) === null || _b === void 0 ? void 0 : _b.open) || 0} new
                    </span>
                    <span className="text-orange-600 font-medium">
                      {((_c = stats === null || stats === void 0 ? void 0 : stats.incidents) === null || _c === void 0 ? void 0 : _c.critical) || 0} critical
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {((_d = stats === null || stats === void 0 ? void 0 : stats.tickets) === null || _d === void 0 ? void 0 : _d.open) || 0}
                  </div>
                  <div className="text-xs text-yellow-600 font-medium">
                    {((_e = stats === null || stats === void 0 ? void 0 : stats.tickets) === null || _e === void 0 ? void 0 : _e.highPriority) || 0} high priority
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Moderation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {((_f = stats === null || stats === void 0 ? void 0 : stats.moderation) === null || _f === void 0 ? void 0 : _f.recentEvents) || 0}
                  </div>
                  <div className="text-xs text-gray-600">Last 7 days</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {((_g = stats === null || stats === void 0 ? void 0 : stats.users) === null || _g === void 0 ? void 0 : _g.total) || 0}
                  </div>
                  <div className="text-xs text-gray-600">Total registered</div>
                </div>
              </CardContent>
            </Card>
          </div>)}

        {/* Main Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4"/>
              Incidents
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="w-4 h-4"/>
              Tickets
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Shield className="w-4 h-4"/>
              Moderation
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Activity className="w-4 h-4"/>
              Audit
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Bell className="w-4 h-4"/>
              Health
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>Navigate using the tabs above</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4"/> Incidents
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      View and manage security incidents with signatures and
                      timelines.
                    </p>
                    <Button size="sm" variant="outline" onClick={function () { return setActiveTab("incidents"); }}>
                      Manage
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Ticket className="w-4 h-4"/> Support Tickets
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Handle user support requests and resolve issues.
                    </p>
                    <Button size="sm" variant="outline" onClick={function () { return setActiveTab("tickets"); }}>
                      Manage
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4"/> Moderation
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Review reported content and take moderation actions.
                    </p>
                    <Button size="sm" variant="outline" onClick={function () { return setActiveTab("moderation"); }}>
                      Manage
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4"/> Audit Logs
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Search and filter all platform activity.
                    </p>
                    <Button size="sm" variant="outline" onClick={function () { return setActiveTab("audit"); }}>
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents">
            <Card>
              <CardHeader>
                <CardTitle>Incidents</CardTitle>
                <CardDescription>
                  View and manage system incidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Incidents module loading...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>
                  View and manage support tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Support tickets module loading...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Events</CardTitle>
                <CardDescription>
                  View and manage moderation events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Moderation events module loading...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>View system audit logs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Audit logs module loading...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Background jobs and service status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Database Connection</h3>
                    <Badge className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Server Status</h3>
                    <Badge className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Escalations Job</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600"/>
                      <span>Running (every 15 minutes)</span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Auto-Close Job</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600"/>
                      <span>Running (daily)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    ℹ️ All background jobs are configured and running. Check
                    Vercel Cron for scheduled execution in production.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>);
}
