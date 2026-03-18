import { NextRequest, NextResponse } from "next/server";
import { getDB, initDB, Task } from "@/lib/db";
import { parseTaskInput } from "@/lib/ai";
import { getAuthUserId } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const month = req.nextUrl.searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "month parameter required" }, { status: 400 });
  }

  await initDB();
  const db = getDB();
  const startOfMonth = `${month}-01`;
  const endOfMonth = dayjs(startOfMonth).endOf("month").format("YYYY-MM-DD");

  const result = await db.execute({
    sql: `SELECT * FROM tasks
          WHERE user_id = ? AND (
            start_date = ''
            OR (start_date <= ? AND (end_date >= ? OR (end_date IS NULL AND start_date >= ?)))
          )
          ORDER BY start_date ASC`,
    args: [userId, endOfMonth, startOfMonth, startOfMonth],
  });

  return NextResponse.json(result.rows as unknown as Task[]);
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (userId instanceof NextResponse) return userId;

  const body = await req.json();
  const { input, parsed: manualParsed, type = "task" } = body;

  let parsed;
  if (manualParsed) {
    parsed = manualParsed;
  } else if (input) {
    parsed = await parseTaskInput(input);
  } else {
    return NextResponse.json({ error: "input or parsed required" }, { status: 400 });
  }

  const isNote = type === "note";

  const task = {
    id: uuidv4(),
    title: parsed.title,
    original_input: input || null,
    icon: isNote ? "📝" : (parsed.icon || parsed.emoji || "📌"),
    icon_color: isNote ? "#F59E0B" : (parsed.icon_color || parsed.color || "#94A3B8"),
    start_date: parsed.start_date || "",
    end_date: parsed.end_date || null,
    notes: isNote ? (parsed.content || "") : "",
    status: isNote ? "completed" : "pending",
    type: isNote ? "note" : "task",
    user_id: userId,
    created_at: dayjs().toISOString(),
    updated_at: dayjs().toISOString(),
  };

  await initDB();
  const db = getDB();
  await db.execute({
    sql: `INSERT INTO tasks (id, title, original_input, icon, icon_color, start_date, end_date, notes, status, type, user_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      task.id, task.title, task.original_input, task.icon, task.icon_color,
      task.start_date, task.end_date, task.notes, task.status, task.type, task.user_id,
      task.created_at, task.updated_at,
    ],
  });

  return NextResponse.json({ task, parsed });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
