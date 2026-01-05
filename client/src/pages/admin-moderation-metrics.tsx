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

import { useReducer, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MODERATION_TELEMETRY_COPY as COPY } from '@/copy/moderationTelemetry.copy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Clock, AlertCircle, RefreshCw } from 'lucide-react';

// ============================================================================
// FSM Types & Reducer
// ============================================================================

export type MetricsUIState =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ready' }
  | { state: 'error' };

export type MetricsUIEvent =
  | { type: 'LOAD' }
  | { type: 'LOAD_SUCCESS' }
  | { type: 'LOAD_ERROR' }
  | { type: 'REFRESH' };

function assertNever(x: never): never {
  throw new Error(`Unexpected event: ${JSON.stringify(x)}`);
}

export function metricsUITransition(
  state: MetricsUIState,
  event: MetricsUIEvent
): MetricsUIState {
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
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

// ============================================================================
// Domain Types (Read-Only Metrics)
// ============================================================================

interface ModerationMetrics {
  queueDepth: {
    pending: number;
    resolved: number;
    total: number;
  };
  actionDistribution: {
    hide: number;
    restore: number;
    remove: number;
    dismiss: number;
  };
  timeToDecision: {
    averageHours: number | null;
    sampleSize: number;
  };
  repeatReports: {
    videosWithMultipleReports: number;
    totalRepeats: number;
  };
  lastUpdated: Date;
}

// ============================================================================
// Components
// ============================================================================

function MetricsHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">{COPY.page.title}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{COPY.page.subtitle}</p>
    </div>
  );
}

interface TimeRangeSelectorProps {
  value: '24h' | '7d' | '30d';
  onChange: (value: '24h' | '7d' | '30d') => void;
}

