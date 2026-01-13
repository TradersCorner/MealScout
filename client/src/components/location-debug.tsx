import type { LocationState } from "@shared/schema";
import { LocationDot } from "./location-dot";

interface LocationDebugProps {
  state: LocationState;
  lastConfirmedAt?: Date | null;
  restaurantId: string;
}

/**
 * Dev-only location state visualizer.
 * Shows internal state + signals; never ships to prod.
 *
 * Usage: wrap LocationDot with this component during dev.
 */
export function LocationDebug({
  state,
  lastConfirmedAt,
  restaurantId,
}: LocationDebugProps) {
  if (import.meta.env.PROD) {
    return <LocationDot state={state} lastConfirmedAt={lastConfirmedAt} />;
  }

  const timeAgo = lastConfirmedAt
    ? `${Math.round(
        (Date.now() - new Date(lastConfirmedAt).getTime()) / 60000
      )}m ago`
    : "never";

  return (
    <div className="relative group">
      <LocationDot state={state} lastConfirmedAt={lastConfirmedAt} />
      <div className="absolute z-50 hidden group-hover:block bottom-full left-0 mb-2 p-2 bg-black/90 text-white text-xs rounded whitespace-nowrap">
        <div>State: {state}</div>
        <div>Last: {timeAgo}</div>
        <div className="text-gray-400 text-[10px]">
          {restaurantId.slice(0, 8)}
        </div>
      </div>
    </div>
  );
}
