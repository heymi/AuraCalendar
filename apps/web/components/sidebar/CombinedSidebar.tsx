"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { CalendarRange, StickyNote } from "lucide-react";
import { LayoutGroup, motion } from "framer-motion";
import { Task } from "@/lib/db";
import { isMultiDay, isInbox } from "@/lib/utils";
import MultiDayTaskCard from "./MultiDayTaskCard";
import NoteCard from "./NoteCard";
import EditTaskModal from "@/components/task/EditTaskModal";
import NoteDetailModal from "@/components/task/NoteDetailModal";
import ListModal from "@/components/ui/ListModal";

interface CombinedSidebarProps {
  tasks: Task[];
  onHighlight: (dates: string[]) => void;
  onClearHighlight: () => void;
  onUpdateTask: (id: string, fields: Partial<Task>) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

const NOTE_COLOR = "#F59E0B";
const PREVIEW_LIMIT = 5;

export default function CombinedSidebar({
  tasks,
  onHighlight,
  onClearHighlight,
  onUpdateTask,
  onUpdateStatus,
  onDeleteTask,
}: CombinedSidebarProps) {
  // --- Tasks ---
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const multiDayTasks = useMemo(() => {
    const filtered = tasks.filter((t) => t.type !== "note" && (isMultiDay(t.start_date, t.end_date) || isInbox(t)));
    return filtered.sort((a, b) => {
      const aDone = a.status === "completed" && !recentlyCompleted.has(a.id);
      const bDone = b.status === "completed" && !recentlyCompleted.has(b.id);
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
    });
  }, [tasks, recentlyCompleted]);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);

  const handleUpdateStatus = useCallback(async (id: string, status: string) => {
    if (status === "completed") {
      setRecentlyCompleted((prev) => new Set(prev).add(id));
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        setRecentlyCompleted((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        timersRef.current.delete(id);
      }, 2000);
      timersRef.current.set(id, timer);
    } else {
      const existing = timersRef.current.get(id);
      if (existing) { clearTimeout(existing); timersRef.current.delete(id); }
      setRecentlyCompleted((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    await onUpdateStatus(id, status);
  }, [onUpdateStatus]);

  const hasMoreTasks = multiDayTasks.length > PREVIEW_LIMIT;
  const previewTasks = hasMoreTasks ? multiDayTasks.slice(0, PREVIEW_LIMIT) : multiDayTasks;

  // --- Notes ---
  const notes = useMemo(
    () => tasks.filter((t) => t.type === "note").sort((a, b) => (a.created_at > b.created_at ? -1 : 1)),
    [tasks]
  );

  const [viewingNote, setViewingNote] = useState<Task | null>(null);
  const [showAllNotes, setShowAllNotes] = useState(false);

  const hasMoreNotes = notes.length > PREVIEW_LIMIT;
  const previewNotes = hasMoreNotes ? notes.slice(0, PREVIEW_LIMIT) : notes;

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
        {/* Tasks section */}
        <div className="flex items-center gap-2 mb-2.5">
          <CalendarRange size={14} style={{ color: "var(--accent)" }} strokeWidth={2} />
          <h2
            style={{ color: "var(--text-primary)" }}
            className="text-[12px] font-semibold tracking-[0.02em] uppercase"
          >
            任务列表
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
            className="text-[12px] text-center py-4"
          >
            暂无任务
          </p>
        ) : (
          <>
            <LayoutGroup>
              <div className="flex flex-col gap-1">
                {previewTasks.map((task) => (
                  <MultiDayTaskCard
                    key={task.id}
                    task={task}
                    compact
                    onHover={onHighlight}
                    onLeave={onClearHighlight}
                    onEdit={setEditingTask}
                    onUpdateStatus={handleUpdateStatus}
                    layoutPrefix="combined"
                  />
                ))}
              </div>
            </LayoutGroup>
            {hasMoreTasks && (
              <button
                onClick={() => setShowAllTasks(true)}
                className="w-full mt-1.5 text-[12px] font-medium cursor-pointer text-center py-1 transition-opacity hover:opacity-70"
                style={{ color: "var(--accent)" }}
              >
                查看更多 →
              </button>
            )}
          </>
        )}

        {/* Divider */}
        <div
          className="my-3"
          style={{ borderTop: "1px solid var(--border)" }}
        />

        {/* Notes section */}
        <div className="flex items-center gap-2 mb-2.5">
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
            className="text-[12px] text-center py-4"
          >
            暂无笔记
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              {previewNotes.map((note) => {
                const preview = note.notes
                  ? note.notes.replace(/[#*_`>\-\[\]]/g, "").trim()
                  : "";
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    whileHover={{ backgroundColor: "var(--surface-elevated)" }}
                    onClick={() => setViewingNote(note)}
                    className="px-2 py-1.5 rounded-[10px] cursor-pointer transition-colors"
                  >
                    <p
                      style={{ color: "var(--text-primary)" }}
                      className="text-[12px] font-medium leading-[1.4] line-clamp-1"
                    >
                      {note.title}
                    </p>
                    {preview && (
                      <p
                        style={{ color: "var(--text-secondary)" }}
                        className="text-[11px] leading-[1.4] line-clamp-1 mt-0.5"
                      >
                        {preview}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
            {hasMoreNotes && (
              <button
                onClick={() => setShowAllNotes(true)}
                className="w-full mt-1.5 text-[12px] font-medium cursor-pointer text-center py-1 transition-opacity hover:opacity-70"
                style={{ color: "var(--accent)" }}
              >
                查看更多 →
              </button>
            )}
          </>
        )}
      </div>

      {/* Task list modal */}
      <ListModal title={`全部任务 (${multiDayTasks.length})`} open={showAllTasks} onClose={() => setShowAllTasks(false)}>
        <LayoutGroup id="combined-modal-tasks">
          <div className="flex flex-col gap-2">
            {multiDayTasks.map((task) => (
              <MultiDayTaskCard
                key={task.id}
                task={task}
                onHover={onHighlight}
                onLeave={onClearHighlight}
                onEdit={(t) => { setShowAllTasks(false); setEditingTask(t); }}
                onUpdateStatus={handleUpdateStatus}
                layoutPrefix="combined-modal"
              />
            ))}
          </div>
        </LayoutGroup>
      </ListModal>

      {/* Notes list modal */}
      <ListModal title={`全部笔记 (${notes.length})`} open={showAllNotes} onClose={() => setShowAllNotes(false)}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onClick={() => { setShowAllNotes(false); setViewingNote(note); }} />
          ))}
        </div>
      </ListModal>

      {/* Edit task modal */}
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

      {/* Note detail modal */}
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
