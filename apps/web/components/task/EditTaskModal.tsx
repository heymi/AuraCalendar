"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, StickyNote } from "lucide-react";
import { Task } from "@/lib/db";
import DatePicker from "@/components/ui/DatePicker";

interface EditTaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: (id: string, fields: Partial<Task>) => Promise<void>;
}

const NOTE_COLOR = "#F59E0B";

export default function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [startDate, setStartDate] = useState(task?.start_date ?? "");
  const [endDate, setEndDate] = useState(task?.end_date ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [saving, setSaving] = useState(false);

  if (!task) return null;

  const isNote = task.type === "note";

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isNote) {
        await onSave(task.id, {
          title: title.trim(),
          notes: notes.trim(),
        });
      } else {
        await onSave(task.id, {
          title: title.trim(),
          start_date: startDate,
          end_date: endDate || null,
          notes: notes.trim(),
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        data-popover
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(0,0,0,0.24)",
          }}
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", damping: 30, stiffness: 340 }}
          style={{
            background: "var(--surface-elevated)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-xl)",
          }}
          className={`relative w-full rounded-t-[20px] sm:rounded-[20px] p-5 sm:p-6 z-10 max-h-[90vh] flex flex-col ${isNote ? "sm:max-w-[640px]" : "sm:max-w-[420px]"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <h2
              style={{ color: "var(--text-primary)" }}
              className="text-[15px] font-semibold tracking-[-0.01em] flex items-center gap-2"
            >
              {isNote ? (
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 20, height: 20, borderRadius: 5, background: NOTE_COLOR }}
                >
                  <StickyNote size={12} color="white" strokeWidth={2} />
                </span>
              ) : null}
              {isNote ? "编辑笔记" : "编辑任务"}
            </h2>
            <button
              onClick={onClose}
              style={{ color: "var(--text-secondary)" }}
              className="p-1.5 -mr-1.5 rounded-[10px] hover:bg-[var(--border-subtle)] transition-colors"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Title */}
          <label className="block mb-4 shrink-0">
            <span style={{ color: "var(--text-secondary)" }} className="text-[12px] font-medium tracking-wide uppercase mb-1.5 block">
              标题
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              className="w-full px-3 py-2.5 rounded-[12px] text-[14px] focus:outline-none transition-colors"
            />
          </label>

          {isNote ? (
            /* Note: content textarea — flex-1 to fill available height */
            <label className="flex flex-col flex-1 min-h-0 mb-5">
              <span style={{ color: "var(--text-secondary)" }} className="text-[12px] font-medium tracking-wide uppercase mb-1.5 block shrink-0">
                内容
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="笔记内容…"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                className="w-full flex-1 min-h-[240px] px-4 py-3 rounded-[12px] text-[14px] leading-[1.7] focus:outline-none transition-colors resize-none placeholder:opacity-35"
              />
            </label>
          ) : (
            <>
              {/* Dates */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <span style={{ color: "var(--text-secondary)" }} className="text-[12px] font-medium tracking-wide uppercase mb-1.5 block">
                    开始
                  </span>
                  <DatePicker value={startDate} onChange={setStartDate} placeholder="选择开始日期" />
                </div>
                <div className="flex-1">
                  <span style={{ color: "var(--text-secondary)" }} className="text-[12px] font-medium tracking-wide uppercase mb-1.5 block">
                    结束
                  </span>
                  <DatePicker value={endDate} onChange={setEndDate} placeholder="选择结束日期" />
                </div>
              </div>

              {/* Notes */}
              <label className="block mb-5">
                <span style={{ color: "var(--text-secondary)" }} className="text-[12px] font-medium tracking-wide uppercase mb-1.5 block">
                  备注
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="添加备注…"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  className="w-full px-3 py-2.5 rounded-[12px] text-[14px] leading-[1.5] focus:outline-none transition-colors resize-none placeholder:opacity-35"
                  rows={3}
                />
              </label>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 shrink-0">
            <button
              onClick={onClose}
              style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
              className="flex-1 py-2.5 rounded-[12px] text-[14px] font-medium hover:bg-[var(--border-subtle)] transition-colors"
            >
              取消
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving || !title.trim()}
              style={{ background: "var(--accent)" }}
              className="flex-1 py-2.5 rounded-[12px] text-[14px] font-medium text-white disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />}
              保存
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
