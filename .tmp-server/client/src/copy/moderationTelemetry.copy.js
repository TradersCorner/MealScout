/**
 * Moderation Telemetry v1 — COPY LOCK
 *
 * ALL user-facing copy for moderation metrics MUST come from this file.
 * NO inline strings allowed in the UI.
 *
 * Changes to this copy require product review.
 * Metrics are observational only—no prescriptive language, no performance ranking.
 */
export var MODERATION_TELEMETRY_COPY = {
    page: {
        title: 'Moderation Metrics',
        subtitle: 'Read-only operational metrics from existing reports and actions',
        loading: 'Loading metrics...',
        error: 'Unable to load metrics',
        retry: 'Retry',
        noData: 'No moderation data available for this time period',
        lastUpdated: 'Last updated',
        refreshing: 'Refreshing...',
    },
    timeRange: {
        label: 'Time range',
        day: 'Last 24 hours',
        week: 'Last 7 days',
        month: 'Last 30 days',
    },
    metrics: {
        queueDepth: {
            title: 'Queue Status',
            pending: 'Pending',
            resolved: 'Resolved',
            total: 'Total reports',
        },
        actionDistribution: {
            title: 'Action Distribution',
            hide: 'Hidden',
            restore: 'Restored',
            remove: 'Removed',
            dismiss: 'Dismissed',
            noActions: 'No actions taken in this period',
        },
        timeToDecision: {
            title: 'Average Time to Decision',
            value: 'Average',
            unit: 'hours',
            noDecisions: 'No decisions in this period',
        },
        repeatReports: {
            title: 'Repeat Reports',
            rate: 'Videos with 2+ reports',
            count: 'Repeat report count',
            noRepeats: 'No repeat reports in this period',
        },
    },
    refresh: {
        button: 'Refresh',
        rateLimited: 'Please wait 30 seconds between refreshes',
    },
};
