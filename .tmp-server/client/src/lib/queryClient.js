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
import { QueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";
function getErrorMessage(res) {
    return __awaiter(this, void 0, void 0, function () {
        var text, json;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, res.text()];
                case 1:
                    text = (_c.sent()) || "";
                    if (!text) {
                        return [2 /*return*/, res.statusText || "Request failed"];
                    }
                    try {
                        json = JSON.parse(text);
                        return [2 /*return*/, ((json === null || json === void 0 ? void 0 : json.message) ||
                                (json === null || json === void 0 ? void 0 : json.error) ||
                                ((_b = (_a = json === null || json === void 0 ? void 0 : json.errors) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) ||
                                res.statusText ||
                                "Request failed")];
                    }
                    catch (_d) {
                        return [2 /*return*/, text];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function throwIfResNotOk(res) {
    return __awaiter(this, void 0, void 0, function () {
        var message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!res.ok) return [3 /*break*/, 2];
                    return [4 /*yield*/, getErrorMessage(res)];
                case 1:
                    message = _a.sent();
                    throw new Error(message);
                case 2: return [2 /*return*/];
            }
        });
    });
}
export function apiRequest(method, url, data) {
    return __awaiter(this, void 0, void 0, function () {
        var finalUrl, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    finalUrl = url.startsWith("http") ? url : apiUrl(url);
                    return [4 /*yield*/, fetch(finalUrl, {
                            method: method,
                            headers: data ? { "Content-Type": "application/json" } : {},
                            body: data ? JSON.stringify(data) : undefined,
                            credentials: "include",
                        })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, throwIfResNotOk(res)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, res];
            }
        });
    });
}
export var getQueryFn = function (_a) {
    var unauthorizedBehavior = _a.on401;
    return function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var path, url, res;
        var queryKey = _b.queryKey;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    path = queryKey.join("/");
                    url = apiUrl(path);
                    return [4 /*yield*/, fetch(url, {
                            credentials: "include",
                        })];
                case 1:
                    res = _c.sent();
                    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, throwIfResNotOk(res)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, res.json()];
                case 3: return [2 /*return*/, _c.sent()];
            }
        });
    }); };
};
export var queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: getQueryFn({ on401: "throw" }),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes for most queries
            gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
            retry: function (failureCount, error) {
                var _a, _b, _c;
                // Don't retry on 4xx errors (except 408, 429)
                if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("4")) &&
                    !((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes("408")) &&
                    !((_c = error.message) === null || _c === void 0 ? void 0 : _c.includes("429"))) {
                    return false;
                }
                return failureCount < 2;
            },
        },
        mutations: {
            retry: function (failureCount, error) {
                var _a, _b;
                // Only retry on network errors or 5xx
                if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("5")) ||
                    ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes("Network"))) {
                    return failureCount < 1;
                }
                return false;
            },
        },
    },
});
