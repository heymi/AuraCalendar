"use client";

import { motion } from "framer-motion";
import dayjs from "dayjs";
import { Task } from "@/lib/db";

interface NoteCardProps {
  note: Task;
  onClick: () => void;
  compact?: boolean;
}

export default function NoteCard({ note, onClick, compact = false }: NoteCardProps) {
  const preview = note.notes
    ? note.notes.replace(/[#*_`>\-\[\]]/g, "").trim()
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      whileHover={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
      }}
      className={`relative rounded-[16px] cursor-pointer transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden ${compact ? "px-3 pt-3 pb-4 min-h-[96px]" : "px-4 pt-4 pb-5 min-h-[120px]"}`}
    >
      <h3
        style={{ color: "var(--text-primary)" }}
        className={`font-semibold leading-[1.3] tracking-[-0.01em] mb-0.5 line-clamp-1 ${compact ? "text-[11px]" : "text-[12px]"}`}
      >
        {note.title}
      </h3>
      <p
        style={{ color: "var(--text-tertiary)" }}
        className={`${compact ? "text-[8px] mb-1.5" : "text-[9px] mb-2"}`}
      >
        {dayjs(note.created_at).format("M月D日 HH:mm")}
      </p>
      {preview && (
        <p
          style={{ color: "var(--text-secondary)" }}
          className={`font-normal leading-[1.6] ${compact ? "text-[9px] line-clamp-2" : "text-[10px] line-clamp-3"}`}
        >
          {preview}
        </p>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
        style={{ background: "linear-gradient(transparent, var(--surface))" }}
      />
    </motion.div>
  );
}
