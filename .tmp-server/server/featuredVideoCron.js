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
import { eq, and, isNull, lt, gte } from "drizzle-orm";
import { db } from "./db.js";
import { videoStories, featuredVideoSlots, restaurantSubscriptions, } from "../shared/schema.js";
function scoreVideosByEngagement(restaurantId) {
    return __awaiter(this, void 0, void 0, function () {
        var videos, scored;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .select({
                        id: videoStories.id,
                        userId: videoStories.userId,
                        title: videoStories.title,
                        likeCount: videoStories.likeCount,
                        impressionCount: videoStories.impressionCount,
                        isFeatured: videoStories.isFeatured,
                        expiresAt: videoStories.expiresAt,
                        featuredEndedAt: videoStories.featuredEndedAt,
                    })
                        .from(videoStories)
                        .where(and(eq(videoStories.restaurantId, restaurantId), eq(videoStories.status, "ready"), isNull(videoStories.deletedAt), 
                    // Not expired yet
                    gte(videoStories.expiresAt, new Date())))];
                case 1:
                    videos = _a.sent();
                    scored = videos
                        .map(function (v) {
                        // Calculate engagement score
                        // If no impressions yet, use like count as primary score
                        var score = v.impressionCount && v.impressionCount > 0
                            ? (v.likeCount / v.impressionCount) * 100
                            : v.likeCount;
                        return {
                            videoId: v.id,
                            userId: v.userId,
                            title: v.title,
                            likes: v.likeCount,
                            impressions: v.impressionCount,
                            score: score,
                        };
                    })
                        .sort(function (a, b) { return b.score - a.score; });
                    return [2 /*return*/, scored];
            }
        });
    });
}
function cycleFeaturedVideos() {
    return __awaiter(this, void 0, void 0, function () {
        var subscriptions, _i, subscriptions_1, sub, slots, i, scoredVideos, videoIndex, i, slot, nextVideo, candidate, previousIds, previousIds, newCycleEnd, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("[CRON] Starting featured video cycling...");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 19, , 20]);
                    return [4 /*yield*/, db
                            .select({
                            restaurantId: restaurantSubscriptions.restaurantId,
                            tier: restaurantSubscriptions.tier,
                            maxFeaturedSlots: restaurantSubscriptions.maxFeaturedSlots,
                        })
                            .from(restaurantSubscriptions)
                            .where(eq(restaurantSubscriptions.status, "active"))];
                case 2:
                    subscriptions = _a.sent();
                    console.log("[CRON] Found ".concat(subscriptions.length, " active restaurant subscriptions"));
                    _i = 0, subscriptions_1 = subscriptions;
                    _a.label = 3;
                case 3:
                    if (!(_i < subscriptions_1.length)) return [3 /*break*/, 18];
                    sub = subscriptions_1[_i];
                    // Free tier: no featured slots
                    if (sub.maxFeaturedSlots === 0)
                        return [3 /*break*/, 17];
                    console.log("[CRON] Cycling featured videos for restaurant ".concat(sub.restaurantId, " (").concat(sub.tier, " tier, ").concat(sub.maxFeaturedSlots, " slots)"));
                    return [4 /*yield*/, db
                            .select()
                            .from(featuredVideoSlots)
                            .where(eq(featuredVideoSlots.restaurantId, sub.restaurantId))
                            .orderBy(featuredVideoSlots.slotNumber)];
                case 4:
                    slots = _a.sent();
                    if (!(slots.length < sub.maxFeaturedSlots)) return [3 /*break*/, 8];
                    i = slots.length + 1;
                    _a.label = 5;
                case 5:
                    if (!(i <= sub.maxFeaturedSlots)) return [3 /*break*/, 8];
                    return [4 /*yield*/, db.insert(featuredVideoSlots).values({
                            restaurantId: sub.restaurantId,
                            slotNumber: i,
                            currentVideoId: null,
                            cycleStartDate: new Date(),
                            cycleEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr from now
                            previousVideoIds: [],
                            engagementScore: 0,
                            impressions: 0,
                            clicks: 0,
                        })];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    i++;
                    return [3 /*break*/, 5];
                case 8: return [4 /*yield*/, scoreVideosByEngagement(sub.restaurantId)];
                case 9:
                    scoredVideos = _a.sent();
                    console.log("[CRON] Found ".concat(scoredVideos.length, " eligible videos for rotation"));
                    videoIndex = 0;
                    i = 0;
                    _a.label = 10;
                case 10:
                    if (!(i < Math.min(slots.length, sub.maxFeaturedSlots))) return [3 /*break*/, 17];
                    slot = slots[i];
                    // Skip if video is still within its 24hr featured period
                    if (slot.cycleEndDate && slot.cycleEndDate > new Date()) {
                        console.log("[CRON] Slot ".concat(slot.slotNumber, " still active until ").concat(slot.cycleEndDate));
                        return [3 /*break*/, 16];
                    }
                    nextVideo = null;
                    while (videoIndex < scoredVideos.length) {
                        candidate = scoredVideos[videoIndex];
                        previousIds = slot.previousVideoIds || [];
                        // Don't re-feature videos from the last 3 cycles (3 days)
                        if (!previousIds.includes(candidate.videoId)) {
                            nextVideo = candidate;
                            videoIndex++;
                            break;
                        }
                        videoIndex++;
                    }
                    if (!nextVideo) return [3 /*break*/, 13];
                    previousIds = slot.previousVideoIds || [];
                    previousIds.unshift(nextVideo.videoId); // Add to front
                    previousIds.splice(5); // Keep last 5 videos
                    newCycleEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, db
                            .update(featuredVideoSlots)
                            .set({
                            currentVideoId: nextVideo.videoId,
                            cycleStartDate: new Date(),
                            cycleEndDate: newCycleEnd,
                            previousVideoIds: previousIds,
                            engagementScore: nextVideo.score,
                            impressions: nextVideo.impressions,
                            updatedAt: new Date(),
                        })
                            .where(eq(featuredVideoSlots.id, slot.id))];
                case 11:
                    _a.sent();
                    // Update video record
                    return [4 /*yield*/, db
                            .update(videoStories)
                            .set({
                            isFeatured: true,
                            featuredSlotNumber: slot.slotNumber,
                            featuredStartedAt: new Date(),
                            featuredEndedAt: newCycleEnd,
                        })
                            .where(eq(videoStories.id, nextVideo.videoId))];
                case 12:
                    // Update video record
                    _a.sent();
                    console.log("[CRON] Slot ".concat(slot.slotNumber, ": \"").concat(nextVideo.title, "\" (score: ").concat(nextVideo.score.toFixed(2), ")"));
                    return [3 /*break*/, 16];
                case 13:
                    if (!slot.currentVideoId) return [3 /*break*/, 16];
                    return [4 /*yield*/, db
                            .update(videoStories)
                            .set({
                            isFeatured: false,
                            featuredEndedAt: new Date(),
                        })
                            .where(eq(videoStories.id, slot.currentVideoId))];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, db
                            .update(featuredVideoSlots)
                            .set({
                            currentVideoId: null,
                            updatedAt: new Date(),
                        })
                            .where(eq(featuredVideoSlots.id, slot.id))];
                case 15:
                    _a.sent();
                    console.log("[CRON] Slot ".concat(slot.slotNumber, ": Empty (no eligible videos)"));
                    _a.label = 16;
                case 16:
                    i++;
                    return [3 /*break*/, 10];
                case 17:
                    _i++;
                    return [3 /*break*/, 3];
                case 18:
                    console.log("[CRON] Featured video cycling completed successfully");
                    return [3 /*break*/, 20];
                case 19:
                    error_1 = _a.sent();
                    console.error("[CRON] Error cycling featured videos:", error_1);
                    throw error_1;
                case 20: return [2 /*return*/];
            }
        });
    });
}
/**
 * Clean up old featured video slot records (keep 90 days of history)
 */
