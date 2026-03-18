"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sun, Moon, Monitor, LogOut, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { useSession, signOut } from "next-auth/react";

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const monthNames = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];

export default function CalendarHeader({
  year,
  month,
  onPrev,
  onNext,
  onToday,
  collapsed,
  onToggleCollapse,
}: CalendarHeaderProps) {
  const { mode, resolved, setMode } = useTheme();
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const cycleMode = () => {
    if (mode === "system") setMode("light");
    else if (mode === "light") setMode("dark");
    else setMode("system");
  };

  const ThemeIcon =
    mode === "system" ? Monitor : resolved === "dark" ? Moon : Sun;

  const themeLabel =
    mode === "system" ? "跟随系统" : mode === "dark" ? "深色" : "浅色";

  return (
    <div className="flex items-center justify-between px-0.5 mb-4 sm:mb-5">
      <motion.h1
        key={`${year}-${month}`}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{ color: "var(--text-primary)" }}
        className="text-xl sm:text-2xl font-semibold tracking-tight"
      >
        {monthNames[month - 1]}
        <span
          style={{ color: "var(--text-secondary)" }}
          className="font-normal text-base sm:text-xl ml-1.5"
        >
          {year}
        </span>
      </motion.h1>

      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Today button */}
        <button
          onClick={onToday}
          style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
          className="px-2.5 py-1.5 text-xs sm:text-sm rounded-xl font-medium hover:opacity-80 transition-opacity"
        >
          今天
        </button>

        {/* Collapse toggle — mobile only */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            style={{ color: collapsed ? "var(--accent)" : "var(--text-secondary)" }}
            className="p-1.5 rounded-xl hover:opacity-70 transition-opacity"
            title={collapsed ? "展开全部" : "折叠非本周"}
          >
            {collapsed ? <ChevronsUpDown size={16} strokeWidth={2} /> : <ChevronsDownUp size={16} strokeWidth={2} />}
          </button>
        )}

        {/* Month nav */}
        {[onPrev, onNext].map((fn, i) => (
          <button
            key={i}
            onClick={fn}
            style={{ color: "var(--text-secondary)" }}
            className="p-1.5 sm:p-2 rounded-xl hover:opacity-70 transition-opacity"
          >
            {i === 0 ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
          </button>
        ))}

        {/* Divider */}
        <div
          className="w-px h-4 mx-0.5 sm:mx-1 rounded-full"
          style={{ background: "var(--border)" }}
        />

        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={cycleMode}
          title={themeLabel}
          style={{ color: "var(--text-secondary)" }}
          className="p-1.5 sm:p-2 rounded-xl hover:opacity-70 transition-opacity relative"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mode}
              initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
              transition={{ duration: 0.18 }}
              className="block"
            >
              <ThemeIcon size={16} />
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* User avatar */}
        {session?.user && (
          <div className="relative ml-0.5 sm:ml-1">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-[28px] h-[28px] rounded-full overflow-hidden ring-1.5 ring-[var(--border)] hover:ring-[var(--accent)] transition-all"
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-[12px] font-semibold"
                  style={{ background: "var(--accent)", color: "white" }}
                >
                  {session.user.name?.[0] ?? "U"}
                </div>
              )}
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      background: "var(--surface-elevated)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-lg)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                    }}
                    className="absolute right-0 top-[36px] z-50 rounded-[12px] p-1.5 min-w-[160px]"
                  >
                    <div
                      className="px-3 py-2 mb-1"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <p
                        style={{ color: "var(--text-primary)" }}
                        className="text-[13px] font-medium truncate"
                      >
                        {session.user.name}
                      </p>
                      <p
                        style={{ color: "var(--text-tertiary)" }}
                        className="text-[11px] truncate"
                      >
                        {session.user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      style={{ color: "var(--danger)" }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13px] font-medium hover:bg-[var(--border-subtle)] transition-colors"
                    >
                      <LogOut size={14} />
                      退出登录
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
