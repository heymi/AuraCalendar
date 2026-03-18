"use client";

import { useMemo, useState } from "react";
import { Task } from "@/lib/db";
import TaskIcon from "@/components/TaskIcon";

interface TaskIconStackProps {
  tasks: Task[];
  compact?: boolean;
}

function isMultiDay(task: Task) {
  return task.end_date != null && task.end_date !== task.start_date;
}

export default function TaskIconStack({ tasks, compact = false }: TaskIconStackProps) {
  const sorted = useMemo(
    () => [...tasks].filter((t) => t.type !== "note").sort((a, b) => {
      const aDone = a.status === "completed" ? 1 : 0;
      const bDone = b.status === "completed" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return a.created_at > b.created_at ? 1 : -1;
    }),
    [tasks]
  );

  const multiDayTasks = sorted.filter(isMultiDay);
  const singleDayTasks = sorted.filter((t) => !isMultiDay(t));

  // Compact: all icons horizontal, no text
  if (compact) {
    const all = sorted.slice(0, 6);
    const overflow = sorted.length - 6;
    return (
      <div className="flex flex-wrap items-center gap-[2px] w-full overflow-hidden">
        {all.map((task) => (
          <span key={task.id}>
            <TaskIcon icon={task.icon} color={task.icon_color} size={14} done={task.status === "completed"} />
          </span>
        ))}
        {overflow > 0 && (
          <span style={{ color: "var(--text-secondary)", fontSize: 8, fontWeight: 600, lineHeight: 1 }}>
            +{overflow}
          </span>
        )}
      </div>
    );
  }

  // Normal mode
  const maxSingle = 3;
  const visibleSingle = singleDayTasks.slice(0, maxSingle);
  const overflow = singleDayTasks.length - maxSingle;

  return (
    <div className="flex flex-col gap-[3px] w-full overflow-hidden flex-1">
      {/* Single-day: icon + title, one per row */}
      {visibleSingle.map((task) => {
        const done = task.status === "completed";
        return (
          <div
            key={task.id}
            className="flex items-center gap-1 px-[3px] py-[2px] rounded-[6px] min-w-0"
          >
            <TaskIcon icon={task.icon} color={task.icon_color} size={20} done={done} />
            <span
              className="text-[10px] font-medium leading-tight truncate"
              style={{
                color: "#999",
                textDecoration: done ? "line-through" : "none",
              }}
            >
              {task.title}
            </span>
          </div>
        );
      })}
      {overflow > 0 && (
        <span
          style={{
            color: "var(--text-secondary)",
            fontSize: 9,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          +{overflow}
        </span>
      )}

      {/* Multi-day: icons stacked, spread on hover */}
      {multiDayTasks.length > 0 && (
        <MultiDayStack tasks={multiDayTasks} />
      )}
    </div>
  );
}

function MultiDayStack({ tasks }: { tasks: Task[] }) {
  const [hovered, setHovered] = useState(false);

  // Incomplete first, completed last
  const sorted = useMemo(
    () => [...tasks].sort((a, b) => {
      const aDone = a.status === "completed" ? 1 : 0;
      const bDone = b.status === "completed" ? 1 : 0;
      return aDone - bDone;
    }),
    [tasks]
  );

  return (
    <div
      className="flex items-center justify-center px-[3px] mt-auto"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {sorted.map((task, i) => (
        <span
          key={task.id}
          style={{
            marginLeft: i === 0 ? 0 : hovered ? 3 : -8,
            zIndex: sorted.length - i,
            transition: "margin-left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <TaskIcon
            icon={task.icon}
            color={task.icon_color}
            size={24}
            done={task.status === "completed"}
          />
        </span>
      ))}
    </div>
  );
}
