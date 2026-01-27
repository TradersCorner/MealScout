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
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, AreaChart, Area } from "recharts";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
export default function AdminTelemetry() {
    var _this = this;
    var _a, _b, _c;
    // 1. Interest Velocity Query
    var _d = useQuery({
        queryKey: ['/api/admin/telemetry/velocity'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/admin/telemetry/velocity?days=30')];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch velocity');
                        return [2 /*return*/, res.json()];
                }
            });
        }); }
    }), velocity = _d.data, loadingVelocity = _d.isLoading;
    // 2. Fill Rates Query
    var _e = useQuery({
        queryKey: ['/api/admin/telemetry/fill-rates'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/admin/telemetry/fill-rates')];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch fill rates');
                        return [2 /*return*/, res.json()];
                }
            });
        }); }
    }), fillRates = _e.data, loadingFillRates = _e.isLoading;
    // 3. Digest Coverage Query
    var _f = useQuery({
        queryKey: ['/api/admin/telemetry/digest-coverage'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/admin/telemetry/digest-coverage')];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch coverage');
                        return [2 /*return*/, res.json()];
                }
            });
        }); }
    }), coverage = _f.data, loadingCoverage = _f.isLoading;
    if (loadingVelocity || loadingFillRates || loadingCoverage) {
        return (<div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    return (<div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telemetry Viewer</h1>
          <p className="text-muted-foreground">Operational insights from system events (Read-Only)</p>
        </div>
      </div>

      {/* Top Row: Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(fillRates === null || fillRates === void 0 ? void 0 : fillRates.totalEvents) || 0}</div>
            <p className="text-xs text-muted-foreground">Active events in system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Over Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {(_a = fillRates === null || fillRates === void 0 ? void 0 : fillRates.overCapacityPercentage) === null || _a === void 0 ? void 0 : _a.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Events with &gt;100% fill rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Digest Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((_c = (_b = coverage === null || coverage === void 0 ? void 0 : coverage.history) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.coverage) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Last week's eligible hosts reached</p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        
        {/* Interest Velocity */}
        <Card>
          <CardHeader>
            <CardTitle>Interest Velocity (30 Days)</CardTitle>
            <CardDescription>Daily volume of new truck interests</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="date" tickFormatter={function (str) { return new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }} fontSize={12}/>
                <YAxis fontSize={12}/>
                <Tooltip labelFormatter={function (str) { return new Date(str).toLocaleDateString(); }}/>
                <Area type="monotone" dataKey="count" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.2}/>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fill Rate Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Fill Rate Distribution</CardTitle>
            <CardDescription>How full are our events?</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fillRates === null || fillRates === void 0 ? void 0 : fillRates.buckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="range" fontSize={12}/>
                <YAxis fontSize={12}/>
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Digest History */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Digest History</CardTitle>
          <CardDescription>Email delivery performance over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coverage === null || coverage === void 0 ? void 0 : coverage.history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="week" fontSize={12}/>
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" fontSize={12}/>
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" unit="%" fontSize={12}/>
              <Tooltip />
              <Bar yAxisId="left" dataKey="sent" name="Sent Emails" fill="#8884d8" radius={[4, 4, 0, 0]}/>
              <Line yAxisId="right" type="monotone" dataKey="coverage" name="Coverage %" stroke="#82ca9d"/>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4"/>
        <AlertTitle>Data Note</AlertTitle>
        <AlertDescription>
          Time-to-Decision metrics are currently unavailable. Requires schema update to track `decidedAt` timestamp.
        </AlertDescription>
      </Alert>
    </div>);
}
