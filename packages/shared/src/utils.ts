import dayjs from "dayjs";

export function isToday(dateStr: string): boolean {
  return dateStr === dayjs().format("YYYY-MM-DD");
}

export function isMultiDay(startDate: string, endDate: string | null): boolean {
  return !!endDate && endDate !== startDate;
}

export function isInbox(task: { start_date: string }): boolean {
  return !task.start_date;
}

export function formatDateRange(start: string, end: string | null): string {
  if (!start) return "inbox";
  const s = dayjs(start);
  if (!end || end === start) return s.format("M月D日");
  const e = dayjs(end);
  if (s.month() === e.month()) {
    return `${s.format("M月D日")} - ${e.format("D日")}`;
  }
  return `${s.format("M月D日")} - ${e.format("M月D日")}`;
}
