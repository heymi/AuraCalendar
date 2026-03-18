"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Task } from "@/lib/db";

export function useTasks(monthKey: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const initialized = useRef(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?month=${monthKey}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch tasks");
    } finally {
      if (!initialized.current) {
        initialized.current = true;
        setInitialLoading(false);
      }
    }
  }, [monthKey]);

  useEffect(() => {
    initialized.current = false;
    setInitialLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  const createBatch = useCallback(
    async (input: string, parsedList: object[]) => {
      await Promise.all(
        parsedList.map((parsed) =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input, parsed }),
          })
        )
      );
      await fetchTasks();
    },
    [fetchTasks]
  );

  const createNote = useCallback(
    async (input: string, noteData: object, extractedTasks: object[]) => {
      // Create note record
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, parsed: noteData, type: "note" }),
      });
      // Create extracted tasks in parallel
      if (extractedTasks.length > 0) {
        await Promise.all(
          extractedTasks.map((parsed) =>
            fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ input, parsed }),
            })
          )
        );
      }
      await fetchTasks();
    },
    [fetchTasks]
  );

  const updateTask = useCallback(
    async (id: string, fields: Partial<Pick<Task, "title" | "start_date" | "end_date" | "status" | "icon" | "icon_color">>) => {
      // Optimistic
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)));
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) await fetchTasks();
      else {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
    },
    [fetchTasks]
  );

  const updateStatus = useCallback(
    async (id: string, status: string) => {
      await updateTask(id, { status: status as Task["status"] });
    },
    [updateTask]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) await fetchTasks();
    },
    [fetchTasks]
  );

  return {
    tasks,
    loading: initialLoading,
    fetchTasks,
    createBatch,
    createNote,
    updateTask,
    updateStatus,
    deleteTask,
  };
}
