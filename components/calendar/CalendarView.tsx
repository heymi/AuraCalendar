"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { Task } from "@/lib/db";
import { getMonthDays } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import DayBlock from "./DayBlock";
import DayDetailPopover from "../task/DayDetailPopover";
import MobileCalendarView from "./MobileCalendarView";

interface CalendarViewProps {
  year: number;
  month: number;
  tasks: Task[];
  isHighlighted: (date: string) => boolean;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateTask: (id: string, fields: Partial<Task>) => Promise<void>;
}

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export default function CalendarView({
  year,
  month,
  tasks,
  isHighlighted,
  onUpdateStatus,
  onDeleteTask,
  onUpdateTask,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks.filter((t) => t.type !== "note")) {
      const start = dayjs(task.start_date);
      const end = task.end_date ? dayjs(task.end_date) : start;
      let current = start;
      while (current.isBefore(end) || current.isSame(end, "day")) {
        const key = current.format("YYYY-MM-DD");
        if (!map[key]) map[key] = [];
        map[key].push(task);
        current = current.add(1, "day");
      }
    }
    return map;
  }, [tasks]);

  const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

  // Close popover on click outside (desktop only)
  useEffect(() => {
    if (!selectedDate || isMobile) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-popover]") || target.closest("[data-day-block]")) return;
      setSelectedDate(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [selectedDate, isMobile]);

  // Mobile: vertical day cards
  if (isMobile) {
    return (
      <MobileCalendarView
        year={year}
        month={month}
        tasks={tasks}
        isHighlighted={isHighlighted}
        onUpdateStatus={onUpdateStatus}
        onDeleteTask={onDeleteTask}
        onUpdateTask={onUpdateTask}
      />
    );
  }

  // Desktop: 7-column grid
  return (
    <div>
      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{ color: "var(--text-secondary)" }}
            className="text-center text-[11px] font-medium py-1 tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div ref={gridRef} className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dateStr = day.format("YYYY-MM-DD");
          const isSelected = selectedDate === dateStr;
          return (
            <div key={dateStr} className="relative">
              <DayBlock
                date={day}
                currentMonth={month}
                tasks={tasksByDate[dateStr] || []}
                isHighlighted={isHighlighted(dateStr)}
                isSelected={isSelected}
                onClick={() =>
                  setSelectedDate(isSelected ? null : dateStr)
                }
              />

              <AnimatePresence>
                {isSelected && (
                  <DayDetailPopover
                    date={selectedDate}
                    tasks={selectedTasks}
                    onClose={() => setSelectedDate(null)}
                    onUpdateStatus={onUpdateStatus}
                    onDeleteTask={onDeleteTask}
                    onUpdateTask={onUpdateTask}
                  />
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
