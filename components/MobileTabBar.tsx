"use client";

import { motion } from "framer-motion";
import { CalendarDays, ListChecks } from "lucide-react";

export type MobileTab = "calendar" | "list";

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS = [
  { key: "calendar" as const, label: "日历", Icon: CalendarDays },
  { key: "list" as const, label: "清单", Icon: ListChecks },
];

export default function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe"
      style={{
        background: "var(--surface-elevated)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-around h-[50px]">
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.6}
                style={{
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  transition: "color 0.2s",
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  transition: "color 0.2s",
                }}
              >
                {label}
              </span>
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                  style={{ background: "var(--accent)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
