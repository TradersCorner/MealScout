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
import { storage } from './storage.js';
import { db } from './db.js';
import { users, restaurants, awardHistory, videoStories, restaurantUserRecommendations, } from '@shared/schema';
import { eq, and, or, like, sql, isNotNull } from 'drizzle-orm';
// Golden Fork Award Criteria
var GOLDEN_FORK_CRITERIA = {
    minReviews: 10,
    minRecommendations: 5,
    minInfluenceScore: 100,
};
// Golden Plate Award Criteria
var GOLDEN_PLATE_CRITERIA = {
    minRankingScore: 500,
    topPercentage: 0.1, // Top 10% per area
};
/**
 * Get authoritative recommendation count for a user based on video stories.
 * A recommendation credit is earned per distinct restaurantId the user has
 * ever tagged in a story (restaurantId IS NOT NULL), regardless of story status.
 */
export function getUserRecommendationCount(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var storyRecommendations, manualRecommendations, uniqueRestaurantIds, _i, storyRecommendations_1, rec, _a, manualRecommendations_1, rec;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, db
                        .select({ restaurantId: videoStories.restaurantId })
                        .from(videoStories)
                        .where(and(eq(videoStories.userId, userId), isNotNull(videoStories.restaurantId)))
                        .groupBy(videoStories.restaurantId)];
                case 1:
                    storyRecommendations = _b.sent();
                    return [4 /*yield*/, db
                            .select({ restaurantId: restaurantUserRecommendations.restaurantId })
                            .from(restaurantUserRecommendations)
                            .where(eq(restaurantUserRecommendations.userId, userId))
                            .groupBy(restaurantUserRecommendations.restaurantId)];
                case 2:
                    manualRecommendations = _b.sent();
                    uniqueRestaurantIds = new Set();
                    for (_i = 0, storyRecommendations_1 = storyRecommendations; _i < storyRecommendations_1.length; _i++) {
                        rec = storyRecommendations_1[_i];
                        if (rec.restaurantId)
                            uniqueRestaurantIds.add(rec.restaurantId);
                    }
                    for (_a = 0, manualRecommendations_1 = manualRecommendations; _a < manualRecommendations_1.length; _a++) {
                        rec = manualRecommendations_1[_a];
                        if (rec.restaurantId)
                            uniqueRestaurantIds.add(rec.restaurantId);
                    }
                    return [2 /*return*/, uniqueRestaurantIds.size];
            }
        });
    });
}
/**
 * Calculate influence score for a user
 * Formula: (reviewCount * 10) + (recommendationCount * 15) + (favoritesCount * 5)
 */
export function calculateUserInfluenceScore(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var user, favorites, favoritesCount, recommendationCount, influenceScore;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.getUser(userId)];
                case 1:
                    user = _a.sent();
                    if (!user)
                        return [2 /*return*/, 0];
                    return [4 /*yield*/, storage.getUserRestaurantFavorites(userId)];
                case 2:
                    favorites = _a.sent();
                    favoritesCount = favorites.length;
                    return [4 /*yield*/, getUserRecommendationCount(userId)];
                case 3:
                    recommendationCount = _a.sent();
                    influenceScore = (user.reviewCount || 0) * 10 +
                        recommendationCount * 15 +
                        favoritesCount * 5;
                    return [2 /*return*/, influenceScore];
            }
        });
    });
}
/**
 * Check if a user is eligible for Golden Fork award
 */
export function checkGoldenForkEligibility(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var user, influenceScore, reviewCount, recommendationCount, stats;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.getUser(userId)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, {
                                eligible: false,
                                reason: 'User not found',
                                stats: { reviewCount: 0, recommendationCount: 0, influenceScore: 0 },
                            }];
                    }
                    return [4 /*yield*/, calculateUserInfluenceScore(userId)];
                case 2:
                    influenceScore = _a.sent();
                    reviewCount = user.reviewCount || 0;
                    return [4 /*yield*/, getUserRecommendationCount(userId)];
                case 3:
                    recommendationCount = _a.sent();
                    stats = { reviewCount: reviewCount, recommendationCount: recommendationCount, influenceScore: influenceScore };
                    if (reviewCount < GOLDEN_FORK_CRITERIA.minReviews) {
                        return [2 /*return*/, {
                                eligible: false,
                                reason: "Need ".concat(GOLDEN_FORK_CRITERIA.minReviews - reviewCount, " more reviews"),
                                stats: stats,
                            }];
                    }
                    if (recommendationCount < GOLDEN_FORK_CRITERIA.minRecommendations) {
                        return [2 /*return*/, {
                                eligible: false,
                                reason: "Need ".concat(GOLDEN_FORK_CRITERIA.minRecommendations - recommendationCount, " more recommendations"),
                                stats: stats,
                            }];
                    }
                    if (influenceScore < GOLDEN_FORK_CRITERIA.minInfluenceScore) {
                        return [2 /*return*/, {
                                eligible: false,
                                reason: "Need ".concat(GOLDEN_FORK_CRITERIA.minInfluenceScore - influenceScore, " more influence points"),
                                stats: stats,
                            }];
                    }
                    return [2 /*return*/, { eligible: true, stats: stats }];
            }
        });
    });
}
/**
 * Award Golden Fork to eligible user
 */
