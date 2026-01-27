/**
 * Video Feed v1 — COPY LOCK
 * This file is the single source of truth for video feed user-facing text.
 * COPY MUST COME FROM this file.
 * Do NOT inline user-facing strings in video components.
 * Changes here require product + legal review.
 */
export var VIDEO_FEED_COPY = {
    feed: {
        title: "Local Food Videos",
        loading: "Loading videos...",
        empty: "No videos yet. Be the first to recommend a spot.",
        error: "Something went wrong loading videos.",
        retry: "Retry",
        emptyCta: "Share Your Story",
        uploadCta: "Share Your Food Story",
    },
    userVideo: {
        badge: "Recommendation",
        goldenForkNote: "Golden Fork recommendation",
        expiresSoon: "This recommendation expires soon",
        engagement: {
            viewsLabel: "views",
            commentsLabel: "comments",
        },
        actions: {
            like: "Like",
            liked: "Liked",
            comment: "Comment",
        },
        comments: {
            placeholder: "Comments coming soon...",
        },
    },
    restaurantAd: {
        badge: "Sponsored",
        learnMore: "Learn more",
        ctaDefault: "View offer",
    },
};
