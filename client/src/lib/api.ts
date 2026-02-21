/**
 * API base URL configuration
 * In development, force same-origin (relative paths only).
 * In production, allow optional VITE_API_BASE_URL; otherwise same-origin.
 */
const IS_DEV = import.meta.env.DEV;
function resolveApiBaseUrl() {
  if (IS_DEV) return "";

  const fromEnv = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (typeof window === "undefined") {
    return fromEnv.replace(/\/+$/, "");
  }

  const host = window.location.hostname.toLowerCase();
  // Vercel preview domains should use same-origin API calls so platform rewrites
  // can proxy /api/* without cross-origin/CORS failures.
  if (host.endsWith(".vercel.app")) {
    return "";
  }

  return fromEnv.replace(/\/+$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Build API URL with base path
 */
export function apiUrl(path: string): string {
  // Remove leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return API_BASE_URL ? `${API_BASE_URL}/${cleanPath}` : `/${cleanPath}`;
}
