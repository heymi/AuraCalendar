import { useState, useEffect, useCallback, useRef } from "react";
import type { Task } from "@aura/shared/types";
import * as api from "@aura/shared/api-client";

export function useTasks(monthKey: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const initialized = useRef(false);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await api.fetchTasks(monthKey);
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
        parsedList.map((parsed) => api.createTask(input, parsed))
      );
      await fetchTasks();
    },
    [fetchTasks]
  );

  const createNote = useCallback(
    async (input: string, noteData: object, extractedTasks: object[]) => {
      await api.createTask(input, noteData, "note");
      if (extractedTasks.length > 0) {
        await Promise.all(
          extractedTasks.map((parsed) => api.createTask(input, parsed))
        );
      }
      await fetchTasks();
    },
    [fetchTasks]
  );

  const updateTask = useCallback(
    async (id: string, fields: Partial<Pick<Task, "title" | "start_date" | "end_date" | "status" | "icon" | "icon_color">>) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)));
      try {
        const updated = await api.updateTask(id, fields);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      } catch {
        await fetchTasks();
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

  const deleteTaskFn = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await api.deleteTask(id);
      } catch {
        await fetchTasks();
      }
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
    deleteTask: deleteTaskFn,
  };
}
