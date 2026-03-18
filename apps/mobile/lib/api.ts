import { configure } from "@aura/shared/api-client";
export { fetchTasks, createTask, updateTask, deleteTask, parseInput } from "@aura/shared/api-client";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:3000";

export function initApi(token: string) {
  configure(API_BASE, token);
}
