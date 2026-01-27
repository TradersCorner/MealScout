var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { db } from './db.js';
import { videoStories, storyLikes } from '@shared/schema';
import { eq, lte, sql, and, isNull, isNotNull } from 'drizzle-orm';
import { deleteFromCloudinary } from './imageUpload.js';
import auditLogger from './auditLogger.js';
import { detectReviewerLevelDrift } from './reviewerLevelDriftDetector.js';
/**
 * Cleanup expired video stories
 * Runs daily to:
 * 1. Soft delete stories that have passed expiration
 * 2. Hard delete stories older than 30 days (if enabled)
 * 3. Clean up associated data (likes, comments, views)
 * 4. Delete from Cloudinary
 */
export function cleanupExpiredStories() {
    return __awaiter(this, void 0, void 0, function () {
        var stats, expiredStories, hardDeleteEnabled, oldStories, _i, oldStories_1, story, err_1, err_2, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    stats = {
                        softDeleted: 0,
                        hardDeleted: 0,
                        cloudinaryErrors: 0,
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 17, , 18]);
                    console.log('[Cron] Starting story cleanup...');
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStories)
                            .where(and(lte(videoStories.expiresAt, sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["NOW()"], ["NOW()"])))), isNull(videoStories.deletedAt), eq(videoStories.isFeatured, false)))];
                case 2:
                    expiredStories = _a.sent();
                    if (!(expiredStories.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, db
                            .update(videoStories)
                            .set({
                            deletedAt: sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["NOW()"], ["NOW()"]))),
                            status: 'expired',
                        })
                            .where(and(lte(videoStories.expiresAt, sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["NOW()"], ["NOW()"])))), isNull(videoStories.deletedAt), eq(videoStories.isFeatured, false)))];
                case 3:
                    _a.sent();
                    stats.softDeleted = expiredStories.length;
                    console.log("[Cron] Soft deleted ".concat(expiredStories.length, " expired stories"));
                    _a.label = 4;
                case 4:
                    hardDeleteEnabled = process.env.HARD_DELETE_STORIES === 'true';
                    if (!hardDeleteEnabled) return [3 /*break*/, 16];
                    return [4 /*yield*/, db
                            .select()
                            .from(videoStories)
                            .where(and(isNotNull(videoStories.deletedAt), lte(videoStories.deletedAt, sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["NOW() - INTERVAL '30 days'"], ["NOW() - INTERVAL '30 days'"]))))))];
                case 5:
                    oldStories = _a.sent();
                    _i = 0, oldStories_1 = oldStories;
                    _a.label = 6;
                case 6:
                    if (!(_i < oldStories_1.length)) return [3 /*break*/, 15];
                    story = oldStories_1[_i];
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 13, , 14]);
                    if (!story.videoUrl) return [3 /*break*/, 11];
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, deleteFromCloudinary(story.videoUrl)];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 10:
                    err_1 = _a.sent();
                    console.error("[Cron] Error deleting ".concat(story.id, " from Cloudinary:"), err_1);
                    stats.cloudinaryErrors++;
                    return [3 /*break*/, 11];
                case 11: 
                // Delete from database (cascade will handle related records)
                return [4 /*yield*/, db
                        .delete(videoStories)
                        .where(eq(videoStories.id, story.id))];
                case 12:
                    // Delete from database (cascade will handle related records)
                    _a.sent();
                    stats.hardDeleted++;
                    return [3 /*break*/, 14];
                case 13:
                    err_2 = _a.sent();
                    console.error("[Cron] Error hard-deleting story ".concat(story.id, ":"), err_2);
                    return [3 /*break*/, 14];
                case 14:
                    _i++;
                    return [3 /*break*/, 6];
                case 15:
                    if (stats.hardDeleted > 0) {
                        console.log("[Cron] Hard deleted ".concat(stats.hardDeleted, " old stories"));
                    }
                    _a.label = 16;
                case 16:
                    // 3. Cleanup orphaned records (soft deleted stories' engagement data)
                    // Keep for 7 days after deletion for analytics, then clean up
                    // Cleanup is handled by cascade delete on storyLikes foreign key
                    console.log('[Cron] Story cleanup completed successfully');
                    console.log("  - Soft deleted: ".concat(stats.softDeleted));
                    console.log("  - Hard deleted: ".concat(stats.hardDeleted));
                    console.log("  - Cloudinary errors: ".concat(stats.cloudinaryErrors));
                    return [2 /*return*/, stats];
                case 17:
                    error_1 = _a.sent();
                    console.error('[Cron] Error during story cleanup:', error_1);
                    throw error_1;
                case 18: return [2 /*return*/];
            }
        });
    });
}
/**
 * Recalculate user reviewer levels
 * Runs periodically to update levels based on engagement
 */
