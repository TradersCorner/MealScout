import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";

if (import.meta.env.PROD) {
  const reloadOnceKey = "mealscout_chunk_reload";
  const shouldReload = () => {
    try {
      return sessionStorage.getItem(reloadOnceKey) !== "1";
    } catch {
      return true;
    }
  };

  const markReloaded = () => {
    try {
      sessionStorage.setItem(reloadOnceKey, "1");
    } catch {
      // ignore
    }
  };

  const reloadWithBust = () => {
    if (!shouldReload()) return;
    markReloaded();
    const url = new URL(window.location.href);
    url.searchParams.set("reload", Date.now().toString());
    window.location.replace(url.toString());
  };

  const isChunkError = (message?: string) =>
    Boolean(
      message &&
        (message.includes("Failed to fetch dynamically imported module") ||
          message.includes("Loading chunk") ||
          message.includes("module script") ||
          message.includes("MIME type")),
    );

  window.addEventListener("vite:preloadError", reloadWithBust);
  window.addEventListener("error", (event) => {
    if (isChunkError(event.message)) {
      reloadWithBust();
    }
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as Error | string | undefined;
    const message =
      typeof reason === "string" ? reason : reason?.message || "";
    if (isChunkError(message)) {
      reloadWithBust();
    }
  });
}

// Register a minimal Service Worker for PWA installability and "Add to Home Screen" UX.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // ignore; app should still work without SW
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);

