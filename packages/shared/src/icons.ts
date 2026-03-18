/** Legacy category key → emoji mapping (for migrating old data) */
export const LEGACY_EMOJI_MAP: Record<string, string> = {
  work: "💼",
  meeting: "🤝",
  personal: "👤",
  health: "❤️",
  travel: "✈️",
  study: "🎓",
  shopping: "🛍️",
  finance: "💰",
  social: "🍷",
  food: "🍽️",
  entertainment: "🎬",
  sports: "💪",
  reading: "📖",
  coding: "💻",
  design: "🎨",
  writing: "✍️",
  cleaning: "✨",
  repair: "🔧",
  deadline: "⏰",
  music: "🎵",
  pet: "🐾",
  phone: "📱",
  email: "✉️",
  home: "🏠",
  camera: "📷",
  gift: "🎁",
  medical: "🏥",
  car: "🚗",
  star: "⭐",
  other: "📌",
  note: "📝",
};

/** 12 preset background colors for AI to choose from */
export const COLOR_PALETTE = [
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#10B981", // emerald
  "#F59E0B", // amber
  "#6366F1", // indigo
  "#F97316", // orange
  "#14B8A6", // teal
  "#EF4444", // red
  "#22C55E", // green
  "#64748B", // slate
  "#A855F7", // purple
] as const;

/**
 * If `icon` is a legacy category key, return the mapped emoji.
 * Otherwise return it as-is (already an emoji).
 */
export function resolveEmoji(icon: string): string {
  return LEGACY_EMOJI_MAP[icon] || icon || "📌";
}
