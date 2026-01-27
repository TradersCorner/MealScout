/**
 * Empty County Service
 *
 * Handles the empty county experience:
 * 1. Acknowledge no partners yet
 * 2. Reframe as opportunity for early backers
 * 3. Enable community restaurant submissions
 * 4. Fall back to nearby/state/national content
 * 5. Incentivize with affiliate opportunity
 */
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
import { db } from "./db.js";
import { restaurantSubmissions, restaurants } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
/**
 * Get content fallback chain for empty county
 * Order: Local (within X miles) -> Same State -> National
 */
export function getCountyContentFallback(county_1, state_1, category_1) {
    return __awaiter(this, arguments, void 0, function (county, state, category, limit) {
        var normalizedState, normalizedCounty, localRestaurants, stateRestaurants, anyRestaurants;
        if (limit === void 0) { limit = 20; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    normalizedState = state.trim();
                    normalizedCounty = county.trim();
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurants)
                            .where(and(
                        // loosely match "{county}" and "{state}" in the address text
                        // to approximate county-level coverage
                        // e.g., "East Baton Rouge Parish, LA"
                        sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["LOWER(", ") LIKE LOWER('%' || ", " || '%')"], ["LOWER(", ") LIKE LOWER('%' || ", " || '%')"])), restaurants.address, normalizedCounty), sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["LOWER(", ") LIKE LOWER('%' || ", " || '%')"], ["LOWER(", ") LIKE LOWER('%' || ", " || '%')"])), restaurants.address, normalizedState)))
                            .limit(limit)];
                case 1:
                    localRestaurants = _a.sent();
                    if (localRestaurants.length > 0) {
                        return [2 /*return*/, {
                                source: "local",
                                deals: [],
                                fallbackChain: ["local", "state", "national"],
                            }];
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurants)
                            .where(sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["LOWER(", ") LIKE LOWER('%' || ", " || '%')"], ["LOWER(", ") LIKE LOWER('%' || ", " || '%')"])), restaurants.address, normalizedState))
                            .limit(limit)];
                case 2:
                    stateRestaurants = _a.sent();
                    if (stateRestaurants.length > 0) {
                        return [2 /*return*/, {
                                source: "state",
                                deals: [],
                                fallbackChain: ["local", "state", "national"],
                            }];
                    }
                    return [4 /*yield*/, db.select().from(restaurants).limit(limit)];
                case 3:
                    anyRestaurants = _a.sent();
                    return [2 /*return*/, {
                            source: anyRestaurants.length > 0 ? "national" : "empty",
                            deals: [],
                            fallbackChain: ["local", "state", "national"],
                        }];
            }
        });
    });
}
/**
 * Submit a restaurant suggestion for an empty county
 * Turns "no data" into community-sourced pipeline
 */
export function submitRestaurant(submittedByUserId, restaurantName, address, county, state, data) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, submission;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .select()
                        .from(restaurantSubmissions)
                        .where(and(sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["LOWER(", ") = LOWER(", ")"], ["LOWER(", ") = LOWER(", ")"])), restaurantSubmissions.restaurantName, restaurantName), eq(restaurantSubmissions.county, county), eq(restaurantSubmissions.state, state)))
                        .limit(1)];
                case 1:
                    existing = (_a.sent())[0];
                    if (existing) {
                        return [2 /*return*/, {
                                success: false,
                                message: "This restaurant has already been submitted",
                                submission: existing,
                            }];
                    }
                    return [4 /*yield*/, db
                            .insert(restaurantSubmissions)
                            .values({
                            submittedByUserId: submittedByUserId,
                            restaurantName: restaurantName,
                            address: address,
                            county: county,
                            state: state,
                            website: data.website,
                            phoneNumber: data.phoneNumber,
                            category: data.category,
                            latitude: data.latitude,
                            longitude: data.longitude,
                            description: data.description,
                            photoUrl: data.photoUrl,
                        })
                            .returning()];
                case 2:
                    submission = _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            message: "Restaurant submitted! Our team will review and contact the owner.",
                            submission: submission[0],
                        }];
            }
        });
    });
}
/**
 * Get pending submissions for moderation
 */
