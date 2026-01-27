var sizeMap = {
    small: 64,
    medium: 128,
    large: 256,
};
function resolveSize(size) {
    return typeof size === "number" ? size : sizeMap[size];
}
export function getOptimizedImageUrl(input, size) {
    if (size === void 0) { size = "medium"; }
    if (!input || typeof input !== "string")
        return "";
    var trimmed = input.trim();
    if (!trimmed)
        return "";
    try {
        var url = new URL(trimmed);
        var host = url.hostname.toLowerCase();
        var px = resolveSize(size);
        if (host.includes("fbcdn.net") ||
            host.includes("facebook.com") ||
            host.includes("fbsbx.com")) {
            url.searchParams.set("width", String(px));
            url.searchParams.set("height", String(px));
            url.searchParams.set("type", "large");
            return url.toString();
        }
        if (host.includes("googleusercontent.com")) {
            if (url.pathname.includes("=")) {
                return trimmed.replace(/=s\d+(-c)?$/, "=s".concat(px, "-c"));
            }
            return "".concat(trimmed, "=s").concat(px, "-c");
        }
        if (host.includes("pbs.twimg.com")) {
            url.searchParams.set("name", "large");
            return url.toString();
        }
        return trimmed;
    }
    catch (_a) {
        return trimmed;
    }
}
