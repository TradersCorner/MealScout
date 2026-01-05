/**
 * Admin Moderation v1 — COPY LOCK
 * 
 * ALL user-facing copy for admin video moderation MUST come from this file.
 * NO inline strings allowed in the UI.
 * 
 * Changes to this copy require product + legal review.
 * This is authority-gating copy—it defines what admins can and cannot do.
 */

export const ADMIN_MODERATION_COPY = {
  page: {
    title: 'Content Moderation',
    empty: 'No videos match the current filters.',
    error: 'Unable to load moderation queue.',
    retry: 'Retry',
    loading: 'Loading moderation queue...',
  },

  filters: {
    type: {
      label: 'Type',
      all: 'All',
      user: 'User Recommendations',
      restaurant: 'Restaurant Ads',
    },
    status: {
      label: 'Status',
      all: 'All',
      visible: 'Visible',
      hidden: 'Hidden',
      removed: 'Removed',
    },
    reason: {
      label: 'Reason',
      none: 'None',
    },
  },

  actions: {
    hide: 'Hide',
    restore: 'Restore',
    remove: 'Remove',
    confirmRemove: 'Remove permanently',
    cancel: 'Cancel',
  },

  reasons: {
    spam: 'Spam',
    inappropriate: 'Inappropriate',
    misleading: 'Misleading',
    policy: 'Policy violation',
  },

  labels: {
    recommendation: 'Recommendation',
    sponsored: 'Sponsored',
    goldenFork: '🍴 Golden Fork',
    reviewer: 'Reviewer',
    restaurant: 'Restaurant',
    campaign: 'Campaign',
    status: 'Status',
    internalNote: 'Internal note (admin only)',
    selectReason: 'Select removal reason',
  },

  confirm: {
    removeTitle: 'Remove video permanently?',
    removeDescription: 'This action cannot be undone. The video will be permanently removed from the platform.',
  },

  notifications: {
    hideSuccess: 'Video hidden from feed',
    restoreSuccess: 'Video restored to feed',
    removeSuccess: 'Video permanently removed',
    actionError: 'Action failed. Please try again.',
  },

  evidence: {
    toggle: 'View evidence',
    toggleHide: 'Hide evidence',
    reportCount: 'Reports',
    reportTimestamps: 'Report dates',
    reportersRedacted: 'Reporter IDs',
    priorActions: 'Prior moderation',
    videoAge: 'Video created',
    views: 'Views',
    likes: 'Likes',
    noEvidence: 'No evidence available',
    noPriorActions: 'No prior actions',
    action: {
      hide: 'Hidden',
      restore: 'Restored',
      remove: 'Removed',
    },
  },

  batch: {
    selectionMode: 'Selection mode',
    exitSelection: 'Exit selection',
    selected: (count: number) => `${count} selected`,
    batchHide: 'Hide selected',
    batchRestore: 'Restore selected',
    noRemove: 'Remove is single-item only',
    perItemReasonTitle: 'Assign reasons',
    perItemReasonDescription: 'Each item requires an individual reason. Batch actions do not bypass review.',
    assignReason: 'Assign reason',
    reasonAssigned: 'Reason assigned',
    reasonRequired: 'Reason required',
    executeAction: 'Execute',
    cancelBatch: 'Cancel',
    processing: (current: number, total: number) => `Processing ${current} of ${total}...`,
    partialSuccess: (succeeded: number, failed: number) => 
      `${succeeded} succeeded, ${failed} failed`,
    allSuccess: (count: number) => `All ${count} items processed successfully`,
    allFailed: 'All items failed to process',
    minSelection: 'Select at least one item',
    allReasonsRequired: 'All items must have assigned reasons',
  },
} as const;

export type AdminModerationCopy = typeof ADMIN_MODERATION_COPY;

/**
 * Keys that gate admin authority.
 * Changes to these require explicit approval.
 */
export type CriticalModerationKeys =
  | 'actions.hide'
  | 'actions.restore'
  | 'actions.remove'
  | 'actions.confirmRemove'
  | 'reasons.spam'
  | 'reasons.inappropriate'
  | 'reasons.misleading'
  | 'reasons.policy'
  | 'batch.batchHide'
  | 'batch.batchRestore'
  | 'batch.noRemove'
  | 'batch.perItemReasonDescription'
  | 'batch.allReasonsRequired';
