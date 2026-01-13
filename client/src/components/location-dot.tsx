import type { LocationState } from "@shared/schema";

interface LocationDotProps {
  state: LocationState;
  lastConfirmedAt?: Date | null;
  className?: string;
}

/**
 * Dot-only live location indicator.
 * No tooltips, no labels, no text — just the dot.
 *
 * Rules:
 * - GREEN (solid): confirmed here now
 * - GREEN (pulse): confirmed <30 min ago
 * - AMBER (soft): likely here
 * - HIDDEN: render nothing
 */
export function LocationDot({
  state,
  lastConfirmedAt,
  className = "",
}: LocationDotProps) {
  if (state === "hidden") {
    return null;
  }

  const isPulse =
    state === "green" &&
    lastConfirmedAt &&
    Date.now() - new Date(lastConfirmedAt).getTime() < 30 * 60 * 1000;

  const dotClass = state === "green" ? "bg-green-500" : "bg-amber-400";

  const pulseClass = isPulse
    ? "animate-pulse shadow-lg shadow-green-500/50"
    : "";

  return (
    <div
      className={`w-3 h-3 rounded-full ${dotClass} ${pulseClass} ${className}`}
      aria-label={state === "green" ? "Confirmed here now" : "Likely here"}
    />
  );
}
