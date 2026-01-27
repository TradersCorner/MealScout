// VAC-lite: Auto-verify restaurant signup (real signals only)
// Uses verifiable DNS, email domain, and consistency checks to determine verification eligibility
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
import { logAudit } from "./auditLogger.js";
function vacNormalizePhone(input) {
    return String(input || "").replace(/\D/g, "").slice(-10);
}
function vacSafeLower(input) {
    return String(input || "").trim().toLowerCase();
}
function vacGetEmailDomain(email) {
    var e = vacSafeLower(email);
    var at = e.lastIndexOf("@");
    if (at <= 0 || at === e.length - 1)
        return "";
    return e.slice(at + 1);
}
function vacGetHostnameFromUrl(url) {
    try {
        if (!url)
            return "";
        var u = String(url).trim();
        if (!u)
            return "";
        if (!/^https?:\/\//i.test(u))
            u = "https://" + u;
        var host = new URL(u).hostname || "";
        return host.replace(/^www\./i, "").toLowerCase();
    }
    catch (_a) {
        return "";
    }
}
function vacHasMx(domain) {
    return __awaiter(this, void 0, void 0, function () {
        var resolveMx, records, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    if (!domain)
                        return [2 /*return*/, false];
                    return [4 /*yield*/, import("dns/promises")];
                case 1:
                    resolveMx = (_b.sent()).resolveMx;
                    return [4 /*yield*/, resolveMx(domain)];
                case 2:
                    records = _b.sent();
                    return [2 /*return*/, Array.isArray(records) && records.length > 0];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function vacHasDns(domain) {
    return __awaiter(this, void 0, void 0, function () {
        var dns, any, _a, a, _b, aaaa, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 15, , 16]);
                    if (!domain)
                        return [2 /*return*/, false];
                    return [4 /*yield*/, import("dns/promises")];
                case 1:
                    dns = _e.sent();
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 5, , 6]);
                    if (!(typeof dns.resolveAny === "function")) return [3 /*break*/, 4];
                    return [4 /*yield*/, dns.resolveAny(domain)];
                case 3:
                    any = _e.sent();
                    if (Array.isArray(any) && any.length > 0)
                        return [2 /*return*/, true];
                    _e.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    _a = _e.sent();
                    return [3 /*break*/, 6];
                case 6:
                    _e.trys.push([6, 9, , 10]);
                    if (!(typeof dns.resolve4 === "function")) return [3 /*break*/, 8];
                    return [4 /*yield*/, dns.resolve4(domain)];
                case 7:
                    a = _e.sent();
                    if (Array.isArray(a) && a.length > 0)
                        return [2 /*return*/, true];
                    _e.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    _b = _e.sent();
                    return [3 /*break*/, 10];
                case 10:
                    _e.trys.push([10, 13, , 14]);
                    if (!(typeof dns.resolve6 === "function")) return [3 /*break*/, 12];
                    return [4 /*yield*/, dns.resolve6(domain)];
                case 11:
                    aaaa = _e.sent();
                    if (Array.isArray(aaaa) && aaaa.length > 0)
                        return [2 /*return*/, true];
                    _e.label = 12;
                case 12: return [3 /*break*/, 14];
                case 13:
                    _c = _e.sent();
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/, false];
                case 15:
                    _d = _e.sent();
                    return [2 /*return*/, false];
                case 16: return [2 /*return*/];
            }
        });
    });
}
function vacIsFreeEmailDomain(domain) {
    var d = (domain || "").toLowerCase();
    return [
        "gmail.com",
        "yahoo.com",
        "outlook.com",
        "hotmail.com",
        "icloud.com",
        "aol.com",
        "proton.me",
        "protonmail.com"
    ].includes(d);
}
/**
 * VAC-lite evaluator for restaurant signups.
 * - Uses ONLY real, checkable signals (DNS + consistency + completeness).
 * - Never throws (safe for signup path).
 */
