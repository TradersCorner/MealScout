import { DateTime } from "luxon";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
  return DATE_KEY_RE.test(String(value || "").trim());
}

export function dateKeyInZone(date: Date | string, timeZone: string): string {
  const dt =
    date instanceof Date
      ? DateTime.fromJSDate(date, { zone: "utc" }).setZone(timeZone)
      : DateTime.fromISO(String(date), { zone: timeZone });
  return dt.toFormat("yyyy-LL-dd");
}

export function dateKeyFromUnknown(
  value: unknown,
  timeZone: string,
): string | null {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return null;
    return dateKeyInZone(value, timeZone);
  }
  const raw = String(value || "").trim();
  if (!raw) return null;
  const dateKey = raw.includes("T") ? raw.split("T")[0] : raw;
  if (!isDateKey(dateKey)) return null;
  return dateKey;
}

export function utcDateFromDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  return DateTime.fromISO(dateKey, { zone: "utc" })
    .plus({ days })
    .toFormat("yyyy-LL-dd");
}

export function weekdayInZoneForDateKey(
  dateKey: string,
  timeZone: string,
): number {
  const dt = DateTime.fromISO(dateKey, { zone: timeZone }).startOf("day");
  // Luxon weekday: 1=Mon ... 7=Sun
  return dt.weekday % 7;
}
