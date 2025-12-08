import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

interface VideoStory {
  id: string;
  userId: string;
  restaurantId?: string;
  title: string;
  description?: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface StoryCardProps {
  story: VideoStory & { userLiked?: boolean };
  isVisible: boolean;
}

function StoryCard({ story, isVisible }: StoryCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(story.userLiked || false);
  const [likeCount, setLikeCount] = useState(story.likeCount);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const watchStartRef = useRef<number>(0);

  useEffect(() => {
    if (!videoRef.current || !isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play();
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [isVisible]);

  const handlePlay = () => {
    watchStartRef.current = Date.now();
  };

  const handleEnded = async () => {
    const watchDuration = Math.round((Date.now() - watchStartRef.current) / 1000);
    try {
      await fetch(`/api/stories/${story.id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchDuration }),
      });
    } catch (err) {
      console.error('Error recording view:', err);
    }
  };

  const handleLike = async () => {
    setIsLoadingLike(true);
    try {
      const response = await fetch(`/api/stories/${story.id}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikeCount((prev) => (data.liked ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch (err) {
      console.error('Error liking story:', err);
    } finally {
      setIsLoadingLike(false);
    }
  };

  return (
    <div className="bg-black text-white rounded-lg overflow-hidden mb-4">
      {/* Video */}
      <div className="relative bg-black aspect-[9/16] flex items-center justify-center">
        <video
          ref={videoRef}
          src={story.videoUrl}
          poster={story.thumbnailUrl}
          onPlay={handlePlay}
          onEnded={handleEnded}
          controls
          className="w-full h-full object-cover"
        />
      </div>

      {/* Story Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{story.title}</h3>
        {story.description && (
          <p className="text-gray-300 text-sm mb-3 line-clamp-2">
            {story.description}
          </p>
        )}

        {/* Engagement Stats */}
        <div className="flex gap-4 mb-4 text-sm text-gray-300">
          <div>👁️ {story.viewCount} views</div>
          <div>💬 {story.commentCount} comments</div>
        </div>

        {/* Interaction Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleLike}
            disabled={isLoadingLike}
            className={`flex-1 py-2 px-4 rounded font-medium transition ${
              liked
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            } disabled:opacity-50`}
          >
            {liked ? '❤️ Liked' : '🍴 Like'} {likeCount > 0 && `(${likeCount})`}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded font-medium transition"
          >
            💬 Comment
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <p className="text-sm text-gray-400">Comments coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface VideoFeedProps {
  onUploadClick?: () => void;
}

export function VideoFeed({ onUploadClick }: VideoFeedProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['stories-feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/stories/feed?page=${pageParam}`);
      if (!response.ok) throw new Error('Failed to fetch stories');
      return response.json();
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length : undefined,
    initialPageParam: 0,
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === 'pending') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Failed to load stories</p>
      </div>
    );
  }

  const stories = data?.pages.flatMap((page) => page.stories) || [];

  if (stories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No stories yet. Be the first!</p>
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📹 Share Your Story
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Upload Button */}
      {onUploadClick && (
        <button
          onClick={onUploadClick}
          className="w-full mb-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition"
        >
          📹 Share Your Food Story
        </button>
      )}

      {/* Stories Feed */}
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          isVisible={true}
        />
      ))}

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerTarget} />
    </div>
  );
}
