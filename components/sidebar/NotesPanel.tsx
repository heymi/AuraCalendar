"use client";

import { useMemo, useState } from "react";
import { StickyNote } from "lucide-react";
import { Task } from "@/lib/db";
import NoteDetailModal from "@/components/task/NoteDetailModal";
import ListModal from "@/components/ui/ListModal";
import NoteCard from "./NoteCard";

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
  const [showAll, setShowAll] = useState(false);

  const PREVIEW_LIMIT = 4;
  const hasMore = notes.length > PREVIEW_LIMIT;
  const previewNotes = hasMore ? notes.slice(0, PREVIEW_LIMIT) : notes;

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
          <>
            <div className="grid grid-cols-2 gap-2.5 pb-2">
              {previewNotes.map((note) => (
                <NoteCard key={note.id} note={note} onClick={() => setViewingNote(note)} />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full mt-1 text-[12px] font-medium cursor-pointer text-center py-1 transition-opacity hover:opacity-70"
                style={{ color: "var(--accent)" }}
              >
                查看全部 {notes.length} 条 →
              </button>
            )}
          </>
        )}
      </div>

      <ListModal title={`全部笔记 (${notes.length})`} open={showAll} onClose={() => setShowAll(false)}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onClick={() => { setShowAll(false); setViewingNote(note); }} />
          ))}
        </div>
      </ListModal>

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
