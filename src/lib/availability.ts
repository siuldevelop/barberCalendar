import type { BookingStatus, AvailabilityOverride, BlockedPeriod, Booking, WeeklySchedule } from "@prisma/client";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED"];
const SLOT_INTERVAL_MINUTES = 15;

type TimeWindow = { start: number; end: number };
type AvailabilityData = {
  schedules: WeeklySchedule[];
  bookings: Pick<Booking, "startTime" | "durationMinutes" | "status">[];
  overrides: AvailabilityOverride[];
  blockedPeriods: BlockedPeriod[];
};

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value: number) {
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function overlaps(candidate: TimeWindow, occupied: TimeWindow) {
  return candidate.start < occupied.end && candidate.end > occupied.start;
}

function windowsFromSchedules(items: Array<{ startTime: string; endTime: string }>): TimeWindow[] {
  return items.map((item) => ({ start: timeToMinutes(item.startTime), end: timeToMinutes(item.endTime) }));
}

function dateWeekday(dateKey: string) {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

export function calculateAvailableTimes(dateKey: string, durationMinutes: number, data: AvailabilityData) {
  const regularWindows = windowsFromSchedules(data.schedules);
  const availableOverrides = data.overrides.filter((item) => item.status === "AVAILABLE");
  const openingWindows = [...regularWindows, ...windowsFromSchedules(availableOverrides)];
  const unavailableWindows = [
    ...data.overrides
      .filter((item) => item.status !== "AVAILABLE")
      .map((item) => ({ start: timeToMinutes(item.startTime), end: timeToMinutes(item.endTime) })),
    ...data.blockedPeriods.map((item) => ({ start: timeToMinutes(item.startTime), end: timeToMinutes(item.endTime) })),
    ...data.bookings
      .filter((item) => ACTIVE_BOOKING_STATUSES.includes(item.status))
      .map((item) => {
        const start = timeToMinutes(item.startTime);
        return { start, end: start + item.durationMinutes };
      }),
  ];

  const result = new Set<string>();
  for (const opening of openingWindows) {
    for (let start = opening.start; start + durationMinutes <= opening.end; start += SLOT_INTERVAL_MINUTES) {
      const candidate = { start, end: start + durationMinutes };
      if (!unavailableWindows.some((occupied) => overlaps(candidate, occupied))) {
        result.add(minutesToTime(start));
      }
    }
  }

  return [...result].sort();
}

export function getWeekday(dateKey: string) {
  return dateWeekday(dateKey);
}