export function getPendingSubmissions(county, state) {
    return __awaiter(this, void 0, void 0, function () {
        var submissions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .select()
                        .from(restaurantSubmissions)
                        .where(and(eq(restaurantSubmissions.status, "pending"), county ? eq(restaurantSubmissions.county, county) : undefined, state ? eq(restaurantSubmissions.state, state) : undefined))
                        .orderBy(restaurantSubmissions.createdAt)];
                case 1:
                    submissions = _a.sent();
                    return [2 /*return*/, submissions];
            }
        });
    });
}
/**
 * Approve a restaurant submission (admin)
 * Can either create a new restaurant or link to existing
 */
export function approveSubmission(submissionId, linkToRestaurantId) {
    return __awaiter(this, void 0, void 0, function () {
        var submission, updated_1, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .select()
                        .from(restaurantSubmissions)
                        .where(eq(restaurantSubmissions.id, submissionId))
                        .limit(1)];
                case 1:
                    submission = (_a.sent())[0];
                    if (!submission) {
                        throw new Error("Submission not found");
                    }
                    if (!linkToRestaurantId) return [3 /*break*/, 3];
                    return [4 /*yield*/, db
                            .update(restaurantSubmissions)
                            .set({
                            status: "converted",
                            convertedToRestaurantId: linkToRestaurantId,
                            approvedAt: new Date(),
                        })
                            .where(eq(restaurantSubmissions.id, submissionId))
                            .returning()];
                case 2:
                    updated_1 = _a.sent();
                    return [2 /*return*/, { success: true, submission: updated_1[0] }];
                case 3: return [4 /*yield*/, db
                        .update(restaurantSubmissions)
                        .set({
                        status: "approved",
                        approvedAt: new Date(),
                    })
                        .where(eq(restaurantSubmissions.id, submissionId))
                        .returning()];
                case 4:
                    updated = _a.sent();
                    return [2 /*return*/, { success: true, submission: updated[0] }];
            }
        });
    });
}
/**
 * Reject a submission (admin)
 */
export function rejectSubmission(submissionId, reason) {
    return __awaiter(this, void 0, void 0, function () {
        var updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .update(restaurantSubmissions)
                        .set({
                        status: "rejected",
                    })
                        .where(eq(restaurantSubmissions.id, submissionId))
                        .returning()];
                case 1:
                    updated = _a.sent();
                    return [2 /*return*/, { success: true, submission: updated[0] }];
            }
        });
    });
}
/**
 * Check if a county has content (restaurants or deals)
 */
export function isCountyEmpty(county, state) {
    return __awaiter(this, void 0, void 0, function () {
        var normalizedState, normalizedCounty, matches;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    normalizedState = state.trim();
                    normalizedCounty = county.trim();
                    return [4 /*yield*/, db
                            .select({ id: restaurants.id })
                            .from(restaurants)
                            .where(and(sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["LOWER(", ") LIKE LOWER('%' || ", " || '%')"], ["LOWER(", ") LIKE LOWER('%' || ", " || '%')"])), restaurants.address, normalizedCounty), sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["LOWER(", ") LIKE LOWER('%' || ", " || '%')"], ["LOWER(", ") LIKE LOWER('%' || ", " || '%')"])), restaurants.address, normalizedState)))
                            .limit(1)];
                case 1:
                    matches = _a.sent();
                    return [2 /*return*/, matches.length === 0];
            }
        });
    });
}
/**
 * Get engagement metrics for a county
 * Used to show "You're early" messaging
 */
export function getCountyEngagementMetrics(county, state) {
    return __awaiter(this, void 0, void 0, function () {
        var restaurantList, submissions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.select().from(restaurants)];
                case 1:
                    restaurantList = _a.sent();
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurantSubmissions)
                            .where(and(eq(restaurantSubmissions.county, county), eq(restaurantSubmissions.state, state), eq(restaurantSubmissions.status, "pending")))];
                case 2:
                    submissions = _a.sent();
                    return [2 /*return*/, {
                            restaurantCount: restaurantList.length,
                            submissionCount: submissions.length,
                            isEmpty: restaurantList.length === 0,
                            isEarlyStage: restaurantList.length < 10,
                            message: restaurantList.length === 0
                                ? "Be first — help shape your local food scene"
                                : "You're early \u2014 only ".concat(restaurantList.length, " restaurants here so far"),
                        }];
            }
        });
    });
}
export default {
    getCountyContentFallback: getCountyContentFallback,
    submitRestaurant: submitRestaurant,
    getPendingSubmissions: getPendingSubmissions,
    approveSubmission: approveSubmission,
    rejectSubmission: rejectSubmission,
    isCountyEmpty: isCountyEmpty,
    getCountyEngagementMetrics: getCountyEngagementMetrics,
};
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;

