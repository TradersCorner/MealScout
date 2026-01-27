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
import { createContext, useContext } from "react";
import App from "./App";
var MealScoutContextReact = createContext(null);
function MealScoutProvider(_a) {
    var context = _a.context, children = _a.children;
    return (<MealScoutContextReact.Provider value={context}>
      {children}
    </MealScoutContextReact.Provider>);
}
function MealScoutRoutes() {
    // For now, reuse the existing App component which already
    // wires up all internal routes such as /, /deals, etc.
    return <App />;
}
export function useMealScoutContext() {
    var value = useContext(MealScoutContextReact);
    if (!value) {
        throw new Error("useMealScoutContext must be used within a MealScoutProvider");
    }
    return value;
}
export function MealScoutApp(_a) {
    var context = _a.context;
    return (<MealScoutProvider context={context}>
      <MealScoutRoutes />
    </MealScoutProvider>);
}
export function performMealScoutSSO(token, options) {
    return __awaiter(this, void 0, void 0, function () {
        var baseUrl, url, controller, timeout, timeoutId, response, errorBody, _a, message, data;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    baseUrl = (_c = (_b = options === null || options === void 0 ? void 0 : options.baseUrl) === null || _b === void 0 ? void 0 : _b.replace(/\/$/, "")) !== null && _c !== void 0 ? _c : "";
                    url = "".concat(baseUrl, "/api/auth/tradescout/sso");
                    controller = new AbortController();
                    timeout = (_d = options === null || options === void 0 ? void 0 : options.timeoutMs) !== null && _d !== void 0 ? _d : 10000;
                    timeoutId = setTimeout(function () { return controller.abort(); }, timeout);
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, , 9, 10]);
                    return [4 /*yield*/, fetch(url, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            credentials: "include",
                            body: JSON.stringify({ token: token }),
                            signal: controller.signal,
                        })];
                case 2:
                    response = _e.sent();
                    if (!!response.ok) return [3 /*break*/, 7];
                    errorBody = null;
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, response.json()];
                case 4:
                    errorBody = _e.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _a = _e.sent();
                    return [3 /*break*/, 6];
                case 6:
                    message = (errorBody === null || errorBody === void 0 ? void 0 : errorBody.error) || (errorBody === null || errorBody === void 0 ? void 0 : errorBody.message) || "SSO failed with status ".concat(response.status);
                    throw new Error(message);
                case 7: return [4 /*yield*/, response.json()];
                case 8:
                    data = (_e.sent());
                    return [2 /*return*/, data.user];
                case 9:
                    clearTimeout(timeoutId);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
