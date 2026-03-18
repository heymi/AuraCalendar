"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ListModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ListModal({ title, open, onClose, children }: ListModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.24)" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-xl, 0 20px 60px rgba(0,0,0,0.15))",
            }}
            className="relative z-10 w-[90vw] max-w-[640px] max-h-[80vh] rounded-[20px] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2
                style={{ color: "var(--text-primary)" }}
                className="text-[14px] font-semibold tracking-[-0.01em]"
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full transition-colors cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Content */}
            <div
              className="flex-1 overflow-y-auto px-5 pb-5"
              style={{ scrollbarWidth: "none" }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
