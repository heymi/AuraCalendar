"use client";

import { type LucideProps } from "lucide-react";
import {
  Briefcase,
  Users,
  User,
  Heart,
  Plane,
  GraduationCap,
  ShoppingBag,
  Wallet,
  Wine,
  UtensilsCrossed,
  Film,
  Dumbbell,
  BookOpen,
  Code,
  Palette,
  PenLine,
  Sparkles,
  Wrench,
  AlarmClock,
  Tag,
  StickyNote,
  Music,
  PawPrint,
  Phone,
  Mail,
  Home,
  Camera,
  Gift,
  Cross,
  Car,
  Star,
} from "lucide-react";
import { type ComponentType } from "react";

const ICON_COMPONENTS: Record<string, ComponentType<LucideProps>> = {
  work: Briefcase,
  meeting: Users,
  personal: User,
  health: Heart,
  travel: Plane,
  study: GraduationCap,
  shopping: ShoppingBag,
  finance: Wallet,
  social: Wine,
  food: UtensilsCrossed,
  entertainment: Film,
  sports: Dumbbell,
  reading: BookOpen,
  coding: Code,
  design: Palette,
  writing: PenLine,
  cleaning: Sparkles,
  repair: Wrench,
  deadline: AlarmClock,
  music: Music,
  pet: PawPrint,
  phone: Phone,
  email: Mail,
  home: Home,
  camera: Camera,
  gift: Gift,
  medical: Cross,
  car: Car,
  star: Star,
  other: Tag,
  note: StickyNote,
};

interface TaskIconProps {
  icon: string;
  color: string;
  /** Overall container size in px */
  size?: number;
}

/**
 * iOS app-icon style: rounded colored square with white filled icon.
 * Corner radius follows Apple's ~22% convention.
 */
export default function TaskIcon({ icon, color, size = 28 }: TaskIconProps) {
  const Icon = ICON_COMPONENTS[icon];
  const iconSize = Math.round(size * 0.54);
  const radius = Math.round(size * 0.22);

  if (!Icon) {
    return (
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: color,
          fontSize: iconSize,
          lineHeight: 1,
        }}
      >
        <span style={{ filter: "brightness(10)" }}>{icon}</span>
      </span>
    );
  }

  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
      }}
    >
      <Icon
        size={iconSize}
        color="white"
        fill="white"
        strokeWidth={0}
      />
    </span>
  );
}