export function vacEvaluateRestaurantSignup(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var threshold, email, userPhone10, restaurantPhone10, emailDomain, websiteHost, emailDomainHasMx, websiteDomainResolves, emailMatchesWebsite, hasSocial, hasGeo, hasAddress, phoneMatches, score, result, _c;
        var _d;
        var user = _b.user, restaurant = _b.restaurant, req = _b.req;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    threshold = Number(process.env.VAC_AUTO_VERIFY_THRESHOLD || "70");
                    email = (user === null || user === void 0 ? void 0 : user.email) || "";
                    userPhone10 = vacNormalizePhone((user === null || user === void 0 ? void 0 : user.phone) || undefined);
                    restaurantPhone10 = vacNormalizePhone((restaurant === null || restaurant === void 0 ? void 0 : restaurant.phone) || undefined);
                    emailDomain = vacGetEmailDomain(email);
                    websiteHost = vacGetHostnameFromUrl(restaurant === null || restaurant === void 0 ? void 0 : restaurant.websiteUrl);
                    return [4 /*yield*/, vacHasMx(emailDomain)];
                case 1:
                    emailDomainHasMx = _e.sent();
                    return [4 /*yield*/, vacHasDns(websiteHost)];
                case 2:
                    websiteDomainResolves = _e.sent();
                    emailMatchesWebsite = !!emailDomain &&
                        !!websiteHost &&
                        (emailDomain === websiteHost ||
                            emailDomain.endsWith("." + websiteHost) ||
                            websiteHost.endsWith("." + emailDomain));
                    hasSocial = !!((restaurant === null || restaurant === void 0 ? void 0 : restaurant.instagramUrl) && String(restaurant.instagramUrl).trim()) ||
                        !!((restaurant === null || restaurant === void 0 ? void 0 : restaurant.facebookPageUrl) && String(restaurant.facebookPageUrl).trim());
                    hasGeo = (restaurant === null || restaurant === void 0 ? void 0 : restaurant.latitude) != null &&
                        (restaurant === null || restaurant === void 0 ? void 0 : restaurant.longitude) != null &&
                        String(restaurant.latitude).trim() !== "" &&
                        String(restaurant.longitude).trim() !== "";
                    hasAddress = !!((restaurant === null || restaurant === void 0 ? void 0 : restaurant.address) && String(restaurant.address).trim().length >= 8);
                    phoneMatches = userPhone10.length === 10 &&
                        restaurantPhone10.length === 10 &&
                        userPhone10 === restaurantPhone10;
                    score = 0;
                    if (emailDomainHasMx)
                        score += 15;
                    if (websiteDomainResolves)
                        score += 20;
                    if (emailMatchesWebsite)
                        score += 15;
                    if (hasSocial)
                        score += 10;
                    if (hasGeo)
                        score += 10;
                    if (hasAddress)
                        score += 5;
                    if (phoneMatches)
                        score += 10;
                    // Small penalty: free email without a matching business domain
                    if (vacIsFreeEmailDomain(emailDomain) && !emailMatchesWebsite)
                        score -= 10;
                    if (score < 0)
                        score = 0;
                    result = {
                        version: "vac-lite-v1",
                        score: score,
                        threshold: threshold,
                        shouldAutoVerify: score >= threshold,
                        signals: {
                            emailDomain: emailDomain || null,
                            websiteHost: websiteHost || null,
                            emailDomainHasMx: emailDomainHasMx,
                            websiteDomainResolves: websiteDomainResolves,
                            emailMatchesWebsite: emailMatchesWebsite,
                            hasSocial: hasSocial,
                            hasGeo: hasGeo,
                            hasAddress: hasAddress,
                            phoneMatches: phoneMatches,
                            freeEmailDomain: vacIsFreeEmailDomain(emailDomain)
                        }
                    };
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, logAudit((user === null || user === void 0 ? void 0 : user.id) || "", "vac:evaluate", "restaurant", (restaurant === null || restaurant === void 0 ? void 0 : restaurant.id) || "", req === null || req === void 0 ? void 0 : req.ip, (_d = req === null || req === void 0 ? void 0 : req.headers) === null || _d === void 0 ? void 0 : _d["user-agent"], result)];
                case 4:
                    _e.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _c = _e.sent();
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/, result];
            }
        });
    });
}

