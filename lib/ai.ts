import dayjs from "dayjs";
import { COLOR_PALETTE } from "./icons";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

export interface ParsedTask {
  title: string;
  start_date: string;
  end_date: string | null;
  emoji: string;
  color: string;
}

export interface ParsedNote {
  title: string;
  content: string;
  emoji: string;
  color: string;
}

export interface ParsedNoteResult {
  note: ParsedNote;
  tasks: ParsedTask[];
}

const colorList = COLOR_PALETTE.join(", ");

export async function parseTaskInput(input: string): Promise<ParsedTask[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set");
  }

  const today = dayjs().format("YYYY-MM-DD");

  const systemPrompt = `你是一个任务解析助手。根据用户的自然语言输入，提取一条或多条任务信息。

今天是 ${today}（${dayjs().format("dddd")}）。

用户可能在一句话里描述多件事，请分别拆分成独立任务。

每条任务提取：
1. title: 精炼的任务标题（简短清晰）
2. start_date: 开始日期，格式 YYYY-MM-DD
3. end_date: 结束日期，格式 YYYY-MM-DD。如果是单天任务则为 null
4. emoji: 为任务选一个最合适的 emoji（单个 emoji 字符）
5. color: 从以下背景色中选一个最搭配的：${colorList}

规则：
- 如果没有提到任何具体日期（今天、明天、下周X、X号等），start_date 设为 null（表示收件箱任务）
- "下周X" 表示下一个周X
- "X号" 表示本月X号
- "明天" 表示 ${dayjs().add(1, "day").format("YYYY-MM-DD")}
- 日期范围如"20号到25号"应设置 start_date 和 end_date

只返回 JSON 数组，不要其他内容：
[{"title": "...", "start_date": "YYYY-MM-DD or null", "end_date": "YYYY-MM-DD or null", "emoji": "💼", "color": "#3B82F6"}, ...]`;

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      temperature: 0.1,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) throw new Error("Empty response from DeepSeek");

  // Extract JSON array or object from potential markdown code blocks
  const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Failed to parse AI response: ${content}`);

  const parsed: ParsedTask[] = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI returned empty task list");
  }

  const validColors = new Set<string>(COLOR_PALETTE);

  return parsed.map((t) => ({
    ...t,
    emoji: t.emoji || "📌",
    color: validColors.has(t.color) ? t.color : COLOR_PALETTE[0],
  }));
}

export async function parseNoteInput(input: string): Promise<ParsedNoteResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set");
  }

  const today = dayjs().format("YYYY-MM-DD");

  const systemPrompt = `你是一个智能笔记助手。用户会输入一段随手记录，你需要：

1. 将原文整理排版为优雅的 markdown（使用标题、列表、加粗重点等）
2. 自动生成一个简短标题（≤20字，概括核心内容）
3. 提取文中隐含的行动项/待办事项作为 tasks 数组（可以为空）

今天是 ${today}（${dayjs().format("dddd")}）。

每条 task 提取：
- title: 精炼的任务标题
- start_date: 格式 YYYY-MM-DD，如果没提到具体日期则为 null
- end_date: 格式 YYYY-MM-DD 或 null
- emoji: 为任务选一个最合适的 emoji（单个 emoji 字符）
- color: 从以下背景色中选一个最搭配的：${colorList}

只返回 JSON 对象，不要其他内容：
{
  "note": {
    "title": "简短标题",
    "content": "排版后的 markdown 内容"
  },
  "tasks": [
    {"title": "...", "start_date": "YYYY-MM-DD", "end_date": null, "emoji": "💼", "color": "#3B82F6"}
  ]
}`;

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      temperature: 0.1,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) throw new Error("Empty response from DeepSeek");

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Failed to parse AI response: ${content}`);

  const parsed: ParsedNoteResult = JSON.parse(jsonMatch[0]);

  if (!parsed.note?.title || !parsed.note?.content) {
    throw new Error("AI returned invalid note format");
  }

  const validColors = new Set<string>(COLOR_PALETTE);

  // Note itself gets fixed emoji/color (handled by caller), but normalize tasks
  parsed.tasks = (parsed.tasks || []).map((t) => ({
    ...t,
    emoji: t.emoji || "📌",
    color: validColors.has(t.color) ? t.color : COLOR_PALETTE[0],
  }));

  return parsed;
}
