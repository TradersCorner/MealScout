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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
export function VideoUploadModal(_a) {
    var _this = this;
    var isOpen = _a.isOpen, onClose = _a.onClose, restaurantId = _a.restaurantId;
    var _b = useState(null), file = _b[0], setFile = _b[1];
    var _c = useState(''), title = _c[0], setTitle = _c[1];
    var _d = useState(''), description = _d[0], setDescription = _d[1];
    var _e = useState([]), hashtags = _e[0], setHashtags = _e[1];
    var _f = useState(''), hashtagInput = _f[0], setHashtagInput = _f[1];
    var _g = useState(false), isLoading = _g[0], setIsLoading = _g[1];
    var _h = useState(''), error = _h[0], setError = _h[1];
    var _j = useState(0), duration = _j[0], setDuration = _j[1];
    var videoRef = useRef(null);
    var _k = useState(null), alreadyRecommended = _k[0], setAlreadyRecommended = _k[1];
    var queryClient = useQueryClient();
    if (!isOpen)
        return null;
    useEffect(function () {
        if (!isOpen || !restaurantId) {
            setAlreadyRecommended(null);
            return;
        }
        var cancelled = false;
        var checkRecommendationStatus = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, data, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/api/stories/recommendation-status?restaurantId=".concat(encodeURIComponent(restaurantId)))];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _b.sent();
                        if (!cancelled) {
                            setAlreadyRecommended(Boolean(data.alreadyRecommended));
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        if (!cancelled) {
                            setAlreadyRecommended(null);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        checkRecommendationStatus();
        return function () {
            cancelled = true;
        };
    }, [isOpen, restaurantId]);
    var handleFileChange = function (e) {
        var _a;
        var selectedFile = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (selectedFile) {
            // Check file size (50MB max)
            if (selectedFile.size > 50 * 1024 * 1024) {
                setError('Video file must be less than 50MB');
                return;
            }
            // Check video duration
            var video_1 = document.createElement('video');
            video_1.onloadedmetadata = function () {
                if (video_1.duration > 30) {
                    setError('Video must be 30 seconds or less');
                    return;
                }
                setDuration(Math.round(video_1.duration));
                setFile(selectedFile);
                setError('');
            };
            video_1.src = URL.createObjectURL(selectedFile);
        }
    };
    var handleAddHashtag = function () {
        if (hashtagInput.trim() && !hashtagInput.startsWith('#')) {
            var tag = "#".concat(hashtagInput.trim());
            if (hashtags.length < 10) {
                setHashtags(__spreadArray(__spreadArray([], hashtags, true), [tag], false));
                setHashtagInput('');
            }
        }
        else if (hashtagInput.trim().startsWith('#')) {
            if (hashtags.length < 10) {
                setHashtags(__spreadArray(__spreadArray([], hashtags, true), [hashtagInput.trim()], false));
                setHashtagInput('');
            }
        }
    };
    var handleRemoveHashtag = function (tag) {
        setHashtags(hashtags.filter(function (t) { return t !== tag; }));
    };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var formData, response, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!file || !title) {
                        setError('Please select a video and enter a title');
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    setError('');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    formData = new FormData();
                    formData.append('video', file);
                    formData.append('title', title);
                    formData.append('description', description);
                    formData.append('duration', String(duration));
                    if (restaurantId) {
                        formData.append('restaurantId', restaurantId);
                    }
                    formData.append('hashtags', JSON.stringify(hashtags));
                    return [4 /*yield*/, fetch('/api/stories/upload', {
                            method: 'POST',
                            body: formData,
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || 'Failed to upload video');
                case 4:
                    // Invalidate feed queries to refresh
                    queryClient.invalidateQueries({ queryKey: ['stories-feed'] });
                    setFile(null);
                    setTitle('');
                    setDescription('');
                    setHashtags([]);
                    onClose();
                    return [3 /*break*/, 7];
                case 5:
                    err_1 = _a.sent();
                    setError(err_1 instanceof Error ? err_1.message : 'Upload failed');
                    return [3 /*break*/, 7];
                case 6:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Share Your Food Story</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (<div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>)}

          {/* Lifetime info */}
          <p className="text-xs text-gray-500">
            Videos appear in MealScout for 7 days.
          </p>

          {/* Duplicate recommendation notice (non-blocking) */}
          {restaurantId && alreadyRecommended && (<p className="text-xs text-amber-600">
              Already recommended — still OK to post, but it won&apos;t increase your recommendation count.
            </p>)}

          {/* Recommendation hint (soft, non-blocking) */}
          {!restaurantId && (<p className="text-xs text-gray-500">
              Tag a restaurant so this counts as a recommendation. You can recommend each restaurant once.
            </p>)}

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video (max 30 seconds, max 50MB)
            </label>
            <input type="file" accept="video/*" onChange={handleFileChange} disabled={isLoading} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            {file && (<p className="mt-2 text-sm text-green-600">
                ✓ Video selected ({duration}s)
              </p>)}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input type="text" value={title} onChange={function (e) { return setTitle(e.target.value.slice(0, 100)); }} placeholder="What did you eat? (max 100 chars)" maxLength={100} disabled={isLoading} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea value={description} onChange={function (e) { return setDescription(e.target.value.slice(0, 500)); }} placeholder="Tell us more about your experience..." maxLength={500} disabled={isLoading} rows={3} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"/>
            <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hashtags (max 10)
            </label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={hashtagInput} onChange={function (e) { return setHashtagInput(e.target.value); }} onKeyPress={function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddHashtag();
            }
        }} placeholder="Add hashtags..." disabled={isLoading || hashtags.length >= 10} className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
              <button type="button" onClick={handleAddHashtag} disabled={isLoading || hashtags.length >= 10} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtags.map(function (tag) { return (<div key={tag} className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-700">
                  {tag}
                  <button type="button" onClick={function () { return handleRemoveHashtag(tag); }} className="text-blue-500 hover:text-blue-700">
                    ✕
                  </button>
                </div>); })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isLoading || !file || !title} className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? 'Uploading...' : 'Share Story'}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
