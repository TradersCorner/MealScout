var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { db } from './db.js';
import { isAuthenticated } from './unifiedAuth.js';
import { videoStories, storyLikes, storyComments, storyViews, storyAwards, userReviewerLevels, insertVideoStorySchema, restaurantSubscriptions, feedAds, restaurants, users, } from '@shared/schema';
import { eq, desc, and, lte, sql, count, gte, or, isNull, isNotNull } from 'drizzle-orm';
import { uploadToCloudinary, deleteFromCloudinary } from './imageUpload.js';
import multer from 'multer';
import { storage } from './storage.js';
import { LISA_CLAIM_TYPES, LISA_CLAIM_SOURCES } from '@shared/schema';
// Configure multer for video uploads
var videoStorage = multer.memoryStorage();
var videoUpload = multer({
    storage: videoStorage,
    fileFilter: function (_req, file, cb) {
        // Accept video files
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only video files are allowed'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    },
});
export default function setupStoriesRoutes(app) {
    var _this = this;
    // POST - Upload video story
    app.post('/api/stories/upload', isAuthenticated, videoUpload.single('video'), function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, bodyData, hasRestaurant, subscription, sub, isPaidTier, hasLifetime, now, oneDayAgo, dayCount, restaurantDayCount, validationResult, cloudinaryResult, story, existingLevel, distinctRestaurants, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 17, , 18]);
                    if (!req.file) {
                        return [2 /*return*/, res.status(400).json({ message: 'No video file provided' })];
                    }
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ message: 'Unauthorized' })];
                    }
                    bodyData = {
                        title: req.body.title,
                        description: req.body.description || null,
                        duration: parseInt(req.body.duration),
                        restaurantId: req.body.restaurantId || null,
                        hashtags: req.body.hashtags ? JSON.parse(req.body.hashtags) : [],
                        cuisine: req.body.cuisine || null,
                    };
                    // Enforce 30-second maximum duration
                    if (bodyData.duration > 30) {
                        return [2 /*return*/, res.status(400).json({ message: 'Video duration must be 30 seconds or less' })];
                    }
                    hasRestaurant = Boolean(bodyData.restaurantId);
                    if (!bodyData.restaurantId) return [3 /*break*/, 5];
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurantSubscriptions)
                            .where(eq(restaurantSubscriptions.restaurantId, bodyData.restaurantId))
                            .limit(1)];
                case 1:
                    subscription = _b.sent();
                    if (!(subscription.length === 0)) return [3 /*break*/, 3];
                    // No subscription - create free tier record but block posting
                    return [4 /*yield*/, db.insert(restaurantSubscriptions).values({
                            restaurantId: bodyData.restaurantId,
                            tier: 'free',
                            status: 'active',
                            priceCents: 0,
                            billingInterval: 'monthly',
                            canPostVideos: false,
                            canPostDeals: false,
                            canUseFeaturedSlots: false,
                            maxFeaturedSlots: 0,
                            hasAnalytics: false,
                            hasDealScheduling: false,
                        })];
                case 2:
                    // No subscription - create free tier record but block posting
                    _b.sent();
                    return [2 /*return*/, res.status(403).json({
                            message: 'A paid plan is required to post restaurant videos. Current plan: $25/mo.',
                        })];
                case 3:
                    sub = subscription[0];
                    isPaidTier = ['monthly', 'quarterly', 'yearly'].includes(sub.tier);
                    hasLifetime = sub.isLifetimeFree === true;
                    if (!hasLifetime && !isPaidTier) {
                        return [2 /*return*/, res.status(403).json({
                                message: 'Restaurant subscription does not allow video posts. Upgrade to Monthly ($25).',
                            })];
                    }
                    if (!!sub.canPostVideos) return [3 /*break*/, 5];
                    return [4 /*yield*/, db
                            .update(restaurantSubscriptions)
                            .set({
                            canPostVideos: true,
                            canPostDeals: true,
                            canUseFeaturedSlots: true,
                            maxFeaturedSlots: 3,
                            hasAnalytics: true,
                            hasDealScheduling: false,
                            updatedAt: new Date(),
                        })
                            .where(eq(restaurantSubscriptions.id, sub.id))];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    now = new Date();
                    oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, db
                            .select({ count: count() })
                            .from(videoStories)
                            .where(and(eq(videoStories.userId, userId), gte(videoStories.createdAt, oneDayAgo)))];
                case 6:
                    dayCount = (_b.sent())[0].count;
                    // Limit: 3 uploads per user per rolling 24 hours
                    if ((dayCount || 0) >= 3) {
                        return [2 /*return*/, res.status(429).json({ message: 'Upload limit reached: max 3 videos per 24 hours. Please try again later.' })];
                    }
                    if (!bodyData.restaurantId) return [3 /*break*/, 8];
                    return [4 /*yield*/, db
                            .select({ count: count() })
                            .from(videoStories)
                            .where(and(eq(videoStories.restaurantId, bodyData.restaurantId), gte(videoStories.createdAt, oneDayAgo)))];
                case 7:
                    restaurantDayCount = (_b.sent())[0].count;
                    if ((restaurantDayCount || 0) >= 3) {
                        return [2 /*return*/, res.status(429).json({ message: 'Restaurant daily limit reached: max 3 videos per day. Please wait ~6 hours before uploading again.' })];
                    }
                    _b.label = 8;
                case 8:
                    validationResult = insertVideoStorySchema.safeParse(bodyData);
                    if (!validationResult.success) {
                        return [2 /*return*/, res.status(400).json({
                                message: 'Invalid input',
                                errors: validationResult.error.flatten(),
                            })];
                    }
                    return [4 /*yield*/, uploadToCloudinary(req.file.buffer, 'video', {
                            folder: 'mealscout/stories',
                            public_id: "story-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)),
                        })];
                case 9:
                    cloudinaryResult = _b.sent();
                    if (!cloudinaryResult.secureUrl) {
                        return [2 /*return*/, res.status(500).json({ message: 'Failed to upload video' })];
                    }
                    return [4 /*yield*/, db
                            .insert(videoStories)
                            .values({
                            userId: userId,
                            restaurantId: bodyData.restaurantId,
                            title: bodyData.title,
                            description: bodyData.description,
                            duration: bodyData.duration,
                            videoUrl: cloudinaryResult.secureUrl,
                            thumbnailUrl: cloudinaryResult.thumbnailUrl || undefined,
                            cuisine: bodyData.cuisine,
                            hashtags: bodyData.hashtags,
                            status: 'ready', // For MVP, we skip encoding - use Cloudinary's optimization
                        })
                            .returning()];
                case 10:
                    story = _b.sent();
                    return [4 /*yield*/, db
                            .select()
                            .from(userReviewerLevels)
                            .where(eq(userReviewerLevels.userId, userId))
                            .limit(1)];
                case 11:
                    existingLevel = _b.sent();
                    return [4 /*yield*/, db
                            .select({ count: sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["COUNT(DISTINCT ", ")"], ["COUNT(DISTINCT ", ")"])), videoStories.restaurantId).mapWith(Number) })
                            .from(videoStories)
                            .where(and(eq(videoStories.userId, userId), isNotNull(videoStories.restaurantId)))];
                case 12:
                    distinctRestaurants = (_b.sent())[0].count;
                    if (!(existingLevel.length === 0)) return [3 /*break*/, 14];
                    return [4 /*yield*/, db.insert(userReviewerLevels).values({
                            userId: userId,
                            level: 1,
                            // totalStories = distinct restaurants ever recommended (durable)
                            totalStories: distinctRestaurants,
                        })];
                case 13:
                    _b.sent();
                    return [3 /*break*/, 16];
                case 14: 
                // Keep totalStories in sync with durable distinct restaurant recommendations
                return [4 /*yield*/, db
                        .update(userReviewerLevels)
                        .set({
                        totalStories: distinctRestaurants,
                    })
                        .where(eq(userReviewerLevels.userId, userId))];
                case 15:
                    // Keep totalStories in sync with durable distinct restaurant recommendations
                    _b.sent();
                    _b.label = 16;
                case 16:
                    // LISA Phase 4A: Emit claim for video recommendation creation
                    storage.emitClaim({
                        subjectType: 'video',
                        subjectId: story[0].id,
                        actorType: 'user',
                        actorId: userId,
                        app: 'mealscout',
                        claimType: LISA_CLAIM_TYPES.VIDEO_RECOMMENDATION_CREATED,
                        claimValue: {
                            restaurantId: bodyData.restaurantId,
                            cuisine: bodyData.cuisine,
                            hashtags: bodyData.hashtags,
                            duration: bodyData.duration,
                        },
                        source: LISA_CLAIM_SOURCES.USER,
                    }).catch(function (err) { return console.error('Failed to emit LISA claim:', err); });
                    res.status(201).json({
                        message: 'Video story uploaded successfully',
                        story: story[0],
                    });
                    return [3 /*break*/, 18];
                case 17:
                    error_1 = _b.sent();
                    console.error('Error uploading video story:', error_1);
                    res.status(500).json({ message: 'Failed to upload video story' });
                    return [3 /*break*/, 18];
                case 18: return [2 /*return*/];
            }
        });
    }); });
    // GET - Recommendation status (read-only, durable semantics)
    // Returns whether the user has ever recommended this restaurant via a tagged video.
    app.get('/api/stories/recommendation-status', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, restaurantId, existingCount, alreadyRecommended, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    restaurantId = req.query.restaurantId;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ message: 'Unauthorized' })];
                    }
                    if (!restaurantId) {
                        return [2 /*return*/, res.status(400).json({ message: 'restaurantId is required' })];
                    }
                    return [4 /*yield*/, db
                            .select({ count: sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["COUNT(*)"], ["COUNT(*)"]))).mapWith(Number) })
                            .from(videoStories)
                            .where(and(eq(videoStories.userId, userId), eq(videoStories.restaurantId, restaurantId)))];
                case 1:
                    existingCount = (_b.sent())[0].count;
                    alreadyRecommended = (existingCount || 0) > 0;
                    return [2 /*return*/, res.json({ alreadyRecommended: alreadyRecommended })];
                case 2:
                    error_2 = _b.sent();
                    console.error('Error checking recommendation status:', error_2);
                    return [2 /*return*/, res.status(500).json({ message: 'Failed to check recommendation status' })];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // GET - Feed (infinite scroll)
    // Feed algorithm: 30% community (recent), 20% featured (sponsored), 20% trending, 20% nearby, 10% discovery
    app.get('/api/stories/feed', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId_1, page, limit, offset, featuredStories, nowSql, ads, communityStories, allStories, withAds, adIndex, total, i, story, nextAd, frequency, enrichedStories, error_3;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    userId_1 = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    page = parseInt(req.query.page) || 0;
                    limit = 10;
                    offset = page * limit;
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStories)
                            .where(and(eq(videoStories.isFeatured, true), eq(videoStories.status, 'ready'), gte(videoStories.expiresAt, sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["NOW()"], ["NOW()"]))))))
                            .orderBy(desc(videoStories.featuredStartedAt))
                            .limit(2)];
                case 1:
                    featuredStories = _b.sent();
                    nowSql = sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["NOW()"], ["NOW()"])));
                    return [4 /*yield*/, db
                            .select()
                            .from(feedAds)
                            .where(and(eq(feedAds.isActive, true), or(isNull(feedAds.startAt), lte(feedAds.startAt, nowSql)), or(isNull(feedAds.endAt), gte(feedAds.endAt, nowSql))))
                            .limit(5)];
                case 2:
                    ads = _b.sent();
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStories)
                            .where(and(eq(videoStories.status, 'ready'), lte(videoStories.createdAt, sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["NOW()"], ["NOW()"])))), gte(videoStories.expiresAt, sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["NOW()"], ["NOW()"]))))))
                            .orderBy(desc(videoStories.createdAt))
                            .limit(limit - featuredStories.length)
                            .offset(offset)];
                case 3:
                    communityStories = _b.sent();
                    allStories = __spreadArray(__spreadArray([], featuredStories, true), communityStories, true);
                    // Insert ads every N items based on ad.insertionFrequency (default 5)
                    if (ads.length > 0) {
                        withAds = [];
                        adIndex = 0;
                        total = allStories.length;
                        for (i = 0; i < total; i++) {
                            story = allStories[i];
                            withAds.push(story);
                            nextAd = ads[adIndex % ads.length];
                            frequency = nextAd.insertionFrequency || 5;
                            if ((i + 1) % frequency === 0) {
                                withAds.push({
                                    __type: 'ad',
                                    id: nextAd.id,
                                    title: nextAd.title,
                                    mediaUrl: nextAd.mediaUrl,
                                    targetUrl: nextAd.targetUrl,
                                    ctaText: nextAd.ctaText || 'Learn more',
                                    isHouseAd: nextAd.isHouseAd,
                                    isAffiliate: nextAd.isAffiliate,
                                    affiliateName: nextAd.affiliateName,
                                });
                                adIndex++;
                            }
                        }
                        allStories = withAds;
                    }
                    // Track impressions for all shown stories (skip ads)
                    return [4 /*yield*/, Promise.all(allStories
                            .filter(function (story) { return story && story.__type !== 'ad'; })
                            .map(function (story) {
                            return db
                                .update(videoStories)
                                .set({
                                impressionCount: sql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", " + 1"], ["", " + 1"])), videoStories.impressionCount),
                            })
                                .where(eq(videoStories.id, story.id));
                        }))];
                case 4:
                    // Track impressions for all shown stories (skip ads)
                    _b.sent();
                    return [4 /*yield*/, Promise.all(allStories.map(function (story) { return __awaiter(_this, void 0, void 0, function () {
                            var userLiked;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (story.__type === 'ad') {
                                            return [2 /*return*/, story];
                                        }
                                        return [4 /*yield*/, db
                                                .select({ count: count() })
                                                .from(storyLikes)
                                                .where(and(eq(storyLikes.storyId, story.id), eq(storyLikes.userId, userId_1)))];
                                    case 1:
                                        userLiked = _b.sent();
                                        return [2 /*return*/, __assign(__assign({}, story), { userLiked: (((_a = userLiked[0]) === null || _a === void 0 ? void 0 : _a.count) || 0) > 0 })];
                                }
                            });
                        }); }))];
                case 5:
                    enrichedStories = _b.sent();
                    res.json({
                        stories: enrichedStories,
                        hasMore: communityStories.length === limit - featuredStories.length,
                        page: page,
                    });
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _b.sent();
                    console.error('Error fetching stories feed:', error_3);
                    res.status(500).json({ message: 'Failed to fetch feed' });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    // GET - Single story details
    app.get('/api/stories/:storyId', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var storyId, userId, story, creator, restaurant, _a, reviewerLevel, comments, awards, userLiked, likeCheck, error_4;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 11, , 12]);
                    storyId = req.params.storyId;
                    userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStories)
                            .where(eq(videoStories.id, storyId))
                            .limit(1)];
                case 1:
                    story = _c.sent();
                    if (!story.length) {
                        return [2 /*return*/, res.status(404).json({ message: 'Story not found' })];
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(users)
                            .where(eq(users.id, story[0].userId))
                            .limit(1)];
                case 2:
                    creator = _c.sent();
                    if (!story[0].restaurantId) return [3 /*break*/, 4];
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurants)
                            .where(eq(restaurants.id, story[0].restaurantId))
                            .limit(1)];
                case 3:
                    _a = _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = null;
                    _c.label = 5;
                case 5:
                    restaurant = _a;
                    return [4 /*yield*/, db
                            .select()
                            .from(userReviewerLevels)
                            .where(eq(userReviewerLevels.userId, story[0].userId))
                            .limit(1)];
                case 6:
                    reviewerLevel = _c.sent();
                    return [4 /*yield*/, db
                            .select()
                            .from(storyComments)
                            .where(and(eq(storyComments.storyId, storyId), eq(storyComments.isApproved, true)))
                            .orderBy(desc(storyComments.createdAt))
                            .limit(5)];
                case 7:
                    comments = _c.sent();
                    return [4 /*yield*/, db
                            .select()
                            .from(storyAwards)
                            .where(eq(storyAwards.storyId, storyId))];
                case 8:
                    awards = _c.sent();
                    userLiked = false;
                    if (!userId) return [3 /*break*/, 10];
                    return [4 /*yield*/, db
                            .select()
                            .from(storyLikes)
                            .where(and(eq(storyLikes.storyId, storyId), eq(storyLikes.userId, userId)))
                            .limit(1)];
                case 9:
                    likeCheck = _c.sent();
                    userLiked = likeCheck.length > 0;
                    _c.label = 10;
                case 10:
                    res.json({
                        story: story[0],
                        creator: creator[0],
                        restaurant: (restaurant === null || restaurant === void 0 ? void 0 : restaurant[0]) || null,
                        reviewerLevel: reviewerLevel[0] || null,
                        comments: comments,
                        awards: awards,
                        userLiked: userLiked,
                    });
                    return [3 /*break*/, 12];
                case 11:
                    error_4 = _c.sent();
                    console.error('Error fetching story details:', error_4);
                    res.status(500).json({ message: 'Failed to fetch story' });
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    }); });
    // POST - Like story
    app.post('/api/stories/:storyId/like', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var storyId, userId, story, existingLike, creatorLevels, currentTotal, newTotal, milestones, awardTypes, i, existingAward, levels, newLevel, _i, levels_1, lvl, error_5;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 17, , 18]);
                    storyId = req.params.storyId;
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStories)
                            .where(eq(videoStories.id, storyId))
                            .limit(1)];
                case 1:
                    story = _c.sent();
                    if (!story.length) {
                        return [2 /*return*/, res.status(404).json({ message: 'Story not found' })];
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(storyLikes)
                            .where(and(eq(storyLikes.storyId, storyId), eq(storyLikes.userId, userId)))
                            .limit(1)];
                case 2:
                    existingLike = _c.sent();
                    if (!(existingLike.length > 0)) return [3 /*break*/, 6];
                    // Unlike
                    return [4 /*yield*/, db
                            .delete(storyLikes)
                            .where(and(eq(storyLikes.storyId, storyId), eq(storyLikes.userId, userId)))];
                case 3:
                    // Unlike
                    _c.sent();
                    // Decrement like count
                    return [4 /*yield*/, db
                            .update(videoStories)
                            .set({
                            likeCount: sql(templateObject_8 || (templateObject_8 = __makeTemplateObject(["GREATEST(", " - 1, 0)"], ["GREATEST(", " - 1, 0)"])), videoStories.likeCount),
                        })
                            .where(eq(videoStories.id, storyId))];
                case 4:
                    // Decrement like count
                    _c.sent();
                    // Decrement user's total favorites
                    return [4 /*yield*/, db
                            .update(userReviewerLevels)
                            .set({
                            totalFavorites: sql(templateObject_9 || (templateObject_9 = __makeTemplateObject(["GREATEST(", " - 1, 0)"], ["GREATEST(", " - 1, 0)"])), userReviewerLevels.totalFavorites),
                        })
                            .where(eq(userReviewerLevels.userId, story[0].userId))];
                case 5:
                    // Decrement user's total favorites
                    _c.sent();
                    return [2 /*return*/, res.json({ liked: false, message: 'Story unliked' })];
                case 6: 
                // Create like
                return [4 /*yield*/, db.insert(storyLikes).values({
                        storyId: storyId,
                        userId: userId,
                    })];
                case 7:
                    // Create like
                    _c.sent();
                    // Increment like count
                    return [4 /*yield*/, db
                            .update(videoStories)
                            .set({
                            likeCount: sql(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", " + 1"], ["", " + 1"])), videoStories.likeCount),
                        })
                            .where(eq(videoStories.id, storyId))];
                case 8:
                    // Increment like count
                    _c.sent();
                    return [4 /*yield*/, db
                            .select()
                            .from(userReviewerLevels)
                            .where(eq(userReviewerLevels.userId, story[0].userId))];
                case 9:
                    creatorLevels = _c.sent();
                    currentTotal = ((_b = creatorLevels[0]) === null || _b === void 0 ? void 0 : _b.totalFavorites) || 0;
                    newTotal = currentTotal + 1;
                    return [4 /*yield*/, db
                            .update(userReviewerLevels)
                            .set({
                            totalFavorites: newTotal,
                        })
                            .where(eq(userReviewerLevels.userId, story[0].userId))];
                case 10:
                    _c.sent();
                    milestones = [500, 1000, 3000, 10000];
                    awardTypes = [
                        'bronze_fork',
                        'silver_fork',
                        'gold_fork',
                        'platinum_fork',
                    ];
                    i = 0;
                    _c.label = 11;
                case 11:
                    if (!(i < milestones.length)) return [3 /*break*/, 15];
                    if (!(newTotal === milestones[i])) return [3 /*break*/, 14];
                    return [4 /*yield*/, db
                            .select()
                            .from(storyAwards)
                            .where(and(eq(storyAwards.storyId, storyId), eq(storyAwards.awardType, awardTypes[i])))
                            .limit(1)];
                case 12:
                    existingAward = _c.sent();
                    if (!!existingAward.length) return [3 /*break*/, 14];
                    return [4 /*yield*/, db.insert(storyAwards).values({
                            storyId: storyId,
                            awardType: awardTypes[i],
                        })];
                case 13:
                    _c.sent();
                    _c.label = 14;
                case 14:
                    i++;
                    return [3 /*break*/, 11];
                case 15:
                    levels = [
                        { threshold: 0, level: 1 },
                        { threshold: 100, level: 2 },
                        { threshold: 500, level: 3 },
                        { threshold: 1000, level: 4 },
                        { threshold: 2500, level: 5 },
                        { threshold: 5000, level: 6 },
                    ];
                    newLevel = 1;
                    for (_i = 0, levels_1 = levels; _i < levels_1.length; _i++) {
                        lvl = levels_1[_i];
                        if (newTotal >= lvl.threshold) {
                            newLevel = lvl.level;
                        }
                    }
                    return [4 /*yield*/, db
                            .update(userReviewerLevels)
                            .set({ level: newLevel })
                            .where(eq(userReviewerLevels.userId, story[0].userId))];
                case 16:
                    _c.sent();
                    res.json({ liked: true, message: 'Story liked' });
                    return [3 /*break*/, 18];
                case 17:
                    error_5 = _c.sent();
                    console.error('Error liking story:', error_5);
                    res.status(500).json({ message: 'Failed to like story' });
                    return [3 /*break*/, 18];
                case 18: return [2 /*return*/];
            }
        });
    }); });
    // POST - Comment on story
    app.post('/api/stories/:storyId/comments', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var storyId, userId, _a, text, parentCommentId, story, comment, error_6;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    storyId = req.params.storyId;
                    userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                    _a = req.body, text = _a.text, parentCommentId = _a.parentCommentId;
                    // Validate input
                    if (!text || text.trim().length === 0) {
                        return [2 /*return*/, res.status(400).json({ message: 'Comment text is required' })];
                    }
                    if (text.length > 500) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ message: 'Comment must be less than 500 characters' })];
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStories)
                            .where(eq(videoStories.id, storyId))
                            .limit(1)];
                case 1:
                    story = _c.sent();
                    if (!story.length) {
                        return [2 /*return*/, res.status(404).json({ message: 'Story not found' })];
                    }
                    return [4 /*yield*/, db
                            .insert(storyComments)
                            .values({
                            storyId: storyId,
                            userId: userId,
                            text: text,
                            parentCommentId: parentCommentId || null,
                        })
                            .returning()];
                case 2:
                    comment = _c.sent();
                    // Increment comment count
                    return [4 /*yield*/, db
                            .update(videoStories)
                            .set({
                            commentCount: sql(templateObject_11 || (templateObject_11 = __makeTemplateObject(["", " + 1"], ["", " + 1"])), videoStories.commentCount),
                        })
                            .where(eq(videoStories.id, storyId))];
                case 3:
                    // Increment comment count
                    _c.sent();
                    res.status(201).json({
                        message: 'Comment added successfully',
                        comment: comment[0],
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_6 = _c.sent();
                    console.error('Error adding comment:', error_6);
                    res.status(500).json({ message: 'Failed to add comment' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // POST - Record view
    app.post('/api/stories/:storyId/view', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var storyId, userId, watchDuration, error_7;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    storyId = req.params.storyId;
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    watchDuration = req.body.watchDuration;
                    if (!(!watchDuration || watchDuration >= 3)) return [3 /*break*/, 3];
                    return [4 /*yield*/, db.insert(storyViews).values({
                            storyId: storyId,
                            userId: userId || null,
                            watchDuration: watchDuration || null,
                        })];
                case 1:
                    _b.sent();
                    // Increment view count
                    return [4 /*yield*/, db
                            .update(videoStories)
                            .set({
                            viewCount: sql(templateObject_12 || (templateObject_12 = __makeTemplateObject(["", " + 1"], ["", " + 1"])), videoStories.viewCount),
                        })
                            .where(eq(videoStories.id, storyId))];
                case 2:
                    // Increment view count
                    _b.sent();
                    _b.label = 3;
                case 3:
                    res.json({ message: 'View recorded' });
                    return [3 /*break*/, 5];
                case 4:
                    error_7 = _b.sent();
                    console.error('Error recording view:', error_7);
                    res.status(500).json({ message: 'Failed to record view' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    // GET - Leaderboards
    app.get('/api/stories/leaderboards/trending', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var timeframe, hoursBack, cutoffDate, trending, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    timeframe = req.query.timeframe || 'week';
                    hoursBack = 7 * 24;
                    if (timeframe === 'day')
                        hoursBack = 24;
                    if (timeframe === 'month')
                        hoursBack = 30 * 24;
                    if (timeframe === 'all')
                        hoursBack = 365 * 24;
                    cutoffDate = sql(templateObject_13 || (templateObject_13 = __makeTemplateObject(["NOW() - INTERVAL '", " hours'"], ["NOW() - INTERVAL '", " hours'"])), hoursBack);
                    return [4 /*yield*/, db
                            .select({
                            id: videoStories.id,
                            title: videoStories.title,
                            creatorName: users.firstName,
                            viewCount: videoStories.viewCount,
                            likeCount: videoStories.likeCount,
                            engagement: sql(templateObject_14 || (templateObject_14 = __makeTemplateObject(["(", " + ", " * 2) / NULLIF(", ", 0)"], ["(", " + ", " * 2) / NULLIF(", ", 0)"])), videoStories.likeCount, videoStories.commentCount, videoStories.viewCount),
                        })
                            .from(videoStories)
                            .innerJoin(users, eq(videoStories.userId, users.id))
                            .where(and(eq(videoStories.status, 'ready'), gte(videoStories.createdAt, cutoffDate)))
                            .orderBy(desc(sql(templateObject_15 || (templateObject_15 = __makeTemplateObject(["", " + ", ""], ["", " + ", ""])), videoStories.likeCount, videoStories.commentCount)))
                            .limit(20)];
                case 1:
                    trending = _a.sent();
                    res.json({ trending: trending, timeframe: timeframe });
                    return [3 /*break*/, 3];
                case 2:
                    error_8 = _a.sent();
                    console.error('Error fetching trending stories:', error_8);
                    res.status(500).json({ message: 'Failed to fetch trending stories' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // GET - Top reviewers
    app.get('/api/stories/leaderboards/top-reviewers', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var timeframe, topReviewers, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    timeframe = req.query.timeframe || 'month';
                    return [4 /*yield*/, db
                            .select({
                            userId: userReviewerLevels.userId,
                            firstName: users.firstName,
                            lastName: users.lastName,
                            profileImageUrl: users.profileImageUrl,
                            level: userReviewerLevels.level,
                            totalFavorites: userReviewerLevels.totalFavorites,
                            totalStories: userReviewerLevels.totalStories,
                        })
                            .from(userReviewerLevels)
                            .innerJoin(users, eq(userReviewerLevels.userId, users.id))
                            .orderBy(desc(userReviewerLevels.totalFavorites))
                            .limit(50)];
                case 1:
                    topReviewers = _a.sent();
                    res.json({ topReviewers: topReviewers, timeframe: timeframe });
                    return [3 /*break*/, 3];
                case 2:
                    error_9 = _a.sent();
                    console.error('Error fetching top reviewers:', error_9);
                    res
                        .status(500)
                        .json({ message: 'Failed to fetch top reviewers' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // GET - User's stories
    app.get('/api/stories/user/:userId', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, userStories, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    userId = req.params.userId;
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStories)
                            .where(and(eq(videoStories.userId, userId), eq(videoStories.status, 'ready')))
                            .orderBy(desc(videoStories.createdAt))];
                case 1:
                    userStories = _a.sent();
                    res.json({ stories: userStories });
                    return [3 /*break*/, 3];
                case 2:
                    error_10 = _a.sent();
                    console.error('Error fetching user stories:', error_10);
                    res.status(500).json({ message: 'Failed to fetch user stories' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // DELETE - Delete story (only by creator)
    app.delete('/api/stories/:storyId', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var storyId, userId, story, err_1, error_11;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 7, , 8]);
                    storyId = req.params.storyId;
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStories)
                            .where(eq(videoStories.id, storyId))
                            .limit(1)];
                case 1:
                    story = _b.sent();
                    if (!story.length) {
                        return [2 /*return*/, res.status(404).json({ message: 'Story not found' })];
                    }
                    // Check ownership
                    if (story[0].userId !== userId) {
                        return [2 /*return*/, res
                                .status(403)
                                .json({ message: 'Unauthorized - not story creator' })];
                    }
                    if (!story[0].videoUrl) return [3 /*break*/, 5];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, deleteFromCloudinary(story[0].videoUrl)];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _b.sent();
                    console.error('Error deleting from Cloudinary:', err_1);
                    return [3 /*break*/, 5];
                case 5: 
                // Soft delete in database
                return [4 /*yield*/, db
                        .update(videoStories)
                        .set({ deletedAt: sql(templateObject_16 || (templateObject_16 = __makeTemplateObject(["NOW()"], ["NOW()"]))), status: 'expired' })
                        .where(eq(videoStories.id, storyId))];
                case 6:
                    // Soft delete in database
                    _b.sent();
                    res.json({ message: 'Story deleted successfully' });
                    return [3 /*break*/, 8];
                case 7:
                    error_11 = _b.sent();
                    console.error('Error deleting story:', error_11);
                    res.status(500).json({ message: 'Failed to delete story' });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    // GET - User's reviewer level
    app.get('/api/stories/reviewer-level/:userId', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, level, error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    userId = req.params.userId;
                    return [4 /*yield*/, db
                            .select()
                            .from(userReviewerLevels)
                            .where(eq(userReviewerLevels.userId, userId))
                            .limit(1)];
                case 1:
                    level = _a.sent();
                    if (!level.length) {
                        // Return default level 1
                        return [2 /*return*/, res.json({
                                userId: userId,
                                level: 1,
                                totalFavorites: 0,
                                totalStories: 0,
                            })];
                    }
                    res.json(level[0]);
                    return [3 /*break*/, 3];
                case 2:
                    error_12 = _a.sent();
                    console.error('Error fetching reviewer level:', error_12);
                    res.status(500).json({ message: 'Failed to fetch reviewer level' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // POST - Report a video story
    app.post('/api/stories/:storyId/report', isAuthenticated, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var userId, storyId, _a, reason, description, story, videoStoryReports_1, existingReport, reportCount, totalReports, error_13;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 9, , 10]);
                    userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                    storyId = req.params.storyId;
                    _a = req.body, reason = _a.reason, description = _a.description;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ message: 'Unauthorized' })];
                    }
                    if (!reason || !['inappropriate', 'spam', 'misleading', 'offensive', 'other'].includes(reason)) {
                        return [2 /*return*/, res.status(400).json({ message: 'Invalid report reason' })];
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStories)
                            .where(eq(videoStories.id, storyId))
                            .limit(1)];
                case 1:
                    story = _d.sent();
                    if (!story.length) {
                        return [2 /*return*/, res.status(404).json({ message: 'Video not found' })];
                    }
                    return [4 /*yield*/, import('@shared/schema')];
                case 2:
                    videoStoryReports_1 = (_d.sent()).videoStoryReports;
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStoryReports_1)
                            .where(and(eq(videoStoryReports_1.storyId, storyId), eq(videoStoryReports_1.reportedByUserId, userId)))
                            .limit(1)];
                case 3:
                    existingReport = _d.sent();
                    if (existingReport.length > 0) {
                        return [2 /*return*/, res.status(400).json({ message: 'You have already reported this video' })];
                    }
                    // Create report
                    return [4 /*yield*/, db.insert(videoStoryReports_1).values({
                            storyId: storyId,
                            reportedByUserId: userId,
                            reason: reason,
                            description: description || null,
                        })];
                case 4:
                    // Create report
                    _d.sent();
                    return [4 /*yield*/, db
                            .select({ count: count() })
                            .from(videoStoryReports_1)
                            .where(eq(videoStoryReports_1.storyId, storyId))];
                case 5:
                    reportCount = _d.sent();
                    totalReports = ((_c = reportCount[0]) === null || _c === void 0 ? void 0 : _c.count) || 0;
                    if (!(totalReports >= 10)) return [3 /*break*/, 8];
                    return [4 /*yield*/, db
                            .update(videoStories)
                            .set({
                            status: 'expired',
                            deletedAt: new Date(),
                        })
                            .where(eq(videoStories.id, storyId))];
                case 6:
                    _d.sent();
                    // Update all reports to action_taken
                    return [4 /*yield*/, db
                            .update(videoStoryReports_1)
                            .set({
                            status: 'action_taken',
                            adminNotes: 'Auto-takedown: 10+ community reports',
                        })
                            .where(eq(videoStoryReports_1.storyId, storyId))];
                case 7:
                    // Update all reports to action_taken
                    _d.sent();
                    return [2 /*return*/, res.json({
                            message: 'Video reported and automatically taken down due to multiple reports',
                            autoTakedown: true,
                        })];
                case 8:
                    res.json({
                        message: 'Video reported successfully. Our team will review it shortly.',
                        totalReports: totalReports,
                    });
                    return [3 /*break*/, 10];
                case 9:
                    error_13 = _d.sent();
                    console.error('Error reporting video:', error_13);
                    res.status(500).json({ message: 'Failed to report video' });
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    }); });
    // GET - Get report count for a video
    app.get('/api/stories/:storyId/report-count', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var storyId, videoStoryReports_2, reportCount, error_14;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    storyId = req.params.storyId;
                    return [4 /*yield*/, import('@shared/schema')];
                case 1:
                    videoStoryReports_2 = (_b.sent()).videoStoryReports;
                    return [4 /*yield*/, db
                            .select({ count: count() })
                            .from(videoStoryReports_2)
                            .where(eq(videoStoryReports_2.storyId, storyId))];
                case 2:
                    reportCount = _b.sent();
                    res.json({ reportCount: ((_a = reportCount[0]) === null || _a === void 0 ? void 0 : _a.count) || 0 });
                    return [3 /*break*/, 4];
                case 3:
                    error_14 = _b.sent();
                    console.error('Error fetching report count:', error_14);
                    res.status(500).json({ message: 'Failed to fetch report count' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16;

