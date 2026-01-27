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
import { Router } from "express";
import { storage } from "../storage.js";
import { db } from "../db.js";
import { deals, restaurants, creditLedger } from "@shared/schema";
import { eq, and, like, ilike } from "drizzle-orm";
var router = Router();
// ==================== ACTION HANDLERS ====================
/**
 * Search deals by location, category, or text
 */
function findDeals(params) {
    return __awaiter(this, void 0, void 0, function () {
        var limit, offset, conditions, results, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    limit = Math.min(params.limit || 20, 100);
                    offset = params.offset || 0;
                    conditions = [eq(deals.isActive, true)];
                    if (params.search) {
                        conditions.push(like(deals.title, "%".concat(params.search, "%")));
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(deals)
                            .where(and.apply(void 0, conditions))
                            .limit(limit)
                            .offset(offset)];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            data: results,
                            count: results.length,
                        }];
                case 2:
                    error_1 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_1.message,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Search restaurants by name, location, or cuisine
 */
function findRestaurants(params) {
    return __awaiter(this, void 0, void 0, function () {
        var limit, offset, conditions, results, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    limit = Math.min(params.limit || 20, 100);
                    offset = params.offset || 0;
                    conditions = [eq(restaurants.isActive, true)];
                    if (params.search) {
                        conditions.push(ilike(restaurants.name, "%".concat(params.search, "%")));
                    }
                    if (params.location) {
                        conditions.push(like(restaurants.address, "%".concat(params.location, "%")));
                    }
                    if (params.cuisine) {
                        conditions.push(like(restaurants.cuisineType, "%".concat(params.cuisine, "%")));
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(restaurants)
                            .where(and.apply(void 0, conditions))
                            .limit(limit)
                            .offset(offset)];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            data: results,
                            count: results.length,
                        }];
                case 2:
                    error_2 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_2.message,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Create a new restaurant (restaurant owner action)
 */
function createRestaurant(params) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!params.userId || !params.name || !params.address) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Missing required fields: userId, name, address",
                            }];
                    }
                    return [4 /*yield*/, storage.createRestaurant({
                            ownerId: params.userId,
                            name: params.name,
                            address: params.address,
                            cuisineType: params.cuisineType,
                            phoneNumber: params.phoneNumber,
                            websiteUrl: params.websiteUrl,
                            isActive: true,
                            latitude: "0",
                            longitude: "0",
                        })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            data: result,
                        }];
                case 2:
                    error_3 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_3.message,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Update restaurant data (restaurant owner action)
 */
function updateRestaurant(params) {
    return __awaiter(this, void 0, void 0, function () {
        var restaurant, updated, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!params.restaurantId || !params.userId) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Missing required fields: restaurantId, userId",
                            }];
                    }
                    return [4 /*yield*/, storage.getRestaurant(params.restaurantId)];
                case 1:
                    restaurant = _a.sent();
                    if (!restaurant || restaurant.ownerId !== params.userId) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Unauthorized: You do not own this restaurant",
                            }];
                    }
                    return [4 /*yield*/, storage.updateRestaurant(params.restaurantId, params.updates)];
                case 2:
                    updated = _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            data: updated,
                        }];
                case 3:
                    error_4 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_4.message,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get live food truck locations
 */
function getFoodTruckLocations(params) {
    return __awaiter(this, void 0, void 0, function () {
        var latitude, longitude, radius, trucks, error_5;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    if (params.latitude === undefined ||
                        params.longitude === undefined) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Missing required fields: latitude, longitude",
                            }];
                    }
                    latitude = Number(params.latitude);
                    longitude = Number(params.longitude);
                    radius = Math.min(Number((_a = params.radiusKm) !== null && _a !== void 0 ? _a : 5), 50);
                    if (Number.isNaN(latitude) ||
                        Number.isNaN(longitude) ||
                        Number.isNaN(radius)) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Invalid coordinates or radius",
                            }];
                    }
                    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Invalid coordinates range",
                            }];
                    }
                    return [4 /*yield*/, storage.getLiveTrucksNearby(latitude, longitude, radius)];
                case 1:
                    trucks = _b.sent();
                    return [2 /*return*/, {
                            success: true,
                            data: trucks,
                            count: trucks.length,
                        }];
                case 2:
                    error_5 = _b.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_5.message,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Redeem credits (user action)
 */