export function awardGoldenFork(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var user, eligibility;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.getUser(userId)];
                case 1:
                    user = _a.sent();
                    if (!user || user.hasGoldenFork)
                        return [2 /*return*/, false];
                    return [4 /*yield*/, checkGoldenForkEligibility(userId)];
                case 2:
                    eligibility = _a.sent();
                    if (!eligibility.eligible)
                        return [2 /*return*/, false];
                    // Award the Golden Fork
                    return [4 /*yield*/, db
                            .update(users)
                            .set({
                            hasGoldenFork: true,
                            goldenForkEarnedAt: new Date(),
                            influenceScore: eligibility.stats.influenceScore,
                        })
                            .where(eq(users.id, userId))];
                case 3:
                    // Award the Golden Fork
                    _a.sent();
                    // Record in award history
                    return [4 /*yield*/, db.insert(awardHistory).values({
                            awardType: 'golden_fork',
                            recipientId: userId,
                            recipientType: 'user',
                            awardPeriodStart: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
                            awardPeriodEnd: new Date(),
                            rankingScore: eligibility.stats.influenceScore,
                            metadata: { stats: eligibility.stats },
                        })];
                case 4:
                    // Record in award history
                    _a.sent();
                    return [2 /*return*/, true];
            }
        });
    });
}
/**
 * Calculate ranking score for a restaurant
 * Formula: (recommendationCount * 50) + (favoritesCount * 30) + (avgRating * 20) + (totalDealClaims * 10) + (totalDealViews * 1)
 */
export function calculateRestaurantRankingScore(restaurantId) {
    return __awaiter(this, void 0, void 0, function () {
        var restaurant, recommendations, recommendationCount, favorites, favoritesCount, reviews, avgRating, deals, totalDealClaims, totalDealViews, _loop_1, _i, deals_1, deal, rankingScore;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                case 1:
                    restaurant = _a.sent();
                    if (!restaurant)
                        return [2 /*return*/, 0];
                    return [4 /*yield*/, db.query.restaurantRecommendations.findMany({
                            where: function (rec) { return eq(rec.restaurantId, restaurantId); },
                        })];
                case 2:
                    recommendations = _a.sent();
                    recommendationCount = recommendations.length;
                    return [4 /*yield*/, db.query.restaurantFavorites.findMany({
                            where: function (fav) { return eq(fav.restaurantId, restaurantId); },
                        })];
                case 3:
                    favorites = _a.sent();
                    favoritesCount = favorites.length;
                    return [4 /*yield*/, db.query.reviews.findMany({
                            where: function (rev) { return eq(rev.restaurantId, restaurantId); },
                        })];
                case 4:
                    reviews = _a.sent();
                    avgRating = reviews.length > 0
                        ? reviews.reduce(function (sum, r) { return sum + r.rating; }, 0) / reviews.length
                        : 0;
                    return [4 /*yield*/, storage.getDealsByRestaurant(restaurantId)];
                case 5:
                    deals = _a.sent();
                    totalDealClaims = 0;
                    totalDealViews = 0;
                    _loop_1 = function (deal) {
                        var claims, views;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, db.query.dealClaims.findMany({
                                        where: function (claim) { return eq(claim.dealId, deal.id); },
                                    })];
                                case 1:
                                    claims = _b.sent();
                                    totalDealClaims += claims.length;
                                    return [4 /*yield*/, db.query.dealViews.findMany({
                                            where: function (view) { return eq(view.dealId, deal.id); },
                                        })];
                                case 2:
                                    views = _b.sent();
                                    totalDealViews += views.length;
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, deals_1 = deals;
                    _a.label = 6;
                case 6:
                    if (!(_i < deals_1.length)) return [3 /*break*/, 9];
                    deal = deals_1[_i];
                    return [5 /*yield**/, _loop_1(deal)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 6];
                case 9:
                    rankingScore = recommendationCount * 50 +
                        favoritesCount * 30 +
                        Math.round(avgRating * 20) +
                        totalDealClaims * 10 +
                        totalDealViews * 1;
                    return [2 /*return*/, rankingScore];
            }
        });
    });
}
/**
 * Award Golden Plates for a specific geographic area
 */
