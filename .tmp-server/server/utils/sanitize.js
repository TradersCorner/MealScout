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
var STRIPPED_FIELDS = new Set([
    "passwordHash",
    "googleAccessToken",
    "facebookAccessToken",
    "tradescoutId",
]);
export function sanitizeUser(user, options) {
    if (options === void 0) { options = {}; }
    if (!user || typeof user !== "object") {
        return user;
    }
    var sanitized = __assign({}, user);
    Array.from(STRIPPED_FIELDS).forEach(function (field) {
        if (field in sanitized) {
            delete sanitized[field];
        }
    });
    if (!options.includeStripe) {
        delete sanitized.stripeCustomerId;
        delete sanitized.stripeSubscriptionId;
    }
    return sanitized;
}
export function sanitizeUsers(users, options) {
    if (!Array.isArray(users)) {
        return [];
    }
    return users.map(function (user) { return sanitizeUser(user, options); });
}
