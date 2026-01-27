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
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
var DEFAULT_PREFIX = "user";
var MIN_TAG_LEN = 3;
var MAX_TAG_LEN = 24;
var RESERVED_TAGS = new Set([
    "admin",
    "support",
    "staff",
    "mealscout",
    "tradescout",
    "help",
    "about",
    "login",
    "signup",
    "register",
    "ref",
    "affiliate",
]);
var PROFANITY = [
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "nigger",
    "cunt",
];
export function normalizeAffiliateTag(input) {
    return input.trim().toLowerCase();
}
export function isAffiliateTagValid(tag) {
    if (!tag)
        return false;
    if (tag.length < MIN_TAG_LEN || tag.length > MAX_TAG_LEN)
        return false;
    if (!/^[a-z0-9-]+$/.test(tag))
        return false;
    if (tag.startsWith("-") || tag.endsWith("-"))
        return false;
    if (RESERVED_TAGS.has(tag))
        return false;
    if (PROFANITY.some(function (word) { return tag.includes(word); }))
        return false;
    return true;
}
function isAffiliateTagAvailable(tag, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var existing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db
                        .select({ id: users.id })
                        .from(users)
                        .where(eq(users.affiliateTag, tag))
                        .limit(1)];
                case 1:
                    existing = _a.sent();
                    if (existing.length === 0)
                        return [2 /*return*/, true];
                    return [2 /*return*/, existing[0].id === userId];
            }
        });
    });
}
export function ensureAffiliateTag(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var user, tag, attempt, suffix, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.select().from(users).where(eq(users.id, userId))];
                case 1:
                    user = (_a.sent())[0];
                    if (!user) {
                        throw new Error("User not found");
                    }
                    if (user.affiliateTag) {
                        return [2 /*return*/, user.affiliateTag];
                    }
                    tag = "";
                    attempt = 0;
                    _a.label = 2;
                case 2:
                    if (!(attempt < 20)) return [3 /*break*/, 5];
                    suffix = Math.floor(1000 + Math.random() * 9000);
                    tag = "".concat(DEFAULT_PREFIX).concat(suffix);
                    return [4 /*yield*/, isAffiliateTagAvailable(tag)];
                case 3:
                    if (!(_a.sent()))
                        return [3 /*break*/, 4];
                    return [3 /*break*/, 5];
                case 4:
                    attempt += 1;
                    return [3 /*break*/, 2];
                case 5:
                    if (!tag) {
                        throw new Error("Unable to generate affiliate tag");
                    }
                    return [4 /*yield*/, db
                            .update(users)
                            .set({ affiliateTag: tag, updatedAt: new Date() })
                            .where(eq(users.id, userId))
                            .returning()];
                case 6:
                    updated = (_a.sent())[0];
                    if (!(updated === null || updated === void 0 ? void 0 : updated.affiliateTag)) {
                        throw new Error("Failed to set affiliate tag");
                    }
                    return [2 /*return*/, updated.affiliateTag];
            }
        });
    });
}
export function resolveAffiliateUserId(ref) {
    return __awaiter(this, void 0, void 0, function () {
        var user, byId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!ref)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, db
                            .select({ id: users.id })
                            .from(users)
                            .where(eq(users.affiliateTag, ref))
                            .limit(1)];
                case 1:
                    user = (_a.sent())[0];
                    if (user === null || user === void 0 ? void 0 : user.id)
                        return [2 /*return*/, user.id];
                    return [4 /*yield*/, db.select({ id: users.id }).from(users).where(eq(users.id, ref)).limit(1)];
                case 2:
                    byId = (_a.sent())[0];
                    return [2 /*return*/, (byId === null || byId === void 0 ? void 0 : byId.id) || null];
            }
        });
    });
}
export function setAffiliateTag(userId, rawTag) {
    return __awaiter(this, void 0, void 0, function () {
        var tag, available, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tag = normalizeAffiliateTag(rawTag);
                    if (!isAffiliateTagValid(tag)) {
                        throw new Error("Invalid affiliate tag");
                    }
                    return [4 /*yield*/, isAffiliateTagAvailable(tag, userId)];
                case 1:
                    available = _a.sent();
                    if (!available) {
                        throw new Error("Affiliate tag already taken");
                    }
                    return [4 /*yield*/, db
                            .update(users)
                            .set({ affiliateTag: tag, updatedAt: new Date() })
                            .where(eq(users.id, userId))
                            .returning()];
                case 2:
                    updated = (_a.sent())[0];
                    if (!(updated === null || updated === void 0 ? void 0 : updated.affiliateTag)) {
                        throw new Error("Failed to update affiliate tag");
                    }
                    return [2 /*return*/, updated.affiliateTag];
            }
        });
    });
}

