import { storage } from "../storage";

// Host ownership helpers centralize lookup logic for hosts and events.
// These functions are intentionally domain-only (no Express types).

export async function getHostByUserId(userId: string) {
  return storage.getHostByUserId(userId);
}

export async function getEventAndHostForUser(eventId: string, userId: string) {
  const [event, host] = await Promise.all([
    storage.getEvent(eventId),
    storage.getHostByUserId(userId),
  ]);

  return { event, host };
}

export async function getInterestEventAndHostForUser(interestId: string, userId: string) {
  const interest = await storage.getEventInterest(interestId);

  if (!interest) {
    return { interest: null, event: null, host: null } as const;
  }

  const [event, host] = await Promise.all([
    storage.getEvent(interest.eventId),
    storage.getHostByUserId(userId),
  ]);

  return { interest, event, host } as const;
}

export function hostOwnsEvent(
  host: { id: string } | null | undefined,
  event: { hostId: string } | null | undefined
): boolean {
  return !!host && !!event && host.id === event.hostId;
}