function redeemCredits(params) {
    return __awaiter(this, void 0, void 0, function () {
        var user, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!params.userId || !params.amount || params.amount <= 0) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Missing or invalid required fields: userId, amount (must be > 0)",
                            }];
                    }
                    return [4 /*yield*/, storage.getUser(params.userId)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, {
                                success: false,
                                error: "User not found",
                            }];
                    }
                    // Create credit redemption entry in ledger
                    return [4 /*yield*/, db.insert(creditLedger).values({
                            userId: params.userId,
                            amount: params.amount,
                            sourceType: "redemption",
                            description: params.reason || "Credits redeemed",
                            dealId: params.dealId,
                            sourceUserId: params.userId,
                        })];
                case 2:
                    // Create credit redemption entry in ledger
                    _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            data: {
                                amountRedeemed: params.amount,
                                message: "Credits redeemed successfully",
                            },
                        }];
                case 3:
                    error_6 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_6.message,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get user's credit balance
 */
function getCreditBalance(params) {
    return __awaiter(this, void 0, void 0, function () {
        var user, credits, balance, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!params.userId) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Missing required field: userId",
                            }];
                    }
                    return [4 /*yield*/, storage.getUser(params.userId)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, {
                                success: false,
                                error: "User not found",
                            }];
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(creditLedger)
                            .where(eq(creditLedger.userId, params.userId))];
                case 2:
                    credits = _a.sent();
                    balance = credits.reduce(function (sum, credit) { return sum + parseFloat(credit.amount); }, 0);
                    return [2 /*return*/, {
                            success: true,
                            data: {
                                userId: params.userId,
                                balance: Math.max(0, balance),
                            },
                        }];
                case 3:
                    error_7 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_7.message,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get restaurant details
 */
function getRestaurantDetails(params) {
    return __awaiter(this, void 0, void 0, function () {
        var restaurant, restaurantDeals, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!params.restaurantId) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Missing required field: restaurantId",
                            }];
                    }
                    return [4 /*yield*/, storage.getRestaurant(params.restaurantId)];
                case 1:
                    restaurant = _a.sent();
                    if (!restaurant) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Restaurant not found",
                            }];
                    }
                    return [4 /*yield*/, db
                            .select()
                            .from(deals)
                            .where(and(eq(deals.restaurantId, params.restaurantId), eq(deals.isActive, true)))];
                case 2:
                    restaurantDeals = _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            data: {
                                restaurant: restaurant,
                                activeDeals: restaurantDeals,
                                dealCount: restaurantDeals.length,
                            },
                        }];
                case 3:
                    error_8 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_8.message,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Submit community builder application
 */
function submitBuilderApplication(params) {
    return __awaiter(this, void 0, void 0, function () {
        var user, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!params.userId || !params.countyName) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Missing required fields: userId, countyName",
                            }];
                    }
                    return [4 /*yield*/, storage.getUser(params.userId)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, {
                                success: false,
                                error: "User not found",
                            }];
                    }
                    return [2 /*return*/, {
                            success: true,
                            data: {
                                userId: params.userId,
                                countyName: params.countyName,
                                status: "submitted",
                                message: "Community builder application submitted. Check back soon!",
                            },
                        }];
                case 2:
                    error_9 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_9.message,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get county transparency data
 */
