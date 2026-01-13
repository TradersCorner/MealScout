# Live Location State (Dot-Only Radar)

**Philosophy**: MealScout is radar, not a review app. Dots answer the only urgent question: "Is food here now?"

## User-Facing Model

### Dot States

- **🟢 Green (solid)**: Confirmed here now
- **🟢 Green (pulse)**: Confirmed <30 min ago
- **🟡 Amber**: Likely here
- **⚪ Hidden**: No signal or privacy enabled

### What Users See

- Dot only (no text, no scores, no tooltips)
- Awards badge if present (Golden Plate / Golden Fork)
- No other UI elements

## Server-Side Logic

### State Mapping Rules

**GREEN** (high confidence)

- Customer check-in within 24h, OR
- Host confirmation within 24h, OR
- Strong network presence + dwell within 24h

**AMBER** (likely)

- Historical pattern match, OR
- Network presence only within 48h

**HIDDEN** (no signal)

- No signals for ≥14 days, OR
- Privacy toggle enabled, OR
- Not a food truck / mobile offline

### Privacy Override

Privacy toggle **always** short-circuits to `hidden`, regardless of signals.

### Signal Sources

- `customerCheckIn`: Last customer "I ate here" check-in
- `hostConfirm`: Host confirmed truck presence
- `networkPresence`: Last network location ping
- `networkDwell`: GPS dwell time threshold met
- `historicalPattern`: Truck often here at this day/time
- `lastLocationUpdate`: Most recent location update of any kind

## Implementation

### Server

```typescript
import { computeLocationState } from "@/server/utils/locationState";

const { location_state, last_confirmed_at } = computeLocationState(restaurant, {
  customerCheckIn: lastCheckIn,
  hostConfirm: hostConfirmedAt,
  networkPresence: lastNetworkPing,
  networkDwell: dwellTimeExceeded,
  historicalPattern: isHistoricalMatch,
  lastLocationUpdate: restaurant.lastBroadcastAt,
  privacyEnabled: !restaurant.mobileOnline,
});
```

### Client

```tsx
import { LocationDot } from "@/components/location-dot";
import { LocationDebug } from "@/components/location-debug";

// Production
<LocationDot state={restaurant.location_state} lastConfirmedAt={restaurant.last_confirmed_at} />

// Development (shows debug overlay on hover)
<LocationDebug
  state={restaurant.location_state}
  lastConfirmedAt={restaurant.last_confirmed_at}
  restaurantId={restaurant.id}
/>
```

## Ranking & Tie-Breaking (Invisible)

When two green dots are nearby, sort by:

1. Recent customer satisfaction (primary)
2. Recent confirmations (secondary)
3. Reliability (only if truck claimed presence)

**Never** surface this logic to users.

## Non-Negotiables

❌ **Do not add**:

- Text labels like "likely open"
- Numbers, percentages, or scores
- Confidence explanations
- Tooltips (except dev debug)
- Penalties for inactivity

✅ **Always maintain**:

- Dots > data
- Awards > ratings
- Silence > wrong info
- Community > operators
- Inactivity ≠ penalty

## Edge Cases

### Part-time / Event Trucks

- Amber dots when pattern match
- Green when confirmed
- Hidden when idle (not penalized)

### Daily Trucks

- Green most of the time
- Natural ranking boost from consistency

### Privacy-Conscious Operators

- Toggle always hides dot
- No other effects

## Future Enhancements

Possible (do not implement without review):

- Historical pattern learning (ML)
- Host vs customer signal precedence tuning
- Confidence decay curves
- Multi-signal fusion

**Remember**: If you can't explain it in one sentence, don't ship it to users.
