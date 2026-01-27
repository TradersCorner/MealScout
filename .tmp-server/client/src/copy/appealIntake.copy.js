/**
 * Appeal Intake v1 — COPY LOCK
 *
 * ALL user-facing copy for moderation appeals MUST come from this file.
 * NO inline strings allowed in the UI.
 *
 * CRITICAL GUARDRAIL:
 * Appeals do not alter moderation outcomes.
 * This is a read-only compliance and transparency surface only.
 *
 * Changes to this copy require legal + product review.
 */
export var APPEAL_INTAKE_COPY = {
    page: {
        title: 'Moderation Appeals',
        subtitle: 'Read-only appeals registry—for transparency and compliance only',
        loading: 'Loading appeals...',
        error: 'Unable to load appeals',
        retry: 'Retry',
        empty: 'No appeals submitted',
    },
    filters: {
        status: {
            label: 'Status',
            all: 'All',
            received: 'Received',
            reviewed: 'Reviewed',
        },
    },
    list: {
        appealId: 'Appeal ID',
        submittedAt: 'Submitted',
        status: 'Status',
        decisionDate: 'Decision date',
        viewDetails: 'View details',
    },
    detail: {
        title: 'Appeal Details',
        close: 'Close',
        appeal: {
            id: 'Appeal ID',
            submittedAt: 'Submitted',
            status: 'Status',
            party: 'Appealing party',
            partyRedacted: 'Redacted ID',
        },
        decision: {
            title: 'Referenced Decision',
            decisionId: 'Decision ID',
            date: 'Decision date',
            action: 'Action taken',
            reason: 'Reason',
            noReason: 'No reason recorded',
        },
        evidence: {
            title: 'Attached Evidence',
            link: 'Evidence link',
            noEvidence: 'No evidence attached',
        },
        disclaimer: 'Appeals are recorded for compliance and transparency. This surface does not modify moderation outcomes.',
    },
    status: {
        received: 'Received',
        reviewed: 'Reviewed',
    },
    actions: {
        hide: 'Hidden',
        restore: 'Restored',
        remove: 'Removed',
    },
};
