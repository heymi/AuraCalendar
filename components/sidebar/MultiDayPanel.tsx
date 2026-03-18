"use client";

import { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { Task } from "@/lib/db";
import { isMultiDay, isInbox } from "@/lib/utils";
import MultiDayTaskCard from "./MultiDayTaskCard";
import EditTaskModal from "@/components/task/EditTaskModal";

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
  const multiDayTasks = useMemo(
    () => tasks.filter((t) => t.type !== "note" && (isMultiDay(t.start_date, t.end_date) || isInbox(t))),
    [tasks]
  );

  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
