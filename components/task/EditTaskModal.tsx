"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, ChevronDown, StickyNote } from "lucide-react";
import { Task } from "@/lib/db";
import { CATEGORIES } from "@/lib/icons";
import TaskIcon from "@/components/TaskIcon";

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
  const [category, setCategory] = useState(task?.icon ?? "other");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!task) return null;

  const isNote = task.type === "note";
  const currentCat = CATEGORIES.find((c) => c.key === category);

  const handleSave = async () => {
    if (!title.trim()) return;
    if (!isNote && !startDate) return;
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
          icon: category,
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
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
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
          className="relative w-full sm:max-w-[420px] rounded-t-[20px] sm:rounded-[20px] p-5 sm:p-6 z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
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
          <label className="block mb-4">
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
            /* Note: content textarea */
            <label className="block mb-5">
              <span style={{ color: "var(--text-secondary)" }} className="text-[12px] font-medium tracking-wide uppercase mb-1.5 block">
                内容
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="笔记内容…"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                className="w-full px-3 py-2.5 rounded-[12px] text-[14px] leading-[1.6] focus:outline-none transition-colors resize-none placeholder:opacity-35"
                rows={8}
              />
            </label>
          ) : (
            <>
              {/* Dates */}
              <div className="flex gap-3 mb-4">
                <label className="flex-1">
                  <span style={{ color: "var(--text-secondary)" }} className="text-[12px] font-medium tracking-wide uppercase mb-1.5 block">
                    开始
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    className="w-full px-3 py-2.5 rounded-[12px] text-[14px] focus:outline-none transition-colors"
                  />
                </label>
                <label className="flex-1">
                  <span style={{ color: "var(--text-secondary)" }} className="text-[12px] font-medium tracking-wide uppercase mb-1.5 block">
                    结束
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    className="w-full px-3 py-2.5 rounded-[12px] text-[14px] focus:outline-none transition-colors"
                  />
                </label>
              </div>

              {/* Notes */}
              <label className="block mb-4">
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

              {/* Category */}
              <div className="mb-5">
                <span style={{ color: "var(--text-secondary)" }} className="text-[12px] font-medium tracking-wide uppercase mb-1.5 block">
                  图标
                </span>
                <button
                  type="button"
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] transition-colors"
                >
                  {currentCat && (
                    <TaskIcon icon={currentCat.key} color={currentCat.color} size={24} />
                  )}
                  <span style={{ color: "var(--text-secondary)" }} className="flex-1 text-left text-[13px]">
                    点击选择图标
                  </span>
                  <motion.span
                    animate={{ rotate: showCategoryPicker ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <ChevronDown size={16} strokeWidth={2} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {showCategoryPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-8 gap-1 pt-2.5">
                        {CATEGORIES.map((cat) => {
                          const active = category === cat.key;
                          return (
                            <button
                              key={cat.key}
                              onClick={() => {
                                setCategory(cat.key);
                                setShowCategoryPicker(false);
                              }}
                              style={{
                                background: active ? `${cat.color}14` : "transparent",
                                border: `1.5px solid ${active ? cat.color : "transparent"}`,
                              }}
                              className="flex items-center justify-center p-1.5 rounded-[10px] transition-colors hover:bg-[var(--border-subtle)]"
                              title={cat.label}
                            >
                              <TaskIcon icon={cat.key} color={cat.color} size={28} />
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2.5">
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
              disabled={saving || !title.trim() || (!isNote && !startDate)}
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
