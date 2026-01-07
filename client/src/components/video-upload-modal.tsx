import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId?: string;
}

export function VideoUploadModal({
  isOpen,
  onClose,
  restaurantId,
}: VideoUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [alreadyRecommended, setAlreadyRecommended] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  useEffect(() => {
    if (!isOpen || !restaurantId) {
      setAlreadyRecommended(null);
      return;
    }

    let cancelled = false;

    const checkRecommendationStatus = async () => {
      try {
        const response = await fetch(
          `/api/stories/recommendation-status?restaurantId=${encodeURIComponent(restaurantId)}`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setAlreadyRecommended(Boolean(data.alreadyRecommended));
        }
      } catch {
        if (!cancelled) {
          setAlreadyRecommended(null);
        }
      }
    };

    checkRecommendationStatus();

    return () => {
      cancelled = true;
    };
  }, [isOpen, restaurantId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('Video file must be less than 50MB');
        return;
      }

      // Check video duration
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        if (video.duration < 10 || video.duration > 15) {
          setError('Video must be between 10 and 15 seconds');
          return;
        }
        setDuration(Math.round(video.duration));
        setFile(selectedFile);
        setError('');
      };
      video.src = URL.createObjectURL(selectedFile);
    }
  };

  const handleAddHashtag = () => {
    if (hashtagInput.trim() && !hashtagInput.startsWith('#')) {
      const tag = `#${hashtagInput.trim()}`;
      if (hashtags.length < 10) {
        setHashtags([...hashtags, tag]);
        setHashtagInput('');
      }
    } else if (hashtagInput.trim().startsWith('#')) {
      if (hashtags.length < 10) {
        setHashtags([...hashtags, hashtagInput.trim()]);
        setHashtagInput('');
      }
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setError('Please select a video and enter a title');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('duration', String(duration));
      if (restaurantId) {
        formData.append('restaurantId', restaurantId);
      }
      formData.append('hashtags', JSON.stringify(hashtags));

      const response = await fetch('/api/stories/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to upload video');
      }

      // Invalidate feed queries to refresh
      queryClient.invalidateQueries({ queryKey: ['stories-feed'] });

      setFile(null);
      setTitle('');
      setDescription('');
      setHashtags([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Share Your Food Story</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Lifetime info */}
          <p className="text-xs text-gray-500">
            Videos appear in MealScout for 7 days.
          </p>

          {/* Duplicate recommendation notice (non-blocking) */}
          {restaurantId && alreadyRecommended && (
            <p className="text-xs text-amber-600">
              Already recommended — still OK to post, but it won&apos;t increase your recommendation count.
            </p>
          )}

          {/* Recommendation hint (soft, non-blocking) */}
          {!restaurantId && (
            <p className="text-xs text-gray-500">
              Tag a restaurant so this counts as a recommendation. You can recommend each restaurant once.
            </p>
          )}

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video (10-15 seconds, max 50MB)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={isLoading}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {file && (
              <p className="mt-2 text-sm text-green-600">
                ✓ Video selected ({duration}s)
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="What did you eat? (max 100 chars)"
              maxLength={100}
              disabled={isLoading}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Tell us more about your experience..."
              maxLength={500}
              disabled={isLoading}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hashtags (max 10)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddHashtag();
                  }
                }}
                placeholder="Add hashtags..."
                disabled={isLoading || hashtags.length >= 10}
                className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddHashtag}
                disabled={isLoading || hashtags.length >= 10}
                className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveHashtag(tag)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !file || !title}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Uploading...' : 'Share Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
