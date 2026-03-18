import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Task } from "@aura/shared/types";
import { fetchTasks, deleteTask } from "../../lib/api";
import { useTheme } from "../../lib/theme";
import dayjs from "dayjs";

export default function NoteDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Task | null>(null);

  useEffect(() => {
    const month = dayjs().format("YYYY-MM");
    fetchTasks(month).then((tasks) => {
      const found = tasks.find((t) => t.id === id);
      if (found) setNote(found);
    });
  }, [id]);

  const handleDelete = () => {
    if (!note) return;
    Alert.alert("删除笔记", `确定删除「${note.title}」？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          await deleteTask(note.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
  };

  if (!note) {
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
      <View style={styles.header}>
        <Text style={styles.emoji}>{note.icon}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{note.title}</Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {dayjs(note.created_at).format("YYYY年M月D日 HH:mm")}
        </Text>
      </View>

      <View style={[styles.noteBody, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
        <Text style={[styles.noteText, { color: theme.text }]}>
          {note.notes}
        </Text>
      </View>

      <Pressable onPress={handleDelete} style={styles.deleteBtn}>
        <Text style={[styles.deleteBtnText, { color: theme.danger }]}>删除笔记</Text>
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
  header: {
    alignItems: "center",
    gap: 6,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  date: {
    fontSize: 14,
  },
  noteBody: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 24,
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
