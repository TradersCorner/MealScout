import type { MapProvider } from "@/components/maps/map-adapter.types";

const rawProvider = String(import.meta.env.VITE_MAP_PROVIDER || "legacy")
  .trim()
  .toLowerCase();

export const MAP_PROVIDER: MapProvider =
  rawProvider === "google" ? "google" : "legacy";

export const GOOGLE_MAPS_WEB_API_KEY = String(
  import.meta.env.VITE_GOOGLE_MAPS_WEB_API_KEY || "",
).trim();

export const isGoogleMapsEnabled =
  MAP_PROVIDER === "google" && GOOGLE_MAPS_WEB_API_KEY.length > 0;

