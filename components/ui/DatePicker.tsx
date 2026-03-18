"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import dayjs from "dayjs";

interface DatePickerProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
  placeholder?: string;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export default function DatePicker({ value, onChange, placeholder = "选择日期" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? dayjs(value) : dayjs()
  );
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Sync viewMonth when value changes externally
  useEffect(() => {
    if (value) setViewMonth(dayjs(value));
  }, [value]);

  const today = dayjs();
  const startOfMonth = viewMonth.startOf("month");
  const daysInMonth = viewMonth.daysInMonth();
  const startDay = startOfMonth.day(); // 0=Sun

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const handleSelect = (day: number) => {
    const date = viewMonth.date(day).format("YYYY-MM-DD");
    onChange(date);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const selectedDate = value ? dayjs(value) : null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: "var(--background)",
          border: "1px solid var(--border)",
          color: value ? "var(--text-primary)" : "var(--text-tertiary)",
        }}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[12px] text-[13px] text-left transition-all focus:outline-none hover:border-[var(--text-tertiary)]"
      >
        <Calendar size={14} strokeWidth={2} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <span className="flex-1 truncate">
          {value ? dayjs(value).format("YYYY 年 M 月 D 日") : placeholder}
        </span>
        {value && (
          <span
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-[var(--border-subtle)] transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={12} strokeWidth={2} />
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-[16px] p-3"
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setViewMonth(viewMonth.subtract(1, "month"))}
                className="p-1.5 rounded-[8px] hover:bg-[var(--border-subtle)] transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <ChevronLeft size={14} strokeWidth={2} />
              </button>
              <span
                style={{ color: "var(--text-primary)" }}
                className="text-[13px] font-semibold tracking-[-0.01em]"
              >
                {viewMonth.format("YYYY 年 M 月")}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(viewMonth.add(1, "month"))}
                className="p-1.5 rounded-[8px] hover:bg-[var(--border-subtle)] transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <ChevronRight size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) => (
                <span
                  key={d}
                  style={{ color: "var(--text-tertiary)" }}
                  className="text-[10px] font-medium text-center py-1"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                if (day === null) {
                  return <span key={`empty-${i}`} />;
                }
                const dateStr = viewMonth.date(day).format("YYYY-MM-DD");
                const isSelected = selectedDate && dateStr === selectedDate.format("YYYY-MM-DD");
                const isToday = dateStr === today.format("YYYY-MM-DD");

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelect(day)}
                    className="relative flex items-center justify-center py-[6px] rounded-[8px] text-[12px] font-medium transition-all hover:bg-[var(--border-subtle)]"
                    style={{
                      color: isSelected
                        ? "white"
                        : isToday
                        ? "var(--accent)"
                        : "var(--text-primary)",
                      background: isSelected ? "var(--accent)" : "transparent",
                    }}
                  >
                    {day}
                    {isToday && !isSelected && (
                      <span
                        className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="flex gap-1.5 mt-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <button
                type="button"
                onClick={() => handleSelect(today.date())}
                className="flex-1 py-1.5 rounded-[8px] text-[11px] font-medium transition-colors hover:bg-[var(--border-subtle)]"
                style={{ color: "var(--accent)" }}
              >
                今天
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="flex-1 py-1.5 rounded-[8px] text-[11px] font-medium transition-colors hover:bg-[var(--border-subtle)]"
                style={{ color: "var(--text-secondary)" }}
              >
                清除
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
