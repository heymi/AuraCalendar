"use client";

import { motion } from "framer-motion";
import dayjs from "dayjs";
import { Task } from "@/lib/db";
import { isToday } from "@/lib/utils";
import TaskIconStack from "./TaskIconStack";

interface DayBlockProps {
  date: dayjs.Dayjs;
  currentMonth: number;
  tasks: Task[];
  isHighlighted: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

export default function DayBlock({
  date,
  currentMonth,
  tasks,
  isHighlighted,
  isSelected = false,
  onClick,
}: DayBlockProps) {
  const isCurrentMonth = date.month() + 1 === currentMonth;
  const today = isToday(date);
  const isPast = isCurrentMonth && !today && date.isBefore(dayjs(), "day");

  return (
    <motion.button
      data-day-block
      onClick={onClick}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.965 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        background: isSelected
          ? "var(--accent-highlight)"
          : isHighlighted
          ? "var(--accent-highlight)"
          : isCurrentMonth
          ? "var(--surface)"
          : "transparent",
        borderColor: isSelected
          ? "var(--accent)"
          : today
          ? "var(--accent)"
          : isHighlighted
          ? "var(--accent-highlight-border)"
          : isCurrentMonth
          ? "var(--border)"
          : "transparent",
        borderWidth: today || isSelected ? 1.5 : 1,
        opacity: !isCurrentMonth ? 0.3 : isPast ? 0.55 : 1,
      }}
      className="relative flex flex-col items-start p-2 aspect-[4/3] w-full rounded-[14px] border cursor-pointer text-left transition-colors duration-200 gap-[3px]"
    >
      <span
        style={
          today
            ? { background: "var(--today-bg)", color: "#fff" }
            : { color: "var(--text-primary)" }
        }
        className="text-[13px] font-semibold w-[24px] h-[24px] flex items-center justify-center rounded-full shrink-0 tracking-[-0.01em]"
      >
        {date.date()}
      </span>

      {tasks.length > 0 && <TaskIconStack tasks={tasks} />}
    </motion.button>
  );
}
