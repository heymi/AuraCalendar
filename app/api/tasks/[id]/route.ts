import { NextRequest, NextResponse } from "next/server";
import { getDB, initDB } from "@/lib/db";
import { getAuthUserId } from "@/lib/auth";
import dayjs from "dayjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const body = await req.json();

  await initDB();
  const db = getDB();

  const existing = await db.execute({
    sql: "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Build SET clauses dynamically from allowed fields
  const allowed = ["title", "start_date", "end_date", "status", "icon", "icon_color", "notes"];
  const sets: string[] = [];
  const vals: (string | null)[] = [];

  for (const key of allowed) {
    if (key in body) {
      sets.push(`${key} = ?`);
      vals.push(body[key]);
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  sets.push("updated_at = ?");
  vals.push(dayjs().toISOString());

  await db.execute({
    sql: `UPDATE tasks SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
    args: [...vals, id, userId],
  });

  const result = await db.execute({
    sql: "SELECT * FROM tasks WHERE id = ?",
    args: [id],
  });
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;

  await initDB();
  const db = getDB();
  const result = await db.execute({
    sql: "DELETE FROM tasks WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
