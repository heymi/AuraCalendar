"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Check, Trash2, ListChecks, StickyNote, Maximize2, Minimize2 } from "lucide-react";
import TaskIcon from "@/components/TaskIcon";

export interface ParsedResult {
  title: string;
  start_date: string;
  end_date: string | null;
  icon: string;
  icon_color: string;
}

interface NoteResult {
  title: string;
  content: string;
  icon: string;
  icon_color: string;
}

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreateBatch: (input: string, parsedList: ParsedResult[]) => Promise<void>;
  onCreateNote: (input: string, noteData: NoteResult, extractedTasks: ParsedResult[]) => Promise<void>;
}

const STORAGE_KEY = "aura-modal-draft";

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { input: string; mode: "task" | "note" };
  } catch { return null; }
}

export default function CreateTaskModal({
  open,
  onClose,
  onCreateBatch,
  onCreateNote,
}: CreateTaskModalProps) {
  const [input, setInput] = useState(() => loadDraft()?.input ?? "");
  const [mode, setMode] = useState<"task" | "note">(() => loadDraft()?.mode ?? "task");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ input, mode }));
  }, [input, mode]);
  const [parsing, setParsing] = useState(false);
  const [parsedList, setParsedList] = useState<ParsedResult[]>([]);
  const [noteResult, setNoteResult] = useState<NoteResult | null>(null);
  const [noteExtractedTasks, setNoteExtractedTasks] = useState<ParsedResult[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const clearResults = () => {
    setParsedList([]);
    setNoteResult(null);
    setNoteExtractedTasks([]);
  };

  const handleParse = async () => {
    if (!input.trim()) return;
    setParsing(true);
    setError("");
    clearResults();
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "解析失败");

      if (mode === "note") {
        if (!data.note) throw new Error("未解析到笔记");
        setNoteResult(data.note);
        setNoteExtractedTasks(data.tasks || []);
      } else {
        if (!Array.isArray(data) || data.length === 0) throw new Error("未解析到任务");
        // Task mode: create directly without confirmation
        await onCreateBatch(input.trim(), data);
        setInput("");
        clearResults();
        onClose();
        return;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "解析失败");
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    setCreating(true);
    try {
      if (mode === "note" && noteResult) {
        await onCreateNote(input.trim(), noteResult, noteExtractedTasks);
      } else if (parsedList.length > 0) {
        await onCreateBatch(input.trim(), parsedList);
      }
      setInput("");
      clearResults();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setInput("");
    clearResults();
    setError("");
    onClose();
  };

  const hasParsed = parsedList.length > 0 || noteResult !== null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            className="absolute inset-0"
            style={{
              background: "rgba(0,0,0,0.22)",
            }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            style={{
              background: "var(--surface-elevated)",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-xl)",
            }}
            className="relative w-full sm:max-w-[420px] rounded-t-[20px] sm:rounded-[20px] p-5 sm:p-6 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2
                style={{ color: "var(--text-primary)" }}
                className="text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2"
              >
                <Sparkles size={16} style={{ color: "var(--accent)" }} strokeWidth={2} />
                {mode === "task" ? "新建任务" : "新建笔记"}
              </h2>
              <button
                onClick={handleClose}
                style={{ color: "var(--text-secondary)" }}
                className="p-1.5 -mr-1.5 rounded-[10px] hover:bg-[var(--border-subtle)] transition-colors"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Mode toggle */}
            <div
              style={{
                background: "var(--background)",
                border: "1px solid var(--border-subtle)",
              }}
              className="flex rounded-[10px] p-0.5 mb-3"
            >
              {([
                { key: "task" as const, label: "任务", Icon: ListChecks },
                { key: "note" as const, label: "笔记", Icon: StickyNote },
              ]).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setMode(key);
                    clearResults();
                    setError("");
                  }}
                  style={{
                    background: mode === key ? "var(--surface)" : "transparent",
                    color: mode === key ? "var(--text-primary)" : "var(--text-secondary)",
                    boxShadow: mode === key ? "var(--shadow-sm)" : "none",
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] text-[13px] font-medium transition-all"
                >
                  <Icon size={14} strokeWidth={2} />
                  {label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="relative mb-3">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (hasParsed) clearResults();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleParse();
                  }
                }}
                placeholder={
                  mode === "task"
                    ? "描述任务，可一次输入多条\n例如：明天开评审会，下周五提交报告"
                    : "随手记录想法、灵感、总结…\nAI 会帮你整理排版并提取任务"
                }
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                className="w-full p-3.5 rounded-[14px] text-[14px] leading-[1.5] resize-none focus:outline-none transition-colors placeholder:opacity-40"
                rows={mode === "note" ? 6 : 3}
                autoFocus
              />
              {mode === "note" && (
                <button
                  onClick={() => setFullscreen(true)}
                  style={{ color: "var(--text-tertiary)" }}
                  className="absolute top-2.5 right-2.5 p-1 rounded-[6px] hover:bg-[var(--border-subtle)] transition-colors"
                  title="全屏编辑"
                >
                  <Maximize2 size={13} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Parse button */}
            {!hasParsed && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleParse}
                disabled={!input.trim() || parsing}
                style={{ background: "var(--accent)" }}
                className="w-full py-2.5 rounded-[12px] font-medium text-[14px] text-white disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {parsing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    AI 解析中…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} strokeWidth={2} />
                    {mode === "task" ? "AI 智能解析" : "AI 智能整理"}
                  </>
                )}
              </motion.button>
            )}

            {error && (
              <p style={{ color: "var(--danger)" }} className="text-[13px] mt-2 text-center">
                {error}
              </p>
            )}

            {/* Parsed list */}
            <AnimatePresence>
              {hasParsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 mb-3 max-h-[200px] overflow-y-auto">
                    {/* Note preview */}
                    {noteResult && (
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border-subtle)",
                        }}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-[12px]"
                      >
                        <StickyNote size={20} style={{ color: noteResult.icon_color, marginTop: 2 }} strokeWidth={2} />
                        <div className="flex-1 min-w-0">
                          <p
                            style={{ color: "var(--text-primary)" }}
                            className="text-[13px] font-medium leading-tight tracking-[-0.01em]"
                          >
                            {noteResult.title}
                          </p>
                          <p
                            style={{ color: "var(--text-secondary)" }}
                            className="text-[11px] mt-0.5 line-clamp-2"
                          >
                            {noteResult.content.replace(/[#*_`>\-]/g, "").slice(0, 100)}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Extracted tasks from note */}
                    {noteExtractedTasks.length > 0 && (
                      <p style={{ color: "var(--text-secondary)" }} className="text-[11px] px-1 pt-1">
                        提取的任务
                      </p>
                    )}
                    {noteExtractedTasks.map((item, i) => (
                      <motion.div
                        key={`note-task-${i}`}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (i + 1) * 0.04, type: "spring", stiffness: 400, damping: 30 }}
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border-subtle)",
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[12px]"
                      >
                        <TaskIcon icon={item.icon} color={item.icon_color} size={28} />
                        <div className="flex-1 min-w-0">
                          <p style={{ color: "var(--text-primary)" }} className="text-[13px] font-medium leading-tight tracking-[-0.01em]">
                            {item.title}
                          </p>
                          <p style={{ color: "var(--text-secondary)" }} className="text-[11px] mt-0.5">
                            {item.start_date ? item.start_date : "inbox"}
                            {item.end_date && item.end_date !== item.start_date ? ` → ${item.end_date}` : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => setNoteExtractedTasks((p) => p.filter((_, idx) => idx !== i))}
                          style={{ color: "var(--text-tertiary)" }}
                          className="p-1 rounded-[8px] hover:bg-[var(--border-subtle)] transition-colors shrink-0"
                        >
                          <Trash2 size={12} strokeWidth={2} />
                        </button>
                      </motion.div>
                    ))}

                    {/* Task mode parsed list */}
                    {parsedList.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 30 }}
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border-subtle)",
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[12px]"
                      >
                        <TaskIcon icon={item.icon} color={item.icon_color} size={28} />
                        <div className="flex-1 min-w-0">
                          <p
                            style={{ color: "var(--text-primary)" }}
                            className="text-[13px] font-medium leading-tight tracking-[-0.01em]"
                          >
                            {item.title}
                          </p>
                          <p style={{ color: "var(--text-secondary)" }} className="text-[11px] mt-0.5">
                            {item.start_date ? item.start_date : "inbox"}
                            {item.end_date && item.end_date !== item.start_date
                              ? ` → ${item.end_date}`
                              : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => setParsedList((p) => p.filter((_, idx) => idx !== i))}
                          style={{ color: "var(--text-tertiary)" }}
                          className="p-1 rounded-[8px] hover:bg-[var(--border-subtle)] transition-colors shrink-0"
                        >
                          <Trash2 size={12} strokeWidth={2} />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={clearResults}
                      style={{
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                      className="flex-1 py-2.5 rounded-[12px] text-[14px] font-medium hover:bg-[var(--border-subtle)] transition-colors"
                    >
                      重新解析
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleConfirm}
                      disabled={creating}
                      style={{ background: "var(--accent)" }}
                      className="flex-1 py-2.5 rounded-[12px] text-[14px] font-medium text-white disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {creating ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} strokeWidth={2.5} />
                      )}
                      {mode === "note"
                        ? `创建笔记${noteExtractedTasks.length > 0 ? ` + ${noteExtractedTasks.length} 条` : ""}`
                        : `创建 ${parsedList.length} 条`}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Fullscreen note editor */}
          <AnimatePresence>
            {fullscreen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                  }}
                  onClick={() => setFullscreen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ type: "spring", damping: 30, stiffness: 340 }}
                  style={{
                    background: "var(--surface-elevated)",
                    backdropFilter: "blur(28px) saturate(180%)",
                    WebkitBackdropFilter: "blur(28px) saturate(180%)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-xl)",
                  }}
                  className="relative w-full max-w-[680px] h-[80vh] rounded-[20px] z-10 flex flex-col"
                >
                  <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <h2
                      style={{ color: "var(--text-primary)" }}
                      className="text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2"
                    >
                      <StickyNote size={16} style={{ color: "#F59E0B" }} strokeWidth={2} />
                      笔记
                    </h2>
                    <button
                      onClick={() => setFullscreen(false)}
                      style={{ color: "var(--text-secondary)" }}
                      className="p-1.5 -mr-1.5 rounded-[10px] hover:bg-[var(--border-subtle)] transition-colors"
                    >
                      <Minimize2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                  <div className="flex-1 px-6 pb-3 min-h-0">
                    <textarea
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        if (hasParsed) clearResults();
                      }}
                      placeholder="随手记录想法、灵感、总结…"
                      style={{
                        background: "var(--background)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                      className="w-full h-full px-4 py-3 rounded-[14px] text-[14px] leading-[1.7] resize-none focus:outline-none transition-colors placeholder:opacity-35"
                      autoFocus
                    />
                  </div>
                  <div className="px-6 pb-5 pt-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setFullscreen(false);
                        if (hasParsed) {
                          handleConfirm();
                        } else {
                          handleParse();
                        }
                      }}
                      disabled={!input.trim() || parsing || creating}
                      style={{ background: "var(--accent)" }}
                      className="w-full py-2.5 rounded-[12px] text-[14px] font-medium text-white disabled:opacity-30 flex items-center justify-center gap-1.5"
                    >
                      {parsing ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          AI 解析中…
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} strokeWidth={2} />
                          AI 智能整理
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
