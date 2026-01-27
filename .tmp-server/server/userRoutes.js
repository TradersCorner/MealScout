/**
 * User API Routes
 *
 * Handles user-related endpoints including credit balance
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
import { Router } from "express";
import { and, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "./db.js";
import { users } from "@shared/schema";
import { getUserCreditBalance } from "./creditService.js";
var router = Router();
/**
 * GET /api/users/:userId/balance
 *
 * Get user's current credit balance (for form validation)
 */
router.get("/:userId/balance", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, balance, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                return [4 /*yield*/, getUserCreditBalance(userId)];
            case 1:
                balance = _a.sent();
                res.json({
                    userId: userId,
                    balance: balance,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error("[userRoutes] Error getting user balance:", error_1);
                res.status(500).json({
                    error: "Failed to fetch user balance",
                    message: error_1 instanceof Error ? error_1.message : "Unknown error",
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/users/search
 *
 * Search for users by email (for restaurant credit redemption form)
 */
router.get("/search", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, q, _b, limit, parsedLimit, results, mapped, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.query, q = _a.q, _b = _a.limit, limit = _b === void 0 ? 5 : _b;
                if (!q || typeof q !== "string") {
                    return [2 /*return*/, res.status(400).json({ error: "Search query required" })];
                }
                parsedLimit = Math.min(Number(limit) || 5, 20);
                return [4 /*yield*/, db
                        .select({
                        id: users.id,
                        email: users.email,
                        firstName: users.firstName,
                        lastName: users.lastName,
                    })
                        .from(users)
                        .where(and(ilike(users.email, "%".concat(q, "%")), or(eq(users.isDisabled, false), isNull(users.isDisabled))))
                        .limit(parsedLimit)];
            case 1:
                results = _c.sent();
                mapped = results.map(function (u) {
                    var _a, _b;
                    var nameParts = [u.firstName, u.lastName].filter(Boolean);
                    return {
                        id: u.id,
                        email: (_a = u.email) !== null && _a !== void 0 ? _a : "",
                        name: nameParts.length > 0 ? nameParts.join(" ") : (_b = u.email) !== null && _b !== void 0 ? _b : "",
                    };
                });
                res.json({ users: mapped });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _c.sent();
                console.error("[userRoutes] Error searching users:", error_2);
                res.status(500).json({
                    error: "Failed to search users",
                    message: error_2 instanceof Error ? error_2.message : "Unknown error",
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
export default router;

