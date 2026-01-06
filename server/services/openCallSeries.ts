import { type InsertEvent } from "@shared/schema";

// Event series (open calls) helpers.
// Pure domain logic: no Express or storage imports.

const MAX_SERIES_SPAN_DAYS = 180;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function assertMaxSpan180Days(startDate: Date, endDate: Date) {
  const diffMs = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.floor(diffMs / MS_PER_DAY);

  if (daysDiff > MAX_SERIES_SPAN_DAYS) {
    // Message must match existing route behavior exactly
    throw new Error('Event series cannot span more than 180 days');
  }
}

const DAY_MAP: { [key: string]: number } = {
  'SU': 0,
  'MO': 1,
  'TU': 2,
  'WE': 3,
  'TH': 4,
  'FR': 5,
  'SA': 6,
};

export function parseWeeklyRecurrence(recurrenceRule: string | null | undefined): number[] | null {
  if (!recurrenceRule || !recurrenceRule.startsWith('WEEKLY:')) {
    return null;
  }

  const daysStr = recurrenceRule.split(':')[1];
  const selectedDays = daysStr
    .split(',')
    .map(d => DAY_MAP[d])
    .filter((d): d is number => d !== undefined);

  return selectedDays.length > 0 ? selectedDays : null;
}

interface GenerateOccurrencesConfig {
  startDate: Date;
  endDate: Date;
  recurrenceRule?: string | null;
  defaults: {
    hostId: string;
    seriesId: string;
    name: string;
    description: string | null;
    startTime: string;
    endTime: string;
    maxTrucks: number | undefined;
    hardCapEnabled: boolean | null | undefined;
  };
}

export function generateOccurrences(config: GenerateOccurrencesConfig): InsertEvent[] {
  const { startDate, endDate, recurrenceRule, defaults } = config;

  const occurrences: InsertEvent[] = [];
  const selectedDays = parseWeeklyRecurrence(recurrenceRule ?? null);

  if (selectedDays) {
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (selectedDays.includes(currentDate.getDay())) {
        occurrences.push({
          hostId: defaults.hostId,
          seriesId: defaults.seriesId,
          name: defaults.name,
          description: defaults.description,
          date: new Date(currentDate),
          startTime: defaults.startTime,
          endTime: defaults.endTime,
          maxTrucks: defaults.maxTrucks,
          hardCapEnabled: defaults.hardCapEnabled,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else {
    // No recurrence: single occurrence on startDate
    occurrences.push({
      hostId: defaults.hostId,
      seriesId: defaults.seriesId,
      name: defaults.name,
      description: defaults.description,
      date: new Date(startDate),
      startTime: defaults.startTime,
      endTime: defaults.endTime,
      maxTrucks: defaults.maxTrucks,
      hardCapEnabled: defaults.hardCapEnabled,
    });
  }

  return occurrences;
}

export function filterFutureOccurrences<T extends { date: Date }>(occurrences: T[], now: Date): T[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return occurrences.filter(occ => new Date(occ.date) >= today);
}
