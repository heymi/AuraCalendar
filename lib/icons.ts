export interface CategoryStyle {
  icon: string;   // Lucide icon key
  color: string;  // hex
  label: string;
}

export const CATEGORY_MAP: Record<string, CategoryStyle> = {
  work:          { icon: "work",          color: "#3B82F6", label: "工作" },
  meeting:       { icon: "meeting",       color: "#8B5CF6", label: "会议" },
  personal:      { icon: "personal",      color: "#EC4899", label: "个人" },
  health:        { icon: "health",        color: "#10B981", label: "健康" },
  travel:        { icon: "travel",        color: "#F59E0B", label: "旅行" },
  study:         { icon: "study",         color: "#6366F1", label: "学习" },
  shopping:      { icon: "shopping",      color: "#F97316", label: "购物" },
  finance:       { icon: "finance",       color: "#14B8A6", label: "财务" },
  social:        { icon: "social",        color: "#E879F9", label: "社交" },
  food:          { icon: "food",          color: "#EF4444", label: "餐饮" },
  entertainment: { icon: "entertainment", color: "#A855F7", label: "娱乐" },
  sports:        { icon: "sports",        color: "#22C55E", label: "运动" },
  reading:       { icon: "reading",       color: "#0EA5E9", label: "阅读" },
  coding:        { icon: "coding",        color: "#64748B", label: "编程" },
  design:        { icon: "design",        color: "#F43F5E", label: "设计" },
  writing:       { icon: "writing",       color: "#7C3AED", label: "写作" },
  cleaning:      { icon: "cleaning",      color: "#84CC16", label: "清洁" },
  repair:        { icon: "repair",        color: "#78716C", label: "维修" },
  deadline:      { icon: "deadline",      color: "#DC2626", label: "截止日期" },
  music:         { icon: "music",         color: "#EC4899", label: "音乐" },
  pet:           { icon: "pet",           color: "#F97316", label: "宠物" },
  phone:         { icon: "phone",         color: "#06B6D4", label: "电话" },
  email:         { icon: "email",         color: "#8B5CF6", label: "邮件" },
  home:          { icon: "home",          color: "#F59E0B", label: "家居" },
  camera:        { icon: "camera",        color: "#EF4444", label: "拍摄" },
  gift:          { icon: "gift",          color: "#E879F9", label: "礼物" },
  medical:       { icon: "medical",       color: "#DC2626", label: "医疗" },
  car:           { icon: "car",           color: "#64748B", label: "出行" },
  star:          { icon: "star",          color: "#F59E0B", label: "重要" },
  other:         { icon: "other",         color: "#94A3B8", label: "其他" },
};

export const CATEGORIES = Object.entries(CATEGORY_MAP).map(([key, val]) => ({
  key,
  ...val,
}));

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_MAP[category] || CATEGORY_MAP.other;
}
