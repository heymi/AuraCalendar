"use client";

import { Task } from "@/lib/db";
import MultiDayPanel from "@/components/sidebar/MultiDayPanel";
import NotesPanel from "@/components/sidebar/NotesPanel";

interface MobileListViewProps {
  tasks: Task[];
  onHighlight: (dates: string[]) => void;
  onClearHighlight: () => void;
  onUpdateTask: (id: string, fields: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

export default function MobileListView({
  tasks,
  onHighlight,
  onClearHighlight,
  onUpdateTask,
  onDeleteTask,
  onUpdateStatus,
}: MobileListViewProps) {
  return (
    <div className="flex flex-col gap-4 pb-[70px] max-w-[540px] mx-auto">
      <MultiDayPanel
        tasks={tasks}
        onHighlight={onHighlight}
        onClearHighlight={onClearHighlight}
        onUpdateTask={onUpdateTask}
        onUpdateStatus={onUpdateStatus}
      />
      <NotesPanel
        tasks={tasks}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
      />
    </div>
  );
}
