"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 340 }}
        style={{
          background: "var(--surface-elevated)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-xl)",
        }}
        className="w-full max-w-[360px] rounded-[20px] p-8 text-center"
      >
        {/* Logo */}
        <div
          className="w-[56px] h-[56px] rounded-[14px] mx-auto mb-5 flex items-center justify-center"
          style={{ background: "var(--accent)" }}
        >
          <span className="text-white text-[24px] font-bold">A</span>
        </div>

        <h1
          style={{ color: "var(--text-primary)" }}
          className="text-[20px] font-semibold tracking-[-0.02em] mb-1.5"
        >
          AuraCalendar
        </h1>
        <p
          style={{ color: "var(--text-secondary)" }}
          className="text-[14px] mb-8"
        >
          极简任务日历
        </p>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => signIn("github", { callbackUrl: "/" })}
          style={{
            background: "var(--text-primary)",
            color: "var(--background)",
          }}
          className="w-full py-3 rounded-[12px] text-[14px] font-medium flex items-center justify-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          使用 GitHub 登录
        </motion.button>
      </motion.div>
    </div>
  );
}
