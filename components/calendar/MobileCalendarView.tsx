"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import { Task } from "@/lib/db";
import { isToday } from "@/lib/utils";
import TaskIcon from "@/components/TaskIcon";
import DayDetailPopover from "../task/DayDetailPopover";

interface MobileCalendarViewProps {
  year: number;
  month: number;
  tasks: Task[];
  isHighlighted: (date: string) => boolean;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateTask: (id: string, fields: Partial<Task>) => Promise<void>;
}

const PAGE_SIZE = 7;
const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function MobileCalendarView({
  tasks,
  isHighlighted,
  onUpdateStatus,
  onDeleteTask,
  onUpdateTask,
}: MobileCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pastCount, setPastCount] = useState(2);
  const [futureCount, setFutureCount] = useState(5);
  const todayRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef(0);
  const isLoadingPast = useRef(false);

  // Show "back to today" when today is not visible
  const [showBackToToday, setShowBackToToday] = useState(false);

  // Generate day range: (today - pastCount) to (today + futureCount)
  const today = useMemo(() => dayjs().startOf("day"), []);
  const days = useMemo(() => {
    const arr = [];
    for (let i = -pastCount; i <= futureCount; i++) {
      arr.push(today.add(i, "day"));
    }
    return arr;
  }, [today, pastCount, futureCount]);

  // Build task map
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

  // Load more past days — preserve scroll position
  const loadPast = useCallback(() => {
    if (isLoadingPast.current) return;
    isLoadingPast.current = true;
    const container = scrollContainerRef.current;
    if (container) prevHeightRef.current = container.scrollHeight;
    setPastCount((c) => c + PAGE_SIZE);
  }, []);

  // After past days prepended, adjust scroll so content doesn't jump
  useEffect(() => {
    if (!isLoadingPast.current) return;
    const container = scrollContainerRef.current;
    if (container) {
      const added = container.scrollHeight - prevHeightRef.current;
      container.scrollTop += added;
    }
    isLoadingPast.current = false;
  }, [pastCount]);

  const loadFuture = useCallback(() => {
    setFutureCount((c) => c + PAGE_SIZE);
  }, []);

  // Track whether today card is in viewport
  useEffect(() => {
    const el = todayRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowBackToToday(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollToToday = () => {
    // Reset to initial range
    setPastCount(0);
    setFutureCount(PAGE_SIZE);
    requestAnimationFrame(() => {
      todayRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  return (
    <div ref={scrollContainerRef} className="flex flex-col gap-2 relative">
      {/* Load past button */}
      <div ref={topSentinelRef}>
        <button
          onClick={loadPast}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-[12px] text-[12px] font-medium transition-colors"
          style={{ color: "var(--text-secondary)", background: "var(--border-subtle)" }}
        >
          <ChevronUp size={14} strokeWidth={2} />
          加载更早
        </button>
      </div>

      {/* Day cards */}
      {days.map((day) => {
        const dateStr = day.format("YYYY-MM-DD");
        const isTodayDay = isToday(day);
        const dayTasks = tasksByDate[dateStr] || [];
        const isPast = !isTodayDay && day.isBefore(dayjs(), "day");
        const highlighted = isHighlighted(dateStr);

        // Month boundary label
        const showMonthLabel = day.date() === 1;

        return (
          <div key={dateStr} ref={isTodayDay ? todayRef : undefined}>
            {showMonthLabel && (
              <div
                className="text-[11px] font-semibold tracking-wide px-1 pt-2 pb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {day.format("YYYY年M月")}
              </div>
            )}

            <motion.button
              data-day-block
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
              style={{
                background: highlighted
                  ? "var(--accent-highlight)"
                  : "var(--surface)",
                borderColor: isTodayDay
                  ? "var(--accent)"
                  : highlighted
                  ? "var(--accent-highlight-border)"
                  : "var(--border)",
                borderWidth: isTodayDay ? 1.5 : 1,
                opacity: isPast ? 0.55 : 1,
              }}
              className="relative w-full min-h-[calc((100vw-16px)*3/16)] max-h-[calc((100vw-16px)*3/8)] rounded-[14px] border p-3 flex gap-3 text-left cursor-pointer transition-colors duration-200"
            >
              {/* Left: date info */}
              <div className="flex flex-col items-center shrink-0 w-[52px]">
                <span
                  className="text-[10px] font-medium tracking-wide"
                  style={{ color: isTodayDay ? "var(--accent)" : "var(--text-secondary)" }}
                >
                  {WEEKDAY_LABELS[day.day()]}
                </span>
                <span
                  className="text-[28px] font-semibold leading-none mt-0.5 tracking-[-0.02em]"
                  style={
                    isTodayDay
                      ? { color: "var(--accent)" }
                      : { color: "var(--text-primary)" }
                  }
                >
                  {day.date()}
                </span>
                {isTodayDay && (
                  <span
                    className="text-[9px] font-semibold mt-1 px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    今天
                  </span>
                )}
              </div>

              {/* Divider */}
              <div
                className="w-px self-stretch rounded-full shrink-0"
                style={{ background: "var(--border-subtle)" }}
              />

              {/* Right: task list */}
              {(() => {
                const singleDay = dayTasks.filter((t) => !t.end_date || t.end_date === t.start_date);
                const multiDay = dayTasks.filter((t) => t.end_date && t.end_date !== t.start_date);
                const maxVisible = 4;
                const visibleSingle = singleDay.slice(0, maxVisible);
                const overflow = singleDay.length - maxVisible;

                return (
                  <div className="flex-1 min-w-0 flex flex-col gap-1 overflow-hidden">
                    {dayTasks.length === 0 ? (
                      <span
                        className="text-[11px] mt-1"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        暂无任务
                      </span>
                    ) : (
                      <>
                        {/* Single-day: icon + title */}
                        {visibleSingle.map((task) => {
                          const done = task.status === "completed";
                          return (
                            <div
                              key={task.id}
                              className="flex items-center gap-1.5 min-w-0"
                              style={{ opacity: done ? 0.5 : 1 }}
                            >
                              <TaskIcon icon={task.icon} color={task.icon_color} size={20} />
                              <span
                                className="text-[12px] font-medium leading-tight truncate"
                                style={{
                                  color: "var(--text-primary)",
                                  textDecoration: done ? "line-through" : "none",
                                }}
                              >
                                {task.title}
                              </span>
                            </div>
                          );
                        })}
                        {overflow > 0 && (
                          <span
                            className="text-[10px] font-semibold"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            +{overflow} 更多
                          </span>
                        )}
                        {/* Multi-day: icons only, horizontal */}
                        {multiDay.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            {multiDay.map((task) => (
                              <span key={task.id} style={{ opacity: task.status === "completed" ? 0.4 : 1 }}>
                                <TaskIcon icon={task.icon} color={task.icon_color} size={20} />
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </motion.button>

            {/* Bottom-sheet popover */}
            <AnimatePresence>
              {selectedDate === dateStr && (
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

      {/* Load future button */}
      <div ref={bottomSentinelRef}>
        <button
          onClick={loadFuture}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-[12px] text-[12px] font-medium transition-colors"
          style={{ color: "var(--text-secondary)", background: "var(--border-subtle)" }}
        >
          <ChevronDown size={14} strokeWidth={2} />
          加载更多
        </button>
      </div>

      {/* Back to today FAB */}
      <AnimatePresence>
        {showBackToToday && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={scrollToToday}
            style={{
              background: "var(--surface-elevated)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
              color: "var(--accent)",
              bottom: "calc(120px + env(safe-area-inset-bottom, 0px))",
            }}
            className="fixed left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold z-30"
          >
            <CalendarDays size={14} strokeWidth={2} />
            回到今天
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
