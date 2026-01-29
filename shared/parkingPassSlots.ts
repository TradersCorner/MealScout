export const PARKING_PASS_SLOT_TYPES = [
  "breakfast",
  "lunch",
  "dinner",
  "daily",
  "weekly",
  "monthly",
] as const;

export type ParkingPassSlotType = (typeof PARKING_PASS_SLOT_TYPES)[number];

// Fixed slot windows with 30-minute buffers between meal slots.
// Breakfast ends at 11:00, Lunch starts 11:30, Dinner starts 16:00 and ends at 21:00.
export const PARKING_PASS_MEAL_WINDOWS = {
  breakfast: { start: "07:00", end: "11:00" },
  lunch: { start: "11:30", end: "15:30" },
  dinner: { start: "16:00", end: "21:00" },
} as const;

export const PARKING_PASS_CLEANUP_BUFFER_MINUTES = 30;


export const PARKING_PASS_BOOKING_DAYS: Record<ParkingPassSlotType, number> = {
  breakfast: 1,
  lunch: 1,
  dinner: 1,
  daily: 1,
  weekly: 7,
  monthly: 30,
};

const isValidHour = (value: number) => Number.isFinite(value) && value >= 0 && value <= 23;
const isValidMinute = (value: number) =>
  Number.isFinite(value) && value >= 0 && value <= 59;
const clampMinutesInDay = (value: number) => Math.max(0, Math.min(value, 24 * 60));

export const timeToMinutes = (value?: string | null) => {
  if (!value) return null;
  const [rawHour, rawMinute] = value.split(":").map(Number);
  if (!isValidHour(rawHour) || !isValidMinute(rawMinute)) return null;
  return rawHour * 60 + rawMinute;
};

export const getSlotWindowMinutes = (
  slotType: ParkingPassSlotType,
  startTime?: string | null,
  endTime?: string | null,
) => {
  if (slotType in PARKING_PASS_MEAL_WINDOWS) {
    const window = PARKING_PASS_MEAL_WINDOWS[
      slotType as keyof typeof PARKING_PASS_MEAL_WINDOWS
    ];
    const startMinutes = timeToMinutes(window.start);
    const endMinutes = timeToMinutes(window.end);
    if (startMinutes === null || endMinutes === null) return null;
    return { startMinutes, endMinutes };
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null) return null;
  return { startMinutes, endMinutes };
};

export const addMinutesToTime = (
  value: string | null | undefined,
  minutesToAdd: number,
) => {
  const baseMinutes = timeToMinutes(value);
  if (baseMinutes === null) return null;
  const total = clampMinutesInDay(baseMinutes + minutesToAdd);
  const hours = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor(total % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const getSlotWindowMinutesWithCleanup = (
  slotType: ParkingPassSlotType,
  startTime?: string | null,
  endTime?: string | null,
) => {
  const window = getSlotWindowMinutes(slotType, startTime, endTime);
  if (!window) return null;
  return {
    startMinutes: window.startMinutes,
    endMinutes: clampMinutesInDay(
      window.endMinutes + PARKING_PASS_CLEANUP_BUFFER_MINUTES,
    ),
  };
};

export const isSlotWithinHours = (
  slotType: ParkingPassSlotType,
  startTime?: string | null,
  endTime?: string | null,
) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null) return false;
  if (endMinutes <= startMinutes) return false;
  if (!(slotType in PARKING_PASS_MEAL_WINDOWS)) {
    return true;
  }

  const window = PARKING_PASS_MEAL_WINDOWS[
    slotType as keyof typeof PARKING_PASS_MEAL_WINDOWS
  ];
  const slotStart = timeToMinutes(window.start);
  const slotEnd = timeToMinutes(window.end);
  if (slotStart === null || slotEnd === null) return false;

  return slotStart >= startMinutes && slotEnd <= endMinutes;
};

export const slotWindowsOverlap = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
) => aStart < bEnd && bStart < aEnd;
