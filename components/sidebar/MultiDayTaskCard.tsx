"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/lib/db";
import { formatDateRange } from "@/lib/utils";
import TaskIcon from "@/components/TaskIcon";
import dayjs from "dayjs";

interface MultiDayTaskCardProps {
  task: Task;
  onHover: (dates: string[]) => void;
  onLeave: () => void;
  onEdit: (task: Task) => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

const STATUS_CYCLE: Record<string, string> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: {
    label: "待开始",
    color: "var(--text-tertiary)",
    bg: "transparent",
    icon: "",
  },
  in_progress: {
    label: "进行中",
    color: "var(--warning)",
    bg: "rgba(255, 159, 10, 0.12)",
    icon: "◐",
  },
  completed: {
    label: "已完成",
    color: "var(--success)",
    bg: "rgba(52, 199, 89, 0.12)",
    icon: "✓",
  },
};

export default function MultiDayTaskCard({
  task,
  onHover,
  onLeave,
  onEdit,
  onUpdateStatus,
}: MultiDayTaskCardProps) {
  const [cycling, setCycling] = useState(false);
  const cfg = STATUS_CONFIG[task.status];

  const getDatesInRange = () => {
    const dates: string[] = [];
    const start = dayjs(task.start_date);
    const end = task.end_date ? dayjs(task.end_date) : start;
    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      dates.push(current.format("YYYY-MM-DD"));
      current = current.add(1, "day");
    }
    return dates;
  };

  const handleStatusClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cycling) return;
    setCycling(true);
    await onUpdateStatus(task.id, STATUS_CYCLE[task.status]);
    setCycling(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      whileHover={{ scale: 1.015 }}
      onHoverStart={() => onHover(getDatesInRange())}
      onHoverEnd={onLeave}
      onClick={() => onEdit(task)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-subtle)",
      }}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] cursor-pointer transition-shadow hover:shadow-[var(--shadow-sm)]"
    >
      {/* Status circle */}
      <motion.button
        whileTap={{ scale: 0.75 }}
        onClick={handleStatusClick}
        title={cfg.label}
        style={{
          background: cfg.bg,
          border: `1.5px solid ${cfg.color}`,
          color: cfg.color,
          transition: "all 0.2s ease",
        }}
        className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={task.status}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.12 }}
          >
            {cfg.icon}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Category icon */}
      <TaskIcon icon={task.icon} color={task.icon_color} size={24} />

      <div className="flex-1 min-w-0">
        <p
          style={{
            color: task.status === "completed" ? "var(--text-secondary)" : "var(--text-primary)",
            textDecoration: task.status === "completed" ? "line-through" : "none",
          }}
          className="text-[13px] font-medium leading-[1.4] tracking-[-0.01em] transition-colors duration-200"
        >
          {task.title}
        </p>
        <p
          style={{ color: "var(--text-secondary)" }}
          className="text-[11px] mt-0.5 tracking-[-0.01em]"
        >
          {formatDateRange(task.start_date, task.end_date)}
        </p>
      </div>
    </motion.div>
  );
}
