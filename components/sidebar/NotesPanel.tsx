"use client";

import { useMemo, useState } from "react";
import { StickyNote } from "lucide-react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { Task } from "@/lib/db";
import NoteDetailModal from "@/components/task/NoteDetailModal";

interface NotesPanelProps {
  tasks: Task[];
  onUpdateTask: (id: string, fields: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

const NOTE_COLOR = "#F59E0B";

export default function NotesPanel({
  tasks,
  onUpdateTask,
  onDeleteTask,
}: NotesPanelProps) {
  const notes = useMemo(
    () => tasks.filter((t) => t.type === "note").sort((a, b) => (a.created_at > b.created_at ? -1 : 1)),
    [tasks]
  );

  const [viewingNote, setViewingNote] = useState<Task | null>(null);

  return (
    <>
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

        {notes.length === 0 ? (
          <p
            style={{ color: "var(--text-tertiary)" }}
            className="text-[12px] text-center py-6"
          >
            暂无笔记
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[480px] overflow-y-auto">
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
        )}
      </div>

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
