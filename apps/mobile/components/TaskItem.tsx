import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { Task } from "@aura/shared/types";
import { formatDateRange } from "@aura/shared/utils";
import { TaskIcon } from "./TaskIcon";
import { useTheme } from "../lib/theme";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, status: string) => void;
  onPress: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onPress, onDelete }: TaskItemProps) {
  const theme = useTheme();
  const isCompleted = task.status === "completed" && task.type === "task";

  const handleToggle = () => {
    const next = isCompleted ? "pending" : "completed";
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(task.id, next);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={Layout.springify().damping(28).stiffness(350)}
    >
      <Pressable
        onPress={() => onPress(task)}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderSubtle,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Pressable onPress={handleToggle} hitSlop={8} style={styles.checkArea}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: isCompleted ? theme.success : theme.textTertiary,
                backgroundColor: isCompleted ? theme.success : "transparent",
              },
            ]}
          >
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Pressable>

        <TaskIcon icon={task.icon} color={task.icon_color} size={36} />

        <View style={styles.content}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: isCompleted ? theme.textSecondary : theme.text,
                textDecorationLine: isCompleted ? "line-through" : "none",
              },
            ]}
          >
            {task.title}
          </Text>
          {task.start_date ? (
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {formatDateRange(task.start_date, task.end_date)}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkArea: {
    padding: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
  date: {
    fontSize: 13,
  },
});