function cleanupOldFeaturedSlots() {
    return __awaiter(this, void 0, void 0, function () {
        var ninetyDaysAgo, result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, db
                            .delete(featuredVideoSlots)
                            .where(and(isNull(featuredVideoSlots.currentVideoId), lt(featuredVideoSlots.cycleEndDate, ninetyDaysAgo)))];
                case 1:
                    result = _a.sent();
                    console.log("[CRON] Cleaned up old featured video slots");
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("[CRON] Error cleaning up featured slots:", error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
export function registerFeaturedVideoCronJobs(app) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            // Run cycling daily at midnight UTC
            app.post("/api/cron/cycle-featured-videos", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var cronSecret, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cronSecret = req.headers["x-cron-secret"];
                            if (cronSecret !== process.env.CRON_SECRET) {
                                return [2 /*return*/, res.status(401).json({ error: "Unauthorized" })];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, cycleFeaturedVideos()];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, cleanupOldFeaturedSlots()];
                        case 3:
                            _a.sent();
                            res.json({ success: true, message: "Featured videos cycled" });
                            return [3 /*break*/, 5];
                        case 4:
                            error_3 = _a.sent();
                            console.error("Cron job failed:", error_3);
                            res.status(500).json({ error: "Cron job failed" });
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
export { cycleFeaturedVideos, cleanupOldFeaturedSlots };

