"use client";

import { useMemo } from "react";
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
    () => [...tasks].filter((t) => t.type !== "note").sort((a, b) => (a.created_at > b.created_at ? 1 : -1)),
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
          <span key={task.id} style={{ opacity: task.status === "completed" ? 0.4 : 1 }}>
            <TaskIcon icon={task.icon} color={task.icon_color} size={14} />
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
    <div className="flex flex-col gap-[3px] w-full overflow-hidden">
      {/* Single-day: icon + title, one per row */}
      {visibleSingle.map((task) => {
        const done = task.status === "completed";
        return (
          <div
            key={task.id}
            className="flex items-center gap-1 px-[3px] py-[2px] rounded-[6px] min-w-0"
            style={{
              background: `${task.icon_color}${done ? "0c" : "18"}`,
              opacity: done ? 0.5 : 1,
            }}
          >
            <TaskIcon icon={task.icon} color={task.icon_color} size={20} />
            <span
              className="text-[10px] font-medium leading-tight truncate"
              style={{
                color: task.icon_color,
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

      {/* Multi-day: icons only, horizontal row */}
      {multiDayTasks.length > 0 && (
        <div className="flex flex-wrap items-center px-[3px]" style={{ gap: 3 }}>
          {multiDayTasks.map((task) => (
            <span key={task.id} style={{ opacity: task.status === "completed" ? 0.4 : 1 }}>
              <TaskIcon
                icon={task.icon}
                color={task.icon_color}
                size={20}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