export function recalculateReviewerLevels() {
    return __awaiter(this, void 0, void 0, function () {
        var stats, usersWithStories, _i, usersWithStories_1, userId, likeData, totalFavorites, level, storyCount, topStory, error_2;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    stats = { updated: 0 };
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 10, , 11]);
                    console.log('[Cron] Starting reviewer level recalculation...');
                    return [4 /*yield*/, db
                            .selectDistinct({ userId: videoStories.userId })
                            .from(videoStories)
                            .where(isNotNull(videoStories.restaurantId))];
                case 2:
                    usersWithStories = _d.sent();
                    _i = 0, usersWithStories_1 = usersWithStories;
                    _d.label = 3;
                case 3:
                    if (!(_i < usersWithStories_1.length)) return [3 /*break*/, 9];
                    userId = usersWithStories_1[_i].userId;
                    return [4 /*yield*/, db
                            .select({
                            totalFavorites: sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["COUNT(", ")"], ["COUNT(", ")"])), storyLikes.id).mapWith(Number),
                        })
                            .from(storyLikes)
                            .innerJoin(videoStories, eq(storyLikes.storyId, videoStories.id))
                            .where(and(eq(videoStories.userId, userId), eq(videoStories.status, 'ready'), isNotNull(videoStories.restaurantId)))];
                case 4:
                    likeData = _d.sent();
                    totalFavorites = ((_a = likeData[0]) === null || _a === void 0 ? void 0 : _a.totalFavorites) || 0;
                    level = 1;
                    if (totalFavorites >= 5000)
                        level = 6;
                    else if (totalFavorites >= 2500)
                        level = 5;
                    else if (totalFavorites >= 1000)
                        level = 4;
                    else if (totalFavorites >= 500)
                        level = 3;
                    else if (totalFavorites >= 100)
                        level = 2;
                    return [4 /*yield*/, db
                            .select({ count: sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["COUNT(DISTINCT ", ")"], ["COUNT(DISTINCT ", ")"])), videoStories.restaurantId).mapWith(Number) })
                            .from(videoStories)
                            .where(and(eq(videoStories.userId, userId), isNotNull(videoStories.restaurantId)))];
                case 5:
                    storyCount = _d.sent();
                    return [4 /*yield*/, db
                            .select({ likeCount: videoStories.likeCount })
                            .from(videoStories)
                            .where(and(eq(videoStories.userId, userId), eq(videoStories.status, 'ready'), isNotNull(videoStories.restaurantId)))
                            .orderBy(desc(videoStories.likeCount))
                            .limit(1)];
                case 6:
                    topStory = _d.sent();
                    // Update reviewer level
                    return [4 /*yield*/, db
                            .update(userReviewerLevels)
                            .set({
                            level: level,
                            totalFavorites: totalFavorites,
                            totalStories: ((_b = storyCount[0]) === null || _b === void 0 ? void 0 : _b.count) || 0,
                            topStoryFavorites: ((_c = topStory[0]) === null || _c === void 0 ? void 0 : _c.likeCount) || 0,
                            updatedAt: sql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["NOW()"], ["NOW()"]))),
                        })
                            .where(eq(userReviewerLevels.userId, userId))];
                case 7:
                    // Update reviewer level
                    _d.sent();
                    stats.updated++;
                    _d.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 3];
                case 9:
                    console.log("[Cron] Updated ".concat(stats.updated, " reviewer levels"));
                    return [2 /*return*/, stats];
                case 10:
                    error_2 = _d.sent();
                    console.error('[Cron] Error during level recalculation:', error_2);
                    throw error_2;
                case 11: return [2 /*return*/];
            }
        });
    });
}
/**
 * Register cron jobs with the server
 */
export function registerStoryCronJobs(app) {
    // Run daily at 2 AM UTC
    // For production, use a proper cron service (e.g., node-cron, cron, agenda)
    var _this = this;
    // POST endpoint for external cron service
    app.post('/api/cron/cleanup-stories', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var cronSecret, authHeader, stats, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    cronSecret = process.env.CRON_SECRET;
                    authHeader = req.headers['x-cron-secret'];
                    if (cronSecret && authHeader !== cronSecret) {
                        return [2 /*return*/, res.status(401).json({ error: 'Unauthorized' })];
                    }
                    return [4 /*yield*/, cleanupExpiredStories()];
                case 1:
                    stats = _a.sent();
                    res.json({
                        success: true,
                        message: 'Story cleanup completed',
                        stats: stats,
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('[API] Error in cleanup-stories endpoint:', error_3);
                    res.status(500).json({
                        error: 'Cleanup failed',
                        message: error_3 instanceof Error ? error_3.message : 'Unknown error',
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // POST endpoint for recalculation
    app.post('/api/cron/recalculate-levels', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var cronSecret, authHeader, stats, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    cronSecret = process.env.CRON_SECRET;
                    authHeader = req.headers['x-cron-secret'];
                    if (cronSecret && authHeader !== cronSecret) {
                        return [2 /*return*/, res.status(401).json({ error: 'Unauthorized' })];
                    }
                    return [4 /*yield*/, recalculateReviewerLevels()];
                case 1:
                    stats = _a.sent();
                    // Run drift detector to ensure reviewer levels stay aligned with durable semantics
                    return [4 /*yield*/, detectReviewerLevelDrift(db, auditLogger, { videoStories: videoStories, userReviewerLevels: userReviewerLevels }, { limit: 200, includeZeroCases: false })];
                case 2:
                    // Run drift detector to ensure reviewer levels stay aligned with durable semantics
                    _a.sent();
                    res.json({
                        success: true,
                        message: 'Reviewer levels recalculated',
                        stats: stats,
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.error('[API] Error in recalculate-levels endpoint:', error_4);
                    res.status(500).json({
                        error: 'Recalculation failed',
                        message: error_4 instanceof Error ? error_4.message : 'Unknown error',
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    console.log('✅ Story cron jobs registered');
    console.log('   POST /api/cron/cleanup-stories - Clean up expired stories');
    console.log('   POST /api/cron/recalculate-levels - Recalculate reviewer levels');
    console.log('   Include header: x-cron-secret: <CRON_SECRET>');
}
// Import for external calls
import { desc } from 'drizzle-orm';
import { userReviewerLevels } from '@shared/schema';
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;

