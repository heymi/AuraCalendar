"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, StickyNote, Trash2, Pencil, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Task } from "@/lib/db";
import EditTaskModal from "./EditTaskModal";
import dayjs from "dayjs";

interface NoteDetailModalProps {
  note: Task | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onSave: (id: string, fields: Partial<Task>) => Promise<void>;
}

const NOTE_COLOR = "#F59E0B";

type PdfMode = "phone" | "print";

function buildPdfHtml(note: Task, markdownHtml: string, mode: PdfMode) {
  const dateStr = dayjs(note.created_at).format("YYYY年M月D日 HH:mm");

  // Phone mode: A4 paper but content centered in a narrow column with large font for readability on mobile
  // Print mode: A4 paper, normal full-width layout
  const isPhone = mode === "phone";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${note.title}</title>
<style>
  @page {
    size: A4;
    margin: ${isPhone ? "24mm 15mm 20mm" : "28mm 20mm 24mm"};
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    max-width: ${isPhone ? "88%" : "none"};
    margin: ${isPhone ? "0 auto" : "0"};
    font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
    font-size: ${isPhone ? "16px" : "11pt"};
    line-height: ${isPhone ? "1.8" : "1.7"};
    color: #1d1d1f;
    -webkit-font-smoothing: antialiased;
  }
  /* Fallback header/footer for browsers that don't support @page margin boxes */
  .page-header, .page-footer {
    position: fixed;
    left: 0; right: 0;
    font-size: 7pt;
    color: #DC2626;
    font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
    text-align: center;
    letter-spacing: 0.03em;
  }
  .page-header { top: 0; padding-top: 6mm; }
  .page-footer { bottom: 0; padding-bottom: 6mm; }
  .header { margin-bottom: ${isPhone ? "24px" : "20pt"}; padding-bottom: ${isPhone ? "18px" : "14pt"}; border-bottom: 1.5px solid #e5e5ea; }
  .title { font-size: ${isPhone ? "24px" : "18pt"}; font-weight: 700; letter-spacing: -0.02em; color: #1d1d1f; margin-bottom: 4px; }
  .date { font-size: ${isPhone ? "13px" : "9pt"}; color: #8e8e93; }
  .mode-label { font-size: ${isPhone ? "10px" : "8pt"}; color: #c7c7cc; margin-top: 4px; }
  h1 { font-size: ${isPhone ? "22px" : "16pt"}; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.02em; }
  h2 { font-size: ${isPhone ? "19px" : "13pt"}; font-weight: 600; margin: 18px 0 8px; }
  h3 { font-size: ${isPhone ? "17px" : "11pt"}; font-weight: 600; margin: 14px 0 6px; }
  p { margin: 0 0 ${isPhone ? "12px" : "10px"}; }
  ul, ol { margin: 0 0 ${isPhone ? "12px" : "10px"}; padding-left: ${isPhone ? "24px" : "20px"}; }
  li { margin: ${isPhone ? "4px" : "2px"} 0; }
  li::marker { color: #c7c7cc; }
  strong { font-weight: 600; }
  em { color: #8e8e93; }
  code { font-size: 0.9em; background: #f5f5f7; padding: 1px 5px; border-radius: 4px; font-family: "SF Mono", monospace; }
  pre { background: #f5f5f7; border: 1px solid #e5e5ea; border-radius: 8px; padding: 12px 14px; margin: 0 0 10px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid #007aff; padding-left: 12px; margin: 0 0 10px; color: #8e8e93; }
  hr { border: none; height: 1px; background: #e5e5ea; margin: 16px 0; }
</style>
</head><body>
<div class="page-header">机密文件 · CONFIDENTIAL · 严禁外传</div>
<div class="page-footer">机密文件 · CONFIDENTIAL · 严禁外传</div>
<div class="header">
  <div class="title">${note.title}</div>
  <div class="date">${dateStr}</div>
  <div class="mode-label">${isPhone ? "手机阅读版" : ""}</div>
</div>
${markdownHtml}
</body></html>`;
}

export default function NoteDetailModal({ note, onClose, onDelete, onSave }: NoteDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const handleExport = useCallback((mode: PdfMode) => {
    if (!note) return;
    setShowExport(false);

    // Render markdown to HTML via a temp container
    const tempDiv = document.createElement("div");
    tempDiv.style.display = "none";
    document.body.appendChild(tempDiv);

    // Use the already-rendered markdown from the DOM
    const mdEl = document.querySelector(".note-markdown");
    const markdownHtml = mdEl?.innerHTML ?? "";
    document.body.removeChild(tempDiv);

    const html = buildPdfHtml(note, markdownHtml, mode);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.width = "210mm";
    iframe.style.height = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    // Wait for rendering then trigger print (save as PDF)
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  }, [note]);

  if (!note) return null;

  if (editing) {
    return (
      <EditTaskModal
        task={note}
        onClose={() => setEditing(false)}
        onSave={async (id, fields) => {
          await onSave(id, fields);
          setEditing(false);
        }}
      />
    );
  }

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
          className="relative w-full sm:max-w-[560px] lg:max-w-[640px] rounded-t-[20px] sm:rounded-[20px] z-10 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: NOTE_COLOR,
              }}
            >
              <StickyNote size={18} color="white" strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-0">
              <h2
                style={{ color: "var(--text-primary)" }}
                className="text-[16px] font-semibold tracking-[-0.02em] leading-tight truncate"
              >
                {note.title}
              </h2>
              <p style={{ color: "var(--text-secondary)" }} className="text-[12px] mt-0.5">
                {dayjs(note.created_at).format("YYYY年M月D日 HH:mm")}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ color: "var(--text-secondary)" }}
              className="p-1.5 -mr-1.5 rounded-[10px] hover:bg-[var(--border-subtle)] transition-colors shrink-0"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ background: "var(--border-subtle)" }} className="h-px mx-5 sm:mx-6" />

          {/* Markdown content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="note-markdown">
              <ReactMarkdown>{note.notes}</ReactMarkdown>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{ borderTop: "1px solid var(--border-subtle)" }}
            className="px-5 py-3 sm:px-6 flex items-center justify-between"
          >
            <button
              onClick={async () => {
                await onDelete(note.id);
                onClose();
              }}
              style={{ color: "var(--danger)" }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-medium hover:bg-[rgba(255,59,48,0.08)] transition-colors"
            >
              <Trash2 size={13} strokeWidth={2} />
              删除
            </button>

            <div className="flex items-center gap-1">
              {/* Export */}
              <div className="relative">
                <button
                  onClick={() => setShowExport(!showExport)}
                  style={{ color: "var(--text-secondary)" }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-medium hover:bg-[var(--border-subtle)] transition-colors"
                >
                  <Download size={13} strokeWidth={2} />
                  导出
                </button>

                <AnimatePresence>
                  {showExport && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 4 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-lg)",
                      }}
                      className="absolute bottom-full right-0 mb-2 rounded-[12px] p-1.5 w-[160px] z-10"
                    >
                      <button
                        onClick={() => handleExport("phone")}
                        style={{ color: "var(--text-primary)" }}
                        className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-medium hover:bg-[var(--border-subtle)] transition-colors"
                      >
                        手机阅读
                        <span style={{ color: "var(--text-tertiary)" }} className="block text-[11px] font-normal mt-0.5">
                          375px 窄版
                        </span>
                      </button>
                      <button
                        onClick={() => handleExport("print")}
                        style={{ color: "var(--text-primary)" }}
                        className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-medium hover:bg-[var(--border-subtle)] transition-colors"
                      >
                        打印 / A4
                        <span style={{ color: "var(--text-tertiary)" }} className="block text-[11px] font-normal mt-0.5">
                          标准纸张尺寸
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Edit */}
              <button
                onClick={() => setEditing(true)}
                style={{ color: "var(--accent)" }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-medium hover:bg-[var(--accent-muted)] transition-colors"
              >
                <Pencil size={13} strokeWidth={2} />
                编辑
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
