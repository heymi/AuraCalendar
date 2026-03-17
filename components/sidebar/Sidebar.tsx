"use client";

import { useMemo, useState } from "react";
import { CalendarRange, StickyNote } from "lucide-react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { Task } from "@/lib/db";
import { isMultiDay } from "@/lib/utils";
import MultiDayTaskCard from "./MultiDayTaskCard";
import EditTaskModal from "@/components/task/EditTaskModal";
import NoteDetailModal from "@/components/task/NoteDetailModal";

interface SidebarProps {
  tasks: Task[];
  onHighlight: (dates: string[]) => void;
  onClearHighlight: () => void;
  onUpdateTask: (id: string, fields: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

const NOTE_COLOR = "#F59E0B";

export default function Sidebar({
  tasks,
  onHighlight,
  onClearHighlight,
  onUpdateTask,
  onDeleteTask,
  onUpdateStatus,
}: SidebarProps) {
  const multiDayTasks = useMemo(
    () => tasks.filter((t) => t.type !== "note" && isMultiDay(t.start_date, t.end_date)),
    [tasks]
  );

  const notes = useMemo(
    () => tasks.filter((t) => t.type === "note").sort((a, b) => (a.created_at > b.created_at ? -1 : 1)),
    [tasks]
  );

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingNote, setViewingNote] = useState<Task | null>(null);

  return (
    <>
      {/* Multi-day tasks */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
        className="w-full rounded-[20px] p-4 h-fit"
      >
        <div className="flex items-center gap-2 mb-3">
          <CalendarRange size={14} style={{ color: "var(--accent)" }} strokeWidth={2} />
          <h2
            style={{ color: "var(--text-primary)" }}
            className="text-[12px] font-semibold tracking-[0.02em] uppercase"
          >
            跨天任务
          </h2>
          <span
            style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
            className="ml-auto text-[11px] font-semibold px-[6px] py-[2px] rounded-full leading-none"
          >
            {multiDayTasks.length}
          </span>
        </div>

        {multiDayTasks.length === 0 ? (
          <p
            style={{ color: "var(--text-tertiary)" }}
            className="text-[12px] text-center py-6"
          >
            暂无跨天任务
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {multiDayTasks.map((task) => (
              <MultiDayTaskCard
                key={task.id}
                task={task}
                onHover={onHighlight}
                onLeave={onClearHighlight}
                onEdit={setEditingTask}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {notes.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
          className="w-full rounded-[20px] p-4 h-fit"
        >
          <div className="flex items-center gap-2 mb-3">
            <StickyNote size={14} style={{ color: NOTE_COLOR }} strokeWidth={2} />
            <h2
              style={{ color: "var(--text-primary)" }}
              className="text-[12px] font-semibold tracking-[0.02em] uppercase"
            >
              笔记
            </h2>
            <span
              style={{ background: "rgba(245, 158, 11, 0.10)", color: NOTE_COLOR }}
              className="ml-auto text-[11px] font-semibold px-[6px] py-[2px] rounded-full leading-none"
            >
              {notes.length}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                whileHover={{ scale: 1.015 }}
                onClick={() => setViewingNote(note)}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                }}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-[14px] cursor-pointer transition-shadow hover:shadow-[var(--shadow-sm)]"
              >
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: NOTE_COLOR,
                  }}
                >
                  <StickyNote size={15} color="white" strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    style={{ color: "var(--text-primary)" }}
                    className="text-[13px] font-medium leading-[1.4] tracking-[-0.01em] truncate"
                  >
                    {note.title}
                  </p>
                  <p
                    style={{ color: "var(--text-secondary)" }}
                    className="text-[11px] mt-0.5 tracking-[-0.01em]"
                  >
                    {dayjs(note.created_at).format("M月D日 HH:mm")}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

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
