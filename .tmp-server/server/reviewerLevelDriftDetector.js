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
import { and, eq, isNotNull, sql } from "drizzle-orm";
// In-process memory for one-shot transition markers.
// NOTE: resets when the node process restarts (no schema changes required).
var lastHadDrift = null;
export function detectReviewerLevelDrift(db_1, logger_1, schema_1) {
    return __awaiter(this, arguments, void 0, function (db, logger, schema, opts) {
        var limit, includeZeroCases, severityThreshold, enableDriftStartedMarker, enableDriftResolvedMarker, videoStories, userReviewerLevels, recCounts, scanned, mismatchRows, limited, rowsToLog, totals, mismatchesFound, missingRowsFound, valueMismatchesFound, _i, rowsToLog_1, row, summary, hasDriftNow, zeroCases, _a, zeroCases_1, row;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (opts === void 0) { opts = {}; }
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    limit = typeof opts.limit === "number" && opts.limit > 0 ? Math.floor(opts.limit) : 200;
                    includeZeroCases = Boolean(opts.includeZeroCases);
                    severityThreshold = typeof opts.severityThreshold === "number" && opts.severityThreshold >= 0
                        ? Math.floor(opts.severityThreshold)
                        : 50;
                    enableDriftStartedMarker = opts.enableDriftStartedMarker === undefined ? true : Boolean(opts.enableDriftStartedMarker);
                    enableDriftResolvedMarker = opts.enableDriftResolvedMarker === undefined ? true : Boolean(opts.enableDriftResolvedMarker);
                    videoStories = schema.videoStories, userReviewerLevels = schema.userReviewerLevels;
                    recCounts = db
                        .select({
                        userId: videoStories.userId,
                        distinctRestaurants: sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["count(distinct ", ")"], ["count(distinct ", ")"])), videoStories.restaurantId).mapWith(Number),
                    })
                        .from(videoStories)
                        .where(isNotNull(videoStories.restaurantId))
                        .groupBy(videoStories.userId)
                        .as("recCounts");
                    return [4 /*yield*/, db
                            .select({ n: sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["count(*)"], ["count(*)"]))).mapWith(Number) })
                            .from(recCounts)];
                case 1:
                    scanned = _m.sent();
                    return [4 /*yield*/, db
                            .select({
                            userId: recCounts.userId,
                            distinctRestaurants: recCounts.distinctRestaurants,
                            storedTotalStories: sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["coalesce(", ", -1)"], ["coalesce(", ", -1)"])), userReviewerLevels.totalStories).mapWith(Number),
                            hasLevelRow: sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["(", " is not null)"], ["(", " is not null)"])), userReviewerLevels.userId).mapWith(Boolean),
                        })
                            .from(recCounts)
                            .leftJoin(userReviewerLevels, eq(userReviewerLevels.userId, recCounts.userId))
                            .where(sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["coalesce(", ", -1) <> ", ""], ["coalesce(", ", -1) <> ", ""])), userReviewerLevels.totalStories, recCounts.distinctRestaurants))
                            .orderBy(sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["", " desc"], ["", " desc"])), recCounts.distinctRestaurants))
                            .limit(limit + 1)];
                case 2:
                    mismatchRows = _m.sent();
                    limited = mismatchRows.length > limit;
                    rowsToLog = limited ? mismatchRows.slice(0, limit) : mismatchRows;
                    return [4 /*yield*/, db
                            .select({
                            mismatchesFound: sql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["count(*)"], ["count(*)"]))).mapWith(Number),
                            missingRowsFound: sql(templateObject_8 || (templateObject_8 = __makeTemplateObject(["sum(case when ", " is null then 1 else 0 end)"], ["sum(case when ", " is null then 1 else 0 end)"])), userReviewerLevels.userId).mapWith(Number),
                            valueMismatchesFound: sql(templateObject_9 || (templateObject_9 = __makeTemplateObject(["sum(case when ", " is not null then 1 else 0 end)"], ["sum(case when ", " is not null then 1 else 0 end)"])), userReviewerLevels.userId).mapWith(Number),
                        })
                            .from(recCounts)
                            .leftJoin(userReviewerLevels, eq(userReviewerLevels.userId, recCounts.userId))
                            .where(sql(templateObject_10 || (templateObject_10 = __makeTemplateObject(["coalesce(", ", -1) <> ", ""], ["coalesce(", ", -1) <> ", ""])), userReviewerLevels.totalStories, recCounts.distinctRestaurants))];
                case 3:
                    totals = _m.sent();
                    mismatchesFound = (_c = (_b = totals === null || totals === void 0 ? void 0 : totals[0]) === null || _b === void 0 ? void 0 : _b.mismatchesFound) !== null && _c !== void 0 ? _c : 0;
                    missingRowsFound = (_e = (_d = totals === null || totals === void 0 ? void 0 : totals[0]) === null || _d === void 0 ? void 0 : _d.missingRowsFound) !== null && _e !== void 0 ? _e : 0;
                    valueMismatchesFound = (_g = (_f = totals === null || totals === void 0 ? void 0 : totals[0]) === null || _f === void 0 ? void 0 : _f.valueMismatchesFound) !== null && _g !== void 0 ? _g : 0;
                    // Detailed per-user logs (diagnostics)
                    for (_i = 0, rowsToLog_1 = rowsToLog; _i < rowsToLog_1.length; _i++) {
                        row = rowsToLog_1[_i];
                        if (!row.hasLevelRow || row.storedTotalStories === -1) {
                            logger.warn("ReviewerLevel drift: missing userReviewerLevels row", {
                                alertKey: "reviewerLevelDrift",
                                userId: row.userId,
                                durableDistinctRestaurants: row.distinctRestaurants,
                                storedTotalStories: null,
                            });
                        }
                        else {
                            logger.warn("ReviewerLevel drift: totalStories mismatch", {
                                alertKey: "reviewerLevelDrift",
                                userId: row.userId,
                                durableDistinctRestaurants: row.distinctRestaurants,
                                storedTotalStories: row.storedTotalStories,
                                delta: row.distinctRestaurants - row.storedTotalStories,
                            });
                        }
                    }
                    summary = {
                        scannedUsersWithRecs: (_j = (_h = scanned === null || scanned === void 0 ? void 0 : scanned[0]) === null || _h === void 0 ? void 0 : _h.n) !== null && _j !== void 0 ? _j : 0,
                        mismatchesFound: mismatchesFound,
                        mismatchesLogged: rowsToLog.length,
                        missingRowsFound: missingRowsFound,
                        valueMismatchesFound: valueMismatchesFound,
                        limited: limited,
                        limit: limit,
                        severityThreshold: severityThreshold,
                        alertKey: "reviewerLevelDrift",
                    };
                    hasDriftNow = mismatchesFound > 0 || limited;
                    // Transition markers (one-shot per process)
                    if (enableDriftStartedMarker && lastHadDrift === false && hasDriftNow) {
                        logger.error("ReviewerLevel drift: DRIFT STARTED", __assign(__assign({}, summary), { metricKey: "reviewerLevelDrift.started" }));
                    }
                    if (enableDriftResolvedMarker && lastHadDrift === true && !hasDriftNow) {
                        logger.info("ReviewerLevel drift: DRIFT RESOLVED", __assign(__assign({}, summary), { metricKey: "reviewerLevelDrift.resolved" }));
                    }
                    lastHadDrift = hasDriftNow;
                    // Summary line (alert routing should key off this)
                    if (hasDriftNow) {
                        logger.warn("ReviewerLevel drift: SUMMARY", __assign(__assign({}, summary), { metricKey: "reviewerLevelDrift.summary_with_drift" }));
                    }
                    else {
                        logger.info("ReviewerLevel drift: SUMMARY", summary);
                    }
                    // Severity escalator (strong signal)
                    if (mismatchesFound >= severityThreshold) {
                        logger.error("ReviewerLevel drift: SEVERE", __assign(__assign({}, summary), { metricKey: "reviewerLevelDrift.severe" }));
                    }
                    if (limited) {
                        logger.warn("ReviewerLevel drift: mismatch log limit reached", {
                            limit: limit,
                            mismatchesFound: mismatchesFound,
                            note: "Increase limit temporarily if diagnosing a large drift event.",
                        });
                    }
                    if (!includeZeroCases) return [3 /*break*/, 5];
                    return [4 /*yield*/, db
                            .select({
                            userId: userReviewerLevels.userId,
                            storedTotalStories: userReviewerLevels.totalStories,
                        })
                            .from(userReviewerLevels)
                            .where(and(sql(templateObject_11 || (templateObject_11 = __makeTemplateObject(["not exists (select 1 from ", " vs where vs.", " = ", " and vs.", " is not null)"], ["not exists (select 1 from ", " vs where vs.", " = ", " and vs.", " is not null)"])), videoStories, videoStories.userId.name, userReviewerLevels.userId, videoStories.restaurantId.name), sql(templateObject_12 || (templateObject_12 = __makeTemplateObject(["", " <> 0"], ["", " <> 0"])), userReviewerLevels.totalStories)))
                            .limit(limit)];
                case 4:
                    zeroCases = _m.sent();
                    for (_a = 0, zeroCases_1 = zeroCases; _a < zeroCases_1.length; _a++) {
                        row = zeroCases_1[_a];
                        logger.warn("ReviewerLevel drift: level row exists but no restaurant-tagged stories found", {
                            alertKey: "reviewerLevelDrift",
                            userId: row.userId,
                            storedTotalStories: row.storedTotalStories,
                            durableDistinctRestaurants: 0,
                        });
                    }
                    _m.label = 5;
                case 5: return [2 /*return*/, {
                        scannedUsersWithRecs: (_l = (_k = scanned === null || scanned === void 0 ? void 0 : scanned[0]) === null || _k === void 0 ? void 0 : _k.n) !== null && _l !== void 0 ? _l : 0,
                        mismatchesFound: mismatchesFound,
                        mismatchesLogged: rowsToLog.length,
                        missingRowsFound: missingRowsFound,
                        valueMismatchesFound: valueMismatchesFound,
                        limited: limited,
                    }];
            }
        });
    });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12;
