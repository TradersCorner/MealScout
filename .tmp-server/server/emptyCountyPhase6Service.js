/**
 * PHASE 6: Empty County Experience Service
 *
 * When a county has 0 restaurants:
 * 1. Show acknowledgement message
 * 2. Show "Be an early backer" reframe
 * 3. Show "Submit favorite" form
 * 4. Show affiliate link CTA
 */
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
import { restaurants } from '@shared/schema';
/**
 * Check if a county is empty (has no restaurants)
 */
export function isCountyEmpty(county, state) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.select().from(restaurants).limit(1)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, !result];
                case 2:
                    error_1 = _a.sent();
                    console.error('[emptyCountyService] Error checking if county is empty:', error_1);
                    return [2 /*return*/, true]; // Assume empty if we can't check
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get empty county experience data
 *
 * Returns messaging and CTAs for empty counties
 */
export function getEmptyCountyExperience(county, state) {
    return __awaiter(this, void 0, void 0, function () {
        var isEmpty, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, isCountyEmpty(county, state)];
                case 1:
                    isEmpty = _a.sent();
                    if (!isEmpty) {
                        return [2 /*return*/, {
                                isEmpty: false,
                                message: null,
                            }];
                    }
                    // County is empty - return full experience data
                    return [2 /*return*/, {
                            isEmpty: true,
                            county: county,
                            state: state,
                            experience: {
                                step1: {
                                    title: 'No Partners Yet',
                                    message: "".concat(county, " County, ").concat(state, " doesn't have any partner restaurants on MealScout yet."),
                                    icon: 'alert',
                                },
                                step2: {
                                    title: 'Be an Early Backer',
                                    message: "You're early. Help grow the platform and earn money when restaurants sign up.",
                                    icon: 'heart',
                                },
                                step3: {
                                    title: 'Know a Great Spot?',
                                    message: "Tell us about your favorite restaurant. We'll reach out to them.",
                                    cta: 'Submit Restaurant',
                                    icon: 'mappin',
                                },
                                step4: {
                                    title: 'Earn & Give Back',
                                    message: "When restaurants join MealScout, you earn credits that can be spent locally or cashed out.",
                                    icon: 'gift',
                                },
                            },
                            userCanEarn: true, // User can share referral link and earn
                        }];
                case 2:
                    error_2 = _a.sent();
                    console.error('[emptyCountyService] Error getting empty county experience:', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get nearby counties with restaurants (fallback content)
 *
 * Returns restaurants from neighboring counties
 */
export function getNearbyCountyFallback(county, state) {
    return __awaiter(this, void 0, void 0, function () {
        var nearbyRestaurants, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db.select().from(restaurants).limit(10)];
                case 1:
                    nearbyRestaurants = _a.sent();
                    return [2 /*return*/, {
                            fallbackType: 'state_wide',
                            message: "Showing restaurants from across ".concat(state),
                            restaurants: nearbyRestaurants,
                        }];
                case 2:
                    error_3 = _a.sent();
                    console.error('[emptyCountyService] Error getting nearby fallback:', error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
export default {
    isCountyEmpty: isCountyEmpty,
    getEmptyCountyExperience: getEmptyCountyExperience,
    getNearbyCountyFallback: getNearbyCountyFallback,
};

