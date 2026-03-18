import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeOut,
  ZoomOut,
  interpolateColor,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { resolveEmoji } from "@aura/shared/icons";
import { TaskIcon } from "./TaskIcon";
import { useTheme } from "../lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Mode = "task" | "note";

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

interface CreateTaskSheetProps {
  onClose: () => void;
  onCreateBatch: (text: string, parsed: object[]) => Promise<void>;
  onCreateNote: (text: string, noteData: object, tasks: object[]) => Promise<void>;
  parseInput: (text: string, mode?: "task" | "note") => Promise<unknown>;
}

// --- Animated preview card wrapper ---
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

export function CreateTaskSheet({
  onClose,
  onCreateBatch,
  onCreateNote,
  parseInput,
}: CreateTaskSheetProps) {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>("task");
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[] | null>(null);
  const [parsedNote, setParsedNote] = useState<ParsedNote | null>(null);

  // --- Input focus border animation ---
  const inputFocus = useSharedValue(0);
  const inputBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      inputFocus.value,
      [0, 1],
      [theme.borderSubtle, theme.accent],
    ),
  }));
  const handleInputFocus = useCallback(() => {
    inputFocus.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
  }, []);
  const handleInputBlur = useCallback(() => {
    inputFocus.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
  }, []);

  // --- Parse button spring + pulse ---
  const parseScale = useSharedValue(1);
  const parseOpacity = useSharedValue(1);

  useEffect(() => {
    if (parsing) {
      parseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      parseOpacity.value = withTiming(1, { duration: 150 });
    }
  }, [parsing]);

  const parseBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: parseScale.value }],
    opacity: parseOpacity.value,
  }));

  // --- Confirm button spring + success pulse ---
  const confirmScale = useSharedValue(1);
  const confirmBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmScale.value }],
  }));

  // --- Mode toggle sliding indicator ---
  const toggleX = useSharedValue(0);
  const [toggleWidth, setToggleWidth] = useState(0);

  useEffect(() => {
    if (toggleWidth <= 0) return;
    const half = (toggleWidth - 6) / 2; // account for padding (3 on each side)
    toggleX.value = withSpring(mode === "task" ? 0 : half, {
      damping: 22,
      stiffness: 350,
    });
  }, [mode, toggleWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleX.value }],
  }));

  const onToggleLayout = (e: LayoutChangeEvent) => {
    setToggleWidth(e.nativeEvent.layout.width);
  };

  const handleParse = async () => {
    const trimmed = text.trim();
    if (!trimmed || parsing) return;

    // Spring press feedback
    parseScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    setTimeout(() => {
      parseScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }, 100);

    setParsing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await parseInput(trimmed, mode);
      if (mode === "task") {
        const items = Array.isArray(result) ? result : [result];
        setParsedTasks(items as ParsedTask[]);
        setParsedNote(null);
      } else {
        setParsedNote(result as ParsedNote);
        setParsedTasks(null);
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (creating) return;

    // Spring press feedback
    confirmScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    setTimeout(() => {
      confirmScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }, 100);

    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (mode === "task" && parsedTasks) {
        await onCreateBatch(text.trim(), parsedTasks);
      } else if (mode === "note" && parsedNote) {
        await onCreateNote(text.trim(), parsedNote.note, parsedNote.tasks || []);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Success pulse before closing
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

  const handleReparse = () => {
    setParsedTasks(null);
    setParsedNote(null);
  };

  const removeTask = (index: number) => {
    if (!parsedTasks) return;
    const next = parsedTasks.filter((_, i) => i !== index);
    if (next.length === 0) {
      handleReparse();
    } else {
      setParsedTasks(next);
    }
  };

  const hasParsed = parsedTasks || parsedNote;

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.flex, { backgroundColor: theme.surface }]}
      >
        <View style={styles.container}>
          {/* Header with close button */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {mode === "task" ? "新建任务" : "新建笔记"}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={[styles.closeIcon, { color: theme.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          {/* Mode toggle with sliding indicator */}
          <View
            style={[styles.modeToggle, { backgroundColor: theme.background }]}
            onLayout={onToggleLayout}
          >
            <Animated.View
              style={[
                styles.modeIndicator,
                {
                  backgroundColor: theme.surface,
                  width: toggleWidth > 0 ? (toggleWidth - 6) / 2 : "50%",
                },
                indicatorStyle,
              ]}
            />
            <Pressable
              onPress={() => { setMode("task"); handleReparse(); }}
              style={styles.modeBtn}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === "task" ? theme.text : theme.textSecondary },
                ]}
              >
                任务
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setMode("note"); handleReparse(); }}
              style={styles.modeBtn}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === "note" ? theme.text : theme.textSecondary },
                ]}
              >
                笔记
              </Text>
            </Pressable>
          </View>

          {/* Text input */}
          {!hasParsed && (
            <View style={styles.inputSection}>
              <Animated.View style={[styles.textInputWrapper, inputBorderStyle]}>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.background,
                    },
                  ]}
                  value={text}
                  onChangeText={setText}
                  placeholder={
                    mode === "task"
                      ? "描述你的任务，如：明天下午3点开会"
                      : "随手记录..."
                  }
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  maxLength={1000}
                  autoFocus
                  textAlignVertical="top"
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </Animated.View>
              <AnimatedPressable
                onPress={handleParse}
                disabled={!text.trim() || parsing}
                style={[
                  styles.parseBtn,
                  {
                    backgroundColor: text.trim() ? theme.accent : theme.textTertiary,
                  },
                  parseBtnStyle,
                ]}
              >
                {parsing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.parseBtnText}>AI 解析</Text>
                )}
              </AnimatedPressable>
            </View>
          )}

          {/* Preview cards */}
          {hasParsed && (
            <ScrollView style={styles.previewSection} showsVerticalScrollIndicator={false}>
              {parsedTasks?.map((task, i) => (
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

              {/* Actions */}
              <View style={styles.previewActions}>
                <Pressable
                  onPress={handleReparse}
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
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
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
  modeToggle: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    position: "relative",
  },
  modeIndicator: {
    position: "absolute",
    top: 3,
    left: 3,
    bottom: 3,
    borderRadius: 8,
    // Shadow for subtle elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    zIndex: 1,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputSection: {
    flex: 1,
    gap: 12,
  },
  textInputWrapper: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: 14,
    minHeight: 120,
  },
  parseBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  parseBtnText: {
    color: "#fff",
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
    paddingBottom: 20,
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
