"use client";

import { useState, useRef, useLayoutEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, StickyNote } from "lucide-react";
import dayjs from "dayjs";
import { Task } from "@/lib/db";
import { useIsMobile } from "@/hooks/useIsMobile";
import TaskItem from "./TaskItem";
import EditTaskModal from "./EditTaskModal";
import NoteDetailModal from "./NoteDetailModal";
import NoteCard from "@/components/sidebar/NoteCard";

interface DayDetailPopoverProps {
  date: string;
  tasks: Task[];
  notes?: Task[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateTask: (id: string, fields: Partial<Task>) => Promise<void>;
}

export default function DayDetailPopover({
  date,
  tasks,
  notes = [],
  onClose,
  onUpdateStatus,
  onDeleteTask,
  onUpdateTask,
}: DayDetailPopoverProps) {
  const d = dayjs(date);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingNote, setViewingNote] = useState<Task | null>(null);
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<"left" | "right">("right");
  const [topPx, setTopPx] = useState(0);

  useLayoutEffect(() => {
    const el = popoverRef.current;
    if (!el || isMobile) return;
    const parent = el.offsetParent as HTMLElement | null;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const pad = 8;

    // Pick side with more space
    const spaceRight = window.innerWidth - parentRect.right;
    const spaceLeft = parentRect.left;
    const newSide = spaceRight >= spaceLeft ? "right" : "left";

    // Vertically center on parent, then clamp to viewport
    const parentMidY = parentRect.top + parentRect.height / 2;
    let idealTop = parentMidY - elRect.height / 2;
    idealTop = Math.max(pad, Math.min(idealTop, window.innerHeight - elRect.height - pad));
    const offsetTop = idealTop - parentRect.top;

    setSide(newSide);
    setTopPx(offsetTop);
  }, [isMobile, date, tasks.length]);

  const singleDayTasks = tasks.filter(
    (t) => !t.end_date || t.end_date === t.start_date
  );

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
          {d.format("dddd")} · {singleDayTasks.length} 个任务{notes.length > 0 ? ` · ${notes.length} 条笔记` : ""}
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

  const isEmpty = singleDayTasks.length === 0 && notes.length === 0;

  const contentList = isEmpty ? (
    <p
      style={{ color: "var(--text-tertiary)" }}
      className="text-[13px] text-center py-6"
    >
      暂无内容
    </p>
  ) : (
    <div className="sm:max-h-[360px] overflow-y-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
      {singleDayTasks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {[...singleDayTasks].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDeleteTask}
              onEdit={setEditingTask}
            />
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <>
          {singleDayTasks.length > 0 && (
            <div
              style={{ background: "var(--border-subtle)" }}
              className="h-px my-3"
            />
          )}
          <div className="flex items-center gap-1.5 mb-2">
            <StickyNote size={12} style={{ color: "#F59E0B" }} strokeWidth={2} />
            <span
              style={{ color: "var(--text-secondary)" }}
              className="text-[11px] font-medium"
            >
              笔记
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setViewingNote(note)}
                compact
              />
            ))}
          </div>
        </>
      )}
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
          style={{}}
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
            <div className="flex-1 overflow-y-auto min-h-0">{contentList}</div>
          </motion.div>
        </motion.div>
      ) : (
        /* Desktop: absolute popover, centered on card, auto left/right */
        <motion.div
          ref={popoverRef}
          data-popover
          initial={{ opacity: 0, scale: 0.95, x: side === "right" ? -6 : 6 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: side === "right" ? -6 : 6 }}
          transition={{ type: "spring", damping: 28, stiffness: 380 }}
          style={{
            background: "var(--surface-elevated)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-xl)",
            top: topPx,
            ...(side === "right" ? { left: "calc(100% + 8px)" } : { right: "calc(100% + 8px)" }),
          }}
          className="absolute z-50 w-[340px] sm:w-[384px] rounded-[20px] pt-7 px-7 pb-9"
        >
          {header}
          {contentList}
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

      {/* Note detail overlay */}
      {viewingNote && (
        <NoteDetailModal
          note={viewingNote}
          onClose={() => setViewingNote(null)}
          onDelete={onDeleteTask}
          onSave={async (id, fields) => {
            await onUpdateTask(id, fields);
            setViewingNote(null);
          }}
        />
      )}
    </>
  );
}
