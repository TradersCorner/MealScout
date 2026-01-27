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
import crypto from "crypto";
import { storage } from "../storage.js";
import { emailService } from "../emailService.js";
export function sendAccountSetupInvite(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var setupToken, tokenHash, expiresAt, baseUrl, setupUrl, createdByName;
        var _c;
        var user = _b.user, createdBy = _b.createdBy, req = _b.req;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    setupToken = crypto.randomBytes(32).toString("hex");
                    tokenHash = crypto.createHash("sha256").update(setupToken).digest("hex");
                    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, storage.createAccountSetupToken({
                            userId: user.id,
                            tokenHash: tokenHash,
                            expiresAt: expiresAt,
                            createdByUserId: (_c = createdBy === null || createdBy === void 0 ? void 0 : createdBy.id) !== null && _c !== void 0 ? _c : undefined,
                            requestIp: req.ip || undefined,
                            userAgent: req.get("User-Agent") || undefined,
                        })];
                case 1:
                    _d.sent();
                    baseUrl = process.env.PUBLIC_BASE_URL || "".concat(req.protocol, "://").concat(req.get("host"));
                    setupUrl = "".concat(baseUrl.replace(/\/+$/, ""), "/account-setup?token=").concat(encodeURIComponent(setupToken));
                    createdByName = (createdBy === null || createdBy === void 0 ? void 0 : createdBy.firstName)
                        ? "".concat(createdBy.firstName, " ").concat(createdBy.lastName || "").trim()
                        : undefined;
                    return [2 /*return*/, emailService.sendAccountSetupEmail(user, setupUrl, createdByName)];
            }
        });
    });
}

