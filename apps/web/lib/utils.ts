import dayjs, { Dayjs } from "dayjs";

// Re-export shared utilities
export { isMultiDay, isInbox, formatDateRange } from "@aura/shared/utils";

export function getMonthDays(year: number, month: number) {
  const first = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  // Monday=0 ... Sunday=6
  const startOfWeek = (first.day() + 6) % 7;
  const daysInMonth = first.daysInMonth();

  const days: Dayjs[] = [];

  // Fill previous month days
  for (let i = startOfWeek - 1; i >= 0; i--) {
    days.push(first.subtract(i + 1, "day"));
  }

  // Current month days
  for (let i = 0; i < daysInMonth; i++) {
    days.push(first.add(i, "day"));
  }

  // Fill next month days to complete grid
  while (days.length < 42) {
    days.push(first.add(daysInMonth + days.length - daysInMonth - startOfWeek, "day"));
  }

  // Trim to minimum rows needed (at least 5)
  while (days.length > 35 && days.length % 7 === 0) {
    const lastWeek = days.slice(-7);
    if (lastWeek.every((d) => d.month() !== month - 1)) {
      days.splice(-7);
    } else {
      break;
    }
  }

  return days;
}

export function isToday(date: Dayjs): boolean {
  return date.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
}

export function isSameDay(a: Dayjs, b: Dayjs): boolean {
  return a.format("YYYY-MM-DD") === b.format("YYYY-MM-DD");
}