export function awardGoldenPlatesForArea(area) {
    return __awaiter(this, void 0, void 0, function () {
        var areaRestaurants, scoresMap, _i, areaRestaurants_1, restaurant, score, sortedRestaurants, awardCount, winners, periodStart, periodEnd, awardedCount, i, _a, restaurant, score;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, db.query.restaurants.findMany({
                        where: function (rest) {
                            return and(eq(rest.isActive, true), or(like(rest.address, "%".concat(area, "%")), eq(sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["lower(", ")"], ["lower(", ")"])), rest.address), area.toLowerCase())));
                        },
                    })];
                case 1:
                    areaRestaurants = _b.sent();
                    if (areaRestaurants.length === 0)
                        return [2 /*return*/, 0];
                    scoresMap = new Map();
                    _i = 0, areaRestaurants_1 = areaRestaurants;
                    _b.label = 2;
                case 2:
                    if (!(_i < areaRestaurants_1.length)) return [3 /*break*/, 5];
                    restaurant = areaRestaurants_1[_i];
                    return [4 /*yield*/, calculateRestaurantRankingScore(restaurant.id)];
                case 3:
                    score = _b.sent();
                    scoresMap.set(restaurant.id, score);
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    sortedRestaurants = areaRestaurants
                        .map(function (r) { return ({ restaurant: r, score: scoresMap.get(r.id) || 0 }); })
                        .filter(function (item) { return item.score >= GOLDEN_PLATE_CRITERIA.minRankingScore; })
                        .sort(function (a, b) { return b.score - a.score; });
                    awardCount = Math.max(1, Math.ceil(sortedRestaurants.length * GOLDEN_PLATE_CRITERIA.topPercentage));
                    winners = sortedRestaurants.slice(0, awardCount);
                    periodStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                    periodEnd = new Date();
                    awardedCount = 0;
                    i = 0;
                    _b.label = 6;
                case 6:
                    if (!(i < winners.length)) return [3 /*break*/, 10];
                    _a = winners[i], restaurant = _a.restaurant, score = _a.score;
                    // Update restaurant with Golden Plate
                    return [4 /*yield*/, db
                            .update(restaurants)
                            .set({
                            hasGoldenPlate: true,
                            goldenPlateEarnedAt: new Date(),
                            goldenPlateCount: (restaurant.goldenPlateCount || 0) + 1,
                            rankingScore: score,
                        })
                            .where(eq(restaurants.id, restaurant.id))];
                case 7:
                    // Update restaurant with Golden Plate
                    _b.sent();
                    // Record in award history
                    return [4 /*yield*/, db.insert(awardHistory).values({
                            awardType: 'golden_plate',
                            recipientId: restaurant.id,
                            recipientType: 'restaurant',
                            awardPeriodStart: periodStart,
                            awardPeriodEnd: periodEnd,
                            rankingScore: score,
                            rankPosition: i + 1,
                            geographicArea: area,
                            metadata: { restaurantName: restaurant.name },
                        })];
                case 8:
                    // Record in award history
                    _b.sent();
                    awardedCount++;
                    _b.label = 9;
                case 9:
                    i++;
                    return [3 /*break*/, 6];
                case 10: return [2 /*return*/, awardedCount];
            }
        });
    });
}
/**
 * Get leaderboard for a geographic area
 */
export function getAreaLeaderboard(area_1) {
    return __awaiter(this, arguments, void 0, function (area, limit) {
        var areaRestaurants, leaderboard, _i, areaRestaurants_2, restaurant, score;
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.query.restaurants.findMany({
                        where: function (rest) {
                            return and(eq(rest.isActive, true), or(like(rest.address, "%".concat(area, "%")), eq(sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["lower(", ")"], ["lower(", ")"])), rest.address), area.toLowerCase())));
                        },
                    })];
                case 1:
                    areaRestaurants = _a.sent();
                    leaderboard = [];
                    _i = 0, areaRestaurants_2 = areaRestaurants;
                    _a.label = 2;
                case 2:
                    if (!(_i < areaRestaurants_2.length)) return [3 /*break*/, 5];
                    restaurant = areaRestaurants_2[_i];
                    return [4 /*yield*/, calculateRestaurantRankingScore(restaurant.id)];
                case 3:
                    score = _a.sent();
                    leaderboard.push({
                        restaurant: restaurant,
                        rankingScore: score,
                    });
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, leaderboard.sort(function (a, b) { return b.rankingScore - a.rankingScore; }).slice(0, limit)];
            }
        });
    });
}
var templateObject_1, templateObject_2;

