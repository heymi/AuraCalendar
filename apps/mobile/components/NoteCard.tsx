import React from "react";
import { View, Text, Pressable, StyleSheet, useColorScheme } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { Task } from "@aura/shared/types";
import { TaskIcon } from "./TaskIcon";
import { useTheme } from "../lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Mix hex toward a base (0–255) at given strength */
function mixColor(hex: string, base: number, strength: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) =>
    Math.round(c * strength + base * (1 - strength));
  return `#${mix(r).toString(16).padStart(2, "0")}${mix(g).toString(16).padStart(2, "0")}${mix(b).toString(16).padStart(2, "0")}`;
}

const SPRING_CONFIG = { stiffness: 400, damping: 25 };

interface NoteCardProps {
  note: Task;
  onPress: (note: Task) => void;
  index: number;
}

export function NoteCard({ note, onPress, index }: NoteCardProps) {
  const theme = useTheme();
  const dark = useColorScheme() === "dark";

  const pressed = useSharedValue(false);

  // Tinted card background matching TaskIcon palette logic
  const cardBg = mixColor(note.icon_color, dark ? 30 : 255, dark ? 0.08 : 0.06);
  const cardBorder = mixColor(note.icon_color, dark ? 30 : 255, dark ? 0.16 : 0.12);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(pressed.value ? 0.95 : 1, SPRING_CONFIG) },
        {
          rotateZ: withSpring(pressed.value ? "-1deg" : "0deg", SPRING_CONFIG),
        },
      ],
      shadowOpacity: withSpring(pressed.value ? 0.18 : 0.04, SPRING_CONFIG),
      shadowRadius: withSpring(pressed.value ? 16 : 4, SPRING_CONFIG),
      shadowOffset: {
        width: 0,
        height: withSpring(pressed.value ? 8 : 2, SPRING_CONFIG),
      },
    };
  });

  return (
    <AnimatedPressable
      entering={FadeIn.delay(index * 50)
        .duration(250)
        .springify()
        .damping(20)
        .stiffness(300)}
      onPressIn={() => {
        pressed.value = true;
      }}
      onPressOut={() => {
        pressed.value = false;
      }}
      onPress={() => onPress(note)}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          shadowColor: note.icon_color,
        },
        animatedStyle,
      ]}
    >
      <TaskIcon icon={note.icon} color={note.icon_color} size={28} />
      <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}>
        {note.title}
      </Text>
      {note.notes ? (
        <Text
          numberOfLines={3}
          style={[styles.preview, { color: theme.textSecondary }]}
        >
          {note.notes.replace(/[#*_\[\]]/g, "").slice(0, 100)}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
  },
});
