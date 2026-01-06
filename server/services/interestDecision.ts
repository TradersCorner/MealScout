// Helpers for interest acceptance/decline decisions and capacity guard logic.
// Pure domain logic: no Express or storage imports.

export function computeAcceptedCount<T extends { status: string }>(interests: T[]): number {
  return interests.filter(i => i.status === 'accepted').length;
}

interface CapacityContext {
  hardCapEnabled: boolean | null | undefined;
  acceptedCount: number;
  maxTrucks: number;
}

export function shouldBlockAcceptance(context: CapacityContext): boolean {
  const { hardCapEnabled, acceptedCount, maxTrucks } = context;
  if (!hardCapEnabled) return false;
  return acceptedCount >= maxTrucks;
}

export function buildCapacityFullError() {
  // Message and code must match the route's current response exactly
  return {
    message: 'Event is full (Capacity Guard Enabled). Cannot accept more trucks.',
    code: 'CAPACITY_REACHED' as const,
  };
}

export function computeFillRate(params: { acceptedCount: number; maxTrucks: number }): number {
  const { acceptedCount, maxTrucks } = params;
  if (!maxTrucks) return 0;
  return acceptedCount / maxTrucks;
}
