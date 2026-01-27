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
var counters = {
    connects: 0,
    disconnects: 0,
    subscribeNearby: 0,
    lastWarnAt: 0,
};
var WARN_INTERVAL_MS = 60000;
export function incConnect() {
    counters.connects++;
}
export function incDisconnect() {
    counters.disconnects++;
}
export function incSubscribeNearby() {
    counters.subscribeNearby++;
}
export function maybeWarnIfChurn(logger) {
    var now = Date.now();
    if (now - counters.lastWarnAt < WARN_INTERVAL_MS)
        return;
    if (counters.disconnects > counters.connects * 1.5 && counters.disconnects > 20) {
        counters.lastWarnAt = now;
        logger("[realtime] churn warning: connects=".concat(counters.connects, ", disconnects=").concat(counters.disconnects, ", subscribeNearby=").concat(counters.subscribeNearby));
    }
}
export function snapshot() {
    return __assign({}, counters);
}
