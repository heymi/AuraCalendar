"use client";

import { useState } from "react";
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
  collapsed?: boolean;
  onClick: () => void;
}

export default function DayBlock({
  date,
  currentMonth,
  tasks,
  isHighlighted,
  isSelected = false,
  collapsed = false,
  onClick,
}: DayBlockProps) {
  const isCurrentMonth = date.month() + 1 === currentMonth;
  const today = isToday(date);
  const isPast = isCurrentMonth && !today && date.isBefore(dayjs(), "day");
  const [hovered, setHovered] = useState(false);

  const baseBorderColor = isSelected
    ? "var(--accent)"
    : today
    ? "var(--accent)"
    : isHighlighted
    ? "var(--accent-highlight-border)"
    : isCurrentMonth
    ? "var(--border)"
    : "transparent";

  return (
    <motion.button
      data-day-block
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
        borderColor: hovered && !today && !isSelected
          ? "var(--accent)"
          : baseBorderColor,
        borderWidth: today || isSelected ? 1.5 : 1,
        opacity: !isCurrentMonth ? 0.3 : isPast ? 0.55 : 1,
      }}
      className={`relative flex flex-col items-start w-full rounded-[18px] border cursor-pointer text-left transition-all duration-300 overflow-hidden ${
        collapsed
          ? "p-1 gap-[1px] aspect-[4/1.2]"
          : "p-2 gap-[3px] aspect-[4/3.6]"
      }`}
    >
      <span
        style={
          today
            ? { background: "var(--today-bg)", color: "#fff" }
            : { color: "var(--text-tertiary)" }
        }
        className={`font-semibold flex items-center justify-center self-center rounded-full shrink-0 tracking-[-0.01em] transition-all duration-300 ${
          collapsed
            ? "text-[11px] w-[18px] h-[18px]"
            : "text-[13px] w-[24px] h-[24px]"
        }`}
      >
        {date.date()}
      </span>

      {tasks.length > 0 && <TaskIconStack tasks={tasks} compact={collapsed} />}
    </motion.button>
  );
}
