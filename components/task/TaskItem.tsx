"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Pencil, StickyNote } from "lucide-react";
import { Task } from "@/lib/db";
import TaskIcon from "@/components/TaskIcon";

interface TaskItemProps {
  task: Task;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (task: Task) => void;
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

const NOTE_COLOR = "#F59E0B";

export default function TaskItem({ task, onUpdateStatus, onDelete, onEdit }: TaskItemProps) {
  const [cycling, setCycling] = useState(false);
  const cfg = STATUS_CONFIG[task.status];
  const isNote = task.type === "note";

  const handleStatusClick = async () => {
    if (cycling) return;
    setCycling(true);
    await onUpdateStatus(task.id, STATUS_CYCLE[task.status]);
    setCycling(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-subtle)",
      }}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] group"
    >
      {isNote ? (
        /* Note: single yellow icon */
        <span
          className="flex items-center justify-center shrink-0"
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: NOTE_COLOR,
          }}
        >
          <StickyNote size={13} color="white" strokeWidth={2} />
        </span>
      ) : (
        <>
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
        </>
      )}

      {/* Title + Notes */}
      <div className="flex-1 min-w-0">
        <span
          style={{
            color: !isNote && task.status === "completed" ? "var(--text-secondary)" : "var(--text-primary)",
            textDecoration: !isNote && task.status === "completed" ? "line-through" : "none",
            transition: "color 0.2s",
          }}
          className="text-[13px] font-medium leading-[1.4] tracking-[-0.01em] block"
        >
          {task.title}
        </span>
        {task.notes && (
          <span
            style={{ color: "var(--text-tertiary)" }}
            className="text-[11px] leading-[1.4] mt-0.5 block truncate"
          >
            {isNote
              ? task.notes.replace(/[#*_`>\-\[\]]/g, "").slice(0, 60)
              : task.notes}
          </span>
        )}
      </div>

      {/* Edit */}
      {onEdit && (
        <button
          onClick={() => onEdit(task)}
          style={{ color: "var(--text-tertiary)" }}
          className="p-1 rounded-[8px] opacity-60 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-[var(--border-subtle)] transition-all shrink-0"
        >
          <Pencil size={12} strokeWidth={2} />
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        style={{ color: "var(--text-tertiary)" }}
        className="p-1 rounded-[8px] opacity-60 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-[var(--border-subtle)] transition-all shrink-0"
      >
        <Trash2 size={12} strokeWidth={2} />
      </button>
    </motion.div>
  );
}