function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium">{COPY.timeRange.label}</label>
      <Select value={value} onValueChange={(v) => onChange(v as any)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">{COPY.timeRange.day}</SelectItem>
          <SelectItem value="7d">{COPY.timeRange.week}</SelectItem>
          <SelectItem value="30d">{COPY.timeRange.month}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

interface QueueDepthCardProps {
  data: ModerationMetrics['queueDepth'];
}

function QueueDepthCard({ data }: QueueDepthCardProps) {
  return (
    <Card>
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
    </Card>
  );
}

interface ActionDistributionCardProps {
  data: ModerationMetrics['actionDistribution'];
}

function ActionDistributionCard({ data }: ActionDistributionCardProps) {
  const total = data.hide + data.restore + data.remove + data.dismiss;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{COPY.metrics.actionDistribution.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground italic">{COPY.metrics.actionDistribution.noActions}</p>
        ) : (
          <div className="space-y-2">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TimeToDecisionCardProps {
  data: ModerationMetrics['timeToDecision'];
}

function TimeToDecisionCard({ data }: TimeToDecisionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {COPY.metrics.timeToDecision.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.averageHours === null ? (
          <p className="text-sm text-muted-foreground italic">{COPY.metrics.timeToDecision.noDecisions}</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{data.averageHours.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">{COPY.metrics.timeToDecision.unit}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {COPY.metrics.timeToDecision.value} ({data.sampleSize} decisions)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RepeatReportsCardProps {
  data: ModerationMetrics['repeatReports'];
}

function RepeatReportsCard({ data }: RepeatReportsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{COPY.metrics.repeatReports.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.videosWithMultipleReports === 0 ? (
          <p className="text-sm text-muted-foreground italic">{COPY.metrics.repeatReports.noRepeats}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{COPY.metrics.repeatReports.rate}</span>
              <span className="text-2xl font-bold">{data.videosWithMultipleReports}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{COPY.metrics.repeatReports.count}</span>
              <span className="text-lg font-semibold">{data.totalRepeats}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricsDashboardProps {
  metrics: ModerationMetrics;
  onRefresh: () => void;
  canRefresh: boolean;
  isRefreshing: boolean;
}

function MetricsDashboard({ metrics, onRefresh, canRefresh, isRefreshing }: MetricsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {COPY.page.lastUpdated}: {metrics.lastUpdated.toLocaleString()}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={!canRefresh || isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? COPY.page.refreshing : COPY.refresh.button}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QueueDepthCard data={metrics.queueDepth} />
        <ActionDistributionCard data={metrics.actionDistribution} />
        <TimeToDecisionCard data={metrics.timeToDecision} />
        <RepeatReportsCard data={metrics.repeatReports} />
      </div>
    </div>
  );
}

function MetricsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        <p className="text-muted-foreground">{COPY.page.error}</p>
        <Button onClick={onRetry}>{COPY.page.retry}</Button>
      </CardContent>
    </Card>
  );
}

function MetricsEmpty() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">{COPY.page.noData}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function AdminModerationMetricsPage() {
  const [uiState, dispatch] = useReducer(metricsUITransition, { state: 'idle' });
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const { toast } = useToast();

  // Fetch metrics (read-only aggregation from existing data)
  const { data: metrics, isLoading, isError, refetch } = useQuery<ModerationMetrics | null>({
    queryKey: ['/api/admin/moderation-metrics', timeRange],
    queryFn: async () => {
      // For now, derive from existing reported-videos endpoint
      // In production, this would be a dedicated metrics aggregation endpoint
      try {
        const res = await fetch(`/api/admin/reported-videos?status=pending`);
        if (!res.ok) return null;
        const data = await res.json();
        const reports = data.reports || [];

        // Aggregate metrics (simplified for v1)
        const pending = reports.filter((r: any) => r.status === 'pending').length;
        const actionTaken = reports.filter((r: any) => r.status === 'action_taken').length;
        const dismissed = reports.filter((r: any) => r.status === 'dismissed').length;

        // Calculate repeat reports (videos with multiple reports)
        const videoReportCounts = new Map<string, number>();
        reports.forEach((r: any) => {
          const count = videoReportCounts.get(r.storyId) || 0;
          videoReportCounts.set(r.storyId, count + 1);
        });
        const repeats = Array.from(videoReportCounts.values()).filter(count => count >= 2);

        return {
          queueDepth: {
            pending,
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
            totalRepeats: repeats.reduce((sum, count) => sum + count, 0),
          },
          lastUpdated: new Date(),
        };
      } catch {
        return null;
      }
    },
    enabled: uiState.state !== 'idle',
    refetchInterval: false, // Manual refresh only
  });

  // Trigger LOAD on mount and time range changes
  useEffect(() => {
    dispatch({ type: 'LOAD' });
  }, [timeRange]);

  // Map query status to FSM events
  useEffect(() => {
    if (uiState.state === 'loading') {
      if (isError) {
        dispatch({ type: 'LOAD_ERROR' });
      } else if (!isLoading) {
        dispatch({ type: 'LOAD_SUCCESS' });
      }
    }
  }, [isLoading, isError, uiState.state]);

  const handleRefresh = () => {
    const now = Date.now();
    const timeSinceLastRefresh = (now - lastRefreshTime) / 1000;

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

  const handleRetry = () => {
    dispatch({ type: 'LOAD' });
    refetch();
  };

  const canRefresh = uiState.state === 'ready';
  const isRefreshing = uiState.state === 'loading' && lastRefreshTime > 0;

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-background p-6">
      <MetricsHeader />

      <div className="mb-6">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {uiState.state === 'loading' && !isRefreshing && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <span className="ml-3 text-muted-foreground">{COPY.page.loading}</span>
        </div>
      )}

      {uiState.state === 'error' && <MetricsError onRetry={handleRetry} />}

      {(uiState.state === 'ready' || isRefreshing) && (
        <>
          {!metrics ? (
            <MetricsEmpty />
          ) : (
            <MetricsDashboard
              metrics={metrics}
              onRefresh={handleRefresh}
              canRefresh={canRefresh}
              isRefreshing={isRefreshing}
            />
          )}
        </>
      )}
    </div>
  );
}
