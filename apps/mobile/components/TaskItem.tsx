import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { Task } from "@aura/shared/types";
import { formatDateRange } from "@aura/shared/utils";
import { TaskIcon } from "./TaskIcon";
import { useTheme, type Theme } from "../lib/theme";

const STATUS_CYCLE: Record<string, string> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

interface StatusConfig {
  icon: string;
  borderColor: (t: Theme) => string;
  bgColor: (t: Theme) => string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    icon: "",
    borderColor: (t) => t.textTertiary,
    bgColor: () => "transparent",
  },
  in_progress: {
    icon: "◐",
    borderColor: (t) => t.warning,
    bgColor: (t) => t.warning + "20",
  },
  completed: {
    icon: "✓",
    borderColor: (t) => t.success,
    bgColor: (t) => t.success,
  },
};

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, status: string) => void;
  onPress: (task: Task) => void;
  onDelete: (id: string) => void;
}

const SPRING_CONFIG = { stiffness: 400, damping: 30 };
const CHECKBOX_SPRING = { stiffness: 350, damping: 18 };

export function TaskItem({ task, onToggle, onPress, onDelete }: TaskItemProps) {
  const theme = useTheme();
  const status = task.type === "task" ? (task.status || "pending") : "pending";
  const isCompleted = status === "completed";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  const scale = useSharedValue(1);
  const checkboxScale = useSharedValue(1);
  const rowCelebrationScale = useSharedValue(1);
  const prevStatusRef = useRef(status);

  // Animated status change: spring bounce on checkbox when status changes
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    if (prevStatus !== status) {
      // Checkbox bounce: 0.7 → 1.1 → 1.0
      checkboxScale.value = withSequence(
        withTiming(0.7, { duration: 60 }),
        withSpring(1.1, CHECKBOX_SPRING),
        withSpring(1.0, { stiffness: 300, damping: 22 }),
      );

      // Celebration pulse on entire row when transitioning TO completed
      if (status === "completed") {
        rowCelebrationScale.value = withSequence(
          withSpring(1.02, { stiffness: 400, damping: 20 }),
          withSpring(1.0, { stiffness: 300, damping: 25 }),
        );
      }

      prevStatusRef.current = status;
    }
  }, [status, checkboxScale, rowCelebrationScale]);

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * rowCelebrationScale.value },
    ],
  }));

  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  const handleToggle = () => {
    const next = STATUS_CYCLE[status] || "pending";
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(task.id, next);
  };

  const handleCheckboxPressIn = () => {
    checkboxScale.value = withSpring(0.85, SPRING_CONFIG);
  };

  const handleCheckboxPressOut = () => {
    checkboxScale.value = withSpring(1, SPRING_CONFIG);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(250).withInitialValues({
        opacity: 0,
        transform: [{ translateX: -8 }],
      })}
      exiting={FadeOut.duration(150)}
      layout={Layout.springify().damping(28).stiffness(350)}
      style={rowAnimatedStyle}
    >
      <Pressable
        onPress={() => onPress(task)}
        onPressIn={() => { scale.value = withSpring(0.96, SPRING_CONFIG); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING_CONFIG); }}
        style={[
          styles.container,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderSubtle,
          },
        ]}
      >
        <Pressable
          onPress={handleToggle}
          onPressIn={handleCheckboxPressIn}
          onPressOut={handleCheckboxPressOut}
          hitSlop={8}
          style={styles.checkArea}
        >
          <Animated.View
            style={[
              styles.checkbox,
              {
                borderColor: config.borderColor(theme),
                backgroundColor: config.bgColor(theme),
              },
              checkboxAnimatedStyle,
            ]}
          >
            {config.icon ? (
              <Text
                style={[
                  styles.checkmark,
                  {
                    color: isCompleted ? "#fff" : config.borderColor(theme),
                    fontSize: status === "in_progress" ? 14 : 12,
                  },
                ]}
              >
                {config.icon}
              </Text>
            ) : null}
          </Animated.View>
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
          {task.notes ? (
            <Text
              numberOfLines={1}
              style={[styles.notesPreview, { color: theme.textTertiary }]}
            >
              {task.notes}
            </Text>
          ) : task.start_date ? (
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {formatDateRange(task.start_date, task.end_date)}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => onDelete(task.id)}
          hitSlop={8}
          style={styles.actionBtn}
        >
          <Text style={[styles.actionIcon, { color: theme.textTertiary }]}>
            ✕
          </Text>
        </Pressable>
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
  notesPreview: {
    fontSize: 11,
  },
  date: {
    fontSize: 13,
  },
  actionBtn: {
    padding: 6,
  },
  actionIcon: {
    fontSize: 13,
    fontWeight: "500",
  },
});
