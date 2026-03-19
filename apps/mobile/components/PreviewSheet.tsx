import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { resolveEmoji } from "@aura/shared/icons";
import { TaskIcon } from "./TaskIcon";
import { useTheme } from "../lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ParsedTask {
  title: string;
  icon: string;
  icon_color: string;
  start_date?: string;
  end_date?: string;
}

interface ParsedNote {
  note: {
    title: string;
    icon: string;
    icon_color: string;
    notes: string;
  };
  tasks: ParsedTask[];
}

interface PreviewSheetProps {
  mode: "task" | "note";
  parsedTasks: ParsedTask[] | null;
  parsedNote: ParsedNote | null;
  onConfirm: () => Promise<void>;
  onReparse: () => void;
  onClose: () => void;
}

function AnimatedPreviewCard({
  index,
  children,
  style,
}: {
  index: number;
  children: React.ReactNode;
  style: object[];
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 80;
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      opacity.value = withSpring(1, { damping: 20, stiffness: 300 });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[...style, animatedStyle]}
      exiting={FadeOut.duration(200).withInitialValues({ transform: [{ scale: 1 }] })}
    >
      {children}
    </Animated.View>
  );
}

export function PreviewSheet({
  mode,
  parsedTasks,
  parsedNote,
  onConfirm,
  onReparse,
  onClose,
}: PreviewSheetProps) {
  const theme = useTheme();
  const [creating, setCreating] = useState(false);
  const [localTasks, setLocalTasks] = useState(parsedTasks);

  const confirmScale = useSharedValue(1);
  const confirmBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmScale.value }],
  }));

  const removeTask = useCallback((index: number) => {
    setLocalTasks((prev) => {
      if (!prev) return prev;
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        onReparse();
        return prev;
      }
      return next;
    });
  }, [onReparse]);

  const handleConfirm = async () => {
    if (creating) return;

    confirmScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    setTimeout(() => {
      confirmScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }, 100);

    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onConfirm();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      confirmScale.value = withSequence(
        withSpring(1.05, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 14, stiffness: 300 }),
      );
      setTimeout(() => onClose(), 250);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCreating(false);
    }
  };

  const displayTasks = localTasks ?? parsedTasks;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {mode === "task" ? "解析结果" : "笔记预览"}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={[styles.closeIcon, { color: theme.textSecondary }]}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.previewSection} showsVerticalScrollIndicator={false}>
          {displayTasks?.map((task, i) => (
            <AnimatedPreviewCard
              key={`${task.title}-${i}`}
              index={i}
              style={[
                styles.previewCard,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.borderSubtle,
                },
              ]}
            >
              <View style={styles.previewRow}>
                <TaskIcon icon={task.icon} color={task.icon_color} size={36} />
                <View style={styles.previewInfo}>
                  <Text
                    numberOfLines={2}
                    style={[styles.previewTitle, { color: theme.text }]}
                  >
                    {task.title}
                  </Text>
                  {task.start_date && (
                    <Text style={[styles.previewDate, { color: theme.textSecondary }]}>
                      {task.start_date}
                      {task.end_date ? ` → ${task.end_date}` : ""}
                    </Text>
                  )}
                </View>
                <Pressable onPress={() => removeTask(i)} hitSlop={8}>
                  <Text style={[styles.removeBtn, { color: theme.danger }]}>✕</Text>
                </Pressable>
              </View>
            </AnimatedPreviewCard>
          ))}

          {parsedNote && (
            <AnimatedPreviewCard
              index={0}
              style={[
                styles.previewCard,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.borderSubtle,
                },
              ]}
            >
              <View style={styles.previewRow}>
                <TaskIcon icon={parsedNote.note.icon} color={parsedNote.note.icon_color} size={36} />
                <View style={styles.previewInfo}>
                  <Text
                    numberOfLines={2}
                    style={[styles.previewTitle, { color: theme.text }]}
                  >
                    {parsedNote.note.title}
                  </Text>
                  <Text
                    numberOfLines={3}
                    style={[styles.previewDate, { color: theme.textSecondary }]}
                  >
                    {parsedNote.note.notes}
                  </Text>
                </View>
              </View>
              {parsedNote.tasks?.length > 0 && (
                <View style={styles.extractedTasks}>
                  <Text style={[styles.extractedLabel, { color: theme.textSecondary }]}>
                    提取的任务：
                  </Text>
                  {parsedNote.tasks.map((t, i) => (
                    <Text key={i} style={[styles.extractedItem, { color: theme.text }]}>
                      {resolveEmoji(t.icon)} {t.title}
                    </Text>
                  ))}
                </View>
              )}
            </AnimatedPreviewCard>
          )}

          <View style={styles.previewActions}>
            <Pressable
              onPress={onReparse}
              style={[styles.reparseBtn, { borderColor: theme.border }]}
            >
              <Text style={[styles.reparseBtnText, { color: theme.text }]}>
                重新解析
              </Text>
            </Pressable>
            <AnimatedPressable
              onPress={handleConfirm}
              disabled={creating}
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: theme.accent,
                  opacity: creating ? 0.6 : 1,
                },
                confirmBtnStyle,
              ]}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>确认创建</Text>
              )}
            </AnimatedPressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: "600",
  },
  previewSection: {
    flex: 1,
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  previewInfo: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  previewDate: {
    fontSize: 13,
  },
  removeBtn: {
    fontSize: 16,
    fontWeight: "600",
    padding: 4,
  },
  extractedTasks: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  extractedLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  extractedItem: {
    fontSize: 14,
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 40,
    marginTop: 4,
  },
  reparseBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reparseBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
