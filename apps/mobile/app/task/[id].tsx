import React, { useState, useEffect } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Task } from "@aura/shared/types";
import { fetchTasks, updateTask, deleteTask } from "../../lib/api";
import { TaskIcon } from "../../components/TaskIcon";
import { useTheme } from "../../lib/theme";
import dayjs from "dayjs";

export default function TaskDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch the task — load current month's tasks and find this one
    const month = dayjs().format("YYYY-MM");
    fetchTasks(month).then((tasks) => {
      const found = tasks.find((t) => t.id === id);
      if (found) {
        setTask(found);
        setTitle(found.title);
        setStartDate(found.start_date);
        setEndDate(found.end_date || "");
      }
    });
  }, [id]);

  const handleSave = async () => {
    if (!task || saving) return;
    setSaving(true);
    try {
      await updateTask(task.id, {
        title,
        start_date: startDate,
        end_date: endDate || null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
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

  if (!task) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.iconRow}>
        <TaskIcon icon={task.icon} color={task.icon_color} size={48} />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>标题</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          value={title}
          onChangeText={setTitle}
          placeholder="任务标题"
          placeholderTextColor={theme.textTertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>开始日期</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.textTertiary}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>结束日期</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD（可选）"
          placeholderTextColor={theme.textTertiary}
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [
          styles.saveBtn,
          {
            backgroundColor: theme.accent,
            opacity: pressed ? 0.85 : saving ? 0.6 : 1,
          },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>保存</Text>
        )}
      </Pressable>

      <Pressable onPress={handleDelete} style={styles.deleteBtn}>
        <Text style={[styles.deleteBtnText, { color: theme.danger }]}>删除任务</Text>
      </Pressable>
    </ScrollView>
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
  },
  iconRow: {
    alignItems: "center",
    paddingVertical: 8,
  },
  field: {
    gap: 6,
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
