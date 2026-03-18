import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { Task } from "@aura/shared/types";
import { useTheme } from "../lib/theme";

interface NoteCardProps {
  note: Task;
  onPress: (note: Task) => void;
  index: number;
}

export function NoteCard({ note, onPress, index }: NoteCardProps) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeIn.delay(index * 40).duration(200)}>
      <Pressable
        onPress={() => onPress(note)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: note.icon_color + "14",
            borderColor: note.icon_color + "30",
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <Text style={styles.emoji}>{note.icon}</Text>
        <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}>
          {note.title}
        </Text>
        {note.notes ? (
          <Text numberOfLines={3} style={[styles.preview, { color: theme.textSecondary }]}>
            {note.notes.replace(/[#*_\[\]]/g, "").slice(0, 100)}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  emoji: {
    fontSize: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
  },
});
