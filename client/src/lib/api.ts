/**
 * API base URL configuration
 * In development, force same-origin (relative paths only).
 * In production, allow optional VITE_API_BASE_URL; otherwise same-origin.
 */
const IS_DEV = import.meta.env.DEV;
export const API_BASE_URL = IS_DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');

/**
 * Build API URL with base path
 */
export function apiUrl(path: string): string {
  // Remove leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return API_BASE_URL ? `${API_BASE_URL}/${cleanPath}` : `/${cleanPath}`;
}
