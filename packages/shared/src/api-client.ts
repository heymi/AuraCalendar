import type { Task } from "./types";

let _baseUrl = "";
let _token = "";

export function configure(baseUrl: string, token: string) {
  _baseUrl = baseUrl.replace(/\/$/, "");
  _token = token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${_baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${_token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function fetchTasks(month: string): Promise<Task[]> {
  return request<Task[]>(`/api/tasks?month=${month}`);
}

export async function createTask(
  input: string,
  parsed: object,
  type: "task" | "note" = "task"
): Promise<{ task: Task; parsed: object }> {
  return request("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ input, parsed, type }),
  });
}

export async function updateTask(
  id: string,
  fields: Partial<Pick<Task, "title" | "start_date" | "end_date" | "status" | "icon" | "icon_color" | "notes">>
): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await request(`/api/tasks/${id}`, { method: "DELETE" });
}

export async function parseInput(
  input: string,
  mode: "task" | "note" = "task"
): Promise<object> {
  return request("/api/parse", {
    method: "POST",
    body: JSON.stringify({ input, mode }),
  });
}
