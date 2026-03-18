"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { CalendarRange } from "lucide-react";
import { LayoutGroup } from "framer-motion";
import { Task } from "@/lib/db";
import { isMultiDay, isInbox } from "@/lib/utils";
import MultiDayTaskCard from "./MultiDayTaskCard";
import EditTaskModal from "@/components/task/EditTaskModal";
import ListModal from "@/components/ui/ListModal";

interface MultiDayPanelProps {
  tasks: Task[];
  onHighlight: (dates: string[]) => void;
  onClearHighlight: () => void;
  onUpdateTask: (id: string, fields: Partial<Task>) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

export default function MultiDayPanel({
  tasks,
  onHighlight,
  onClearHighlight,
  onUpdateTask,
  onUpdateStatus,
}: MultiDayPanelProps) {
  // IDs that were just completed — keep them in place for 2s before moving to bottom
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
  const [showAll, setShowAll] = useState(false);

  const handleUpdateStatus = useCallback(async (id: string, status: string) => {
    if (status === "completed") {
      // Add protection BEFORE the async update so the re-render won't move it
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
      // If uncompleted, remove from recentlyCompleted immediately
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

  const PREVIEW_LIMIT = 10;
  const hasMore = multiDayTasks.length > PREVIEW_LIMIT;
  const previewTasks = hasMore ? multiDayTasks.slice(0, PREVIEW_LIMIT) : multiDayTasks;

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
            className="text-[12px] text-center py-6"
          >
            暂无任务
          </p>
        ) : (
          <>
            <LayoutGroup>
              <div className="flex flex-col gap-1.5">
                {previewTasks.map((task) => (
                  <MultiDayTaskCard
                    key={task.id}
                    task={task}
                    onHover={onHighlight}
                    onLeave={onClearHighlight}
                    onEdit={setEditingTask}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            </LayoutGroup>
            {hasMore && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full mt-2 text-[12px] font-medium cursor-pointer text-center py-1 transition-opacity hover:opacity-70"
                style={{ color: "var(--accent)" }}
              >
                查看全部 {multiDayTasks.length} 条 →
              </button>
            )}
          </>
        )}
      </div>

      <ListModal title={`全部任务 (${multiDayTasks.length})`} open={showAll} onClose={() => setShowAll(false)}>
        <LayoutGroup id="modal-tasks">
          <div className="flex flex-col gap-2">
            {multiDayTasks.map((task) => (
              <MultiDayTaskCard
                key={task.id}
                task={task}
                onHover={onHighlight}
                onLeave={onClearHighlight}
                onEdit={(t) => { setShowAll(false); setEditingTask(t); }}
                onUpdateStatus={handleUpdateStatus}
                layoutPrefix="modal"
              />
            ))}
          </div>
        </LayoutGroup>
      </ListModal>

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
