import { NextRequest, NextResponse } from "next/server";
import { parseTaskInput, parseNoteInput } from "@/lib/ai";
import { getCategoryStyle } from "@/lib/icons";

export async function POST(req: NextRequest) {
  const { input, mode = "task" } = await req.json();

  if (!input) {
    return NextResponse.json({ error: "input required" }, { status: 400 });
  }

  try {
    if (mode === "note") {
      const result = await parseNoteInput(input);
      const note = {
        ...result.note,
        icon: "note",
        icon_color: "#F59E0B",
      };
      const tasks = result.tasks.map((t) => {
        const style = getCategoryStyle(t.category);
        return { ...t, icon: t.category, icon_color: style.color };
      });
      return NextResponse.json({ note, tasks });
    }

    const parsed = await parseTaskInput(input);
    const results = parsed.map((t) => {
      const style = getCategoryStyle(t.category);
      return { ...t, icon: t.category, icon_color: style.color };
    });
    return NextResponse.json(results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parse failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
