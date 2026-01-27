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
import React, { useState, useEffect, useRef, useReducer } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { VIDEO_FEED_COPY as COPY } from '@/copy/videoFeed.copy';
import ShareButton from '@/components/share-button';
function assertNever(x) {
    throw new Error("Unhandled case: ".concat(JSON.stringify(x)));
}
function videoFeedTransition(state, event) {
    switch (state.state) {
        case 'idle':
            if (event.type === 'LOAD_FEED')
                return { state: 'loading' };
            return state;
        case 'loading':
            if (event.type === 'LOAD_SUCCESS')
                return { state: 'ready' };
            if (event.type === 'LOAD_ERROR')
                return { state: 'error' };
            return state;
        case 'error':
            if (event.type === 'RETRY')
                return { state: 'loading' };
            return state;
        case 'ready':
            return state;
        default:
            return assertNever(state);
    }
}
function UserVideoCard(_a) {
    var _this = this;
    var video = _a.video, isVisible = _a.isVisible;
    var videoRef = useRef(null);
    var _b = useState(!!video.userLiked), liked = _b[0], setLiked = _b[1];
    var _c = useState(video.likeCount), likeCount = _c[0], setLikeCount = _c[1];
    var _d = useState(false), isLoadingLike = _d[0], setIsLoadingLike = _d[1];
    var _e = useState(false), showComments = _e[0], setShowComments = _e[1];
    var watchStartRef = useRef(0);
    useEffect(function () {
        if (!videoRef.current || !isVisible)
            return;
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var _a, _b;
                if (entry.isIntersecting) {
                    (_a = videoRef.current) === null || _a === void 0 ? void 0 : _a.play();
                }
                else {
                    (_b = videoRef.current) === null || _b === void 0 ? void 0 : _b.pause();
                }
            });
        }, { threshold: 0.5 });
        observer.observe(videoRef.current);
        return function () { return observer.disconnect(); };
    }, [isVisible]);
    var handlePlay = function () {
        watchStartRef.current = Date.now();
    };
    var handleEnded = function () { return __awaiter(_this, void 0, void 0, function () {
        var watchDuration, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    watchDuration = Math.round((Date.now() - watchStartRef.current) / 1000);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/stories/".concat(video.videoId, "/view"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ watchDuration: watchDuration }),
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error('Error recording view:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleLike = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data_1, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoadingLike(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch("/api/stories/".concat(video.videoId, "/like"), {
                            method: 'POST',
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data_1 = _a.sent();
                    setLiked(data_1.liked);
                    setLikeCount(function (prev) { return (data_1.liked ? prev + 1 : Math.max(0, prev - 1)); });
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    err_2 = _a.sent();
                    console.error('Error liking story:', err_2);
                    return [3 /*break*/, 7];
                case 6:
                    setIsLoadingLike(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="bg-black text-white rounded-lg overflow-hidden mb-4">
      {/* Video */}
      <div className="relative bg-black aspect-[9/16] flex items-center justify-center">
        <video ref={videoRef} src={video.videoUrl} poster={video.thumbnailUrl} onPlay={handlePlay} onEnded={handleEnded} controls className="w-full h-full object-cover"/>
      </div>

      {/* Story Info */}
      <div className="p-4">
        {video.isRecommendation && (<div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/40">
              {COPY.userVideo.badge}
            </span>
          </div>)}
        <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
        {video.description && (<p className="text-gray-300 text-sm mb-3 line-clamp-2">
            {video.description}
          </p>)}

        {/* Engagement Stats */}
        <div className="flex gap-4 mb-4 text-sm text-gray-300">
          <div>
            👁️ {video.viewCount} {COPY.userVideo.engagement.viewsLabel}
          </div>
          <div>
            💬 {video.commentCount} {COPY.userVideo.engagement.commentsLabel}
          </div>
        </div>

        {/* Interaction Buttons */}
        <div className="flex gap-3">
          <button onClick={handleLike} disabled={isLoadingLike} className={"flex-1 py-2 px-4 rounded font-medium transition ".concat(liked
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gray-700 hover:bg-gray-600', " disabled:opacity-50")}>
            {liked ? "\u2764\uFE0F ".concat(COPY.userVideo.actions.liked) : "\uD83C\uDF74 ".concat(COPY.userVideo.actions.like)} {likeCount > 0 && "(".concat(likeCount, ")")}
          </button>
          <button onClick={function () { return setShowComments(!showComments); }} className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded font-medium transition">
            💬 {COPY.userVideo.actions.comment}
          </button>
        </div>
        <div className="mt-3">
          <ShareButton url={"/video/".concat(video.videoId)} title={video.title || "Food recommendation"} description={video.description || "Watch this food recommendation on MealScout."} size="sm" variant="outline" className="w-full justify-center"/>
        </div>

        {/* Comments Section */}
        {showComments && (<div className="mt-4 pt-4 border-t border-gray-600">
            <p className="text-sm text-gray-400">{COPY.userVideo.comments.placeholder}</p>
          </div>)}
      </div>
    </div>);
}
function RestaurantAdCard(_a) {
    var video = _a.video;
    return (<div className="bg-gray-950 text-white rounded-lg overflow-hidden mb-4 border border-gray-800">
      <div className="relative bg-black aspect-[9/16] flex items-center justify-center">
        {video.mediaUrl ? (<video src={video.mediaUrl} className="w-full h-full object-cover" muted loop playsInline controls/>) : (<div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
            {video.title}
          </div>)}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-gray-900/80 text-xs uppercase tracking-wide border border-gray-600">
          {COPY.restaurantAd.badge}
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-base">{video.title}</h3>
        {video.affiliateName && (<p className="text-xs text-gray-400">{video.affiliateName}</p>)}
        <div className="pt-2">
          <a href={video.targetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-100 text-gray-900 text-sm font-semibold hover:bg-white transition">
            {video.ctaText || COPY.restaurantAd.learnMore}
          </a>
        </div>
        <ShareButton url={"/video/".concat(video.videoId)} title={video.title || "Food video"} description="Watch this video on MealScout." size="sm" variant="outline" className="w-full justify-center"/>
      </div>
    </div>);
}
export function VideoFeed(_a) {
    var _this = this;
    var onUploadClick = _a.onUploadClick;
    var _b = useReducer(videoFeedTransition, { state: 'idle' }), feedState = _b[0], dispatch = _b[1];
    var _c = useInfiniteQuery({
        queryKey: ['stories-feed'],
        queryFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var response;
            var _c = _b.pageParam, pageParam = _c === void 0 ? 0 : _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, fetch("/api/stories/feed?page=".concat(pageParam))];
                    case 1:
                        response = _d.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch stories');
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        getNextPageParam: function (lastPage, pages) {
            return lastPage.hasMore ? pages.length : undefined;
        },
        initialPageParam: 0,
    }), data = _c.data, fetchNextPage = _c.fetchNextPage, hasNextPage = _c.hasNextPage, isFetchingNextPage = _c.isFetchingNextPage, status = _c.status;
    var observerTarget = useRef(null);
    useEffect(function () {
        if (status === 'pending') {
            dispatch({ type: 'LOAD_FEED' });
        }
        else if (status === 'success') {
            dispatch({ type: 'LOAD_SUCCESS' });
        }
        else if (status === 'error') {
            dispatch({ type: 'LOAD_ERROR' });
        }
    }, [status]);
    useEffect(function () {
        var observer = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }, { threshold: 0.1 });
        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }
        return function () { return observer.disconnect(); };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    if (feedState.state === 'loading') {
        return (<div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" aria-label={COPY.feed.loading}/>
      </div>);
    }
    if (feedState.state === 'error') {
        return (<div className="p-6 text-center">
        <p className="text-red-600 mb-4">{COPY.feed.error}</p>
        <button type="button" onClick={function () {
                dispatch({ type: 'RETRY' });
                // Let react-query refetch using its existing behavior
                void fetchNextPage();
            }} className="inline-flex items-center px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition">
          {COPY.feed.retry}
        </button>
      </div>);
    }
    var stories = (data === null || data === void 0 ? void 0 : data.pages.flatMap(function (page) { return page.stories; })) || [];
    var feedItems = stories.reduce(function (acc, item) {
        var _a, _b, _c, _d, _e;
        if (!item)
            return acc;
        if (item.__type === 'ad' && item.targetUrl) {
            var adVideo = {
                kind: 'restaurant',
                videoId: item.id,
                campaignId: item.id,
                title: item.title,
                mediaUrl: item.mediaUrl,
                targetUrl: item.targetUrl,
                ctaText: item.ctaText || COPY.restaurantAd.ctaDefault,
                isHouseAd: item.isHouseAd,
                isAffiliate: item.isAffiliate,
                affiliateName: (_a = item.affiliateName) !== null && _a !== void 0 ? _a : undefined,
            };
            acc.push(adVideo);
            return acc;
        }
        if (item.videoUrl) {
            var userVideo = {
                kind: 'user',
                videoId: item.id,
                restaurantId: item.restaurantId,
                isRecommendation: (_b = item.isRecommendation) !== null && _b !== void 0 ? _b : false,
                title: item.title,
                description: item.description,
                duration: item.duration,
                videoUrl: item.videoUrl,
                thumbnailUrl: item.thumbnailUrl,
                viewCount: (_c = item.viewCount) !== null && _c !== void 0 ? _c : 0,
                likeCount: (_d = item.likeCount) !== null && _d !== void 0 ? _d : 0,
                commentCount: (_e = item.commentCount) !== null && _e !== void 0 ? _e : 0,
                createdAt: item.createdAt,
                userLiked: item.userLiked,
                expiresAt: item.expiresAt,
            };
            acc.push(userVideo);
        }
        return acc;
    }, []);
    if (feedItems.length === 0) {
        return (<div className="text-center py-12">
        <p className="text-gray-500 mb-4">{COPY.feed.empty}</p>
        {onUploadClick && (<button onClick={onUploadClick} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            📹 {COPY.feed.emptyCta}
          </button>)}
      </div>);
    }
    return (<div className="max-w-md mx-auto">
      {/* Upload Button */}
      {onUploadClick && (<button onClick={onUploadClick} className="w-full mb-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition">
          📹 {COPY.feed.uploadCta}
        </button>)}

      {/* Stories Feed */}
      {feedItems.map(function (item) {
            return item.kind === 'user' ? (<UserVideoCard key={item.videoId} video={item} isVisible={true}/>) : (<RestaurantAdCard key={item.videoId} video={item}/>);
        })}

      {/* Loading indicator */}
      {isFetchingNextPage && (<div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"/>
        </div>)}

      {/* Intersection observer target */}
      <div ref={observerTarget}/>
    </div>);
}
