"use client";

import { resolveEmoji } from "@/lib/icons";
import { useTheme } from "@/providers/ThemeProvider";

/** Mix a hex color toward a base at given strength (0–1) */
function mixColor(hex: string, base: number, strength: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c * strength + base * (1 - strength));
  return `#${mix(r).toString(16).padStart(2, "0")}${mix(g).toString(16).padStart(2, "0")}${mix(b).toString(16).padStart(2, "0")}`;
}

interface TaskIconProps {
  icon: string;
  color: string;
  /** Overall container size in px */
  size?: number;
  /** If true, use gray background instead of color */
  done?: boolean;
}

/**
 * iOS app-icon style: rounded colored square with emoji centered.
 * Corner radius follows Apple's ~22% convention.
 */
export default function TaskIcon({ icon, color, size = 28, done = false }: TaskIconProps) {
  const { resolved } = useTheme();
  const dark = resolved === "dark";
  const emoji = resolveEmoji(icon);
  const fontSize = Math.round(size * 0.58);
  const radius = Math.round(size / 2);
  // Light: mix with white → pastel; Dark: mix with near-black → muted
  const bg = done
    ? (dark ? "#2c2c2e" : "#E8E8ED")
    : mixColor(color, dark ? 30 : 255, dark ? 0.28 : 0.12);

  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        fontSize,
        lineHeight: 1,
      }}
    >
      <span style={done ? { opacity: 0.2 } : undefined}>{emoji}</span>
    </span>
  );
}
