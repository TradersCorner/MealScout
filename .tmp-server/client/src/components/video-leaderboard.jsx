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
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOptimizedImageUrl } from "@/lib/images";
var LEVEL_NAMES = [
    'Food Taster',
    'Food Explorer',
    'Food Enthusiast',
    'Food Connoisseur',
    'Food Critic',
    'Master Critic',
];
var LEVEL_COLORS = [
    'bg-blue-50 text-blue-700',
    'bg-green-50 text-green-700',
    'bg-yellow-50 text-yellow-700',
    'bg-orange-50 text-orange-700',
    'bg-red-50 text-red-700',
    'bg-purple-50 text-purple-700',
];
export function TopReviewersLeaderboard() {
    var _this = this;
    var _a = useQuery({
        queryKey: ['top-reviewers'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/stories/leaderboards/top-reviewers')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch leaderboard');
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
    }), data = _a.data, isLoading = _a.isLoading, error = _a.error;
    if (isLoading) {
        return (<div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"/>
      </div>);
    }
    if (error) {
        return (<div className="p-4 text-center text-red-600">
        Failed to load leaderboard
      </div>);
    }
    var reviewers = (data === null || data === void 0 ? void 0 : data.topReviewers) || [];
    return (<div className="space-y-2">
      {reviewers.map(function (reviewer, index) {
            var level = Math.min(reviewer.level - 1, LEVEL_COLORS.length - 1);
            return (<div key={reviewer.userId} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition">
            {/* Rank */}
            <div className="text-lg font-bold text-gray-600 w-8 text-center">
              #{index + 1}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              {reviewer.profileImageUrl && (<img src={getOptimizedImageUrl(reviewer.profileImageUrl, "medium")} alt={reviewer.firstName} className="w-full h-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer"/>)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {reviewer.firstName} {reviewer.lastName}
              </p>
              <div className="flex items-center gap-2">
                <span className={"text-xs px-2 py-1 rounded-full font-semibold ".concat(LEVEL_COLORS[level])}>
                  {LEVEL_NAMES[level]}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <p className="font-bold text-lg text-red-500">
                ❤️ {reviewer.totalFavorites}
              </p>
              <p className="text-xs text-gray-600">
                📹 {reviewer.totalStories} stories
              </p>
            </div>
          </div>);
        })}
    </div>);
}
export function TrendingStoriesLeaderboard() {
    var _this = this;
    var _a = useState('week'), timeframe = _a[0], setTimeframe = _a[1];
    var _b = useQuery({
        queryKey: ['trending-stories', timeframe],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/stories/leaderboards/trending?timeframe=".concat(timeframe))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch trending stories');
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
    }), data = _b.data, isLoading = _b.isLoading, error = _b.error;
    if (isLoading) {
        return (<div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"/>
      </div>);
    }
    if (error) {
        return (<div className="p-4 text-center text-red-600">
        Failed to load trending stories
      </div>);
    }
    var stories = (data === null || data === void 0 ? void 0 : data.trending) || [];
    return (<div className="space-y-4">
      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-4">
        {['day', 'week', 'month', 'all'].map(function (tf) { return (<button key={tf} onClick={function () { return setTimeframe(tf); }} className={"px-3 py-1 text-sm rounded-full transition ".concat(timeframe === tf
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}>
            {tf === 'day' && '📅 Today'}
            {tf === 'week' && '📅 This Week'}
            {tf === 'month' && '📅 This Month'}
            {tf === 'all' && '📅 All Time'}
          </button>); })}
      </div>

      {/* Stories List */}
      <div className="space-y-2">
        {stories.map(function (story, index) { return (<div key={story.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition">
            {/* Rank Badge */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-lg">
              {index < 3 ? ['🥇', '🥈', '🥉'][index] : "#".concat(index + 1)}
            </div>

            {/* Story Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{story.title}</p>
              <p className="text-sm text-gray-600">by {story.creatorName}</p>
            </div>

            {/* Stats */}
            <div className="text-right text-sm">
              <p className="font-semibold text-red-500">
                ❤️ {story.likeCount}
              </p>
              <p className="text-gray-600">👁️ {story.viewCount}</p>
            </div>
          </div>); })}
      </div>
    </div>);
}
export function LeaderboardPage() {
    return (<div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">🏆 Food Story Leaderboards</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Reviewers */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">⭐ Top Food Critics</h2>
          <TopReviewersLeaderboard />
        </div>

        {/* Trending Stories */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">🔥 Trending Stories</h2>
          <TrendingStoriesLeaderboard />
        </div>
      </div>

      {/* Reviewer Level Info */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-bold mb-3">📚 Reviewer Levels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {LEVEL_NAMES.map(function (name, idx) { return (<div key={idx} className={"p-2 rounded ".concat(LEVEL_COLORS[idx])}>
              <span className="font-semibold">Level {idx + 1}:</span> {name}
            </div>); })}
        </div>
        <p className="mt-4 text-sm text-gray-700">
          Earn <span className="font-bold">favorites</span> on your video stories
          to level up and unlock golden fork awards!
        </p>
      </div>
    </div>);
}
