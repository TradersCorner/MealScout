/**
 * API base URL configuration
 * Uses VITE_API_BASE_URL env var in production, defaults to relative path in dev
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Build API URL with base path
 */
export function apiUrl(path: string): string {
  // Remove leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return API_BASE_URL ? `${API_BASE_URL}/${cleanPath}` : `/${cleanPath}`;
}
