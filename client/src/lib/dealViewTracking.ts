import { apiRequest } from "@/lib/queryClient";

const STORAGE_PREFIX = "mealscout:dealViewTrackedAt:";
const inFlight = new Set<string>();
const trackedAt = new Map<string, number>();

const now = () => Date.now();

const getStoredTimestamp = (dealId: string): number | null => {
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${dealId}`);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

const setStoredTimestamp = (dealId: string, ts: number) => {
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${dealId}`, String(ts));
  } catch {
    // Ignore storage errors (Safari private mode, etc.)
  }
};

export async function trackDealViewOnce(
  dealId: string,
  options?: { minIntervalMs?: number },
): Promise<boolean> {
  const id = (dealId || "").trim();
  if (!id) return false;

  const minIntervalMs = Math.max(0, options?.minIntervalMs ?? 30 * 60 * 1000);
  const tsNow = now();

  const cached = trackedAt.get(id);
  if (cached !== undefined && tsNow - cached < minIntervalMs) return false;

  const stored = typeof window !== "undefined" ? getStoredTimestamp(id) : null;
  if (stored !== null && tsNow - stored < minIntervalMs) {
    trackedAt.set(id, stored);
    return false;
  }

  if (inFlight.has(id)) return false;
  inFlight.add(id);

  // Mark as tracked before sending so transient errors (429, offline) don't cause spam loops.
  trackedAt.set(id, tsNow);
  if (typeof window !== "undefined") setStoredTimestamp(id, tsNow);

  try {
    await apiRequest("POST", `/api/deals/${encodeURIComponent(id)}/view`, {});
    return true;
  } catch (error) {
    console.debug("Deal view tracking failed:", error);
    return false;
  } finally {
    inFlight.delete(id);
  }
}

