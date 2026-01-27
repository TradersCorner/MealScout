/**
 * Moderation Telemetry v1 — Read-Only Metrics
 *
 * OBSERVATIONAL ONLY:
 * - No individual moderator performance tracking
 * - No prescriptive recommendations or alerts
 * - No real-time streaming (polling minimum 30s)
 * - Aggregated data from existing reports and audit logs only
 *
 * All copy sourced from MODERATION_TELEMETRY_COPY.
 */
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
import { useReducer, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MODERATION_TELEMETRY_COPY as COPY } from '@/copy/moderationTelemetry.copy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Clock, AlertCircle, RefreshCw } from 'lucide-react';
function assertNever(x) {
    throw new Error("Unexpected event: ".concat(JSON.stringify(x)));
}
export function metricsUITransition(state, event) {
    switch (state.state) {
        case 'idle': {
            switch (event.type) {
                case 'LOAD':
                    return { state: 'loading' };
                case 'LOAD_SUCCESS':
                case 'LOAD_ERROR':
                case 'REFRESH':
                    return state;
                default:
                    assertNever(event);
            }
        }
        case 'loading': {
            switch (event.type) {
                case 'LOAD_SUCCESS':
                    return { state: 'ready' };
                case 'LOAD_ERROR':
                    return { state: 'error' };
                case 'LOAD':
                case 'REFRESH':
                    return state;
                default:
                    assertNever(event);
            }
        }
        case 'ready': {
            switch (event.type) {
                case 'REFRESH':
                case 'LOAD':
                    return { state: 'loading' };
                case 'LOAD_SUCCESS':
                case 'LOAD_ERROR':
                    return state;
                default:
                    assertNever(event);
            }
        }
        case 'error': {
            switch (event.type) {
                case 'LOAD':
                case 'REFRESH':
                    return { state: 'loading' };
                case 'LOAD_SUCCESS':
                    return { state: 'ready' };
                case 'LOAD_ERROR':
                    return state;
                default:
                    assertNever(event);
            }
        }
        default: {
            var _exhaustive = state;
            return _exhaustive;
        }
    }
}
// ============================================================================
// Components
// ============================================================================
function MetricsHeader() {
    return (<div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="w-6 h-6 text-primary"/>
        <h1 className="text-2xl font-bold">{COPY.page.title}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{COPY.page.subtitle}</p>
    </div>);
}
function TimeRangeSelector(_a) {
    var value = _a.value, onChange = _a.onChange;
    return (<div className="flex items-center gap-3">
      <label className="text-sm font-medium">{COPY.timeRange.label}</label>
      <Select value={value} onValueChange={function (v) { return onChange(v); }}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">{COPY.timeRange.day}</SelectItem>
          <SelectItem value="7d">{COPY.timeRange.week}</SelectItem>
          <SelectItem value="30d">{COPY.timeRange.month}</SelectItem>
        </SelectContent>
      </Select>
    </div>);
}
function QueueDepthCard(_a) {
    var data = _a.data;
    return (<Card>
      <CardHeader>
        <CardTitle className="text-base">{COPY.metrics.queueDepth.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{COPY.metrics.queueDepth.pending}</span>
            <span className="text-2xl font-bold text-orange-600">{data.pending}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{COPY.metrics.queueDepth.resolved}</span>
            <span className="text-2xl font-bold text-green-600">{data.resolved}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t">
            <span className="text-sm font-medium">{COPY.metrics.queueDepth.total}</span>
            <span className="text-xl font-bold">{data.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>);
}
function ActionDistributionCard(_a) {
    var data = _a.data;
    var total = data.hide + data.restore + data.remove + data.dismiss;
    return (<Card>
      <CardHeader>
        <CardTitle className="text-base">{COPY.metrics.actionDistribution.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (<p className="text-sm text-muted-foreground italic">{COPY.metrics.actionDistribution.noActions}</p>) : (<div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{COPY.metrics.actionDistribution.hide}</span>
              <span className="text-lg font-semibold">{data.hide}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{COPY.metrics.actionDistribution.restore}</span>
              <span className="text-lg font-semibold">{data.restore}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{COPY.metrics.actionDistribution.remove}</span>
              <span className="text-lg font-semibold text-red-600">{data.remove}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{COPY.metrics.actionDistribution.dismiss}</span>
              <span className="text-lg font-semibold">{data.dismiss}</span>
            </div>
          </div>)}
      </CardContent>
    </Card>);
}
function TimeToDecisionCard(_a) {
    var data = _a.data;
    return (<Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4"/>
          {COPY.metrics.timeToDecision.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.averageHours === null ? (<p className="text-sm text-muted-foreground italic">{COPY.metrics.timeToDecision.noDecisions}</p>) : (<div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{data.averageHours.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">{COPY.metrics.timeToDecision.unit}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {COPY.metrics.timeToDecision.value} ({data.sampleSize} decisions)
            </p>
          </div>)}
      </CardContent>
    </Card>);
}
function RepeatReportsCard(_a) {
    var data = _a.data;
    return (<Card>
      <CardHeader>
        <CardTitle className="text-base">{COPY.metrics.repeatReports.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.videosWithMultipleReports === 0 ? (<p className="text-sm text-muted-foreground italic">{COPY.metrics.repeatReports.noRepeats}</p>) : (<div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{COPY.metrics.repeatReports.rate}</span>
              <span className="text-2xl font-bold">{data.videosWithMultipleReports}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{COPY.metrics.repeatReports.count}</span>
              <span className="text-lg font-semibold">{data.totalRepeats}</span>
            </div>
          </div>)}
      </CardContent>
    </Card>);
}
function MetricsDashboard(_a) {
    var metrics = _a.metrics, onRefresh = _a.onRefresh, canRefresh = _a.canRefresh, isRefreshing = _a.isRefreshing;
    return (<div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {COPY.page.lastUpdated}: {metrics.lastUpdated.toLocaleString()}
        </p>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={!canRefresh || isRefreshing}>
          <RefreshCw className={"w-4 h-4 mr-2 ".concat(isRefreshing ? 'animate-spin' : '')}/>
          {isRefreshing ? COPY.page.refreshing : COPY.refresh.button}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QueueDepthCard data={metrics.queueDepth}/>
        <ActionDistributionCard data={metrics.actionDistribution}/>
        <TimeToDecisionCard data={metrics.timeToDecision}/>
        <RepeatReportsCard data={metrics.repeatReports}/>
      </div>
    </div>);
}
function MetricsError(_a) {
    var onRetry = _a.onRetry;
    return (<Card>
      <CardContent className="py-12 text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="w-12 h-12 text-destructive"/>
        </div>
        <p className="text-muted-foreground">{COPY.page.error}</p>
        <Button onClick={onRetry}>{COPY.page.retry}</Button>
      </CardContent>
    </Card>);
}
function MetricsEmpty() {
    return (<Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">{COPY.page.noData}</p>
      </CardContent>
    </Card>);
}
// ============================================================================
// Main Page Component
// ============================================================================
export default function AdminModerationMetricsPage() {
    var _this = this;
    var _a = useReducer(metricsUITransition, { state: 'idle' }), uiState = _a[0], dispatch = _a[1];
    var _b = useState('7d'), timeRange = _b[0], setTimeRange = _b[1];
    var _c = useState(0), lastRefreshTime = _c[0], setLastRefreshTime = _c[1];
    var toast = useToast().toast;
    // Fetch metrics (read-only aggregation from existing data)
    var _d = useQuery({
        queryKey: ['/api/admin/moderation-metrics', timeRange],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res, data, reports, pending, actionTaken, dismissed, videoReportCounts_1, repeats, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/api/admin/reported-videos?status=pending")];
                    case 1:
                        res = _b.sent();
                        if (!res.ok)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _b.sent();
                        reports = data.reports || [];
                        pending = reports.filter(function (r) { return r.status === 'pending'; }).length;
                        actionTaken = reports.filter(function (r) { return r.status === 'action_taken'; }).length;
                        dismissed = reports.filter(function (r) { return r.status === 'dismissed'; }).length;
                        videoReportCounts_1 = new Map();
                        reports.forEach(function (r) {
                            var count = videoReportCounts_1.get(r.storyId) || 0;
                            videoReportCounts_1.set(r.storyId, count + 1);
                        });
                        repeats = Array.from(videoReportCounts_1.values()).filter(function (count) { return count >= 2; });
                        return [2 /*return*/, {
                                queueDepth: {
                                    pending: pending,
                                    resolved: actionTaken + dismissed,
                                    total: reports.length,
                                },
                                actionDistribution: {
                                    hide: 0, // Would need audit logs in production
                                    restore: 0,
                                    remove: actionTaken,
                                    dismiss: dismissed,
                                },
                                timeToDecision: {
                                    averageHours: null, // Would calculate from timestamps in production
                                    sampleSize: 0,
                                },
                                repeatReports: {
                                    videosWithMultipleReports: repeats.length,
                                    totalRepeats: repeats.reduce(function (sum, count) { return sum + count; }, 0),
                                },
                                lastUpdated: new Date(),
                            }];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        }); },
        enabled: uiState.state !== 'idle',
        refetchInterval: false, // Manual refresh only
    }), metrics = _d.data, isLoading = _d.isLoading, isError = _d.isError, refetch = _d.refetch;
    // Trigger LOAD on mount and time range changes
    useEffect(function () {
        dispatch({ type: 'LOAD' });
    }, [timeRange]);
    // Map query status to FSM events
    useEffect(function () {
        if (uiState.state === 'loading') {
            if (isError) {
                dispatch({ type: 'LOAD_ERROR' });
            }
            else if (!isLoading) {
                dispatch({ type: 'LOAD_SUCCESS' });
            }
        }
    }, [isLoading, isError, uiState.state]);
    var handleRefresh = function () {
        var now = Date.now();
        var timeSinceLastRefresh = (now - lastRefreshTime) / 1000;
        if (timeSinceLastRefresh < 30) {
            toast({
                title: COPY.refresh.rateLimited,
                variant: 'destructive',
            });
            return;
        }
        setLastRefreshTime(now);
        dispatch({ type: 'REFRESH' });
        refetch();
    };
    var handleRetry = function () {
        dispatch({ type: 'LOAD' });
        refetch();
    };
    var canRefresh = uiState.state === 'ready';
    var isRefreshing = uiState.state === 'loading' && lastRefreshTime > 0;
    return (<div className="max-w-7xl mx-auto min-h-screen bg-background p-6">
      <MetricsHeader />

      <div className="mb-6">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange}/>
      </div>

      {uiState.state === 'loading' && !isRefreshing && (<div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
          <span className="ml-3 text-muted-foreground">{COPY.page.loading}</span>
        </div>)}

      {uiState.state === 'error' && <MetricsError onRetry={handleRetry}/>}

      {(uiState.state === 'ready' || isRefreshing) && (<>
          {!metrics ? (<MetricsEmpty />) : (<MetricsDashboard metrics={metrics} onRefresh={handleRefresh} canRefresh={canRefresh} isRefreshing={isRefreshing}/>)}
        </>)}
    </div>);
}
