import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOptimizedImageUrl } from "@/lib/images";

interface TopReviewer {
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  level: number;
  totalFavorites: number;
  totalStories: number;
}

interface TrendingStory {
  id: string;
  title: string;
  creatorName: string;
  viewCount: number;
  likeCount: number;
}

const LEVEL_NAMES = [
  'Food Taster',
  'Food Explorer',
  'Food Enthusiast',
  'Food Connoisseur',
  'Food Critic',
  'Master Critic',
];

const LEVEL_COLORS = [
  'bg-[color:var(--accent-text)]/10 text-[color:var(--accent-text)]',
  'bg-[color:var(--status-success)]/10 text-[color:var(--status-success)]',
  'bg-yellow-50 text-yellow-700',
  'bg-orange-50 text-orange-700',
  'bg-[color:var(--status-error)]/10 text-[color:var(--status-error)]',
  'bg-purple-50 text-purple-700',
];

export function TopReviewersLeaderboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['top-reviewers'],
    queryFn: async () => {
      const response = await fetch('/api/stories/leaderboards/top-reviewers');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-[color:var(--status-error)]">
        Failed to load leaderboard
      </div>
    );
  }

  const reviewers = data?.topReviewers || [];

  return (
    <div className="space-y-2">
      {reviewers.map((reviewer: TopReviewer, index: number) => {
        const level = Math.min(reviewer.level - 1, LEVEL_COLORS.length - 1);
        return (
          <div
            key={reviewer.userId}
            className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg hover:shadow-clean-lg transition"
          >
            {/* Rank */}
            <div className="text-lg font-bold text-[color:var(--text-muted)] w-8 text-center">
              #{index + 1}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              {reviewer.profileImageUrl && (
                <img
                  src={getOptimizedImageUrl(reviewer.profileImageUrl, "medium")}
                  alt={reviewer.firstName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {reviewer.firstName} {reviewer.lastName}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    LEVEL_COLORS[level]
                  }`}
                >
                  {LEVEL_NAMES[level]}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <p className="font-bold text-lg text-[color:var(--status-error)]">
                ❤️ {reviewer.totalFavorites}
              </p>
              <p className="text-xs text-[color:var(--text-muted)]">
                📹 {reviewer.totalStories} stories
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TrendingStoriesLeaderboard() {
  const [timeframe, setTimeframe] = useState('week');

  const { data, isLoading, error } = useQuery({
    queryKey: ['trending-stories', timeframe],
    queryFn: async () => {
      const response = await fetch(
        `/api/stories/leaderboards/trending?timeframe=${timeframe}`
      );
      if (!response.ok) throw new Error('Failed to fetch trending stories');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-[color:var(--status-error)]">
        Failed to load trending stories
      </div>
    );
  }

  const stories = data?.trending || [];

  return (
    <div className="space-y-4">
      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-4">
        {(['day', 'week', 'month', 'all'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1 text-sm rounded-full transition ${
              timeframe === tf
                ? 'bg-[color:var(--accent-text)] text-white'
                : 'bg-[var(--bg-subtle)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            {tf === 'day' && '📅 Today'}
            {tf === 'week' && '📅 This Week'}
            {tf === 'month' && '📅 This Month'}
            {tf === 'all' && '📅 All Time'}
          </button>
        ))}
      </div>

      {/* Stories List */}
      <div className="space-y-2">
        {stories.map((story: TrendingStory, index: number) => (
          <div
            key={story.id}
            className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg hover:shadow-clean-lg transition"
          >
            {/* Rank Badge */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-lg">
              {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
            </div>

            {/* Story Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{story.title}</p>
              <p className="text-sm text-[color:var(--text-muted)]">by {story.creatorName}</p>
            </div>

            {/* Stats */}
            <div className="text-right text-sm">
              <p className="font-semibold text-[color:var(--status-error)]">
                ❤️ {story.likeCount}
              </p>
              <p className="text-[color:var(--text-muted)]">👁️ {story.viewCount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardPage() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">🏆 Food Story Leaderboards</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Reviewers */}
        <div className="bg-[var(--bg-surface)] p-6 rounded-lg border border-[var(--border-subtle)]">
          <h2 className="text-xl font-bold mb-4">⭐ Top Food Critics</h2>
          <TopReviewersLeaderboard />
        </div>

        {/* Trending Stories */}
        <div className="bg-[var(--bg-surface)] p-6 rounded-lg border border-[var(--border-subtle)]">
          <h2 className="text-xl font-bold mb-4">🔥 Trending Stories</h2>
          <TrendingStoriesLeaderboard />
        </div>
      </div>

      {/* Reviewer Level Info */}
      <div className="mt-8 bg-[color:var(--accent-text)]/10 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-bold mb-3">📚 Reviewer Levels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {LEVEL_NAMES.map((name, idx) => (
            <div
              key={idx}
              className={`p-2 rounded ${LEVEL_COLORS[idx]}`}
            >
              <span className="font-semibold">Level {idx + 1}:</span> {name}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
          Earn <span className="font-bold">favorites</span> on your video stories
          to level up and unlock golden fork awards!
        </p>
      </div>
    </div>
  );
}