function getCountyTransparency(params) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                if (!params.countyName) {
                    return [2 /*return*/, {
                            success: false,
                            error: "Missing required field: countyName",
                        }];
                }
                return [2 /*return*/, {
                        success: true,
                        data: {
                            countyName: params.countyName,
                            message: "County transparency endpoint - feature coming soon",
                        },
                    }];
            }
            catch (error) {
                return [2 /*return*/, {
                        success: false,
                        error: error.message,
                    }];
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Get redemption ledger for county
 */
function getCountyRedemptionLedger(params) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                if (!params.countyName) {
                    return [2 /*return*/, {
                            success: false,
                            error: "Missing required field: countyName",
                        }];
                }
                return [2 /*return*/, {
                        success: true,
                        data: [],
                        count: 0,
                        message: "County redemption ledger endpoint - feature coming soon",
                    }];
            }
            catch (error) {
                return [2 /*return*/, {
                        success: false,
                        error: error.message,
                    }];
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Get county vault status
 */
function getCountyVault(params) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                if (!params.countyName) {
                    return [2 /*return*/, {
                            success: false,
                            error: "Missing required field: countyName",
                        }];
                }
                return [2 /*return*/, {
                        success: true,
                        data: {
                            countyName: params.countyName,
                            message: "County vault endpoint - feature coming soon",
                        },
                    }];
            }
            catch (error) {
                return [2 /*return*/, {
                        success: false,
                        error: error.message,
                    }];
            }
            return [2 /*return*/];
        });
    });
}
// ==================== MAIN ACTION ROUTER ====================
router.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, action, params, result, _b, err_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, action = _a.action, params = _a.params;
                if (!action) {
                    return [2 /*return*/, res.status(400).json({
                            error: "Missing required field: action",
                        })];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 28, , 29]);
                result = void 0;
                _b = action;
                switch (_b) {
                    case "FIND_DEALS": return [3 /*break*/, 2];
                    case "FIND_RESTAURANTS": return [3 /*break*/, 4];
                    case "GET_RESTAURANT_DETAILS": return [3 /*break*/, 6];
                    case "CREATE_RESTAURANT": return [3 /*break*/, 8];
                    case "UPDATE_RESTAURANT": return [3 /*break*/, 10];
                    case "GET_FOOD_TRUCKS": return [3 /*break*/, 12];
                    case "REDEEM_CREDITS": return [3 /*break*/, 14];
                    case "GET_CREDITS_BALANCE": return [3 /*break*/, 16];
                    case "SUBMIT_BUILDER_APPLICATION": return [3 /*break*/, 18];
                    case "GET_COUNTY_TRANSPARENCY": return [3 /*break*/, 20];
                    case "GET_COUNTY_LEDGER": return [3 /*break*/, 22];
                    case "GET_COUNTY_VAULT": return [3 /*break*/, 24];
                }
                return [3 /*break*/, 26];
            case 2: return [4 /*yield*/, findDeals(params || {})];
            case 3:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 4: return [4 /*yield*/, findRestaurants(params || {})];
            case 5:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 6: return [4 /*yield*/, getRestaurantDetails(params || {})];
            case 7:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 8: return [4 /*yield*/, createRestaurant(params || {})];
            case 9:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 10: return [4 /*yield*/, updateRestaurant(params || {})];
            case 11:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 12: return [4 /*yield*/, getFoodTruckLocations(params || {})];
            case 13:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 14: return [4 /*yield*/, redeemCredits(params || {})];
            case 15:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 16: return [4 /*yield*/, getCreditBalance(params || {})];
            case 17:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 18: return [4 /*yield*/, submitBuilderApplication(params || {})];
            case 19:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 20: return [4 /*yield*/, getCountyTransparency(params || {})];
            case 21:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 22: return [4 /*yield*/, getCountyRedemptionLedger(params || {})];
            case 23:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 24: return [4 /*yield*/, getCountyVault(params || {})];
            case 25:
                result = _c.sent();
                return [3 /*break*/, 27];
            case 26: return [2 /*return*/, res.status(400).json({
                    error: "Unknown action: ".concat(action),
                    supportedActions: [
                        "FIND_DEALS",
                        "FIND_RESTAURANTS",
                        "GET_RESTAURANT_DETAILS",
                        "CREATE_RESTAURANT",
                        "UPDATE_RESTAURANT",
                        "GET_FOOD_TRUCKS",
                        "REDEEM_CREDITS",
                        "GET_CREDITS_BALANCE",
                        "SUBMIT_BUILDER_APPLICATION",
                        "GET_COUNTY_TRANSPARENCY",
                        "GET_COUNTY_LEDGER",
                        "GET_COUNTY_VAULT",
                    ],
                })];
            case 27: return [2 /*return*/, res.json(result)];
            case 28:
                err_1 = _c.sent();
                console.error("Error in action ".concat(action, ":"), err_1);
                return [2 /*return*/, res.status(500).json({
                        error: "Internal server error",
                        message: err_1.message,
                    })];
            case 29: return [2 /*return*/];
        }
    });
}); });
export default router;

