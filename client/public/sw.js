/* Minimal service worker to satisfy installability checks.
   Intentionally avoids aggressive caching to prevent stale-asset issues. */

const VERSION = "2026-02-20-1";

self.addEventListener("install", (event) => {
  // Activate new SW quickly.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No fetch handler by design (network-only).

