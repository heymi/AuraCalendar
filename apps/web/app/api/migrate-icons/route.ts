import { NextResponse } from "next/server";
import { getDB, initDB } from "@/lib/db";
import { LEGACY_EMOJI_MAP } from "@/lib/icons";
import { getAuthUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  await initDB();
  const db = getDB();

  const result = await db.execute({
    sql: "SELECT id, icon FROM tasks WHERE user_id = ?",
    args: [userId],
  });

  let migrated = 0;

  for (const row of result.rows) {
    const icon = row.icon as string;
    const emoji = LEGACY_EMOJI_MAP[icon];
    if (emoji) {
      await db.execute({
        sql: "UPDATE tasks SET icon = ?, updated_at = datetime('now') WHERE id = ?",
        args: [emoji, row.id as string],
      });
      migrated++;
    }
  }

  return NextResponse.json({ migrated, total: result.rows.length });
}
