import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  FadeInDown,
} from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Task } from "@aura/shared/types";
import { fetchTasks, updateTask, deleteTask } from "../../lib/api";
import { TaskIcon } from "../../components/TaskIcon";
import { IconPicker } from "../../components/IconPicker";
import { ColorPicker } from "../../components/ColorPicker";
import { DatePickerSheet } from "../../components/DatePickerSheet";
import { useTheme } from "../../lib/theme";
import { formatDateRange } from "@aura/shared/utils";
import dayjs from "dayjs";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const STATUS_OPTIONS = [
  { key: "pending" as const, label: "待开始", icon: "○" },
  { key: "in_progress" as const, label: "进行中", icon: "◐" },
  { key: "completed" as const, label: "已完成", icon: "✓" },
];

const SPRING_CONFIG = { stiffness: 400, damping: 28 };

export default function TaskDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [iconColor, setIconColor] = useState("");
  const [status, setStatus] = useState<Task["status"]>("pending");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  // Animated scales for each status chip
  const chipScales = [useSharedValue(1), useSharedValue(1), useSharedValue(1)];
  const saveScale = useSharedValue(1);

  useEffect(() => {
    const month = dayjs().format("YYYY-MM");
    fetchTasks(month).then((tasks) => {
      const found = tasks.find((t) => t.id === id);
      if (found) {
        setTask(found);
        setTitle(found.title);
        setIcon(found.icon);
        setIconColor(found.icon_color);
        setStatus(found.status);
        setStartDate(found.start_date);
        setEndDate(found.end_date || "");
        setNotes(found.notes || "");
      }
    });
  }, [id]);

  const handleStatusPress = useCallback(
    (key: Task["status"], index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStatus(key);
      // Spring bounce on selected chip
      chipScales[index].value = withSequence(
        withSpring(0.92, { stiffness: 500, damping: 20 }),
        withSpring(1.05, { stiffness: 350, damping: 18 }),
        withSpring(1.0, { stiffness: 300, damping: 22 }),
      );
    },
    [chipScales],
  );

  const handleSave = async () => {
    if (!task || saving) return;
    setSaving(true);
    try {
      await updateTask(task.id, {
        title,
        icon,
        icon_color: iconColor,
        status,
        start_date: startDate,
        end_date: endDate || null,
        notes: notes || "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Success pulse: 1.0 -> 1.03 -> 1.0
      saveScale.value = withSequence(
        withSpring(1.03, { stiffness: 400, damping: 20 }),
        withSpring(1.0, { stiffness: 300, damping: 25 }),
      );
      // Slight delay so user sees the pulse before navigating back
      setTimeout(() => router.back(), 200);
    } catch {
      Alert.alert("保存失败", "请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!task) return;
    Alert.alert("删除任务", `确定删除「${task.title}」？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          await deleteTask(task.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
  };

  const chipAnimatedStyle0 = useAnimatedStyle(() => ({
    transform: [{ scale: chipScales[0].value }],
  }));
  const chipAnimatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: chipScales[1].value }],
  }));
  const chipAnimatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: chipScales[2].value }],
  }));
  const chipStyles = [chipAnimatedStyle0, chipAnimatedStyle1, chipAnimatedStyle2];

  const saveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  if (!task) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon preview */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(300).springify().damping(28).stiffness(350)}
          style={styles.iconRow}
        >
          <TaskIcon icon={icon} color={iconColor} size={56} />
        </Animated.View>

        {/* Title */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(300).springify().damping(28).stiffness(350)}
          style={styles.field}
        >
          <Text style={[styles.label, { color: theme.textSecondary }]}>标题</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: titleFocused ? theme.accent : theme.border,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="任务标题"
            placeholderTextColor={theme.textTertiary}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
          />
        </Animated.View>

        {/* Status */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(300).springify().damping(28).stiffness(350)}
          style={styles.field}
        >
          <Text style={[styles.label, { color: theme.textSecondary }]}>状态</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((opt, index) => {
              const active = status === opt.key;
              const color =
                opt.key === "completed"
                  ? theme.success
                  : opt.key === "in_progress"
                    ? theme.warning
                    : theme.textSecondary;
              return (
                <AnimatedPressable
                  key={opt.key}
                  onPress={() => handleStatusPress(opt.key, index)}
                  onPressIn={() => {
                    chipScales[index].value = withSpring(0.92, SPRING_CONFIG);
                  }}
                  onPressOut={() => {
                    chipScales[index].value = withSpring(1, SPRING_CONFIG);
                  }}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: active ? color + "18" : theme.background,
                      borderColor: active ? color : theme.borderSubtle,
                    },
                    chipStyles[index],
                  ]}
                >
                  <Text style={[styles.statusIcon, { color }]}>{opt.icon}</Text>
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: active ? color : theme.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Dates */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(300).springify().damping(28).stiffness(350)}
          style={styles.field}
        >
          <Text style={[styles.label, { color: theme.textSecondary }]}>日期</Text>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => setShowStartPicker(true)}
              style={[styles.dateBtn, { borderColor: theme.border }]}
            >
              <Text style={[styles.dateBtnText, { color: startDate ? theme.text : theme.textTertiary }]}>
                {startDate ? dayjs(startDate).format("M月D日") : "开始日期"}
              </Text>
            </Pressable>
            <Text style={{ color: theme.textSecondary }}>→</Text>
            <Pressable
              onPress={() => setShowEndPicker(true)}
              style={[styles.dateBtn, { borderColor: theme.border }]}
            >
              <Text style={[styles.dateBtnText, { color: endDate ? theme.text : theme.textTertiary }]}>
                {endDate ? dayjs(endDate).format("M月D日") : "结束日期"}
              </Text>
            </Pressable>
            {endDate ? (
              <Pressable onPress={() => setEndDate("")} hitSlop={8}>
                <Text style={{ color: theme.danger, fontSize: 14 }}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        {/* Icon picker */}
        <IconPicker selected={icon} onSelect={setIcon} />

        {/* Color picker */}
        <ColorPicker selected={iconColor} onSelect={setIconColor} />

        {/* Notes */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(300).springify().damping(28).stiffness(350)}
          style={styles.field}
        >
          <Text style={[styles.label, { color: theme.textSecondary }]}>备注</Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                color: theme.text,
                borderColor: notesFocused ? theme.accent : theme.border,
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="添加备注..."
            placeholderTextColor={theme.textTertiary}
            multiline
            textAlignVertical="top"
            onFocus={() => setNotesFocused(true)}
            onBlur={() => setNotesFocused(false)}
          />
        </Animated.View>

        {/* Save */}
        <AnimatedPressable
          onPress={handleSave}
          disabled={saving}
          onPressIn={() => {
            saveScale.value = withSpring(0.96, SPRING_CONFIG);
          }}
          onPressOut={() => {
            saveScale.value = withSpring(1, SPRING_CONFIG);
          }}
          style={[
            styles.saveBtn,
            {
              backgroundColor: theme.accent,
              opacity: saving ? 0.6 : 1,
            },
            saveAnimatedStyle,
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>保存</Text>
          )}
        </AnimatedPressable>

        {/* Delete */}
        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={[styles.deleteBtnText, { color: theme.danger }]}>删除任务</Text>
        </Pressable>
      </ScrollView>

      {showStartPicker && (
        <DatePickerSheet
          value={startDate ? new Date(startDate) : new Date()}
          onChange={(date) => {
            setStartDate(dayjs(date).format("YYYY-MM-DD"));
            setShowStartPicker(false);
          }}
          onClose={() => setShowStartPicker(false)}
          title="开始日期"
        />
      )}

      {showEndPicker && (
        <DatePickerSheet
          value={endDate ? new Date(endDate) : new Date()}
          onChange={(date) => {
            setEndDate(dayjs(date).format("YYYY-MM-DD"));
            setShowEndPicker(false);
          }}
          onClose={() => setShowEndPicker(false)}
          title="结束日期"
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  iconRow: {
    alignItems: "center",
    paddingVertical: 12,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusIcon: {
    fontSize: 14,
    fontWeight: "700",
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateBtn: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
  },
  dateBtnText: {
    fontSize: 15,
    fontWeight: "500",
  },
  notesInput: {
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 100,
    lineHeight: 22,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  deleteBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
