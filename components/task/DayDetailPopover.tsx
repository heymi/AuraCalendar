"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import dayjs from "dayjs";
import { Task } from "@/lib/db";
import { useIsMobile } from "@/hooks/useIsMobile";
import TaskItem from "./TaskItem";
import EditTaskModal from "./EditTaskModal";

interface DayDetailPopoverProps {
  date: string;
  tasks: Task[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateTask: (id: string, fields: Partial<Task>) => Promise<void>;
}

export default function DayDetailPopover({
  date,
  tasks,
  onClose,
  onUpdateStatus,
  onDeleteTask,
  onUpdateTask,
}: DayDetailPopoverProps) {
  const d = dayjs(date);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();

  const header = (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3
          style={{ color: "var(--text-primary)" }}
          className="text-[15px] font-semibold tracking-[-0.02em] leading-tight"
        >
          {d.format("M月D日")}
        </h3>
        <p
          style={{ color: "var(--text-secondary)" }}
          className="text-[11px] mt-0.5 tracking-[-0.01em]"
        >
          {d.format("dddd")} · {tasks.length} 个任务
        </p>
      </div>
      <button
        onClick={onClose}
        style={{ color: "var(--text-secondary)" }}
        className="p-1 -mt-0.5 -mr-0.5 rounded-[8px] hover:bg-[var(--border-subtle)] transition-colors"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );

  const taskList = tasks.length === 0 ? (
    <p
      style={{ color: "var(--text-tertiary)" }}
      className="text-[13px] text-center py-6"
    >
      暂无任务
    </p>
  ) : (
    <div className="flex flex-col gap-1.5 sm:max-h-[280px] overflow-y-auto -mx-1 px-1">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDeleteTask}
          onEdit={setEditingTask}
        />
      ))}
    </div>
  );

  return (
    <>
      {isMobile ? (
        /* Mobile: fixed bottom sheet */
        <motion.div
          data-popover
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50"
          style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{
              y: 0,
              top: expanded ? 0 : "auto",
              bottom: expanded ? 0 : "calc(50px + env(safe-area-inset-bottom, 0px))",
              maxHeight: expanded ? "100vh" : "85vh",
              borderRadius: expanded ? "0px" : "20px 20px 0 0",
            }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            style={{
              background: "var(--surface-elevated)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              boxShadow: "var(--shadow-xl)",
              bottom: expanded ? 0 : "calc(50px + env(safe-area-inset-bottom, 0px))",
              maxHeight: expanded ? "100vh" : "85vh",
            }}
            className="absolute left-0 right-0 rounded-t-[20px] p-4 flex flex-col overflow-hidden"
          >
            {/* Drag handle — tap to toggle fullscreen */}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex justify-center py-1 -mt-1 mb-2 shrink-0"
            >
              <div
                className="w-9 h-[5px] rounded-full transition-colors"
                style={{ background: expanded ? "var(--accent)" : "var(--border)" }}
              />
            </button>
            <div className="shrink-0">{header}</div>
            <div className="flex-1 overflow-y-auto min-h-0">{taskList}</div>
          </motion.div>
        </motion.div>
      ) : (
        /* Desktop: absolute popover */
        <motion.div
          data-popover
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ type: "spring", damping: 28, stiffness: 380 }}
          style={{
            background: "var(--surface-elevated)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-xl)",
            left: "100%",
            bottom: "100%",
          }}
          className="absolute z-50 w-[280px] sm:w-[320px] rounded-[16px] p-4"
        >
          {header}
          {taskList}
        </motion.div>
      )}

      {/* Edit overlay */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={async (id, fields) => {
            await onUpdateTask(id, fields);
            setEditingTask(null);
          }}
        />
      )}
    </>
  );
}
