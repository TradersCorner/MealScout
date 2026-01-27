/**
 * API base URL configuration
 * In development, force same-origin (relative paths only).
 * In production, allow optional VITE_API_BASE_URL; otherwise same-origin.
 */
var IS_DEV = import.meta.env.DEV;
export var API_BASE_URL = IS_DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');
/**
 * Build API URL with base path
 */
export function apiUrl(path) {
    // Remove leading slash from path to avoid double slashes
    var cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return API_BASE_URL ? "".concat(API_BASE_URL, "/").concat(cleanPath) : "/".concat(cleanPath);
}
