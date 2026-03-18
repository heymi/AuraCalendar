import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getDB(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

/** Run once at startup to ensure schema exists */
export async function initDB() {
  const db = getDB();
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        original_input TEXT,
        icon TEXT NOT NULL,
        icon_color TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        user_id TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      "CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id)",
    ],
    "write"
  );

  // Migration: add type column
  try {
    await db.execute("ALTER TABLE tasks ADD COLUMN type TEXT DEFAULT 'task'");
  } catch {
    // Column already exists
  }
}

// Re-export Task type from shared package
export type { Task } from "@aura/shared/types";
