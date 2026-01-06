# Telemetry Schema v1

## Overview
Telemetry events are stored in the `telemetry_events` table. This data is read-only and used for analytics.

## Events

### `interest_created`
**Trigger**: Truck expresses interest in an event.
**Properties**:
- `eventId` (string): UUID of the event.
- `truckId` (string): UUID of the truck (restaurant).
- `eventDate` (string): ISO date string of the event.

### `interest_accepted`
**Trigger**: Host accepts a truck's interest.
**Properties**:
- `eventId` (string): UUID of the event.
- `truckId` (string): UUID of the truck.
- `fillRate` (number): `acceptedCount / maxTrucks` (0.0 - 1.0+).
- `acceptedCount` (number): Total accepted trucks for this event *after* this action.
- `maxTrucks` (number): The event's capacity.
- `isOverCap` (boolean): True if `acceptedCount >= maxTrucks`.

### `interest_declined`
**Trigger**: Host declines a truck's interest.
**Properties**:
- `eventId` (string): UUID of the event.
- `truckId` (string): UUID of the truck.
- `fillRate` (number): `acceptedCount / maxTrucks`.
- `acceptedCount` (number): Total accepted trucks for this event.
- `maxTrucks` (number): The event's capacity.
- `isOverCap` (boolean): True if `acceptedCount >= maxTrucks`.

## Privacy
- No PII (names, emails, phone numbers) is stored in the `properties` JSONB.
- User IDs are stored in the dedicated `user_id` column, not in the JSON blob, allowing for standard redaction if needed.
